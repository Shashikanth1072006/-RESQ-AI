/**
 * RESQ AI - Core Type Definitions
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type DecisionAction = 'APPROVE' | 'VERIFY_OTP' | 'HOLD_REVIEW' | 'BLOCK';

export type PaymentMethod = 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'CRYPTO' | 'DIGITAL_WALLET';

export type TransactionStatus =
  | 'APPROVED'
  | 'OTP_PENDING'
  | 'HELD_FOR_REVIEW'
  | 'BLOCKED'
  | 'MANUALLY_RELEASED'
  | 'MANUALLY_BLOCKED';

export type UserRole =
  | 'VIEWER'
  | 'COMPLIANCE_OFFICER'
  | 'SENIOR_RISK_ANALYST'
  | 'LEAD_FRAUD_ARCHITECT';

export type CaseStatus =
  | 'NEW'
  | 'UNDER_INVESTIGATION'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CONFIRMED_FRAUD'
  | 'FALSE_POSITIVE';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'SECURITY_ALERT';

export interface GeoLocation {
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  ipAddress: string;
  vpnDetected?: boolean;
}

export interface DeviceInfo {
  deviceId: string;
  fingerprintHash: string;
  deviceType: 'mobile_ios' | 'mobile_android' | 'desktop_mac' | 'desktop_windows' | 'linux_workstation' | 'emulator';
  os: string;
  browser: string;
  isEmulator: boolean;
  isJailbroken: boolean;
  trustScore: number;
  firstSeen: string;
}

export interface MerchantInfo {
  merchantId: string;
  name: string;
  category: 'e_commerce' | 'crypto_exchange' | 'gambling' | 'electronics' | 'luxury_goods' | 'groceries' | 'utilities' | 'travel';
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
  flaggedCount: number;
}

export interface RiskFactor {
  code: string;
  name: string;
  category: 'AMOUNT' | 'VELOCITY' | 'BEHAVIOR' | 'DEVICE' | 'LOCATION' | 'MERCHANT' | 'TIMING' | 'REPUTATION';
  score: number;
  weight: number;
  description: string;
  anomalyDetected: boolean;
  evidence: string;
}

export interface RiskEvaluation {
  riskScore: number;
  riskLevel: RiskLevel;
  decision: DecisionAction;
  fraudProbability: number;
  factors: RiskFactor[];
  summary: string;
  recommendation: string;
  evaluatedAt: string;
  latencyMs: number;
  aiExplanation?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  senderAccountMasked?: string;
  recipientName?: string;
  recipientAccountMasked?: string;
  description?: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  merchant: MerchantInfo;
  location: GeoLocation;
  device: DeviceInfo;
  timestamp: string;
  status: TransactionStatus;
  riskEvaluation: RiskEvaluation;
  isSimulated?: boolean;
  isSimulatedAttack?: boolean;
  attackType?: string;
  notes?: string[];
}

export interface CustomerBehavioralProfile {
  customerId: string;
  name: string;
  email: string;
  avatarUrl: string;
  joinedDate: string;
  totalTransactionsCount: number;
  typicalAmountMin: number;
  typicalAmountMax: number;
  averageAmount: number;
  standardDeviationAmount: number;
  dailyTransactionVelocityLimit: number;
  preferredHoursRange: [number, number];
  commonLocations: { city: string; country: string; freq: number }[];
  trustedDeviceIds: string[];
  preferredCategories: string[];
  frequentPaymentMethods: PaymentMethod[];
  riskTier: 'TRUSTED' | 'STANDARD' | 'WATCHLIST';
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'customer' | 'device' | 'merchant' | 'transaction';
  riskScore: number;
  isCompromised?: boolean;
  details?: Record<string, unknown>;
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  isSuspicious?: boolean;
}

export interface FraudCase {
  id: string;
  title: string;
  transactionId: string;
  customerId: string;
  customerName: string;
  assignedAnalyst: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: CaseStatus;
  outcomeNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  notes: { id: string; author: string; authorRole?: string; text: string; timestamp: string }[];
  tags: string[];
}

export interface FraudAlertItem {
  id: string;
  transactionId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  riskScore: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  assignedRole: string;
  createdAt: string;
}

export interface FraudNotificationItem {
  id: string;
  transactionId: string;
  recipientLabel: string;
  channel: NotificationChannel;
  subject: string;
  message: string;
  deliveryStatus: 'DELIVERED' | 'SIMULATED_QUEUED' | 'CONFIG_REQUIRED';
  sentByUserId: string;
  sentByName: string;
  sentByRole: string;
  createdAt: string;
}

export interface ManagedUser {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  role: UserRole;
  permissions: string[];
  isActive: boolean;
  isDemoAccount: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  operator: string;
  role: string;
  action: string;
  targetId: string;
  targetType: 'TRANSACTION' | 'CASE' | 'CONFIG' | 'RULE' | 'AUTH' | 'NOTIFICATION' | 'USER';
  details: string;
  ip: string;
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  icon: string;
  targetVictimId: string;
  simulatedPayload: Partial<Transaction>;
  expectedTriggeredRules: string[];
  explanation: string;
}

export interface SensitivityConfig {
  amountAnomalyWeight: number;
  velocityWeight: number;
  deviceFingerprintWeight: number;
  locationAnomalyWeight: number;
  impossibleTravelWeight: number;
  merchantRiskWeight: number;
  unusualTimingWeight: number;
  failedAttemptsWeight: number;
  lowThreshold: number;
  mediumThreshold: number;
  highThreshold: number;
  mediumAction?: 'ALLOW' | 'HOLD' | 'VERIFY_OTP';
  autoBlockCritical?: boolean;
  emailProviderConfigured?: boolean;
  smsProviderConfigured?: boolean;
  paymentSandboxMode?: 'SIMULATED' | 'STRIPE_TEST';
}

export interface FeedbackRecord {
  id: string;
  transactionId: string;
  analyst: string;
  timestamp: string;
  assignedLabel: 'CONFIRMED_FRAUD' | 'LEGITIMATE' | 'NEEDS_FURTHER_REVIEW';
  engineScore: number;
  engineDecision: DecisionAction;
  notes: string;
}

export interface ModelMetrics {
  totalEvaluated: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  avgLatencyMs: number;
}
