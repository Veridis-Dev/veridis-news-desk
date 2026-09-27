import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { __, _x } from '@wordpress/i18n';
import type { Tone } from '../types';
import { VeridisButton } from './VeridisButton';
type ToastTone = Exclude<Tone, 'neutral'>;
interface Toast { id: number; message: string; tone: ToastTone }
const ToastContext = createContext<((message: string, tone?: ToastTone) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const sequence = useRef(0);
  const notify = useCallback((message: string, tone: ToastTone = 'info') => {
    setToasts(current => [...current.slice(-3), { id: ++sequence.current, message, tone }]);
  }, []);
  const dismiss = useCallback((id: number) => setToasts(current => current.filter(toast => toast.id !== id)), []);
  return <ToastContext.Provider value={notify}>{children}<div className="vnd-toasts" aria-label={__('Notifications', 'veridis-news-desk')}>{toasts.map(toast => <VeridisToast key={toast.id} toast={toast} onDismiss={dismiss} />)}</div></ToastContext.Provider>;
}
export function VeridisToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || toast.tone === 'error' || toast.tone === 'warning') return;
    const timer = window.setTimeout(() => onDismiss(toast.id), 6000);
    return () => window.clearTimeout(timer);
  }, [paused, toast.id, toast.tone, onDismiss]);
  return <div className={`vnd-toast vnd-tone--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}>
    <span><strong>{toneLabel(toast.tone)}</strong>{toast.message}</span><VeridisButton variant="ghost" aria-label={__('Dismiss notification', 'veridis-news-desk')} onClick={() => onDismiss(toast.id)}>×</VeridisButton>
  </div>;
}

function toneLabel(tone: ToastTone): string {
  const labels: Record<ToastTone, string> = {
    success: _x('Success', 'toast type', 'veridis-news-desk'),
    info: _x('Info', 'toast type', 'veridis-news-desk'),
    warning: _x('Warning', 'toast type', 'veridis-news-desk'),
    error: _x('Error', 'toast type', 'veridis-news-desk'),
  };
  return labels[tone];
}
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error('useToast requires ToastProvider');
  return toast;
}
