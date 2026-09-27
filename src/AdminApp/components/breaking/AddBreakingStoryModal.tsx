import { useEffect, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { __ } from '@wordpress/i18n';
import { searchBreaking } from '../../api/breaking';
import { VeridisModal } from '../../design-system/VeridisModal';
import { VeridisButton } from '../../design-system/VeridisButton';
import { VeridisBadge } from '../../design-system/VeridisBadge';
import { CategoryBadge } from '../../design-system/CategoryBadge';
import { BreakingEditor } from './BreakingEditor';
import { SearchResultSkeleton } from '../../design-system/VeridisSkeleton';
import type { NewsroomItem } from '../../types';
export function AddBreakingStoryModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [selected, setSelected] = useState<NewsroomItem | null>(null);
  useEffect(() => { const timer = window.setTimeout(() => setDebounced(search), 250); return () => window.clearTimeout(timer); }, [search]);
  const query = useQuery({
    queryKey: ['veridis-news', 'breaking-search', debounced],
    queryFn: ({ signal }) => searchBreaking(debounced, signal),
    placeholderData: keepPreviousData,
  });
  const isSearching = (search !== debounced) || (query.isFetching && !query.isPending);
  return <VeridisModal open onClose={onClose} title={__('Add breaking story', 'veridis-news-desk')} footer={selected ? null : <VeridisButton variant="ghost" onClick={onClose}>{__('Cancel', 'veridis-news-desk')}</VeridisButton>}>
    {selected ? <>
      <section className="vnd-breaking-selected" aria-labelledby="vnd-selected-article">
        <div>
          <p className="vnd-field-label" id="vnd-selected-article">{__('Selected article', 'veridis-news-desk')}</p>
          <strong>{selected.title}</strong>
          <span className="vnd-breaking-article-meta"><VeridisBadge tone={selected.wpStatusTone || selected.tone}>{selected.statusLabel}</VeridisBadge><CategoryBadge category={selected.primaryCategory} /></span>
        </div>
        <VeridisButton variant="secondary" onClick={() => setSelected(null)}>{__('Change article', 'veridis-news-desk')}</VeridisButton>
      </section>
      <BreakingEditor article={selected} mode="create" onDone={onClose} />
    </> : <>
      <div className="vnd-article-picker-flow">
        <label className="vnd-search-field vnd-breaking-search">
          <span className="vnd-sr-only">{__('Search articles by title', 'veridis-news-desk')}</span>
          <span className="vnd-search-icon" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.8" /><path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
          <input autoFocus type="search" value={search} maxLength={200} onChange={e => setSearch(e.target.value)} placeholder={__('Search article titles…', 'veridis-news-desk')} />
          {isSearching && (
            <span className="vnd-search-spinner" aria-label={__('Searching…', 'veridis-news-desk')} title={__('Searching…', 'veridis-news-desk')}>
              <svg className="vnd-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          )}
        </label>
        <div className="vnd-breaking-search-help-row">
          <p className="vnd-breaking-search-help">{__('Published and scheduled articles appear first.', 'veridis-news-desk')}</p>
          {isSearching && <span className="vnd-searching-badge" role="status">{__('Searching…', 'veridis-news-desk')}</span>}
        </div>

        <div className="vnd-picker-results-pane">
          {query.isPending && (
            <div aria-busy="true" aria-label={__('Searching articles', 'veridis-news-desk')} className="vnd-picker-results-state">
              <span className="vnd-sr-only" role="status">{__('Searching…', 'veridis-news-desk')}</span>
              <ul className="vnd-breaking-results" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <SearchResultSkeleton key={index} />
                ))}
              </ul>
            </div>
          )}
          {query.isError && (
            <div className="vnd-picker-empty-state">
              <p role="alert" className="vnd-breaking-no-results">{query.error.message}</p>
            </div>
          )}
          {!query.isPending && query.data?.items && query.data.items.length > 0 && (
            <ul className="vnd-breaking-results" style={{ opacity: isSearching ? 0.75 : 1, transition: 'opacity 0.15s ease' }}>
              {query.data.items.map(item => (
                <li key={item.id}>
                  <button type="button" onClick={() => setSelected(item)}>
                    <span className="vnd-breaking-result-copy">
                      <strong>{item.title}</strong>
                      <span className="vnd-breaking-article-meta">
                        <VeridisBadge tone={item.wpStatusTone || item.tone}>{item.statusLabel}</VeridisBadge>
                        <CategoryBadge category={item.primaryCategory} />
                        {item.breaking.active && <VeridisBadge tone="warning">{__('Already Breaking', 'veridis-news-desk')}</VeridisBadge>}
                      </span>
                    </span>
                    <span className="vnd-breaking-result-arrow" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!query.isPending && query.data?.items && query.data.items.length === 0 && (
            <div className="vnd-picker-empty-state">
              <p className="vnd-breaking-no-results">{__('No matching articles.', 'veridis-news-desk')}</p>
            </div>
          )}
        </div>

        <div className="vnd-breaking-create-row">
          <span>{__('Can’t find the right article?', 'veridis-news-desk')}</span>
          <VeridisButton variant="secondary" onClick={onCreate}>{__('Create new story', 'veridis-news-desk')}</VeridisButton>
        </div>
      </div>
    </>}
  </VeridisModal>;
}
