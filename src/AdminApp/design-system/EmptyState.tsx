import type { ReactNode } from 'react';
export function EmptyState({ title, description, action, compact = false }: { title: string; description: string; action?: ReactNode; compact?: boolean }) {
  return <div className={`vnd-empty ${compact ? 'vnd-empty--compact' : ''}`}>
    <span className="vnd-empty-icon" aria-hidden="true">◇</span>
    <h3>{title}</h3><p>{description}</p>{action}
  </div>;
}
