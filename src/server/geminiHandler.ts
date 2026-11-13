/**
 * RESQ AI - Server-Side Gemini AI Forensic Investigator & Role-Scoped Intelligence Assistant
 */

import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { UserRole } from '../types/index.ts';

export interface InvestigationRequestPayload {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    customerName: string;
    customerId: string;
    paymentMethod: string;
    timestamp: string;
    merchant: {
      name: string;
      category: string;
      riskTier: string;
    };
    location: {
      city: string;
      country: string;
      vpnDetected?: boolean;
      ipAddress: string;
    };
    device: {
      deviceId: string;
      deviceType: string;
      os: string;
      browser: string;
      isEmulator: boolean;
      isJailbroken: boolean;
      trustScore: number;
    };
    riskEvaluation: {
      riskScore: number;
      riskLevel: string;
      decision: string;
      summary: string;
      recommendation?: string;
      factors: Array<{
        code?: string;
        name: string;
        category: string;
        score: number;
        anomalyDetected: boolean;
        evidence: string;
      }>;
    };
  };
  customerBaseline?: {
    typicalAmountMin: number;
    typicalAmountMax: number;
    averageAmount: number;
    commonLocations: Array<{ city: string; country: string }>;
    preferredHoursRange: [number, number];
  };
  question?: string;
}

