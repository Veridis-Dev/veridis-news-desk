import { apiGet, apiPost, apiPatch } from './client';
import type {
  FollowUpItem,
  FollowUpListingData,
  FollowUpFilters,
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from '../types';

export function getFollowUps(filters: Partial<FollowUpFilters>, signal?: AbortSignal): Promise<FollowUpListingData> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.due && filters.due !== 'all') {
    params.set('due', filters.due);
  }
  if (typeof filters.assigned_to === 'number' && filters.assigned_to !== 0) {
    params.set('assigned_to', String(filters.assigned_to));
  }
  if (filters.post_id) {
    params.set('post_id', String(filters.post_id));
  }
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.per_page) {
    params.set('per_page', String(filters.per_page));
  }

  const queryStr = params.toString();
  const path = queryStr ? `follow-ups?${queryStr}` : 'follow-ups';
  return apiGet<FollowUpListingData>(path, signal);
}

export function getArticleFollowUps(postId: number, signal?: AbortSignal): Promise<FollowUpItem[]> {
  return apiGet<{ items: FollowUpItem[] } | FollowUpItem[]>(`articles/${postId}/follow-ups`, signal).then(res => {
    return Array.isArray(res) ? res : (res.items || []);
  });
}

export function createFollowUp(postId: number, input: CreateFollowUpInput): Promise<FollowUpItem> {
  return apiPost<FollowUpItem>(`articles/${postId}/follow-ups`, input);
}

export function updateFollowUp(id: number, input: UpdateFollowUpInput): Promise<FollowUpItem> {
  return apiPatch<FollowUpItem>(`follow-ups/${id}`, input);
}
