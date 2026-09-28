// ============================================================
// Toasts — notifications éphémères globales
// ============================================================
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import { cn } from './ui.jsx';

const ToastContext = createContext(null);

const TONE_CLASS = { success: 'toast-success', error: 'toast-error', info: 'toast-info' };
const TONE_ICON = { success: Check, error: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((tone, text) => {
    if (!text) return;
    const id = ++seq.current;
    setToasts((list) => [...list, { id, tone, text }]);
    setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500);
  }, [dismiss]);

  const value = useMemo(() => ({
    success: (text) => push('success', text),
    error: (text) => push('error', text),
    info: (text) => push('info', text),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Ico = TONE_ICON[t.tone] || Info;
          return (
            <div key={t.id} className={cn('toast', TONE_CLASS[t.tone] || TONE_CLASS.info)}>
              <Ico size={17} aria-hidden="true" />
              <span>{t.text}</span>
              <button type="button" className="toast-close" aria-label="Fermer la notification" onClick={() => dismiss(t.id)}>
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider.');
  return ctx;
}
