import type { EditorialStatus, NewsroomBoardData, NewsroomFilters, NewsroomLayout } from '../../types';

export function contextAfterStoryCreation(
  layout: NewsroomLayout,
  current: NewsroomFilters,
  editorialStatus: EditorialStatus,
  board: NewsroomBoardData | undefined,
): { filters: Partial<NewsroomFilters>; layout: NewsroomLayout } {
  // A filtered Board count cannot establish how many stories will be in the
  // column after clearing those filters. The Board also caps each column at 50.
  const column = board?.columns[editorialStatus];
  const boardCountCoversDrafts = !current.search &&
    ['all', 'active', 'draft'].includes(current.status) &&
    current.assigned_to === 0 && current.author === 0 && current.category === 0 &&
    current.priority === 'all' && current.deadline_state === 'all' &&
    current.health === 'all' && current.period === 'all';
  const resultingLayout = layout === 'board' && boardCountCoversDrafts && column && column.total < column.limit ? 'board' : 'list';

  return {
    layout: resultingLayout,
    filters: {
      search: '',
      status: 'draft',
      editorial_status: 'all',
      assigned_to: 0,
      author: 0,
      category: 0,
      priority: 'all',
      deadline_state: 'all',
      health: 'all',
      period: 'all',
      page: 1,
      // Recent puts a newly created draft on the first List page.
      ...(resultingLayout === 'list' ? { sort: 'recent' as const } : {}),
    },
  };
}
