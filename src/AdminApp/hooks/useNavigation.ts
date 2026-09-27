import { useEffect, useState } from 'react';
import { __, _x } from '@wordpress/i18n';
import { clearFollowUpsParams } from './useFollowUpsUrl';
export const pages = [
  { id: 'dashboard', label: __('Dashboard', 'veridis-news-desk') },
  { id: 'newsroom', label: __('Newsroom', 'veridis-news-desk') },
  { id: 'follow-ups', label: __('Follow-ups', 'veridis-news-desk') },
  { id: 'help', label: __('Help', 'veridis-news-desk') },
  { id: 'settings', label: __('Settings', 'veridis-news-desk') },
] as const;
export type Page = typeof pages[number]['id'];
function readPage(): Page {
  const value = new URLSearchParams(window.location.search).get('vnd_view');
  return pages.find(page => page.id === value)?.id ?? 'dashboard';
}
const newsroomParams = ['article', 'search', 'status', 'editorial_status', 'assigned_to', 'priority', 'deadline_state', 'author', 'category', 'health', 'sort', 'period', 'vnd_page'];
export function pageUrl(page: string, params?: Record<string, string | number>) {
  const url = new URL(window.location.href);
  url.searchParams.set('vnd_view', page);
	if (page !== 'newsroom' || params) newsroomParams.forEach(key => url.searchParams.delete(key));
	if (page !== 'follow-ups' || params) clearFollowUpsParams(url);
	if (params) Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.pathname + url.search + url.hash;
}
export type NavigationGuard = (
  next: Page,
  params: Record<string, string | number> | undefined,
  proceed: () => void
) => boolean;

let currentGuard: NavigationGuard | null = null;

export function useNavigationGuard(guard: NavigationGuard | null) {
  useEffect(() => {
    currentGuard = guard;
    return () => {
      if (currentGuard === guard) {
        currentGuard = null;
      }
    };
  }, [guard]);
}

export function useNavigation() {
  const [page, setPage] = useState<Page>(readPage);
  useEffect(() => {
    const onPop = () => {
      const next = readPage();
      if (currentGuard) {
        const allowed = currentGuard(next, undefined, () => {
          setPage(next);
        });
        if (!allowed) {
          window.history.pushState(null, '', pageUrl(page));
          return;
        }
      }
      setPage(next);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [page]);
  function navigate(next: Page, params?: Record<string, string | number>, force = false) {
    if (next === page && !params) return;
    if (!force && currentGuard) {
      const allowed = currentGuard(next, params, () => navigate(next, params, true));
      if (!allowed) {
        return;
      }
    }
    window.history.pushState(null, '', pageUrl(next, params));
    setPage(next);
  }
  return { page, navigate };
}
