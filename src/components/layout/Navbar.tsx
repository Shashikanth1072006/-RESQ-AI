/**
 * RESQ AI - Master Navigation Bar, Real-Time Notification Panel & Operator Session Menu
 */

import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Activity,
  Play,
  Pause,
  ChevronDown,
  Sparkles,
  Zap,
  LogOut,
  Bell,
  CheckCircle2,
  UserCog,
  CreditCard,
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { useAuth } from '../../context/AuthContext';
import { ROLE_META } from '../../utils/rbacClient';

export const Navbar: React.FC = () => {
  const {
    stats,
    alerts,
    fraudNotifications,
    transactions,
    isLiveStreaming,
    toggleLiveStream,
    streamSpeed,
    setStreamSpeed,
    userRole,
    can,
    setIsDemoTourActive,
    setDemoTourStep,
    triggerAttackScenario,
    setActiveTab,
    setSelectedTransaction,
    acknowledgeAlert,
  } = useFraudShield();
  const { currentUser, signOutUser } = useAuth();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const operatorName = currentUser?.displayName || 'Security Operator';
  const operatorEmail = currentUser?.email || '';
  const operatorInitials =
    operatorName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'OP';

  const roleMeta = ROLE_META[userRole];
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  const handleStartDemoTour = () => {
    setActiveTab('overview');
    setDemoTourStep(1);
    setIsDemoTourActive(true);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/20 bg-[#070b16]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-3">
        {/* Brand & Tagline */}
        <div
          onClick={() => setActiveTab('overview')}
          className="flex items-center gap-3 cursor-pointer shrink-0"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#090e1d]">
              <Shield className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-base sm:text-lg">
                RESQ <span className="text-cyan-400 font-black">AI</span>
              </span>
              <span className={`hidden sm:inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold border ${roleMeta.accent}`}>
                {roleMeta.title}
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium">
              Detect. Predict. Prevent. Protect.
            </p>
          </div>
        </div>

        {/* Live Metrics Ticker Bar */}
        <div className="hidden xl:flex items-center gap-5 px-4 py-1.5 rounded-xl bg-[#0d1527]/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Transactions:</span>
            <span className="font-mono-numbers font-semibold text-white">
              {stats.processedToday}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-slate-400">High Risk:</span>
            <span className="font-mono-numbers font-semibold text-rose-400">
              {stats.fraudAttemptsDetected}
            </span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Prevented:</span>
            <span className="font-mono-numbers font-bold text-emerald-400">
              ₹{stats.lossesPrevented.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Quick Make Payment button */}
          <button
            onClick={() => setActiveTab('make_payment')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1527] hover:bg-[#131e38] border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Make Payment</span>
          </button>

          {/* Live Stream Controller */}
          <div className="hidden sm:flex items-center bg-[#0d1527] border border-slate-800 rounded-lg p-1">
            <button
              onClick={toggleLiveStream}
              title={isLiveStreaming ? 'Pause Live Stream' : 'Resume Live Stream'}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                isLiveStreaming
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {isLiveStreaming ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="hidden lg:inline">{isLiveStreaming ? 'LIVE' : 'IDLE'}</span>
            </button>

            <div className="hidden lg:flex items-center ml-1 border-l border-slate-800 pl-1 text-[11px] font-mono-numbers">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setStreamSpeed(spd)}
                  className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                    streamSpeed === spd
                      ? 'bg-blue-600/30 text-blue-300 font-bold'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Simulate Attack (Analysts / Architects only) */}
          {can('reports:advanced') && (
            <button
              onClick={() => void triggerAttackScenario('SCENARIO-ATO')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:border-rose-400 hover:text-white transition-all cursor-pointer whitespace-nowrap"
              title="Simulate a high-risk Account Takeover transaction"
            >
              <Zap className="h-3.5 w-3.5 text-rose-400" />
              <span>Simulate Attack</span>
            </button>
          )}

          {/* 10-Step Judge Demo */}
          <button
            onClick={handleStartDemoTour}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden md:inline">10-STEP DEMO</span>
            <span className="md:hidden">DEMO</span>
          </button>

          {/* Real-Time Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsUserMenuOpen(false);
              }}
              aria-label="Real-time security alerts"
              className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-[#0d1527] border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {activeAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white font-mono-numbers">
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0b1122] border border-cyan-500/25 shadow-2xl p-3 z-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">Real-Time Security Alerts</h3>
                    <p className="text-[10px] text-slate-400">
                      {activeAlerts.length} active alerts · {fraudNotifications.length} warning dispatches
                    </p>
                  </div>
                  {can('warnings:view') && (
                    <button
                      onClick={() => {
                        setIsNotifOpen(false);
                        setActiveTab('warning_center');
                      }}
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      Warning Center
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {alerts.slice(0, 6).map((al) => {
                    const relatedTx = transactions.find((t) => t.id === al.transactionId);
                    return (
                      <div
                        key={al.id}
                        className={`p-2.5 rounded-lg border text-xs space-y-1.5 ${
                          al.status === 'ACTIVE'
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-[#080d1a] border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white truncate">{al.title}</span>
                          <span className="font-mono-numbers text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                            {al.riskScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug">{al.message}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-500 font-mono-numbers">
                            {new Date(al.createdAt).toLocaleTimeString()}
                          </span>
                          <div className="flex items-center gap-2">
                            {relatedTx && (
                              <button
                                onClick={() => {
                                  setSelectedTransaction(relatedTx);
                                  setIsNotifOpen(false);
                                }}
                                className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                              >
                                Inspect
                              </button>
                            )}
                            {al.status === 'ACTIVE' && can('alerts:acknowledge') && (
                              <button
                                onClick={() => void acknowledgeAlert(al.id, 'ACKNOWLEDGED')}
                                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Acknowledge</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {alerts.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No active fraud alerts.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Operator Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUserMenuOpen(!isUserMenuOpen);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0d1527] border border-slate-800 hover:border-slate-700 text-xs transition-colors cursor-pointer"
            >
              <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-semibold text-[10px]">
                {operatorInitials}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-[11px] font-semibold text-slate-200 leading-none max-w-[120px] truncate">
                  {operatorName}
                </p>
                <p className="text-[9px] text-cyan-400/80 leading-none mt-0.5">{roleMeta.title}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0b1122] border border-cyan-500/20 shadow-2xl p-2 z-50 space-y-2">
                <div className="px-2.5 py-2 border-b border-slate-800/80">
                  <div className="text-xs font-bold text-white truncate">{operatorName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{operatorEmail}</div>
                  <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                    {roleMeta.title} · {roleMeta.badge}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setActiveTab('profile_settings');
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <UserCog className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Profile &amp; Account Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    void signOutUser();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/15 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
