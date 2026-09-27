export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
	return apiRequest<T>(path, { method: 'GET', signal });
}

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
	return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body), signal });
}

export async function apiPatch<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
	return apiRequest<T>(path, { method: 'PATCH', body: JSON.stringify(body), signal });
}

async function apiRequest<T>(path: string, init: RequestInit): Promise<T> {
  const config = window.veridisNewsDesk;
  if (!config?.restUrl || !config.nonce) throw new Error(__('News Desk could not start. Reload this page.', 'veridis-news-desk'));
  // Append to rest_route too: WordPress may use plain permalinks.
  const url = new URL(config.restUrl);
	const relative = new URL(path, 'https://veridis.invalid/');
  if (url.searchParams.has('rest_route')) {
	url.searchParams.set('rest_route', url.searchParams.get('rest_route')!.replace(/\/$/, '') + relative.pathname);
  } else {
	url.pathname = url.pathname.replace(/\/$/, '') + relative.pathname;
  }
	relative.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  const response = await fetch(url, {
	...init,
	credentials: 'same-origin',
	headers: { 'X-WP-Nonce': config.nonce, Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  const nonce = response.headers.get('X-WP-Nonce');
  if (nonce) config.nonce = nonce;
  if (!response.ok) {
	let serverMessage = '';
	try { serverMessage = String((await response.clone().json() as { message?: string }).message ?? ''); } catch { /* Use the stable fallback below. */ }
    const message = response.status === 401 || response.status === 403
      ? __('Your session expired or you do not have access. Reload the page to sign in again.', 'veridis-news-desk')
	  : serverMessage || __('We could not load your desk. Please try again.', 'veridis-news-desk');
    throw new ApiError(message, response.status);
  }
  try { return await response.json() as T; }
  catch { throw new ApiError(__('The server returned an unexpected response. Please try again.', 'veridis-news-desk'), response.status); }
}
import { __ } from '@wordpress/i18n';
