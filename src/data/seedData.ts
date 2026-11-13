/**
 * FRAUDSHIELD AI - High-Fidelity Synthetic Demonstration Dataset
 * Contains 100+ realistic financial transactions, 6 customer profiles with behavioral baselines,
 * device registries, merchants, attack scenarios, and network relationship graphs.
 */

import {
  CustomerBehavioralProfile,
  DeviceInfo,
  GeoLocation,
  MerchantInfo,
  PaymentMethod,
  Transaction,
  FraudCase,
  AuditLog,
  AttackScenario,
  NetworkNode,
  NetworkEdge,
  ModelMetrics,
  TransactionStatus
} from '../types';
import { evaluateTransactionRisk } from '../engine/fraudEngine';

// Customer Profiles with distinct behavioral baselines
export const SEED_CUSTOMERS: CustomerBehavioralProfile[] = [
  {
    customerId: 'CUST-8021',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@techcorp.in',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    joinedDate: '2023-01-15',
    totalTransactionsCount: 342,
    typicalAmountMin: 150,
    typicalAmountMax: 3500,
    averageAmount: 1200,
    standardDeviationAmount: 600,
    dailyTransactionVelocityLimit: 6,
    preferredHoursRange: [8, 23],
    commonLocations: [
      { city: 'Hyderabad', country: 'India', freq: 0.85 },
      { city: 'Bengaluru', country: 'India', freq: 0.15 }
    ],
    trustedDeviceIds: ['DEV-IPHONE15-HYD', 'DEV-MACBOOK-HYD'],
    preferredCategories: ['groceries', 'utilities', 'electronics', 'e_commerce'],
    frequentPaymentMethods: ['UPI', 'CREDIT_CARD'],
    riskTier: 'TRUSTED'
  },
  {
    customerId: 'CUST-4192',
    name: 'Priya Patel',
    email: 'priya.patel@horizonfin.com',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80',
    joinedDate: '2022-08-10',
    totalTransactionsCount: 512,
    typicalAmountMin: 500,
    typicalAmountMax: 12000,
    averageAmount: 4200,
    standardDeviationAmount: 2100,
    dailyTransactionVelocityLimit: 8,
    preferredHoursRange: [7, 22],
    commonLocations: [
      { city: 'Mumbai', country: 'India', freq: 0.90 },
      { city: 'Pune', country: 'India', freq: 0.10 }
    ],
    trustedDeviceIds: ['DEV-S24ULTRA-MUM', 'DEV-DELLXPS-MUM'],
    preferredCategories: ['travel', 'luxury_goods', 'e_commerce', 'groceries'],
    frequentPaymentMethods: ['CREDIT_CARD', 'UPI', 'NET_BANKING'],
    riskTier: 'TRUSTED'
  },
  {
    customerId: 'CUST-9314',
    name: 'Vikram Malhotra',
    email: 'v.malhotra@malhotralogistics.org',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
    joinedDate: '2023-04-12',
    totalTransactionsCount: 188,
    typicalAmountMin: 2000,
    typicalAmountMax: 25000,
    averageAmount: 8500,
    standardDeviationAmount: 4000,
    dailyTransactionVelocityLimit: 5,
    preferredHoursRange: [9, 21],
    commonLocations: [
      { city: 'New Delhi', country: 'India', freq: 0.95 }
    ],
    trustedDeviceIds: ['DEV-THINKPAD-DEL'],
    preferredCategories: ['utilities', 'e_commerce', 'electronics'],
    frequentPaymentMethods: ['NET_BANKING', 'CREDIT_CARD'],
    riskTier: 'STANDARD'
  },
  {
    customerId: 'CUST-5510',
    name: 'Sarah Jenkins',
    email: 'sjenkins@globalventures.co.uk',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    joinedDate: '2023-11-01',
    totalTransactionsCount: 94,
    typicalAmountMin: 50,
    typicalAmountMax: 1500,
    averageAmount: 320,
    standardDeviationAmount: 180,
    dailyTransactionVelocityLimit: 4,
    preferredHoursRange: [8, 23],
    commonLocations: [
      { city: 'London', country: 'United Kingdom', freq: 0.92 }
    ],
    trustedDeviceIds: ['DEV-PIXEL8-LDN'],
    preferredCategories: ['e_commerce', 'travel', 'utilities'],
    frequentPaymentMethods: ['CREDIT_CARD', 'DIGITAL_WALLET'],
    riskTier: 'TRUSTED'
  },
  {
    customerId: 'CUST-7733',
    name: 'Rohan Deshmukh',
    email: 'rohan.d@student.nitk.ac.in',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
    joinedDate: '2024-02-19',
    totalTransactionsCount: 65,
    typicalAmountMin: 30,
    typicalAmountMax: 800,
    averageAmount: 210,
    standardDeviationAmount: 120,
    dailyTransactionVelocityLimit: 10,
    preferredHoursRange: [10, 24],
    commonLocations: [
      { city: 'Mangalore', country: 'India', freq: 0.70 },
      { city: 'Bengaluru', country: 'India', freq: 0.30 }
    ],
    trustedDeviceIds: ['DEV-ONEPLUS11-BLR'],
    preferredCategories: ['groceries', 'e_commerce'],
    frequentPaymentMethods: ['UPI'],
    riskTier: 'STANDARD'
  },
  {
    customerId: 'CUST-1102',
    name: 'Elena Rostova',
    email: 'erostova@fintech-ventures.sg',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    joinedDate: '2023-09-14',
    totalTransactionsCount: 220,
    typicalAmountMin: 800,
    typicalAmountMax: 18000,
    averageAmount: 5100,
    standardDeviationAmount: 2800,
    dailyTransactionVelocityLimit: 7,
    preferredHoursRange: [9, 22],
    commonLocations: [
      { city: 'Singapore', country: 'Singapore', freq: 0.95 }
    ],
    trustedDeviceIds: ['DEV-MACBOOKPRO-SG'],
    preferredCategories: ['travel', 'electronics', 'e_commerce'],
    frequentPaymentMethods: ['CREDIT_CARD', 'DIGITAL_WALLET'],
    riskTier: 'WATCHLIST'
  }
];

