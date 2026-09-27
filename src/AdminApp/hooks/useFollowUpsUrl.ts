import { useCallback, useEffect, useState } from 'react';
import type { FollowUpFilters } from '../types';

const followUpStatuses = ['open', 'done', 'cancelled', 'all'] as const;
const followUpDueFilters = ['all', 'overdue', 'due_today', 'upcoming', 'no_deadline'] as const;
export const followUpUrlParams = ['fu_search', 'fu_status', 'fu_due', 'fu_assigned_to', 'fu_page'] as const;

export const followUpDefaults: FollowUpFilters = {
  status: 'open',
  due: 'all',
  assigned_to: 0,
  search: '',
  page: 1,
  per_page: 25,
};

export interface FollowUpsUrlState {
  filters: FollowUpFilters;
}

export function clearFollowUpsParams(url: URL): void {
  followUpUrlParams.forEach(key => url.searchParams.delete(key));
}

function positivePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function assignedTo(value: string | null): number {
  if (value === '-1') return -1;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export function readFollowUpsUrl(search: string = window.location.search): FollowUpsUrlState {
  const params = new URLSearchParams(search);
  const rawStatus = params.get('fu_status');
  const rawDue = params.get('fu_due');

  return {
    filters: {
      status: rawStatus && followUpStatuses.includes(rawStatus as typeof followUpStatuses[number])
        ? rawStatus as FollowUpFilters['status']
        : followUpDefaults.status,
      due: rawDue && followUpDueFilters.includes(rawDue as typeof followUpDueFilters[number])
        ? rawDue as FollowUpFilters['due']
        : followUpDefaults.due,
      assigned_to: assignedTo(params.get('fu_assigned_to')),
      search: params.get('fu_search') ?? followUpDefaults.search,
      page: positivePage(params.get('fu_page')),
      per_page: followUpDefaults.per_page,
    },
  };
}

export function writeFollowUpsUrl(filters: FollowUpFilters, currentUrl: string = window.location.href): string {
  const url = new URL(currentUrl);
  url.searchParams.set('vnd_view', 'follow-ups');
  clearFollowUpsParams(url);

  if (filters.search) url.searchParams.set('fu_search', filters.search);
  if (filters.status !== followUpDefaults.status) url.searchParams.set('fu_status', filters.status);
  if (filters.due !== followUpDefaults.due) url.searchParams.set('fu_due', filters.due);
  if (filters.assigned_to !== followUpDefaults.assigned_to) url.searchParams.set('fu_assigned_to', String(filters.assigned_to));
  if (filters.page !== followUpDefaults.page) url.searchParams.set('fu_page', String(filters.page));

  return url.pathname + url.search + url.hash;
}

export function useFollowUpsUrl() {
  const [state, setState] = useState<FollowUpsUrlState>(() => readFollowUpsUrl());

  useEffect(() => {
    const onPop = () => setState(readFollowUpsUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const updateFilters = useCallback((patch: Partial<FollowUpFilters>, replace = false) => {
    setState(current => {
      const filters = { ...current.filters, ...patch };
      window.history[replace ? 'replaceState' : 'pushState'](null, '', writeFollowUpsUrl(filters));
      return { filters };
    });
  }, []);

  const resetFilters = useCallback(() => {
    updateFilters(followUpDefaults, true);
  }, [updateFilters]);

  return { ...state, updateFilters, resetFilters };
}