export async function generateForensicInvestigation(payload: InvestigationRequestPayload): Promise<{
  executiveSummary: string;
  threatClassification: string;
  strongestSignals: string[];
  investigativeSteps: string[];
  containmentRecommendation: string;
  isAiGenerated: boolean;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  const { transaction, customerBaseline, question } = payload;
  const flaggedFactors = transaction.riskEvaluation.factors.filter((f) => f.anomalyDetected);

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `
You are the Chief Cyber Forensic Investigator at RESQ AI ("Detect. Predict. Prevent. Protect."), an enterprise fintech fraud detection platform.
Analyze this suspicious payment transaction using the provided deterministic risk-engine evidence. Do NOT invent false transaction data or override the calculated risk score (${transaction.riskEvaluation.riskScore}/100, Tier: ${transaction.riskEvaluation.riskLevel}).

=== TRANSACTION DOSSIER ===
Transaction ID: ${transaction.id}
Customer: ${transaction.customerName} (${transaction.customerId})
Amount: ₹${transaction.amount.toLocaleString()} ${transaction.currency}
Payment Method: ${transaction.paymentMethod}
Timestamp: ${transaction.timestamp}
Merchant: ${transaction.merchant.name} (Category: ${transaction.merchant.category}, Risk: ${transaction.merchant.riskTier})
Location: ${transaction.location.city}, ${transaction.location.country} (VPN: ${transaction.location.vpnDetected ? 'YES' : 'NO'}, IP: ${transaction.location.ipAddress})
Device: ${transaction.device.deviceType} on ${transaction.device.os} (Emulator: ${transaction.device.isEmulator}, Jailbroken: ${transaction.device.isJailbroken}, Trust Score: ${transaction.device.trustScore}/100)

=== CUSTOMER BASELINE DNA ===
Typical Amount Range: ₹${customerBaseline?.typicalAmountMin ?? 100} - ₹${customerBaseline?.typicalAmountMax ?? 3000}
Historical Average: ₹${customerBaseline?.averageAmount ?? 1000}
Baseline Locations: ${customerBaseline?.commonLocations?.map((l) => l.city).join(', ') ?? 'India'}
Habitual Hours: ${customerBaseline?.preferredHoursRange?.[0] ?? 9}:00 to ${customerBaseline?.preferredHoursRange?.[1] ?? 22}:00

=== DETERMINISTIC RISK ENGINE FINDINGS ===
Overall Risk Score: ${transaction.riskEvaluation.riskScore}/100 (${transaction.riskEvaluation.riskLevel})
Recommended Decision: ${transaction.riskEvaluation.decision}
Flagged Signals:
${flaggedFactors.map((f) => `- ${f.name} (+${f.score} pts): ${f.evidence}`).join('\n')}

${question ? `Specific Analyst Inquiry: "${question}"` : ''}

Respond in strict JSON with the following structure:
{
  "executiveSummary": "A concise 2-3 sentence forensic appraisal detailing the primary threat mechanism.",
  "threatClassification": "Specific threat category",
  "strongestSignals": ["Top signal 1", "Top signal 2", "Top signal 3"],
  "investigativeSteps": ["Step 1", "Step 2", "Step 3", "Step 4"],
  "containmentRecommendation": "Actionable policy recommendation"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'You are an elite fintech fraud analyst and cybersecurity investigator at RESQ AI. Provide strictly factual, explainable forensic assessments based on the evidence provided.',
        },
      });

      const parsed = JSON.parse(response.text ?? '{}');
      return {
        executiveSummary: parsed.executiveSummary || transaction.riskEvaluation.summary,
        threatClassification:
          parsed.threatClassification || 'Automated Behavioral & Network Anomaly',
        strongestSignals:
          parsed.strongestSignals || flaggedFactors.slice(0, 3).map((f) => f.name),
        investigativeSteps: parsed.investigativeSteps || [
          'Verify device hardware fingerprint against known device syndicates.',
          'Review session IP reputation for Tor/commercial proxy exit nodes.',
          'Contact account holder via registered out-of-band channel.',
          'Inspect related outbound transactions to the same destination recipient.',
        ],
        containmentRecommendation:
          parsed.containmentRecommendation ||
          transaction.riskEvaluation.recommendation ||
          'Hold settlement pending analyst review.',
        isAiGenerated: true,
      };
    } catch (err) {
      console.warn('Gemini API call warning, falling back to deterministic synthesis:', err);
    }
  }

  const topSignals = [...flaggedFactors]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((f) => `${f.name} (+${f.score} pts)`);

  let threatClassification = 'Elevated Risk Vector';
  if (transaction.device.isEmulator) {
    threatClassification = 'Emulator Hardware Spoofing & ATO';
  } else if (flaggedFactors.some((f) => f.code === 'SIG_IMPOSSIBLE_TRAVEL')) {
    threatClassification = 'Supersonic Impossible Travel Anomaly';
  } else if (transaction.amount < 100 && flaggedFactors.some((f) => f.code === 'SIG_VELOCITY')) {
    threatClassification = 'Automated Card Testing Micro-Burst';
  } else if (transaction.riskEvaluation.riskScore >= 80) {
    threatClassification = 'High-Confidence Coordinated Fraud Attempt';
  }

  return {
    executiveSummary: `Transaction ${transaction.id} for ₹${transaction.amount.toLocaleString()} was flagged with risk score ${transaction.riskEvaluation.riskScore}/100. Primary divergence stems from ${flaggedFactors.length} anomalous signal(s) exceeding baseline tolerance.`,
    threatClassification,
    strongestSignals:
      topSignals.length > 0 ? topSignals : ['Transaction Baseline Variance'],
    investigativeSteps: [
      `Review device ID (${transaction.device.deviceId.slice(0, 12)}...) across global consortium for concurrent session hijack.`,
      `Correlate IP ${transaction.location.ipAddress} with recent autonomous system number (ASN) threat feeds.`,
      `Examine customer historical average (₹${customerBaseline?.averageAmount ?? 1000}) vs requested ₹${transaction.amount.toLocaleString()}.`,
      `Initiate simulated step-up verification before releasing settlement authorization.`,
    ],
    containmentRecommendation:
      transaction.riskEvaluation.recommendation ||
      'Initiate simulated step-up verification before releasing settlement authorization.',
    isAiGenerated: false,
  };
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface AssistantChatRequest {
  question: string;
  history?: AssistantHistoryMessage[];
  role: UserRole;
  operatorName: string;
  contextSummary: {
    totalTransactions: number;
    approvedCount: number;
    heldCount: number;
    blockedCount: number;
    totalVolume: number;
    blockedVolume: number;
    avgRiskScore: number;
    activeAlertsCount: number;
    openInvestigationsCount: number;
    paymentMethodBreakdown: Array<{ method: string; count: number; volume: number }>;
    topRiskCorridors: Array<{ location: string; flaggedCount: number }>;
    recentSuspiciousSummaries: Array<{
      id: string;
      amount: number;
      riskScore: number;
      riskLevel: string;
      status: string;
      city: string;
      country: string;
      merchantName: string;
      paymentMethod: string;
      isEmulator: boolean;
      vpnDetected: boolean;
      topSignals: string[];
      summary: string;
      customerLabel: string;
    }>;
    matchedEntities: Array<{
      type: 'TRANSACTION' | 'CASE';
      id: string;
      details: string;
    }>;
    recentInvestigations: Array<{
      id: string;
      title: string;
      status: string;
      priority: string;
      transactionId: string;
    }>;
    activeAlerts: Array<{
      id: string;
      transactionId: string;
      severity: string;
      title: string;
      riskScore: number;
    }>;
    rulesSummary?: {
      blockThreshold: number;
      holdThreshold: number;
      stepUpOtpThreshold: number;
    };
  };
}

function buildFollowUps(role: UserRole, question: string): string[] {
  const lower = question.toLowerCase();
  if (role === 'VIEWER') {
    return [
      'Break down transaction volume by payment rail.',
      'How does RESQ AI calculate the 10-signal risk score?',
      'Which geographic corridors show the highest anomaly activity?',
    ];
  }
  if (lower.includes('case') || lower.includes('investigation')) {
    return [
      'Which blocked transactions need fraud warning alerts?',
      'Analyze impossible travel and emulator patterns in recent blocks.',
      'Summarize exposure by payment method and top risk corridors.',
    ];
  }
  if (role === 'LEAD_FRAUD_ARCHITECT') {
    return [
      'Evaluate whether current block and hold thresholds need tuning.',
      'List critical transactions awaiting Lead Architect review.',
      'Summarize syndicate device fingerprint rings across open cases.',
    ];
  }
  return [
    'List the top suspicious transactions and their strongest signals.',
    'What is the current status of open investigation cases?',
    'Recommend immediate containment actions for active alerts.',
  ];
}

function buildDeterministicFallback(
  payload: AssistantChatRequest,
  scopeNotice: string
): {
  reply: string;
  answer: string;
  isAiGenerated: boolean;
  scopeNotice: string;
  suggestedFollowUps: string[];
} {
  const { question, role, contextSummary } = payload;
  const lowerQ = question.toLowerCase();

  if (
    role === 'VIEWER' &&
    (lowerQ.includes('customer name') ||
      lowerQ.includes('email') ||
      lowerQ.includes('account number') ||
      lowerQ.includes('ip address') ||
      lowerQ.includes('investigation note') ||
      lowerQ.includes('pii'))
  ) {
    const reply = `### Access Scope Notice (${role})\nYour current role (**VIEWER**) is restricted to **anonymized aggregate telemetry** and general fraud trends. Customer PII, full account numbers, IP addresses, and confidential investigation dossiers are protected.\n\n### Aggregate Platform Snapshot\n* **Total Transactions Evaluated:** ${contextSummary.totalTransactions} (**₹${contextSummary.totalVolume.toLocaleString()}**)\n* **Approved:** ${contextSummary.approvedCount} | **Held / Pending:** ${contextSummary.heldCount} | **Blocked:** ${contextSummary.blockedCount}\n* **Prevented Fraud Exposure:** **₹${contextSummary.blockedVolume.toLocaleString()}**\n* **Average Risk Score:** **${contextSummary.avgRiskScore}/100** | **Active Alerts:** ${contextSummary.activeAlertsCount}`;
    return {
      reply,
      answer: reply,
      isAiGenerated: false,
      scopeNotice,
      suggestedFollowUps: buildFollowUps(role, question),
    };
  }

  if (contextSummary.matchedEntities.length > 0) {
    const entityLines = contextSummary.matchedEntities
      .map((e) => `* **${e.type} \`${e.id}\`:** ${e.details}`)
      .join('\n');
    const reply = `### Direct Database Lookup\n${entityLines}\n\n### Current Risk Posture\n* **Active Alerts:** ${contextSummary.activeAlertsCount} | **Average Risk Score:** ${contextSummary.avgRiskScore}/100`;
    return {
      reply,
      answer: reply,
      isAiGenerated: false,
      scopeNotice,
      suggestedFollowUps: buildFollowUps(role, question),
    };
  }

  if (lowerQ.includes('case') || lowerQ.includes('investigation')) {
    if (role === 'VIEWER') {
      const reply = `### Investigation Access Restricted\nDetailed investigation case records are only accessible to **Compliance Officer**, **Senior Risk Analyst**, and **Lead Fraud Architect** roles.\n\n* **Open Alerts in Public Telemetry:** ${contextSummary.activeAlertsCount}\n* **Held/Blocked Transactions:** ${contextSummary.heldCount + contextSummary.blockedCount}`;
      return {
        reply,
        answer: reply,
        isAiGenerated: false,
        scopeNotice,
        suggestedFollowUps: buildFollowUps(role, question),
      };
    }

    const caseLines =
      contextSummary.recentInvestigations.length > 0
        ? contextSummary.recentInvestigations
            .map(
              (c) =>
                `* **\`${c.id}\`** (${c.priority} • ${c.status}) — ${c.title} (TXN: \`${c.transactionId}\`)`
            )
            .join('\n')
        : '* No investigation cases currently recorded.';

    const reply = `### Investigation Queue Overview\n* **Open / Escalated Cases:** **${contextSummary.openInvestigationsCount}**\n\n### Recent Cases\n${caseLines}`;
    return {
      reply,
      answer: reply,
      isAiGenerated: false,
      scopeNotice,
      suggestedFollowUps: buildFollowUps(role, question),
    };
  }

  if (lowerQ.includes('how') || lowerQ.includes('score') || lowerQ.includes('impossible travel') || lowerQ.includes('emulator')) {
    const thresholdInfo = contextSummary.rulesSummary
      ? `* **Active Policy Thresholds:** Step-Up OTP ≥ **${contextSummary.rulesSummary.stepUpOtpThreshold}**, Hold ≥ **${contextSummary.rulesSummary.holdThreshold}**, Auto-Block ≥ **${contextSummary.rulesSummary.blockThreshold}**`
      : '';
    const reply = `### RESQ AI 10-Signal Deterministic Scoring Architecture\nRESQ AI evaluates every payment in real time across behavioral DNA, device integrity, and network telemetry:\n* **Impossible Travel:** Calculates geodesic Haversine distance divided by elapsed time between transactions (>850 km/h triggers up to +32 pts).\n* **Device Fingerprint Integrity:** Detects rooted/jailbroken devices, headless emulators, and mismatched hardware hashes (+28 pts).\n* **Amount Z-Score & Velocity:** Compares requested value and 60-minute burst frequency against the customer's historical baseline.\n* **Network & Syndicate Intel:** Flags commercial VPN/Tor exit nodes and cross-merchant mule fingerprints.\n${thresholdInfo}`;
    return {
      reply,
      answer: reply,
      isAiGenerated: false,
      scopeNotice,
      suggestedFollowUps: buildFollowUps(role, question),
    };
  }

  const topTxLines =
    contextSummary.recentSuspiciousSummaries.length > 0
      ? contextSummary.recentSuspiciousSummaries
          .slice(0, 5)
          .map(
            (t) =>
              `* **\`${t.id}\`** — **₹${t.amount.toLocaleString()}** | Score **${t.riskScore}/100** (${t.riskLevel}) | Status: **${t.status}** | ${t.city}, ${t.country} (${t.customerLabel})`
          )
          .join('\n')
      : '* No high-risk anomalies currently active.';

  const reply = `### RESQ AI Live Telemetry Summary (${role})\n* **Total Transactions:** **${contextSummary.totalTransactions}** (**₹${contextSummary.totalVolume.toLocaleString()}** volume)\n* **Approved:** ${contextSummary.approvedCount} | **Held / Pending:** ${contextSummary.heldCount} | **Blocked:** ${contextSummary.blockedCount}\n* **Blocked Fraud Exposure:** **₹${contextSummary.blockedVolume.toLocaleString()}** | **Avg Risk Score:** **${contextSummary.avgRiskScore}/100**\n* **Active Security Alerts:** **${contextSummary.activeAlertsCount}**\n\n### Top Flagged Transactions\n${topTxLines}`;

  return {
    reply,
    answer: reply,
    isAiGenerated: false,
    scopeNotice,
    suggestedFollowUps: buildFollowUps(role, question),
  };
}

