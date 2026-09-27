import { __, sprintf } from '@wordpress/i18n';
import type {
  DeadlineFilter,
  EditorialStatus,
  HealthFilter,
  NewsroomFilters,
  NewsroomLayout,
  Priority,
  TermOption,
  WordPressPostStatus,
} from '../../types';
import { ActiveFilterBar, type FilterChipItem } from '../../design-system/ActiveFilterBar';

export interface ActiveFiltersProps {
  filters: NewsroomFilters;
  authors: TermOption[];
  assignees: TermOption[];
  categories: TermOption[];
  layout?: NewsroomLayout;
  onChange: (patch: Partial<NewsroomFilters>) => void;
  onClear: () => void;
}

const editorialStatusLabels: Record<EditorialStatus, string> = {
  idea: __('Idea', 'veridis-news-desk'),
  writing: __('Writing', 'veridis-news-desk'),
  review: __('Review', 'veridis-news-desk'),
  ready: __('Ready to publish', 'veridis-news-desk'),
};

const deadlineLabels: Record<DeadlineFilter, string> = {
  all: __('All deadlines', 'veridis-news-desk'),
  overdue: __('Overdue', 'veridis-news-desk'),
  due_today: __('Due today', 'veridis-news-desk'),
  no_deadline: __('No deadline', 'veridis-news-desk'),
};

const priorityLabels: Record<Priority, string> = {
  urgent: __('Urgent', 'veridis-news-desk'),
  high: __('High', 'veridis-news-desk'),
  normal: __('Normal', 'veridis-news-desk'),
  low: __('Low', 'veridis-news-desk'),
};

const wpStatusLabels: Record<WordPressPostStatus | 'active', string> = {
  active: __('Active (draft, review, scheduled)', 'veridis-news-desk'),
  draft: __('Draft', 'veridis-news-desk'),
  pending: __('In review', 'veridis-news-desk'),
  future: __('Scheduled', 'veridis-news-desk'),
  publish: __('Published', 'veridis-news-desk'),
};

const healthLabels: Record<HealthFilter, string> = {
  all: __('All health states', 'veridis-news-desk'),
  has_issues: __('Has issues', 'veridis-news-desk'),
  complete: __('Complete', 'veridis-news-desk'),
  missing_featured_image: __('Missing featured image', 'veridis-news-desk'),
  missing_excerpt: __('Missing excerpt', 'veridis-news-desk'),
  missing_source: __('Missing source', 'veridis-news-desk'),
  missing_photo_credit: __('Missing photo credit', 'veridis-news-desk'),
};

export function ActiveFilters({
  filters,
  authors,
  assignees,
  categories,
  layout = 'list',
  onChange,
  onClear,
}: ActiveFiltersProps) {
  const chips: FilterChipItem[] = [];

  // 1. Search
  if (filters.search && filters.search.trim()) {
    const trimmed = filters.search.trim();
    chips.push({
      id: 'search',
      /* translators: %s: search query */
      label: sprintf(__('Search: “%s”', 'veridis-news-desk'), trimmed),
      /* translators: %s: search query */
      removeAriaLabel: sprintf(__('Remove search filter “%s”', 'veridis-news-desk'), trimmed),
      onRemove: () => onChange({ search: '', page: 1 }),
    });
  }

  // 2. Editorial status (only on list layout, board already shows columns)
  if (layout !== 'board' && filters.editorial_status !== 'all') {
    const label = editorialStatusLabels[filters.editorial_status] || filters.editorial_status;
    chips.push({
      id: 'editorial_status',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ editorial_status: 'all', page: 1 }),
    });
  }

  // 3. Assignment
  if (filters.assigned_to !== 0) {
    let label: string = __('Unassigned', 'veridis-news-desk');
    if (filters.assigned_to > 0) {
      const found = assignees.find(a => a.id === filters.assigned_to);
      /* translators: %d: assignee ID */
      label = found ? found.name : sprintf(__('Assignee #%d', 'veridis-news-desk'), filters.assigned_to);
    }
    chips.push({
      id: 'assigned_to',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ assigned_to: 0, page: 1 }),
    });
  }

  // 4. Deadline state
  if (filters.deadline_state !== 'all') {
    const label = deadlineLabels[filters.deadline_state] || filters.deadline_state;
    chips.push({
      id: 'deadline_state',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ deadline_state: 'all', page: 1 }),
    });
  }

  // 5. Priority
  if (filters.priority !== 'all') {
    const label = priorityLabels[filters.priority] || filters.priority;
    chips.push({
      id: 'priority',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ priority: 'all', page: 1 }),
    });
  }

  // 6. WordPress status
  if (filters.status !== 'all') {
    const label = wpStatusLabels[filters.status] || filters.status;
    chips.push({
      id: 'status',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ status: 'all', page: 1 }),
    });
  }

  // 7. Author
  if (filters.author !== 0) {
    const found = authors.find(a => a.id === filters.author);
    /* translators: %d: author ID */
    const authorName = found ? found.name : sprintf(__('Author #%d', 'veridis-news-desk'), filters.author);
    /* translators: %s: author name */
    const label = sprintf(__('Author: %s', 'veridis-news-desk'), authorName);
    chips.push({
      id: 'author',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ author: 0, page: 1 }),
    });
  }

  // 8. Category
  if (filters.category !== 0) {
    const found = categories.find(c => c.id === filters.category);
    /* translators: %d: category ID */
    const label = found ? found.name : sprintf(__('Category #%d', 'veridis-news-desk'), filters.category);
    chips.push({
      id: 'category',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ category: 0, page: 1 }),
    });
  }

  // 9. Article Health
  if (filters.health !== 'all') {
    const label = healthLabels[filters.health] || filters.health;
    chips.push({
      id: 'health',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ health: 'all', page: 1 }),
    });
  }

  // 10. Period (if active)
  if (filters.period === 'today') {
    const label = __('Published today', 'veridis-news-desk');
    chips.push({
      id: 'period',
      label,
      /* translators: %s: filter label */
      removeAriaLabel: sprintf(__('Remove %s filter', 'veridis-news-desk'), label),
      onRemove: () => onChange({ period: 'all', page: 1 }),
    });
  }

  return <ActiveFilterBar chips={chips} onClear={onClear} />;
}
