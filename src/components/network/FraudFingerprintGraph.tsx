/**
 * FRAUDSHIELD AI - Collaborative Fraud Fingerprint Network
 * Interactive visual relationship graph connecting Customers, Devices, Merchants,
 * and Transactions to expose coordinated syndicates and device-sharing rings.
 */

import React, { useState } from 'react';
import {
  Share2,
  ShieldAlert,
  Smartphone,
  User,
  Store,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  Search
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { SEED_NETWORK_NODES, SEED_NETWORK_EDGES } from '../../data/seedData';
import { NetworkNode, NetworkEdge } from '../../types';

export const FraudFingerprintGraph: React.FC = () => {
  const { setSelectedTransaction, transactions } = useFraudShield();
  const [selectedNodeId, setSelectedNodeId] = useState<string>('DEV-REDMI-MULE-BOT');
  const [filterType, setFilterType] = useState<string>('ALL');

  const selectedNode = SEED_NETWORK_NODES.find(n => n.id === selectedNodeId) || SEED_NETWORK_NODES[0];

  // Connected edges
  const connectedEdges = SEED_NETWORK_EDGES.filter(
    e => e.source === selectedNodeId || e.target === selectedNodeId
  );

  // Connected neighbor nodes
  const connectedNodeIds = new Set<string>();
  connectedEdges.forEach(e => {
    connectedNodeIds.add(e.source);
    connectedNodeIds.add(e.target);
  });

  // Coordinates layout for nodes in SVG canvas (550x380)
  const nodeCoordinates: Record<string, { x: number; y: number }> = {
    // Customers (Left)
    'CUST-8021': { x: 70, y: 70 },
    'CUST-7733': { x: 70, y: 170 },
    'CUST-4192': { x: 70, y: 270 },
    'CUST-9314': { x: 70, y: 350 },
    'CUST-5510': { x: 130, y: 380 },

    // Devices (Middle-Left)
    'DEV-REDMI-MULE-BOT': { x: 260, y: 170 }, // Central compromised hub
    'DEV-NOX-EMU-ROOT': { x: 220, y: 60 },
    'DEV-TOR-LAPTOP-01': { x: 220, y: 300 },
    'DEV-IPHONE15-HYD': { x: 140, y: 110 },
    'DEV-S24ULTRA-MUM': { x: 140, y: 230 },

    // Transactions (Middle-Right)
    'TXN-2024-20000': { x: 370, y: 70 },
    'TXN-2024-20003': { x: 390, y: 170 },
    'TXN-2024-20004': { x: 370, y: 260 },

    // Merchants (Far-Right)
    'MCH-BIN-P2P': { x: 500, y: 70 },
    'MCH-SHD-SILK': { x: 500, y: 170 }, // Shell merchant
    'MCH-CSN-BET': { x: 500, y: 270 },
    'MCH-AMZN-IN': { x: 500, y: 350 },
    'MCH-SWIG-HYD': { x: 330, y: 380 }
  };

  const getNodeColor = (node: NetworkNode) => {
    if (node.isCompromised) return '#ef4444';
    if (node.type === 'customer') return '#8b5cf6';
    if (node.type === 'device') return '#06b6d4';
    if (node.type === 'merchant') return '#f59e0b';
    return '#10b981';
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return User;
      case 'device':
        return Smartphone;
      case 'merchant':
        return Store;
      default:
        return DollarSign;
    }
  };

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNodeId(node.id);
    if (node.type === 'transaction') {
      const tx = transactions.find(t => t.id === node.id);
      if (tx) setSelectedTransaction(tx);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Share2 className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              CROSS-ACCOUNT FRAUD SYNDICATE TOPOLOGY
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            Fraud Fingerprint Intelligence Network
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Graph relationship clustering discovering shared devices, high-risk merchant drains, and mule rings.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Customer
          </span>
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" /> Device
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Merchant
          </span>
          <span className="flex items-center gap-1.5 text-rose-400 font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" /> Compromised Ring
          </span>
        </div>
      </div>

      {/* Network Visualizer Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-[#070b16] border border-slate-800/90 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-cyan-400" />
              Interactive Entity Relationship Topology
            </span>
            <span className="text-[11px] text-slate-500">
              Click any node to inspect dossier
            </span>
          </div>

          {/* SVG Canvas */}
          <div className="relative w-full h-[460px] flex items-center justify-center">
            <svg
              className="w-full h-full"
              viewBox="0 0 580 440"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="edgeGradientSuspicious" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="edgeGradientClean" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Edges */}
              {SEED_NETWORK_EDGES.map((edge) => {
                const sCoord = nodeCoordinates[edge.source];
                const tCoord = nodeCoordinates[edge.target];
                if (!sCoord || !tCoord) return null;

                const isConnectedToSelected =
                  edge.source === selectedNodeId || edge.target === selectedNodeId;

                return (
                  <g key={edge.id}>
                    <line
                      x1={sCoord.x}
                      y1={sCoord.y}
                      x2={tCoord.x}
                      y2={tCoord.y}
                      stroke={edge.isSuspicious ? 'url(#edgeGradientSuspicious)' : 'url(#edgeGradientClean)'}
                      strokeWidth={isConnectedToSelected ? 2.5 : edge.isSuspicious ? 1.5 : 1}
                      strokeDasharray={edge.isSuspicious ? '4 2' : undefined}
                      opacity={isConnectedToSelected ? 1 : 0.6}
                    />
                  </g>
                );
              })}

              {/* Nodes */}
              {SEED_NETWORK_NODES.map((node) => {
                const coord = nodeCoordinates[node.id];
                if (!coord) return null;

                const isSelected = selectedNodeId === node.id;
                const isNeighbor = connectedNodeIds.has(node.id);
                const color = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className="cursor-pointer transition-transform hover:scale-110"
                    transform={`translate(${coord.x}, ${coord.y})`}
                  >
                    {/* Ring highlight if selected */}
                    {isSelected && (
                      <circle
                        r="22"
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                        className="animate-spin"
                        style={{ animationDuration: '6s' }}
                      />
                    )}

                    {/* Node Circle */}
                    <circle
                      r={node.isCompromised ? '15' : '12'}
                      fill="#0d1527"
                      stroke={color}
                      strokeWidth={isSelected ? '3' : '2'}
                      filter={node.isCompromised ? 'url(#glow-rose)' : undefined}
                    />

                    {/* Risk Badge dot */}
                    {node.isCompromised && (
                      <circle
                        cx="10"
                        cy="-10"
                        r="4"
                        fill="#ef4444"
                      />
                    )}

                    {/* Node Text Label */}
                    <text
                      y="26"
                      textAnchor="middle"
                      fill={isSelected ? '#38bdf8' : node.isCompromised ? '#fda4af' : '#94a3b8'}
                      fontSize="9"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {node.label.length > 16 ? node.label.slice(0, 14) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Graph Status Banner */}
          <div className="rounded-xl bg-[#0c1428] border border-rose-500/30 p-2.5 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-rose-300 font-semibold">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              Syndicate Ring Detected: Device DEV-REDMI-MULE-BOT linked to 3 accounts
            </span>
            <span className="font-mono-numbers text-[10px] text-cyan-400">
              Pattern: Device-Sharing Mule
            </span>
          </div>
        </div>

        {/* Selected Entity Dossier Inspector */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono-numbers">
              {selectedNode.type.toUpperCase()} DOSSIER
            </span>
            <div className="flex items-center justify-between mt-1">
              <h2 className="text-base font-bold text-white">{selectedNode.label}</h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono-numbers font-bold border ${
                selectedNode.riskScore >= 80
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {selectedNode.riskScore} / 100
              </span>
            </div>
            <div className="text-[11px] font-mono-numbers text-slate-400 mt-0.5">
              ID: {selectedNode.id}
            </div>
          </div>

          {/* Threat Indicator */}
          {selectedNode.isCompromised ? (
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-400">
                <ShieldAlert className="h-4 w-4" />
                Active Syndicate Linkage
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                This entity participates in a shared fraud pattern siphoning illicit capital through offshore payment shell gateways.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Clean Entity Profile: No syndicate clustering detected.</span>
            </div>
          )}

          {/* Connected Edges List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Graph Connections ({connectedEdges.length})
            </h3>

            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {connectedEdges.map((edge) => {
                const otherNodeId = edge.source === selectedNode.id ? edge.target : edge.source;
                const otherNode = SEED_NETWORK_NODES.find(n => n.id === otherNodeId);
                return (
                  <div
                    key={edge.id}
                    onClick={() => otherNode && handleNodeClick(otherNode)}
                    className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                      edge.isSuspicious
                        ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                        : 'bg-[#0c1428] border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-[11px]">
                        {otherNode?.label || otherNodeId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-numbers">
                        {edge.relation}
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      edge.isSuspicious ? 'bg-rose-500/30 text-rose-300' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {edge.isSuspicious ? 'ANOMALY' : 'CLEAN'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preset Fraud Ring Quick Links */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Quick Focus Syndicates
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setSelectedNodeId('DEV-REDMI-MULE-BOT')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#0c1428] hover:bg-[#101b38] border border-slate-800 text-xs text-slate-300 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Ring 1: Multi-Account Redmi Mule Bot</span>
                <span className="text-rose-400 font-mono-numbers text-[10px]">94 Risk</span>
              </button>
              <button
                onClick={() => setSelectedNodeId('DEV-NOX-EMU-ROOT')}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#0c1428] hover:bg-[#101b38] border border-slate-800 text-xs text-slate-300 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Ring 2: Nox Android Emulator ATO</span>
                <span className="text-rose-400 font-mono-numbers text-[10px]">92 Risk</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
