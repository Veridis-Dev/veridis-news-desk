import { apiGet } from './client';
import type { NewsroomBoardData, NewsroomData, NewsroomFilters, NewsroomOptionsData } from '../types';

export function getNewsroom(filters: NewsroomFilters, signal?: AbortSignal) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) params.set(key, String(value));
  return apiGet<NewsroomData>(`newsroom?${params.toString()}`, signal);
}

export function getNewsroomBoard(filters: NewsroomFilters, signal?: AbortSignal) {
  const params = new URLSearchParams();
  const boardKeys: (keyof NewsroomFilters)[] = [
    'search',
    'status',
    'assigned_to',
    'priority',
    'deadline_state',
    'author',
    'category',
    'health',
    'period',
  ];
  for (const key of boardKeys) {
    if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== 0 && filters[key] !== 'all') {
      params.set(key, String(filters[key]));
    }
  }
  const queryString = params.toString();
  return apiGet<NewsroomBoardData>(queryString ? `newsroom/board?${queryString}` : 'newsroom/board', signal);
}

export function getNewsroomOptions(signal?: AbortSignal) {
  return apiGet<NewsroomOptionsData>('newsroom/options', signal);
}
