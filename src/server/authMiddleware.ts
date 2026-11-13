/**
 * RESQ AI - Server-Side Authentication & Authorization Middleware
 * Independently verifies signed JWT or Firebase ID Tokens and enforces RBAC against PostgreSQL.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import { UserRole } from '../types/index.ts';
import {
  Permission,
  ROLE_PERMISSIONS,
  hasPermission,
  isValidRole,
} from './rbac.ts';

const RUNTIME_JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
}

export interface AuthRequest extends Request {
  authUser?: AuthenticatedUser;
}

export function signSessionJwt(payload: { uid: string; email: string }): string {
  return jwt.sign(payload, RUNTIME_JWT_SECRET, { expiresIn: '12h' });
}

export async function verifyBearerToken(
  token: string
): Promise<AuthenticatedUser | null> {
  let uid: string | null = null;
  let emailFromToken: string | null = null;
  let displayNameFromToken: string | null = null;
  let photoFromToken: string | null = null;

  // 1. Try local signed JWT first
  try {
    const decoded = jwt.verify(token, RUNTIME_JWT_SECRET) as {
      uid?: string;
      email?: string;
    };
    if (decoded?.uid) {
      uid = decoded.uid;
      emailFromToken = decoded.email || null;
    }
  } catch {
    // Fall through to Firebase ID Token verification
  }

  // 2. Try Firebase ID Token verification
  if (!uid) {
    try {
      const firebaseDecoded = await adminAuth.verifyIdToken(token);
      uid = firebaseDecoded.uid;
      emailFromToken = firebaseDecoded.email || null;
      displayNameFromToken = firebaseDecoded.name || null;
      photoFromToken = firebaseDecoded.picture || null;
    } catch {
      return null;
    }
  }

  if (!uid) return null;

  // 3. Look up authoritative user record in PostgreSQL (never trust client role claims)
  let dbUser;
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    dbUser = rows[0];
  } catch (err) {
    console.error('Database error loading authenticated user:', err);
    throw new Error('Failed to validate user session', { cause: err });
  }

  // Auto-provision Google SSO user as VIEWER (least privilege) on first backend request
  if (!dbUser && emailFromToken) {
    try {
      const existingByEmail = await db
        .select()
        .from(users)
        .where(eq(users.email, emailFromToken))
        .limit(1);

      if (existingByEmail[0]) {
        const updated = await db
          .update(users)
          .set({
            uid,
            displayName: displayNameFromToken || existingByEmail[0].displayName,
            photoUrl: photoFromToken || existingByEmail[0].photoUrl,
            lastLoginAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingByEmail[0].id))
          .returning();
        dbUser = updated[0];
      } else {
        const defaultRole: UserRole = 'VIEWER';
        const inserted = await db
          .insert(users)
          .values({
            uid,
            email: emailFromToken,
            displayName:
              displayNameFromToken || emailFromToken.split('@')[0] || 'Operator',
            photoUrl: photoFromToken,
            role: defaultRole,
            permissions: ROLE_PERMISSIONS[defaultRole],
            isActive: true,
            isDemoAccount: false,
            lastLoginAt: new Date(),
          })
          .onConflictDoUpdate({
            target: users.uid,
            set: { lastLoginAt: new Date() },
          })
          .returning();
        dbUser = inserted[0];
      }
    } catch (err) {
      console.error('Database error provisioning SSO user:', err);
      throw new Error('Failed to provision user session', { cause: err });
    }
  }

  if (!dbUser || !dbUser.isActive) {
    return null;
  }

  const normalizedRole: UserRole = isValidRole(dbUser.role)
    ? dbUser.role
    : 'VIEWER';

  return {
    id: dbUser.id,
    uid: dbUser.uid,
    email: dbUser.email,
    displayName: dbUser.displayName,
    photoUrl: dbUser.photoUrl,
    role: normalizedRole,
    permissions:
      Array.isArray(dbUser.permissions) && dbUser.permissions.length > 0
        ? dbUser.permissions
        : ROLE_PERMISSIONS[normalizedRole],
    isActive: dbUser.isActive,
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing session token' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  try {
    const authUser = await verifyBearerToken(token);
    if (!authUser) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Invalid, expired, or deactivated session' });
    }
    req.authUser = authUser;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: 'Authentication verification failed' });
  }
};

export const requirePermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!hasPermission(req.authUser.role, req.authUser.permissions, permission)) {
      return res.status(403).json({
        error: `Forbidden: Role ${req.authUser.role} lacks required permission (${permission})`,
      });
    }
    next();
  };
};

export const requireRoles = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.authUser.role)) {
      return res.status(403).json({
        error: `Forbidden: Requires one of roles [${allowedRoles.join(', ')}]`,
      });
    }
    next();
  };
};
