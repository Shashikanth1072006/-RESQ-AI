/**
 * FRAUDSHIELD AI - Real-Time Processing & Anomaly Trend Chart
 * Interactive time-series telemetry with epoch-aligned bucketing,
 * timeframe & metric toggles, series filtering, and click-to-inspect drill-down.
 */

import React, { useMemo, useState } from 'react';
import {
  Activity,
  Pause,
  Play,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  Filter,
  RotateCcw
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useFraudShield } from '../../context/FraudShieldContext';
import { Transaction } from '../../types';

type TimeWindow = '24H' | '6H' | '1H';
type MetricMode = 'COUNT' | 'VOLUME';
type BucketFilterMode = 'ANOMALIES' | 'ALL';

interface TrendBucket {
  key: string;
  time: string;
  rangeLabel: string;
  startMs: number;
  endMs: number;
  approvedCount: number;
  flaggedCount: number;
  blockedCount: number;
  approvedVolume: number;
  flaggedVolume: number;
  blockedVolume: number;
  totalCount: number;
  totalVolume: number;
  peakRiskScore: number;
  anomalyRate: number;
  transactions: Transaction[];
}

const WINDOW_CONFIG: Record<
  TimeWindow,
  { label: string; badge: string; bucketCount: number; bucketMs: number; snapMs: number }
> = {
  '24H': {
    label: '24h',
    badge: '24h',
    bucketCount: 12,
    bucketMs: 2 * 60 * 60 * 1000,
    snapMs: 60 * 60 * 1000
  },
  '6H': {
    label: '6h',
    badge: '6h',
    bucketCount: 12,
    bucketMs: 30 * 60 * 1000,
    snapMs: 30 * 60 * 1000
  },
  '1H': {
    label: '1h Live',
    badge: '1h Live',
    bucketCount: 12,
    bucketMs: 5 * 60 * 1000,
    snapMs: 5 * 60 * 1000
  }
};

