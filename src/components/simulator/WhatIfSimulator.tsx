/**
 * RESQ AI - What-If Transaction Fraud Simulator
 * Allows operators to input hypothetical payment variables, instantly compute
 * deterministic risk scores and factor breakdowns, and benchmark against customer baseline.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  User,
  DollarSign,
  Store,
  MapPin,
  Smartphone,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import {
  SEED_MERCHANTS,
  SEED_DEVICES
} from '../../data/seedData';
import { evaluateTransactionRisk } from '../../engine/fraudEngine';
import { RiskEvaluation, PaymentMethod, GeoLocation } from '../../types';

export const WhatIfSimulator: React.FC = () => {
  const { customers, sensitivityConfig, setSelectedTransaction, injectCustomTransaction } = useFraudShield();

  // Form inputs
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0].customerId);
  const [amount, setAmount] = useState<number>(75000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [merchantKey, setMerchantKey] = useState<string>('binance_p2p');
  const [deviceKey, setDeviceKey] = useState<string>('rogue_emulator');
  const [city, setCity] = useState<string>('Moscow');
  const [country, setCountry] = useState<string>('Russian Federation');
  const [isVpn, setIsVpn] = useState<boolean>(true);
  const [transactionHour, setTransactionHour] = useState<number>(3); // 3 AM
  const [recentVelocity, setRecentVelocity] = useState<number>(6);
  const [failedAttempts, setFailedAttempts] = useState<number>(3);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<RiskEvaluation | null>(null);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);

  const activeCustomer = customers.find(c => c.customerId === selectedCustomerId) || customers[0];

  const handleAnalyze = () => {
    const merchant = SEED_MERCHANTS[merchantKey] || SEED_MERCHANTS.amazon_in;
    const device = SEED_DEVICES[deviceKey] || SEED_DEVICES.iphone15_aarav;

    const fakeLocation: GeoLocation = {
      city,
      country,
      countryCode: country === 'India' ? 'IN' : 'RU',
      latitude: city === 'Moscow' ? 55.7558 : city === 'London' ? 51.5074 : 17.3850,
      longitude: city === 'Moscow' ? 37.6173 : city === 'London' ? -0.1278 : 78.4867,
      ipAddress: isVpn ? '185.220.101.42' : '103.20.10.15',
      vpnDetected: isVpn
    };

    const txDate = new Date();
    txDate.setHours(transactionHour, 15, 0, 0);

    const result = evaluateTransactionRisk({
      amount,
      paymentMethod,
      merchant,
      location: fakeLocation,
      device,
      timestamp: txDate.toISOString(),
      customerProfile: activeCustomer,
      recentTransactionsCountLastHour: recentVelocity,
      lastKnownTransaction: {
        location: {
          city: activeCustomer.commonLocations[0].city,
          country: activeCustomer.commonLocations[0].country,
          countryCode: 'IN',
          latitude: 17.3850,
          longitude: 78.4867,
          ipAddress: '103.20.10.15'
        },
        timestamp: new Date(txDate.getTime() - 25 * 60 * 1000).toISOString()
      },
      failedAttemptsPrior: failedAttempts
    }, sensitivityConfig);

    setAnalysisResult(result);
  };

  const handleInjectIntoStream = async () => {
    if (!analysisResult) handleAnalyze();
    const merchant = SEED_MERCHANTS[merchantKey] || SEED_MERCHANTS.amazon_in;
    const device = SEED_DEVICES[deviceKey] || SEED_DEVICES.iphone15_aarav;

    const fakeLocation: GeoLocation = {
      city,
      country,
      countryCode: country === 'India' ? 'IN' : 'RU',
      latitude: city === 'Moscow' ? 55.7558 : 17.3850,
      longitude: city === 'Moscow' ? 37.6173 : 78.4867,
      ipAddress: isVpn ? '185.220.101.42' : '103.20.10.15',
      vpnDetected: isVpn
    };

    setIsInjecting(true);
    try {
      const newTx = await injectCustomTransaction({
        customerId: selectedCustomerId,
        amount,
        paymentMethod,
        merchant,
        location: fakeLocation,
        device
      });
      if (newTx) {
        setSelectedTransaction(newTx);
      }
    } finally {
      setIsInjecting(false);
    }
  };

  const setPresetScenario = (type: 'SAFE' | 'ATO_CRYPTO' | 'MICRO_CARD_TEST' | 'MIDNIGHT_EXTRACTION') => {
    if (type === 'SAFE') {
      setSelectedCustomerId('CUST-8021'); // Aarav
      setAmount(850);
      setPaymentMethod('UPI');
      setMerchantKey('swiggy');
      setDeviceKey('iphone15_aarav');
      setCity('Hyderabad');
      setCountry('India');
      setIsVpn(false);
      setTransactionHour(14);
      setRecentVelocity(1);
      setFailedAttempts(0);
    } else if (type === 'ATO_CRYPTO') {
      setSelectedCustomerId('CUST-8021'); // Aarav
      setAmount(85000);
      setPaymentMethod('UPI');
      setMerchantKey('binance_p2p');
      setDeviceKey('rogue_emulator');
      setCity('Moscow');
      setCountry('Russian Federation');
      setIsVpn(true);
      setTransactionHour(3);
      setRecentVelocity(6);
      setFailedAttempts(4);
    } else if (type === 'MICRO_CARD_TEST') {
      setSelectedCustomerId('CUST-9314'); // Vikram
      setAmount(35);
      setPaymentMethod('CREDIT_CARD');
      setMerchantKey('micro_test_pay');
      setDeviceKey('vpn_laptop_scammer');
      setCity('Frankfurt');
      setCountry('Germany');
      setIsVpn(true);
      setTransactionHour(11);
      setRecentVelocity(9);
      setFailedAttempts(2);
    } else if (type === 'MIDNIGHT_EXTRACTION') {
      setSelectedCustomerId('CUST-4192'); // Priya
      setAmount(64000);
      setPaymentMethod('CREDIT_CARD');
      setMerchantKey('casino_royal');
      setDeviceKey('compromised_mule_phone');
      setCity('Dubai');
      setCountry('United Arab Emirates');
      setIsVpn(true);
      setTransactionHour(4);
      setRecentVelocity(4);
      setFailedAttempts(3);
    }
    // Auto re-analyze on preset change
    setTimeout(handleAnalyze, 50);
  };

  // Run initial analysis on mount
  React.useEffect(() => {
    handleAnalyze();
  }, [selectedCustomerId, sensitivityConfig]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              FEATURE 1: JUDGE EXPERIMENTATION BENCH
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            What-If Hypothetical Transaction Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test any payment parameter to evaluate how the deterministic 10-signal engine reacts in real time.
          </p>
        </div>

        {/* Preset scenario buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-500 hidden xl:inline">Presets:</span>
          <button
            onClick={() => setPresetScenario('SAFE')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
          >
            Normal Swiggy (₹850)
          </button>
          <button
            onClick={() => setPresetScenario('ATO_CRYPTO')}
            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
          >
            Moscow ATO (₹85,000)
          </button>
          <button
            onClick={() => setPresetScenario('MICRO_CARD_TEST')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900 border border-amber-500/30 text-amber-300 text-xs font-semibold cursor-pointer"
          >
            Card Testing (₹35)
          </button>
        </div>
      </div>

      {/* Two Column Grid: Inputs on Left, Real-Time Scoring on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Input Form Controls */}
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-cyan-400" />
            Hypothetical Payment Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            
            {/* Target Customer */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Account Holder Profile
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.customerId} value={c.customerId}>
                    {c.name} ({c.customerId}) - Baseline: ₹{c.typicalAmountMin} - ₹{c.typicalAmountMax} ({c.commonLocations[0].city})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Transaction Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono-numbers">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#0c1428] border border-slate-800 rounded-lg pl-8 pr-3 py-2 font-mono-numbers text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Payment Rail
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="UPI">UPI Instant</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="NET_BANKING">Net Banking</option>
                <option value="CRYPTO">Crypto Gateway</option>
              </select>
            </div>

            {/* Destination Merchant */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Destination Merchant
              </label>
              <select
                value={merchantKey}
                onChange={(e) => setMerchantKey(e.target.value)}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {Object.entries(SEED_MERCHANTS).map(([k, m]) => (
                  <option key={k} value={k}>
                    {m.name} ({m.category}) - Risk Tier: {m.riskTier}
                  </option>
                ))}
              </select>
            </div>

            {/* Device Profile */}
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Hardware Device Fingerprint
              </label>
              <select
                value={deviceKey}
                onChange={(e) => setDeviceKey(e.target.value)}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {Object.entries(SEED_DEVICES).map(([k, d]) => (
                  <option key={k} value={k}>
                    {d.deviceId} ({d.os}) - {d.isEmulator ? 'EMULATOR / ROOTED' : `Trust: ${d.trustScore}/100`}
                  </option>
                ))}
              </select>
            </div>

            {/* City & Country */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Origin City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Country
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Time of Day & Velocity */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Time of Day (0 - 23 hrs)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={transactionHour}
                onChange={(e) => setTransactionHour(Number(e.target.value))}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono-numbers focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Recent Tx Count (Last 60m)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={recentVelocity}
                onChange={(e) => setRecentVelocity(Number(e.target.value))}
                className="w-full bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-white font-mono-numbers focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Commercial VPN Toggle */}
            <div className="sm:col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-[#0c1428] border border-slate-800">
              <span className="text-slate-300 font-medium">Detect Commercial Proxy / Tor VPN Node:</span>
              <input
                type="checkbox"
                checked={isVpn}
                onChange={(e) => setIsVpn(e.target.checked)}
                className="h-4 w-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleAnalyze}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/40 cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Calculate Risk Score</span>
            </button>

            <button
              onClick={() => void handleInjectIntoStream()}
              disabled={isInjecting}
              className="px-4 py-2.5 rounded-xl bg-[#0c1428] hover:bg-[#111c38] border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Inject this simulated transaction directly into the live radar stream"
            >
              {isInjecting ? 'Injecting...' : 'Inject to Stream'}
            </button>
          </div>
        </div>

        {/* Right: Instant Score & Factor Breakdown */}
        {analysisResult && (
          <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  REAL-TIME RISK ENGINE EVALUATION
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Decision:</span>
                  <span className={`font-mono-numbers ${
                    analysisResult.riskLevel === 'CRITICAL' ? 'text-rose-400' :
                    analysisResult.riskLevel === 'HIGH' ? 'text-orange-400' :
                    analysisResult.riskLevel === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {analysisResult.decision}
                  </span>
                </h3>
              </div>

              <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center border font-mono-numbers font-black ${
                analysisResult.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' :
                analysisResult.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-300 border-orange-500/50' :
                analysisResult.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              }`}>
                <span className="text-xl leading-none">{analysisResult.riskScore}</span>
                <span className="text-[9px] font-normal opacity-70">/ 100</span>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="p-3.5 rounded-xl bg-[#0c1428] border border-cyan-500/30 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                Automated Policy Action
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {analysisResult.recommendation}
              </p>
              <div className="mt-2 text-[11px] text-slate-400 font-mono-numbers">
                Estimated Fraud Probability: {(analysisResult.fraudProbability * 100).toFixed(0)}% • Engine Latency: {analysisResult.latencyMs}ms
              </div>
            </div>

            {/* Individual Factors List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Triggered Risk Factors ({analysisResult.factors.filter(f => f.anomalyDetected).length} Anomaly Signals)
              </h4>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {analysisResult.factors.map((f) => (
                  <div
                    key={f.code}
                    className={`p-2.5 rounded-xl border text-xs ${
                      f.anomalyDetected
                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                        : 'bg-[#070b16] border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <div className="flex items-center gap-1.5">
                        {f.anomalyDetected ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                        ) : (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>{f.name}</span>
                      </div>
                      <span className="font-mono-numbers">
                        +{f.score} pts
                      </span>
                    </div>
                    <p className="text-[11px] opacity-90 pl-5">
                      {f.evidence}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