// Merchants Catalog
export const SEED_MERCHANTS: Record<string, MerchantInfo> = {
  amazon_in: {
    merchantId: 'MCH-AMZN-IN',
    name: 'Amazon India Retailing',
    category: 'e_commerce',
    riskTier: 'LOW',
    flaggedCount: 1
  },
  swiggy: {
    merchantId: 'MCH-SWIG-HYD',
    name: 'Swiggy Food & Instamart',
    category: 'groceries',
    riskTier: 'LOW',
    flaggedCount: 0
  },
  croma: {
    merchantId: 'MCH-CROM-RET',
    name: 'Croma Electronics Retail',
    category: 'electronics',
    riskTier: 'LOW',
    flaggedCount: 2
  },
  makemytrip: {
    merchantId: 'MCH-MMTRIP-DEL',
    name: 'MakeMyTrip Holidays',
    category: 'travel',
    riskTier: 'LOW',
    flaggedCount: 3
  },
  tata_power: {
    merchantId: 'MCH-TATAPOW',
    name: 'Tata Power Utilities',
    category: 'utilities',
    riskTier: 'LOW',
    flaggedCount: 0
  },
  binance_p2p: {
    merchantId: 'MCH-BIN-P2P',
    name: 'Binance P2P Escrow Offshore',
    category: 'crypto_exchange',
    riskTier: 'HIGH',
    flaggedCount: 24
  },
  dark_silk_goods: {
    merchantId: 'MCH-SHD-SILK',
    name: 'Apex Global Trade LLC (Seychelles)',
    category: 'luxury_goods',
    riskTier: 'PROHIBITED',
    flaggedCount: 47
  },
  micro_test_pay: {
    merchantId: 'MCH-TST-STRIPE',
    name: 'QuickPay Micro-SaaS Gateway',
    category: 'e_commerce',
    riskTier: 'HIGH',
    flaggedCount: 18
  },
  casino_royal: {
    merchantId: 'MCH-CSN-BET',
    name: 'BetSpin Offshore Casino Curacao',
    category: 'gambling',
    riskTier: 'HIGH',
    flaggedCount: 32
  }
};

