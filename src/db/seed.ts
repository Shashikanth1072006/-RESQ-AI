/**
 * RESQ AI - Idempotent PostgreSQL Seed Script
 * Populates RBAC roles, safe demo test credentials, baseline transactions,
 * alerts, investigations, notifications, audit logs, and default fraud rules.
 */

import bcrypt from 'bcryptjs';
import { sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  roles,
  users,
  transactions,
  fraudAlerts,
  fraudInvestigations,
  fraudNotifications,
  auditLogs,
  fraudRules,
} from './schema.ts';
import {
  ROLE_HIERARCHY,
  ROLE_META,
  ROLE_PERMISSIONS,
} from '../server/rbac.ts';
import { DEFAULT_SENSITIVITY } from '../engine/fraudEngine.ts';
import {
  SEED_TRANSACTIONS,
  SEED_CASES,
  SEED_AUDIT_LOGS,
} from '../data/seedData.ts';
import { mapDomainTxToInsert } from '../server/dbMappers.ts';
import { UserRole } from '../types/index.ts';

export const DEMO_ACCOUNTS: Array<{
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}> = [
  {
    uid: 'demo-viewer-01',
    email: 'viewer.demo@resqai.sec',
    password: 'ResqViewer#2026',
    displayName: 'Riley Parker (Demo Viewer)',
    role: 'VIEWER',
  },
  {
    uid: 'demo-compliance-01',
    email: 'compliance.demo@resqai.sec',
    password: 'ResqComply#2026',
    displayName: 'Marcus Vance (Compliance Officer)',
    role: 'COMPLIANCE_OFFICER',
  },
  {
    uid: 'demo-analyst-01',
    email: 'analyst.demo@resqai.sec',
    password: 'ResqAnalyst#2026',
    displayName: 'Sophia Chen (Senior Risk Analyst)',
    role: 'SENIOR_RISK_ANALYST',
  },
  {
    uid: 'demo-architect-01',
    email: 'architect.demo@resqai.sec',
    password: 'ResqArch#2026',
    displayName: 'Alex Morgan (Lead Fraud Architect)',
    role: 'LEAD_FRAUD_ARCHITECT',
  },
];

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runIdempotentSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

