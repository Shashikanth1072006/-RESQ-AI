/**
 * RESQ AI - RBAC-Filtered Responsive Sidebar Navigation
 * Dynamically filters navigation sections strictly according to authenticated user's permissions.
 */

import React from 'react';
import {
  LayoutDashboard,
  Radio,
  CreditCard,
  Cpu,
  Dna,
  Share2,
  ShieldCheck,
  Flame,
  HelpCircle,
  Briefcase,
  BellRing,
  BarChart3,
  Sliders,
  FileText,
  Target,
  Bot,
  Users,
  Settings,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Server,
} from 'lucide-react';
import { useFraudShield, NavigationPage } from '../../context/FraudShieldContext';
import { canAccessPage } from '../../utils/rbacClient';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeTab, setActiveTab, cases, alerts, userRole, userPermissions } = useFraudShield();

  const openCasesCount = cases.filter(
    (c) => c.status === 'NEW' || c.status === 'UNDER_INVESTIGATION' || c.status === 'ESCALATED'
  ).length;
  const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  const navSections: {
    title: string;
    items: {
      id: NavigationPage;
      label: string;
      icon: React.ElementType;
      badge?: string | number;
      badgeColor?: string;
    }[];
  }[] = [
    {
      title: 'OPERATIONS & PAYMENTS',
      items: [
        { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
        {
          id: 'live_radar',
          label: 'Transactions & Radar',
          icon: Radio,
          badge: 'LIVE',
          badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
        },
        {
          id: 'make_payment',
          label: 'Make a Payment',
          icon: CreditCard,
          badge: 'SIM',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
        },
        {
          id: 'ai_assistant',
          label: 'AI Security Assistant',
          icon: Bot,
          badge: 'AI',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
        },
      ],
    },
    {
      title: 'INTELLIGENCE CORE',
      items: [
        { id: 'detection_engine', label: 'AI Fraud Detection', icon: Cpu },
        { id: 'behavioral_dna', label: 'Behavioral DNA', icon: Dna },
        { id: 'fraud_fingerprints', label: 'Fraud Fingerprints', icon: Share2 },
        { id: 'threat_intel', label: 'Geographic & Threat Intel', icon: ShieldCheck },
      ],
    },
    {
      title: 'INVESTIGATION & WARNINGS',
      items: [
        {
          id: 'investigation_workspace',
          label: 'Investigation Center',
          icon: Briefcase,
          badge: openCasesCount > 0 ? openCasesCount : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          id: 'warning_center',
          label: 'Fraud Warning Center',
          icon: BellRing,
          badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
        { id: 'protection_settings', label: 'Review & Override Queue', icon: Sliders },
        { id: 'attack_simulator', label: 'Attack Simulation Lab', icon: Flame },
        { id: 'what_if_simulator', label: 'What-If Simulator', icon: HelpCircle },
      ],
    },
    {
      title: 'GOVERNANCE & ADMIN',
      items: [
        { id: 'analytics_reports', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'scorecard', label: 'Model Scorecard', icon: Target },
        { id: 'audit_logs', label: 'Audit Logs', icon: FileText },
        { id: 'user_management', label: 'User Management', icon: Users },
        { id: 'system_settings', label: 'System Settings', icon: Settings },
        { id: 'profile_settings', label: 'Profile & Account', icon: UserCog },
      ],
    },
  ];

  // Filter items strictly by user RBAC permissions
  const visibleSections = navSections
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => canAccessPage(userRole, userPermissions, item.id)),
    }))
    .filter((sec) => sec.items.length > 0);

  return (
    <aside
      className={`relative flex flex-col border-r border-cyan-500/10 bg-[#060a15] transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-[#0d1527] border border-cyan-500/30 text-cyan-400 hover:text-white shadow-md hover:bg-cyan-950 transition-colors cursor-pointer"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/10 to-transparent text-cyan-300 border-l-2 border-cyan-400 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* System Engine Health Bar Footer */}
      <div className="border-t border-slate-800/80 p-3 bg-[#080d1c]">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 text-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <Server className="h-3.5 w-3.5 text-slate-400" />
          </div>
        ) : (
          <div className="rounded-lg bg-[#0c1428] border border-cyan-500/20 p-2.5">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                RESQ Core
              </span>
              <span className="font-mono-numbers text-[10px] text-cyan-400 font-bold">
                10 SIGNALS
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>RBAC Scope:</span>
              <span className="text-emerald-400 font-medium font-mono-numbers">{userRole}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
