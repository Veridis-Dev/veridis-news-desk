import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useBreaking } from '../hooks/useBreaking';
import { useNewsroomOptions } from '../hooks/useNewsroomOptions';
import { VeridisButton } from '../design-system/VeridisButton';
import { VeridisModal } from '../design-system/VeridisModal';
import { VeridisCard } from '../design-system/VeridisCard';
import { VeridisBadge } from '../design-system/VeridisBadge';
import { EmptyState } from '../design-system/EmptyState';
import { ArticleDrawer } from '../components/newsroom/ArticleDrawer';
import { NewStoryModal } from '../components/newsroom/NewStoryModal';
import { AddBreakingStoryModal } from '../components/breaking/AddBreakingStoryModal';
import { BreakingRow } from '../components/breaking/BreakingRow';
import { BreakingEditor } from '../components/breaking/BreakingEditor';
import { BreakingPanelSkeleton, VeridisSkeleton } from '../design-system/VeridisSkeleton';
import type { NewsroomItem } from '../types';
export function Breaking() {
  const query = useBreaking();
  const options = useNewsroomOptions();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<NewsroomItem | null>(null);
  const [article, setArticle] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  return <>
    <div className="vnd-page-heading">
      <div>
        <p className="vnd-eyebrow">{__('EDITORIAL COVERAGE', 'veridis-news-desk')}</p>
        <h2>{__('Breaking', 'veridis-news-desk')}</h2>
        <p>{__('Promote high-priority stories and manage real-time coverage.', 'veridis-news-desk')}</p>
      </div>
      <div className="vnd-page-heading-actions">
        <VeridisButton onClick={() => setAdding(true)}>
          {__('＋ Add breaking story', 'veridis-news-desk')}
        </VeridisButton>
      </div>
    </div>
    {query.isPending && !query.data && (
      <VeridisCard
        className="vnd-breaking-card"
        title={__('Active Breaking', 'veridis-news-desk')}
        action={<VeridisSkeleton shape="badge" style={{ width: '64px', height: '22px' }} />}
      >
        <div aria-busy="true" aria-label={__('Loading Breaking coverage', 'veridis-news-desk')}>
          <span className="vnd-sr-only" role="status">{__('Loading Breaking coverage…', 'veridis-news-desk')}</span>
          <BreakingPanelSkeleton />
        </div>
      </VeridisCard>
    )}
    {query.isError && !query.data && (
      <EmptyState
        title={__('Breaking coverage could not load', 'veridis-news-desk')}
        description={query.error.message}
        action={<VeridisButton onClick={() => query.refetch()}>{__('Try again', 'veridis-news-desk')}</VeridisButton>}
      />
    )}
    {query.data && <VeridisCard
      className="vnd-breaking-card"
      title={__('Active Breaking', 'veridis-news-desk')}
      action={<VeridisBadge tone={query.data.total ? 'warning' : 'neutral'}>{query.data.total} {__('active', 'veridis-news-desk')}</VeridisBadge>}
    >
      {query.data.items.length ? <ul className="vnd-list vnd-breaking-list">{query.data.items.map(item => <BreakingRow key={item.id} item={item} onOpen={setArticle} onEdit={setEditing} />)}</ul> : <EmptyState title={__('No active breaking stories', 'veridis-news-desk')} description={__('Breaking coverage will appear here when a story is promoted.', 'veridis-news-desk')} />}
      {query.data.total > query.data.limit && <p className="vnd-breaking-limit-note">{__('Showing the 50 highest-priority active stories.', 'veridis-news-desk')}</p>}
    </VeridisCard>}
    {adding && <AddBreakingStoryModal onClose={() => setAdding(false)} onCreate={() => { setAdding(false); setCreating(true); }} />}
    {editing && <VeridisModal open title={__('Edit Breaking', 'veridis-news-desk')} onClose={() => setEditing(null)} footer={null}><BreakingEditor article={editing} mode="edit" onDone={() => setEditing(null)} /></VeridisModal>}
    {creating && options.isPending && <p role="status">{__('Loading story options…', 'veridis-news-desk')}</p>}
    {creating && options.isError && <p role="alert">{options.error.message}</p>}
    {options.data && <NewStoryModal open={creating} assignees={options.data.assignees} categories={options.data.categories} context="breaking" onClose={() => setCreating(false)} onCreated={setArticle} />}
    <ArticleDrawer articleId={article} onClose={() => setArticle(null)} />
  </>;
}
