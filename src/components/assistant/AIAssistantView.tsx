/**
 * RESQ AI - Role-Scoped AI Security Assistant
 * Multi-turn cybersecurity & fraud intelligence co-pilot backed by Gemini + live PostgreSQL telemetry.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Loader2,
  Shield,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  Activity,
  FolderSearch,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFraudShield } from '../../context/FraudShieldContext';
import { queryAIAssistant, AssistantChatHistoryItem } from '../../services/geminiService';
import { ROLE_META } from '../../utils/rbacClient';
import { UserRole } from '../../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isAiGenerated?: boolean;
  isError?: boolean;
  scopeNotice?: string;
  suggestedFollowUps?: string[];
  timestamp: string;
}

const ROLE_PROMPTS: Record<UserRole, string[]> = {
  VIEWER: [
    'Summarize today’s anonymized fraud detection statistics and volume.',
    'Break down transaction activity by payment method.',
    'Explain how RESQ AI scores impossible travel and emulator fraud.',
    'Which geographic corridors currently show elevated anomaly rates?',
  ],
  COMPLIANCE_OFFICER: [
    'Summarize flagged transactions and regulatory compliance status.',
    'What is the current status of open investigation cases?',
    'Which held or blocked transactions need compliance review notes?',
    'Summarize active security alerts and prevented fraud exposure.',
  ],
  SENIOR_RISK_ANALYST: [
    'Which suspicious or blocked transactions require immediate analyst attention?',
    'Analyze impossible travel, VPN, and emulator patterns across recent blocks.',
    'What is the current status of open and escalated investigation cases?',
    'Recommend immediate containment and fraud warning actions.',
  ],
  LEAD_FRAUD_ARCHITECT: [
    'Summarize platform fraud telemetry, blocked exposure, and active alerts.',
    'Evaluate whether our current Hold and Block risk thresholds need tuning.',
    'List critical transactions and escalated syndicate cases needing review.',
    'Compare fraud exposure across payment rails and high-risk corridors.',
  ],
};

export const AIAssistantView: React.FC = () => {
  const { authToken } = useAuth();
  const {
    userRole,
    transactions,
    alerts,
    cases,
    stats,
    can,
    setSelectedTransaction,
    setActiveTab,
  } = useFraudShield();

  const buildWelcomeMessage = (role: UserRole): ChatMessage => ({
    id: `welcome-${role}`,
    sender: 'assistant',
    text: `### RESQ AI Security Assistant Ready\nHello! My responses are strictly scoped to your **${ROLE_META[role].title}** authorization level (${ROLE_META[role].accessLevel}).\n\nAsk me to analyze live transaction trends, look up any \`TXN-...\` or \`CASE-...\` ID, evaluate risk corridors, or recommend containment steps.`,
    isAiGenerated: false,
    scopeNotice:
      role === 'VIEWER'
        ? 'Anonymized Aggregate Telemetry Only'
        : `Scoped to ${ROLE_META[role].title}`,
    suggestedFollowUps: ROLE_PROMPTS[role].slice(0, 3),
    timestamp: new Date().toISOString(),
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildWelcomeMessage(userRole)]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const starterPrompts = useMemo(() => ROLE_PROMPTS[userRole] || ROLE_PROMPTS.VIEWER, [userRole]);
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const openCasesCount = cases.filter(
    (c) => c.status === 'NEW' || c.status === 'UNDER_INVESTIGATION' || c.status === 'ESCALATED'
  ).length;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleResetChat = () => {
    setMessages([buildWelcomeMessage(userRole)]);
    setInput('');
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard unsupported in restricted contexts
    }
  };

  const handleEntityClick = (token: string) => {
    const clean = token.toUpperCase();
    if (clean.startsWith('TXN-')) {
      const tx = transactions.find((t) => t.id.toUpperCase() === clean);
      if (tx) {
        setSelectedTransaction(tx);
      } else {
        setActiveTab('live_radar');
      }
      return;
    }
    if (clean.startsWith('CASE-') && can('investigations:view')) {
      setActiveTab('investigation_workspace');
    }
  };

  const handleSend = async (promptText?: string) => {
    const q = (promptText ?? input).trim();
    if (!q || isLoading) return;

    const historyPayload: AssistantChatHistoryItem[] = messages
      .filter((m) => !m.id.startsWith('welcome-') && !m.isError)
      .slice(-8)
      .map((m) => ({
        role: m.sender,
        text: m.text,
      }));

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setIsLoading(true);

    try {
      const result = await queryAIAssistant(q, authToken, historyPayload);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: result.reply,
          isAiGenerated: result.isAiGenerated,
          scopeNotice: result.scopeNotice,
          suggestedFollowUps: result.suggestedFollowUps,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text:
            err instanceof Error
              ? err.message
              : 'Unable to reach RESQ AI Security Assistant right now.',
          isError: true,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInlineTokens = (line: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\bTXN-[A-Z0-9-]+\b|\bCASE-[A-Z0-9-]+\b)/gi);
    return parts.map((part, idx) => {
      if (!part) return null;

      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong key={idx} className="font-bold text-white">
            {renderInlineTokens(inner)}
          </strong>
        );
      }

      const rawCode = part.startsWith('`') && part.endsWith('`') ? part.slice(1, -1) : part;
      if (/^(TXN|CASE)-[A-Z0-9-]+$/i.test(rawCode)) {
        const isCase = rawCode.toUpperCase().startsWith('CASE-');
        const clickable = !isCase || can('investigations:view');
        return (
          <button
            key={idx}
            type="button"
            disabled={!clickable}
            onClick={() => handleEntityClick(rawCode)}
            title={
              isCase
                ? clickable
                  ? 'Open Investigation Center'
                  : 'Restricted from VIEWER role'
                : 'Inspect Transaction Forensics'
            }
            className={`inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded font-mono-numbers text-[11px] font-semibold border transition-colors ${
              isCase
                ? clickable
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25 cursor-pointer'
                  : 'bg-slate-800 border-slate-700 text-slate-400 cursor-default'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 cursor-pointer'
            }`}
          >
            <span>{rawCode}</span>
            {clickable && <ExternalLink className="h-2.5 w-2.5" />}
          </button>
        );
      }

      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-cyan-200 font-mono-numbers text-[11px]"
          >
            {rawCode}
          </code>
        );
      }

      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const renderStructuredMarkdown = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5">
        {lines.map((rawLine, index) => {
          const line = rawLine.trim();
          if (!line) {
            return <div key={index} className="h-1" />;
          }
          if (line === '---' || line === '***') {
            return <hr key={index} className="border-slate-800 my-2" />;
          }
          if (line.startsWith('### ')) {
            return (
              <h3
                key={index}
                className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 pt-1.5 first:pt-0"
              >
                {renderInlineTokens(line.slice(4))}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={index} className="text-sm font-extrabold text-white pt-1.5 first:pt-0">
                {renderInlineTokens(line.slice(3))}
              </h2>
            );
          }
          if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
              <div key={index} className="flex items-start gap-2 pl-1">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                <div className="flex-1 text-xs text-slate-200 leading-relaxed">
                  {renderInlineTokens(line.slice(2))}
                </div>
              </div>
            );
          }
          const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={index} className="flex items-start gap-2 pl-1">
                <span className="text-[11px] font-bold font-mono-numbers text-cyan-400 shrink-0 min-w-[16px]">
                  {numMatch[1]}.
                </span>
                <div className="flex-1 text-xs text-slate-200 leading-relaxed">
                  {renderInlineTokens(numMatch[2])}
                </div>
              </div>
            );
          }
          return (
            <p key={index} className="text-xs text-slate-200 leading-relaxed">
              {renderInlineTokens(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const latestAssistantMsg = [...messages].reverse().find((m) => m.sender === 'assistant' && !m.isError);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Live Context Telemetry Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bot className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              ROLE-SCOPED AI FRAUD INTELLIGENCE
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">RESQ AI Security Assistant</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-turn cybersecurity co-pilot grounded in live PostgreSQL telemetry ({ROLE_META[userRole].title}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c1428] border border-slate-800 text-[11px] text-slate-300 font-mono-numbers">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>{transactions.length} TXNs</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c1428] border border-slate-800 text-[11px] text-amber-300 font-mono-numbers">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{activeAlertsCount} Alerts</span>
          </div>
          {can('investigations:view') && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c1428] border border-slate-800 text-[11px] text-purple-300 font-mono-numbers">
              <FolderSearch className="h-3.5 w-3.5" />
              <span>{openCasesCount} Open Cases</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1428] border border-cyan-500/30 text-[11px] text-cyan-300 font-semibold">
            <Shield className="h-3.5 w-3.5" />
            <span>{userRole === 'VIEWER' ? 'Anonymized Scope' : 'Full Authorized Context'}</span>
          </div>
          <button
            type="button"
            onClick={handleResetChat}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Start a fresh conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Role-Adaptive Starter Prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {starterPrompts.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => void handleSend(q)}
            disabled={isLoading}
            className="p-3 rounded-xl bg-[#0c1428] hover:bg-[#131e38] border border-slate-800 hover:border-cyan-500/40 text-left text-xs text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
              Quick Inquiry
            </span>
            <span className="line-clamp-2 leading-relaxed">{q}</span>
          </button>
        ))}
      </div>

      {/* Chat Workspace */}
      <div className="rounded-2xl bg-[#080e1e] border border-slate-800 shadow-xl flex flex-col h-[560px]">
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl p-4 space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-cyan-600/20 border border-cyan-500/40 text-white'
                    : m.isError
                    ? 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
                    : 'bg-[#0c1428] border border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 border-b border-slate-800/70 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-cyan-300 flex items-center gap-1">
                      {m.sender === 'assistant' && <Sparkles className="h-3 w-3" />}
                      {m.sender === 'user' ? 'You' : 'RESQ AI Assistant'}
                    </span>
                    {m.sender === 'assistant' && !m.isError && m.id !== `welcome-${userRole}` && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                          m.isAiGenerated
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        }`}
                      >
                        {m.isAiGenerated ? 'Live Gemini AI' : 'Deterministic Fallback'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {m.sender === 'assistant' && !m.isError && (
                      <button
                        type="button"
                        onClick={() => void handleCopy(m.id, m.text)}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                        title="Copy response"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                    <span className="font-mono-numbers">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {m.sender === 'user' ? (
                  <div className="text-xs leading-relaxed whitespace-pre-line">{m.text}</div>
                ) : (
                  renderStructuredMarkdown(m.text)
                )}

                {m.scopeNotice && (
                  <div className="pt-1 text-[10px] text-slate-500 font-mono-numbers">
                    {m.scopeNotice}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0c1428] border border-cyan-500/20 text-xs text-cyan-300 max-w-sm">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Correlating live PostgreSQL telemetry & Gemini AI...</span>
            </div>
          )}
        </div>

        {/* Suggested Follow-Ups */}
        {!isLoading &&
          latestAssistantMsg?.suggestedFollowUps &&
          latestAssistantMsg.suggestedFollowUps.length > 0 && (
            <div className="px-4 py-2 border-t border-slate-800/70 bg-[#070b18] flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">
                Follow-ups:
              </span>
              {latestAssistantMsg.suggestedFollowUps.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => void handleSend(f)}
                  className="px-2.5 py-1 rounded-lg bg-[#0c1428] hover:bg-[#131e38] border border-slate-800 hover:border-cyan-500/40 text-[11px] text-cyan-300 hover:text-white transition-colors cursor-pointer"
                >
                  {f}
                </button>
              ))}
            </div>
          )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
          className="border-t border-slate-800 p-4 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask RESQ AI about transactions (e.g., TXN-...), risk scores, cases, or threat patterns..."
            className="flex-1 rounded-xl bg-[#0c1428] border border-slate-800 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
