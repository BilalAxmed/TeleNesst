import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { User } from '../../types';
import { otpService } from '../../services/otpService';
import {
  Shield,
  KeyRound,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Hash,
  HelpCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

type RecoveryMethod = 'email' | 'phone' | 'google' | 'questions';

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({
  isOpen,
  onClose,
  onBackToLogin,
}) => {
  const { showToast, resetUserCredentials } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [identifiedUser, setIdentifiedUser] = useState<User | null>(null);
  const [method, setMethod] = useState<RecoveryMethod>('email');

  // OTP states
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpDispatched, setOtpDispatched] = useState(false);
  const [activeOtpCode, setActiveOtpCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Security questions state
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');

  // Password reset step
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  if (!isOpen) return null;

  const usersList = storage.getUsers();

  const handleLookupUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const clean = identifier.trim();
    if (!clean) {
      setErrorMsg('Please enter your email, phone number, Google ID, or username.');
      return;
    }

    const found = storage.findUserByIdentifier(clean);
    if (!found) {
      setErrorMsg('No registered TeleNest account found for this identity. Please check and try again.');
      return;
    }

    setIdentifiedUser(found);
    // Default method to Google if email is gmail, or phone if phone exists, else email
    if (found.googleId || found.email.endsWith('@gmail.com')) {
      setMethod('google');
    } else if (found.phone) {
      setMethod('phone');
    } else {
      setMethod('email');
    }
  };

  const handleSelectQuickAccount = (u: User) => {
    setIdentifier(u.email || u.username);
    setIdentifiedUser(u);
    setErrorMsg('');
    if (u.googleId || u.email.endsWith('@gmail.com')) {
      setMethod('google');
    } else if (u.phone) {
      setMethod('phone');
    } else {
      setMethod('email');
    }
  };

  // Dispatch OTP code for Email or Phone
  const handleSendOtp = () => {
    if (!identifiedUser) return;
    setErrorMsg('');

    const target = method === 'email' 
      ? (identifiedUser.recoveryEmail || identifiedUser.email) 
      : (identifiedUser.phone || '');

    if (!target) {
      setErrorMsg(`No registered ${method === 'email' ? 'email' : 'phone number'} found on this account profile.`);
      return;
    }

    const { code } = otpService.generateOtp(target, method as 'email' | 'phone', 'recovery');
    setActiveOtpCode(code);
    setOtpDispatched(true);
    setResendTimer(45);
    setEnteredOtp('');

    showToast(
      `Recovery OTP [${code}] dispatched to ${method === 'email' ? 'Email Inbox' : 'SMS'} (${target})`,
      'info'
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiedUser) return;
    setErrorMsg('');

    const target = method === 'email' 
      ? (identifiedUser.recoveryEmail || identifiedUser.email) 
      : (identifiedUser.phone || '');

    const res = otpService.verifyOtp(target, method as 'email' | 'phone', enteredOtp);
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setIsIdentityVerified(true);
    showToast('Identity verified via one-time passcode! Please set your new password.', 'success');
  };

  // Instant Google Account Verification
  const handleVerifyGoogle = () => {
    if (!identifiedUser) return;
    setErrorMsg('');
    // Google account verification simulation
    setIsIdentityVerified(true);
    showToast(`Google Identity verified for ${identifiedUser.googleId || identifiedUser.email}! You can now update your credentials.`, 'success');
  };

  // Security Questions verification
  const handleVerifyQuestions = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifiedUser) return;

    const answers = identifiedUser.securityAnswers;
    const a1Match = q1.trim().toLowerCase() === (answers?.q1_city || '').toLowerCase();
    const a2Match = q2.trim().toLowerCase() === (answers?.q2_school || '').toLowerCase();
    const a3Match = q3.trim().toLowerCase() === (answers?.q3_nickname || '').toLowerCase();
    const a4Match = q4.trim().toLowerCase() === (answers?.q4_vehicle || '').toLowerCase();

    if (a1Match && a2Match && a3Match && a4Match) {
      setIsIdentityVerified(true);
      showToast('All 4 security questions authenticated successfully.', 'success');
    } else {
      setErrorMsg('One or more security question answers do not match our encrypted records. Please verify your answers.');
    }
  };

  // Save new credentials
  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifiedUser) return;

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }
    if (newPin && newPin.length !== 4) {
      setErrorMsg('Security PIN must be exactly 4 numeric digits.');
      return;
    }

    const res = resetUserCredentials(identifiedUser.id, newPassword, newPin || undefined);
    if (res.success) {
      onBackToLogin();
    } else {
      setErrorMsg(res.message || 'Failed to update credentials.');
    }
  };

  const handleResetFlow = () => {
    setIdentifiedUser(null);
    setIdentifier('');
    setIsIdentityVerified(false);
    setOtpDispatched(false);
    setActiveOtpCode(null);
    setEnteredOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setNewPin('');
    setErrorMsg('');
  };

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, text: 'Empty', color: 'bg-slate-500' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (score <= 2) return { score, text: 'Weak', color: 'bg-rose-500' };
    if (score <= 4) return { score, text: 'Moderate', color: 'bg-amber-500' };
    return { score, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl p-5 sm:p-7 text-[var(--text-main)] overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-52 h-52 rounded-full bg-[var(--accent)]/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-52 h-52 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[var(--border-main)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <span>Security Recovery Gateway</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-[var(--accent)]/20 text-[var(--accent)]">
                  Self-Service
                </span>
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Reset your password or 4-digit PIN via verified identity channels
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] px-2.5 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: Locate User Account */}
        {!identifiedUser && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleLookupUser} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Enter Your Google ID, Email, Phone Number, or Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. bilalaxmed.47@gmail.com, +92 300 8472910, or bilal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] transition"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-dim)] mt-1">
                  TeleNest matches your registered credentials across Google authentication, official email, or mobile phone.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Locate Account & Choose Recovery Method</span>
              </button>
            </form>

            {/* Quick Demo Account Selector Chips */}
            <div className="pt-3 border-t border-[var(--border-main)]">
              <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">
                Or Select an Account to Recover:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {usersList.slice(0, 3).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickAccount(u)}
                    className="p-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] hover:border-[var(--accent)] text-left transition flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-bold text-xs flex items-center justify-center shrink-0">
                      {u.fullName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs text-[var(--text-main)] truncate">{u.fullName}</div>
                      <div className="text-[9px] text-[var(--text-dim)] truncate">{u.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Multi-Channel Recovery Method Selection */}
        {identifiedUser && !isIdentityVerified && (
          <div className="mt-4 space-y-4">
            {/* Account Card */}
            <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] font-bold text-xs flex items-center justify-center border border-[var(--accent)]/30">
                  {identifiedUser.fullName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                    <span>{identifiedUser.fullName}</span>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-[var(--accent)]/15 text-[var(--accent)]">
                      {identifiedUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span>{identifiedUser.email}</span>
                    {identifiedUser.phone && (
                      <>
                        <span>•</span>
                        <span>{identifiedUser.phone}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetFlow}
                className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Recovery Channel Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)]">
              {/* Google ID */}
              <button
                type="button"
                onClick={() => {
                  setMethod('google');
                  setErrorMsg('');
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'google'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs border border-[var(--border-main)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>
                <span className="text-[10px]">Google ID</span>
              </button>

              {/* Email */}
              <button
                type="button"
                onClick={() => {
                  setMethod('email');
                  setErrorMsg('');
                  setOtpDispatched(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'email'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs border border-[var(--border-main)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Mail className="w-4 h-4 text-sky-400" />
                <span className="text-[10px]">Email OTP</span>
              </button>

              {/* Phone */}
              <button
                type="button"
                onClick={() => {
                  setMethod('phone');
                  setErrorMsg('');
                  setOtpDispatched(false);
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'phone'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs border border-[var(--border-main)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px]">SMS Phone</span>
              </button>

              {/* Security Questions */}
              <button
                type="button"
                onClick={() => {
                  setMethod('questions');
                  setErrorMsg('');
                }}
                className={`py-2 px-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${
                  method === 'questions'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs border border-[var(--border-main)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="text-[10px]">Questions</span>
              </button>
            </div>

            {/* CHANNEL CONTENT */}
            {/* 1. GOOGLE IDENTITY VERIFICATION */}
            {method === 'google' && (
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-xs space-y-3 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                </div>

                <div>
                  <h4 className="font-bold text-[var(--text-main)]">Google Authentication Verification</h4>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Verify account ownership using linked Google profile:{' '}
                    <span className="font-mono text-[var(--accent)] font-semibold">
                      {identifiedUser.googleId || identifiedUser.email}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyGoogle}
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Authenticate with Google ID to Reset Credentials</span>
                </button>
              </div>
            )}

            {/* 2 & 3. EMAIL / PHONE OTP VERIFICATION */}
            {(method === 'email' || method === 'phone') && (
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] space-y-3 text-xs">
                <div>
                  <div className="font-semibold text-[var(--text-main)]">
                    {method === 'email' ? 'Official Email Verification' : 'Mobile Phone SMS Verification'}
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Target destination:{' '}
                    <span className="font-mono text-[var(--accent)] font-semibold">
                      {method === 'email'
                        ? identifiedUser.recoveryEmail || identifiedUser.email
                        : identifiedUser.phone || 'No phone registered'}
                    </span>
                  </p>
                </div>

                {!otpDispatched ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="w-full py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {method === 'email' ? 'Send 6-Digit Email Code' : 'Send 6-Digit SMS Code'}
                    </span>
                  </button>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    {/* Simulated dispatch preview banner for immediate developer / user testing */}
                    {activeOtpCode && (
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-[11px] text-blue-400">
                            Dispatched Code:{' '}
                            <strong className="font-mono text-sm tracking-widest">{activeOtpCode}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEnteredOtp(activeOtpCode)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold cursor-pointer"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        Enter 6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-center tracking-[0.5em] text-base font-mono py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={enteredOtp.length < 6}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-bold text-xs transition shadow cursor-pointer flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify Code</span>
                      </button>

                      <button
                        type="button"
                        disabled={resendTimer > 0}
                        onClick={handleSendOtp}
                        className="px-3 py-2.5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-40 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{resendTimer > 0 ? `${resendTimer}s` : 'Resend'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 4. SECURITY QUESTIONS */}
            {method === 'questions' && (
              <form onSubmit={handleVerifyQuestions} className="space-y-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    1. What city were you born in?
                  </label>
                  <input
                    type="text"
                    required
                    value={q1}
                    onChange={(e) => setQ1(e.target.value)}
                    placeholder="e.g. Lahore"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    2. What was the name of your first school?
                  </label>
                  <input
                    type="text"
                    required
                    value={q2}
                    onChange={(e) => setQ2(e.target.value)}
                    placeholder="e.g. St. Marys"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    3. What was your childhood nickname?
                  </label>
                  <input
                    type="text"
                    required
                    value={q3}
                    onChange={(e) => setQ3(e.target.value)}
                    placeholder="e.g. Billo"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    4. What was the make/model of your first vehicle?
                  </label>
                  <input
                    type="text"
                    required
                    value={q4}
                    onChange={(e) => setQ4(e.target.value)}
                    placeholder="e.g. Toyota Corolla"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verify 4 Security Questions</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* STEP 3: Set New Password & PIN */}
        {identifiedUser && isIdentityVerified && (
          <form onSubmit={handleSaveCredentials} className="mt-4 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <div>
                <div className="font-bold">Identity Authenticated!</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  You are now authorized to define new credentials for <strong>{identifiedUser.fullName}</strong>.
                </div>
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[var(--text-muted)]">New Account Password</label>
                <span className="text-[10px] text-[var(--text-dim)]">Min 6 characters</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter high-entropy password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--text-muted)]">{strength.text}</span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-semibold text-[var(--text-muted)] mb-1">
                Confirm New Password
              </label>
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            {/* Update 4-Digit Security PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-[var(--text-muted)] flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Update 4-Digit Security PIN (Optional)</span>
                </label>
                <span className="text-[10px] text-[var(--text-dim)]">For Kiosk & Keypad entry</span>
              </div>
              <input
                type="text"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder={identifiedUser.pin || '4790'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-main)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--accent)] font-mono tracking-widest text-center"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply New Credentials & Sign In</span>
            </button>
          </form>
        )}

        {/* Global Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border-main)] text-center text-[10px] text-[var(--text-dim)]">
          TeleNest Security Protocol &bull; Multi-factor recovery logs stored to Audit Trail
        </div>
      </div>
    </div>
  );
};
