/**
 * FRAUDSHIELD AI - Real-Time Attack Alert Banner
 */

import React from 'react';
import { AlertOctagon, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';

export const AttackAlertBanner: React.FC = () => {
  const { activeAttackAlert, dismissAttackAlert, transactions, setSelectedTransaction } = useFraudShield();

  if (!activeAttackAlert) return null;

  const handleInspectLatestAttack = () => {
    const latestAttackTx = transactions.find(t => t.isSimulatedAttack);
    if (latestAttackTx) {
      setSelectedTransaction(latestAttackTx);
    }
    dismissAttackAlert();
  };

  return (
    <div className="w-full bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b border-rose-500/50 px-4 py-2.5 text-xs text-white shadow-lg animate-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/30 border border-rose-400 text-rose-300 shrink-0">
            <AlertOctagon className="h-4 w-4 animate-spin text-rose-300" style={{ animationDuration: '3s' }} />
          </span>
          <div>
            <span className="font-bold text-rose-300 uppercase tracking-wider mr-2 text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
              THREAT INTERCEPTED
            </span>
            <span className="font-medium text-slate-100">{activeAttackAlert.message}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInspectLatestAttack}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white text-rose-950 font-bold hover:bg-slate-200 transition-colors shadow-sm cursor-pointer"
          >
            <span>Inspect Evidence</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={dismissAttackAlert}
            className="p-1 rounded text-rose-300 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
