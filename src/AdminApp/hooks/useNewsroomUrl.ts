import { useCallback, useEffect, useRef, useState } from 'react';
import type { DeadlineFilter, EditorialStatus, HealthFilter, NewsroomFilters, NewsroomLayout, NewsroomSort, Priority } from '../types';

const wpStatuses = ['all', 'active', 'draft', 'pending', 'future', 'publish'] as const;
const editorialStatuses = ['all', 'idea', 'writing', 'review', 'ready'] as const;
const priorities = ['all', 'urgent', 'high', 'normal', 'low'] as const;
const deadlineFilters = ['all', 'overdue', 'due_today', 'no_deadline'] as const;
const healthFilters: HealthFilter[] = ['all', 'has_issues', 'complete', 'missing_featured_image', 'missing_excerpt', 'missing_source', 'missing_photo_credit'];
const sorts: NewsroomSort[] = ['recent', 'oldest', 'date_desc', 'date_asc', 'title_asc', 'deadline_soonest', 'priority'];

const defaults: NewsroomFilters = {
  search: '',
  status: 'all',
  editorial_status: 'all',
  assigned_to: 0,
  priority: 'all',
  deadline_state: 'all',
  author: 0,
  category: 0,
  health: 'all',
  sort: 'recent',
  period: 'all',
  page: 1,
  per_page: 20,
};

function readUrl(): { filters: NewsroomFilters; layout: NewsroomLayout; article: number | null } {
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status') as NewsroomFilters['status'] | null;
  const editorialStatus = params.get('editorial_status') as EditorialStatus | null;
  const assignedToParam = params.get('assigned_to');
  const assignedTo = (assignedToParam === 'unassigned' || assignedToParam === '-1')
    ? -1
    : Math.max(0, Number(assignedToParam) || 0);
  const priority = params.get('priority') as Priority | null;
  const deadlineState = params.get('deadline_state') as DeadlineFilter | null;
  const health = params.get('health') as HealthFilter | null;
  const sort = params.get('sort') as NewsroomSort | null;
  const article = Number(params.get('article')) || null;
  const layout: NewsroomLayout = params.get('vnd_layout') === 'board' ? 'board' : 'list';

  return {
    filters: {
      search: params.get('search') ?? '',
      status: status && (wpStatuses as readonly string[]).includes(status) ? status : 'all',
      editorial_status: editorialStatus && (editorialStatuses as readonly string[]).includes(editorialStatus) ? editorialStatus : 'all',
      assigned_to: assignedTo,
      priority: priority && (priorities as readonly string[]).includes(priority) ? priority : 'all',
      deadline_state: deadlineState && (deadlineFilters as readonly string[]).includes(deadlineState) ? deadlineState : 'all',
      author: Math.max(0, Number(params.get('author')) || 0),
      category: Math.max(0, Number(params.get('category')) || 0),
      health: health && healthFilters.includes(health) ? health : 'all',
      sort: sort && sorts.includes(sort) ? sort : 'recent',
      period: params.get('period') === 'today' ? 'today' as const : 'all' as const,
      page: Math.max(1, Number(params.get('vnd_page')) || 1),
      per_page: 20,
    },
    layout,
    article,
  };
}

function writeUrl(filters: NewsroomFilters, layout: NewsroomLayout, article: number | null) {
  const url = new URL(window.location.href);
  url.searchParams.set('vnd_view', 'newsroom');
  if (layout === 'board') {
    url.searchParams.set('vnd_layout', 'board');
  } else {
    url.searchParams.delete('vnd_layout');
  }

  const values: Record<string, string | number> = {
    search: filters.search,
    status: filters.status,
    editorial_status: filters.editorial_status,
    assigned_to: filters.assigned_to === -1 ? 'unassigned' : filters.assigned_to,
    priority: filters.priority,
    deadline_state: filters.deadline_state,
    author: filters.author,
    category: filters.category,
    health: filters.health,
    sort: filters.sort,
    period: filters.period,
    vnd_page: filters.page,
  };

  for (const [key, value] of Object.entries(values)) {
    const defaultKey = key === 'vnd_page' ? 'page' : key;
    const defVal = defaults[defaultKey as keyof NewsroomFilters];
    if (String(value) === String(defVal)) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  if (article) {
    url.searchParams.set('article', String(article));
  } else {
    url.searchParams.delete('article');
  }

  return url.pathname + url.search + url.hash;
}

export function useNewsroomUrl() {
  const [state, setState] = useState(readUrl);
  const openedHere = useRef(false);

  useEffect(() => {
    const onPop = () => {
      openedHere.current = false;
      setState(readUrl());
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const updateFilters = useCallback((patch: Partial<NewsroomFilters>, replace = false) => {
    setState(current => {
      const filters = { ...current.filters, ...patch };
      window.history[replace ? 'replaceState' : 'pushState'](null, '', writeUrl(filters, current.layout, current.article));
      return { ...current, filters };
    });
  }, []);

  const setLayout = useCallback((layout: NewsroomLayout) => {
    setState(current => {
      window.history.replaceState(null, '', writeUrl(current.filters, layout, current.article));
      return { ...current, layout };
    });
  }, []);

  const openArticle = useCallback((article: number) => {
    setState(current => {
      openedHere.current = true;
      window.history.pushState(null, '', writeUrl(current.filters, current.layout, article));
      return { ...current, article };
    });
  }, []);

  const closeArticle = useCallback(() => {
    if (openedHere.current) {
      openedHere.current = false;
      window.history.back();
      return;
    }
    setState(current => {
      window.history.replaceState(null, '', writeUrl(current.filters, current.layout, null));
      return { ...current, article: null };
    });
  }, []);

  return { ...state, updateFilters, setLayout, openArticle, closeArticle };
}