// Known Devices Catalog
export const SEED_DEVICES: Record<string, DeviceInfo> = {
  iphone15_aarav: {
    deviceId: 'DEV-IPHONE15-HYD',
    fingerprintHash: 'fp_a7b9c1d3e5f2a1b0',
    deviceType: 'mobile_ios',
    os: 'iOS 17.5.1',
    browser: 'Mobile Safari 17.5',
    isEmulator: false,
    isJailbroken: false,
    trustScore: 98,
    firstSeen: '2023-01-20'
  },
  macbook_aarav: {
    deviceId: 'DEV-MACBOOK-HYD',
    fingerprintHash: 'fp_c3d4e5f6a7b8c9d0',
    deviceType: 'desktop_mac',
    os: 'macOS Sonoma 14.4',
    browser: 'Chrome 125.0',
    isEmulator: false,
    isJailbroken: false,
    trustScore: 95,
    firstSeen: '2023-02-15'
  },
  s24_priya: {
    deviceId: 'DEV-S24ULTRA-MUM',
    fingerprintHash: 'fp_e1f2a3b4c5d6e7f8',
    deviceType: 'mobile_android',
    os: 'Android 14 (OneUI 6.1)',
    browser: 'Chrome Mobile 124.0',
    isEmulator: false,
    isJailbroken: false,
    trustScore: 97,
    firstSeen: '2023-03-01'
  },
  rogue_emulator: {
    deviceId: 'DEV-NOX-EMU-ROOT',
    fingerprintHash: 'fp_9999_spoof_x86_arm',
    deviceType: 'emulator',
    os: 'Android 11 (NoxPlayer 7.0.5)',
    browser: 'HeadlessChrome / Puppeteer',
    isEmulator: true,
    isJailbroken: true,
    trustScore: 12,
    firstSeen: '2024-11-01'
  },
  compromised_mule_phone: {
    deviceId: 'DEV-REDMI-MULE-BOT',
    fingerprintHash: 'fp_4422_multiact_bot',
    deviceType: 'mobile_android',
    os: 'Android 12 (Rooted Magisk)',
    browser: 'Bromite Custom Webview',
    isEmulator: false,
    isJailbroken: true,
    trustScore: 18,
    firstSeen: '2024-10-15'
  },
  vpn_laptop_scammer: {
    deviceId: 'DEV-TOR-LAPTOP-01',
    fingerprintHash: 'fp_tor_exit_node_66b',
    deviceType: 'linux_workstation',
    os: 'Kali Linux 2024.1',
    browser: 'Firefox ESR (Tor Browser)',
    isEmulator: false,
    isJailbroken: false,
    trustScore: 22,
    firstSeen: '2024-11-05'
  }
};

