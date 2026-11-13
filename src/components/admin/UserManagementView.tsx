/**
 * RESQ AI - User & RBAC Account Management (Lead Fraud Architect Only)
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useFraudShield } from '../../context/FraudShieldContext';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ROLE_META } from '../../utils/rbacClient';

export const UserManagementView: React.FC = () => {
  const {
    managedUsers,
    createManagedUser,
    updateManagedUser,
    resetManagedUserAccess,
  } = useFraudShield();
  const { currentUser } = useAuth();

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SENIOR_RISK_ANALYST');
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setFeedback(null);
    try {
      const created = await createManagedUser({ email, displayName, password, role });
      setFeedback({ type: 'ok', text: `Created user ${created.email} (${created.role}).` });
      setEmail('');
      setDisplayName('');
      setPassword('');
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to create user.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRoleUpdate = async (userId: number, newRole: UserRole) => {
    setFeedback(null);
    try {
      const updated = await updateManagedUser(userId, { role: newRole });
      setFeedback({ type: 'ok', text: `Updated ${updated.email} to ${updated.role}.` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update role.',
      });
    }
  };

  const handleToggleActive = async (userId: number, currentlyActive: boolean) => {
    setFeedback(null);
    try {
      const updated = await updateManagedUser(userId, { isActive: !currentlyActive });
      setFeedback({
        type: 'ok',
        text: `${updated.email} is now ${updated.isActive ? 'ACTIVE' : 'DEACTIVATED'}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to toggle user status.',
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetId) return;
    setFeedback(null);
    try {
      await resetManagedUserAccess(resetTargetId, resetPassword);
      setFeedback({ type: 'ok', text: 'Temporary access password updated and audited.' });
      setResetTargetId(null);
      setResetPassword('');
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Password reset failed.',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              ADMINISTRATIVE IDENTITY &amp; RBAC GOVERNANCE
            </span>
          </div>
          <h1 className="text-lg font-bold text-white">User Account &amp; Permission Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create operator accounts, assign RBAC roles, deactivate compromised sessions, and reset credentials.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs ${
            feedback.type === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create User Form */}
        <form
          onSubmit={handleCreateUser}
          className="lg:col-span-4 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 shadow-xl"
        >
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserPlus className="h-4 w-4 text-cyan-400" />
            <span>Create Operator Account</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="block font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Priya Nair"
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@resqai.sec"
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-300">Initial Password (min 8 chars)</label>
              <input
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SecurePass#2026"
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block font-semibold text-slate-300">Assigned RBAC Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="VIEWER">Viewer (Read-Only)</option>
                <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                <option value="SENIOR_RISK_ANALYST">Senior Risk Analyst</option>
                <option value="LEAD_FRAUD_ARCHITECT">Lead Fraud Architect</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            <span>Provision Account</span>
          </button>
        </form>

        {/* Directory Table */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Provisioned Accounts ({managedUsers.length})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c1428] border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Last Login</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {managedUsers.map((u) => {
                  const isSelf = u.uid === currentUser?.uid;
                  return (
                    <tr key={u.id} className="hover:bg-[#0c1428]/60">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.displayName}</span>
                          {isSelf && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-numbers">{u.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          disabled={isSelf}
                          value={u.role}
                          onChange={(e) => void handleRoleUpdate(u.id, e.target.value as UserRole)}
                          className="bg-[#0c1428] border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 disabled:opacity-60"
                        >
                          {(['VIEWER', 'COMPLIANCE_OFFICER', 'SENIOR_RISK_ANALYST', 'LEAD_FRAUD_ARCHITECT'] as UserRole[]).map(
                            (r) => (
                              <option key={r} value={r}>
                                {ROLE_META[r].title}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="py-3 px-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-[11px]">
                            <XCircle className="h-3.5 w-3.5" /> Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono-numbers text-[11px] text-slate-400">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setResetTargetId(u.id);
                              setResetPassword('');
                            }}
                            className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                            title="Reset access password"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => void handleToggleActive(u.id, u.isActive)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer disabled:opacity-40 ${
                              u.isActive
                                ? 'border-rose-500/40 text-rose-300 hover:bg-rose-500/15'
                                : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {resetTargetId !== null && (
            <form
              onSubmit={handlePasswordReset}
              className="p-4 rounded-xl bg-[#0c1428] border border-cyan-500/30 flex flex-col sm:flex-row items-center gap-3 text-xs"
            >
              <span className="font-semibold text-cyan-300 whitespace-nowrap">
                Reset Password (User #{resetTargetId}):
              </span>
              <input
                type="password"
                minLength={8}
                required
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="New temporary password (min 8 chars)"
                className="flex-1 w-full rounded-lg bg-[#070b16] border border-slate-700 px-3 py-1.5 text-white"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Save Password
                </button>
                <button
                  type="button"
                  onClick={() => setResetTargetId(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
