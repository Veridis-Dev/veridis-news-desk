import { useId, type ReactNode } from 'react';
export function VeridisCard({ title, action, children, className = '', id, tabIndex }: { title?: string; action?: ReactNode; children: ReactNode; className?: string; id?: string; tabIndex?: number }) {
  const headingId = useId();
  return <section id={id} tabIndex={tabIndex} className={`vnd-card ${className}`} aria-labelledby={title ? headingId : undefined}>
    {title && <header className="vnd-card-header"><h3 id={headingId}>{title}</h3>{action}</header>}
    <div className="vnd-card-body">{children}</div>
  </section>;
}
