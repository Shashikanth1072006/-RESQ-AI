/**
 * FRAUDSHIELD AI - AI Fraud Detection Engine & Weight Tuning Console
 * Explains all 10 deterministic signals and provides interactive sensitivity configuration.
 */

import React, { useState } from 'react';
import {
  Cpu,
  Sliders,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  Terminal
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { DEFAULT_SENSITIVITY } from '../../engine/fraudEngine';

export const DetectionEngineView: React.FC = () => {
  const { sensitivityConfig, updateSensitivityConfig, can } = useFraudShield();
  const canConfigureRules = can('rules:configure');
  const [testNotification, setTestNotification] = useState<string | null>(null);

  const signalDefinitions = [
    {
      code: 'SIG_AMOUNT_ANOMALY',
      name: 'Transaction Amount Anomaly',
      category: 'AMOUNT',
      formula: 'Z = (Amount - μ) / σ with 4x max-typical barrier',
      description: 'Detects sudden extreme liquidity extractions or rapid micro-authorizations deviation from individual historical baseline.',
      key: 'amountAnomalyWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.amountAnomalyWeight,
    },
    {
      code: 'SIG_VELOCITY',
      name: 'Rolling Transaction Velocity',
      category: 'VELOCITY',
      formula: 'V_window = Count(tx) in 60min rolling window',
      description: 'Flags automated bot bursts, rapid card testing cycles, or credential liquidation surges.',
      key: 'velocityWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.velocityWeight,
    },
    {
      code: 'SIG_DEVICE_INTEGRITY',
      name: 'Device Fingerprint & Emulator Detection',
      category: 'DEVICE',
      formula: 'Hardware hash + WebGL canvas + Magisk/Nox VM signature',
      description: 'Identifies unverified hardware, virtual machines, Android Nox/Bluestacks emulators, and rooted sandbox bypasses.',
      key: 'deviceFingerprintWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.deviceFingerprintWeight,
    },
    {
      code: 'SIG_LOCATION_BASELINE',
      name: 'Geographic Baseline Anomaly',
      category: 'LOCATION',
      formula: 'Haversine distance from home/work habitual geo-centroids',
      description: 'Flags payments originating from foreign jurisdictions or uncharacteristic IP addresses with commercial VPN flags.',
      key: 'locationAnomalyWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.locationAnomalyWeight,
    },
    {
      code: 'SIG_IMPOSSIBLE_TRAVEL',
      name: 'Impossible Travel (Kinematic Speed)',
      category: 'LOCATION',
      formula: 'Speed = Distance(loc1, loc2) / (t2 - t1) > 800 km/h',
      description: 'Mathematically calculates supersonic travel speed between sequential transactions to definitively flag credential theft.',
      key: 'impossibleTravelWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.impossibleTravelWeight,
    },
    {
      code: 'SIG_MERCHANT_REPUTATION',
      name: 'Merchant Risk & AML Flagging',
      category: 'MERCHANT',
      formula: 'Chargeback dispute ratio + Sanction blacklist + High-risk category',
      description: 'Identifies high-dispute shell merchants, offshore gambling portals, and unverified P2P crypto escrows.',
      key: 'merchantRiskWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.merchantRiskWeight,
    },
    {
      code: 'SIG_UNUSUAL_TIMING',
      name: 'Circadian Timing Deviation',
      category: 'TIMING',
      formula: 't_hour ∉ [cust.sleepWindow]',
      description: 'Evaluates transaction timestamp against customer habitual sleeping and active waking hours.',
      key: 'unusualTimingWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.unusualTimingWeight,
    },
    {
      code: 'SIG_FAILED_AUTH',
      name: 'Preceding Auth & OTP Failure Burst',
      category: 'REPUTATION',
      formula: 'Count(failed_pin) in 5 min preceding payload',
      description: 'Identifies brute-force credential stuffing and SIM swap / OTP guessing attempts.',
      key: 'failedAttemptsWeight' as const,
      defaultWeight: DEFAULT_SENSITIVITY.failedAttemptsWeight,
    }
  ];

  const handleResetDefaults = () => {
    updateSensitivityConfig(DEFAULT_SENSITIVITY);
    setTestNotification('Sensitivity weights restored to calibrated factory defaults.');
    setTimeout(() => setTestNotification(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              DETERMINISTIC & AUDITABLE RISK ENGINE
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            10-Signal Real-Time Fraud Analysis Engine
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
            Transparent, explainable multi-signal engine combining behavioral DNA, kinematic calculations, and device integrity. Zero random numbers.
          </p>
        </div>

        {canConfigureRules && (
          <button
            onClick={() => {
              void handleResetDefaults();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-[#0c1428] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Weights</span>
          </button>
        )}
      </div>

      {testNotification && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          <span>{testNotification}</span>
        </div>
      )}

      {/* Decision Thresholds Configuration */}
      <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          Decision Cutoff Thresholds (Score 0 - 100)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="flex justify-between font-bold text-emerald-400 mb-1">
              <span>LOW RISK (Approve)</span>
              <span>0 - {sensitivityConfig.lowThreshold - 1}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Auto-approved in sub-15ms. All biometric and behavioral signals match baseline.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30">
            <div className="flex justify-between font-bold text-sky-400 mb-1">
              <span>MEDIUM (Step-Up Auth)</span>
              <span>{sensitivityConfig.lowThreshold} - {sensitivityConfig.mediumThreshold - 1}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Triggers simulated Biometric/SMS OTP step-up verification.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
            <div className="flex justify-between font-bold text-amber-400 mb-1">
              <span>HIGH (Hold for Review)</span>
              <span>{sensitivityConfig.mediumThreshold} - {sensitivityConfig.highThreshold - 1}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Temporarily held in Risk Analyst review queue for manual release or block.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <div className="flex justify-between font-bold text-rose-400 mb-1">
              <span>CRITICAL (Block Payment)</span>
              <span>{sensitivityConfig.highThreshold} - 100</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Immediate payment block executed in demo gateway. Case auto-escalated.
            </p>
          </div>

        </div>
      </div>

      {/* Signal Weights Live Tuning Sliders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            Configurable Signal Weights & Evaluation Formulas
          </h2>
          <span className="text-xs text-slate-400">
            Slide to dynamically alter engine sensitivity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signalDefinitions.map((sig) => {
            const currentWeight = sensitivityConfig[sig.key] ?? sig.defaultWeight;
            return (
              <div
                key={sig.code}
                className="p-4 rounded-xl bg-[#080d1a] border border-slate-800/80 hover:border-cyan-500/30 transition-all space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-numbers">
                      {sig.category}
                    </span>
                    <h3 className="text-xs font-bold text-white">{sig.name}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono-numbers text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Weight: {currentWeight}
                    </span>
                  </div>
                </div>

                <div className="rounded bg-[#050811] px-2.5 py-1 text-[11px] font-mono-numbers text-slate-400 border border-slate-900 truncate">
                  {sig.formula}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {sig.description}
                </p>

                {/* Slider */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono-numbers">5</span>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    disabled={!canConfigureRules}
                    value={currentWeight}
                    onChange={(e) => {
                      void updateSensitivityConfig({ [sig.key]: parseInt(e.target.value, 10) });
                    }}
                    className="flex-1 accent-cyan-400 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-500 font-mono-numbers">50</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
