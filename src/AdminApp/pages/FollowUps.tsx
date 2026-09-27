import { useMemo, useState } from 'react';
import { __ } from '@wordpress/i18n';
import type { FollowUpFilters, FollowUpItem } from '../types';
import { useFollowUps } from '../hooks/useFollowUps';
import { useNewsroomOptions } from '../hooks/useNewsroomOptions';
import { VeridisButton } from '../design-system/VeridisButton';
import { FollowUpSummaryCards } from '../components/followups/FollowUpSummaryCards';
import { FollowUpToolbar } from '../components/followups/FollowUpToolbar';
import { FollowUpActiveFilters } from '../components/followups/FollowUpActiveFilters';
import { FollowUpList } from '../components/followups/FollowUpList';
import { FollowUpModal } from '../components/followups/FollowUpModal';
import { ArticleDrawer } from '../components/newsroom/ArticleDrawer';
import { NewStoryModal } from '../components/newsroom/NewStoryModal';
import { useFollowUpsUrl } from '../hooks/useFollowUpsUrl';

interface FollowUpsProps {
  onOpenArticle?: (articleId: number) => void;
}

export function FollowUps({ onOpenArticle }: FollowUpsProps) {
  const { filters, updateFilters, resetFilters } = useFollowUpsUrl();

  const [editingItem, setEditingItem] = useState<FollowUpItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null);

  const query = useFollowUps(filters);
  const optionsQuery = useNewsroomOptions();
  const authors = optionsQuery.data?.authors || [];
  const assignees = optionsQuery.data?.assignees || [];
  const categories = optionsQuery.data?.categories || [];
  const noStories = query.data?.overallStories === 0;
  const canCreateStory = Boolean(assignees.length && categories.length && !optionsQuery.isPending);

  const handleFilterChange = (patch: Partial<FollowUpFilters>, replace = false) => {
    updateFilters(patch, replace);
  };

  const summaryCounts = useMemo(() => {
    return (
      query.data?.counts || {
        overdue: 0,
        dueToday: 0,
        upcoming: 0,
        noDeadline: 0,
        totalOpen: 0,
        done: 0,
        cancelled: 0,
      }
    );
  }, [query.data?.counts]);

  const handleOpenArticle = (articleId: number) => {
    if (onOpenArticle) {
      onOpenArticle(articleId);
    } else {
      setActiveArticleId(articleId);
    }
  };

  return (
    <>
      <div className="vnd-page-heading">
        <div>
          <p className="vnd-eyebrow">{__('EDITORIAL WORKFLOW', 'veridis-news-desk')}</p>
          <h2>{__('Follow-ups', 'veridis-news-desk')}</h2>
          <p>{__('Track callbacks, story developments, and editorial revisits.', 'veridis-news-desk')}</p>
        </div>
        {query.data && !noStories && (
          <div className="vnd-page-heading-actions">
            <VeridisButton onClick={() => setIsCreating(true)}>
              {__('＋ New follow-up', 'veridis-news-desk')}
            </VeridisButton>
          </div>
        )}
      </div>

      <FollowUpSummaryCards
        counts={summaryCounts}
        activeDue={filters.due}
        activeStatus={filters.status}
        loading={query.isPending && !query.data}
        onSelectDueFilter={dueKey => {
          handleFilterChange({ due: dueKey, page: 1 });
        }}
      />

      <section className="vnd-newsroom-shell" aria-label={__('Editorial follow-ups', 'veridis-news-desk')}>
        <FollowUpToolbar
          filters={filters}
          authors={authors}
          onChange={handleFilterChange}
        />

        <FollowUpActiveFilters
          filters={filters}
          authors={authors}
          onChange={handleFilterChange}
          onClear={resetFilters}
        />

        <FollowUpList
          data={query.data}
          loading={query.isPending}
          fetching={query.isFetching}
          error={query.isError}
          onRetry={() => query.refetch()}
          onOpenArticle={handleOpenArticle}
          onEdit={item => setEditingItem(item)}
          onPage={page => handleFilterChange({ page })}
          onCreate={() => setIsCreating(true)}
          onCreateStory={() => setIsCreatingStory(true)}
          canCreateStory={canCreateStory}
        />
      </section>

      {isCreating && (
        <FollowUpModal
          open={isCreating}
          onClose={() => setIsCreating(false)}
        />
      )}

      {editingItem && (
        <FollowUpModal
          open={Boolean(editingItem)}
          followUp={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      <NewStoryModal
        open={isCreatingStory}
        assignees={assignees}
        categories={categories}
        onClose={() => setIsCreatingStory(false)}
        onCreated={id => handleOpenArticle(id)}
      />

      <ArticleDrawer
        articleId={activeArticleId}
        onClose={() => setActiveArticleId(null)}
      />
    </>
  );
}