function formatClockTime(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatCompactINR(value: number): string {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(0)}k`;
  }
  return `₹${value}`;
}

function isApprovedTx(tx: Transaction): boolean {
  return tx.status === 'APPROVED' || tx.status === 'MANUALLY_RELEASED';
}

function isFlaggedTx(tx: Transaction): boolean {
  return tx.status === 'OTP_PENDING' || tx.status === 'HELD_FOR_REVIEW';
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TrendBucket }>;
  metricMode: MetricMode;
}

const CustomTrendTooltip: React.FC<CustomTooltipProps> = ({ active, payload, metricMode }) => {
  if (!active || !payload || payload.length === 0) return null;
  const bucket = payload[0]?.payload;
  if (!bucket) return null;

  const formatMetric = (count: number, volume: number) =>
    metricMode === 'COUNT'
      ? `${count.toLocaleString()} tx`
      : `₹${volume.toLocaleString()}`;

  return (
    <div className="rounded-xl bg-[#0c1428] border border-slate-700/90 p-3 shadow-2xl text-xs min-w-[210px]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2 mb-2">
        <span className="font-bold text-white font-mono-numbers">{bucket.rangeLabel}</span>
        <span className="text-[11px] text-cyan-300 font-mono-numbers">
          {bucket.totalCount} total
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Approved
          </span>
          <span className="font-mono-numbers font-semibold text-white">
            {formatMetric(bucket.approvedCount, bucket.approvedVolume)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            OTP / Held
          </span>
          <span className="font-mono-numbers font-semibold text-white">
            {formatMetric(bucket.flaggedCount, bucket.flaggedVolume)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Blocked
          </span>
          <span className="font-mono-numbers font-semibold text-white">
            {formatMetric(bucket.blockedCount, bucket.blockedVolume)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-2 mt-2 text-[11px] text-slate-400">
        <span>
          Anomaly Rate:{' '}
          <strong className="text-slate-200 font-mono-numbers">{bucket.anomalyRate}%</strong>
        </span>
        <span>
          Peak Risk:{' '}
          <strong className="text-amber-300 font-mono-numbers">{bucket.peakRiskScore}</strong>
        </span>
      </div>
      <div className="mt-1.5 text-[10px] text-cyan-400">Click point to inspect transactions</div>
    </div>
  );
};

export const AnomalyTrendChart: React.FC = () => {
  const {
    transactions,
    isLiveStreaming,
    toggleLiveStream,
    setSelectedTransaction,
    setActiveTab
  } = useFraudShield();

  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24H');
  const [metricMode, setMetricMode] = useState<MetricMode>('COUNT');
  const [visibleSeries, setVisibleSeries] = useState({
    approved: true,
    flagged: true,
    blocked: true
  });
  const [selectedBucketKey, setSelectedBucketKey] = useState<string | null>(null);
  const [bucketFilterMode, setBucketFilterMode] = useState<BucketFilterMode>('ANOMALIES');

  // Epoch-aligned sliding window buckets (immune to odd-hour key bugs & day rollovers)
  const buckets = useMemo<TrendBucket[]>(() => {
    const cfg = WINDOW_CONFIG[timeWindow];
    const now = Date.now();
    const gridEndMs = (Math.floor(now / cfg.snapMs) + 1) * cfg.snapMs;
    const windowStartMs = gridEndMs - cfg.bucketCount * cfg.bucketMs;

    const slots: TrendBucket[] = Array.from({ length: cfg.bucketCount }, (_, i) => {
      const startMs = windowStartMs + i * cfg.bucketMs;
      const endMs = startMs + cfg.bucketMs;
      const startLabel = formatClockTime(startMs);
      const endLabel = formatClockTime(endMs);
      return {
        key: `${timeWindow}-${startMs}`,
        time: startLabel,
        rangeLabel: `${startLabel} – ${endLabel}`,
        startMs,
        endMs,
        approvedCount: 0,
        flaggedCount: 0,
        blockedCount: 0,
        approvedVolume: 0,
        flaggedVolume: 0,
        blockedVolume: 0,
        totalCount: 0,
        totalVolume: 0,
        peakRiskScore: 0,
        anomalyRate: 0,
        transactions: []
      };
    });

    transactions.forEach((tx) => {
      const txMs = new Date(tx.timestamp).getTime();
      if (Number.isNaN(txMs)) return;

      // Include transactions within the active window (with slight future skew tolerance)
      if (txMs < windowStartMs || txMs > gridEndMs + 60_000) return;

      const rawIdx = Math.floor((txMs - windowStartMs) / cfg.bucketMs);
      const idx = Math.min(cfg.bucketCount - 1, Math.max(0, rawIdx));
      const slot = slots[idx];

      slot.transactions.push(tx);
      slot.totalCount += 1;
      slot.totalVolume += tx.amount;
      if (tx.riskEvaluation.riskScore > slot.peakRiskScore) {
        slot.peakRiskScore = tx.riskEvaluation.riskScore;
      }

      if (isApprovedTx(tx)) {
        slot.approvedCount += 1;
        slot.approvedVolume += tx.amount;
      } else if (isFlaggedTx(tx)) {
        slot.flaggedCount += 1;
        slot.flaggedVolume += tx.amount;
      } else {
        slot.blockedCount += 1;
        slot.blockedVolume += tx.amount;
      }
    });

    slots.forEach((slot) => {
      if (slot.totalCount > 0) {
        slot.anomalyRate = Math.round(
          ((slot.flaggedCount + slot.blockedCount) / slot.totalCount) * 100
        );
        slot.transactions.sort(
          (a, b) =>
            b.riskEvaluation.riskScore - a.riskEvaluation.riskScore ||
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
    });

    return slots;
  }, [transactions, timeWindow]);

  const windowSummary = useMemo(() => {
    let approvedCount = 0;
    let flaggedCount = 0;
    let blockedCount = 0;
    let approvedVolume = 0;
    let flaggedVolume = 0;
    let blockedVolume = 0;

    buckets.forEach((b) => {
      approvedCount += b.approvedCount;
      flaggedCount += b.flaggedCount;
      blockedCount += b.blockedCount;
      approvedVolume += b.approvedVolume;
      flaggedVolume += b.flaggedVolume;
      blockedVolume += b.blockedVolume;
    });

    const total = approvedCount + flaggedCount + blockedCount;
    const totalVolume = approvedVolume + flaggedVolume + blockedVolume;
    const anomalyCount = flaggedCount + blockedCount;
    const anomalyRate = total > 0 ? ((anomalyCount / total) * 100).toFixed(1) : '0.0';

    return {
      approvedCount,
      flaggedCount,
      blockedCount,
      approvedVolume,
      flaggedVolume,
      blockedVolume,
      total,
      totalVolume,
      anomalyCount,
      anomalyRate
    };
  }, [buckets]);

  const selectedBucket = useMemo(() => {
    if (!selectedBucketKey) return null;
    return buckets.find((b) => b.key === selectedBucketKey) ?? null;
  }, [buckets, selectedBucketKey]);

  const drilldownTransactions = useMemo(() => {
    if (!selectedBucket) return [];
    if (bucketFilterMode === 'ALL') return selectedBucket.transactions;
    return selectedBucket.transactions.filter(
      (tx) =>
        !isApprovedTx(tx) ||
        tx.riskEvaluation.riskLevel === 'HIGH' ||
        tx.riskEvaluation.riskLevel === 'CRITICAL'
    );
  }, [selectedBucket, bucketFilterMode]);

  const anySeriesVisible =
    visibleSeries.approved || visibleSeries.flagged || visibleSeries.blocked;

  const handleTimeWindowChange = (nextWindow: TimeWindow) => {
    setTimeWindow(nextWindow);
    setSelectedBucketKey(null);
  };

  const toggleSeries = (key: 'approved' | 'flagged' | 'blocked') => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleChartClick = (state: {
    activeTooltipIndex?: number | string | null;
    activeLabel?: string | number;
  }) => {
    if (!state) return;

    let clickedBucket: TrendBucket | undefined;
    if (state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
      const idx = Number(state.activeTooltipIndex);
      if (Number.isInteger(idx) && idx >= 0 && idx < buckets.length) {
        clickedBucket = buckets[idx];
      }
    }
    if (!clickedBucket && state.activeLabel !== undefined) {
      clickedBucket = buckets.find((b) => b.time === String(state.activeLabel));
    }

    if (clickedBucket) {
      setSelectedBucketKey((prev) =>
        prev === clickedBucket!.key ? null : clickedBucket!.key
      );
      const hasAnomalies = clickedBucket.flaggedCount + clickedBucket.blockedCount > 0;
      setBucketFilterMode(hasAnomalies ? 'ANOMALIES' : 'ALL');
    }
  };

  const approvedDataKey = metricMode === 'COUNT' ? 'approvedCount' : 'approvedVolume';
  const flaggedDataKey = metricMode === 'COUNT' ? 'flaggedCount' : 'flaggedVolume';
  const blockedDataKey = metricMode === 'COUNT' ? 'blockedCount' : 'blockedVolume';

  const getTxStatusDisplay = (status: Transaction['status']) => {
    if (status === 'APPROVED' || status === 'MANUALLY_RELEASED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 whitespace-nowrap">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Approved
        </span>
      );
    }
    if (status === 'OTP_PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 whitespace-nowrap">
          <Shield className="h-3.5 w-3.5" />
          OTP Verified
        </span>
      );
    }
    if (status === 'HELD_FOR_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 whitespace-nowrap">
          <AlertTriangle className="h-3.5 w-3.5" />
          Held Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5" />
        Blocked
      </span>
    );
  };

  return (
    <div className="lg:col-span-2 p-5 rounded-2xl bg-[#080e1e] border border-slate-800/90 shadow-lg space-y-4">
      {/* Header & Interactive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>
              Real-Time Processing &amp; Anomaly Trend ({WINDOW_CONFIG[timeWindow].badge})
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono-numbers">
            {windowSummary.total.toLocaleString()} transactions ·{' '}
            {windowSummary.anomalyCount.toLocaleString()} flagged/blocked (
            {windowSummary.anomalyRate}% anomaly rate)
          </p>
        </div>

        {/* Interactive Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Window Selector */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#0c1428] border border-slate-800"
            role="group"
            aria-label="Time window"
          >
            {(['24H', '6H', '1H'] as TimeWindow[]).map((win) => (
              <button
                key={win}
                type="button"
                onClick={() => handleTimeWindowChange(win)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  timeWindow === win
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {WINDOW_CONFIG[win].label}
              </button>
            ))}
          </div>

          {/* Metric Mode Selector */}
          <div
            className="flex items-center gap-1 p-1 rounded-lg bg-[#0c1428] border border-slate-800"
            role="group"
            aria-label="Metric display mode"
          >
            <button
              type="button"
              onClick={() => setMetricMode('COUNT')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metricMode === 'COUNT'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Tx Count
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('VOLUME')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metricMode === 'VOLUME'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Volume (₹)
            </button>
          </div>

          {/* Live Stream Toggle */}
          <button
            type="button"
            onClick={toggleLiveStream}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isLiveStreaming
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {isLiveStreaming ? (
              <>
                <Pause className="h-3 w-3" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Series Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleSeries('approved')}
            aria-pressed={visibleSeries.approved}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              visibleSeries.approved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#0c1428] border-slate-800 text-slate-500 opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                visibleSeries.approved ? 'bg-emerald-400' : 'bg-slate-600'
              }`}
            />
            <span>Approved</span>
            <span className="font-mono-numbers font-bold">
              {metricMode === 'COUNT'
                ? windowSummary.approvedCount
                : formatCompactINR(windowSummary.approvedVolume)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('flagged')}
            aria-pressed={visibleSeries.flagged}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              visibleSeries.flagged
                ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                : 'bg-[#0c1428] border-slate-800 text-slate-500 opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                visibleSeries.flagged ? 'bg-sky-400' : 'bg-slate-600'
              }`}
            />
            <span>OTP Verified / Held</span>
            <span className="font-mono-numbers font-bold">
              {metricMode === 'COUNT'
                ? windowSummary.flaggedCount
                : formatCompactINR(windowSummary.flaggedVolume)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('blocked')}
            aria-pressed={visibleSeries.blocked}
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              visibleSeries.blocked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : 'bg-[#0c1428] border-slate-800 text-slate-500 opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                visibleSeries.blocked ? 'bg-rose-400' : 'bg-slate-600'
              }`}
            />
            <span>Blocked</span>
            <span className="font-mono-numbers font-bold">
              {metricMode === 'COUNT'
                ? windowSummary.blockedCount
                : formatCompactINR(windowSummary.blockedVolume)}
            </span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500">
          Click any time point to inspect bucket transactions
        </span>
      </div>

      {/* Main Chart Viewport */}
      <div className="h-72 w-full">
        {!anySeriesVisible ? (
          <div className="h-full w-full rounded-xl border border-dashed border-slate-800 bg-[#0c1428]/50 flex flex-col items-center justify-center gap-3 text-center p-6">
            <p className="text-xs text-slate-400">
              All series are currently hidden. Enable at least one series to view the trend.
            </p>
            <button
              type="button"
              onClick={() => setVisibleSeries({ approved: true, flagged: true, blocked: true })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Show All Series</span>
            </button>
          </div>
        ) : windowSummary.total === 0 ? (
          <div className="h-full w-full rounded-xl border border-dashed border-slate-800 bg-[#0c1428]/50 flex flex-col items-center justify-center gap-3 text-center p-6">
            <p className="text-xs text-slate-400">
              No transactions recorded inside the {WINDOW_CONFIG[timeWindow].label} window yet.
            </p>
            <div className="flex items-center gap-2">
              {timeWindow !== '24H' && (
                <button
                  type="button"
                  onClick={() => handleTimeWindowChange('24H')}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold cursor-pointer"
                >
                  Switch to 24h Window
                </button>
              )}
              {!isLiveStreaming && (
                <button
                  type="button"
                  onClick={toggleLiveStream}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
                >
                  Resume Live Stream
                </button>
              )}
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={buckets}
              margin={{ top: 10, right: 10, left: metricMode === 'VOLUME' ? 0 : -18, bottom: 0 }}
              onClick={handleChartClick}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFlagged" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.48} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                allowDecimals={false}
                tickFormatter={(val: number) =>
                  metricMode === 'VOLUME' ? formatCompactINR(val) : String(val)
                }
              />
              <Tooltip content={<CustomTrendTooltip metricMode={metricMode} />} />

              {selectedBucket && (
                <ReferenceLine
                  x={selectedBucket.time}
                  stroke="#22d3ee"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}

              {visibleSeries.approved && (
                <Area
                  type="monotone"
                  dataKey={approvedDataKey}
                  name="Approved"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorApproved)"
                  isAnimationActive={false}
                  activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2, fill: '#080e1e' }}
                />
              )}

              {visibleSeries.flagged && (
                <Area
                  type="monotone"
                  dataKey={flaggedDataKey}
                  name="OTP Verified / Held"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFlagged)"
                  isAnimationActive={false}
                  activeDot={{ r: 5, stroke: '#38bdf8', strokeWidth: 2, fill: '#080e1e' }}
                />
              )}

              {visibleSeries.blocked && (
                <Area
                  type="monotone"
                  dataKey={blockedDataKey}
                  name="Blocked"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBlocked)"
                  isAnimationActive={false}
                  activeDot={{ r: 5, stroke: '#ef4444', strokeWidth: 2, fill: '#080e1e' }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Inline Click-to-Inspect Bucket Drill-Down Drawer */}
      {selectedBucket && (
        <div className="border-t border-slate-800 pt-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <span className="text-cyan-400 font-mono-numbers">
                  Window {selectedBucket.rangeLabel}
                </span>
                <span className="text-slate-600">·</span>
                <span className="font-mono-numbers text-slate-300">
                  {selectedBucket.totalCount} total ·{' '}
                  {selectedBucket.flaggedCount + selectedBucket.blockedCount} flagged/blocked
                </span>
                {selectedBucket.peakRiskScore > 0 && (
                  <>
                    <span className="text-slate-600">·</span>
                    <span className="font-mono-numbers text-amber-300">
                      Peak Risk {selectedBucket.peakRiskScore}/100
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0c1428] border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBucketFilterMode('ANOMALIES')}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                    bucketFilterMode === 'ANOMALIES'
                      ? 'bg-rose-500/15 text-rose-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  <span>
                    Anomalies ({selectedBucket.flaggedCount + selectedBucket.blockedCount})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setBucketFilterMode('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                    bucketFilterMode === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({selectedBucket.totalCount})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('live_radar')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold whitespace-nowrap cursor-pointer"
              >
                <span>Open Live Radar</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedBucketKey(null)}
                aria-label="Close bucket inspection"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {drilldownTransactions.length === 0 ? (
            <div className="p-4 rounded-xl bg-[#0c1428] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">
                {selectedBucket.totalCount === 0
                  ? 'No transactions were processed during this time window.'
                  : 'No flagged or blocked anomalies occurred in this window.'}
              </span>
              {selectedBucket.totalCount > 0 && bucketFilterMode === 'ANOMALIES' && (
                <button
                  type="button"
                  onClick={() => setBucketFilterMode('ALL')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold whitespace-nowrap cursor-pointer"
                >
                  Show all {selectedBucket.totalCount} transactions
                </button>
              )}
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {drilldownTransactions.map((tx) => {
                const riskLevel = tx.riskEvaluation.riskLevel;
                const scoreColor =
                  riskLevel === 'CRITICAL'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : riskLevel === 'HIGH'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : riskLevel === 'MEDIUM'
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';

                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => setSelectedTransaction(tx)}
                    className="w-full text-left group flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0c1428] border border-slate-800 hover:border-cyan-500/50 hover:bg-[#0e1832] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center font-mono-numbers font-bold text-xs shrink-0 ${scoreColor}`}
                      >
                        {tx.riskEvaluation.riskScore}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-white font-mono-numbers">
                            {tx.id}
                          </span>
                          <span className="text-slate-300 font-medium truncate">
                            {tx.customerName}
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-400 truncate">
                            {tx.merchant.name}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {tx.location.city}, {tx.location.countryCode} ·{' '}
                          {tx.riskEvaluation.summary}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      {getTxStatusDisplay(tx.status)}
                      <div className="text-right">
                        <div className="text-xs font-bold text-white font-mono-numbers">
                          ₹{tx.amount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono-numbers">
                          {new Date(tx.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
