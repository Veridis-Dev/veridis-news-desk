import { FollowUpBadge } from './followups/FollowUpBadge';
import type { DashboardData } from '../types';
import { __, _n, sprintf } from '@wordpress/i18n';
import { VeridisBadge as Badge } from '../design-system/VeridisBadge';
import { VeridisCard as Card } from '../design-system/VeridisCard';
import { EmptyState } from '../design-system/EmptyState';
import { VeridisButton } from '../design-system/VeridisButton';
import { assignedLabel, storyPeopleLabels } from './newsroom/storyPeopleLabels';
const healthFilterMap: Record<string, string> = {
  missingFeaturedImage: 'missing_featured_image',
  missingExcerpt: 'missing_excerpt',
  missingSource: 'missing_source',
  missingPhotoCredit: 'missing_photo_credit',
};

export function DashboardPanels({
  data,
  onOpenArticle,
  onOpenNewsroom,
  onOpenFollowUps,
}: {
  data: DashboardData;
  onOpenArticle: (id: number) => void;
  onOpenNewsroom?: (params: Record<string, string | number>) => void;
  onOpenFollowUps?: () => void;
}) {
  /* translators: %d: number of stories. */
  const storyCountLabel = sprintf(_n('%d story', '%d stories', data.stories.length, 'veridis-news-desk'), data.stories.length);
  const attentionCount = data.stats.find(stat => stat.id === 'attention')?.value ?? 0;
  /* translators: %d: unique stories with a health issue or overdue editorial deadline. */
  const attentionCountLabel = sprintf(_n('%d story', '%d stories', attentionCount, 'veridis-news-desk'), attentionCount);

  return <div className="vnd-dashboard-grid">
    <Card title={__('In progress', 'veridis-news-desk')} action={<Badge>{storyCountLabel}</Badge>}>
      {data.stories.length ? <ul className="vnd-list">{data.stories.map(story => {
        const categories = story.categories.length ? story.categories.join(', ') : __('Uncategorized', 'veridis-news-desk');
        const people = storyPeopleLabels(story);
        /* translators: %s: scheduled local date and time. */
        const scheduledFormat = __('Scheduled: %s', 'veridis-news-desk');
        /* translators: %s: last modified local date and time. */
        const updatedFormat = __('Updated: %s', 'veridis-news-desk');
        const date = story.scheduledLabel
          ? sprintf(scheduledFormat, story.scheduledLabel)
          : sprintf(updatedFormat, story.modifiedLabel);
        /* translators: %d: number of Article Health issues. */
        const issues = sprintf(_n('%d issue', '%d issues', story.healthIssueCount, 'veridis-news-desk'), story.healthIssueCount);

        return <li key={story.id} className="vnd-story">
          <button type="button" className="vnd-story-button" onClick={() => onOpenArticle(story.id)}>
            <span className="vnd-avatar" aria-hidden="true" title={story.assignedName || story.authorName}>
              {story.assignedInitials || story.authorInitials}
            </span>
            <span className="vnd-story-copy">
              <h4>{story.title}</h4>
              <p className="vnd-dashboard-story-meta">
                <span>{categories}</span>
                <span aria-hidden="true">·</span>
                <span>{people.author}</span>
                {people.assignee && <><span aria-hidden="true">·</span><span>{people.assignee}</span></>}
                <span aria-hidden="true">·</span>
                <span>{date}</span>
              </p>
            </span>
            <span className="vnd-story-badges">
              {story.priority === 'urgent' && <Badge tone="error">{story.priorityLabel}</Badge>}
              {story.priority === 'high' && <Badge tone="warning">{story.priorityLabel}</Badge>}
              {story.deadlineLabel && (
                <span className={`vnd-deadline-pill ${story.isOverdue ? 'vnd-deadline-pill--overdue' : ''}`}>
                  {story.deadlineLabel}
                </span>
              )}
              {story.editorialStatusLabel ? (
                <Badge tone={story.editorialStatusTone || 'neutral'}>{story.editorialStatusLabel}</Badge>
              ) : (
                <Badge tone={story.tone}>{story.statusLabel}</Badge>
              )}
              {story.healthIssueCount > 0 && <Badge tone="warning">{issues}</Badge>}
            </span>
          </button>
        </li>;
      })}</ul> : data.totalStories === 0 ? (
        <EmptyState
          compact
          title={__('Your newsroom is ready', 'veridis-news-desk')}
          description={__('Start by creating a story, assigning it, and setting its editorial status.', 'veridis-news-desk')}
          action={onOpenNewsroom ? (
            <VeridisButton onClick={() => onOpenNewsroom({})}>
              {__('Create your first story', 'veridis-news-desk')}
            </VeridisButton>
          ) : undefined}
        />
      ) : <EmptyState compact title={__('A clear desk', 'veridis-news-desk')} description={__('No stories in progress.', 'veridis-news-desk')} />}
    </Card>
    <Card id="vnd-attention-panel" tabIndex={-1} title={__('Needs attention', 'veridis-news-desk')} action={<Badge tone={attentionCount ? 'warning' : 'success'}>{attentionCountLabel}</Badge>}>
      {attentionCount ? (
        <ul className="vnd-list">
          {data.health.items.filter(item => item.count > 0).map(item => {
            const filterValue = healthFilterMap[item.id] || 'has_issues';
            const filters: Record<string, string | number> = item.id === 'overdue_deadlines'
              ? { deadline_state: 'overdue' }
              : { health: filterValue, status: 'active' };
            return (
              <li key={item.id} className="vnd-health-item">
                {onOpenNewsroom ? (
                  <button
                    type="button"
                    className="vnd-health-item-button"
                    onClick={() => onOpenNewsroom(filters)}
                    aria-label={sprintf(
                      /* translators: 1: issue label, 2: issue detail. */
                      __('%1$s: %2$s. View in Newsroom', 'veridis-news-desk'),
                      item.label,
                      item.detail
                    )}
                  >
                    <span className="vnd-health-icon" aria-hidden="true">!</span>
                    <span className="vnd-health-copy">
                      <h4>{item.label}</h4>
                      <p>{item.detail}</p>
                    </span>
                    <Badge tone="warning">{item.count}</Badge>
                  </button>
                ) : (
                  <>
                    <span className="vnd-health-icon" aria-hidden="true">!</span>
                    <div>
                      <h4>{item.label}</h4>
                      <p>{item.detail}</p>
                    </div>
                    <Badge tone="warning">{item.count}</Badge>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact title={__('All clear', 'veridis-news-desk')} description={__('No attention items to show.', 'veridis-news-desk')} />
      )}
    </Card>
    <Card
      id="vnd-deadline-watch-panel"
      tabIndex={-1}
      title={__('Deadline watch', 'veridis-news-desk')}
      action={onOpenNewsroom && (data.deadlineWatch.overdue || data.deadlineWatch.dueToday) ? (
        <span className="vnd-story-badges">
          <span>{__('View all:', 'veridis-news-desk')}</span>
          {data.deadlineWatch.overdue > 0 && <button type="button" className="vnd-action-badge-button" onClick={() => onOpenNewsroom({ status: 'active', deadline_state: 'overdue' })} aria-label={__('View all overdue stories in Newsroom', 'veridis-news-desk')}>
            <Badge tone="error">{__('Overdue', 'veridis-news-desk')} →</Badge>
          </button>}
          {data.deadlineWatch.dueToday > 0 && <button type="button" className="vnd-action-badge-button" onClick={() => onOpenNewsroom({ status: 'active', deadline_state: 'due_today' })} aria-label={__('View all stories due today in Newsroom', 'veridis-news-desk')}>
            <Badge tone="warning">{__('Due today', 'veridis-news-desk')} →</Badge>
          </button>}
        </span>
      ) : <Badge tone="success">0</Badge>}
    >
      {data.deadlineWatch.items.length ? <ul className="vnd-list">{data.deadlineWatch.items.map(story => (
        <li key={story.id} className="vnd-story">
          <button type="button" className="vnd-story-button" onClick={() => onOpenArticle(story.id)}>
            <span className="vnd-story-copy">
              <h4>{story.title}</h4>
              <p>{assignedLabel(story)}</p>
            </span>
            <span className="vnd-story-badges">
              {story.priority === 'urgent' && <Badge tone="error">{story.priorityLabel}</Badge>}
              {story.priority === 'high' && <Badge tone="warning">{story.priorityLabel}</Badge>}
              <span className={`vnd-deadline-pill ${story.isOverdue ? 'vnd-deadline-pill--overdue' : ''}`}>
                {story.deadlineLabel}
              </span>
            </span>
          </button>
        </li>
      ))}</ul> : <EmptyState compact title={__('No deadline risks today', 'veridis-news-desk')} description={__('No overdue stories or stories due today.', 'veridis-news-desk')} />}
    </Card>
    <Card
      title={__('Follow-ups', 'veridis-news-desk')}
      action={
        onOpenFollowUps && data.followups?.summary?.totalOpen > 0 ? (
          <button
            type="button"
            className="vnd-action-badge-button"
            onClick={onOpenFollowUps}
            aria-label={sprintf(
              /* translators: %d: number of open follow-ups */
              __('%d open follow-ups. View all', 'veridis-news-desk'),
              data.followups.summary.totalOpen
            )}
          >
            <Badge tone={data.followups.summary.overdue > 0 ? 'error' : 'neutral'}>
              {data.followups.summary.totalOpen} {__('open', 'veridis-news-desk')} →
            </Badge>
          </button>
        ) : (
          <Badge>{data.followups?.summary?.totalOpen || 0} {__('open', 'veridis-news-desk')}</Badge>
        )
      }
    >
      {data.followups?.items?.length ? (
        <ul className="vnd-list">
          {data.followups.items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                className="vnd-story-button"
                onClick={() => onOpenArticle(item.postId)}
              >
                <span className="vnd-story-copy">
                  <h4>{item.title}</h4>
                  <p>{item.articleTitle} · {item.assignedName}</p>
                </span>
                <span className="vnd-story-badges">
                  <FollowUpBadge dueState={item.dueState} label={item.dueLabel} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          compact
          title={__('No pending follow-ups', 'veridis-news-desk')}
          description={__('All callbacks and story tasks are complete.', 'veridis-news-desk')}
        />
      )}
    </Card>
  </div>;
}