export async function runIdempotentSeed(): Promise<void> {
  try {
    // 1. Ensure 4 RBAC roles exist
    const roleNames: UserRole[] = [
      'VIEWER',
      'COMPLIANCE_OFFICER',
      'SENIOR_RISK_ANALYST',
      'LEAD_FRAUD_ARCHITECT',
    ];

    for (const rName of roleNames) {
      await db
        .insert(roles)
        .values({
          name: rName,
          description: ROLE_META[rName].description,
          hierarchyLevel: ROLE_HIERARCHY[rName],
          permissions: ROLE_PERMISSIONS[rName],
        })
        .onConflictDoNothing({ target: roles.name });
    }

    // 2. Ensure 4 safe demo accounts exist
    for (const acc of DEMO_ACCOUNTS) {
      const passwordHash = await bcrypt.hash(acc.password, 10);
      await db
        .insert(users)
        .values({
          uid: acc.uid,
          email: acc.email,
          passwordHash,
          displayName: acc.displayName,
          role: acc.role,
          permissions: ROLE_PERMISSIONS[acc.role],
          isActive: true,
          isDemoAccount: true,
          lastLoginAt: new Date(),
        })
        .onConflictDoNothing({ target: users.email });
    }

    // 3. Ensure default fraud detection rule configuration exists
    await db
      .insert(fraudRules)
      .values({
        id: 'RULE_GLOBAL_DEFAULT',
        name: 'RESQ AI Deterministic Multi-Signal Policy',
        description:
          'Configurable 10-signal weighted risk scoring weights, threshold cutoffs, and automated containment policies.',
        config: {
          ...DEFAULT_SENSITIVITY,
          mediumAction: 'VERIFY_OTP',
          autoBlockCritical: true,
          emailProviderConfigured: Boolean(process.env.SMTP_HOST),
          smsProviderConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID),
          paymentSandboxMode: process.env.STRIPE_SECRET_KEY ? 'STRIPE_TEST' : 'SIMULATED',
        },
        updatedBy: 'RESQ AI System Bootstrap',
      })
      .onConflictDoNothing({ target: fraudRules.id });

    // 4. Seed transactions if table is empty
    const txCountRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions);
    const txCount = txCountRes[0]?.count ?? 0;

    if (txCount === 0) {
      const insertRows = SEED_TRANSACTIONS.map((tx) => mapDomainTxToInsert(tx, 'system-seed'));
      // Insert in chunks to keep statement clean
      for (let i = 0; i < insertRows.length; i += 25) {
        await db
          .insert(transactions)
          .values(insertRows.slice(i, i + 25))
          .onConflictDoNothing({ target: transactions.id });
      }

      // Seed alerts for high/critical transactions
      const alertRows = SEED_TRANSACTIONS.filter(
        (t) =>
          t.riskEvaluation.riskLevel === 'CRITICAL' ||
          t.riskEvaluation.riskLevel === 'HIGH'
      )
        .slice(0, 12)
        .map((t, idx) => ({
          id: `ALT-SEED-${100 + idx}`,
          transactionId: t.id,
          severity: t.riskEvaluation.riskLevel,
          title: `${t.attackType || 'Behavioral Risk Anomaly'} (${t.riskEvaluation.riskScore}/100)`,
          message: `Transaction ${t.id} for ₹${t.amount.toLocaleString()} in ${t.location.city} triggered ${t.riskEvaluation.decision}.`,
          riskScore: t.riskEvaluation.riskScore,
          status: idx < 4 ? 'ACTIVE' : 'ACKNOWLEDGED',
          assignedRole:
            t.riskEvaluation.riskLevel === 'CRITICAL'
              ? 'LEAD_FRAUD_ARCHITECT'
              : 'SENIOR_RISK_ANALYST',
          createdAt: new Date(t.timestamp),
        }));

      if (alertRows.length > 0) {
        await db
          .insert(fraudAlerts)
          .values(alertRows)
          .onConflictDoNothing({ target: fraudAlerts.id });
      }

      // Seed investigation cases
      for (const c of SEED_CASES) {
        await db
          .insert(fraudInvestigations)
          .values({
            id: c.id,
            title: c.title,
            transactionId: c.transactionId,
            customerId: c.customerId,
            customerName: c.customerName,
            assignedAnalyst: c.assignedAnalyst,
            priority: c.priority,
            status: c.status,
            notes: c.notes,
            tags: c.tags,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          })
          .onConflictDoNothing({ target: fraudInvestigations.id });
      }

      // Seed initial Fraud Warning Center history
      await db
        .insert(fraudNotifications)
        .values([
          {
            id: 'NTF-SEED-101',
            transactionId: 'TXN-2024-20003',
            recipientLabel: 'Aarav Sharma (aarav.sharma@techcorp.in)',
            channel: 'SECURITY_ALERT',
            subject: 'RESQ AI SECURITY ALERT — TXN-2024-20003',
            message:
              'RESQ AI SECURITY ALERT\n\nWe detected an unusual transaction associated with your account.\n\nTransaction ID: TXN-2024-20003\nAmount: ₹94,000\nRisk Level: CRITICAL\n\nIf you did not authorize this transaction, contact your bank immediately.\n\nStay safe with RESQ AI.',
            deliveryStatus: 'DELIVERED',
            sentByUserId: 'demo-analyst-01',
            sentByName: 'Sophia Chen (Senior Risk Analyst)',
            sentByRole: 'SENIOR_RISK_ANALYST',
            createdAt: new Date(Date.now() - 25 * 60 * 1000),
          },
        ])
        .onConflictDoNothing({ target: fraudNotifications.id });

      // Seed audit logs
      for (const log of SEED_AUDIT_LOGS) {
        await db
          .insert(auditLogs)
          .values({
            id: log.id,
            timestamp: new Date(log.timestamp),
            userId: 'system-seed',
            operator: log.operator,
            role: log.role,
            action: log.action,
            targetId: log.targetId,
            targetType: log.targetType,
            details: log.details,
            ip: log.ip,
          })
          .onConflictDoNothing({ target: auditLogs.id });
      }
    }
  } catch (err) {
    console.error('Database seed failed:', err);
    throw new Error('Failed to initialize RESQ AI database seed', { cause: err });
  }
}
