import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import type { NewsroomItem } from '../../types';
import { VeridisButton } from '../../design-system/VeridisButton';
import { useToast } from '../../design-system/VeridisToast';
import { useUpdateBreaking } from '../../hooks/useUpdateBreaking';
import { BreakingEditor } from './BreakingEditor';
import { useBreakingActive } from './BreakingBadge';
import { VeridisBadge } from '../../design-system/VeridisBadge';
export function BreakingSection({ article }: { article: NewsroomItem }) {
  const [editing, setEditing] = useState(false);
  const mutation = useUpdateBreaking(article.id);
  const toast = useToast();
  const b = article.breaking;
  const active = useBreakingActive(b);
  return <section className="vnd-drawer-section vnd-breaking-section">
    {editing ? <BreakingEditor article={article} mode={active ? 'edit' : 'create'} onDone={() => setEditing(false)} /> : <>
      <div className="vnd-editorial-header"><h3>{__('Breaking', 'veridis-news-desk')}</h3><VeridisButton variant="secondary" className="vnd-editorial-edit-btn" onClick={() => setEditing(true)}>{active ? __('Edit Breaking', 'veridis-news-desk') : __('Promote to Breaking', 'veridis-news-desk')}</VeridisButton></div>
      <dl className="vnd-editorial-grid">
        <div className="vnd-detail-row"><dt>{__('Status', 'veridis-news-desk')}</dt><dd><VeridisBadge tone={active ? 'warning' : 'neutral'}>{active ? __('Active', 'veridis-news-desk') : b.enabled ? __('Expired', 'veridis-news-desk') : __('Not active', 'veridis-news-desk')}</VeridisBadge></dd></div>
        {b.startedAt && <>
          <div className="vnd-detail-row"><dt>{__('Priority', 'veridis-news-desk')}</dt><dd><VeridisBadge tone={b.priority === 'critical' ? 'error' : b.priority === 'high' ? 'warning' : 'neutral'}>{b.priority}</VeridisBadge></dd></div>
          <div className="vnd-detail-row"><dt>{__('Label', 'veridis-news-desk')}</dt><dd>{b.label}</dd></div>
          <div className="vnd-detail-row"><dt>{__('Started', 'veridis-news-desk')}</dt><dd>{b.startedAtLabel}</dd></div>
          <div className="vnd-detail-row"><dt>{__('Expires', 'veridis-news-desk')}</dt><dd>{b.expiresAtLabel || __('No expiry', 'veridis-news-desk')}</dd></div>
          {b.homepageLead && <div className="vnd-detail-row"><dt>{__('Homepage lead', 'veridis-news-desk')}</dt><dd>{__('Yes', 'veridis-news-desk')}</dd></div>}
        </>}
      </dl>
      {active && <div className="vnd-breaking-remove-row"><VeridisButton variant="ghost" disabled={mutation.isPending} onClick={async () => { try { await mutation.mutateAsync({ active: false }); toast(__('Removed from Breaking.', 'veridis-news-desk'), 'success'); } catch { /* Inline error. */ } }}>{__('Remove from Breaking', 'veridis-news-desk')}</VeridisButton></div>}
      {mutation.isError && <p role="alert">{mutation.error.message}</p>}
    </>}
  </section>;
}
