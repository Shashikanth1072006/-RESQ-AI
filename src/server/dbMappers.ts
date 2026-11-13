/**
 * RESQ AI - Database Row <-> Domain Model Mappers
 */

import {
  Transaction,
  FraudCase,
  FraudAlertItem,
  FraudNotificationItem,
  AuditLog,
  ManagedUser,
  PaymentMethod,
  MerchantInfo,
  DeviceInfo,
  TransactionStatus,
  RiskLevel,
  DecisionAction,
  RiskFactor,
  CaseStatus,
  NotificationChannel,
  UserRole,
} from '../types/index.ts';
import {
  transactions,
  fraudInvestigations,
  fraudAlerts,
  fraudNotifications,
  auditLogs,
  users,
} from '../db/schema.ts';

type TxRow = typeof transactions.$inferSelect;
type CaseRow = typeof fraudInvestigations.$inferSelect;
type AlertRow = typeof fraudAlerts.$inferSelect;
type NotifRow = typeof fraudNotifications.$inferSelect;
type AuditRow = typeof auditLogs.$inferSelect;
type UserRow = typeof users.$inferSelect;

export function mapTxRowToDomain(row: TxRow): Transaction {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    senderAccountMasked: row.senderAccountMasked,
    recipientName: row.recipientName,
    recipientAccountMasked: row.recipientAccountMasked,
    description: row.description,
    amount: row.amount,
    currency: row.currency,
    paymentMethod: row.paymentMethod as PaymentMethod,
    merchant: {
      merchantId: row.merchantId,
      name: row.merchantName,
      category: row.merchantCategory as MerchantInfo['category'],
      riskTier: row.merchantRiskTier as MerchantInfo['riskTier'],
      flaggedCount: row.merchantFlaggedCount,
    },
    location: {
      city: row.city,
      country: row.country,
      countryCode: row.countryCode,
      latitude: row.latitude,
      longitude: row.longitude,
      ipAddress: row.ipAddress,
      vpnDetected: row.vpnDetected,
    },
    device: {
      deviceId: row.deviceId,
      fingerprintHash: row.fingerprintHash,
      deviceType: row.deviceType as DeviceInfo['deviceType'],
      os: row.deviceOs,
      browser: row.deviceBrowser,
      isEmulator: row.isEmulator,
      isJailbroken: row.isJailbroken,
      trustScore: row.deviceTrustScore,
      firstSeen: row.createdAt.toISOString(),
    },
    timestamp: row.createdAt.toISOString(),
    status: row.status as TransactionStatus,
    riskEvaluation: {
      riskScore: row.riskScore,
      riskLevel: row.riskLevel as RiskLevel,
      decision: row.decision as DecisionAction,
      fraudProbability: row.fraudProbability,
      factors: (row.riskFactors || []) as unknown as RiskFactor[],
      summary: row.riskSummary,
      recommendation: row.recommendation,
      aiExplanation: row.aiExplanation || undefined,
      evaluatedAt: row.createdAt.toISOString(),
      latencyMs: row.latencyMs,
    },
    isSimulated: row.isSimulated,
    isSimulatedAttack: row.isSimulatedAttack,
    attackType: row.attackType || undefined,
    notes: Array.isArray(row.notes) ? row.notes : [],
  };
}

