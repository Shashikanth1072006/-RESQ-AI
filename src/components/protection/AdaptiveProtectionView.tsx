/**
 * FRAUDSHIELD AI - Adaptive Auto-Protection Center
 * Queue of transactions requiring human-in-the-loop review, automated policy rules,
 * and manual override controls.
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Unlock,
  XCircle,
  Eye,
  Sliders,
  CheckCircle2,
  Clock,
  UserCheck
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { Transaction } from '../../types';

export const AdaptiveProtectionView: React.FC = () => {
  const {
    transactions,
    handleManualDecision,
    setSelectedTransaction,
    userRole,
    can,
  } = useFraudShield();

  const [activeQueueTab, setActiveQueueTab] = useState<'HELD' | 'BLOCKED' | 'APPROVED'>('HELD');
  const [actionError, setActionError] = useState<string | null>(null);

  const canDecide = can('transactions:decide');

  const heldTransactions = transactions.filter(
    (t) => t.status === 'HELD_FOR_REVIEW' || t.status === 'OTP_PENDING'
  );
  const blockedTransactions = transactions.filter(
    (t) => t.status === 'BLOCKED' || t.status === 'MANUALLY_BLOCKED'
  );
  const approvedTransactions = transactions.filter(
    (t) => t.status === 'APPROVED' || t.status === 'MANUALLY_RELEASED'
  );

  const displayedList =
    activeQueueTab === 'HELD'
      ? heldTransactions
      : activeQueueTab === 'BLOCKED'
        ? blockedTransactions
        : approvedTransactions;

  const onDecision = async (
    txId: string,
    action: 'MANUAL_APPROVE' | 'MANUAL_BLOCK' | 'RELEASE_HOLD',
    reason: string
  ) => {
    setActionError(null);
    try {
      await handleManualDecision(txId, action, reason);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to apply decision.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              RESQ AI ADAPTIVE AUTO-PROTECTION QUEUE
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            Automated Protection Queue &amp; Manual Override
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Low risk auto-approved · Medium triggers OTP · High held for review · Critical blocked (Lead Architect required to release).
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0c1428] border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveQueueTab('HELD')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeQueueTab === 'HELD'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Review Queue ({heldTransactions.length})
          </button>
          <button
            onClick={() => setActiveQueueTab('BLOCKED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeQueueTab === 'BLOCKED'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Blocked ({blockedTransactions.length})
          </button>
          <button
            onClick={() => setActiveQueueTab('APPROVED')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              activeQueueTab === 'APPROVED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved ({approvedTransactions.length})
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {actionError}
        </div>
      )}

      <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-cyan-400" />
            <span>
              {activeQueueTab === 'HELD'
                ? 'Held Transactions Awaiting Decision'
                : activeQueueTab === 'BLOCKED'
                  ? 'Blocked Payments'
                  : 'Authorized Clearings'}
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-mono-numbers">{displayedList.length} items</span>
        </div>

        {displayedList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No transactions currently in this queue.
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedList.map((tx) => {
              const canReleaseTx =
                canDecide &&
                (tx.riskEvaluation.riskLevel !== 'CRITICAL' || userRole === 'LEAD_FRAUD_ARCHITECT');
              return (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0c1428] border border-slate-800 hover:border-cyan-500/30 transition-all text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center font-mono-numbers font-bold shrink-0 ${
                        tx.riskEvaluation.riskLevel === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : tx.riskEvaluation.riskLevel === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {tx.riskEvaluation.riskScore}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-numbers font-bold text-white">{tx.id}</span>
                        <span className="font-semibold text-slate-300">{tx.customerName}</span>
                        <span className="font-mono-numbers font-bold text-white">
                          ₹{tx.amount.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        {tx.riskEvaluation.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end shrink-0">
                    <button
                      onClick={() => setSelectedTransaction(tx)}
                      className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Inspect transaction"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {canReleaseTx &&
                      tx.status !== 'APPROVED' &&
                      tx.status !== 'MANUALLY_RELEASED' && (
                        <button
                          onClick={() =>
                            void onDecision(
                              tx.id,
                              'MANUAL_APPROVE',
                              `Authorized by ${userRole} override`
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <Unlock className="h-3.5 w-3.5" />
                          <span>Release (Approve)</span>
                        </button>
                      )}

                    {canDecide &&
                      tx.status !== 'BLOCKED' &&
                      tx.status !== 'MANUALLY_BLOCKED' && (
                        <button
                          onClick={() =>
                            void onDecision(
                              tx.id,
                              'MANUAL_BLOCK',
                              `Confirmed malicious vector by ${userRole}`
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Block</span>
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
