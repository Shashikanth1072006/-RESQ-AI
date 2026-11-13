/**
 * FRAUDSHIELD AI - Detailed Transaction Inspection & Forensic Breakdown Modal
 * Displays deterministic 10-signal breakdown, behavioral DNA delta,
 * adaptive manual protection controls, and Gemini-powered forensic investigation.
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  User,
  Smartphone,
  Globe,
  Store,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Unlock,
  Bot,
  ExternalLink,
  Loader2,
  FileSearch,
  MessageSquare,
  Send
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { useAuth } from '../../context/AuthContext';
import { requestForensicInvestigation, ForensicResult } from '../../services/geminiService';

export const TransactionDetailModal: React.FC = () => {
  const { authToken } = useAuth();
  const {
    selectedTransaction,
    setSelectedTransaction,
    customers,
    handleManualDecision,
    recordAnalystFeedback,
    userRole,
    can,
    setActiveTab,
    setPreselectedWarningTxId,
  } = useFraudShield();

  const [activeSubTab, setActiveSubTab] = useState<'signals' | 'dna_delta' | 'gemini_forensics' | 'device_meta'>('signals');
  const [forensicData, setForensicData] = useState<ForensicResult | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

  if (!selectedTransaction) return null;

  const tx = selectedTransaction;
  const cust = customers.find((c) => c.customerId === tx.customerId);
  const canViewFull = can('transactions:view_full');
  const canDecide = can('transactions:decide');
  const canReleaseCurrent =
    canDecide && (tx.riskEvaluation.riskLevel !== 'CRITICAL' || userRole === 'LEAD_FRAUD_ARCHITECT');

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'MANUALLY_RELEASED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'BLOCKED':
      case 'MANUALLY_BLOCKED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HELD_FOR_REVIEW':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'OTP_PENDING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const handleRunGeminiForensics = async (queryText?: string) => {
    setIsGeneratingAi(true);
    try {
      const result = await requestForensicInvestigation(
        tx,
        cust,
        queryText || customQuery,
        authToken
      );
      setForensicData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const executeAction = async (action: 'MANUAL_APPROVE' | 'MANUAL_BLOCK' | 'RELEASE_HOLD') => {
    setDecisionError(null);
    try {
      await handleManualDecision(tx.id, action, `Action executed by ${userRole}`);
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : 'Unable to update decision');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#090e1d] border border-cyan-500/30 shadow-2xl shadow-cyan-950/80 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-[#0c1428]">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center border font-mono-numbers font-black text-lg ${getRiskBadge(tx.riskEvaluation.riskLevel)}`}>
              {tx.riskEvaluation.riskScore}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-mono-numbers">{tx.id}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(tx.status)}`}>
                  {tx.status.replace(/_/g, ' ')}
                </span>
                {tx.isSimulatedAttack && (
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/40">
                    ATTACK: {tx.attackType || 'SYNTHETIC'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(tx.timestamp).toLocaleString()} • Evaluated in {tx.riskEvaluation.latencyMs}ms
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTransaction(null)}
            className="rounded-lg p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quick Facts Card Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0a1022] border-b border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Amount & Method</span>
            <div className="text-sm font-bold text-white font-mono-numbers mt-0.5">
              ₹{tx.amount.toLocaleString()} <span className="text-[10px] font-normal text-cyan-400">{tx.currency}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono-numbers">{tx.paymentMethod}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Customer</span>
            <div className="text-xs font-bold text-white truncate mt-0.5">{tx.customerName}</div>
            <div className="text-[10px] text-slate-400 font-mono-numbers">{tx.customerId}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Merchant</span>
            <div className="text-xs font-bold text-white truncate mt-0.5">{tx.merchant.name}</div>
            <div className="text-[10px] text-slate-400">{tx.merchant.category} • Risk {tx.merchant.riskTier}</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Location / Network</span>
            <div className="text-xs font-bold text-white truncate mt-0.5">{tx.location.city}, {tx.location.country}</div>
            <div className="text-[10px] font-mono-numbers text-slate-400">
              IP {tx.location.ipAddress} {tx.location.vpnDetected ? '⚠️ VPN' : ''}
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#090e1d]">
          <button
            onClick={() => setActiveSubTab('signals')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'signals'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>10-Signal Breakdown ({tx.riskEvaluation.factors.filter(f => f.anomalyDetected).length} Triggered)</span>
          </button>

          {canViewFull && (
            <button
              onClick={() => setActiveSubTab('dna_delta')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'dna_delta'
                  ? 'border-purple-400 text-purple-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Customer DNA Delta</span>
            </button>
          )}

          {canViewFull && (
            <button
              onClick={() => {
                setActiveSubTab('gemini_forensics');
                if (!forensicData) void handleRunGeminiForensics();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'gemini_forensics'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-blue-400" />
              <span>Gemini AI Forensic Dossier</span>
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('device_meta')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'device_meta'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Device Fingerprint</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: 10-SIGNAL EXPLAINABLE BREAKDOWN */}
          {activeSubTab === 'signals' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#0c1428] border border-cyan-500/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" />
                    Deterministic Decision Rationale
                  </span>
                  <span className="text-xs font-mono-numbers text-slate-400">
                    Decision: <strong className="text-white">{tx.riskEvaluation.decision}</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {tx.riskEvaluation.recommendation}
                </p>
                <div className="mt-2 text-[11px] text-slate-400 font-mono-numbers">
                  Engine Summary: {tx.riskEvaluation.summary}
                </div>
              </div>

              {/* Signals Grid */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Individual Signal Weights & Evidence
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {tx.riskEvaluation.factors.map((factor) => (
                    <div
                      key={factor.code}
                      className={`p-3 rounded-xl border transition-all ${
                        factor.anomalyDetected
                          ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                          : 'bg-[#080d1a] border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {factor.anomalyDetected ? (
                            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          )}
                          <span className="text-xs font-bold">{factor.name}</span>
                        </div>
                        <span className={`text-xs font-mono-numbers font-bold px-1.5 py-0.5 rounded ${
                          factor.anomalyDetected ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          +{factor.score} pts
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90 pl-6">
                        {factor.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER DNA DELTA */}
          {activeSubTab === 'dna_delta' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#0c1428] border border-purple-500/30 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-1">
                  Behavioral DNA Comparison: Baseline vs Transaction
                </h3>
                <p className="text-xs text-slate-400">
                  Comparing current transaction parameters against {cust?.name || 'Customer'}'s historical multi-year baseline.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Historical Baseline */}
                <div className="rounded-xl bg-[#080d1a] border border-slate-800 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
                    <User className="h-4 w-4 text-cyan-400" />
                    Historical Behavioral Baseline
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Typical Amount Range:</span>
                      <span className="font-mono-numbers font-bold text-white">
                        ₹{cust?.typicalAmountMin.toLocaleString()} - ₹{cust?.typicalAmountMax.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Average Amount:</span>
                      <span className="font-mono-numbers font-bold text-white">
                        ₹{cust?.averageAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Active Daily Hours:</span>
                      <span className="font-mono-numbers text-white">
                        {cust?.preferredHoursRange[0]}:00 to {cust?.preferredHoursRange[1]}:00
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Primary Locations:</span>
                      <span className="text-white text-right">
                        {cust?.commonLocations.map(l => l.city).join(', ') || 'India'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Trusted Devices:</span>
                      <span className="font-mono-numbers text-cyan-400 text-right">
                        {cust?.trustedDeviceIds.length} Registered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Transaction Delta */}
                <div className="rounded-xl bg-[#080d1a] border border-rose-500/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-300 border-b border-slate-800 pb-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Observed Transaction Reality
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Requested Amount:</span>
                      <span className="font-mono-numbers font-bold text-rose-400">
                        ₹{tx.amount.toLocaleString()} ({cust?.averageAmount ? (tx.amount / cust.averageAmount).toFixed(1) : 1}x average)
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Transaction Time:</span>
                      <span className="font-mono-numbers text-white">
                        {new Date(tx.timestamp).toLocaleTimeString()} ({new Date(tx.timestamp).getHours()}:00)
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Observed Location:</span>
                      <span className="text-rose-300 font-semibold text-right">
                        {tx.location.city}, {tx.location.country}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Device ID:</span>
                      <span className="font-mono-numbers text-slate-300 text-right">
                        {tx.device.deviceId.slice(0, 16)}...
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-800/60">
                      <span className="text-slate-400">Device Match:</span>
                      <span className={`font-bold ${cust?.trustedDeviceIds.includes(tx.device.deviceId) ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {cust?.trustedDeviceIds.includes(tx.device.deviceId) ? 'TRUSTED HARDWARE' : 'UNRECOGNIZED HARDWARE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GEMINI AI FORENSIC DOSSIER */}
          {activeSubTab === 'gemini_forensics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-cyan-950/40 border border-blue-500/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      RESQ AI Gemini Forensic Analyst
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] text-blue-300 font-mono-numbers">
                        {forensicData?.isAiGenerated ? 'LIVE GEMINI AI' : 'DETERMINISTIC FALLBACK'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Synthesizes deterministic evidence into actionable cyber intelligence & containment guidance.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRunGeminiForensics()}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Re-Analyze</span>
                    </>
                  )}
                </button>
              </div>

              {forensicData ? (
                <div className="space-y-4 text-xs">
                  {/* Executive Summary */}
                  <div className="rounded-xl bg-[#080d1a] border border-slate-800 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Threat Classification & Appraisal
                    </span>
                    <div className="text-sm font-bold text-white mt-1 mb-2">
                      {forensicData.threatClassification}
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      {forensicData.executiveSummary}
                    </p>
                  </div>

                  {/* Strongest Signals & Next Steps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-[#080d1a] border border-slate-800 p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
                        Top Suspicious Vectors
                      </span>
                      <ul className="space-y-1.5 pt-1">
                        {forensicData.strongestSignals.map((sig, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            <span>{sig}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-[#080d1a] border border-slate-800 p-4 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                        Recommended Analyst Action Plan
                      </span>
                      <ul className="space-y-1.5 pt-1">
                        {forensicData.investigativeSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-300">
                            <span className="text-cyan-400 font-mono-numbers font-bold text-[10px]">
                              0{idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Policy Containment */}
                  <div className="rounded-xl bg-cyan-950/20 border border-cyan-500/30 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Containment Recommendation
                    </span>
                    <p className="text-slate-200 mt-1 font-medium">
                      {forensicData.containmentRecommendation}
                    </p>
                  </div>
                </div>
              ) : isGeneratingAi ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
                  <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
                  <p className="text-xs">Generating Forensic Intelligence via Gemini API...</p>
                </div>
              ) : null}

              {/* Ask Analyst Inquiry Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="Ask Gemini: 'Should we freeze the destination merchant?' or 'Explain impossible travel'..."
                  className="flex-1 bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRunGeminiForensics(customQuery);
                  }}
                />
                <button
                  onClick={() => handleRunGeminiForensics(customQuery)}
                  disabled={isGeneratingAi || !customQuery}
                  className="px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Ask AI</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: DEVICE FINGERPRINT */}
          {activeSubTab === 'device_meta' && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-[#0c1428] border border-slate-800 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Hardware Fingerprint & Environment Signatures
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Device ID</span>
                    <div className="font-mono-numbers text-white font-semibold mt-0.5">{tx.device.deviceId}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Fingerprint Hash</span>
                    <div className="font-mono-numbers text-slate-300 font-semibold mt-0.5 truncate">{tx.device.fingerprintHash}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Operating System</span>
                    <div className="text-white font-semibold mt-0.5">{tx.device.os}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Browser / User-Agent</span>
                    <div className="text-white font-semibold mt-0.5">{tx.device.browser}</div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Emulator / VM Detection</span>
                    <div className={`font-bold mt-0.5 ${tx.device.isEmulator ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {tx.device.isEmulator ? 'DETECTED (Android VM/Nox)' : 'PHYSICAL HARDWARE'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#070b16] border border-slate-800/80">
                    <span className="text-[10px] text-slate-500">Consortium Trust Score</span>
                    <div className="font-mono-numbers font-bold text-white mt-0.5">
                      {tx.device.trustScore}/100
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer: Adaptive Protection Actions & Labeling */}
        <div className="border-t border-slate-800 bg-[#070b16] p-4 flex flex-col gap-2">
          {decisionError && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {decisionError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Feedback Labeling */}
            {canDecide ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] text-slate-400 hidden lg:inline">Analyst Label:</span>
                <button
                  onClick={() => recordAnalystFeedback(tx.id, 'CONFIRMED_FRAUD', 'Confirmed by analyst audit')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Confirmed Fraud
                </button>
                <button
                  onClick={() => recordAnalystFeedback(tx.id, 'LEGITIMATE', 'Customer confirmed authenticity')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Legitimate
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-slate-500">
                Read-only inspection ({userRole})
              </span>
            )}

            {/* Manual Overrides */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {can('warnings:send') && tx.riskEvaluation.riskScore >= 30 && (
                <button
                  onClick={() => {
                    setPreselectedWarningTxId(tx.id);
                    setSelectedTransaction(null);
                    setActiveTab('warning_center');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer"
                >
                  <span>Send Fraud Warning</span>
                </button>
              )}

              {canReleaseCurrent &&
              (tx.status === 'HELD_FOR_REVIEW' || tx.status === 'OTP_PENDING' || tx.status === 'BLOCKED') ? (
                <button
                  onClick={() => void executeAction('RELEASE_HOLD')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Release Funds (Approve)</span>
                </button>
              ) : null}

              {canDecide && tx.status !== 'BLOCKED' && tx.status !== 'MANUALLY_BLOCKED' ? (
                <button
                  onClick={() => void executeAction('MANUAL_BLOCK')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Force Block Payment</span>
                </button>
              ) : null}

              <button
                onClick={() => setSelectedTransaction(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
