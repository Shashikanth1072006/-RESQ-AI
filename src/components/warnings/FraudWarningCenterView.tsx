/**
 * RESQ AI - Fraud Warning Center
 * Allows authorized analysts/architects to preview and dispatch RESQ AI Security Alerts
 * across IN_APP, EMAIL, SMS, and SECURITY_ALERT channels, while Compliance Officers can review history.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  Send,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Shield,
  Loader2,
  Lock,
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { NotificationChannel } from '../../types';

export const FraudWarningCenterView: React.FC = () => {
  const {
    transactions,
    fraudNotifications,
    sendFraudWarning,
    can,
    capabilities,
    preselectedWarningTxId,
    setPreselectedWarningTxId,
  } = useFraudShield();

  const canSendWarnings = can('warnings:send');

  const riskyTransactions = useMemo(
    () =>
      transactions.filter(
        (t) =>
          t.riskEvaluation.riskScore >= 30 ||
          t.status === 'HELD_FOR_REVIEW' ||
          t.status === 'BLOCKED' ||
          t.status === 'OTP_PENDING'
      ),
    [transactions]
  );

  const [selectedTxId, setSelectedTxId] = useState<string>(
    preselectedWarningTxId || riskyTransactions[0]?.id || transactions[0]?.id || ''
  );
  const [channel, setChannel] = useState<NotificationChannel>('SECURITY_ALERT');
  const [recipientLabel, setRecipientLabel] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (preselectedWarningTxId) {
      setSelectedTxId(preselectedWarningTxId);
      setPreselectedWarningTxId(null);
    }
  }, [preselectedWarningTxId, setPreselectedWarningTxId]);

  const selectedTx = useMemo(
    () => transactions.find((t) => t.id === selectedTxId) || riskyTransactions[0] || transactions[0],
    [transactions, riskyTransactions, selectedTxId]
  );

  // Auto-populate RESQ AI SECURITY ALERT template when transaction changes
  useEffect(() => {
    if (!selectedTx) return;
    setRecipientLabel(`${selectedTx.customerName} (${selectedTx.customerId})`);
    setSubject(`RESQ AI SECURITY ALERT — Transaction ${selectedTx.id} (${selectedTx.riskEvaluation.riskLevel} Risk)`);
    setMessage(
      `RESQ AI SECURITY ALERT\n\n` +
        `A suspicious payment attempt has been detected.\n\n` +
        `Transaction ID: ${selectedTx.id}\n` +
        `Amount: ₹${selectedTx.amount.toLocaleString()} (${selectedTx.paymentMethod})\n` +
        `Location: ${selectedTx.location.city}, ${selectedTx.location.country}\n` +
        `Risk Score: ${selectedTx.riskEvaluation.riskScore} / 100 (${selectedTx.riskEvaluation.riskLevel})\n` +
        `Action Taken: ${selectedTx.status.replace(/_/g, ' ')}\n\n` +
        `If you did not authorize this transaction, verify your account activity or contact RESQ AI Fraud Support immediately.`
    );
  }, [selectedTx?.id]);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx || !canSendWarnings) return;
    setIsSending(true);
    setStatusFeedback(null);
    try {
      const sent = await sendFraudWarning({
        transactionId: selectedTx.id,
        recipientLabel,
        channel,
        subject,
        message,
      });
      setStatusFeedback({
        type: 'ok',
        text: `Warning ${sent.id} recorded (${sent.deliveryStatus}) via ${sent.channel}.`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to send warning.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BellRing className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              AUTHORIZED FRAUD WARNING &amp; NOTIFICATION CENTER
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">RESQ AI Security Alert Dispatch</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Preview, customize, and dispatch verified fraud warning notifications with full delivery logging and audit accountability.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-[#0c1428] border border-slate-800 text-slate-300">
            SMTP: {capabilities.emailProviderConfigured ? 'Configured' : 'Simulated Queue'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#0c1428] border border-slate-800 text-slate-300">
            SMS: {capabilities.smsProviderConfigured ? 'Configured' : 'Simulated Queue'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer (or Read-Only Notice for Compliance Officer) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Compose Security Alert</span>
            </h2>
            {!canSendWarnings && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                <Lock className="h-3 w-3" /> Read-Only Access
              </span>
            )}
          </div>

          {!canSendWarnings ? (
            <div className="p-6 rounded-xl bg-[#0c1428] border border-amber-500/30 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-amber-300">
                Compliance Monitoring Scope
              </p>
              <p>
                Your role allows inspecting warning notification history and compliance records on the right. Dispatching outbound customer fraud warnings requires Senior Risk Analyst or Lead Fraud Architect authorization.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDispatch} className="space-y-3.5 text-xs">
              {statusFeedback && (
                <div
                  className={`p-3 rounded-xl border ${
                    statusFeedback.type === 'ok'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {statusFeedback.text}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Target Suspicious Transaction</label>
                <select
                  value={selectedTx?.id || ''}
                  onChange={(e) => setSelectedTxId(e.target.value)}
                  className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  {(riskyTransactions.length > 0 ? riskyTransactions : transactions.slice(0, 20)).map(
                    (t) => (
                      <option key={t.id} value={t.id}>
                        {t.id} — ₹{t.amount.toLocaleString()} ({t.riskEvaluation.riskScore}/100 · {t.status})
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Delivery Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as NotificationChannel)}
                    className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SECURITY_ALERT">RESQ Security Alert Banner</option>
                    <option value="IN_APP">In-App Notification</option>
                    <option value="EMAIL">Email Alert</option>
                    <option value="SMS">SMS Alert</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-300">Recipient</label>
                  <input
                    type="text"
                    required
                    value={recipientLabel}
                    onChange={(e) => setRecipientLabel(e.target.value)}
                    className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Alert Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Alert Message Body</label>
                <textarea
                  rows={7}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl bg-[#0c1428] border border-slate-800 p-3 text-white font-mono-numbers text-[11px] leading-relaxed focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || !selectedTx}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 disabled:opacity-60 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Dispatching Security Alert...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Dispatch Authorized Fraud Warning</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Warning Notification History */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Dispatched Warning History ({fraudNotifications.length})</span>
            </h2>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {fraudNotifications.map((ntf) => (
              <div
                key={ntf.id}
                className="p-3.5 rounded-xl bg-[#0c1428] border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-numbers font-bold text-cyan-400">{ntf.id}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-200">
                      {ntf.channel}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ntf.deliveryStatus === 'DELIVERED'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {ntf.deliveryStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="font-bold text-white">{ntf.subject}</div>
                <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed bg-[#070b16] p-2.5 rounded-lg border border-slate-800/80">
                  {ntf.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>
                    To: <strong className="text-slate-200">{ntf.recipientLabel}</strong>
                  </span>
                  <span>
                    Sent by {ntf.sentByName} ({ntf.sentByRole}) ·{' '}
                    {new Date(ntf.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}

            {fraudNotifications.length === 0 && (
              <div className="p-10 text-center text-xs text-slate-500">
                No fraud warnings dispatched yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
