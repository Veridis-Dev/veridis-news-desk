import { apiGet, apiPatch } from './client';
import type { ArticleDetail, BreakingData, UpdateBreakingInput } from '../types';
export const getBreaking = (signal?: AbortSignal) => apiGet<BreakingData>('breaking', signal);
export const searchBreaking = (search: string, signal?: AbortSignal) => apiGet<BreakingData>(`breaking/search?search=${encodeURIComponent(search)}`, signal);
export const updateBreaking = (id: number, input: UpdateBreakingInput) => apiPatch<ArticleDetail>(`articles/${id}/breaking`, input);