// Attack Scenarios for the dedicated Demonstration Laboratory
export const SEED_ATTACK_SCENARIOS: AttackScenario[] = [
  {
    id: 'SCENARIO-ATO',
    name: 'Account Takeover (ATO) & Sudden Liquidation',
    description: 'Fraudster compromises Aarav Sharma credentials, logs in via an untrusted Nox Android emulator from a VPN in Moscow, and attempts an immediate ₹85,000 crypto drain.',
    severity: 'CRITICAL',
    icon: 'ShieldAlert',
    targetVictimId: 'CUST-8021',
    simulatedPayload: {
      amount: 85000,
      paymentMethod: 'UPI',
      merchant: SEED_MERCHANTS.binance_p2p,
      location: {
        city: 'Moscow',
        country: 'Russian Federation',
        countryCode: 'RU',
        latitude: 55.7558,
        longitude: 37.6173,
        ipAddress: '185.220.101.42',
        vpnDetected: true
      },
      device: SEED_DEVICES.rogue_emulator,
      timestamp: new Date().toISOString()
    },
    expectedTriggeredRules: ['SIG_AMOUNT_ANOMALY', 'SIG_DEVICE_INTEGRITY', 'SIG_LOCATION_BASELINE', 'SIG_BEHAVIOR_DNA', 'SIG_FAILED_AUTH'],
    explanation: 'Triggered 5 simultaneous high-weight vectors: ₹85k amount is 24x max typical, Nox Android emulator signature, foreign VPN IP, and uncharacteristic high-risk crypto category.'
  },
  {
    id: 'SCENARIO-IMPOSSIBLE-TRAVEL',
    name: 'Impossible Travel (Supersonic Geo Velocity)',
    description: 'Priya Patel completes a regular ₹1,800 payment in Mumbai. Just 14 minutes later, an identical payment authorization appears in London (7,200 km away, requiring 30,800 km/h flight).',
    severity: 'CRITICAL',
    icon: 'PlaneTakeoff',
    targetVictimId: 'CUST-4192',
    simulatedPayload: {
      amount: 48500,
      paymentMethod: 'CREDIT_CARD',
      merchant: SEED_MERCHANTS.dark_silk_goods,
      location: {
        city: 'London',
        country: 'United Kingdom',
        countryCode: 'GB',
        latitude: 51.5074,
        longitude: -0.1278,
        ipAddress: '92.40.180.12',
        vpnDetected: false
      },
      device: SEED_DEVICES.vpn_laptop_scammer,
      timestamp: new Date(Date.now() + 14 * 60 * 1000).toISOString()
    },
    expectedTriggeredRules: ['SIG_IMPOSSIBLE_TRAVEL', 'SIG_LOCATION_BASELINE', 'SIG_MERCHANT_REPUTATION', 'SIG_DEVICE_INTEGRITY'],
    explanation: 'Detected physical distance of 7,200 km traversed in only 14 minutes. Kinematic velocity calculation (30,800 km/h) mathematically proves compromised credentials.'
  },
  {
    id: 'SCENARIO-CARD-TESTING',
    name: 'Automated Bot Micro-Card Testing Burst',
    description: 'Bot army performs rapid succession of 12 micro-transactions (₹25 - ₹49) within 40 seconds to validate stolen card bins before attempting large liquidation.',
    severity: 'HIGH',
    icon: 'Zap',
    targetVictimId: 'CUST-9314',
    simulatedPayload: {
      amount: 35,
      paymentMethod: 'CREDIT_CARD',
      merchant: SEED_MERCHANTS.micro_test_pay,
      location: {
        city: 'Frankfurt',
        country: 'Germany',
        countryCode: 'DE',
        latitude: 50.1109,
        longitude: 8.6821,
        ipAddress: '194.26.29.11',
        vpnDetected: true
      },
      device: SEED_DEVICES.vpn_laptop_scammer,
      timestamp: new Date().toISOString()
    },
    expectedTriggeredRules: ['SIG_AMOUNT_ANOMALY', 'SIG_VELOCITY', 'SIG_LOCATION_BASELINE', 'SIG_MERCHANT_REPUTATION'],
    explanation: 'High velocity micro-testing attack signature detected. Velocity surge exceeded threshold and merchant matches high-dispute test processor.'
  },
  {
    id: 'SCENARIO-STOLEN-DEVICE',
    name: 'Stolen Physical Device Midnight Extraction',
    description: 'Legitimate iPhone 15 stolen at 3:45 AM. Thief immediately bypasses lockscreen and initiates ₹62,000 casino transfer during customer habitual sleep hours.',
    severity: 'HIGH',
    icon: 'SmartphoneNfc',
    targetVictimId: 'CUST-8021',
    simulatedPayload: {
      amount: 62000,
      paymentMethod: 'UPI',
      merchant: SEED_MERCHANTS.casino_royal,
      location: {
        city: 'Hyderabad',
        country: 'India',
        countryCode: 'IN',
        latitude: 17.3850,
        longitude: 78.4867,
        ipAddress: '49.207.198.81',
        vpnDetected: false
      },
      device: SEED_DEVICES.iphone15_aarav,
      timestamp: new Date(new Date().setHours(3, 45, 0, 0)).toISOString()
    },
    expectedTriggeredRules: ['SIG_AMOUNT_ANOMALY', 'SIG_UNUSUAL_TIMING', 'SIG_BEHAVIOR_DNA', 'SIG_MERCHANT_REPUTATION'],
    explanation: 'Even though device fingerprint matches trusted iPhone, circadian timing anomaly (3:45 AM), uncharacteristic casino merchant, and massive 18x amount deviation triggers step-up block.'
  },
  {
    id: 'SCENARIO-COORDINATED-RING',
    name: 'Coordinated Multi-Account Fraud Ring',
    description: 'Syndicate uses a single rooted Android hardware device to siphon funds across 3 different victim bank accounts into a shared offshore merchant shell.',
    severity: 'CRITICAL',
    icon: 'Network',
    targetVictimId: 'CUST-7733',
    simulatedPayload: {
      amount: 42000,
      paymentMethod: 'UPI',
      merchant: SEED_MERCHANTS.dark_silk_goods,
      location: {
        city: 'Dubai',
        country: 'United Arab Emirates',
        countryCode: 'AE',
        latitude: 25.2048,
        longitude: 55.2708,
        ipAddress: '185.191.171.1',
        vpnDetected: true
      },
      device: SEED_DEVICES.compromised_mule_phone,
      timestamp: new Date().toISOString()
    },
    expectedTriggeredRules: ['SIG_GLOBAL_REPUTATION', 'SIG_DEVICE_INTEGRITY', 'SIG_AMOUNT_ANOMALY', 'SIG_MERCHANT_REPUTATION'],
    explanation: 'Device fingerprint DEV-REDMI-MULE-BOT is flagged across 3 other active bank fraud cases. Blacklisted by Collaborative Fraud Fingerprint Syndicate.'
  }
];

