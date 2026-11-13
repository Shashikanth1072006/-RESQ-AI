/**
 * RESQ AI - PostgreSQL Database Schema (Drizzle ORM)
 */

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  jsonb
} from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description').notNull(),
  hierarchyLevel: integer('hierarchy_level').notNull(),
  permissions: jsonb('permissions').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: text('display_name').notNull(),
  photoUrl: text('photo_url'),
  role: text('role').notNull().default('VIEWER'),
  permissions: jsonb('permissions').$type<string[]>().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  isDemoAccount: boolean('is_demo_account').notNull().default(false),
  lastLoginAt: timestamp('last_login_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  senderAccountMasked: text('sender_account_masked').notNull().default('XXXX-8021'),
  recipientName: text('recipient_name').notNull(),
  recipientAccountMasked: text('recipient_account_masked').notNull().default('VPA-MERCHANT'),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').notNull().default('INR'),
  paymentMethod: text('payment_method').notNull(),
  description: text('description').notNull().default('Digital payment transfer'),
  merchantId: text('merchant_id').notNull(),
  merchantName: text('merchant_name').notNull(),
  merchantCategory: text('merchant_category').notNull(),
  merchantRiskTier: text('merchant_risk_tier').notNull(),
  merchantFlaggedCount: integer('merchant_flagged_count').notNull().default(0),
  city: text('city').notNull(),
  country: text('country').notNull(),
  countryCode: text('country_code').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  ipAddress: text('ip_address').notNull(),
  vpnDetected: boolean('vpn_detected').notNull().default(false),
  deviceId: text('device_id').notNull(),
  fingerprintHash: text('fingerprint_hash').notNull(),
  deviceType: text('device_type').notNull(),
  deviceOs: text('device_os').notNull(),
  deviceBrowser: text('device_browser').notNull(),
  isEmulator: boolean('is_emulator').notNull().default(false),
  isJailbroken: boolean('is_jailbroken').notNull().default(false),
  deviceTrustScore: integer('device_trust_score').notNull().default(90),
  status: text('status').notNull(),
  riskScore: integer('risk_score').notNull(),
  riskLevel: text('risk_level').notNull(),
  decision: text('decision').notNull(),
  fraudProbability: doublePrecision('fraud_probability').notNull(),
  riskFactors: jsonb('risk_factors').$type<Array<Record<string, unknown>>>().notNull(),
  riskSummary: text('risk_summary').notNull(),
  recommendation: text('recommendation').notNull(),
  aiExplanation: text('ai_explanation'),
  latencyMs: doublePrecision('latency_ms').notNull().default(14),
  isSimulated: boolean('is_simulated').notNull().default(true),
  isSimulatedAttack: boolean('is_simulated_attack').notNull().default(false),
  attackType: text('attack_type'),
  notes: jsonb('notes').$type<string[]>().notNull().default([]),
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fraudAlerts = pgTable('fraud_alerts', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id')
    .references(() => transactions.id)
    .notNull(),
  severity: text('severity').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  riskScore: integer('risk_score').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  assignedRole: text('assigned_role').notNull().default('SENIOR_RISK_ANALYST'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fraudInvestigations = pgTable('fraud_investigations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  transactionId: text('transaction_id')
    .references(() => transactions.id)
    .notNull(),
  customerId: text('customer_id').notNull(),
  customerName: text('customer_name').notNull(),
  assignedAnalyst: text('assigned_analyst').notNull(),
  priority: text('priority').notNull(),
  status: text('status').notNull().default('NEW'),
  outcomeNotes: text('outcome_notes'),
  notes: jsonb('notes').$type<Array<{ id: string; author: string; authorRole?: string; text: string; timestamp: string }>>().notNull().default([]),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fraudNotifications = pgTable('fraud_notifications', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  recipientLabel: text('recipient_label').notNull(),
  channel: text('channel').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  deliveryStatus: text('delivery_status').notNull().default('DELIVERED'),
  sentByUserId: text('sent_by_user_id').notNull(),
  sentByName: text('sent_by_name').notNull(),
  sentByRole: text('sent_by_role').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userId: text('user_id').notNull(),
  operator: text('operator').notNull(),
  role: text('role').notNull(),
  action: text('action').notNull(),
  targetId: text('target_id').notNull(),
  targetType: text('target_type').notNull(),
  details: text('details').notNull(),
  ip: text('ip').notNull().default('127.0.0.1'),
});

export const fraudRules = pgTable('fraud_rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().notNull(),
  updatedBy: text('updated_by').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
