import { __ } from '@wordpress/i18n';
import type { SourceStatus, StructuredSource } from '../../types';
import { VeridisButton } from '../../design-system/VeridisButton';

const STATUS_OPTIONS: [SourceStatus, string][] = [
  ['confirmed', __('Confirmed', 'veridis-news-desk')],
  ['contacted', __('Contacted', 'veridis-news-desk')],
  ['waiting', __('Waiting', 'veridis-news-desk')],
  ['unverified', __('Unverified', 'veridis-news-desk')],
];

export function SourcesEditor({
  sources,
  onChange,
}: {
  sources: StructuredSource[];
  onChange: (sources: StructuredSource[]) => void;
}) {
  function handleNameChange(index: number, name: string) {
    const updated = [...sources];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  }

  function handleStatusChange(index: number, status: SourceStatus) {
    const updated = [...sources];
    updated[index] = { ...updated[index], status };
    onChange(updated);
  }

  function handleRemove(index: number) {
    onChange(sources.filter((_, i) => i !== index));
  }

  function handleAdd() {
    onChange([
      ...sources,
      {
        id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: '',
        status: 'unverified',
      },
    ]);
  }

  return (
    <div className="vnd-sources-editor">
      {sources.length === 0 ? (
        <p className="vnd-sources-empty">{__('No sources listed yet.', 'veridis-news-desk')}</p>
      ) : (
        <div className="vnd-sources-list">
          {sources.map((source, index) => (
            <div key={source.id || index} className="vnd-source-row">
              <input
                type="text"
                className="vnd-source-name-input"
                placeholder={__('Source name / entity…', 'veridis-news-desk')}
                value={source.name}
                onChange={e => handleNameChange(index, e.target.value)}
                aria-label={__('Source name', 'veridis-news-desk')}
              />
              <select
                className="vnd-source-status-select"
                value={source.status}
                onChange={e => handleStatusChange(index, e.target.value as SourceStatus)}
                aria-label={__('Source status', 'veridis-news-desk')}
              >
                {STATUS_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="vnd-source-remove-btn"
                onClick={() => handleRemove(index)}
                aria-label={__('Remove source', 'veridis-news-desk')}
                title={__('Remove source', 'veridis-news-desk')}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="vnd-sources-actions">
        <VeridisButton variant="ghost" type="button" onClick={handleAdd}>
          + {__('Add source', 'veridis-news-desk')}
        </VeridisButton>
      </div>
    </div>
  );
}
