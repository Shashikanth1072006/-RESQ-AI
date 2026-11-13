/**
 * RESQ AI - Geographic & Threat Intelligence Center
 * Interactive World Threat Map plotting live transaction & hotspot coordinates,
 * rogue hardware signatures, and blacklisted merchant directory.
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Store,
  Globe,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { SEED_DEVICES, SEED_MERCHANTS } from '../../data/seedData';

function projectCoords(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * 800;
  const y = ((90 - lat) / 180) * 400;
  return { x: Math.max(20, Math.min(780, x)), y: Math.max(20, Math.min(380, y)) };
}

export const ThreatIntelCenter: React.FC = () => {
  const { transactions, setSelectedTransaction } = useFraudShield();
  const [activeTab, setActiveTab] = useState<'geos' | 'devices' | 'merchants'>('geos');

  const rogueDevices = Object.values(SEED_DEVICES).filter((d) => d.trustScore < 50 || d.isEmulator);
  const trustedDevices = Object.values(SEED_DEVICES).filter(
    (d) => d.trustScore >= 50 && !d.isEmulator
  );
  const merchantsList = Object.values(SEED_MERCHANTS);

  const geoPoints = useMemo(() => {
    const byCity: Record<
      string,
      {
        city: string;
        country: string;
        lat: number;
        lon: number;
        total: number;
        highRisk: number;
        latestTx: (typeof transactions)[number];
      }
    > = {};

    transactions.forEach((tx) => {
      const key = `${tx.location.city}-${tx.location.countryCode}`;
      if (!byCity[key]) {
        byCity[key] = {
          city: tx.location.city,
          country: tx.location.country,
          lat: tx.location.latitude,
          lon: tx.location.longitude,
          total: 0,
          highRisk: 0,
          latestTx: tx,
        };
      }
      byCity[key].total += 1;
      if (tx.riskEvaluation.riskLevel === 'HIGH' || tx.riskEvaluation.riskLevel === 'CRITICAL') {
        byCity[key].highRisk += 1;
        byCity[key].latestTx = tx;
      }
    });

    return Object.values(byCity).sort((a, b) => b.highRisk - a.highRisk || b.total - a.total);
  }, [transactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              GEOGRAPHIC INTELLIGENCE &amp; CONSORTIUM THREATS
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            World Threat Map, Rogue Devices &amp; Merchant Risk
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time geolocation plot of transactions, high-risk VPN exit corridors, and compromised devices.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0c1428] border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('geos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'geos'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            World Threat Map ({geoPoints.length})
          </button>
          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'devices'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rogue Devices ({rogueDevices.length})
          </button>
          <button
            onClick={() => setActiveTab('merchants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'merchants'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Merchants ({merchantsList.length})
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE WORLD THREAT MAP */}
      {activeTab === 'geos' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                <span>Live Payment Origin &amp; Threat Telemetry Map</span>
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Safe
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Elevated
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Critical Threat
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-[#050914] border border-slate-800/90 overflow-hidden relative">
              <svg viewBox="0 0 800 400" className="w-full h-72 sm:h-80">
                {/* Latitude / Longitude Graticule */}
                {[80, 160, 240, 320].map((y) => (
                  <line key={`h-${y}`} x1="0" y1={y} x2="800" y2={y} stroke="#0f172a" strokeWidth="1" />
                ))}
                {[160, 320, 480, 640].map((x) => (
                  <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="400" stroke="#0f172a" strokeWidth="1" />
                ))}
                {/* Stylized Continental Silhouettes */}
                <path
                  d="M90,95 L200,80 L235,145 L180,195 L130,185 Z M215,215 L275,230 L260,340 L215,320 Z M375,85 L455,75 L475,140 L390,150 Z M385,165 L470,165 L495,275 L425,315 L385,240 Z M480,75 L680,85 L710,195 L560,225 L490,170 Z M630,260 L735,260 L725,335 L645,325 Z"
                  fill="#0e172e"
                  stroke="#1e293b"
                  strokeWidth="1.5"
                />

                {/* Plotted City Hotspots */}
                {geoPoints.map((pt) => {
                  const { x, y } = projectCoords(pt.lat, pt.lon);
                  const isCritical = pt.highRisk >= 2;
                  const isElevated = pt.highRisk === 1;
                  const fill = isCritical ? '#f43f5e' : isElevated ? '#f59e0b' : '#10b981';

                  return (
                    <g
                      key={`${pt.city}-${pt.country}`}
                      onClick={() => setSelectedTransaction(pt.latestTx)}
                      className="cursor-pointer"
                    >
                      {isCritical && (
                        <circle cx={x} cy={y} r="14" fill={fill} opacity="0.18" />
                      )}
                      <circle cx={x} cy={y} r="6" fill={fill} stroke="#050811" strokeWidth="1.5" />
                      <text
                        x={x + 9}
                        y={y + 3}
                        fill="#e2e8f0"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.city} ({pt.highRisk}/{pt.total})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geoPoints.map((geo) => (
              <div
                key={`${geo.city}-${geo.country}`}
                onClick={() => setSelectedTransaction(geo.latestTx)}
                className="p-4 rounded-xl bg-[#080e1e] border border-slate-800 hover:border-cyan-500/40 space-y-2 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white">
                      {geo.city}, {geo.country}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono-numbers ${
                      geo.highRisk >= 2
                        ? 'bg-rose-500/20 text-rose-300'
                        : geo.highRisk === 1
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {geo.highRisk} Threats / {geo.total} Tx
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono-numbers">
                  Lat {geo.lat.toFixed(2)}, Lon {geo.lon.toFixed(2)} · Click to inspect latest TXN
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEVICES */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#080e1e] border border-rose-500/30 space-y-3">
            <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Blacklisted Rogue &amp; Emulated Devices ({rogueDevices.length})
            </h2>
            <div className="space-y-2.5">
              {rogueDevices.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="p-3 rounded-xl bg-[#0c1428] border border-rose-500/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-numbers text-xs font-bold text-white">
                      {dev.deviceId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono-numbers">
                      Trust: {dev.trustScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    OS: {dev.os} · Browser: {dev.browser}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#080e1e] border border-emerald-500/30 space-y-3">
            <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Verified Trusted Hardware ({trustedDevices.length})
            </h2>
            <div className="space-y-2.5">
              {trustedDevices.map((dev) => (
                <div
                  key={dev.deviceId}
                  className="p-3 rounded-xl bg-[#0c1428] border border-emerald-500/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-numbers text-xs font-bold text-white">
                      {dev.deviceId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-numbers">
                      Trust: {dev.trustScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    OS: {dev.os} · Browser: {dev.browser}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MERCHANTS */}
      {activeTab === 'merchants' && (
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Store className="h-4 w-4 text-cyan-400" />
            Merchant Risk Directory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {merchantsList.map((m) => (
              <div
                key={m.merchantId}
                className="p-4 rounded-xl bg-[#0c1428] border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white truncate max-w-[170px]">
                    {m.name}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase bg-slate-800 text-cyan-300">
                    {m.riskTier}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 capitalize">
                  {m.category.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
