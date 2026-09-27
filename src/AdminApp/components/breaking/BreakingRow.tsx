import { __ } from '@wordpress/i18n';
import type { NewsroomItem } from '../../types';
import { BreakingBadge, useBreakingActive } from './BreakingBadge';
import { useUpdateBreaking } from '../../hooks/useUpdateBreaking';
import { useToast } from '../../design-system/VeridisToast';
import { VeridisButton } from '../../design-system/VeridisButton';
import { VeridisBadge } from '../../design-system/VeridisBadge';
import { CategoryBadge } from '../../design-system/CategoryBadge';
export function BreakingRow({ item, onOpen, onEdit }: { item: NewsroomItem; onOpen: (id: number) => void; onEdit: (item: NewsroomItem) => void }) {
  const active = useBreakingActive(item.breaking);
  const mutation = useUpdateBreaking(item.id);
  const toast = useToast();
  if (!active) return null;
  return <li className="vnd-breaking-row">
    <button type="button" className="vnd-breaking-story" data-article-id={item.id} onClick={() => onOpen(item.id)}>
      <span className="vnd-breaking-row-main">
        <span className="vnd-breaking-row-badges"><BreakingBadge breaking={item.breaking} /><VeridisBadge tone={item.breaking.priority === 'critical' ? 'error' : item.breaking.priority === 'high' ? 'warning' : 'neutral'}>{item.breaking.priority}</VeridisBadge>{item.breaking.homepageLead && <VeridisBadge tone="info">{__('Homepage lead', 'veridis-news-desk')}</VeridisBadge>}</span>
        <strong>{item.title}</strong>
        <span className="vnd-breaking-article-meta"><VeridisBadge tone={item.wpStatusTone || item.tone}>{item.statusLabel}</VeridisBadge><CategoryBadge category={item.primaryCategory} /></span>
      </span>
      <span className="vnd-breaking-row-timing"><span>{__('Started', 'veridis-news-desk')} <strong>{item.breaking.startedAtLabel}</strong></span><span>{__('Expires', 'veridis-news-desk')} <strong>{item.breaking.expiresAtLabel || __('No expiry', 'veridis-news-desk')}</strong></span></span>
      <span className="vnd-breaking-row-context"><span>{item.assignedName}</span>{item.healthIssueCount > 0 && <VeridisBadge tone="warning">{item.healthIssueCount} {__('issues', 'veridis-news-desk')}</VeridisBadge>}</span>
    </button>
    <div className="vnd-breaking-row-actions"><VeridisButton variant="secondary" onClick={() => onEdit(item)}>{__('Edit', 'veridis-news-desk')}</VeridisButton><VeridisButton variant="ghost" disabled={mutation.isPending} onClick={async () => { try { await mutation.mutateAsync({ active: false }); toast(__('Removed from Breaking.', 'veridis-news-desk'), 'success'); } catch { /* Inline error. */ } }}>{__('Remove', 'veridis-news-desk')}</VeridisButton></div>
    {mutation.isError && <p className="vnd-form-error" role="alert">{mutation.error.message}</p>}
  </li>;
}
