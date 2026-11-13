/**
 * RESQ AI - Role-Scoped Analytics & Regulatory Reports
 * Supports Daily/Weekly/Monthly/Compliance/Investigation/Risk Distribution reports,
 * CSV download, and printable PDF generation.
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  CreditCard,
  Globe,
  Download,
  Printer,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFraudShield } from '../../context/FraudShieldContext';

type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'RISK_DIST' | 'COMPLIANCE' | 'INVESTIGATION';

export const AnalyticsReportsView: React.FC = () => {
  const { transactions, cases, fraudNotifications, stats, can, userRole } = useFraudShield();
  const [reportType, setReportType] = useState<ReportType>('DAILY');

  const availableReports: { id: ReportType; label: string; allowed: boolean }[] = [
    { id: 'DAILY', label: 'Daily Summary', allowed: true },
    { id: 'WEEKLY', label: 'Weekly Trend', allowed: true },
    { id: 'MONTHLY', label: 'Monthly Overview', allowed: true },
    { id: 'RISK_DIST', label: 'Risk Distribution', allowed: true },
    { id: 'COMPLIANCE', label: 'Compliance & AML', allowed: can('reports:compliance') },
    { id: 'INVESTIGATION', label: 'Investigation Summary', allowed: can('reports:advanced') || can('reports:compliance') },
  ];

  const paymentMethodData = useMemo(() => {
    const counts: Record<string, { name: string; volume: number; fraudCount: number }> = {
      UPI: { name: 'UPI', volume: 0, fraudCount: 0 },
      CREDIT_CARD: { name: 'Credit Card', volume: 0, fraudCount: 0 },
      DEBIT_CARD: { name: 'Debit Card', volume: 0, fraudCount: 0 },
      NET_BANKING: { name: 'Net Banking', volume: 0, fraudCount: 0 },
      DIGITAL_WALLET: { name: 'Digital Wallet', volume: 0, fraudCount: 0 },
      CRYPTO: { name: 'Crypto Gateway', volume: 0, fraudCount: 0 },
    };

    transactions.forEach((t) => {
      if (counts[t.paymentMethod]) {
        counts[t.paymentMethod].volume += t.amount;
        if (t.riskEvaluation.riskLevel === 'CRITICAL' || t.riskEvaluation.riskLevel === 'HIGH') {
          counts[t.paymentMethod].fraudCount += 1;
        }
      }
    });
    return Object.values(counts);
  }, [transactions]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.forEach((t) => {
      const c = t.merchant.category.replace('_', ' ');
      cats[c] = (cats[c] || 0) + 1;
    });
    return Object.entries(cats).map(([name, count]) => ({ name, count }));
  }, [transactions]);

  const handleDownloadCSV = () => {
    const headers = [
      'Transaction ID',
      'Timestamp',
      'Customer',
      'Amount (INR)',
      'Payment Method',
      'Merchant',
      'City',
      'Country',
      'Risk Score',
      'Risk Tier',
      'Status',
      'Summary',
    ];

    const rows = transactions.map((t) => [
      t.id,
      t.timestamp,
      `"${t.customerName}"`,
      t.amount,
      t.paymentMethod,
      `"${t.merchant.name}"`,
      t.location.city,
      t.location.country,
      t.riskEvaluation.riskScore,
      t.riskEvaluation.riskLevel,
      t.status,
      `"${t.riskEvaluation.summary.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RESQ_AI_${reportType}_REPORT_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              ANALYTICS &amp; REGULATORY REPORTING ({userRole})
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">RESQ AI Intelligence Reports</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-restricted executive summaries, compliance audits, CSV exports, and printable PDF reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0c1428] hover:bg-[#131e38] border border-cyan-500/40 text-cyan-300 font-bold text-xs cursor-pointer transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg cursor-pointer transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {availableReports
          .filter((r) => r.allowed)
          .map((r) => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                reportType === r.id
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-[#080e1e] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
      </div>

      {/* Report Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-[#080e1e] border border-slate-800">
          <span className="text-slate-400">Evaluated Volume</span>
          <div className="text-xl font-extrabold text-white font-mono-numbers mt-1">
            ₹{stats.totalVolume.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#080e1e] border border-slate-800">
          <span className="text-slate-400">Blocked / Prevented</span>
          <div className="text-xl font-extrabold text-emerald-400 font-mono-numbers mt-1">
            ₹{stats.lossesPrevented.toLocaleString()}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#080e1e] border border-slate-800">
          <span className="text-slate-400">Investigation Cases</span>
          <div className="text-xl font-extrabold text-amber-300 font-mono-numbers mt-1">
            {can('investigations:view') ? cases.length : 'Restricted'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#080e1e] border border-slate-800">
          <span className="text-slate-400">Warnings Dispatched</span>
          <div className="text-xl font-extrabold text-cyan-300 font-mono-numbers mt-1">
            {can('warnings:view') ? fraudNotifications.length : 'Restricted'}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-cyan-400" />
                Fraud Interceptions by Payment Rail
              </h2>
              <p className="text-xs text-slate-400">High/critical risk count per payment channel</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1428',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="fraudCount" name="Flagged Transactions" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-cyan-400" />
                Merchant Category Exposure
              </h2>
              <p className="text-xs text-slate-400">Distribution across merchant categories</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1428',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" name="Transaction Count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Compliance / Investigation Summary Table */}
      {(reportType === 'COMPLIANCE' || reportType === 'INVESTIGATION') && (
        <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span>
              {reportType === 'COMPLIANCE'
                ? 'Regulatory Compliance & Flagged Activity Ledger'
                : 'Active & Adjudicated Investigation Dockets'}
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0c1428] border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="py-2 px-3">Case ID</th>
                  <th className="py-2 px-3">Transaction</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Assigned Analyst</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cases.slice(0, 12).map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-mono-numbers text-cyan-400 font-bold">{c.id}</td>
                    <td className="py-2 px-3 font-mono-numbers text-white">{c.transactionId}</td>
                    <td className="py-2 px-3 text-slate-300">{c.customerName}</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">{c.priority}</td>
                    <td className="py-2 px-3 text-slate-200">{c.status}</td>
                    <td className="py-2 px-3 text-slate-400">{c.assignedAnalyst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
