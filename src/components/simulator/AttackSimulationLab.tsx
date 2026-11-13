/**
 * RESQ AI - Attack Simulation Laboratory
 * Live interactive test bench demonstrating 5 advanced cyber payment fraud vectors.
 */

import React, { useState } from 'react';
import {
  Flame,
  Zap,
  Play,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  PlaneTakeoff,
  SmartphoneNfc,
  Network,
  Lock,
  ArrowRight,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { AttackScenario, Transaction } from '../../types';

export const AttackSimulationLab: React.FC = () => {
  const {
    attackScenarios,
    triggerAttackScenario,
    setSelectedTransaction,
    customers,
    transactions
  } = useFraudShield();

  const [activeScenarioId, setActiveScenarioId] = useState<string>(attackScenarios[0].id);
  const [executionLogs, setExecutionLogs] = useState<{ time: string; text: string; type: 'info' | 'warn' | 'block' | 'success' }[]>([]);
  const [lastExecutedTx, setLastExecutedTx] = useState<Transaction | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const selectedScenario = attackScenarios.find(s => s.id === activeScenarioId) || attackScenarios[0];
  const victimCustomer = customers.find(c => c.customerId === selectedScenario.targetVictimId);

  const handleLaunchScenario = () => {
    setIsRunning(true);
    setExecutionLogs([]);

    const now = () => new Date().toLocaleTimeString();

    setExecutionLogs(prev => [
      ...prev,
      { time: now(), text: `[SIMULATION LAB] Initializing attack payload '${selectedScenario.name}'...`, type: 'info' }
    ]);

    setTimeout(() => {
      setExecutionLogs(prev => [
        ...prev,
        { time: now(), text: `[PAYLOAD DISPATCH] Transmitting synthetic payment authorization against account ${victimCustomer?.name || 'Victim'}...`, type: 'info' }
      ]);
    }, 350);

    setTimeout(() => {
      setExecutionLogs(prev => [
        ...prev,
        { time: now(), text: `[DETECTION RADAR] Signal extraction: Calculating amount Z-score, device integrity, and kinematic velocity...`, type: 'warn' }
      ]);
    }, 800);

    setTimeout(async () => {
      try {
        const tx = await triggerAttackScenario(selectedScenario.id);
        setIsRunning(false);
        if (!tx) {
          setExecutionLogs(prev => [
            ...prev,
            { time: now(), text: `[SIMULATION ERROR] Unable to execute simulation scenario with current permissions or connection.`, type: 'warn' }
          ]);
          return;
        }
        setLastExecutedTx(tx);
        setExecutionLogs(prev => [
          ...prev,
          { time: now(), text: `[DEFENSE INTERCEPT] Risk Score: ${tx.riskEvaluation.riskScore}/100. Action: ${tx.riskEvaluation.decision}. Logged to PostgreSQL & Radar.`, type: 'block' },
          { time: now(), text: `[SECURITY AUDIT] Intercepted in ${tx.riskEvaluation.latencyMs}ms. Investigation case auto-escalated.`, type: 'success' }
        ]);
      } catch {
        setIsRunning(false);
        setExecutionLogs(prev => [
          ...prev,
          { time: now(), text: `[SIMULATION ERROR] Failed to dispatch simulated payload.`, type: 'warn' }
        ]);
      }
    }, 1300);
  };

  const getScenarioIcon = (iconName: string) => {
    switch (iconName) {
      case 'PlaneTakeoff':
        return PlaneTakeoff;
      case 'SmartphoneNfc':
        return SmartphoneNfc;
      case 'Network':
        return Network;
      case 'Zap':
        return Zap;
      default:
        return ShieldAlert;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#140b1e] via-[#0e091a] to-[#090f22] border border-amber-500/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-amber-400 animate-bounce" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              FEATURE 2: ATTACK SIMULATION LABORATORY
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            Synthetic Threat Injection & Defense Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test how RESQ AI isolates Account Takeovers, Supersonic Travel, Bot Micro-Testing, and Coordinated Rings.
          </p>
        </div>

        <button
          onClick={handleLaunchScenario}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-rose-950/80 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isRunning ? (
            <>
              <Activity className="h-4 w-4 animate-spin" />
              <span>Simulating Attack...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 fill-current" />
              <span>Launch Active Scenario</span>
            </>
          )}
        </button>
      </div>

      {/* Scenarios Carousel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {attackScenarios.map((scenario) => {
          const Icon = getScenarioIcon(scenario.icon);
          const isSelected = scenario.id === activeScenarioId;
          return (
            <button
              key={scenario.id}
              onClick={() => {
                setActiveScenarioId(scenario.id);
                setLastExecutedTx(null);
                setExecutionLogs([]);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/40 text-amber-200'
                  : 'bg-[#080d1a] border-slate-800 text-slate-400 hover:bg-[#0c1428] hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  scenario.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {scenario.severity}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-bold text-white line-clamp-1">{scenario.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                  {scenario.description}
                </p>
              </div>

              <div className="text-[10px] text-cyan-400 font-mono-numbers">
                Target: {customers.find(c => c.customerId === scenario.targetVictimId)?.name || 'Victim'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Detailed Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Scenario Anatomy & Simulated Payload */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono-numbers">
              SCENARIO ARCHITECTURE & THREAT SIGNATURE
            </span>
            <h2 className="text-base font-bold text-white mt-1">{selectedScenario.name}</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {selectedScenario.description}
            </p>
          </div>

          {/* Expected Triggered Signals */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Expected Deterministic Vector Triggers
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedScenario.expectedTriggeredRules.map((ruleCode) => (
                <span
                  key={ruleCode}
                  className="px-2 py-1 rounded bg-[#0c1428] border border-rose-500/30 text-[11px] font-mono-numbers text-rose-300 font-bold"
                >
                  ⚡ {ruleCode}
                </span>
              ))}
            </div>
          </div>

          {/* Theoretical Explanation */}
          <div className="p-3.5 rounded-xl bg-[#0c1428] border border-slate-800 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Detection Rationale
            </span>
            <p className="text-slate-300 leading-relaxed">
              {selectedScenario.explanation}
            </p>
          </div>

          {/* Action Trigger */}
          <button
            onClick={handleLaunchScenario}
            disabled={isRunning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-950/80 hover:brightness-110 disabled:opacity-50 cursor-pointer transition-all"
          >
            {isRunning ? (
              <>
                <Activity className="h-4 w-4 animate-spin" />
                <span>Injecting Attack into Engine...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Execute & Observe Live Interception</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Live Terminal Execution Logs & Intercepted Result */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                Live Defense Console Telemetry
              </span>
              <span className="text-[10px] font-mono-numbers text-emerald-400">
                ACTIVE MONITOR
              </span>
            </div>

            {/* Terminal Window */}
            <div className="h-56 rounded-xl bg-[#050811] border border-slate-900 p-3 overflow-y-auto space-y-2 font-mono-numbers text-xs">
              {executionLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                  <Flame className="h-6 w-6 mb-1 opacity-40 text-amber-500" />
                  <p>Ready to launch scenario. Click "Execute" to start.</p>
                </div>
              ) : (
                executionLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-slate-600 shrink-0 text-[10px]">{log.time}</span>
                    <span className={`text-[11px] leading-relaxed ${
                      log.type === 'block' ? 'text-rose-400 font-bold' :
                      log.type === 'warn' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Intercept Result Card */}
          {lastExecutedTx && (
            <div className="p-4 rounded-xl bg-[#0c1428] border border-rose-500/40 space-y-2 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                  <span className="text-xs font-bold text-white font-mono-numbers">{lastExecutedTx.id}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50 font-mono-numbers">
                  Risk Score: {lastExecutedTx.riskEvaluation.riskScore}/100
                </span>
              </div>

              <div className="text-xs text-slate-300">
                Amount: <strong className="text-white font-mono-numbers">₹{lastExecutedTx.amount.toLocaleString()}</strong> • Status: <strong className="text-rose-400">{lastExecutedTx.status}</strong>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-1">
                {lastExecutedTx.riskEvaluation.summary}
              </p>

              <button
                onClick={() => setSelectedTransaction(lastExecutedTx)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer mt-2"
              >
                <span>Inspect Full Evidence & Forensics</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