export async function generateAssistantResponse(
  payload: AssistantChatRequest
): Promise<{
  reply: string;
  answer: string;
  isAiGenerated: boolean;
  scopeNotice: string;
  suggestedFollowUps: string[];
}> {
  const { question, history = [], role, operatorName, contextSummary } = payload;
  const scopeNotice =
    role === 'VIEWER'
      ? 'Responses are restricted to anonymized aggregate statistics per VIEWER permissions.'
      : `Scoped to ${role} authorization privileges.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const methodSummary = contextSummary.paymentMethodBreakdown
        .map((m) => `${m.method}: ${m.count} txns (₹${m.volume.toLocaleString()})`)
        .join(' | ');

      const corridorSummary = contextSummary.topRiskCorridors
        .map((c) => `${c.location}: ${c.flaggedCount} flagged`)
        .join(' | ');

      const suspiciousText =
        contextSummary.recentSuspiciousSummaries.length > 0
          ? contextSummary.recentSuspiciousSummaries
              .map(
                (t) =>
                  `- ${t.id} | ${t.customerLabel} | ₹${t.amount.toLocaleString()} | ${t.paymentMethod} at ${t.merchantName} | Score ${t.riskScore}/100 (${t.riskLevel}) | Status: ${t.status} | ${t.city}, ${t.country} | Emulator: ${t.isEmulator} | VPN: ${t.vpnDetected} | Signals: ${t.topSignals.join(', ') || 'Baseline variance'} | ${t.summary}`
              )
              .join('\n')
          : 'None';

      const matchedText =
        contextSummary.matchedEntities.length > 0
          ? `\nDirect Lookup Matches Referenced by User:\n${contextSummary.matchedEntities
              .map((e) => `- [${e.type} ${e.id}] ${e.details}`)
              .join('\n')}`
          : '';

      const investigationText =
        role === 'VIEWER'
          ? 'Restricted: VIEWER cannot access investigation dossiers, customer PII, or confidential notes. Politely decline if asked for them.'
          : `Open Investigations (${contextSummary.openInvestigationsCount} open):\n${
              contextSummary.recentInvestigations.length > 0
                ? contextSummary.recentInvestigations
                    .map(
                      (c) =>
                        `- ${c.id}: ${c.title} [Status: ${c.status}, Priority: ${c.priority}, TXN: ${c.transactionId}]`
                    )
                    .join('\n')
                : 'None'
            }`;

      const alertsText =
        contextSummary.activeAlerts.length > 0
          ? contextSummary.activeAlerts
              .map(
                (a) =>
                  `- ${a.id} (${a.severity}, Score ${a.riskScore}/100) for ${a.transactionId}: ${a.title}`
              )
              .join('\n')
          : 'None';

      const rulesText = contextSummary.rulesSummary
        ? `Policy Thresholds: Step-Up OTP >= ${contextSummary.rulesSummary.stepUpOtpThreshold}, Hold >= ${contextSummary.rulesSummary.holdThreshold}, Block >= ${contextSummary.rulesSummary.blockThreshold}`
        : 'Policy Thresholds: Restricted from view';

      const systemInstruction = `You are the RESQ AI Security Assistant ("Detect. Predict. Prevent. Protect."), an enterprise fintech cybersecurity & payment fraud co-pilot.
Rules:
1. Ground every figure, transaction ID, case ID, and entity strictly in the live PostgreSQL telemetry context provided in the prompt. Never fabricate IDs or statistics.
2. Strictly enforce the operator's RBAC boundaries (${role}). For VIEWER, never expose or speculate on customer PII, email addresses, IP addresses, or investigation notes.
3. Wrap transaction IDs (like \`TXN-...\`) and case IDs (like \`CASE-...\`) in inline backticks so the UI renders them as clickable forensic links.
4. Structure answers cleanly with concise Markdown headings (###), bullet points (*), and bold key metrics (**₹...**, **.../100**). Give clear, actionable security guidance tailored to the operator's role.`;

      const normalizedHistory = history
        .filter((m) => m && typeof m.text === 'string' && m.text.trim().length > 0)
        .slice(-8)
        .map((m) => ({
          role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
          parts: [{ text: m.text.slice(0, 1500) }],
        }));

      const contextualMessage = `=== LIVE POSTGRESQL TELEMETRY SNAPSHOT ===
Operator: ${operatorName} (Role: ${role})
Scope Notice: ${scopeNotice}
Totals: ${contextSummary.totalTransactions} transactions | Volume: ₹${contextSummary.totalVolume.toLocaleString()} | Blocked Exposure Prevented: ₹${contextSummary.blockedVolume.toLocaleString()}
Breakdown: ${contextSummary.approvedCount} Approved | ${contextSummary.heldCount} Held/Pending | ${contextSummary.blockedCount} Blocked | Avg Risk Score: ${contextSummary.avgRiskScore}/100
Payment Rails: ${methodSummary || 'N/A'}
Top Risk Corridors: ${corridorSummary || 'N/A'}
${rulesText}

Active Security Alerts (${contextSummary.activeAlertsCount}):
${alertsText}

Recent Suspicious / Held / Blocked Transactions:
${suspiciousText}
${matchedText}

${investigationText}

=== OPERATOR QUESTION ===
${question}`;

      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        history: normalizedHistory,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const response = await chat.sendMessage({ message: contextualMessage });

      if (response.text && response.text.trim()) {
        const replyText = response.text.trim();
        return {
          reply: replyText,
          answer: replyText,
          isAiGenerated: true,
          scopeNotice,
          suggestedFollowUps: buildFollowUps(role, question),
        };
      }
    } catch (err) {
      console.warn('Gemini assistant fallback activated:', err);
    }
  }

  return buildDeterministicFallback(payload, scopeNotice);
}
