/**
 * RESQ AI - Canonical RBAC Role & Permission Policy Matrix
 * Shared across backend Express authorization middleware and frontend role guards.
 */

import { UserRole, Transaction } from '../types/index.ts';

export type Permission =
  | 'dashboard:view'
  | 'transactions:view_anonymized'
  | 'transactions:view_full'
  | 'transactions:submit_payment'
  | 'transactions:decide'
  | 'alerts:view'
  | 'alerts:acknowledge'
  | 'investigations:view'
  | 'investigations:note'
  | 'investigations:manage'
  | 'investigations:escalate'
  | 'warnings:view'
  | 'warnings:send'
  | 'reports:basic'
  | 'reports:compliance'
  | 'reports:advanced'
  | 'reports:system'
  | 'rules:view'
  | 'rules:configure'
  | 'users:manage'
  | 'audit:view'
  | 'assistant:use'
  | 'settings:system';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  COMPLIANCE_OFFICER: 2,
  SENIOR_RISK_ANALYST: 3,
  LEAD_FRAUD_ARCHITECT: 4,
};

export const ROLE_META: Record<
  UserRole,
  { title: string; badge: string; accessLevel: string; description: string }
> = {
  VIEWER: {
    title: 'Viewer',
    badge: 'Read-Only',
    accessLevel: 'Read-Only & Anonymized',
    description: 'Views general fraud statistics, anonymized transactions, and public charts.',
  },
  COMPLIANCE_OFFICER: {
    title: 'Compliance Officer',
    badge: 'Compliance & Audit',
    accessLevel: 'Compliance & Monitoring',
    description: 'Reviews flagged transactions, compliance reports, warning history, and adds investigation notes.',
  },
  SENIOR_RISK_ANALYST: {
    title: 'Senior Risk Analyst',
    badge: 'Investigate & Warn',
    accessLevel: 'Advanced Fraud Analysis',
    description: 'Investigates anomalies, views risk scores/explanations, escalates cases, and sends fraud warnings.',
  },
  LEAD_FRAUD_ARCHITECT: {
    title: 'Lead Fraud Architect',
    badge: 'Full Admin',
    accessLevel: 'Highest Administrative Authorization',
    description: 'Full access to rules, AI thresholds, user management, high-risk decisions, and system logs.',
  },
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  VIEWER: [
    'dashboard:view',
    'transactions:view_anonymized',
    'transactions:submit_payment',
    'reports:basic',
    'assistant:use',
  ],
  COMPLIANCE_OFFICER: [
    'dashboard:view',
    'transactions:view_full',
    'transactions:submit_payment',
    'alerts:view',
    'investigations:view',
    'investigations:note',
    'warnings:view',
    'reports:basic',
    'reports:compliance',
    'audit:view',
    'assistant:use',
  ],
  SENIOR_RISK_ANALYST: [
    'dashboard:view',
    'transactions:view_full',
    'transactions:submit_payment',
    'transactions:decide',
    'alerts:view',
    'alerts:acknowledge',
    'investigations:view',
    'investigations:note',
    'investigations:manage',
    'investigations:escalate',
    'warnings:view',
    'warnings:send',
    'reports:basic',
    'reports:compliance',
    'reports:advanced',
    'rules:view',
    'audit:view',
    'assistant:use',
  ],
  LEAD_FRAUD_ARCHITECT: [
    'dashboard:view',
    'transactions:view_full',
    'transactions:submit_payment',
    'transactions:decide',
    'alerts:view',
    'alerts:acknowledge',
    'investigations:view',
    'investigations:note',
    'investigations:manage',
    'investigations:escalate',
    'warnings:view',
    'warnings:send',
    'reports:basic',
    'reports:compliance',
    'reports:advanced',
    'reports:system',
    'rules:view',
    'rules:configure',
    'users:manage',
    'audit:view',
    'assistant:use',
    'settings:system',
  ],
};

export function hasPermission(
  role: UserRole,
  customPermissions: string[] | undefined,
  permission: Permission
): boolean {
  const effective = customPermissions && customPermissions.length > 0
    ? customPermissions
    : ROLE_PERMISSIONS[role] || [];
  return effective.includes(permission);
}

export function isValidRole(role: string): role is UserRole {
  return (
    role === 'VIEWER' ||
    role === 'COMPLIANCE_OFFICER' ||
    role === 'SENIOR_RISK_ANALYST' ||
    role === 'LEAD_FRAUD_ARCHITECT'
  );
}

/**
 * Redacts sensitive customer PII and account numbers when returning transactions to a VIEWER.
 */
export function redactTransactionForRole(tx: Transaction, role: UserRole): Transaction {
  if (role !== 'VIEWER') {
    return tx;
  }

  return {
    ...tx,
    customerId: `ANON-${tx.customerId.slice(-4)}`,
    customerName: `Account Holder #${tx.customerId.slice(-4)}`,
    senderAccountMasked: 'XXXX-XXXX',
    recipientName: tx.merchant.name,
    recipientAccountMasked: 'REDACTED',
    location: {
      ...tx.location,
      ipAddress: '***.***.***.***',
    },
    device: {
      ...tx.device,
      deviceId: `DEV-***${tx.device.deviceId.slice(-4)}`,
      fingerprintHash: 'fp_redacted',
    },
    notes: [],
  };
}
