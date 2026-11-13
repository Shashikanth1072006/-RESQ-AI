/**
 * RESQ AI - Fraud Investigation Center
 * Search by TXN ID, filter by risk/priority/amount, assign analysts,
 * add compliance/analyst notes, escalate/resolve cases, and export forensic dossiers.
 */

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Send,
  CheckCircle2,
  XCircle,
  FileDown,
  Eye,
  Search,
  MessageSquare,
  Tag,
  AlertTriangle,
  BellRing,
  Lock,
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { CaseStatus } from '../../types';

export const InvestigationWorkspace: React.FC = () => {
  const {
    cases,
    updateCaseStatus,
    addCaseNote,
    transactions,
    setSelectedTransaction,
    setActiveTab,
    setPreselectedWarningTxId,
    can,
  } = useFraudShield();

  const canManageCases = can('investigations:manage');
  const canAddNotes = can('investigations:note');
  const canSendWarnings = can('warnings:send');

  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [minAmount, setMinAmount] = useState<string>('');
  const [analystInput, setAnalystInput] = useState<string>('');
  const [outcomeInput, setOutcomeInput] = useState<string>('');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.id.toLowerCase().includes(q) ||
          c.transactionId.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (minAmount.trim()) {
        const minVal = Number(minAmount);
        const relTx = transactions.find((t) => t.id === c.transactionId);
        if (Number.isFinite(minVal) && (!relTx || relTx.amount < minVal)) {
          return false;
        }
      }

      return true;
    });
  }, [cases, statusFilter, priorityFilter, searchQuery, minAmount, transactions]);

  const selectedCase =
    filteredCases.find((c) => c.id === selectedCaseId) || filteredCases[0] || cases[0];
  const relatedTx = transactions.find((t) => t.id === selectedCase?.transactionId);

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !selectedCase || !canAddNotes) return;
    await addCaseNote(selectedCase.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleStatusChange = async (nextStatus: CaseStatus, noteText: string) => {
    if (!selectedCase || !canManageCases) return;
    await updateCaseStatus(
      selectedCase.id,
      nextStatus,
      noteText,
      analystInput.trim() || undefined,
      outcomeInput.trim() || undefined
    );
  };

  const handleExportForensicReport = () => {
    if (!selectedCase) return;
    const reportText = `
=====================================================
RESQ AI - FORENSIC FRAUD INVESTIGATION REPORT
=====================================================
Case ID: ${selectedCase.id}
Title: ${selectedCase.title}
Created: ${selectedCase.createdAt}
Updated: ${selectedCase.updatedAt}
Assigned Analyst: ${selectedCase.assignedAnalyst}
Priority: ${selectedCase.priority}
Current Status: ${selectedCase.status}
Outcome Summary: ${selectedCase.outcomeNotes || 'Pending final adjudication'}

=== SUBJECT DOSSIER ===
Customer: ${selectedCase.customerName} (${selectedCase.customerId})
Associated Transaction: ${selectedCase.transactionId}
Transaction Amount: ₹${relatedTx?.amount.toLocaleString() || 'N/A'}
Payment Method: ${relatedTx?.paymentMethod || 'N/A'}
Merchant: ${relatedTx?.merchant.name || 'N/A'} (${relatedTx?.merchant.category || 'N/A'})
Location: ${relatedTx?.location.city || 'N/A'}, ${relatedTx?.location.country || 'N/A'}
Originating Device: ${relatedTx?.device.deviceId || 'N/A'} (${relatedTx?.device.os || 'N/A'})

=== DETERMINISTIC RISK ASSESSMENT ===
Risk Score: ${relatedTx?.riskEvaluation.riskScore ?? 'N/A'} / 100 (${relatedTx?.riskEvaluation.riskLevel || 'N/A'})
Engine Decision: ${relatedTx?.riskEvaluation.decision || 'N/A'}
Engine Summary: ${relatedTx?.riskEvaluation.summary || 'N/A'}

=== CASE INVESTIGATION NOTES & AUDIT TRAIL ===
${selectedCase.notes.map((n) => `[${new Date(n.timestamp).toLocaleString()}] ${n.author}: ${n.text}`).join('\n')}

=====================================================
Certified by RESQ AI Fraud Intelligence Core
=====================================================
`;
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RESQ_AI_CASE_${selectedCase.id}_REPORT.txt`;
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
            <Briefcase className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              FRAUD INVESTIGATION CENTER
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">Case Management &amp; Forensic Dossier</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search suspicious transactions, collaborate via investigation notes, escalate critical cases, and export audit dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedCase && (
            <button
              onClick={handleExportForensicReport}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              <span>Export Case Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Multi-Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TXN ID, Case ID, Customer..."
            className="w-full rounded-xl bg-[#080e1e] border border-slate-800 pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl bg-[#080e1e] border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">New</option>
          <option value="UNDER_INVESTIGATION">Under Investigation</option>
          <option value="ESCALATED">Escalated</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CONFIRMED_FRAUD">Confirmed Fraud</option>
          <option value="FALSE_POSITIVE">False Positive</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-xl bg-[#080e1e] border border-slate-800 px-3 py-2 text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Risk Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <input
          type="number"
          min="0"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          placeholder="Min Amount (₹)"
          className="rounded-xl bg-[#080e1e] border border-slate-800 px-3 py-2 text-white placeholder-slate-500 font-mono-numbers focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="p-4 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-300">
              Cases ({filteredCases.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredCases.map((c) => {
              const isSelected = c.id === selectedCase?.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-cyan-950/25 border-cyan-500/40 text-cyan-200'
                      : 'bg-[#0c1428] border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-numbers text-[10px] font-bold text-cyan-400">
                      {c.id}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        c.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : c.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-white line-clamp-1">{c.title}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{c.customerName}</span>
                    <span className="font-mono-numbers text-[10px]">{c.transactionId}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>{c.notes.length} notes</span>
                    <span className="font-semibold text-slate-300 uppercase">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCases.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500">
                No investigation cases match your filter.
              </div>
            )}
          </div>
        </div>

        {/* Selected Case Detail */}
        {selectedCase ? (
          <div className="lg:col-span-2 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-numbers text-xs font-bold text-cyan-400">
                    {selectedCase.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-200">
                    {selectedCase.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mt-0.5">{selectedCase.title}</h2>
                <p className="text-xs text-slate-400">
                  Analyst: <strong className="text-white">{selectedCase.assignedAnalyst}</strong> · Updated:{' '}
                  {new Date(selectedCase.updatedAt).toLocaleString()}
                </p>
              </div>

              {canManageCases ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() =>
                      void handleStatusChange(
                        'UNDER_INVESTIGATION',
                        'Assigned for active forensic review'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 text-xs font-bold cursor-pointer"
                  >
                    Investigate
                  </button>
                  <button
                    onClick={() =>
                      void handleStatusChange('ESCALATED', 'Escalated to Lead Fraud Architect')
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Escalate</span>
                  </button>
                  <button
                    onClick={() =>
                      void handleStatusChange(
                        'CONFIRMED_FRAUD',
                        'Confirmed fraudulent activity after evidence review'
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Confirmed Fraud</span>
                  </button>
                  <button
                    onClick={() =>
                      void handleStatusChange(
                        'FALSE_POSITIVE',
                        'Verified legitimate activity with customer'
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>False Positive</span>
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold">
                  <Lock className="h-3.5 w-3.5" /> Status changes require Analyst/Architect
                </span>
              )}
            </div>

            {canManageCases && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <input
                  type="text"
                  value={analystInput}
                  onChange={(e) => setAnalystInput(e.target.value)}
                  placeholder={`Reassign analyst (current: ${selectedCase.assignedAnalyst})`}
                  className="rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={outcomeInput}
                  onChange={(e) => setOutcomeInput(e.target.value)}
                  placeholder="Outcome summary / resolution memo..."
                  className="rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Related Transaction Quick Card */}
            {relatedTx && (
              <div className="p-3.5 rounded-xl bg-[#0c1428] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono-numbers font-bold text-white">{relatedTx.id}</span>
                    <span className="font-mono-numbers font-bold text-rose-400">
                      ₹{relatedTx.amount.toLocaleString()}
                    </span>
                    <span className="text-slate-400">· {relatedTx.merchant.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {relatedTx.location.city}, {relatedTx.location.country} · Score:{' '}
                    {relatedTx.riskEvaluation.riskScore}/100 ({relatedTx.status})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedTransaction(relatedTx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Inspect TXN</span>
                  </button>
                  {canSendWarnings && (
                    <button
                      onClick={() => {
                        setPreselectedWarningTxId(relatedTx.id);
                        setActiveTab('warning_center');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold cursor-pointer"
                    >
                      <BellRing className="h-3.5 w-3.5" />
                      <span>Send Warning</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Tags:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCase.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-[#070b16] border border-slate-800 text-[10px] text-slate-300 font-mono-numbers"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Investigation Notes Feed */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Evidentiary Notes &amp; Compliance Log
              </h3>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedCase.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#0c1428] border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-cyan-300">
                        {note.author} {note.authorRole ? `(${note.authorRole})` : ''}
                      </span>
                      <span>{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>

              {canAddNotes && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Enter compliance finding, callback result, or forensic note..."
                    className="flex-1 bg-[#0c1428] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleAddNote();
                    }}
                  />
                  <button
                    onClick={() => void handleAddNote()}
                    disabled={!newNoteText.trim()}
                    className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post Note</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 rounded-2xl bg-[#080e1e] border border-slate-800 flex items-center justify-center text-slate-500 text-xs">
            Select a case to inspect details.
          </div>
        )}
      </div>
    </div>
  );
};
