const allowedNewsroomParams = new Set([
  'page',
  'vnd_view',
  'vnd_layout',
  'search',
  'status',
  'editorial_status',
  'assigned_to',
  'priority',
  'deadline_state',
  'author',
  'category',
  'health',
  'sort',
  'period',
  'vnd_page',
  'article',
]);

function adminBase(adminUrl: string): URL | null {
  try {
    const base = new URL(adminUrl);
    base.pathname = `${base.pathname.replace(/\/?$/, '/')}`;
    base.search = '';
    base.hash = '';
    return base;
  } catch {
    return null;
  }
}

function validateCandidate(candidate: string | null | undefined, base: URL, endpoint: URL): string | null {
  if (!candidate?.trim()) return null;

  try {
    const target = new URL(candidate.trim(), base);
    if (target.origin !== base.origin || target.pathname !== endpoint.pathname || target.username || target.password) {
      return null;
    }
    const safe = new URL(endpoint.href);
    for (const [key, value] of target.searchParams) {
      if (allowedNewsroomParams.has(key)) safe.searchParams.set(key, value);
    }
    if (safe.searchParams.get('page') !== 'veridis-news-desk') return null;
    return safe.href;
  } catch {
    return null;
  }
}

export function resolveEditorReturnUrl({
  adminUrl,
  returnUrl,
  sessionReturn,
}: {
  adminUrl: string;
  returnUrl?: string | null;
  sessionReturn?: string | null;
}): string {
  const base = adminBase(adminUrl);
  if (!base) return returnUrl || '';

  const endpoint = new URL('admin.php', base);
  const fallback = new URL(endpoint.href);
  fallback.searchParams.set('page', 'veridis-news-desk');
  fallback.searchParams.set('vnd_view', 'newsroom');

  return validateCandidate(sessionReturn, base, endpoint)
    ?? validateCandidate(returnUrl, base, endpoint)
    ?? fallback.href;
}