// Helper to generate 105 realistic synthetic transactions
function generateSeedTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const baseTime = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago
  
  const paymentMethods: PaymentMethod[] = ['UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'DIGITAL_WALLET'];
  const safeMerchants = [
    SEED_MERCHANTS.amazon_in,
    SEED_MERCHANTS.swiggy,
    SEED_MERCHANTS.croma,
    SEED_MERCHANTS.makemytrip,
    SEED_MERCHANTS.tata_power
  ];

  // 1. Generate 85 realistic legitimate transactions
  for (let i = 1; i <= 85; i++) {
    const cust = SEED_CUSTOMERS[i % SEED_CUSTOMERS.length];
    const merchant = safeMerchants[i % safeMerchants.length];
    const amount = Math.round(
      cust.typicalAmountMin +
      Math.random() * (cust.typicalAmountMax - cust.typicalAmountMin)
    );
    const payMethod = cust.frequentPaymentMethods[i % cust.frequentPaymentMethods.length];
    const locInfo = cust.commonLocations[0];
    const deviceId = cust.trustedDeviceIds[0];
    
    // Create timestamp distributed over past 48 hours
    const txTime = new Date(baseTime + (i * 32 * 60 * 1000) + (Math.random() * 15 * 60 * 1000)).toISOString();
    
    const device: DeviceInfo = {
      deviceId,
      fingerprintHash: `fp_${deviceId.toLowerCase()}_clean`,
      deviceType: deviceId.includes('IPHONE') ? 'mobile_ios' : deviceId.includes('MACBOOK') ? 'desktop_mac' : 'mobile_android',
      os: 'Standard OS',
      browser: 'Standard Browser',
      isEmulator: false,
      isJailbroken: false,
      trustScore: 92 + Math.floor(Math.random() * 8),
      firstSeen: cust.joinedDate
    };

    const location: GeoLocation = {
      city: locInfo.city,
      country: locInfo.country,
      countryCode: locInfo.country === 'India' ? 'IN' : locInfo.country === 'United Kingdom' ? 'GB' : 'SG',
      latitude: locInfo.city === 'Hyderabad' ? 17.3850 : locInfo.city === 'Mumbai' ? 19.0760 : locInfo.city === 'New Delhi' ? 28.6139 : 51.5074,
      longitude: locInfo.city === 'Hyderabad' ? 78.4867 : locInfo.city === 'Mumbai' ? 72.8777 : locInfo.city === 'New Delhi' ? 77.2090 : -0.1278,
      ipAddress: `103.${20 + (i % 50)}.${10 + (i % 80)}.${15 + (i % 200)}`,
      vpnDetected: false
    };

    const evalResult = evaluateTransactionRisk({
      amount,
      paymentMethod: payMethod,
      merchant,
      location,
      device,
      timestamp: txTime,
      customerProfile: cust,
      recentTransactionsCountLastHour: 1,
      failedAttemptsPrior: 0
    });

    transactions.push({
      id: `TXN-2024-${10000 + i}`,
      customerId: cust.customerId,
      customerName: cust.name,
      amount,
      currency: 'INR',
      paymentMethod: payMethod,
      merchant,
      location,
      device,
      timestamp: txTime,
      status: evalResult.riskLevel === 'LOW' ? 'APPROVED' : 'OTP_PENDING',
      riskEvaluation: evalResult
    });
  }

  // 2. Generate 20 confirmed suspicious/fraud transactions with attack signatures
  const attackVariants = [
    {
      cust: SEED_CUSTOMERS[0], // Aarav
      amount: 78500,
      merchant: SEED_MERCHANTS.binance_p2p,
      device: SEED_DEVICES.rogue_emulator,
      loc: { city: 'Moscow', country: 'Russian Federation', countryCode: 'RU', lat: 55.7558, lng: 37.6173, vpn: true },
      method: 'UPI' as PaymentMethod,
      attackName: 'Account Takeover / Emulator Injection'
    },
    {
      cust: SEED_CUSTOMERS[1], // Priya
      amount: 54000,
      merchant: SEED_MERCHANTS.dark_silk_goods,
      device: SEED_DEVICES.vpn_laptop_scammer,
      loc: { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278, vpn: false },
      method: 'CREDIT_CARD' as PaymentMethod,
      attackName: 'Impossible Travel Anomaly'
    },
    {
      cust: SEED_CUSTOMERS[2], // Vikram
      amount: 32,
      merchant: SEED_MERCHANTS.micro_test_pay,
      device: SEED_DEVICES.vpn_laptop_scammer,
      loc: { city: 'Frankfurt', country: 'Germany', countryCode: 'DE', lat: 50.1109, lng: 8.6821, vpn: true },
      method: 'CREDIT_CARD' as PaymentMethod,
      attackName: 'Card Testing Micro Burst'
    },
    {
      cust: SEED_CUSTOMERS[0], // Aarav
      amount: 94000,
      merchant: SEED_MERCHANTS.casino_royal,
      device: SEED_DEVICES.compromised_mule_phone,
      loc: { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708, vpn: true },
      method: 'UPI' as PaymentMethod,
      attackName: 'Coordinated Multi-Account Drain'
    },
    {
      cust: SEED_CUSTOMERS[4], // Rohan
      amount: 38000,
      merchant: SEED_MERCHANTS.dark_silk_goods,
      device: SEED_DEVICES.compromised_mule_phone,
      loc: { city: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lng: 55.2708, vpn: true },
      method: 'UPI' as PaymentMethod,
      attackName: 'Coordinated Multi-Account Drain'
    }
  ];

  for (let j = 0; j < 20; j++) {
    const variant = attackVariants[j % attackVariants.length];
    const txTime = new Date(Date.now() - (j * 45 * 60 * 1000) - (Math.random() * 20 * 60 * 1000)).toISOString();
    
    const location: GeoLocation = {
      city: variant.loc.city,
      country: variant.loc.country,
      countryCode: variant.loc.countryCode,
      latitude: variant.loc.lat,
      longitude: variant.loc.lng,
      ipAddress: `185.${100 + j}.${45 + (j * 2)}.${12 + j}`,
      vpnDetected: variant.loc.vpn
    };

    const prevTxLoc: GeoLocation = {
      city: variant.cust.commonLocations[0].city,
      country: variant.cust.commonLocations[0].country,
      countryCode: 'IN',
      latitude: 17.3850,
      longitude: 78.4867,
      ipAddress: '103.20.10.15'
    };

    const evalResult = evaluateTransactionRisk({
      amount: variant.amount,
      paymentMethod: variant.method,
      merchant: variant.merchant,
      location,
      device: variant.device,
      timestamp: txTime,
      customerProfile: variant.cust,
      recentTransactionsCountLastHour: 6,
      lastKnownTransaction: {
        location: prevTxLoc,
        timestamp: new Date(new Date(txTime).getTime() - 15 * 60 * 1000).toISOString()
      },
      failedAttemptsPrior: 3
    });

    let status: TransactionStatus = 'BLOCKED';
    if (evalResult.decision === 'HOLD_REVIEW') {
      status = 'HELD_FOR_REVIEW';
    } else if (evalResult.decision === 'VERIFY_OTP') {
      status = 'OTP_PENDING';
    }

    transactions.push({
      id: `TXN-2024-${20000 + j}`,
      customerId: variant.cust.customerId,
      customerName: variant.cust.name,
      amount: variant.amount,
      currency: 'INR',
      paymentMethod: variant.method,
      merchant: variant.merchant,
      location,
      device: variant.device,
      timestamp: txTime,
      status,
      riskEvaluation: evalResult,
      isSimulatedAttack: true,
      attackType: variant.attackName,
      notes: [`Flagged by Real-Time FraudShield Engine: Score ${evalResult.riskScore}/100`]
    });
  }

  // Sort descending by timestamp
  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export const SEED_TRANSACTIONS: Transaction[] = generateSeedTransactions();

// Network nodes and edges for the Collaborative Fraud Fingerprint Network
export const SEED_NETWORK_NODES: NetworkNode[] = [
  // Customers
  { id: 'CUST-8021', label: 'Aarav Sharma', type: 'customer', riskScore: 78, isCompromised: true },
  { id: 'CUST-4192', label: 'Priya Patel', type: 'customer', riskScore: 82, isCompromised: true },
  { id: 'CUST-7733', label: 'Rohan Deshmukh', type: 'customer', riskScore: 68, isCompromised: true },
  { id: 'CUST-9314', label: 'Vikram Malhotra', type: 'customer', riskScore: 24, isCompromised: false },
  { id: 'CUST-5510', label: 'Sarah Jenkins', type: 'customer', riskScore: 14, isCompromised: false },
  
  // Devices
  { id: 'DEV-REDMI-MULE-BOT', label: 'Rooted Redmi Mule', type: 'device', riskScore: 94, isCompromised: true },
  { id: 'DEV-NOX-EMU-ROOT', label: 'Nox Android Emulator', type: 'device', riskScore: 92, isCompromised: true },
  { id: 'DEV-TOR-LAPTOP-01', label: 'Tor Exit Node Station', type: 'device', riskScore: 88, isCompromised: true },
  { id: 'DEV-IPHONE15-HYD', label: 'Aarav Trusted iPhone', type: 'device', riskScore: 12, isCompromised: false },
  { id: 'DEV-S24ULTRA-MUM', label: 'Priya Trusted S24', type: 'device', riskScore: 10, isCompromised: false },

  // Merchants
  { id: 'MCH-BIN-P2P', label: 'Binance P2P Escrow', type: 'merchant', riskScore: 85, isCompromised: true },
  { id: 'MCH-SHD-SILK', label: 'Apex Global Trade (Seychelles)', type: 'merchant', riskScore: 98, isCompromised: true },
  { id: 'MCH-CSN-BET', label: 'BetSpin Offshore Casino', type: 'merchant', riskScore: 89, isCompromised: true },
  { id: 'MCH-AMZN-IN', label: 'Amazon India', type: 'merchant', riskScore: 5, isCompromised: false },
  { id: 'MCH-SWIG-HYD', label: 'Swiggy Instamart', type: 'merchant', riskScore: 4, isCompromised: false },

  // Key Transactions
  { id: 'TXN-2024-20000', label: '₹78,500 Drain', type: 'transaction', riskScore: 94, isCompromised: true },
  { id: 'TXN-2024-20003', label: '₹94,000 Siphon', type: 'transaction', riskScore: 96, isCompromised: true },
  { id: 'TXN-2024-20004', label: '₹38,000 Ring Transfer', type: 'transaction', riskScore: 88, isCompromised: true }
];

export const SEED_NETWORK_EDGES: NetworkEdge[] = [
  // Device Sharing Fraud Ring
  { id: 'e1', source: 'CUST-8021', target: 'DEV-REDMI-MULE-BOT', relation: 'Unauthorized Session', isSuspicious: true },
  { id: 'e2', source: 'CUST-7733', target: 'DEV-REDMI-MULE-BOT', relation: 'Unauthorized Session', isSuspicious: true },
  { id: 'e3', source: 'CUST-4192', target: 'DEV-REDMI-MULE-BOT', relation: 'Credential Dump Match', isSuspicious: true },
  { id: 'e4', source: 'DEV-REDMI-MULE-BOT', target: 'MCH-SHD-SILK', relation: 'Rapid Fund Routing', isSuspicious: true },
  { id: 'e5', source: 'DEV-REDMI-MULE-BOT', target: 'MCH-BIN-P2P', relation: 'Crypto Escrow Outflow', isSuspicious: true },

  // Emulator Attack
  { id: 'e6', source: 'CUST-8021', target: 'DEV-NOX-EMU-ROOT', relation: 'Compromised Token', isSuspicious: true },
  { id: 'e7', source: 'DEV-NOX-EMU-ROOT', target: 'TXN-2024-20000', relation: 'Originating Device', isSuspicious: true },
  { id: 'e8', source: 'TXN-2024-20000', target: 'MCH-BIN-P2P', relation: 'Settlement Recipient', isSuspicious: true },

  // Siphon Transactions
  { id: 'e9', source: 'DEV-REDMI-MULE-BOT', target: 'TXN-2024-20003', relation: 'Originating Device', isSuspicious: true },
  { id: 'e10', source: 'DEV-REDMI-MULE-BOT', target: 'TXN-2024-20004', relation: 'Originating Device', isSuspicious: true },
  { id: 'e11', source: 'TXN-2024-20003', target: 'MCH-CSN-BET', relation: 'Offshore Escrow', isSuspicious: true },
  { id: 'e12', source: 'TXN-2024-20004', target: 'MCH-SHD-SILK', relation: 'Shell Merchant', isSuspicious: true },

  // Legitimate relationships
  { id: 'e13', source: 'CUST-8021', target: 'DEV-IPHONE15-HYD', relation: 'Trusted Hardware', isSuspicious: false },
  { id: 'e14', source: 'CUST-4192', target: 'DEV-S24ULTRA-MUM', relation: 'Trusted Hardware', isSuspicious: false },
  { id: 'e15', source: 'CUST-8021', target: 'MCH-SWIG-HYD', relation: 'Frequent Merchant', isSuspicious: false },
  { id: 'e16', source: 'CUST-9314', target: 'MCH-AMZN-IN', relation: 'Verified Checkout', isSuspicious: false }
];

// Seed Fraud Investigation Cases
export const SEED_CASES: FraudCase[] = [
  {
    id: 'CASE-2024-001',
    title: 'Syndicate Device Fingerprint Ring (Redmi Mule)',
    transactionId: 'TXN-2024-20003',
    customerId: 'CUST-8021',
    customerName: 'Aarav Sharma',
    assignedAnalyst: 'Alex Morgan (Senior Risk Architect)',
    priority: 'CRITICAL',
    status: 'UNDER_INVESTIGATION',
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    notes: [
      {
        id: 'n1',
        author: 'Alex Morgan',
        text: 'Device fingerprint DEV-REDMI-MULE-BOT detected executing unauthorized transfers across 3 separate accounts. Forensic IP links to Dubai commercial proxy node.',
        timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      },
      {
        id: 'n2',
        author: 'Alex Morgan',
        text: 'Automated block executed in demo gateway. Contacting customer via secondary out-of-band channel.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ],
    tags: ['Device Ring', 'Rooted Android', 'ATO', 'Offshore Siphon']
  },
  {
    id: 'CASE-2024-002',
    title: 'Impossible Travel Alert: Mumbai -> London (14m Delta)',
    transactionId: 'TXN-2024-20001',
    customerId: 'CUST-4192',
    customerName: 'Priya Patel',
    assignedAnalyst: 'Sophia Chen (Lead Analyst)',
    priority: 'HIGH',
    status: 'NEW',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    notes: [
      {
        id: 'n3',
        author: 'System Auto-Trigger',
        text: 'Calculated kinematic speed exceeds 30,000 km/h between Mumbai terminal swipe and London e-commerce session. Placed in hold review queue.',
        timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
      }
    ],
    tags: ['Impossible Travel', 'Geo Anomaly', 'Credit Card Fraud']
  },
  {
    id: 'CASE-2024-003',
    title: 'Card Testing Micro-Burst at MicroPay Gateway',
    transactionId: 'TXN-2024-20002',
    customerId: 'CUST-9314',
    customerName: 'Vikram Malhotra',
    assignedAnalyst: 'Marcus Vance (Compliance Officer)',
    priority: 'MEDIUM',
    status: 'CONFIRMED_FRAUD',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    notes: [
      {
        id: 'n4',
        author: 'Marcus Vance',
        text: 'Confirmed automated card testing script. Card BIN blocked and new token reissued to customer. Case marked as confirmed fraud.',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString()
      }
    ],
    tags: ['Card Testing', 'Botnet', 'Resolved']
  }
];

// Audit Logs
export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'LOG-901',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    operator: 'Alex Morgan',
    role: 'LEAD_FRAUD_ARCHITECT',
    action: 'FORCE_BLOCK_TRANSACTION',
    targetId: 'TXN-2024-20003',
    targetType: 'TRANSACTION',
    details: 'Analyst manual override: Blocked transaction ₹94,000 and blacklisted device DEV-REDMI-MULE-BOT.',
    ip: '192.168.1.104'
  },
  {
    id: 'LOG-902',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    operator: 'RESQ_AI_AUTO_ENGINE',
    role: 'SYSTEM',
    action: 'AUTO_DECISION_TRIGGERED',
    targetId: 'TXN-2024-20000',
    targetType: 'TRANSACTION',
    details: 'Risk score 94 exceeded critical threshold (80). Action: BLOCK in simulated gateway.',
    ip: '127.0.0.1'
  },
  {
    id: 'LOG-903',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    operator: 'Sophia Chen',
    role: 'SENIOR_RISK_ANALYST',
    action: 'CASE_STATUS_UPDATED',
    targetId: 'CASE-2024-001',
    targetType: 'CASE',
    details: 'Status changed from NEW to UNDER_INVESTIGATION. Priority escalated to CRITICAL.',
    ip: '192.168.1.112'
  },
  {
    id: 'LOG-904',
    timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    operator: 'Alex Morgan',
    role: 'LEAD_FRAUD_ARCHITECT',
    action: 'SENSITIVITY_TUNED',
    targetId: 'CONFIG_DEFAULT',
    targetType: 'CONFIG',
    details: 'Adjusted impossible travel weight from 25 to 30 following coordinated attack test.',
    ip: '192.168.1.104'
  }
];

// Verified Model Performance Metrics
export const SEED_MODEL_METRICS: ModelMetrics = {
  totalEvaluated: 12480,
  truePositives: 412,
  falsePositives: 14,
  trueNegatives: 12048,
  falseNegatives: 6,
  precision: 0.967, // 412 / (412 + 14) = 96.7%
  recall: 0.985,    // 412 / (412 + 6) = 98.5%
  f1Score: 0.976,   // 2 * (P * R) / (P + R) = 97.6%
  falsePositiveRate: 0.00116, // 14 / (12048 + 14) = ~0.11%
  avgLatencyMs: 14.2
};
