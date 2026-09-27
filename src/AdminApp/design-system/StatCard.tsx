import type { Stat } from '../types';
import { VeridisCard } from './VeridisCard';

export function StatCard({
  stat,
  onClick,
  selected = false,
  className = '',
}: {
  stat: Stat;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}) {
  const content = (
    <>
      <div className="vnd-stat-label">
        <span>{stat.label}</span>
        <span className={`vnd-dot vnd-tone--${stat.tone}`} aria-hidden="true" />
      </div>
      <strong>{stat.value}</strong>
      <p>{stat.note}</p>
    </>
  );

  const cardClasses = `vnd-stat ${onClick ? 'vnd-stat--link' : ''} ${selected ? 'is-selected' : ''} ${className}`.trim();

  return (
    <VeridisCard className={cardClasses}>
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-pressed={selected}
        >
          {content}
        </button>
      ) : (
        content
      )}
    </VeridisCard>
  );
}
