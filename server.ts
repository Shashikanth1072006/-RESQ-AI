/**
 * RESQ AI - Production & Development Full-Stack Server
 * Express REST APIs + Socket.IO Real-Time Telemetry + PostgreSQL (Drizzle) + Vite Dev Middleware
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Server as SocketIOServer } from 'socket.io';
import { desc, eq } from 'drizzle-orm';

import { db } from './src/db/index.ts';
import {
  users,
  transactions,
  fraudAlerts,
  fraudInvestigations,
  fraudNotifications,
  auditLogs,
  fraudRules,
} from './src/db/schema.ts';
import { ensureSeeded, DEMO_ACCOUNTS } from './src/db/seed.ts';
import {
  requireAuth,
  requirePermission,
  signSessionJwt,
  verifyBearerToken,
  AuthRequest,
} from './src/server/authMiddleware.ts';
import {
  ROLE_META,
  ROLE_PERMISSIONS,
  hasPermission,
  isValidRole,
  redactTransactionForRole,
} from './src/server/rbac.ts';
import {
  mapTxRowToDomain,
  mapDomainTxToInsert,
  mapCaseRowToDomain,
  mapAlertRowToDomain,
  mapNotifRowToDomain,
  mapAuditRowToDomain,
  mapUserRowToManaged,
} from './src/server/dbMappers.ts';
import {
  evaluateTransactionRisk,
  DEFAULT_SENSITIVITY,
} from './src/engine/fraudEngine.ts';
import {
  SEED_CUSTOMERS,
  SEED_MERCHANTS,
  SEED_DEVICES,
} from './src/data/seedData.ts';
import {
  generateForensicInvestigation,
  generateAssistantResponse,
} from './src/server/geminiHandler.ts';
import {
  SensitivityConfig,
  Transaction,
  TransactionStatus,
  UserRole,
  CaseStatus,
  NotificationChannel,
  PaymentMethod,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT'],
  },
});

const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Socket.IO connection authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Unauthorized socket connection'));
  }
  try {
    const authUser = await verifyBearerToken(token);
    if (!authUser) {
      return next(new Error('Invalid session token'));
    }
    socket.data.authUser = authUser;
    next();
  } catch {
    next(new Error('Socket authentication error'));
  }
});

io.on('connection', (socket) => {
  const authUser = socket.data.authUser;
  if (authUser) {
    socket.join(`role:${authUser.role}`);
    socket.join(`user:${authUser.uid}`);
  }
});

async function recordAudit(params: {
  userId: string;
  operator: string;
  role: string;
  action: string;
  targetId: string;
  targetType: 'TRANSACTION' | 'CASE' | 'CONFIG' | 'RULE' | 'AUTH' | 'NOTIFICATION' | 'USER';
  details: string;
  ip?: string;
}) {
  const logEntry = {
    id: `LOG-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    timestamp: new Date(),
    userId: params.userId,
    operator: params.operator,
    role: params.role,
    action: params.action,
    targetId: params.targetId,
    targetType: params.targetType,
    details: params.details,
    ip: params.ip || '127.0.0.1',
  };

  try {
    const [inserted] = await db.insert(auditLogs).values(logEntry).returning();
    if (inserted) {
      const domainLog = mapAuditRowToDomain(inserted);
      io.to('role:COMPLIANCE_OFFICER')
        .to('role:SENIOR_RISK_ANALYST')
        .to('role:LEAD_FRAUD_ARCHITECT')
        .emit('audit:created', domainLog);
      return domainLog;
    }
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
  return null;
}

async function getActiveRulesConfig(): Promise<SensitivityConfig> {
  try {
    const rows = await db
      .select()
      .from(fraudRules)
      .where(eq(fraudRules.id, 'RULE_GLOBAL_DEFAULT'))
      .limit(1);
    if (rows[0]?.config) {
      return {
        ...DEFAULT_SENSITIVITY,
        ...(rows[0].config as Partial<SensitivityConfig>),
      };
    }
  } catch (err) {
    console.error('Failed to load rules config:', err);
  }
  return DEFAULT_SENSITIVITY;
}

// ==========================================
// HEALTH & PUBLIC DEMO DISCOVERY
// ==========================================

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RESQ AI Fraud Intelligence Engine',
    tagline: 'Detect. Predict. Prevent. Protect.',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/auth/demo-accounts', async (_req, res) => {
  try {
    await ensureSeeded();
    res.json({
      accounts: DEMO_ACCOUNTS.map((acc) => ({
        email: acc.email,
        password: acc.password,
        displayName: acc.displayName,
        role: acc.role,
        title: ROLE_META[acc.role].title,
        badge: ROLE_META[acc.role].badge,
        description: ROLE_META[acc.role].description,
      })),
    });
  } catch (err) {
    console.error('Error loading demo accounts:', err);
    res.status(500).json({ error: 'Unable to initialize demo environment' });
  }
});

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

app.post('/api/auth/login', async (req, res) => {
  try {
    await ensureSeeded();
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    const dbUser = rows[0];

    if (!dbUser || !dbUser.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({ error: 'Account has been deactivated by Lead Fraud Architect.' });
    }

    const validPassword = await bcrypt.compare(password, dbUser.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const [updated] = await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, dbUser.id))
      .returning();

    const token = signSessionJwt({ uid: updated.uid, email: updated.email });

    await recordAudit({
      userId: updated.uid,
      operator: updated.displayName,
      role: updated.role,
      action: 'AUTH_LOGIN',
      targetId: updated.uid,
      targetType: 'AUTH',
      details: `Operator signed in with credential authentication (${updated.role}).`,
      ip: req.ip || '127.0.0.1',
    });

    return res.json({
      token,
      user: mapUserRowToManaged(updated),
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication service unavailable.' });
  }
});

app.post('/api/auth/firebase', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const authUser = req.authUser!;
    await db
      .update(users)
      .set({ lastLoginAt: new Date(), updatedAt: new Date() })
      .where(eq(users.uid, authUser.uid));

    await recordAudit({
      userId: authUser.uid,
      operator: authUser.displayName,
      role: authUser.role,
      action: 'AUTH_SSO_LOGIN',
      targetId: authUser.uid,
      targetType: 'AUTH',
      details: `Operator authenticated via Google Single Sign-On (${authUser.role}).`,
      ip: req.ip || '127.0.0.1',
    });

    res.json({ user: authUser });
  } catch (err) {
    console.error('Firebase session sync error:', err);
    res.status(500).json({ error: 'Failed to synchronize SSO session' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.authUser });
});

app.patch('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const authUser = req.authUser!;
    const { displayName } = req.body || {};

    if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 100) {
      return res.status(400).json({ error: 'Display name must be between 2 and 100 characters.' });
    }

    const [updated] = await db
      .update(users)
      .set({ displayName: displayName.trim(), updatedAt: new Date() })
      .where(eq(users.uid, authUser.uid))
      .returning();

    await recordAudit({
      userId: authUser.uid,
      operator: updated.displayName,
      role: authUser.role,
      action: 'PROFILE_UPDATED',
      targetId: authUser.uid,
      targetType: 'AUTH',
      details: `Updated operator profile display name to '${updated.displayName}'.`,
      ip: req.ip || '127.0.0.1',
    });

    res.json({ user: mapUserRowToManaged(updated) });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ==========================================
// BOOTSTRAP & ROLE-SCOPED DATA FETCH
// ==========================================

app.get('/api/bootstrap', requireAuth, async (req: AuthRequest, res) => {
  try {
    await ensureSeeded();
    const authUser = req.authUser!;
    const role = authUser.role;

    const txRows = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(250);

    const mappedTx = txRows.map((row) =>
      redactTransactionForRole(mapTxRowToDomain(row), role)
    );

    const canViewAlerts = hasPermission(role, authUser.permissions, 'alerts:view');
    const alertRows = await db
      .select()
      .from(fraudAlerts)
      .orderBy(desc(fraudAlerts.createdAt))
      .limit(100);
    const mappedAlerts = canViewAlerts
      ? alertRows.map(mapAlertRowToDomain)
      : alertRows.slice(0, 5).map((a) => ({
          ...mapAlertRowToDomain(a),
          message: `Anonymized system alert on ${a.transactionId} (Risk ${a.riskScore}/100).`,
        }));

    const canViewCases = hasPermission(role, authUser.permissions, 'investigations:view');
    const mappedCases = canViewCases
      ? (
          await db
            .select()
            .from(fraudInvestigations)
            .orderBy(desc(fraudInvestigations.updatedAt))
            .limit(100)
        ).map(mapCaseRowToDomain)
      : [];

    const canViewWarnings = hasPermission(role, authUser.permissions, 'warnings:view');
    const mappedNotifs = canViewWarnings
      ? (
          await db
            .select()
            .from(fraudNotifications)
            .orderBy(desc(fraudNotifications.createdAt))
            .limit(100)
        ).map(mapNotifRowToDomain)
      : [];

    const canViewAudit = hasPermission(role, authUser.permissions, 'audit:view');
    const mappedAudit = canViewAudit
      ? (
          await db
            .select()
            .from(auditLogs)
            .orderBy(desc(auditLogs.timestamp))
            .limit(150)
        ).map(mapAuditRowToDomain)
      : [];

    const rulesConfig = await getActiveRulesConfig();

    const canManageUsers = hasPermission(role, authUser.permissions, 'users:manage');
    const managedUsers = canManageUsers
      ? (await db.select().from(users).orderBy(users.id)).map(mapUserRowToManaged)
      : [];

    res.json({
      transactions: mappedTx,
      alerts: mappedAlerts,
      cases: mappedCases,
      notifications: mappedNotifs,
      auditLogs: mappedAudit,
      rulesConfig,
      users: managedUsers,
      capabilities: {
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        emailProviderConfigured: Boolean(process.env.SMTP_HOST),
        smsProviderConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID),
        paymentSandboxMode: process.env.STRIPE_SECRET_KEY ? 'STRIPE_TEST' : 'SIMULATED',
      },
    });
  } catch (err) {
    console.error('Bootstrap load error:', err);
    res.status(500).json({ error: 'Failed to load workspace telemetry from PostgreSQL' });
  }
});

// ==========================================
// PAYMENT PROCESSING & FRAUD EVALUATION
// ==========================================

app.post(
  '/api/transactions/process',
  requireAuth,
  requirePermission('transactions:submit_payment'),
  async (req: AuthRequest, res) => {
    try {
      await ensureSeeded();
      const authUser = req.authUser!;
      const body = req.body || {};

      // Reject raw sensitive financial credentials explicitly
      if (body.cardNumber || body.cvv || body.pin || body.upiPin || body.password) {
        return res.status(400).json({
          error:
            'Security Policy Violation: Raw card numbers, CVVs, PINs, or credentials must never be transmitted or stored.',
        });
      }

      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000) {
        return res.status(400).json({ error: 'Amount must be a positive number up to ₹10,00,00,000.' });
      }

      const validMethods: PaymentMethod[] = [
        'UPI',
        'CREDIT_CARD',
        'DEBIT_CARD',
        'NET_BANKING',
        'CRYPTO',
        'DIGITAL_WALLET',
      ];
      const paymentMethod: PaymentMethod = validMethods.includes(body.paymentMethod)
        ? body.paymentMethod
        : 'UPI';

      const customerProfile =
        SEED_CUSTOMERS.find((c) => c.customerId === body.customerId) || SEED_CUSTOMERS[0];

      const merchant =
        Object.values(SEED_MERCHANTS).find(
          (m) => m.merchantId === body.merchantId || m.name === body.recipientName
        ) || {
          merchantId: `MCH-PAY-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
          name:
            typeof body.recipientName === 'string' && body.recipientName.trim()
              ? body.recipientName.trim().slice(0, 80)
              : 'Verified Merchant Gateway',
          category: (body.merchantCategory || 'e_commerce') as Transaction['merchant']['category'],
          riskTier: (body.merchantRiskTier || 'LOW') as Transaction['merchant']['riskTier'],
          flaggedCount: Number(body.merchantFlaggedCount || 0),
        };

      const device =
        Object.values(SEED_DEVICES).find((d) => d.deviceId === body.deviceId) || {
          deviceId:
            typeof body.deviceId === 'string' && body.deviceId.trim()
              ? body.deviceId.trim().slice(0, 48)
              : customerProfile.trustedDeviceIds[0],
          fingerprintHash: `fp_${crypto.randomBytes(4).toString('hex')}`,
          deviceType: (body.isEmulator ? 'emulator' : 'mobile_android') as Transaction['device']['deviceType'],
          os: body.isEmulator ? 'Android 11 (Emulator)' : 'Android 14',
          browser: 'Chrome Mobile 125',
          isEmulator: Boolean(body.isEmulator),
          isJailbroken: Boolean(body.isJailbroken),
          trustScore: body.isEmulator ? 18 : body.unfamiliarDevice ? 45 : 95,
          firstSeen: new Date().toISOString(),
        };

      const location = {
        city:
          typeof body.city === 'string' && body.city.trim()
            ? body.city.trim().slice(0, 60)
            : customerProfile.commonLocations[0].city,
        country:
          typeof body.country === 'string' && body.country.trim()
            ? body.country.trim().slice(0, 60)
            : customerProfile.commonLocations[0].country,
        countryCode:
          typeof body.countryCode === 'string' && body.countryCode.trim()
            ? body.countryCode.trim().slice(0, 4).toUpperCase()
            : 'IN',
        latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : 17.385,
        longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : 78.4867,
        ipAddress:
          typeof body.ipAddress === 'string' && body.ipAddress.trim()
            ? body.ipAddress.trim().slice(0, 45)
            : '103.24.58.19',
        vpnDetected: Boolean(body.vpnDetected),
      };

      const rulesConfig = await getActiveRulesConfig();
      const timestampIso =
        typeof body.timestamp === 'string' && !Number.isNaN(Date.parse(body.timestamp))
          ? body.timestamp
          : new Date().toISOString();

      const evalResult = evaluateTransactionRisk(
        {
          amount,
          paymentMethod,
          merchant,
          location,
          device,
          timestamp: timestampIso,
          customerProfile,
          recentTransactionsCountLastHour: Number(body.recentVelocity ?? 1),
          failedAttemptsPrior: Number(body.failedAttemptsPrior ?? 0),
          lastKnownTransaction: body.simulateImpossibleTravel
            ? {
                location: {
                  city: customerProfile.commonLocations[0].city,
                  country: customerProfile.commonLocations[0].country,
                  countryCode: 'IN',
                  latitude: 17.385,
                  longitude: 78.4867,
                  ipAddress: '103.20.10.15',
                },
                timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
              }
            : undefined,
        },
        rulesConfig
      );

      // Automated Prevention Policy Mapping
      let status: TransactionStatus = 'APPROVED';
      if (evalResult.riskLevel === 'CRITICAL') {
        status = rulesConfig.autoBlockCritical === false ? 'HELD_FOR_REVIEW' : 'BLOCKED';
      } else if (evalResult.riskLevel === 'HIGH') {
        status = 'HELD_FOR_REVIEW';
      } else if (evalResult.riskLevel === 'MEDIUM') {
        if (rulesConfig.mediumAction === 'ALLOW') status = 'APPROVED';
        else if (rulesConfig.mediumAction === 'HOLD') status = 'HELD_FOR_REVIEW';
        else status = 'OTP_PENDING';
      }

      const txId = `TXN-RESQ-${Date.now().toString().slice(-6)}-${crypto
        .randomBytes(1)
        .toString('hex')
        .toUpperCase()}`;

      const domainTx: Transaction = {
        id: txId,
        customerId: customerProfile.customerId,
        customerName:
          typeof body.senderName === 'string' && body.senderName.trim()
            ? body.senderName.trim().slice(0, 80)
            : customerProfile.name,
        senderAccountMasked:
          typeof body.senderAccountMasked === 'string' && body.senderAccountMasked.trim()
            ? body.senderAccountMasked.trim().slice(0, 24)
            : `XXXX-${customerProfile.customerId.slice(-4)}`,
        recipientName: merchant.name,
        recipientAccountMasked:
          typeof body.recipientAccountMasked === 'string' && body.recipientAccountMasked.trim()
            ? body.recipientAccountMasked.trim().slice(0, 32)
            : merchant.merchantId,
        description:
          typeof body.description === 'string' && body.description.trim()
            ? body.description.trim().slice(0, 200)
            : `Simulated payment to ${merchant.name}`,
        amount,
        currency: 'INR',
        paymentMethod,
        merchant,
        location,
        device,
        timestamp: timestampIso,
        status,
        riskEvaluation: {
          ...evalResult,
          aiExplanation: evalResult.summary,
        },
        isSimulated: true,
        isSimulatedAttack: Boolean(body.isSimulatedAttack),
        attackType: typeof body.attackType === 'string' ? body.attackType : undefined,
        notes: [
          `Evaluated by RESQ AI Engine (${evalResult.riskScore}/100 · ${evalResult.riskLevel}) -> ${status}`,
        ],
      };

      await db.insert(transactions).values(mapDomainTxToInsert(domainTx, authUser.uid));

      // Automated Alert & Investigation Case creation for MEDIUM / HIGH / CRITICAL
      let createdAlert = null;
      let createdCase = null;

      if (evalResult.riskLevel !== 'LOW') {
        const alertRow = {
          id: `ALT-${Date.now()}-${crypto.randomBytes(1).toString('hex').toUpperCase()}`,
          transactionId: domainTx.id,
          severity: evalResult.riskLevel,
          title: `${evalResult.riskLevel} Risk Payment Detected (${evalResult.riskScore}/100)`,
          message: `${domainTx.id} for ₹${domainTx.amount.toLocaleString()} via ${domainTx.paymentMethod} in ${domainTx.location.city} -> ${status}.`,
          riskScore: evalResult.riskScore,
          status: 'ACTIVE',
          assignedRole:
            evalResult.riskLevel === 'CRITICAL'
              ? 'LEAD_FRAUD_ARCHITECT'
              : 'SENIOR_RISK_ANALYST',
          createdAt: new Date(),
        };
        const [insertedAlert] = await db.insert(fraudAlerts).values(alertRow).returning();
        createdAlert = mapAlertRowToDomain(insertedAlert);
        io.emit('alert:created', createdAlert);
      }

      if (evalResult.riskLevel === 'HIGH' || evalResult.riskLevel === 'CRITICAL') {
        const caseRow = {
          id: `CASE-${Date.now().toString().slice(-5)}-${crypto
            .randomBytes(1)
            .toString('hex')
            .toUpperCase()}`,
          title: `${domainTx.attackType || `${evalResult.riskLevel} Risk Anomaly`}: ${domainTx.customerName}`,
          transactionId: domainTx.id,
          customerId: domainTx.customerId,
          customerName: domainTx.customerName,
          assignedAnalyst: 'Sophia Chen (Senior Risk Analyst)',
          priority: evalResult.riskLevel,
          status: 'NEW',
          notes: [
            {
              id: `note-${Date.now()}`,
              author: 'RESQ AI Auto-Sentinel',
              authorRole: 'SYSTEM',
              text: `Automated containment applied (${status}). Score: ${evalResult.riskScore}/100. ${evalResult.summary}`,
              timestamp: new Date().toISOString(),
            },
          ],
          tags: [evalResult.riskLevel, domainTx.paymentMethod, 'Auto-Escalated'],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const [insertedCase] = await db
          .insert(fraudInvestigations)
          .values(caseRow)
          .returning();
        createdCase = mapCaseRowToDomain(insertedCase);
        io.to('role:COMPLIANCE_OFFICER')
          .to('role:SENIOR_RISK_ANALYST')
          .to('role:LEAD_FRAUD_ARCHITECT')
          .emit('case:created', createdCase);
      }

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'PAYMENT_EVALUATED',
        targetId: domainTx.id,
        targetType: 'TRANSACTION',
        details: `Simulated ${paymentMethod} payment ₹${amount.toLocaleString()} scored ${evalResult.riskScore}/100 (${evalResult.riskLevel}) -> ${status}.`,
        ip: req.ip || '127.0.0.1',
      });

      // Emit role-aware socket updates
      io.to('role:VIEWER').emit(
        'transaction:created',
        redactTransactionForRole(domainTx, 'VIEWER')
      );
      io.to('role:COMPLIANCE_OFFICER')
        .to('role:SENIOR_RISK_ANALYST')
        .to('role:LEAD_FRAUD_ARCHITECT')
        .emit('transaction:created', domainTx);

      return res.status(201).json({
        transaction: redactTransactionForRole(domainTx, authUser.role),
        alert: createdAlert,
        case: createdCase,
      });
    } catch (err) {
      console.error('Payment evaluation error:', err);
      return res.status(500).json({ error: 'Failed to process simulated payment' });
    }
  }
);

app.post(
  '/api/transactions/:id/decision',
  requireAuth,
  requirePermission('transactions:decide'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const txId = String(req.params.id);
      const { action, reason } = req.body || {};

      if (
        action !== 'MANUAL_APPROVE' &&
        action !== 'MANUAL_BLOCK' &&
        action !== 'RELEASE_HOLD'
      ) {
        return res.status(400).json({ error: 'Invalid manual decision action.' });
      }

      const reasonText =
        typeof reason === 'string' && reason.trim()
          ? reason.trim().slice(0, 300)
          : `Decision executed by ${authUser.displayName}`;

      const rows = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, txId))
        .limit(1);
      const existingTx = rows[0];
      if (!existingTx) {
        return res.status(404).json({ error: 'Transaction not found.' });
      }

      // Only Lead Fraud Architect can release a CRITICAL blocked transaction
      if (
        existingTx.riskLevel === 'CRITICAL' &&
        (action === 'MANUAL_APPROVE' || action === 'RELEASE_HOLD') &&
        authUser.role !== 'LEAD_FRAUD_ARCHITECT'
      ) {
        return res.status(403).json({
          error:
            'Forbidden: Only a Lead Fraud Architect can release or override a CRITICAL risk transaction.',
        });
      }

      const nextStatus: TransactionStatus =
        action === 'MANUAL_BLOCK' ? 'MANUALLY_BLOCKED' : 'MANUALLY_RELEASED';

      const updatedNotes = [
        ...(Array.isArray(existingTx.notes) ? existingTx.notes : []),
        `[${action}] by ${authUser.displayName} (${authUser.role}): ${reasonText}`,
      ];

      const [updated] = await db
        .update(transactions)
        .set({ status: nextStatus, notes: updatedNotes })
        .where(eq(transactions.id, txId))
        .returning();

      const domainTx = mapTxRowToDomain(updated);

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action,
        targetId: txId,
        targetType: 'TRANSACTION',
        details: `${action} applied (${nextStatus}). Reason: ${reasonText}`,
        ip: req.ip || '127.0.0.1',
      });

      io.to('role:VIEWER').emit(
        'transaction:updated',
        redactTransactionForRole(domainTx, 'VIEWER')
      );
      io.to('role:COMPLIANCE_OFFICER')
        .to('role:SENIOR_RISK_ANALYST')
        .to('role:LEAD_FRAUD_ARCHITECT')
        .emit('transaction:updated', domainTx);

      res.json({ transaction: domainTx });
    } catch (err) {
      console.error('Decision error:', err);
      res.status(500).json({ error: 'Failed to update transaction decision' });
    }
  }
);

// ==========================================
// ALERTS & INVESTIGATION CENTER
// ==========================================

app.patch(
  '/api/alerts/:id',
  requireAuth,
  requirePermission('alerts:acknowledge'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const alertId = String(req.params.id);
      const { status } = req.body || {};

      if (status !== 'ACTIVE' && status !== 'ACKNOWLEDGED' && status !== 'RESOLVED') {
        return res.status(400).json({ error: 'Invalid alert status.' });
      }

      const [updated] = await db
        .update(fraudAlerts)
        .set({ status })
        .where(eq(fraudAlerts.id, alertId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Alert not found.' });
      }

      const mapped = mapAlertRowToDomain(updated);
      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'ALERT_STATUS_UPDATED',
        targetId: alertId,
        targetType: 'TRANSACTION',
        details: `Alert status marked ${status}.`,
        ip: req.ip || '127.0.0.1',
      });

      io.emit('alert:updated', mapped);
      res.json({ alert: mapped });
    } catch (err) {
      console.error('Alert update error:', err);
      res.status(500).json({ error: 'Failed to update alert status' });
    }
  }
);

app.post(
  '/api/investigations/:id/notes',
  requireAuth,
  requirePermission('investigations:note'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const caseId = String(req.params.id);
      const { text } = req.body || {};

      if (typeof text !== 'string' || !text.trim() || text.trim().length > 1000) {
        return res.status(400).json({ error: 'Note text must be between 1 and 1000 characters.' });
      }

      const rows = await db
        .select()
        .from(fraudInvestigations)
        .where(eq(fraudInvestigations.id, caseId))
        .limit(1);
      const existingCase = rows[0];
      if (!existingCase) {
        return res.status(404).json({ error: 'Investigation case not found.' });
      }

      const nextNotes = [
        ...(Array.isArray(existingCase.notes) ? existingCase.notes : []),
        {
          id: `note-${Date.now()}`,
          author: authUser.displayName,
          authorRole: authUser.role,
          text: text.trim(),
          timestamp: new Date().toISOString(),
        },
      ];

      const [updated] = await db
        .update(fraudInvestigations)
        .set({ notes: nextNotes, updatedAt: new Date() })
        .where(eq(fraudInvestigations.id, caseId))
        .returning();

      const domainCase = mapCaseRowToDomain(updated);
      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'INVESTIGATION_NOTE_ADDED',
        targetId: caseId,
        targetType: 'CASE',
        details: `Added investigation note: "${text.trim().slice(0, 120)}"`,
        ip: req.ip || '127.0.0.1',
      });

      io.to('role:COMPLIANCE_OFFICER')
        .to('role:SENIOR_RISK_ANALYST')
        .to('role:LEAD_FRAUD_ARCHITECT')
        .emit('case:updated', domainCase);

      res.json({ case: domainCase });
    } catch (err) {
      console.error('Add investigation note error:', err);
      res.status(500).json({ error: 'Failed to add investigation note' });
    }
  }
);

app.patch(
  '/api/investigations/:id',
  requireAuth,
  requirePermission('investigations:manage'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const caseId = String(req.params.id);
      const { status, assignedAnalyst, outcomeNotes, noteText } = req.body || {};

      const validStatuses: CaseStatus[] = [
        'NEW',
        'UNDER_INVESTIGATION',
        'ESCALATED',
        'RESOLVED',
        'CONFIRMED_FRAUD',
        'FALSE_POSITIVE',
      ];

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid investigation status.' });
      }

      const rows = await db
        .select()
        .from(fraudInvestigations)
        .where(eq(fraudInvestigations.id, caseId))
        .limit(1);
      const existingCase = rows[0];
      if (!existingCase) {
        return res.status(404).json({ error: 'Investigation case not found.' });
      }

      const nextNotes = [...(Array.isArray(existingCase.notes) ? existingCase.notes : [])];
      if (typeof noteText === 'string' && noteText.trim()) {
        nextNotes.push({
          id: `note-${Date.now()}`,
          author: authUser.displayName,
          authorRole: authUser.role,
          text: noteText.trim(),
          timestamp: new Date().toISOString(),
        });
      }

      const [updated] = await db
        .update(fraudInvestigations)
        .set({
          status: status || existingCase.status,
          assignedAnalyst:
            typeof assignedAnalyst === 'string' && assignedAnalyst.trim()
              ? assignedAnalyst.trim().slice(0, 100)
              : existingCase.assignedAnalyst,
          outcomeNotes:
            typeof outcomeNotes === 'string'
              ? outcomeNotes.trim().slice(0, 1000)
              : existingCase.outcomeNotes,
          notes: nextNotes,
          updatedAt: new Date(),
        })
        .where(eq(fraudInvestigations.id, caseId))
        .returning();

      const domainCase = mapCaseRowToDomain(updated);
      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'CASE_STATUS_UPDATED',
        targetId: caseId,
        targetType: 'CASE',
        details: `Case updated -> Status: ${domainCase.status}, Analyst: ${domainCase.assignedAnalyst}.${
          noteText ? ` Note: ${noteText}` : ''
        }`,
        ip: req.ip || '127.0.0.1',
      });

      io.to('role:COMPLIANCE_OFFICER')
        .to('role:SENIOR_RISK_ANALYST')
        .to('role:LEAD_FRAUD_ARCHITECT')
        .emit('case:updated', domainCase);

      res.json({ case: domainCase });
    } catch (err) {
      console.error('Update investigation error:', err);
      res.status(500).json({ error: 'Failed to update investigation case' });
    }
  }
);

// ==========================================
// FRAUD WARNING CENTER
// ==========================================

app.post(
  '/api/notifications/send',
  requireAuth,
  requirePermission('warnings:send'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const { transactionId, recipientLabel, channel, subject, message } = req.body || {};

      const validChannels: NotificationChannel[] = [
        'IN_APP',
        'EMAIL',
        'SMS',
        'SECURITY_ALERT',
      ];
      if (!validChannels.includes(channel)) {
        return res.status(400).json({ error: 'Invalid notification channel.' });
      }
      if (typeof transactionId !== 'string' || !transactionId.trim()) {
        return res.status(400).json({ error: 'Transaction ID is required.' });
      }
      if (typeof message !== 'string' || message.trim().length < 10) {
        return res.status(400).json({ error: 'Warning message is too short.' });
      }

      let deliveryStatus: 'DELIVERED' | 'SIMULATED_QUEUED' | 'CONFIG_REQUIRED' = 'DELIVERED';
      if (channel === 'EMAIL' && !process.env.SMTP_HOST) {
        deliveryStatus = 'SIMULATED_QUEUED';
      } else if (channel === 'SMS' && !process.env.TWILIO_ACCOUNT_SID) {
        deliveryStatus = 'SIMULATED_QUEUED';
      }

      const notifRow = {
        id: `NTF-${Date.now()}-${crypto.randomBytes(1).toString('hex').toUpperCase()}`,
        transactionId: transactionId.trim(),
        recipientLabel:
          typeof recipientLabel === 'string' && recipientLabel.trim()
            ? recipientLabel.trim().slice(0, 120)
            : 'Account Holder',
        channel,
        subject:
          typeof subject === 'string' && subject.trim()
            ? subject.trim().slice(0, 160)
            : `RESQ AI SECURITY ALERT — ${transactionId}`,
        message: message.trim().slice(0, 2000),
        deliveryStatus,
        sentByUserId: authUser.uid,
        sentByName: authUser.displayName,
        sentByRole: authUser.role,
        createdAt: new Date(),
      };

      const [inserted] = await db
        .insert(fraudNotifications)
        .values(notifRow)
        .returning();
      const mapped = mapNotifRowToDomain(inserted);

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'FRAUD_WARNING_DISPATCHED',
        targetId: transactionId,
        targetType: 'NOTIFICATION',
        details: `Dispatched ${channel} warning to ${mapped.recipientLabel} (${deliveryStatus}).`,
        ip: req.ip || '127.0.0.1',
      });

      io.emit('notification:created', mapped);
      res.status(201).json({ notification: mapped });
    } catch (err) {
      console.error('Send notification error:', err);
      res.status(500).json({ error: 'Failed to dispatch fraud warning notification' });
    }
  }
);

// ==========================================
// ADAPTIVE FRAUD RULES & SYSTEM SETTINGS
// ==========================================

app.put(
  '/api/rules',
  requireAuth,
  requirePermission('rules:configure'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const incomingConfig = req.body || {};

      const current = await getActiveRulesConfig();
      const merged: SensitivityConfig = {
        ...current,
        amountAnomalyWeight: Math.min(100, Math.max(0, Number(incomingConfig.amountAnomalyWeight ?? current.amountAnomalyWeight))),
        velocityWeight: Math.min(100, Math.max(0, Number(incomingConfig.velocityWeight ?? current.velocityWeight))),
        deviceFingerprintWeight: Math.min(100, Math.max(0, Number(incomingConfig.deviceFingerprintWeight ?? current.deviceFingerprintWeight))),
        locationAnomalyWeight: Math.min(100, Math.max(0, Number(incomingConfig.locationAnomalyWeight ?? current.locationAnomalyWeight))),
        impossibleTravelWeight: Math.min(100, Math.max(0, Number(incomingConfig.impossibleTravelWeight ?? current.impossibleTravelWeight))),
        merchantRiskWeight: Math.min(100, Math.max(0, Number(incomingConfig.merchantRiskWeight ?? current.merchantRiskWeight))),
        unusualTimingWeight: Math.min(100, Math.max(0, Number(incomingConfig.unusualTimingWeight ?? current.unusualTimingWeight))),
        failedAttemptsWeight: Math.min(100, Math.max(0, Number(incomingConfig.failedAttemptsWeight ?? current.failedAttemptsWeight))),
        lowThreshold: Math.min(90, Math.max(10, Number(incomingConfig.lowThreshold ?? current.lowThreshold))),
        mediumThreshold: Math.min(95, Math.max(20, Number(incomingConfig.mediumThreshold ?? current.mediumThreshold))),
        highThreshold: Math.min(99, Math.max(40, Number(incomingConfig.highThreshold ?? current.highThreshold))),
        mediumAction: incomingConfig.mediumAction || current.mediumAction || 'VERIFY_OTP',
        autoBlockCritical:
          typeof incomingConfig.autoBlockCritical === 'boolean'
            ? incomingConfig.autoBlockCritical
            : current.autoBlockCritical ?? true,
      };

      if (merged.lowThreshold >= merged.mediumThreshold || merged.mediumThreshold >= merged.highThreshold) {
        return res.status(400).json({
          error: 'Threshold ordering invalid: require Low < Medium < High.',
        });
      }

      await db
        .update(fraudRules)
        .set({
          config: merged as unknown as Record<string, unknown>,
          updatedBy: authUser.displayName,
          updatedAt: new Date(),
        })
        .where(eq(fraudRules.id, 'RULE_GLOBAL_DEFAULT'));

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'SENSITIVITY_TUNED',
        targetId: 'RULE_GLOBAL_DEFAULT',
        targetType: 'RULE',
        details: `Updated AI fraud thresholds (Low ${merged.lowThreshold}, Med ${merged.mediumThreshold}, High ${merged.highThreshold}) & containment policy.`,
        ip: req.ip || '127.0.0.1',
      });

      io.emit('rules:updated', merged);
      res.json({ rulesConfig: merged });
    } catch (err) {
      console.error('Update rules error:', err);
      res.status(500).json({ error: 'Failed to update fraud rules' });
    }
  }
);

// ==========================================
// ADMINISTRATIVE USER MANAGEMENT (LEAD ARCHITECT)
// ==========================================

app.get(
  '/api/users',
  requireAuth,
  requirePermission('users:manage'),
  async (_req: AuthRequest, res) => {
    try {
      const rows = await db.select().from(users).orderBy(users.id);
      res.json({ users: rows.map(mapUserRowToManaged) });
    } catch (err) {
      console.error('List users error:', err);
      res.status(500).json({ error: 'Failed to fetch user accounts' });
    }
  }
);

app.post(
  '/api/users',
  requireAuth,
  requirePermission('users:manage'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const { email, displayName, password, role } = req.body || {};

      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }
      if (typeof displayName !== 'string' || displayName.trim().length < 2) {
        return res.status(400).json({ error: 'Display name must be at least 2 characters.' });
      }
      if (typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
      }
      if (!isValidRole(role)) {
        return res.status(400).json({ error: 'Invalid RBAC role specified.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);
      if (existing[0]) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const uid = `usr-${crypto.randomBytes(6).toString('hex')}`;

      const [created] = await db
        .insert(users)
        .values({
          uid,
          email: normalizedEmail,
          passwordHash,
          displayName: displayName.trim().slice(0, 100),
          role,
          permissions: ROLE_PERMISSIONS[role],
          isActive: true,
          isDemoAccount: false,
        })
        .returning();

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'USER_CREATED',
        targetId: created.uid,
        targetType: 'USER',
        details: `Created account ${created.email} with role ${created.role}.`,
        ip: req.ip || '127.0.0.1',
      });

      res.status(201).json({ user: mapUserRowToManaged(created) });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  }
);

app.patch(
  '/api/users/:id',
  requireAuth,
  requirePermission('users:manage'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const targetId = Number(req.params.id);
      if (!Number.isInteger(targetId)) {
        return res.status(400).json({ error: 'Invalid user ID.' });
      }

      const { role, isActive, permissions } = req.body || {};
      const rows = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      const targetUser = rows[0];
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      // Prevent self-deactivation or removing own Lead Architect privileges
      if (targetUser.uid === authUser.uid) {
        if (isActive === false) {
          return res.status(400).json({ error: 'Cannot deactivate your own active session.' });
        }
        if (role && role !== authUser.role) {
          return res.status(400).json({ error: 'Cannot modify your own role assignment.' });
        }
      }

      const nextRole: UserRole = role && isValidRole(role) ? role : (targetUser.role as UserRole);
      const allowedPool = ROLE_PERMISSIONS[nextRole];
      const nextPermissions = Array.isArray(permissions)
        ? permissions.filter((p) => allowedPool.includes(p))
        : role && role !== targetUser.role
          ? ROLE_PERMISSIONS[nextRole]
          : targetUser.permissions;

      const [updated] = await db
        .update(users)
        .set({
          role: nextRole,
          permissions: nextPermissions,
          isActive: typeof isActive === 'boolean' ? isActive : targetUser.isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetId))
        .returning();

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'USER_PERMISSIONS_UPDATED',
        targetId: updated.uid,
        targetType: 'USER',
        details: `Updated ${updated.email}: Role=${updated.role}, Active=${updated.isActive}.`,
        ip: req.ip || '127.0.0.1',
      });

      res.json({ user: mapUserRowToManaged(updated) });
    } catch (err) {
      console.error('Update user error:', err);
      res.status(500).json({ error: 'Failed to update user account' });
    }
  }
);

app.post(
  '/api/users/:id/reset-access',
  requireAuth,
  requirePermission('users:manage'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const targetId = Number(req.params.id);
      const { newPassword } = req.body || {};

      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New temporary password must be at least 8 characters.' });
      }

      const rows = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      const targetUser = rows[0];
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, targetId));

      await recordAudit({
        userId: authUser.uid,
        operator: authUser.displayName,
        role: authUser.role,
        action: 'USER_ACCESS_RESET',
        targetId: targetUser.uid,
        targetType: 'USER',
        details: `Issued secure password reset for ${targetUser.email}.`,
        ip: req.ip || '127.0.0.1',
      });

      res.json({ success: true });
    } catch (err) {
      console.error('Reset user access error:', err);
      res.status(500).json({ error: 'Failed to reset account access' });
    }
  }
);

// ==========================================
// GEMINI AI FORENSICS & ROLE-SCOPED ASSISTANT
// ==========================================

app.post(
  '/api/gemini/investigate',
  requireAuth,
  requirePermission('transactions:view_full'),
  async (req: AuthRequest, res) => {
    try {
      const result = await generateForensicInvestigation(req.body);
      res.json(result);
    } catch (err: any) {
      console.error('Gemini investigation error:', err);
      res.status(500).json({ error: err?.message || 'Forensic AI engine error' });
    }
  }
);

app.post(
  '/api/gemini/assistant',
  requireAuth,
  requirePermission('assistant:use'),
  async (req: AuthRequest, res) => {
    try {
      const authUser = req.authUser!;
      const { question, history } = req.body || {};
      if (typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({ error: 'Question cannot be empty.' });
      }

      const trimmedQuestion = question.trim().slice(0, 800);
      const safeHistory = Array.isArray(history)
        ? history
            .filter(
              (item: any) =>
                item &&
                (item.role === 'user' || item.role === 'assistant') &&
                typeof item.text === 'string'
            )
            .slice(-8)
            .map((item: any) => ({ role: item.role as 'user' | 'assistant', text: item.text }))
        : [];

      const txRows = await db
        .select()
        .from(transactions)
        .orderBy(desc(transactions.createdAt))
        .limit(200);
      const mappedTx = txRows.map((r) =>
        redactTransactionForRole(mapTxRowToDomain(r), authUser.role)
      );

      const alertRows = await db
        .select()
        .from(fraudAlerts)
        .orderBy(desc(fraudAlerts.createdAt))
        .limit(40);
      const canViewCases = hasPermission(authUser.role, authUser.permissions, 'investigations:view');
      const caseRows = canViewCases
        ? await db
            .select()
            .from(fraudInvestigations)
            .orderBy(desc(fraudInvestigations.updatedAt))
            .limit(20)
        : [];

      let rulesSummary:
        | { blockThreshold: number; holdThreshold: number; stepUpOtpThreshold: number }
        | undefined;
      if (
        hasPermission(authUser.role, authUser.permissions, 'rules:view') ||
        hasPermission(authUser.role, authUser.permissions, 'rules:configure')
      ) {
        const ruleRows = await db
          .select()
          .from(fraudRules)
          .where(eq(fraudRules.id, 'DEFAULT_SENSITIVITY'))
          .limit(1);
        const cfg = (ruleRows[0]?.config || {}) as Record<string, unknown>;
        rulesSummary = {
          stepUpOtpThreshold: Number(cfg.lowThreshold ?? DEFAULT_SENSITIVITY.lowThreshold),
          holdThreshold: Number(cfg.mediumThreshold ?? DEFAULT_SENSITIVITY.mediumThreshold),
          blockThreshold: Number(cfg.highThreshold ?? DEFAULT_SENSITIVITY.highThreshold),
        };
      }

      // Direct TXN / CASE entity lookup from question
      const matchedEntities: Array<{ type: 'TRANSACTION' | 'CASE'; id: string; details: string }> = [];
      const txnMatches = Array.from(new Set(trimmedQuestion.match(/TXN-[A-Z0-9-]+/gi) || [])).slice(
        0,
        4
      );
      for (const rawId of txnMatches) {
        const id = rawId.toUpperCase();
        let found = mappedTx.find((t) => t.id.toUpperCase() === id);
        if (!found) {
          const rows = await db
            .select()
            .from(transactions)
            .where(eq(transactions.id, id))
            .limit(1);
          if (rows[0]) {
            found = redactTransactionForRole(mapTxRowToDomain(rows[0]), authUser.role);
          }
        }
        if (found) {
          const topSignals = found.riskEvaluation.factors
            .filter((f) => f.anomalyDetected)
            .slice(0, 4)
            .map((f) => `${f.name} (+${f.score})`)
            .join(', ');
          matchedEntities.push({
            type: 'TRANSACTION',
            id: found.id,
            details: `${found.customerName} | ₹${found.amount.toLocaleString()} via ${found.paymentMethod} at ${found.merchant.name} | ${found.location.city}, ${found.location.country} | Score ${found.riskEvaluation.riskScore}/100 (${found.riskEvaluation.riskLevel}) | Status: ${found.status} | Signals: ${topSignals || 'None'}`,
          });
        }
      }

      if (canViewCases) {
        const caseMatches = Array.from(
          new Set(trimmedQuestion.match(/CASE-[A-Z0-9-]+/gi) || [])
        ).slice(0, 4);
        for (const rawId of caseMatches) {
          const id = rawId.toUpperCase();
          let foundCase = caseRows.find((c) => c.id.toUpperCase() === id);
          if (!foundCase) {
            const rows = await db
              .select()
              .from(fraudInvestigations)
              .where(eq(fraudInvestigations.id, id))
              .limit(1);
            foundCase = rows[0];
          }
          if (foundCase) {
            matchedEntities.push({
              type: 'CASE',
              id: foundCase.id,
              details: `${foundCase.title} | Status: ${foundCase.status} | Priority: ${foundCase.priority} | Analyst: ${foundCase.assignedAnalyst} | TXN: ${foundCase.transactionId} | Notes: ${foundCase.notes?.length || 0}`,
            });
          }
        }
      }

      const approvedTxs = mappedTx.filter(
        (t) => t.status === 'APPROVED' || t.status === 'MANUALLY_RELEASED'
      );
      const heldTxs = mappedTx.filter(
        (t) => t.status === 'HELD_FOR_REVIEW' || t.status === 'OTP_PENDING'
      );
      const blockedTxs = mappedTx.filter(
        (t) => t.status === 'BLOCKED' || t.status === 'MANUALLY_BLOCKED'
      );

      // Payment method breakdown
      const methodMap = new Map<string, { count: number; volume: number }>();
      for (const tx of mappedTx) {
        const entry = methodMap.get(tx.paymentMethod) || { count: 0, volume: 0 };
        entry.count += 1;
        entry.volume += tx.amount;
        methodMap.set(tx.paymentMethod, entry);
      }

      // Top geo risk corridors
      const corridorMap = new Map<string, number>();
      for (const tx of mappedTx) {
        if (tx.riskEvaluation.riskScore >= 40) {
          const loc = `${tx.location.city}, ${tx.location.country}`;
          corridorMap.set(loc, (corridorMap.get(loc) || 0) + 1);
        }
      }

      const result = await generateAssistantResponse({
        question: trimmedQuestion,
        history: safeHistory,
        role: authUser.role,
        operatorName: authUser.displayName,
        contextSummary: {
          totalTransactions: mappedTx.length,
          approvedCount: approvedTxs.length,
          heldCount: heldTxs.length,
          blockedCount: blockedTxs.length,
          totalVolume: mappedTx.reduce((s, t) => s + t.amount, 0),
          blockedVolume: blockedTxs.reduce((s, t) => s + t.amount, 0),
          avgRiskScore: Math.round(
            mappedTx.reduce((s, t) => s + t.riskEvaluation.riskScore, 0) /
              Math.max(1, mappedTx.length)
          ),
          activeAlertsCount: alertRows.filter((a) => a.status === 'ACTIVE').length,
          openInvestigationsCount: caseRows.filter(
            (c) =>
              c.status === 'NEW' ||
              c.status === 'UNDER_INVESTIGATION' ||
              c.status === 'ESCALATED'
          ).length,
          paymentMethodBreakdown: Array.from(methodMap.entries()).map(([method, data]) => ({
            method,
            count: data.count,
            volume: data.volume,
          })),
          topRiskCorridors: Array.from(corridorMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([location, flaggedCount]) => ({ location, flaggedCount })),
          recentSuspiciousSummaries: mappedTx
            .filter((t) => t.riskEvaluation.riskScore >= 40)
            .slice(0, 10)
            .map((t) => ({
              id: t.id,
              amount: t.amount,
              riskScore: t.riskEvaluation.riskScore,
              riskLevel: t.riskEvaluation.riskLevel,
              status: t.status,
              city: t.location.city,
              country: t.location.country,
              merchantName: t.merchant.name,
              paymentMethod: t.paymentMethod,
              isEmulator: t.device.isEmulator,
              vpnDetected: Boolean(t.location.vpnDetected),
              topSignals: t.riskEvaluation.factors
                .filter((f) => f.anomalyDetected)
                .slice(0, 3)
                .map((f) => `${f.name} (+${f.score})`),
              summary: t.riskEvaluation.summary,
              customerLabel: t.customerName,
            })),
          matchedEntities,
          recentInvestigations: caseRows.slice(0, 8).map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status,
            priority: c.priority,
            transactionId: c.transactionId,
          })),
          activeAlerts: alertRows
            .filter((a) => a.status === 'ACTIVE')
            .slice(0, 6)
            .map((a) => ({
              id: a.id,
              transactionId: a.transactionId,
              severity: a.severity,
              title: authUser.role === 'VIEWER' ? 'Active Risk Anomaly Alert' : a.title,
              riskScore: a.riskScore,
            })),
          rulesSummary,
        },
      });

      res.json(result);
    } catch (err) {
      console.error('Assistant error:', err);
      res.status(500).json({ error: 'AI Intelligence Assistant failed to respond' });
    }
  }
);

// ==========================================
// VITE DEV MIDDLEWARE & PRODUCTION STATIC SERVER
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`RESQ AI server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
