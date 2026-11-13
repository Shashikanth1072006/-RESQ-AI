/**
 * RESQ AI - Client-Side Gemini Intelligence Service
 * Calls server-side Gemini API endpoints (/api/gemini/investigate and /api/gemini/assistant)
 * using Bearer authentication.
 */

import { Transaction, CustomerBehavioralProfile } from '../types';

export interface ForensicResult {
  executiveSummary: string;
  threatClassification: string;
  strongestSignals: string[];
  investigativeSteps: string[];
  containmentRecommendation: string;
  isAiGenerated: boolean;
}

export interface AssistantReply {
  reply: string;
  isAiGenerated: boolean;
  scopeNotice: string;
  suggestedFollowUps?: string[];
}

export interface AssistantChatHistoryItem {
  role: 'user' | 'assistant';
  text: string;
}

export async function requestForensicInvestigation(
  transaction: Transaction,
  customerBaseline?: CustomerBehavioralProfile,
  question?: string,
  authToken?: string | null
): Promise<ForensicResult> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch('/api/gemini/investigate', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        transaction,
        customerBaseline: customerBaseline
          ? {
              typicalAmountMin: customerBaseline.typicalAmountMin,
              typicalAmountMax: customerBaseline.typicalAmountMax,
              averageAmount: customerBaseline.averageAmount,
              commonLocations: customerBaseline.commonLocations,
              preferredHoursRange: customerBaseline.preferredHoursRange,
            }
          : undefined,
        question,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ForensicResult = await response.json();
    return data;
  } catch (error) {
    console.warn('Network call to /api/gemini/investigate failed, using local forensic synthesis:', error);

    const flagged = transaction.riskEvaluation.factors.filter((f) => f.anomalyDetected);
    return {
      executiveSummary: `Transaction ${transaction.id} for ₹${transaction.amount.toLocaleString()} presents ${flagged.length} anomalous risk factors. Primary concern revolves around ${flagged[0]?.name || 'Behavioral Variance'} and device verification integrity.`,
      threatClassification: transaction.device.isEmulator
        ? 'Emulator ATO Threat'
        : 'Suspicious Multi-Factor Deviation',
      strongestSignals: flagged.slice(0, 3).map((f) => `${f.name} (+${f.score} pts)`),
      investigativeSteps: [
        'Inspect session device fingerprint across internal cross-merchant consortium.',
        'Verify origin IP ASN against known VPN and Tor exit node lists.',
        'Contact customer via verified phone channel before releasing held funds.',
      ],
      containmentRecommendation: transaction.riskEvaluation.recommendation,
      isAiGenerated: false,
    };
  }
}

export async function queryAIAssistant(
  question: string,
  authToken: string | null,
  history: AssistantChatHistoryItem[] = []
): Promise<AssistantReply> {
  if (!authToken) {
    throw new Error('Authentication required to query RESQ AI Assistant.');
  }

  const response = await fetch('/api/gemini/assistant', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ question, history }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.error || `Assistant error (${response.status})`);
  }

  const data = await response.json();
  return {
    reply: data.reply || data.answer || 'No response received from RESQ AI Assistant.',
    isAiGenerated: Boolean(data.isAiGenerated),
    scopeNotice: data.scopeNotice || data.roleScope || 'RBAC scoped response',
    suggestedFollowUps: Array.isArray(data.suggestedFollowUps) ? data.suggestedFollowUps : [],
  };
}
