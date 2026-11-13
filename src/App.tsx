/**
 * RESQ AI - Main Application Shell & RBAC Route Guards
 * "Detect. Predict. Prevent. Protect."
 */

import React, { useState } from 'react';
import { Shield, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { FraudShieldProvider, useFraudShield } from './context/FraudShieldContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AttackAlertBanner } from './components/modal/AttackAlertBanner';
import { TransactionDetailModal } from './components/modal/TransactionDetailModal';
import { JudgeTourModal } from './components/modal/JudgeTourModal';
import { LandingHero } from './components/landing/LandingHero';
import { canAccessPage } from './utils/rbacClient';

// Core & New Module Views
import { CommandCenter } from './components/dashboard/CommandCenter';
import { LiveRadar } from './components/radar/LiveRadar';
import { PaymentGatewayView } from './components/payment/PaymentGatewayView';
import { DetectionEngineView } from './components/engine/DetectionEngineView';
import { BehavioralDNAView } from './components/behavioral/BehavioralDNAView';
import { FraudFingerprintGraph } from './components/network/FraudFingerprintGraph';
import { ThreatIntelCenter } from './components/threat/ThreatIntelCenter';
import { AttackSimulationLab } from './components/simulator/AttackSimulationLab';
import { WhatIfSimulator } from './components/simulator/WhatIfSimulator';
import { InvestigationWorkspace } from './components/investigation/InvestigationWorkspace';
import { FraudWarningCenterView } from './components/warnings/FraudWarningCenterView';
import { FraudScorecardView } from './components/scorecard/FraudScorecardView';
import { AnalyticsReportsView } from './components/analytics/AnalyticsReportsView';
import { AdaptiveProtectionView } from './components/protection/AdaptiveProtectionView';
import { AIAssistantView } from './components/assistant/AIAssistantView';
import { UserManagementView } from './components/admin/UserManagementView';
import { SystemSettingsView } from './components/settings/SystemSettingsView';
import { ProfileSettingsView } from './components/settings/ProfileSettingsView';
import { AuditLogsView } from './components/audit/AuditLogsView';

const AccessRestrictedCard: React.FC<{ onBack: () => void; role: string }> = ({ onBack, role }) => (
  <div className="p-10 rounded-2xl bg-[#080e1e] border border-rose-500/30 text-center space-y-4 max-w-lg mx-auto mt-10">
    <div className="h-12 w-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
      <Lock className="h-6 w-6" />
    </div>
    <h2 className="text-lg font-bold text-white">Access Restricted by RBAC Policy</h2>
    <p className="text-xs text-slate-400">
      Your current role (<strong className="text-slate-200">{role}</strong>) does not have authorization to view this module.
    </p>
    <button
      onClick={onBack}
      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
    >
      Return to Dashboard
    </button>
  </div>
);

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    userRole,
    userPermissions,
    isBootstrapping,
    bootstrapError,
    reloadWorkspace,
  } = useFraudShield();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const renderActiveView = () => {
    if (!canAccessPage(userRole, userPermissions, activeTab)) {
      return <AccessRestrictedCard role={userRole} onBack={() => setActiveTab('overview')} />;
    }

    switch (activeTab) {
      case 'overview':
        return <CommandCenter />;
      case 'live_radar':
        return <LiveRadar />;
      case 'make_payment':
        return <PaymentGatewayView />;
      case 'detection_engine':
        return <DetectionEngineView />;
      case 'behavioral_dna':
        return <BehavioralDNAView />;
      case 'fraud_fingerprints':
        return <FraudFingerprintGraph />;
      case 'threat_intel':
        return <ThreatIntelCenter />;
      case 'attack_simulator':
        return <AttackSimulationLab />;
      case 'what_if_simulator':
        return <WhatIfSimulator />;
      case 'investigation_workspace':
        return <InvestigationWorkspace />;
      case 'warning_center':
        return <FraudWarningCenterView />;
      case 'scorecard':
        return <FraudScorecardView />;
      case 'analytics_reports':
        return <AnalyticsReportsView />;
      case 'protection_settings':
        return <AdaptiveProtectionView />;
      case 'ai_assistant':
        return <AIAssistantView />;
      case 'user_management':
        return <UserManagementView />;
      case 'system_settings':
        return <SystemSettingsView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'profile_settings':
        return <ProfileSettingsView />;
      default:
        return <CommandCenter />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      <Navbar />
      <AttackAlertBanner />

      <div className="flex flex-1 min-h-[calc(100vh-64px)] overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#050811]">
          <div className="max-w-7xl mx-auto space-y-6">
            {bootstrapError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs text-rose-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{bootstrapError}</span>
                </div>
                <button
                  onClick={() => void reloadWorkspace()}
                  className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {isBootstrapping ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-xs text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                <span>Synchronizing PostgreSQL fraud telemetry...</span>
              </div>
            ) : (
              renderActiveView()
            )}
          </div>
        </main>
      </div>

      <TransactionDetailModal />
      <JudgeTourModal />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { currentUser, authToken, isAuthLoading } = useAuth();
  const [showPublicLanding, setShowPublicLanding] = useState<boolean>(true);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#080e1e] border border-cyan-500/30">
          <Shield className="h-6 w-6 text-cyan-400" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
          <span>Verifying RESQ AI operator session...</span>
        </div>
      </div>
    );
  }

  if (!currentUser || !authToken) {
    if (showPublicLanding) {
      return (
        <LandingHero
          onEnterApp={() => setShowPublicLanding(false)}
          onLaunchJudgeDemo={() => setShowPublicLanding(false)}
          isAuthenticated={false}
        />
      );
    }
    return <LoginPage onShowLanding={() => setShowPublicLanding(true)} />;
  }

  return (
    <FraudShieldProvider>
      <MainAppContent />
    </FraudShieldProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
