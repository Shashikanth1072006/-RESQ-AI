/**
 * RESQ AI - Simulated Real-Time Payment Gateway
 * Evaluates payments in real time via POST /api/transactions/process and persists to PostgreSQL.
 * Never collects or stores raw card numbers, CVVs, or UPI PINs.
 */

import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Eye,
  BellRing,
  Briefcase,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useFraudShield, ProcessPaymentResult } from '../../context/FraudShieldContext';
import { PaymentMethod } from '../../types';

export const PaymentGatewayView: React.FC = () => {
  const {
    customers,
    processPayment,
    setSelectedTransaction,
    setActiveTab,
    setPreselectedWarningTxId,
    can,
    capabilities,
  } = useFraudShield();

  const [customerId, setCustomerId] = useState<string>(customers[0]?.customerId || 'CUST-1001');
  const [senderName, setSenderName] = useState<string>(customers[0]?.name || 'Aarav Sharma');
  const [senderAccountMasked, setSenderAccountMasked] = useState<string>('XXXX-4821');
  const [recipientName, setRecipientName] = useState<string>('Amazon India Retail');
  const [recipientAccountMasked, setRecipientAccountMasked] = useState<string>('MCH-AMZ-IN');
  const [amount, setAmount] = useState<string>('500');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [description, setDescription] = useState<string>('Monthly household essentials order');
  const [profilePreset, setProfilePreset] = useState<'NORMAL' | 'HIGH_RISK' | 'IMPOSSIBLE_TRAVEL'>('NORMAL');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ProcessPaymentResult | null>(null);

  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const cust = customers.find((c) => c.customerId === id);
    if (cust) {
      setSenderName(cust.name);
      setSenderAccountMasked(`XXXX-${cust.customerId.slice(-4)}`);
    }
  };

  const applyDemoPreset = (preset: 'SAFE_500' | 'SUSPICIOUS_50000') => {
    if (preset === 'SAFE_500') {
      setAmount('500');
      setPaymentMethod('UPI');
      setRecipientName('Swiggy Instamart');
      setRecipientAccountMasked('MCH-SWIGGY-01');
      setDescription('Routine grocery delivery');
      setProfilePreset('NORMAL');
    } else {
      setAmount('50000');
      setPaymentMethod('CRYPTO');
      setRecipientName('Binance P2P Global Desk');
      setRecipientAccountMasked('MCH-CRYPTO-99');
      setDescription('Urgent cross-border liquidity transfer');
      setProfilePreset('HIGH_RISK');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid payment amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const cust = customers.find((c) => c.customerId === customerId) || customers[0];
      const homeCity = cust?.commonLocations[0]?.city || 'Hyderabad';
      const homeCountry = cust?.commonLocations[0]?.country || 'India';

      const isHighRisk = profilePreset === 'HIGH_RISK';
      const isTravel = profilePreset === 'IMPOSSIBLE_TRAVEL';

      const result = await processPayment({
        customerId,
        senderName,
        senderAccountMasked,
        recipientName,
        recipientAccountMasked,
        amount: numericAmount,
        paymentMethod,
        description,
        merchantCategory: isHighRisk
          ? 'crypto_exchange'
          : paymentMethod === 'CRYPTO'
            ? 'crypto_exchange'
            : 'e_commerce',
        merchantRiskTier: isHighRisk ? 'HIGH' : 'LOW',
        city: isTravel ? 'Moscow' : isHighRisk ? 'Dubai' : homeCity,
        country: isTravel ? 'Russian Federation' : isHighRisk ? 'United Arab Emirates' : homeCountry,
        countryCode: isTravel ? 'RU' : isHighRisk ? 'AE' : 'IN',
        latitude: isTravel ? 55.7558 : isHighRisk ? 25.2048 : 17.385,
        longitude: isTravel ? 37.6173 : isHighRisk ? 55.2708 : 78.4867,
        ipAddress: isTravel ? '185.220.101.4' : isHighRisk ? '185.191.171.1' : '103.24.58.19',
        vpnDetected: isHighRisk || isTravel,
        isEmulator: isHighRisk,
        unfamiliarDevice: isHighRisk || isTravel,
        recentVelocity: isHighRisk ? 6 : 1,
        failedAttemptsPrior: isHighRisk ? 3 : 0,
        simulateImpossibleTravel: isTravel,
        isSimulatedAttack: isHighRisk || isTravel,
        attackType: isTravel
          ? 'Impossible Travel Anomaly'
          : isHighRisk
            ? 'High-Risk Device & Foreign Velocity'
            : undefined,
      });

      setLastResult(result);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Payment processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tx = lastResult?.transaction;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              REAL-TIME PAYMENT PROCESSING &amp; FRAUD GATEWAY
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">Make a Simulated Payment</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit a payment through the RESQ AI 10-signal fraud engine. Payments are persisted to PostgreSQL and trigger instant alerts &amp; investigations when risky.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyDemoPreset('SAFE_500')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            Preset: ₹500 Normal
          </button>
          <button
            type="button"
            onClick={() => applyDemoPreset('SUSPICIOUS_50000')}
            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
          >
            Preset: ₹50,000 High-Risk
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#0b1328] border border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Simulated Gateway ({capabilities.paymentSandboxMode}):</strong> No real funds are debited. Raw card numbers, CVVs, and UPI PINs are never collected or stored.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 shadow-xl"
        >
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Payment Details
          </h2>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Customer Baseline Profile</label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.name} ({c.customerId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Sender Name</label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Sender Account (Masked)</label>
              <input
                type="text"
                required
                value={senderAccountMasked}
                onChange={(e) => setSenderAccountMasked(e.target.value)}
                placeholder="XXXX-4821"
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white font-mono-numbers focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Amount (INR ₹)</label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white font-mono-numbers font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Recipient / Merchant</label>
              <input
                type="text"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Recipient Account / VPA</label>
              <input
                type="text"
                required
                value={recipientAccountMasked}
                onChange={(e) => setRecipientAccountMasked(e.target.value)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white font-mono-numbers focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="UPI">UPI Instant</option>
                <option value="CREDIT_CARD">Credit Card (Tokenized)</option>
                <option value="DEBIT_CARD">Debit Card (Tokenized)</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="DIGITAL_WALLET">Digital Wallet</option>
                <option value="CRYPTO">Crypto Gateway</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Network / Device Context</label>
              <select
                value={profilePreset}
                onChange={(e) => setProfilePreset(e.target.value as typeof profilePreset)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="NORMAL">Trusted Device &amp; Home City</option>
                <option value="HIGH_RISK">Foreign VPN + Emulator + High Velocity</option>
                <option value="IMPOSSIBLE_TRAVEL">Impossible Travel (India → Moscow in 12m)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="block font-semibold text-slate-300">Payment Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Order reference or memo..."
              className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Evaluating Risk &amp; Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Process Simulated Payment</span>
              </>
            )}
          </button>
        </form>

        {/* Live Fraud Evaluation Result Card */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          {tx ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                    EVALUATION RESULT
                  </span>
                  <h2 className="text-base font-bold text-white font-mono-numbers">{tx.id}</h2>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono-numbers ${
                    tx.riskEvaluation.riskLevel === 'CRITICAL'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : tx.riskEvaluation.riskLevel === 'HIGH'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : tx.riskEvaluation.riskLevel === 'MEDIUM'
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  Score: {tx.riskEvaluation.riskScore}/100 ({tx.riskEvaluation.riskLevel})
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0c1428] border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Automated Status</span>
                  <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                    {tx.status === 'APPROVED' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : tx.status === 'BLOCKED' ? (
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    )}
                    <span>{tx.status.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0c1428] border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Amount &amp; Rail</span>
                  <div className="text-sm font-bold text-white font-mono-numbers mt-0.5">
                    ₹{tx.amount.toLocaleString()} · {tx.paymentMethod}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0c1428] border border-cyan-500/20 space-y-1.5 text-xs">
                <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Risk Explanation &amp; Recommendation</span>
                </div>
                <p className="text-slate-200 leading-relaxed">{tx.riskEvaluation.summary}</p>
                <p className="text-slate-400">{tx.riskEvaluation.recommendation}</p>
              </div>

              {/* Triggered Signals */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Triggered Detection Signals ({tx.riskEvaluation.factors.filter((f) => f.anomalyDetected).length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {tx.riskEvaluation.factors
                    .filter((f) => f.anomalyDetected)
                    .map((f) => (
                      <div
                        key={f.code}
                        className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-xs"
                      >
                        <span className="text-rose-200 font-medium">{f.name}</span>
                        <span className="font-mono-numbers font-bold text-rose-300">+{f.score} pts</span>
                      </div>
                    ))}
                  {tx.riskEvaluation.factors.filter((f) => f.anomalyDetected).length === 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300">
                      All 10 behavioral, velocity, and device integrity checks passed cleanly.
                    </div>
                  )}
                </div>
              </div>

              {/* Next Action Links */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(tx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold cursor-pointer"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Inspect Full Dossier</span>
                </button>

                {lastResult?.case && can('investigations:view') && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('investigation_workspace')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer"
                  >
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Open Case ({lastResult.case.id})</span>
                  </button>
                )}

                {tx.riskEvaluation.riskScore >= 30 && can('warnings:send') && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreselectedWarningTxId(tx.id);
                      setActiveTab('warning_center');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    <span>Send Fraud Warning</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Ready for Real-Time Scoring</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Submit a simulated payment on the left to observe real-time risk classification, automated prevention actions, alert generation, and PostgreSQL persistence.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
