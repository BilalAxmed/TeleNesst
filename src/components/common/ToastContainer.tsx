import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          id={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-xl border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
            t.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-100 border-emerald-600/40'
              : t.type === 'error'
              ? 'bg-rose-950/90 text-rose-100 border-rose-600/40'
              : t.type === 'warning'
              ? 'bg-amber-950/90 text-amber-100 border-amber-600/40'
              : 'bg-slate-900/90 text-slate-100 border-slate-700/60'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
            {t.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
          </div>
          <div className="flex-1 text-xs leading-relaxed font-medium">{t.message}</div>
          <button
            onClick={() => dismissToast(t.id)}
            className="shrink-0 p-1 hover:bg-white/10 rounded transition text-slate-400 hover:text-white"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
