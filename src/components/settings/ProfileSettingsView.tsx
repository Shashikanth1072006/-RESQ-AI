/**
 * RESQ AI - Operator Profile & Account Settings
 */

import React, { useState } from 'react';
import { UserCog, Shield, CheckCircle2, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLE_META, ROLE_PERMISSIONS } from '../../utils/rbacClient';

export const ProfileSettingsView: React.FC = () => {
  const { currentUser, updateProfileName } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!currentUser) return null;

  const meta = ROLE_META[currentUser.role];
  const effectivePerms =
    currentUser.permissions && currentUser.permissions.length > 0
      ? currentUser.permissions
      : ROLE_PERMISSIONS[currentUser.role];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setErr(null);
    try {
      await updateProfileName(displayName);
      setSaved(true);
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Unable to save profile.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="p-5 rounded-2xl bg-[#090f22] border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-1">
          <UserCog className="h-4 w-4 text-cyan-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
            OPERATOR IDENTITY &amp; AUTHORIZATION
          </span>
        </div>
        <h1 className="text-lg font-bold text-white">Profile &amp; Account Settings</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Inspect your server-verified RBAC permissions and manage your display identity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSave}
          className="lg:col-span-6 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 text-xs"
        >
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            Account Identity
          </h2>

          {saved && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Display name updated in PostgreSQL.</span>
            </div>
          )}
          {err && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              {err}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Operator Display Name</label>
            <input
              type="text"
              minLength={2}
              maxLength={100}
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-[#0c1428] border border-slate-800 px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Email</span>
              <div className="font-mono-numbers text-white mt-0.5 truncate">{currentUser.email}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0c1428] border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase">Assigned Role</span>
              <div className="text-cyan-300 font-bold mt-0.5">{meta.title}</div>
            </div>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Update Profile</span>
          </button>
        </form>

        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#080e1e] border border-slate-800 space-y-4 text-xs">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span>Granted RBAC Permissions ({effectivePerms.length})</span>
          </h2>

          <p className="text-slate-400">{meta.description}</p>

          <div className="flex flex-wrap gap-2">
            {effectivePerms.map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 rounded-lg bg-[#0c1428] border border-slate-800 font-mono-numbers text-[11px] text-cyan-300"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
