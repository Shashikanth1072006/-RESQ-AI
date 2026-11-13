/**
 * FRAUDSHIELD AI - Immutable Security Audit Trail
 * Cryptographic & operational audit logging for all automated engine and manual actions.
 */

import React, { useState } from 'react';
import {
  FileText,
  Clock,
  User,
  Shield,
  Download,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useFraudShield();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    return true;
  });

  const handleExportAuditCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'Operator', 'Role', 'Action', 'Target ID', 'Target Type', 'IP Address', 'Details'];
    const rows = auditLogs.map(l => [
      l.id,
      l.timestamp,
      `"${l.operator}"`,
      l.role,
      l.action,
      l.targetId,
      l.targetType,
      l.ip,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RESQ_AI_AUDIT_LOGS_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              IMMUTABLE AUDIT TRAIL
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">
            Security Governance & Event Logs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL audit ledger tracking authentication, payment evaluations, cases, warnings, rule tuning, and user access changes.
          </p>
        </div>

        <button
          onClick={handleExportAuditCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c1428] hover:bg-[#111c38] border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit Trail</span>
        </button>
      </div>

      {/* Filter and Table */}
      <div className="p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, Operator, Target..."
              className="w-full bg-[#0c1428] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-slate-400 text-xs">Action:</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-[#0c1428] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              <option value="AUTH_LOGIN">AUTH LOGIN</option>
              <option value="PAYMENT_EVALUATED">PAYMENT EVALUATED</option>
              <option value="MANUAL_BLOCK">MANUAL BLOCK</option>
              <option value="MANUAL_APPROVE">MANUAL APPROVE</option>
              <option value="CASE_STATUS_UPDATED">CASE STATUS UPDATED</option>
              <option value="FRAUD_WARNING_DISPATCHED">WARNING DISPATCHED</option>
              <option value="SENSITIVITY_TUNED">RULES / SENSITIVITY TUNED</option>
              <option value="USER_CREATED">USER CREATED</option>
              <option value="USER_PERMISSIONS_UPDATED">USER PERMISSIONS UPDATED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0c1428] border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Log ID / Time</th>
                <th className="py-2.5 px-3">Operator / Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target ID</th>
                <th className="py-2.5 px-3">Details</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#0c1428]/60 transition-colors">
                  <td className="py-2.5 px-3 font-mono-numbers">
                    <span className="font-bold text-white">{log.id}</span>
                    <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-200">{log.operator}</div>
                    <div className="text-[10px] text-cyan-400 font-mono-numbers">{log.role}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-mono-numbers font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-numbers text-cyan-300">
                    {log.targetId}
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-sm truncate">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3 font-mono-numbers text-[10px] text-slate-500">
                    {log.ip}
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
