import { useEffect, useState } from 'react';
import { __ } from '@wordpress/i18n';
import type { DeadlineFilter, EditorialStatus, HealthFilter, NewsroomFilters, NewsroomLayout, NewsroomSort, Priority, TermOption } from '../../types';
import { ToolbarFilter } from '../../design-system/ToolbarFilter';
export function NewsroomToolbar({
  filters,
  authors,
  assignees,
  categories,
  layout = 'list',
  optionsLoading = false,
  optionsError = false,
  onChange,
}: {
  filters: NewsroomFilters;
  authors: TermOption[];
  assignees: TermOption[];
  categories: TermOption[];
  layout?: NewsroomLayout;
  optionsLoading?: boolean;
  optionsError?: boolean;
  onChange: (patch: Partial<NewsroomFilters>, replace?: boolean) => void;
}) {
  const [search, setSearch] = useState(filters.search);
  useEffect(() => setSearch(filters.search), [filters.search]);
  useEffect(() => {
    if (search === filters.search) return;
    const timer = window.setTimeout(() => onChange({ search, page: 1 }, true), 350);
    return () => window.clearTimeout(timer);
  }, [search, filters.search, onChange]);

  const isBoard = layout === 'board';

  const authorOptions: [string, string][] = optionsLoading
    ? [['0', __('Loading authors…', 'veridis-news-desk')]]
    : optionsError
      ? [['0', __('Authors unavailable', 'veridis-news-desk')]]
      : [['0', __('All authors', 'veridis-news-desk')], ...authors.map(item => [String(item.id), item.name] as [string, string])];

  const assignedOptions: [string, string][] = optionsLoading
    ? [['0', __('Loading assignees…', 'veridis-news-desk')]]
    : optionsError
      ? [['0', __('Assignees unavailable', 'veridis-news-desk')]]
      : [
          ['0', __('All assignments', 'veridis-news-desk')],
          ['-1', __('Unassigned', 'veridis-news-desk')],
          ...assignees.map(item => [String(item.id), item.name] as [string, string]),
        ];

  const categoryOptions: [string, string][] = optionsLoading
    ? [['0', __('Loading categories…', 'veridis-news-desk')]]
    : optionsError
      ? [['0', __('Categories unavailable', 'veridis-news-desk')]]
      : [['0', __('All categories', 'veridis-news-desk')], ...categories.map(item => [String(item.id), item.name] as [string, string])];

  return (
    <div className="vnd-newsroom-toolbar" role="search">
      <label className="vnd-search-field">
        <span className="vnd-sr-only">{__('Search article titles', 'veridis-news-desk')}</span>
        <span className="vnd-search-icon" aria-hidden="true">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.8" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder={__('Search titles…', 'veridis-news-desk')}
        />
      </label>

      <div className="vnd-toolbar-filters">
        {!isBoard && (
          <ToolbarFilter
            label={__('Editorial status', 'veridis-news-desk')}
            value={filters.editorial_status}
            onChange={value => onChange({ editorial_status: value as 'all' | EditorialStatus, page: 1 })}
            options={[
              ['all', __('All editorial statuses', 'veridis-news-desk')],
              ['idea', __('Idea', 'veridis-news-desk')],
              ['writing', __('Writing', 'veridis-news-desk')],
              ['review', __('Review', 'veridis-news-desk')],
              ['ready', __('Ready to publish', 'veridis-news-desk')],
            ]}
          />
        )}

        <ToolbarFilter
          label={__('Assigned to', 'veridis-news-desk')}
          value={String(filters.assigned_to)}
          disabled={optionsLoading || optionsError}
          onChange={value => onChange({ assigned_to: Number(value), page: 1 })}
          options={assignedOptions}
        />

        <ToolbarFilter
          label={__('Deadline', 'veridis-news-desk')}
          value={filters.deadline_state}
          onChange={value => onChange({ deadline_state: value as DeadlineFilter, page: 1 })}
          options={[
            ['all', __('All deadlines', 'veridis-news-desk')],
            ['overdue', __('Overdue', 'veridis-news-desk')],
            ['due_today', __('Due today', 'veridis-news-desk')],
            ['no_deadline', __('No deadline', 'veridis-news-desk')],
          ]}
        />

        <ToolbarFilter
          label={__('Priority', 'veridis-news-desk')}
          value={filters.priority}
          onChange={value => onChange({ priority: value as 'all' | Priority, page: 1 })}
          options={[
            ['all', __('All priorities', 'veridis-news-desk')],
            ['urgent', __('Urgent', 'veridis-news-desk')],
            ['high', __('High', 'veridis-news-desk')],
            ['normal', __('Normal', 'veridis-news-desk')],
            ['low', __('Low', 'veridis-news-desk')],
          ]}
        />

        <ToolbarFilter
          label={__('WordPress status', 'veridis-news-desk')}
          value={filters.status}
          onChange={value => onChange({ status: value as NewsroomFilters['status'], page: 1 })}
          options={[
            ['all', isBoard ? __('Active WP statuses', 'veridis-news-desk') : __('All WP statuses', 'veridis-news-desk')],
            ['active', __('Active (draft, review, scheduled)', 'veridis-news-desk')],
            ['draft', __('Draft', 'veridis-news-desk')],
            ['pending', __('In review', 'veridis-news-desk')],
            ['future', __('Scheduled', 'veridis-news-desk')],
            ['publish', __('Published', 'veridis-news-desk')],
          ]}
        />

        <ToolbarFilter
          label={__('Author', 'veridis-news-desk')}
          value={String(filters.author)}
          disabled={optionsLoading || optionsError}
          onChange={value => onChange({ author: Number(value), page: 1 })}
          options={authorOptions}
        />

        <ToolbarFilter
          label={__('Category', 'veridis-news-desk')}
          value={String(filters.category)}
          disabled={optionsLoading || optionsError}
          onChange={value => onChange({ category: Number(value), page: 1 })}
          options={categoryOptions}
        />

        <ToolbarFilter
          label={__('Article Health', 'veridis-news-desk')}
          value={filters.health}
          onChange={value => onChange({ health: value as HealthFilter, page: 1 })}
          options={[
            ['all', __('All health states', 'veridis-news-desk')],
            ['has_issues', __('Has issues', 'veridis-news-desk')],
            ['complete', __('Complete', 'veridis-news-desk')],
            ['missing_featured_image', __('Missing featured image', 'veridis-news-desk')],
            ['missing_excerpt', __('Missing excerpt', 'veridis-news-desk')],
            ['missing_source', __('Missing source', 'veridis-news-desk')],
            ['missing_photo_credit', __('Missing photo credit', 'veridis-news-desk')],
          ]}
        />

        {!isBoard && (
          <ToolbarFilter
            label={__('Sort', 'veridis-news-desk')}
            value={filters.sort}
            onChange={value => onChange({ sort: value as NewsroomSort, page: 1 })}
            options={[
              ['recent', __('Recently updated', 'veridis-news-desk')],
              ['deadline_soonest', __('Deadline soonest', 'veridis-news-desk')],
              ['priority', __('Priority', 'veridis-news-desk')],
              ['oldest', __('Oldest updated', 'veridis-news-desk')],
              ['date_desc', __('Publish date newest', 'veridis-news-desk')],
              ['date_asc', __('Publish date oldest', 'veridis-news-desk')],
              ['title_asc', __('Title A–Z', 'veridis-news-desk')],
            ]}
          />
        )}

        {filters.period === 'today' && (
          <span className="vnd-active-filter">{__('Published today', 'veridis-news-desk')}</span>
        )}
      </div>
    </div>
  );
}
