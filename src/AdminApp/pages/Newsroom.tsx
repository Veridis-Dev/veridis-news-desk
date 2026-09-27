import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { useNewsroom } from '../hooks/useNewsroom';
import { useEditorialBoard } from '../hooks/useEditorialBoard';
import { useNewsroomOptions } from '../hooks/useNewsroomOptions';
import { useNewsroomUrl } from '../hooks/useNewsroomUrl';
import { VeridisButton } from '../design-system/VeridisButton';
import { NewsroomViewToggle } from '../components/newsroom/NewsroomViewToggle';
import { NewsroomToolbar } from '../components/newsroom/NewsroomToolbar';
import { ActiveFilters } from '../components/newsroom/ActiveFilters';
import { NewsroomList } from '../components/newsroom/NewsroomList';
import { EditorialBoard } from '../components/newsroom/EditorialBoard';
import { ArticleDrawer } from '../components/newsroom/ArticleDrawer';
import { NewStoryModal } from '../components/newsroom/NewStoryModal';
import { contextAfterStoryCreation } from '../components/newsroom/newStoryVisibility';

export function Newsroom() {
  const { filters, layout, article, updateFilters, setLayout, openArticle, closeArticle } = useNewsroomUrl();
  const listQuery = useNewsroom(filters, layout === 'list');
  const boardQuery = useEditorialBoard(filters, layout === 'board');
  const optionsQuery = useNewsroomOptions();
  const [creating, setCreating] = useState(false);
  const options = optionsQuery.data ?? { authors: [], assignees: [], categories: [] };
  const canCreate = Boolean(options.assignees.length && options.categories.length && !optionsQuery.isPending);
  const clear = () => updateFilters({
    search: '',
    status: 'all',
    editorial_status: 'all',
    assigned_to: 0,
    priority: 'all',
    deadline_state: 'all',
    author: 0,
    category: 0,
    health: 'all',
    sort: 'recent',
    period: 'all',
    page: 1,
  });

  return <>
    <div className="vnd-page-heading">
      <div>
        <p className="vnd-eyebrow">{__('NEWSROOM', 'veridis-news-desk')}</p>
        <h2>{__('Newsroom', 'veridis-news-desk')}</h2>
        <p>{__('Find the story that needs your attention next.', 'veridis-news-desk')}</p>
      </div>
      <div className="vnd-page-heading-actions">
        <NewsroomViewToggle layout={layout} onChange={setLayout} />
        <VeridisButton onClick={() => setCreating(true)} disabled={!canCreate}>
          {__('＋ New story', 'veridis-news-desk')}
        </VeridisButton>
      </div>
    </div>
    <section className="vnd-newsroom-shell" aria-label={__('Editorial articles', 'veridis-news-desk')}>
      <NewsroomToolbar
        filters={filters}
        authors={options.authors}
        assignees={options.assignees}
        categories={options.categories}
        layout={layout}
        optionsLoading={optionsQuery.isPending}
        optionsError={optionsQuery.isError}
        onChange={updateFilters}
      />
      <ActiveFilters
        filters={filters}
        authors={options.authors}
        assignees={options.assignees}
        categories={options.categories}
        layout={layout}
        onChange={updateFilters}
        onClear={clear}
      />
      {layout === 'board' ? (
        <EditorialBoard
          data={boardQuery.data}
          loading={boardQuery.isPending && !boardQuery.data}
          fetching={boardQuery.isFetching}
          error={boardQuery.isError}
          onRetry={() => boardQuery.refetch()}
          onOpenArticle={openArticle}
          onViewListForStatus={status => {
            updateFilters({ editorial_status: status, page: 1 });
            setLayout('list');
          }}
        />
      ) : (
        <NewsroomList
          data={listQuery.data}
          loading={listQuery.isPending && !listQuery.data}
          fetching={listQuery.isFetching}
          error={listQuery.isError}
          canCreate={canCreate}
          onRetry={() => listQuery.refetch()}
          onCreate={() => setCreating(true)}
          onOpen={openArticle}
          onPage={page => updateFilters({ page })}
        />
      )}
    </section>
    <ArticleDrawer articleId={article} onClose={closeArticle} />
    <NewStoryModal
      open={creating}
      assignees={options.assignees}
      categories={options.categories}
      onClose={() => setCreating(false)}
      onCreated={(id, editorialStatus) => {
        const next = contextAfterStoryCreation(layout, filters, editorialStatus, boardQuery.isPlaceholderData ? undefined : boardQuery.data);
        updateFilters(next.filters);
        if (next.layout !== layout) setLayout(next.layout);
        openArticle(id);
      }}
    />
  </>;
}
