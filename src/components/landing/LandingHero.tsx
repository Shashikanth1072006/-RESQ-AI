/**
 * RESQ AI - Premium Landing & Platform Overview
 * "Detect. Predict. Prevent. Protect."
 */

import React from 'react';
import {
  Shield,
  Sparkles,
  Dna,
  Share2,
  ArrowRight,
  Cpu,
  Lock,
  BellRing,
  Users,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import { ROLE_META } from '../../utils/rbacClient';
import { UserRole } from '../../types';

interface LandingHeroProps {
  onEnterApp: () => void;
  onLaunchJudgeDemo?: () => void;
  isAuthenticated?: boolean;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onEnterApp,
  onLaunchJudgeDemo,
  isAuthenticated = false,
}) => {
  const rolesOrder: UserRole[] = [
    'VIEWER',
    'COMPLIANCE_OFFICER',
    'SENIOR_RISK_ANALYST',
    'LEAD_FRAUD_ARCHITECT',
  ];

  return (
    <div className="min-h-screen bg-[#050811] text-white relative overflow-hidden flex flex-col justify-between">
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-45" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090e1d]">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="font-extrabold tracking-wider text-white text-base">
              RESQ <span className="text-cyan-400 font-black">AI</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              Detect. Predict. Prevent. Protect.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onLaunchJudgeDemo && (
            <button
              onClick={onLaunchJudgeDemo}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0b1328] hover:bg-[#111d3a] border border-cyan-500/30 text-cyan-300 text-xs font-bold whitespace-nowrap transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>10-Step Judge Demo</span>
            </button>
          )}
          <button
            onClick={onEnterApp}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold whitespace-nowrap shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>{isAuthenticated ? 'Return to Console' : 'Operator Sign In'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-5 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Intelligent Real-Time Payment Fraud Detection &amp; Prevention</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Detect. Predict.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Prevent. Protect.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            RESQ AI evaluates digital payments across 10 deterministic risk signals in real time, enforces role-based access control across 4 security tiers, persists every investigation and alert in PostgreSQL, and delivers explainable AI forensics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{isAuthenticated ? 'Enter Security Console' : 'Sign In & Launch Console'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {onLaunchJudgeDemo && (
              <button
                onClick={onLaunchJudgeDemo}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0c1428] hover:bg-[#121e3d] border border-cyan-500/40 text-cyan-300 font-bold text-sm transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4" />
                <span>Launch 10-Step Judge Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Core Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#080d1c]/90 border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Real-Time 10-Signal Fraud Engine</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates amount Z-score, velocity bursts, emulator hardware, impossible travel, VPN flags, and merchant AML risk on every payment (0–100 score).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#080d1c]/90 border border-slate-800 hover:border-purple-500/40 transition-all space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
              <Dna className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Behavioral DNA &amp; Syndicate Graph</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compares incoming payments against historical spending baselines, circadian windows, and device-sharing fraud rings.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#080d1c]/90 border border-slate-800 hover:border-blue-500/40 transition-all space-y-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <BellRing className="h-4 w-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Investigations, Warnings &amp; Audit Ledger</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Auto-creates cases and real-time Socket.IO alerts, dispatches RESQ AI Security Alerts, and records every action in an immutable PostgreSQL audit trail.
            </p>
          </div>
        </div>

        {/* 4 RBAC Roles Matrix */}
        <section className="p-6 rounded-2xl bg-[#080e1e]/90 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                4-Tier Role-Based Access Control (Frontend + Backend Enforced)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              Every API endpoint independently verifies JWT / SSO role permissions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rolesOrder.map((r) => {
              const meta = ROLE_META[r];
              return (
                <div
                  key={r}
                  className="p-4 rounded-xl bg-[#0b1224] border border-slate-800/90 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{meta.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${meta.accent}`}>
                      {meta.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{meta.description}</p>
                  <div className="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{meta.accessLevel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>RESQ AI — Real-Time Payment Fraud Intelligence</span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>Simulated Evaluation Environment · No Real Card/CVV Storage</span>
        </span>
      </footer>
    </div>
  );
};
