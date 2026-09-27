import type { ReactNode } from 'react';

export function VeridisNotice({ title, children, tone = 'info' }: {
  title: string;
  children: ReactNode;
  tone?: 'info' | 'warning';
}) {
  return <div className={`vnd-notice vnd-tone--${tone}`} role="note">
    <div className="vnd-notice-copy">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  </div>;
}
