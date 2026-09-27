import { useEffect, useId, useRef, type ReactNode } from 'react';
import { __ } from '@wordpress/i18n';
import { VeridisButton } from './VeridisButton';
export function VeridisModal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    document.body.style.overflow = 'hidden';
    dialog.showModal(); // Native focus trapping, background inertness and Escape support.
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      const target = trigger?.isConnected ? trigger : document.getElementById('vnd-content');
      target?.focus({ preventScroll: true });
    };
  }, [open]);
  return <dialog ref={ref} className="vnd-modal" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="vnd-modal-inner"><header className="vnd-card-header"><h2 id={titleId}>{title}</h2><button type="button" className="vnd-modal-close" onClick={onClose} aria-label={__('Close dialog', 'veridis-news-desk')}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/></svg></button></header>
    <div className="vnd-modal-body">{children}</div>{footer !== null && <footer className="vnd-modal-footer">{footer ?? <VeridisButton onClick={onClose}>{__('Got it', 'veridis-news-desk')}</VeridisButton>}</footer>}</div>
  </dialog>;
}
