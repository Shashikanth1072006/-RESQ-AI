/**
 * RESQ AI - System Settings & Containment Policies (Lead Fraud Architect Only)
 */

import React, { useState, useEffect } from 'react';
import { Settings, Sliders, Shield, Save, Server, CheckCircle2 } from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';

export const SystemSettingsView: React.FC = () => {
  const { sensitivityConfig, updateSensitivityConfig, capabilities } = useFraudShield();

  const [lowThreshold, setLowThreshold] = useState(sensitivityConfig.lowThreshold);
  const [mediumThreshold, setMediumThreshold] = useState(sensitivityConfig.mediumThreshold);
  const [highThreshold, setHighThreshold] = useState(sensitivityConfig.highThreshold);
  const [mediumAction, setMediumAction] = useState<'ALLOW' | 'HOLD' | 'VERIFY_OTP'>(
    sensitivityConfig.mediumAction || 'VERIFY_OTP'
  );
  const [autoBlockCritical, setAutoBlockCritical] = useState<boolean>(
    sensitivityConfig.autoBlockCritical ?? true
  );
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    setLowThreshold(sensitivityConfig.lowThreshold);
    setMediumThreshold(sensitivityConfig.mediumThreshold);
    setHighThreshold(sensitivityConfig.highThreshold);
    setMediumAction(sensitivityConfig.mediumAction || 'VERIFY_OTP');
    setAutoBlockCritical(sensitivityConfig.autoBlockCritical ?? true);
  }, [sensitivityConfig]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(null);
    setErrMsg(null);
    try {
      await updateSensitivityConfig({
        lowThreshold,
        mediumThreshold,
        highThreshold,
        mediumAction,
        autoBlockCritical,
      });
      setSavedMsg('System thresholds & containment policy saved to PostgreSQL and broadcast live.');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Failed to save system settings.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              CORE POLICY &amp; SYSTEM CONFIGURATION
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">AI Risk Thresholds &amp; Containment Controls</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure score tier cutoffs, automated blocking policies, and review integrated runtime provider status.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{savedMsg}</span>
        </div>
      )}
      {errMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-5 shadow-xl text-xs"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <span>Risk Tier Boundaries (0 – 100 Scale)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-emerald-300">
                Low → Medium Cutoff
              </label>
              <input
                type="number"
                min={10}
                max={85}
                value={lowThreshold}
                onChange={(e) => setLowThreshold(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white font-mono-numbers"
              />
              <span className="text-[10px] text-slate-400">Default: 30</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-amber-300">
                Medium → High Cutoff
              </label>
              <input
                type="number"
                min={20}
                max={92}
                value={mediumThreshold}
                onChange={(e) => setMediumThreshold(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white font-mono-numbers"
              />
              <span className="text-[10px] text-slate-400">Default: 60</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-rose-300">
                High → Critical Cutoff
              </label>
              <input
                type="number"
                min={40}
                max={99}
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white font-mono-numbers"
              />
              <span className="text-[10px] text-slate-400">Default: 80</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Medium-Risk Automated Policy</label>
              <select
                value={mediumAction}
                onChange={(e) => setMediumAction(e.target.value as typeof mediumAction)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white"
              >
                <option value="VERIFY_OTP">Require Step-Up OTP Verification</option>
                <option value="HOLD">Hold for Analyst Review</option>
                <option value="ALLOW">Approve with Monitoring Flag</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-slate-300">Critical Risk Auto-Containment</label>
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0c1428] border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBlockCritical}
                  onChange={(e) => setAutoBlockCritical(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-slate-200">
                  Immediately block payments scoring ≥ {highThreshold}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs hover:brightness-110 cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Save Policy Configuration</span>
          </button>
        </form>

        {/* Runtime Integrations Summary */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 shadow-xl text-xs">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Server className="h-4 w-4 text-cyan-400" />
            <span>Runtime Provider Environment</span>
          </h2>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-slate-300">PostgreSQL Persistence</span>
              <span className="font-bold text-emerald-400">CONNECTED (Cloud SQL)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-slate-300">Gemini Forensic AI</span>
              <span className={capabilities.geminiConfigured ? 'font-bold text-emerald-400' : 'font-bold text-amber-300'}>
                {capabilities.geminiConfigured ? 'API KEY ACTIVE' : 'DETERMINISTIC FALLBACK'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-slate-300">Email Alert Channel (SMTP)</span>
              <span className="font-bold text-slate-300">
                {capabilities.emailProviderConfigured ? 'CONFIGURED' : 'SIMULATED QUEUE'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-slate-300">SMS Alert Channel (Twilio)</span>
              <span className="font-bold text-slate-300">
                {capabilities.smsProviderConfigured ? 'CONFIGURED' : 'SIMULATED QUEUE'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-slate-300">Payment Gateway Mode</span>
              <span className="font-bold text-cyan-300">{capabilities.paymentSandboxMode}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#070b16] border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
            <Shield className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Provider secrets are configured exclusively via server environment variables (`.env`) and are never exposed in client bundles.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
