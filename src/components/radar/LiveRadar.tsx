/**
 * FRAUDSHIELD AI - Live Real-Time Transaction Radar
 * High-frequency transaction stream with risk categorization, multi-signal badges,
 * advanced search & filters, and one-click forensic inspection.
 */

import React, { useState, useMemo } from 'react';
import {
  Radio,
  Search,
  Filter,
  ArrowUpDown,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  RefreshCw,
  Smartphone,
  Shield,
  Clock
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { RiskLevel, PaymentMethod, Transaction } from '../../types';

export const LiveRadar: React.FC = () => {
  const {
    transactions,
    setSelectedTransaction,
    isLiveStreaming,
    toggleLiveStream,
    streamSpeed,
    setStreamSpeed,
    triggerAttackScenario,
    can,
  } = useFraudShield();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'timestamp' | 'amount' | 'riskScore'>('timestamp');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filtered and sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      const matchesSearch =
        tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.location.country.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Risk level filter
      if (selectedRiskFilter !== 'ALL') {
        if (selectedRiskFilter === 'ATTACKS_ONLY') {
          if (!tx.isSimulatedAttack) return false;
        } else if (tx.riskEvaluation.riskLevel !== selectedRiskFilter) {
          return false;
        }
      }

      // Payment method filter
      if (selectedMethodFilter !== 'ALL' && tx.paymentMethod !== selectedMethodFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'timestamp') {
        comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else if (sortBy === 'amount') {
        comparison = b.amount - a.amount;
      } else if (sortBy === 'riskScore') {
        comparison = b.riskEvaluation.riskScore - a.riskEvaluation.riskScore;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
  }, [transactions, searchQuery, selectedRiskFilter, selectedMethodFilter, sortBy, sortOrder]);

  const getRiskScoreBadge = (score: number, level: RiskLevel) => {
    let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (level === 'CRITICAL') colorClass = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    else if (level === 'HIGH') colorClass = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    else if (level === 'MEDIUM') colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/50';

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono-numbers font-bold border ${colorClass}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {score} / 100
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'MANUALLY_RELEASED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Approved</span>;
      case 'BLOCKED':
      case 'MANUALLY_BLOCKED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400"><XCircle className="h-3.5 w-3.5" /> Blocked</span>;
      case 'HELD_FOR_REVIEW':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400"><AlertTriangle className="h-3.5 w-3.5" /> Held for Review</span>;
      case 'OTP_PENDING':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400"><Shield className="h-3.5 w-3.5" /> OTP Pending</span>;
      default:
        return <span className="text-slate-400 text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* Stream Control & Quick Trigger Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
            <Radio className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Live Real-Time Payment Stream
              <span className="text-[10px] text-cyan-400 font-mono-numbers">
                ({filteredTransactions.length} of {transactions.length} shown)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Evaluated sequentially against 10 multi-factor behavioral & biometric risk vectors
            </p>
          </div>
        </div>

        {/* Streaming Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLiveStream}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isLiveStreaming
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isLiveStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isLiveStreaming ? 'PAUSE RADAR' : 'RESUME RADAR'}</span>
          </button>

          <div className="flex items-center bg-[#070b16] border border-slate-800 rounded-lg p-0.5 text-xs font-mono-numbers">
            {[1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setStreamSpeed(spd)}
                className={`px-2 py-1 rounded transition-colors ${
                  streamSpeed === spd
                    ? 'bg-blue-600/40 text-blue-300 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {can('reports:advanced') && (
            <button
              onClick={() => void triggerAttackScenario('SCENARIO-ATO')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden sm:inline">Inject Attack</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, Customer, Merchant, City..."
            className="w-full rounded-xl bg-[#080d1a] border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Risk Level Filter */}
        <div className="flex items-center gap-1.5 rounded-xl bg-[#080d1a] border border-slate-800 px-3 py-1 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[#0b1224]">All Risk Tiers</option>
            <option value="LOW" className="bg-[#0b1224]">Low Risk (0-29)</option>
            <option value="MEDIUM" className="bg-[#0b1224]">Medium (30-59)</option>
            <option value="HIGH" className="bg-[#0b1224]">High Risk (60-79)</option>
            <option value="CRITICAL" className="bg-[#0b1224]">Critical (80-100)</option>
            <option value="ATTACKS_ONLY" className="bg-[#0b1224]">⚠️ Simulated Attacks Only</option>
          </select>
        </div>

        {/* Payment Method Filter */}
        <div className="flex items-center gap-1.5 rounded-xl bg-[#080d1a] border border-slate-800 px-3 py-1 text-xs">
          <select
            value={selectedMethodFilter}
            onChange={(e) => setSelectedMethodFilter(e.target.value)}
            className="w-full bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-[#0b1224]">All Payment Rails</option>
            <option value="UPI" className="bg-[#0b1224]">UPI Instant</option>
            <option value="CREDIT_CARD" className="bg-[#0b1224]">Credit Card</option>
            <option value="DEBIT_CARD" className="bg-[#0b1224]">Debit Card</option>
            <option value="NET_BANKING" className="bg-[#0b1224]">Net Banking</option>
            <option value="DIGITAL_WALLET" className="bg-[#0b1224]">Digital Wallet</option>
            <option value="CRYPTO" className="bg-[#0b1224]">Crypto Gateway</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center justify-between rounded-xl bg-[#080d1a] border border-slate-800 px-3 py-1 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="timestamp" className="bg-[#0b1224]">Time</option>
            <option value="amount" className="bg-[#0b1224]">Amount</option>
            <option value="riskScore" className="bg-[#0b1224]">Risk Score</option>
          </select>
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="ml-2 font-mono-numbers text-cyan-400 font-bold hover:text-cyan-300"
          >
            {sortOrder.toUpperCase()}
          </button>
        </div>

      </div>

      {/* Main Transactions Stream Table */}
      <div className="rounded-2xl border border-slate-800 bg-[#080e1e] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c1428] border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Transaction / Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount / Rail</th>
                <th className="py-3 px-4">Merchant</th>
                <th className="py-3 px-4">Location / IP</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Engine Decision</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setSelectedTransaction(tx)}
                  className={`hover:bg-[#0d162d] transition-colors cursor-pointer group ${
                    tx.isSimulatedAttack ? 'bg-rose-950/10' : ''
                  }`}
                >
                  {/* Transaction ID & Time */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-numbers font-bold text-white group-hover:text-cyan-300">
                        {tx.id}
                      </span>
                      {tx.isSimulatedAttack && (
                        <span className="rounded bg-rose-500/20 px-1.5 py-0.2 text-[9px] font-bold text-rose-300 border border-rose-500/30">
                          ATTACK
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{tx.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono-numbers">{tx.customerId}</div>
                  </td>

                  {/* Amount & Rail */}
                  <td className="py-3 px-4">
                    <div className="font-mono-numbers font-bold text-white">
                      ₹{tx.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-numbers">{tx.paymentMethod}</div>
                  </td>

                  {/* Merchant */}
                  <td className="py-3 px-4">
                    <div className="text-slate-200 truncate max-w-[140px]">{tx.merchant.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">{tx.merchant.category.replace('_', ' ')}</div>
                  </td>

                  {/* Location & IP */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300 flex items-center gap-1">
                      <span>{tx.location.city}, {tx.location.countryCode}</span>
                      {tx.location.vpnDetected && (
                        <span className="text-[9px] rounded bg-rose-500/20 text-rose-300 px-1 font-bold">VPN</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono-numbers truncate max-w-[120px]">
                      {tx.location.ipAddress}
                    </div>
                  </td>

                  {/* Risk Score */}
                  <td className="py-3 px-4">
                    {getRiskScoreBadge(tx.riskEvaluation.riskScore, tx.riskEvaluation.riskLevel)}
                  </td>

                  {/* Decision Status */}
                  <td className="py-3 px-4">
                    {getStatusBadge(tx.status)}
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTransaction(tx);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 group-hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      title="Inspect full transaction evidence & forensic report"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
