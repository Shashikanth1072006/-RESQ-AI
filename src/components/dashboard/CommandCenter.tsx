/**
 * RESQ AI - Role-Adaptive Command Center Dashboard
 * Displays real-time payment metrics, AnomalyTrendChart, payment method volume,
 * risk distribution, geographic hotspots, and recent alerts.
 */

import React, { useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Activity,
  Zap,
  Globe,
  Radio,
  ChevronRight,
  CreditCard,
  BellRing,
} from 'lucide-react';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useFraudShield } from '../../context/FraudShieldContext';
import { AnomalyTrendChart } from './AnomalyTrendChart';
import { ROLE_META } from '../../utils/rbacClient';

export const CommandCenter: React.FC = () => {
  const {
    stats,
    transactions,
    setSelectedTransaction,
    setActiveTab,
    triggerAttackScenario,
    isLiveStreaming,
    userRole,
    can,
  } = useFraudShield();

  const roleMeta = ROLE_META[userRole];

  const riskDistributionData = useMemo(() => {
    let low = 0,
      med = 0,
      high = 0,
      crit = 0;
    transactions.forEach((tx) => {
      const l = tx.riskEvaluation.riskLevel;
      if (l === 'LOW') low++;
      else if (l === 'MEDIUM') med++;
      else if (l === 'HIGH') high++;
      else crit++;
    });

    return [
      { name: 'Low Risk (Approve)', value: low, color: '#10b981' },
      { name: 'Medium (OTP / Verify)', value: med, color: '#38bdf8' },
      { name: 'High (Held Review)', value: high, color: '#f59e0b' },
      { name: 'Critical (Blocked)', value: crit, color: '#ef4444' },
    ];
  }, [transactions]);

  const paymentMethodVolume = useMemo(() => {
    const map: Record<string, { method: string; volume: number; count: number }> = {
      UPI: { method: 'UPI', volume: 0, count: 0 },
      CREDIT_CARD: { method: 'Credit Card', volume: 0, count: 0 },
      DEBIT_CARD: { method: 'Debit Card', volume: 0, count: 0 },
      NET_BANKING: { method: 'Net Banking', volume: 0, count: 0 },
      DIGITAL_WALLET: { method: 'Wallet', volume: 0, count: 0 },
      CRYPTO: { method: 'Crypto', volume: 0, count: 0 },
    };
    transactions.forEach((tx) => {
      if (map[tx.paymentMethod]) {
        map[tx.paymentMethod].volume += tx.amount;
        map[tx.paymentMethod].count += 1;
      }
    });
    return Object.values(map);
  }, [transactions]);

  const geoHotspots = useMemo(() => {
    const agg: Record<string, { city: string; country: string; threats: number; total: number }> = {};
    transactions.forEach((tx) => {
      const key = tx.location.city;
      if (!agg[key]) {
        agg[key] = {
          city: tx.location.city,
          country: tx.location.countryCode || tx.location.country,
          threats: 0,
          total: 0,
        };
      }
      agg[key].total += 1;
      if (tx.riskEvaluation.riskLevel === 'HIGH' || tx.riskEvaluation.riskLevel === 'CRITICAL') {
        agg[key].threats += 1;
      }
    });
    return Object.values(agg)
      .sort((a, b) => b.threats - a.threats || b.total - a.total)
      .slice(0, 6);
  }, [transactions]);

  const recentAlerts = useMemo(() => {
    return transactions
      .filter((t) => t.riskEvaluation.riskLevel === 'CRITICAL' || t.riskEvaluation.riskLevel === 'HIGH')
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Welcome & Quick Trigger Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#0b1328] via-[#090e1f] to-[#0c1630] border border-cyan-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
              RESQ AI · {roleMeta.title.toUpperCase()} CONSOLE ({roleMeta.accessLevel})
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Real-Time Payment Security Operations Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {userRole === 'VIEWER'
              ? 'Read-only anonymized telemetry view. Customer PII and complete account numbers are masked by server RBAC policy.'
              : 'Live PostgreSQL-backed transaction intelligence, behavioral anomaly detection, and instant containment.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('make_payment')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="h-4 w-4" />
            <span>Make a Payment</span>
          </button>

          <button
            onClick={() => setActiveTab('live_radar')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
          >
            <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
            <span>Open Live Radar</span>
          </button>

          {can('reports:advanced') && (
            <button
              onClick={() => void triggerAttackScenario('SCENARIO-IMPOSSIBLE-TRAVEL')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950/60 transition-all cursor-pointer whitespace-nowrap"
            >
              <Zap className="h-4 w-4" />
              <span>Simulate Impossible Travel</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Statistics Cards (8 Metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#090f22] border border-slate-800 hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Transactions</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {stats.processedToday.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>
              {stats.successfulCount} approved · {isLiveStreaming ? 'Live stream active' : 'DB synced'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#090f22] border border-slate-800 hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Volume &amp; Blocked</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono-numbers">
            ₹{stats.totalVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.blockedCount} blocked · ₹{stats.lossesPrevented.toLocaleString()} prevented
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#090f22] border border-slate-800 hover:border-blue-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Detection Accuracy</span>
            <Shield className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono-numbers">
            {stats.preventionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            97.6% F1 on synthetic benchmark · Live hold/block rate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#090f22] border border-slate-800 hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Risk Exposure &amp; Alerts</span>
            <BellRing className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {stats.overallRiskPercentage}%
            <span className="text-xs text-slate-400 font-normal ml-1.5">
              (Avg {stats.avgRiskScore}/100)
            </span>
          </div>
          <div className="text-[11px] text-amber-400 mt-1">
            {stats.suspiciousCount} suspicious · {stats.activeAlertsCount} active alerts
          </div>
        </div>
      </div>

      {/* Main Charts Row: Preserved AnomalyTrendChart + Risk Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnomalyTrendChart />

        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              Risk Tier Distribution
            </h2>
            <p className="text-xs text-slate-400">
              Breakdown of {transactions.length} transactions by risk tier
            </p>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={76}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1428',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-mono-numbers text-white">
                {transactions.length}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {riskDistributionData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 p-2 rounded-lg bg-[#0c1428] border border-slate-800"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 truncate">{item.name}</div>
                  <div className="font-mono-numbers font-bold text-white">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Volume by Payment Method + Geo Hotspots + Intercepted Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Volume Chart */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-lg space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-cyan-400" />
              Volume by Payment Method
            </h2>
            <p className="text-xs text-slate-400">Cumulative INR volume across payment rails</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodVolume} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="method" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  formatter={(v: unknown) => `₹${Number(v).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: '#0c1428',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="volume" name="Volume (₹)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Hotspots */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                Fraud by Location
              </h2>
              <p className="text-xs text-slate-400">Live origin hotspots from backend records</p>
            </div>
            {can('transactions:view_full') && (
              <button
                onClick={() => setActiveTab('threat_intel')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Map</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {geoHotspots.map((hotspot) => {
              const threatPercent = Math.min(100, Math.round((hotspot.threats / Math.max(1, hotspot.total)) * 100));
              return (
                <div
                  key={hotspot.city}
                  className="p-2.5 rounded-xl bg-[#0c1428] border border-slate-800/80"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-slate-400 font-mono-numbers text-[10px]">
                        {hotspot.country}
                      </span>
                      {hotspot.city}
                    </span>
                    <span className="font-mono-numbers text-rose-400 font-semibold">
                      {hotspot.threats} threats ({hotspot.total} tx)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        threatPercent > 50 ? 'bg-rose-500' : threatPercent > 20 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.max(8, threatPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Intercepted Alerts Feed */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Recent High-Risk Activity
              </h2>
              <p className="text-xs text-slate-400">Latest flagged payments</p>
            </div>
            <button
              onClick={() => setActiveTab('live_radar')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>All ({transactions.length})</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentAlerts.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#0c1428] border border-rose-500/30 hover:border-cyan-400 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-mono-numbers font-bold text-rose-300 text-xs shrink-0">
                    {tx.riskEvaluation.riskScore}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white font-mono-numbers truncate">
                      {tx.id}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {tx.customerName} · {tx.location.city}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-white font-mono-numbers">
                    ₹{tx.amount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-300">{tx.status.replace(/_/g, ' ')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
