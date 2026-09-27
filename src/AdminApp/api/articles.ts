import { apiGet, apiPatch, apiPost } from './client';
import type { ArticleDetail, CreateArticleInput, UpdateArticleContentInput, UpdateEditorialInput } from '../types';

export const getArticle = (id: number, signal?: AbortSignal) => apiGet<ArticleDetail>(`articles/${id}`, signal);
export const createArticle = (input: CreateArticleInput) => apiPost<ArticleDetail>('articles', input);
export const updateEditorial = (id: number, input: UpdateEditorialInput, signal?: AbortSignal) =>
  apiPatch<ArticleDetail>(`articles/${id}/editorial`, input, signal);
export const updateArticleContent = (id: number, input: UpdateArticleContentInput, signal?: AbortSignal) =>
  apiPatch<ArticleDetail>(`articles/${id}/content`, input, signal);
