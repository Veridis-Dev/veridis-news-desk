import { __ } from '@wordpress/i18n';

interface WorkspaceToggleProps {
  isWide: boolean;
  onToggle: () => void;
}

export function WorkspaceToggle({ isWide, onToggle }: WorkspaceToggleProps) {
  const label = isWide
    ? __('Restore sidebar', 'veridis-news-desk')
    : __('Expand workspace', 'veridis-news-desk');

  return (
    <button
      type="button"
      className={`vnd-workspace-toggle ${isWide ? 'is-active' : ''}`}
      onClick={onToggle}
      aria-pressed={isWide}
      aria-label={label}
      title={label}
    >
      {isWide ? (
        // Restore sidebar icon: represents bringing sidebar back into view
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 2.5V13.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 8L11 8M9 8L10 6.5M9 8L10 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        // Expand workspace icon: represents hiding sidebar to expand layout
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 2.5V13.5" stroke="currentColor" strokeWidth="1.6" strokeDasharray="1.5 1.5" />
          <path d="M11 8L9 8M11 8L10 6.5M11 8L10 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="vnd-workspace-toggle-text">{label}</span>
    </button>
  );
}
