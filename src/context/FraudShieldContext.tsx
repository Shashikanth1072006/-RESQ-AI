/**
 * RESQ AI - Master Application State Context
 * Synchronizes PostgreSQL telemetry via REST APIs and real-time Socket.IO events.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Transaction,
  CustomerBehavioralProfile,
  FraudCase,
  FraudAlertItem,
  FraudNotificationItem,
  ManagedUser,
  AuditLog,
  AttackScenario,
  SensitivityConfig,
  UserRole,
  ModelMetrics,
  PaymentMethod,
  GeoLocation,
  DeviceInfo,
  MerchantInfo,
  NotificationChannel,
  CaseStatus,
} from '../types';
import {
  SEED_CUSTOMERS,
  SEED_TRANSACTIONS,
  SEED_ATTACK_SCENARIOS,
  SEED_MERCHANTS,
  SEED_DEVICES,
  SEED_MODEL_METRICS,
} from '../data/seedData';
import { evaluateTransactionRisk, DEFAULT_SENSITIVITY } from '../engine/fraudEngine';
import { useAuth } from './AuthContext';
import { NavigationPage, hasClientPermission, Permission, canAccessPage } from '../utils/rbacClient';

export type { NavigationPage };

export interface ProcessPaymentPayload {
  customerId?: string;
  senderName: string;
  senderAccountMasked: string;
  recipientName: string;
  recipientAccountMasked: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  merchantCategory?: MerchantInfo['category'];
  merchantRiskTier?: MerchantInfo['riskTier'];
  city?: string;
  country?: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  vpnDetected?: boolean;
  isEmulator?: boolean;
  unfamiliarDevice?: boolean;
  recentVelocity?: number;
  failedAttemptsPrior?: number;
  simulateImpossibleTravel?: boolean;
  isSimulatedAttack?: boolean;
  attackType?: string;
}

export interface ProcessPaymentResult {
  transaction: Transaction;
  alert: FraudAlertItem | null;
  case: FraudCase | null;
}

export interface ServerCapabilities {
  geminiConfigured: boolean;
  emailProviderConfigured: boolean;
  smsProviderConfigured: boolean;
  paymentSandboxMode: 'SIMULATED' | 'STRIPE_TEST';
}

interface FraudShieldContextType {
  activeTab: NavigationPage;
  setActiveTab: (tab: NavigationPage) => void;
  transactions: Transaction[];
  customers: CustomerBehavioralProfile[];
  alerts: FraudAlertItem[];
  cases: FraudCase[];
  fraudNotifications: FraudNotificationItem[];
  auditLogs: AuditLog[];
  managedUsers: ManagedUser[];
  attackScenarios: AttackScenario[];
  sensitivityConfig: SensitivityConfig;
  capabilities: ServerCapabilities;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  reloadWorkspace: () => Promise<void>;
  updateSensitivityConfig: (newConfig: Partial<SensitivityConfig>) => Promise<void>;
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  isLiveStreaming: boolean;
  streamSpeed: number;
  toggleLiveStream: () => void;
  setStreamSpeed: (speed: number) => void;
  userRole: UserRole;
  userPermissions: string[];
  can: (permission: Permission) => boolean;
  modelMetrics: ModelMetrics;
  stats: {
    totalVolume: number;
    processedToday: number;
    successfulCount: number;
    suspiciousCount: number;
    blockedCount: number;
    fraudAttemptsDetected: number;
    preventionRate: number;
    lossesPrevented: number;
    avgRiskScore: number;
    overallRiskPercentage: number;
    highRiskCount: number;
    heldReviewCount: number;
    activeAlertsCount: number;
  };
  processPayment: (payload: ProcessPaymentPayload) => Promise<ProcessPaymentResult>;
  triggerAttackScenario: (scenarioId: string) => Promise<Transaction | null>;
  injectCustomTransaction: (params: {
    customerId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    merchant: MerchantInfo;
    location: GeoLocation;
    device: DeviceInfo;
  }) => Promise<Transaction | null>;
  handleManualDecision: (
    transactionId: string,
    action: 'MANUAL_APPROVE' | 'MANUAL_BLOCK' | 'RELEASE_HOLD',
    reason: string
  ) => Promise<void>;
  acknowledgeAlert: (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => Promise<void>;
  updateCaseStatus: (
    caseId: string,
    status: CaseStatus,
    noteText?: string,
    assignedAnalyst?: string,
    outcomeNotes?: string
  ) => Promise<void>;
  addCaseNote: (caseId: string, noteText: string) => Promise<void>;
  sendFraudWarning: (params: {
    transactionId: string;
    recipientLabel: string;
    channel: NotificationChannel;
    subject: string;
    message: string;
  }) => Promise<FraudNotificationItem>;
  recordAnalystFeedback: (
    transactionId: string,
    label: 'CONFIRMED_FRAUD' | 'LEGITIMATE' | 'NEEDS_FURTHER_REVIEW',
    notes: string
  ) => void;
  createManagedUser: (params: {
    email: string;
    displayName: string;
    password: string;
    role: UserRole;
  }) => Promise<ManagedUser>;
  updateManagedUser: (
    userId: number,
    updates: { role?: UserRole; isActive?: boolean; permissions?: string[] }
  ) => Promise<ManagedUser>;
  resetManagedUserAccess: (userId: number, newPassword: string) => Promise<void>;
  clearLiveTransactions: () => void;
  isDemoTourActive: boolean;
  setIsDemoTourActive: (active: boolean) => void;
  demoTourStep: number;
  setDemoTourStep: (step: number) => void;
  activeAttackAlert: { message: string; severity: string; scenarioName: string } | null;
  dismissAttackAlert: () => void;
  preselectedWarningTxId: string | null;
  setPreselectedWarningTxId: (txId: string | null) => void;
}

const FraudShieldContext = createContext<FraudShieldContextType | undefined>(undefined);

export const FraudShieldProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authToken, currentUser } = useAuth();

  const [activeTab, setActiveTabState] = useState<NavigationPage>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [customers] = useState<CustomerBehavioralProfile[]>(SEED_CUSTOMERS);
  const [alerts, setAlerts] = useState<FraudAlertItem[]>([]);
  const [cases, setCases] = useState<FraudCase[]>([]);
  const [fraudNotifications, setFraudNotifications] = useState<FraudNotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [attackScenarios] = useState<AttackScenario[]>(SEED_ATTACK_SCENARIOS);
  const [sensitivityConfig, setSensitivityConfig] = useState<SensitivityConfig>(DEFAULT_SENSITIVITY);
  const [capabilities, setCapabilities] = useState<ServerCapabilities>({
    geminiConfigured: false,
    emailProviderConfigured: false,
    smsProviderConfigured: false,
    paymentSandboxMode: 'SIMULATED',
  });
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);
  const [isDemoTourActive, setIsDemoTourActive] = useState<boolean>(false);
  const [demoTourStep, setDemoTourStep] = useState<number>(0);
  const [activeAttackAlert, setActiveAttackAlert] = useState<{
    message: string;
    severity: string;
    scenarioName: string;
  } | null>(null);
  const [preselectedWarningTxId, setPreselectedWarningTxId] = useState<string | null>(null);

  const userRole: UserRole = currentUser?.role || 'VIEWER';
  const userPermissions: string[] = currentUser?.permissions || [];

  const can = useCallback(
    (permission: Permission) => hasClientPermission(userRole, userPermissions, permission),
    [userRole, userPermissions]
  );

  const setActiveTab = useCallback(
    (tab: NavigationPage) => {
      setActiveTabState(tab);
    },
    []
  );

  // Redirect to overview if current user's role cannot access current tab
  useEffect(() => {
    if (currentUser && !canAccessPage(currentUser.role, currentUser.permissions, activeTab)) {
      setActiveTabState('overview');
    }
  }, [currentUser, activeTab]);

  const dismissAttackAlert = useCallback(() => setActiveAttackAlert(null), []);
  const toggleLiveStream = useCallback(() => setIsLiveStreaming((prev) => !prev), []);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    }),
    [authToken]
  );

  const reloadWorkspace = useCallback(async () => {
    if (!authToken) return;
    setIsBootstrapping(true);
    setBootstrapError(null);
    try {
      const res = await fetch('/api/bootstrap', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to load telemetry (${res.status})`);
      }
      const data = await res.json();
      setTransactions(data.transactions || []);
      setAlerts(data.alerts || []);
      setCases(data.cases || []);
      setFraudNotifications(data.notifications || []);
      setAuditLogs(data.auditLogs || []);
      setManagedUsers(data.users || []);
      if (data.rulesConfig) setSensitivityConfig(data.rulesConfig);
      if (data.capabilities) setCapabilities(data.capabilities);
    } catch (err) {
      setBootstrapError(err instanceof Error ? err.message : 'Unable to connect to RESQ AI backend.');
    } finally {
      setIsBootstrapping(false);
    }
  }, [authToken]);

  useEffect(() => {
    if (authToken && currentUser) {
      void reloadWorkspace();
    }
  }, [authToken, currentUser?.uid, reloadWorkspace]);

  // Real-time Socket.IO subscription
  useEffect(() => {
    if (!authToken) return;

    const socket: Socket = io('/', {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
    });

    socket.on('transaction:created', (tx: Transaction) => {
      setTransactions((prev) => (prev.some((t) => t.id === tx.id) ? prev : [tx, ...prev]));
    });

    socket.on('transaction:updated', (tx: Transaction) => {
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? tx : t)));
      setSelectedTransaction((prev) => (prev && prev.id === tx.id ? tx : prev));
    });

    socket.on('alert:created', (alert: FraudAlertItem) => {
      setAlerts((prev) => (prev.some((a) => a.id === alert.id) ? prev : [alert, ...prev]));
    });

    socket.on('alert:updated', (alert: FraudAlertItem) => {
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));
    });

    socket.on('case:created', (c: FraudCase) => {
      setCases((prev) => (prev.some((item) => item.id === c.id) ? prev : [c, ...prev]));
    });

    socket.on('case:updated', (c: FraudCase) => {
      setCases((prev) => prev.map((item) => (item.id === c.id ? c : item)));
    });

    socket.on('notification:created', (notif: FraudNotificationItem) => {
      setFraudNotifications((prev) =>
        prev.some((n) => n.id === notif.id) ? prev : [notif, ...prev]
      );
    });

    socket.on('audit:created', (log: AuditLog) => {
      setAuditLogs((prev) => (prev.some((l) => l.id === log.id) ? prev : [log, ...prev]));
    });

    socket.on('rules:updated', (rules: SensitivityConfig) => {
      setSensitivityConfig(rules);
    });

    return () => {
      socket.disconnect();
    };
  }, [authToken]);

  // Optional live visual radar pulse (client-only synthetic radar stream when explicitly toggled ON)
  useEffect(() => {
    if (!isLiveStreaming) return;

    const intervalTime = Math.max(1800, Math.floor(4500 / streamSpeed));
    const timer = setInterval(() => {
      const isAnomaly = Math.random() < 0.14;
      const cust = customers[Math.floor(Math.random() * customers.length)];
      const safeMerchantList = [
        SEED_MERCHANTS.amazon_in,
        SEED_MERCHANTS.swiggy,
        SEED_MERCHANTS.croma,
        SEED_MERCHANTS.makemytrip,
        SEED_MERCHANTS.tata_power,
      ];
      const merchant = isAnomaly
        ? SEED_MERCHANTS.binance_p2p
        : safeMerchantList[Math.floor(Math.random() * safeMerchantList.length)];
      const amount = isAnomaly
        ? Math.round(cust.typicalAmountMax * 2.6 + Math.random() * 14000)
        : Math.round(cust.typicalAmountMin + Math.random() * (cust.typicalAmountMax - cust.typicalAmountMin));

      const deviceId = isAnomaly ? 'DEV-UNRECOGNIZED-X86' : cust.trustedDeviceIds[0];
      const device: DeviceInfo = {
        deviceId: userRole === 'VIEWER' ? `DEV-***${deviceId.slice(-4)}` : deviceId,
        fingerprintHash: userRole === 'VIEWER' ? 'fp_redacted' : `fp_${deviceId.toLowerCase()}`,
        deviceType: isAnomaly ? 'emulator' : 'mobile_android',
        os: isAnomaly ? 'Android 10 (VirtualBox)' : 'Android 14',
        browser: 'Chrome 125.0',
        isEmulator: isAnomaly,
        isJailbroken: false,
        trustScore: isAnomaly ? 35 : 96,
        firstSeen: new Date().toISOString(),
      };

      const location: GeoLocation = isAnomaly
        ? {
            city: 'Amsterdam',
            country: 'Netherlands',
            countryCode: 'NL',
            latitude: 52.3676,
            longitude: 4.9041,
            ipAddress: userRole === 'VIEWER' ? '***.***.***.***' : '194.26.135.12',
            vpnDetected: true,
          }
        : {
            city: cust.commonLocations[0].city,
            country: cust.commonLocations[0].country,
            countryCode: 'IN',
            latitude: 17.385,
            longitude: 78.4867,
            ipAddress: userRole === 'VIEWER' ? '***.***.***.***' : '103.24.12.8',
            vpnDetected: false,
          };

      const evalResult = evaluateTransactionRisk(
        {
          amount,
          paymentMethod: cust.frequentPaymentMethods[0] || 'UPI',
          merchant,
          location,
          device,
          timestamp: new Date().toISOString(),
          customerProfile: cust,
          recentTransactionsCountLastHour: isAnomaly ? 5 : 1,
        },
        sensitivityConfig
      );

      let status: Transaction['status'] = 'APPROVED';
      if (evalResult.riskLevel === 'CRITICAL') status = 'BLOCKED';
      else if (evalResult.riskLevel === 'HIGH') status = 'HELD_FOR_REVIEW';
      else if (evalResult.riskLevel === 'MEDIUM') status = 'OTP_PENDING';

      const pulseTx: Transaction = {
        id: `TXN-STREAM-${Date.now().toString().slice(-5)}`,
        customerId: userRole === 'VIEWER' ? `ANON-${cust.customerId.slice(-4)}` : cust.customerId,
        customerName: userRole === 'VIEWER' ? `Account Holder #${cust.customerId.slice(-4)}` : cust.name,
        amount,
        currency: 'INR',
        paymentMethod: cust.frequentPaymentMethods[0] || 'UPI',
        merchant,
        location,
        device,
        timestamp: new Date().toISOString(),
        status,
        riskEvaluation: evalResult,
        isSimulated: true,
      };

      setTransactions((prev) => [pulseTx, ...prev].slice(0, 200));
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isLiveStreaming, streamSpeed, customers, sensitivityConfig, userRole]);

  const stats = useMemo(() => {
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
    const processedToday = transactions.length;
    const successfulCount = transactions.filter(
      (t) => t.status === 'APPROVED' || t.status === 'MANUALLY_RELEASED'
    ).length;
    const suspiciousCount = transactions.filter(
      (t) =>
        t.status === 'HELD_FOR_REVIEW' ||
        t.status === 'OTP_PENDING' ||
        t.riskEvaluation.riskLevel === 'HIGH'
    ).length;
    const blockedCount = transactions.filter(
      (t) => t.status === 'BLOCKED' || t.status === 'MANUALLY_BLOCKED'
    ).length;

    const fraudAttempts = transactions.filter(
      (t) => t.riskEvaluation.riskLevel === 'CRITICAL' || t.riskEvaluation.riskLevel === 'HIGH'
    );
    const preventionRate =
      fraudAttempts.length > 0
        ? parseFloat(
            (
              (transactions.filter(
                (t) =>
                  (t.riskEvaluation.riskLevel === 'CRITICAL' || t.riskEvaluation.riskLevel === 'HIGH') &&
                  (t.status === 'BLOCKED' ||
                    t.status === 'MANUALLY_BLOCKED' ||
                    t.status === 'HELD_FOR_REVIEW')
              ).length /
                fraudAttempts.length) *
              100
            ).toFixed(1)
          )
        : 98.4;

    const lossesPrevented = transactions
      .filter((t) => t.status === 'BLOCKED' || t.status === 'MANUALLY_BLOCKED')
      .reduce((sum, t) => sum + t.amount, 0);

    const avgRiskScore = Math.round(
      transactions.reduce((sum, t) => sum + t.riskEvaluation.riskScore, 0) /
        Math.max(1, transactions.length)
    );
    const overallRiskPercentage = Math.round(
      (fraudAttempts.length / Math.max(1, transactions.length)) * 100
    );
    const heldReviewCount = transactions.filter(
      (t) => t.status === 'HELD_FOR_REVIEW' || t.status === 'OTP_PENDING'
    ).length;
    const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

    return {
      totalVolume,
      processedToday,
      successfulCount,
      suspiciousCount,
      blockedCount,
      fraudAttemptsDetected: fraudAttempts.length,
      preventionRate: Math.min(100, Math.max(85, preventionRate)),
      lossesPrevented,
      avgRiskScore,
      overallRiskPercentage,
      highRiskCount: fraudAttempts.length,
      heldReviewCount,
      activeAlertsCount,
    };
  }, [transactions, alerts]);

  const modelMetrics = useMemo(() => {
    return {
      ...SEED_MODEL_METRICS,
      totalEvaluated:
        SEED_MODEL_METRICS.totalEvaluated + Math.max(0, transactions.length - SEED_TRANSACTIONS.length),
      truePositives:
        SEED_MODEL_METRICS.truePositives +
        transactions.filter((t) => t.isSimulatedAttack && t.status === 'BLOCKED').length,
    };
  }, [transactions]);

  const processPayment = useCallback(
    async (payload: ProcessPaymentPayload): Promise<ProcessPaymentResult> => {
      const res = await fetch('/api/transactions/process', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process payment');
      }
      setTransactions((prev) =>
        prev.some((t) => t.id === data.transaction.id) ? prev : [data.transaction, ...prev]
      );
      if (data.alert) {
        setAlerts((prev) => (prev.some((a) => a.id === data.alert.id) ? prev : [data.alert, ...prev]));
      }
      if (data.case) {
        setCases((prev) => (prev.some((c) => c.id === data.case.id) ? prev : [data.case, ...prev]));
      }
      return data;
    },
    [authHeaders]
  );

  const triggerAttackScenario = useCallback(
    async (scenarioId: string): Promise<Transaction | null> => {
      const scenario = attackScenarios.find((s) => s.id === scenarioId) || attackScenarios[0];
      const customer = customers.find((c) => c.customerId === scenario.targetVictimId) || customers[0];
      const p = scenario.simulatedPayload;

      try {
        const result = await processPayment({
          customerId: customer.customerId,
          senderName: customer.name,
          senderAccountMasked: `XXXX-${customer.customerId.slice(-4)}`,
          recipientName: p.merchant?.name || SEED_MERCHANTS.binance_p2p.name,
          recipientAccountMasked: p.merchant?.merchantId || 'MCH-OFFSHORE',
          amount: p.amount ?? 50000,
          paymentMethod: p.paymentMethod ?? 'UPI',
          description: `Simulated Threat Scenario: ${scenario.name}`,
          merchantCategory: p.merchant?.category || 'crypto_exchange',
          merchantRiskTier: p.merchant?.riskTier || 'HIGH',
          city: p.location?.city || 'Dubai',
          country: p.location?.country || 'United Arab Emirates',
          countryCode: p.location?.countryCode || 'AE',
          latitude: p.location?.latitude ?? 25.2048,
          longitude: p.location?.longitude ?? 55.2708,
          ipAddress: p.location?.ipAddress || '185.191.171.1',
          vpnDetected: p.location?.vpnDetected ?? true,
          isEmulator: p.device?.isEmulator ?? true,
          unfamiliarDevice: true,
          recentVelocity: 8,
          failedAttemptsPrior: 3,
          simulateImpossibleTravel: scenario.id === 'SCENARIO-IMPOSSIBLE-TRAVEL',
          isSimulatedAttack: true,
          attackType: scenario.name,
        });

        setActiveAttackAlert({
          scenarioName: scenario.name,
          severity: scenario.severity,
          message: `ALERT: ${scenario.name} launched! Transaction ${result.transaction.id} for ₹${result.transaction.amount.toLocaleString()} -> ${result.transaction.status} (Score: ${result.transaction.riskEvaluation.riskScore}/100).`,
        });

        return result.transaction;
      } catch (err) {
        console.error('Attack simulation failed:', err);
        return null;
      }
    },
    [attackScenarios, customers, processPayment]
  );

  const injectCustomTransaction = useCallback(
    async (params: {
      customerId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      merchant: MerchantInfo;
      location: GeoLocation;
      device: DeviceInfo;
    }): Promise<Transaction | null> => {
      const cust = customers.find((c) => c.customerId === params.customerId) || customers[0];
      try {
        const result = await processPayment({
          customerId: cust.customerId,
          senderName: cust.name,
          senderAccountMasked: `XXXX-${cust.customerId.slice(-4)}`,
          recipientName: params.merchant.name,
          recipientAccountMasked: params.merchant.merchantId,
          amount: params.amount,
          paymentMethod: params.paymentMethod,
          description: `What-If Scenario Evaluation (${params.merchant.name})`,
          merchantCategory: params.merchant.category,
          merchantRiskTier: params.merchant.riskTier,
          city: params.location.city,
          country: params.location.country,
          countryCode: params.location.countryCode,
          latitude: params.location.latitude,
          longitude: params.location.longitude,
          ipAddress: params.location.ipAddress,
          vpnDetected: params.location.vpnDetected,
          isEmulator: params.device.isEmulator,
          unfamiliarDevice: !cust.trustedDeviceIds.includes(params.device.deviceId),
        });
        return result.transaction;
      } catch (err) {
        console.error('Custom transaction evaluation error:', err);
        return null;
      }
    },
    [customers, processPayment]
  );

  const handleManualDecision = useCallback(
    async (
      transactionId: string,
      action: 'MANUAL_APPROVE' | 'MANUAL_BLOCK' | 'RELEASE_HOLD',
      reason: string
    ) => {
      const res = await fetch(`/api/transactions/${transactionId}/decision`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply decision');
      }
      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? data.transaction : t)));
      setSelectedTransaction((prev) =>
        prev && prev.id === transactionId ? data.transaction : prev
      );
    },
    [authHeaders]
  );

  const acknowledgeAlert = useCallback(
    async (alertId: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
      const res = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update alert');
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? data.alert : a)));
    },
    [authHeaders]
  );

  const updateCaseStatus = useCallback(
    async (
      caseId: string,
      status: CaseStatus,
      noteText?: string,
      assignedAnalyst?: string,
      outcomeNotes?: string
    ) => {
      const res = await fetch(`/api/investigations/${caseId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status, noteText, assignedAnalyst, outcomeNotes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update investigation case');
      setCases((prev) => prev.map((c) => (c.id === caseId ? data.case : c)));
    },
    [authHeaders]
  );

  const addCaseNote = useCallback(
    async (caseId: string, noteText: string) => {
      const res = await fetch(`/api/investigations/${caseId}/notes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ text: noteText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to add note');
      setCases((prev) => prev.map((c) => (c.id === caseId ? data.case : c)));
    },
    [authHeaders]
  );

  const sendFraudWarning = useCallback(
    async (params: {
      transactionId: string;
      recipientLabel: string;
      channel: NotificationChannel;
      subject: string;
      message: string;
    }): Promise<FraudNotificationItem> => {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send fraud warning');
      setFraudNotifications((prev) =>
        prev.some((n) => n.id === data.notification.id) ? prev : [data.notification, ...prev]
      );
      return data.notification;
    },
    [authHeaders]
  );

  const updateSensitivityConfig = useCallback(
    async (newConfig: Partial<SensitivityConfig>) => {
      const merged = { ...sensitivityConfig, ...newConfig };
      const res = await fetch('/api/rules', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(merged),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update rules configuration');
      setSensitivityConfig(data.rulesConfig);
    },
    [authHeaders, sensitivityConfig]
  );

  const recordAnalystFeedback = useCallback(
    (
      transactionId: string,
      label: 'CONFIRMED_FRAUD' | 'LEGITIMATE' | 'NEEDS_FURTHER_REVIEW',
      notes: string
    ) => {
      const tx = transactions.find((t) => t.id === transactionId);
      if (!tx) return;
      const newLog: AuditLog = {
        id: `LOG-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: currentUser?.displayName || 'Analyst',
        role: userRole,
        action: 'FEEDBACK_LABEL_ASSIGNED',
        targetId: transactionId,
        targetType: 'TRANSACTION',
        details: `Label [${label}] recorded. ${notes}`,
        ip: '127.0.0.1',
      };
      setAuditLogs((prev) => [newLog, ...prev]);
    },
    [transactions, currentUser, userRole]
  );

  const createManagedUser = useCallback(
    async (params: {
      email: string;
      displayName: string;
      password: string;
      role: UserRole;
    }): Promise<ManagedUser> => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(params),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      setManagedUsers((prev) => [...prev, data.user]);
      return data.user;
    },
    [authHeaders]
  );

  const updateManagedUser = useCallback(
    async (
      userId: number,
      updates: { role?: UserRole; isActive?: boolean; permissions?: string[] }
    ): Promise<ManagedUser> => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updates),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update user');
      setManagedUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      return data.user;
    },
    [authHeaders]
  );

  const resetManagedUserAccess = useCallback(
    async (userId: number, newPassword: string) => {
      const res = await fetch(`/api/users/${userId}/reset-access`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to reset user password');
    },
    [authHeaders]
  );

  const clearLiveTransactions = useCallback(() => {
    void reloadWorkspace();
  }, [reloadWorkspace]);

  return (
    <FraudShieldContext.Provider
      value={{
        activeTab,
        setActiveTab,
        transactions,
        customers,
        alerts,
        cases,
        fraudNotifications,
        auditLogs,
        managedUsers,
        attackScenarios,
        sensitivityConfig,
        capabilities,
        isBootstrapping,
        bootstrapError,
        reloadWorkspace,
        updateSensitivityConfig,
        selectedTransaction,
        setSelectedTransaction,
        isLiveStreaming,
        streamSpeed,
        toggleLiveStream,
        setStreamSpeed,
        userRole,
        userPermissions,
        can,
        modelMetrics,
        stats,
        processPayment,
        triggerAttackScenario,
        injectCustomTransaction,
        handleManualDecision,
        acknowledgeAlert,
        updateCaseStatus,
        addCaseNote,
        sendFraudWarning,
        recordAnalystFeedback,
        createManagedUser,
        updateManagedUser,
        resetManagedUserAccess,
        clearLiveTransactions,
        isDemoTourActive,
        setIsDemoTourActive,
        demoTourStep,
        setDemoTourStep,
        activeAttackAlert,
        dismissAttackAlert,
        preselectedWarningTxId,
        setPreselectedWarningTxId,
      }}
    >
      {children}
    </FraudShieldContext.Provider>
  );
};

export const useFraudShield = () => {
  const context = useContext(FraudShieldContext);
  if (!context) {
    throw new Error('useFraudShield must be used within a FraudShieldProvider');
  }
  return context;
};
