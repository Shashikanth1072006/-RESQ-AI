/**
 * RESQ AI - Client-Side RBAC Policy Mirror & Page Access Guards
 * Mirrors src/server/rbac.ts for navigation filtering and UI controls.
 * Backend independently enforces all permissions on every API route.
 */

import { UserRole } from '../types';

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

export type NavigationPage =
  | 'overview'
  | 'live_radar'
  | 'make_payment'
  | 'detection_engine'
  | 'behavioral_dna'
  | 'fraud_fingerprints'
  | 'threat_intel'
  | 'attack_simulator'
  | 'what_if_simulator'
  | 'investigation_workspace'
  | 'warning_center'
  | 'scorecard'
  | 'analytics_reports'
  | 'protection_settings'
  | 'ai_assistant'
  | 'user_management'
  | 'system_settings'
  | 'audit_logs'
  | 'profile_settings';

export const ROLE_META: Record<
  UserRole,
  { title: string; badge: string; accessLevel: string; description: string; accent: string }
> = {
  VIEWER: {
    title: 'Viewer',
    badge: 'Read-Only',
    accessLevel: 'Read-Only & Anonymized',
    description: 'Basic dashboard statistics, anonymized transactions, and general fraud reports.',
    accent: 'text-slate-300 bg-slate-800 border-slate-700',
  },
  COMPLIANCE_OFFICER: {
    title: 'Compliance Officer',
    badge: 'Compliance & Audit',
    accessLevel: 'Compliance & Monitoring',
    description: 'Flagged transactions, investigation notes, compliance reports, warning history, and audit logs.',
    accent: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
  },
  SENIOR_RISK_ANALYST: {
    title: 'Senior Risk Analyst',
    badge: 'Investigate & Warn',
    accessLevel: 'Advanced Fraud Analysis',
    description: 'Deep analytics, risk explanations, case escalation, manual blocking, and fraud warnings.',
    accent: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
  },
  LEAD_FRAUD_ARCHITECT: {
    title: 'Lead Fraud Architect',
    badge: 'Full Admin',
    accessLevel: 'Highest Administrative Authorization',
    description: 'Full administrative control: user accounts, AI rules & thresholds, overrides, and security logs.',
    accent: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
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

export function hasClientPermission(
  role: UserRole,
  customPermissions: string[] | undefined,
  permission: Permission
): boolean {
  const effective =
    customPermissions && customPermissions.length > 0
      ? customPermissions
      : ROLE_PERMISSIONS[role] || [];
  return effective.includes(permission);
}

export const PAGE_REQUIRED_PERMISSION: Record<NavigationPage, Permission | null> = {
  overview: 'dashboard:view',
  live_radar: 'dashboard:view',
  make_payment: 'transactions:submit_payment',
  detection_engine: 'rules:view',
  behavioral_dna: 'transactions:view_full',
  fraud_fingerprints: 'reports:advanced',
  threat_intel: 'transactions:view_full',
  attack_simulator: 'reports:advanced',
  what_if_simulator: 'reports:advanced',
  investigation_workspace: 'investigations:view',
  warning_center: 'warnings:view',
  scorecard: 'dashboard:view',
  analytics_reports: 'reports:basic',
  protection_settings: 'transactions:decide',
  ai_assistant: 'assistant:use',
  user_management: 'users:manage',
  system_settings: 'settings:system',
  audit_logs: 'audit:view',
  profile_settings: null,
};

export function canAccessPage(
  role: UserRole,
  customPermissions: string[] | undefined,
  page: NavigationPage
): boolean {
  const reqPerm = PAGE_REQUIRED_PERMISSION[page];
  if (!reqPerm) return true;
  return hasClientPermission(role, customPermissions, reqPerm);
}
