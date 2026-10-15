import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PasswordRecoveryModal } from './PasswordRecoveryModal';
import {
  Lock,
  Shield,
  AlertCircle,
  X,
  Hash,
} from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, login, currentUser, users } = useApp();
  const [selectedUser, setSelectedUser] = useState(users[0]?.username || 'bilal');
  const [credential, setCredential] = useState('');
  const [authMode, setAuthMode] = useState<'pin' | 'password'>('pin');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(selectedUser, credential);
    if (!res.success) {
      setErrorMsg(res.message || 'Invalid credentials. Access Denied.');
      setCredential('');
    } else {
      setIsLoginModalOpen(false);
      setCredential('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-6 sm:p-7 text-[var(--text-main)] overflow-hidden">
        {/* Close Button if user is already logged in */}
        {currentUser && (
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(false)}
            className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white p-1 rounded-lg hover:bg-[var(--bg-hover)] transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Glow ambient accent */}
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-sky-600/10 blur-3xl pointer-events-none" />

        {/* Brand Header with Official TeleNest Logo */}
        <div className="flex flex-col items-center text-center pb-4 border-b border-[var(--border-main)]">
          <div className="w-12 h-12 rounded-xl bg-[#091326] border border-sky-400/40 p-1.5 text-sky-400 flex items-center justify-center shadow-lg mb-2">
            <svg className="w-full h-full text-sky-400" viewBox="0 0 256 256" fill="none">
              <polygon
                points="128,34 212,82 212,174 128,222 44,174 44,82"
                fill="#0c234a"
                fillOpacity="0.75"
                stroke="#38bdf8"
                strokeWidth="7"
                strokeLinejoin="round"
              />
              <circle cx="128" cy="128" r="64" stroke="#38bdf8" strokeWidth="4" strokeDasharray="10 6" strokeOpacity="0.8" />
              <circle cx="128" cy="128" r="22" fill="#38bdf8" />
              <circle cx="128" cy="128" r="10" fill="#ffffff" />
            </svg>
          </div>
          <h2 className="text-lg font-black tracking-tight text-[var(--text-main)]">
            TeleNest Access Gateway
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Select User Profile & Enter Security PIN
          </p>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* User Profile Selector */}
          <div>
            <label className="block font-semibold text-[var(--text-muted)] mb-1">
              Select User Profile
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(u.username);
                    setErrorMsg('');
                  }}
                  className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center ${
                    selectedUser === u.username
                      ? 'bg-sky-950/40 border-sky-500 text-white ring-1 ring-sky-500/40'
                      : 'bg-[var(--bg-card)] border-[var(--border-main)] text-[var(--text-muted)] hover:text-white'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-sky-600/30 text-sky-400 font-bold text-xs flex items-center justify-center mb-1">
                    {((u.fullName || u.username || 'U').trim().split(/\s+/).filter(Boolean)[0]?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="font-semibold text-[11px] truncate w-full">{u.fullName || u.username}</span>
                  <span className="text-[9px] text-[var(--text-dim)] truncate w-full">{u.role || 'Standard User'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Password / PIN Mode */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                {authMode === 'pin' ? <Hash className="w-3.5 h-3.5 text-sky-400" /> : <Lock className="w-3.5 h-3.5 text-sky-400" />}
                <span>{authMode === 'pin' ? 'Security PIN Code' : 'Password'}</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'pin' ? 'password' : 'pin');
                    setCredential('');
                    setErrorMsg('');
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                >
                  Use {authMode === 'pin' ? 'Password' : 'PIN'}
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  type="button"
                  onClick={() => setIsRecoveryOpen(true)}
                  className="text-[10px] text-sky-400 hover:text-sky-300 transition hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                maxLength={authMode === 'pin' ? 4 : 32}
                value={credential}
                onChange={(e) => {
                  const val = authMode === 'pin' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value;
                  setCredential(val);
                }}
                placeholder={authMode === 'pin' ? '••••' : 'Enter password'}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-sky-400 transition tracking-[0.2em]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Authenticate Session</span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center text-[10px] text-[var(--text-dim)]">
          Encrypted local storage runtime &bull; Portable offline architecture
        </div>
      </div>

      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onBackToLogin={() => setIsRecoveryOpen(false)}
      />
    </div>
  );
};