export function mapDomainTxToInsert(
  tx: Transaction,
  createdByUserId?: string
): typeof transactions.$inferInsert {
  return {
    id: tx.id,
    customerId: tx.customerId,
    customerName: tx.customerName,
    senderAccountMasked: tx.senderAccountMasked || `ACCT-${tx.customerId.slice(-4)}`,
    recipientName: tx.recipientName || tx.merchant.name,
    recipientAccountMasked: tx.recipientAccountMasked || tx.merchant.merchantId,
    amount: tx.amount,
    currency: tx.currency,
    paymentMethod: tx.paymentMethod,
    description: tx.description || `Payment to ${tx.merchant.name}`,
    merchantId: tx.merchant.merchantId,
    merchantName: tx.merchant.name,
    merchantCategory: tx.merchant.category,
    merchantRiskTier: tx.merchant.riskTier,
    merchantFlaggedCount: tx.merchant.flaggedCount,
    city: tx.location.city,
    country: tx.location.country,
    countryCode: tx.location.countryCode,
    latitude: tx.location.latitude,
    longitude: tx.location.longitude,
    ipAddress: tx.location.ipAddress,
    vpnDetected: Boolean(tx.location.vpnDetected),
    deviceId: tx.device.deviceId,
    fingerprintHash: tx.device.fingerprintHash,
    deviceType: tx.device.deviceType,
    deviceOs: tx.device.os,
    deviceBrowser: tx.device.browser,
    isEmulator: tx.device.isEmulator,
    isJailbroken: tx.device.isJailbroken,
    deviceTrustScore: tx.device.trustScore,
    status: tx.status,
    riskScore: tx.riskEvaluation.riskScore,
    riskLevel: tx.riskEvaluation.riskLevel,
    decision: tx.riskEvaluation.decision,
    fraudProbability: tx.riskEvaluation.fraudProbability,
    riskFactors: tx.riskEvaluation.factors as unknown as Array<Record<string, unknown>>,
    riskSummary: tx.riskEvaluation.summary,
    recommendation: tx.riskEvaluation.recommendation,
    aiExplanation: tx.riskEvaluation.aiExplanation || tx.riskEvaluation.summary,
    latencyMs: tx.riskEvaluation.latencyMs,
    isSimulated: tx.isSimulated ?? true,
    isSimulatedAttack: Boolean(tx.isSimulatedAttack),
    attackType: tx.attackType || null,
    notes: tx.notes || [],
    createdByUserId: createdByUserId || null,
    createdAt: new Date(tx.timestamp),
  };
}

export function mapCaseRowToDomain(row: CaseRow): FraudCase {
  return {
    id: row.id,
    title: row.title,
    transactionId: row.transactionId,
    customerId: row.customerId,
    customerName: row.customerName,
    assignedAnalyst: row.assignedAnalyst,
    priority: row.priority as FraudCase['priority'],
    status: row.status as CaseStatus,
    outcomeNotes: row.outcomeNotes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    notes: Array.isArray(row.notes) ? row.notes : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
  };
}

export function mapAlertRowToDomain(row: AlertRow): FraudAlertItem {
  return {
    id: row.id,
    transactionId: row.transactionId,
    severity: row.severity as FraudAlertItem['severity'],
    title: row.title,
    message: row.message,
    riskScore: row.riskScore,
    status: row.status as FraudAlertItem['status'],
    assignedRole: row.assignedRole,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapNotifRowToDomain(row: NotifRow): FraudNotificationItem {
  return {
    id: row.id,
    transactionId: row.transactionId,
    recipientLabel: row.recipientLabel,
    channel: row.channel as NotificationChannel,
    subject: row.subject,
    message: row.message,
    deliveryStatus: row.deliveryStatus as FraudNotificationItem['deliveryStatus'],
    sentByUserId: row.sentByUserId,
    sentByName: row.sentByName,
    sentByRole: row.sentByRole,
    createdAt: row.createdAt.toISOString(),
  };
}

export function mapAuditRowToDomain(row: AuditRow): AuditLog {
  return {
    id: row.id,
    timestamp: row.timestamp.toISOString(),
    userId: row.userId,
    operator: row.operator,
    role: row.role,
    action: row.action,
    targetId: row.targetId,
    targetType: row.targetType as AuditLog['targetType'],
    details: row.details,
    ip: row.ip,
  };
}

export function mapUserRowToManaged(row: UserRow): ManagedUser {
  return {
    id: row.id,
    uid: row.uid,
    email: row.email,
    displayName: row.displayName,
    photoUrl: row.photoUrl,
    role: row.role as UserRole,
    permissions: Array.isArray(row.permissions) ? row.permissions : [],
    isActive: row.isActive,
    isDemoAccount: row.isDemoAccount,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
