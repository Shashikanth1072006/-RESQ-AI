/**
 * RESQ AI - 10-Step Interactive Hackathon Judge Walkthrough
 * Walks evaluators end-to-end through normal ₹500 payment -> Low Risk -> ₹50,000 unusual payment ->
 * High Risk -> Hold/Block -> Senior Risk Analyst alert -> Investigation -> Fraud Warning ->
 * Lead Fraud Architect Review -> Audit Log verification.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  CreditCard,
  ShieldAlert,
  Briefcase,
  BellRing,
  FileText,
  Settings,
  Cpu,
  Loader2,
} from 'lucide-react';
import { useFraudShield, NavigationPage } from '../../context/FraudShieldContext';

export const JudgeTourModal: React.FC = () => {
  const {
    isDemoTourActive,
    setIsDemoTourActive,
    demoTourStep,
    setDemoTourStep,
    setActiveTab,
    processPayment,
    setSelectedTransaction,
    setPreselectedWarningTxId,
    transactions,
    can,
  } = useFraudShield();

  const [lastDemoTxId, setLastDemoTxId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  if (!isDemoTourActive) return null;

  const tourSteps: {
    step: number;
    title: string;
    targetTab: NavigationPage;
    description: string;
    actionLabel: string;
    onAction: () => Promise<void> | void;
    icon: React.ElementType;
  }[] = [
    {
      step: 1,
      title: '1. Submit Normal Payment (₹500)',
      targetTab: 'make_payment',
      description:
        'Execute a routine ₹500 UPI payment from a trusted home device to verify baseline scoring and PostgreSQL persistence.',
      actionLabel: 'Execute ₹500 Normal Payment',
      onAction: async () => {
        setActiveTab('make_payment');
        const res = await processPayment({
          customerId: 'CUST-1001',
          senderName: 'Aarav Sharma',
          senderAccountMasked: 'XXXX-1001',
          recipientName: 'Swiggy Instamart',
          recipientAccountMasked: 'MCH-SWIGGY-01',
          amount: 500,
          paymentMethod: 'UPI',
          description: 'Judge Demo Step 1: Routine ₹500 order',
          city: 'Hyderabad',
          country: 'India',
          countryCode: 'IN',
        });
        setLastDemoTxId(res.transaction.id);
        setSelectedTransaction(res.transaction);
      },
      icon: CreditCard,
    },
    {
      step: 2,
      title: '2. Low Risk Evaluation (Auto-Approved)',
      targetTab: 'live_radar',
      description:
        'Observe that the ₹500 transaction scored in the Low Risk tier (0–29) and was automatically APPROVED with zero friction.',
      actionLabel: 'View in Live Radar',
      onAction: () => {
        setActiveTab('live_radar');
      },
      icon: CheckCircle2,
    },
    {
      step: 3,
      title: '3. Submit Unusual Payment (₹50,000)',
      targetTab: 'make_payment',
      description:
        'Now simulate an unusual ₹50,000 Crypto/Offshore payment from an unfamiliar foreign VPN & emulator environment.',
      actionLabel: 'Execute ₹50,000 Unusual Payment',
      onAction: async () => {
        setActiveTab('make_payment');
        const res = await processPayment({
          customerId: 'CUST-1001',
          senderName: 'Aarav Sharma',
          senderAccountMasked: 'XXXX-1001',
          recipientName: 'Binance P2P Global Desk',
          recipientAccountMasked: 'MCH-CRYPTO-99',
          amount: 50000,
          paymentMethod: 'CRYPTO',
          description: 'Judge Demo Step 3: High-value foreign crypto transfer',
          merchantCategory: 'crypto_exchange',
          merchantRiskTier: 'HIGH',
          city: 'Dubai',
          country: 'United Arab Emirates',
          countryCode: 'AE',
          latitude: 25.2048,
          longitude: 55.2708,
          ipAddress: '185.191.171.1',
          vpnDetected: true,
          isEmulator: true,
          unfamiliarDevice: true,
          recentVelocity: 6,
          failedAttemptsPrior: 2,
          isSimulatedAttack: true,
          attackType: 'Judge Demo High-Risk Anomaly',
        });
        setLastDemoTxId(res.transaction.id);
        setSelectedTransaction(res.transaction);
      },
      icon: ShieldAlert,
    },
    {
      step: 4,
      title: '4. High/Critical Risk Scoring Breakdown',
      targetTab: 'live_radar',
      description:
        'RESQ AI evaluates all 10 behavioral, velocity, location, and device signals, assigning a High/Critical risk score with full explainability.',
      actionLabel: 'Inspect Risk Breakdown',
      onAction: () => {
        const target =
          transactions.find((t) => t.id === lastDemoTxId) ||
          transactions.find((t) => t.riskEvaluation.riskScore >= 60);
        if (target) setSelectedTransaction(target);
      },
      icon: Cpu,
    },
    {
      step: 5,
      title: '5. Automated Hold / Block Prevention',
      targetTab: 'protection_settings',
      description:
        'Based on risk thresholds, RESQ AI automatically holds or blocks the ₹50,000 payment in the gateway before clearing occurs.',
      actionLabel: 'Open Review & Override Queue',
      onAction: () => {
        if (can('transactions:decide')) {
          setActiveTab('protection_settings');
        } else {
          setActiveTab('live_radar');
        }
      },
      icon: ShieldAlert,
    },
    {
      step: 6,
      title: '6. Real-Time Analyst Alert Broadcast',
      targetTab: 'overview',
      description:
        'Socket.IO immediately broadcasts the fraud alert to connected Senior Risk Analysts and Lead Fraud Architects in the top notification bell.',
      actionLabel: 'View Command Center Alerts',
      onAction: () => {
        setSelectedTransaction(null);
        setActiveTab('overview');
      },
      icon: BellRing,
    },
    {
      step: 7,
      title: '7. Fraud Investigation Center',
      targetTab: 'investigation_workspace',
      description:
        'A persistent PostgreSQL investigation case is auto-created for the flagged payment so analysts and compliance officers can annotate and escalate.',
      actionLabel: 'Open Investigation Center',
      onAction: () => {
        if (can('investigations:view')) {
          setActiveTab('investigation_workspace');
        }
      },
      icon: Briefcase,
    },
    {
      step: 8,
      title: '8. Dispatch RESQ AI Security Warning',
      targetTab: 'warning_center',
      description:
        'Authorized analysts preview and dispatch a "RESQ AI SECURITY ALERT" across Email, SMS, or Security Alert channels.',
      actionLabel: 'Open Fraud Warning Center',
      onAction: () => {
        if (lastDemoTxId) setPreselectedWarningTxId(lastDemoTxId);
        if (can('warnings:view')) {
          setActiveTab('warning_center');
        }
      },
      icon: BellRing,
    },
    {
      step: 9,
      title: '9. Lead Fraud Architect Controls',
      targetTab: 'system_settings',
      description:
        'Lead Fraud Architects manage RBAC user accounts, tune AI threshold policies, and hold exclusive release authority over Critical blocks.',
      actionLabel: 'Inspect Policy & Admin Scope',
      onAction: () => {
        if (can('settings:system')) {
          setActiveTab('system_settings');
        } else {
          setActiveTab('scorecard');
        }
      },
      icon: Settings,
    },
    {
      step: 10,
      title: '10. Immutable Audit Trail Verification',
      targetTab: 'audit_logs',
      description:
        'Every login, payment evaluation, case update, warning dispatch, and manual decision is permanently recorded in the PostgreSQL Audit Log.',
      actionLabel: 'Complete Demo & View Audit Logs',
      onAction: () => {
        if (can('audit:view')) {
          setActiveTab('audit_logs');
        } else {
          setActiveTab('overview');
        }
      },
      icon: FileText,
    },
  ];

  const current = tourSteps[demoTourStep - 1] || tourSteps[0];
  const Icon = current.icon;

  const handleNext = () => {
    if (demoTourStep < tourSteps.length) {
      const nextStep = demoTourStep + 1;
      setDemoTourStep(nextStep);
    } else {
      setIsDemoTourActive(false);
    }
  };

  const handlePrev = () => {
    if (demoTourStep > 1) {
      const prevStep = demoTourStep - 1;
      setDemoTourStep(prevStep);
      setActiveTab(tourSteps[prevStep - 1].targetTab);
    }
  };

  const handleExecuteAction = async () => {
    setIsExecuting(true);
    try {
      await current.onAction();
    } finally {
      setIsExecuting(false);
    }
    handleNext();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="rounded-2xl border-2 border-cyan-500/40 bg-[#090f20]/95 backdrop-blur-2xl p-5 shadow-2xl shadow-cyan-950/80">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                RESQ AI · 10-STEP JUDGE DEMO
              </span>
              <h3 className="text-sm font-bold text-white">{current.title}</h3>
            </div>
          </div>
          <button
            onClick={() => setIsDemoTourActive(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer"
            title="Close demo guide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">{current.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {tourSteps.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  setDemoTourStep(s.step);
                  setActiveTab(s.targetTab);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  s.step === demoTourStep
                    ? 'w-5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                    : s.step < demoTourStep
                      ? 'w-2 bg-cyan-700'
                      : 'w-2 bg-slate-800'
                }`}
                title={`Step ${s.step}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-mono-numbers text-slate-400">
            Step {demoTourStep} of {tourSteps.length}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={handlePrev}
            disabled={demoTourStep === 1 || isExecuting}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Prev</span>
          </button>

          <button
            onClick={() => void handleExecuteAction()}
            disabled={isExecuting}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold hover:brightness-110 shadow-md cursor-pointer disabled:opacity-60"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{current.actionLabel}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
