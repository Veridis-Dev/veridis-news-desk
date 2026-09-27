import { __ } from '@wordpress/i18n';

export interface FilterChipItem {
  id: string;
  label: string;
  removeAriaLabel: string;
  onRemove: () => void;
}

export interface ActiveFilterBarProps {
  chips: FilterChipItem[];
  onClear: () => void;
  label?: string;
  clearLabel?: string;
}

export function ActiveFilterBar({
  chips,
  onClear,
  label = __('Active filters', 'veridis-news-desk'),
  clearLabel = __('Clear all', 'veridis-news-desk'),
}: ActiveFilterBarProps) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="vnd-active-filters-bar" aria-label={label}>
      <span className="vnd-active-filters-label">{label}</span>
      <ul className="vnd-active-filters-list" role="list">
        {chips.map(chip => (
          <li key={chip.id}>
            <button
              type="button"
              className="vnd-filter-chip"
              onClick={chip.onRemove}
              aria-label={chip.removeAriaLabel}
            >
              <span className="vnd-filter-chip-text">{chip.label}</span>
              <span className="vnd-filter-chip-remove" aria-hidden="true">
                ×
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="vnd-active-filters-clear"
        onClick={onClear}
        aria-label={__('Clear all filters', 'veridis-news-desk')}
      >
        {clearLabel}
      </button>
    </div>
  );
}
