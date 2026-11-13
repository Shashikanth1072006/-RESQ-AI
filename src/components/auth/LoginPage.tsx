/**
 * RESQ AI - Operator Authentication Gate
 * Supports Email/Password credential login, safe 1-click role demo accounts,
 * and Google Single Sign-On via Firebase Auth synchronized with PostgreSQL RBAC.
 */

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Activity,
  Dna,
  BellRing,
  AlertCircle,
  Loader2,
  X,
  Mail,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { useAuth, DemoAccountInfo } from '../../context/AuthContext';

interface LoginPageProps {
  onShowLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onShowLanding }) => {
  const {
    demoAccounts,
    signInWithCredentials,
    signInWithGoogle,
    isSigningIn,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedDemoEmail, setSelectedDemoEmail] = useState<string>('');

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    await signInWithCredentials(email, password);
  };

  const handleSelectDemoAccount = async (acc: DemoAccountInfo, autoSubmit: boolean) => {
    setSelectedDemoEmail(acc.email);
    setEmail(acc.email);
    setPassword(acc.password);
    if (autoSubmit) {
      await signInWithCredentials(acc.email, acc.password);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber pointer-events-none opacity-45" />

      {/* Top Minimal Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090e1d]">
              <Shield className="h-4 w-4 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="font-extrabold tracking-wider text-white text-base">
              RESQ <span className="text-cyan-400 font-black">AI</span>
            </span>
            <p className="text-[10px] text-slate-400 leading-none">
              Detect. Predict. Prevent. Protect.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onShowLanding && (
            <button
              type="button"
              onClick={onShowLanding}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1428] border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Platform Overview</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Two-Column Authentication Split */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Demo Role Accounts & Platform Capabilities */}
          <section className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-[#080e1e]/90 border border-slate-800/90 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-cyan-400 tracking-wide">
                Zero-Trust Security Operations Access
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                RESQ AI Fraud Intelligence Console
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Select a verified demonstration role below to test role-based dashboards and backend permissions, or sign in with your own credentials or Google SSO.
              </p>
            </div>

            {/* Safe Demo Accounts Panel */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Evaluators: Safe Role Demo Credentials
                </span>
                <span className="text-[10px] text-cyan-400">Click to Sign In</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {demoAccounts.map((acc) => {
                  const isSelected = selectedDemoEmail === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={isSigningIn}
                      onClick={() => void handleSelectDemoAccount(acc, true)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer disabled:opacity-60 ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-white'
                          : 'bg-[#0c1428] border-slate-800 hover:border-cyan-500/40 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white">{acc.title}</span>
                        {isSelected ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <span className="text-[10px] font-semibold text-cyan-400">{acc.badge}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                        {acc.description}
                      </p>
                      <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono-numbers text-slate-400 space-y-0.5">
                        <div className="truncate">{acc.email}</div>
                        <div className="text-slate-500">Pass: {acc.password}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Capabilities Footer */}
            <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Real-Time Scoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Dna className="h-4 w-4 text-purple-400 shrink-0" />
                <span>Behavioral DNA</span>
              </div>
              <div className="flex items-center gap-2">
                <BellRing className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>RBAC Enforced</span>
              </div>
            </div>
          </section>

          {/* Right Column: Credential Login & Google SSO */}
          <section className="lg:col-span-6 p-6 sm:p-8 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Operator Authentication</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Sign In to RESQ AI
                </h2>
                <p className="text-xs text-slate-400">
                  Your role and permissions are verified server-side on every request.
                </p>
              </div>

              {authError && (
                <div
                  role="alert"
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAuthError}
                    aria-label="Dismiss error"
                    className="text-rose-300 hover:text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleCredentialSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Operator Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst.demo@resqai.sec"
                      className="w-full rounded-xl bg-[#0c1428] border border-slate-800 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter operator password"
                      className="w-full rounded-xl bg-[#0c1428] border border-slate-800 pl-10 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSigningIn || !email.trim() || !password}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  {isSigningIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <span>Sign In with Credentials</span>
                  )}
                </button>
              </form>

              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-800" />
                <span className="shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider">
                  Or SSO
                </span>
                <div className="flex-grow border-t border-slate-800" />
              </div>

              <button
                type="button"
                disabled={isSigningIn}
                onClick={() => void signInWithGoogle()}
                className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold text-sm shadow-lg transition-all cursor-pointer"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-[11px] text-slate-500">
              <span>PostgreSQL RBAC + JWT / Firebase SSO</span>
              <span className="font-mono-numbers">bcrypt · TLS</span>
            </div>
          </section>
        </div>
      </main>

      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 flex items-center justify-between text-[11px] text-slate-500">
        <span>RESQ AI Security Operations</span>
        <span>Protected Financial Gateway</span>
      </footer>
    </div>
  );
};
