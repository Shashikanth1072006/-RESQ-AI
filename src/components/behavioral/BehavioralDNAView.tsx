/**
 * RESQ AI - Behavioral DNA Intelligence
 * Multi-dimensional customer behavioral baselines, circadian clock profiles,
 * trusted hardware registries, and anomaly delta comparisons.
 */

import React, { useState } from 'react';
import {
  Dna,
  User,
  Clock,
  MapPin,
  Smartphone,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { useFraudShield } from '../../context/FraudShieldContext';
import { CustomerBehavioralProfile } from '../../types';

export const BehavioralDNAView: React.FC = () => {
  const { customers, transactions, setSelectedTransaction, triggerAttackScenario, can } = useFraudShield();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0].customerId);

  const activeCustomer = customers.find(c => c.customerId === selectedCustomerId) || customers[0];

  // Transactions belonging to this customer
  const customerTransactions = transactions.filter(t => t.customerId === activeCustomer.customerId);
  const suspiciousCount = customerTransactions.filter(t => t.riskEvaluation.riskLevel === 'CRITICAL' || t.riskEvaluation.riskLevel === 'HIGH').length;

  // 24-hour circadian activity chart data
  const circadianData = Array.from({ length: 24 }).map((_, hour) => {
    const isHabitual = hour >= activeCustomer.preferredHoursRange[0] && hour <= activeCustomer.preferredHoursRange[1];
    const txCount = customerTransactions.filter(t => new Date(t.timestamp).getHours() === hour).length;
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      activity: txCount || (isHabitual ? Math.floor(Math.random() * 4) + 1 : 0),
      isHabitual
    };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header & Customer Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Dna className="h-4 w-4 text-purple-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              BEHAVIORAL DNA INTELLIGENCE CORE
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            Customer Baseline Profiling & Dynamic Anomaly Extraction
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Every transaction is evaluated in real time against longitudinal spending, device, and circadian habits.
          </p>
        </div>

        {/* Customer Persona Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {customers.map((c) => (
            <button
              key={c.customerId}
              onClick={() => setSelectedCustomerId(c.customerId)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCustomerId === c.customerId
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-[#0c1428] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <img
                src={c.avatarUrl}
                alt={c.name}
                className="h-5 w-5 rounded-full object-cover border border-white/20"
              />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Customer Profile Card */}
      <div className="p-6 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-xl space-y-6">
        
        {/* Profile Info Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-4">
            <img
              src={activeCustomer.avatarUrl}
              alt={activeCustomer.name}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-purple-500/40 shadow-lg shadow-purple-950/60"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{activeCustomer.name}</h2>
                <span className="font-mono-numbers text-[10px] rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 border border-purple-500/30">
                  {activeCustomer.customerId}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  activeCustomer.riskTier === 'TRUSTED'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {activeCustomer.riskTier}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeCustomer.email} • Account active since {activeCustomer.joinedDate} • {activeCustomer.totalTransactionsCount} total historical transactions
              </p>
            </div>
          </div>

          {can('reports:advanced') && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => void triggerAttackScenario('SCENARIO-ATO')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-950 cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Simulate ATO on {activeCustomer.name.split(' ')[0]}</span>
              </button>
            </div>
          )}
        </div>

        {/* Baseline DNA Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Spending DNA */}
          <div className="p-4 rounded-xl bg-[#0c1428] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 border-b border-slate-800/80 pb-2">
              <CreditCard className="h-4 w-4 text-purple-400" />
              Financial Liquidity Baseline
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Typical Spending Range:</span>
                <span className="font-mono-numbers font-bold text-white">
                  ₹{activeCustomer.typicalAmountMin.toLocaleString()} - ₹{activeCustomer.typicalAmountMax.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Historical Average (μ):</span>
                <span className="font-mono-numbers font-bold text-emerald-400">
                  ₹{activeCustomer.averageAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Standard Deviation (σ):</span>
                <span className="font-mono-numbers text-slate-300">
                  ₹{activeCustomer.standardDeviationAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">Daily Velocity Ceiling:</span>
                <span className="font-mono-numbers text-slate-300">
                  {activeCustomer.dailyTransactionVelocityLimit} tx / day
                </span>
              </div>
            </div>
          </div>

          {/* 2. Geographic & Merchant Habits */}
          <div className="p-4 rounded-xl bg-[#0c1428] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 border-b border-slate-800/80 pb-2">
              <MapPin className="h-4 w-4 text-cyan-400" />
              Geographic & Merchant Footprint
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                  Primary Geographies:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCustomer.commonLocations.map((loc) => (
                    <span
                      key={loc.city}
                      className="px-2 py-0.5 rounded bg-[#070b16] border border-slate-800 text-[11px] text-white"
                    >
                      {loc.city}, {loc.country} ({(loc.freq * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                  Habitual Categories:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCustomer.preferredCategories.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-500/30 text-[11px] text-cyan-300 capitalize"
                    >
                      {cat.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Trusted Hardware Devices */}
          <div className="p-4 rounded-xl bg-[#0c1428] border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 border-b border-slate-800/80 pb-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              Trusted Hardware Registry
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider block">
                {activeCustomer.trustedDeviceIds.length} Verified Hardware Fingerprint(s)
              </span>

              <div className="space-y-1.5">
                {activeCustomer.trustedDeviceIds.map((devId) => (
                  <div
                    key={devId}
                    className="p-2 rounded bg-[#070b16] border border-slate-800 flex items-center justify-between"
                  >
                    <div className="font-mono-numbers text-[11px] text-slate-200 truncate">
                      {devId}
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3 w-3" /> Trusted
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 24-Hour Circadian Active Hours Curve */}
        <div className="p-4 rounded-xl bg-[#0c1428] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Clock className="h-4 w-4 text-purple-400" />
              Circadian Waking & Sleeping Rhythm (Normal: {activeCustomer.preferredHoursRange[0]}:00 - {activeCustomer.preferredHoursRange[1]}:00)
            </div>
            <span className="text-[11px] text-slate-400">
              Transactions at off-hours trigger automatic step-up authentication
            </span>
          </div>

          <div className="h-40 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circadianData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1428',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="activity" name="Transactions">
                  {circadianData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isHabitual ? '#8b5cf6' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions for this Customer */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Recent Activity for {activeCustomer.name}</span>
            <span className="text-cyan-400 text-[11px] font-mono-numbers">
              {customerTransactions.length} recorded
            </span>
          </h3>

          <div className="space-y-2">
            {customerTransactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedTransaction(tx)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#0c1428] border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-mono-numbers text-xs font-bold ${
                    tx.riskEvaluation.riskLevel === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {tx.riskEvaluation.riskScore}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono-numbers">{tx.id}</span>
                      <span className="text-xs text-slate-300">{tx.merchant.name}</span>
                      {tx.isSimulatedAttack && (
                        <span className="text-[9px] rounded bg-rose-500/20 text-rose-300 px-1.5 py-0.2 font-bold">
                          ATTACK
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(tx.timestamp).toLocaleString()} • {tx.location.city}, {tx.location.country} • {tx.paymentMethod}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-white font-mono-numbers">
                    ₹{tx.amount.toLocaleString()}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
