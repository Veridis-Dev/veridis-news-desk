import { __ } from '@wordpress/i18n';
import type { NewsroomLayout } from '../../types';

export interface NewsroomViewToggleProps {
  layout: NewsroomLayout;
  onChange: (layout: NewsroomLayout) => void;
}

export function NewsroomViewToggle({ layout, onChange }: NewsroomViewToggleProps) {
  return (
    <div className="vnd-view-toggle" role="group" aria-label={__('Newsroom view layout', 'veridis-news-desk')}>
      <button
        type="button"
        className={`vnd-view-toggle-btn ${layout === 'list' ? 'is-active' : ''}`}
        aria-pressed={layout === 'list'}
        onClick={() => onChange('list')}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
        <span>{__('List', 'veridis-news-desk')}</span>
      </button>
      <button
        type="button"
        className={`vnd-view-toggle-btn ${layout === 'board' ? 'is-active' : ''}`}
        aria-pressed={layout === 'board'}
        onClick={() => onChange('board')}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2.5" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="6.25" y="2.5" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="10.5" y="2.5" width="3.5" height="11" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span>{__('Board', 'veridis-news-desk')}</span>
      </button>
    </div>
  );
}
