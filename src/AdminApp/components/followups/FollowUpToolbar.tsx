import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import type { FollowUpFilters, FollowUpStatus, TermOption } from '../../types';
import { ToolbarFilter } from '../../design-system/ToolbarFilter';

interface FollowUpToolbarProps {
  filters: Partial<FollowUpFilters>;
  authors: TermOption[];
  onChange: (patch: Partial<FollowUpFilters>, replace?: boolean) => void;
}

export function FollowUpToolbar({
  filters,
  authors,
  onChange,
}: FollowUpToolbarProps) {
  const [search, setSearch] = useState(filters.search || '');
  useEffect(() => setSearch(filters.search || ''), [filters.search]);
  useEffect(() => {
    if (search === (filters.search || '')) return;
    const timer = window.setTimeout(() => onChange({ search, page: 1 }, true), 350);
    return () => window.clearTimeout(timer);
  }, [search, filters.search, onChange]);

  const status = filters.status || 'open';
  const due = filters.due || 'all';
  const assignedTo = filters.assigned_to ?? 0;

  const assigneeOptions: [string, string][] = [
    ['0', __('All assignees', 'veridis-news-desk')],
    ['-1', __('Unassigned', 'veridis-news-desk')],
    ...authors.map(author => [String(author.id), author.name] as [string, string]),
  ];

  return (
    <div className="vnd-newsroom-toolbar" role="search">
      <label className="vnd-search-field">
        <span className="vnd-sr-only">{__('Search follow-ups or stories', 'veridis-news-desk')}</span>
        <span className="vnd-search-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={__('Search follow-ups or stories…', 'veridis-news-desk')}
        />
      </label>

      <div className="vnd-toolbar-filters">
        <ToolbarFilter
          label={__('Status', 'veridis-news-desk')}
          value={status}
          onChange={value => onChange({ status: value as FollowUpStatus | 'all', page: 1 })}
          options={[
            ['open', __('Open tasks', 'veridis-news-desk')],
            ['done', __('Completed', 'veridis-news-desk')],
            ['cancelled', __('Cancelled', 'veridis-news-desk')],
            ['all', __('All statuses', 'veridis-news-desk')],
          ]}
        />

        <ToolbarFilter
          label={__('Deadline', 'veridis-news-desk')}
          value={due}
          onChange={value => onChange({ due: value as FollowUpFilters['due'], page: 1 })}
          options={[
            ['all', __('All deadlines', 'veridis-news-desk')],
            ['overdue', __('Overdue', 'veridis-news-desk')],
            ['due_today', __('Due today', 'veridis-news-desk')],
            ['upcoming', __('Upcoming', 'veridis-news-desk')],
            ['no_deadline', __('No deadline', 'veridis-news-desk')],
          ]}
        />

        <ToolbarFilter
          label={__('Assigned to', 'veridis-news-desk')}
          value={String(assignedTo)}
          onChange={value => onChange({ assigned_to: Number(value), page: 1 })}
          options={assigneeOptions}
        />
      </div>
    </div>
  );
}
