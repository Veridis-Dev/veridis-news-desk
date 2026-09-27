import { __, _n, sprintf } from '@wordpress/i18n';
import type { NewsroomItem } from '../../types';
import { VeridisBadge } from '../../design-system/VeridisBadge';
import { CategoryBadge } from '../../design-system/CategoryBadge';
import { storyPeopleLabels } from './storyPeopleLabels';

export function NewsroomRow({ item, onOpen }: { item: NewsroomItem; onOpen: (id: number) => void }) {
  /* translators: %d: number of additional categories. */
  const more = item.additionalCategoryCount ? sprintf(__('+%d', 'veridis-news-desk'), item.additionalCategoryCount) : '';
	/* translators: %s: scheduled local date and time. */
	const scheduledFormat = __('Scheduled: %s', 'veridis-news-desk');
	/* translators: %s: published local date and time. */
	const publishedFormat = __('Published: %s', 'veridis-news-desk');
	/* translators: %s: last modified local date and time. */
	const updatedFormat = __('Updated: %s', 'veridis-news-desk');
  const date = item.dateKind === 'scheduled'
    ? sprintf(scheduledFormat, item.dateLabel)
    : item.dateKind === 'published'
      ? sprintf(publishedFormat, item.dateLabel)
      : sprintf(updatedFormat, item.dateLabel);
  /* translators: %d: number of Article Health issues. */
  const issues = sprintf(_n('%d issue', '%d issues', item.healthIssueCount, 'veridis-news-desk'), item.healthIssueCount);
	/* translators: %s: article title. */
	const openLabel = sprintf(__('Open article: %s', 'veridis-news-desk'), item.title);
  const people = storyPeopleLabels(item);

  return <li className="vnd-newsroom-row">
    <button type="button" data-article-id={item.id} onClick={() => onOpen(item.id)} aria-label={openLabel}>
      <span className="vnd-avatar" aria-hidden="true" title={item.authorName}>{item.authorInitials}</span>
      <span className="vnd-newsroom-story">
        <strong>{item.title}</strong>
        <span className="vnd-newsroom-meta-line">
          <span className="vnd-newsroom-category-group">
            <CategoryBadge category={item.primaryCategory} />
            {more && <span className="vnd-category-more">{more}</span>}
          </span>
          <span aria-hidden="true">·</span>
          <span>{people.author}</span>
          {people.assignee && (
            <>
              <span aria-hidden="true">·</span>
              <span className="vnd-assignee-text">{people.assignee}</span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>{date}</span>
        </span>
      </span>
      <span className="vnd-newsroom-badges">
        {item.priority === 'urgent' && (
          <VeridisBadge tone="error">{item.priorityLabel}</VeridisBadge>
        )}
        {item.priority === 'high' && (
          <VeridisBadge tone="warning">{item.priorityLabel}</VeridisBadge>
        )}
        {item.deadlineLabel && (
          <span className={`vnd-deadline-pill ${item.isOverdue ? 'vnd-deadline-pill--overdue' : ''}`}>
            {item.deadlineLabel}
          </span>
        )}
        {item.followUps && item.followUps.count > 0 && (
          <VeridisBadge tone={item.followUps.overdueCount > 0 ? 'error' : 'neutral'}>
            {item.followUps.overdueCount > 0
              ? sprintf(
                  /* translators: %d: count of overdue follow-up tasks */
                  _n('%d overdue follow-up', '%d overdue follow-ups', item.followUps.overdueCount, 'veridis-news-desk'),
                  item.followUps.overdueCount
                )
              : sprintf(
                  /* translators: %d: count of open follow-up tasks */
                  _n('%d follow-up', '%d follow-ups', item.followUps.count, 'veridis-news-desk'),
                  item.followUps.count
                )}
          </VeridisBadge>
        )}
        <VeridisBadge tone={item.editorialStatusTone}>{item.editorialStatusLabel}</VeridisBadge>
        {item.complete ? (
          <span className="vnd-complete">✓ {__('Complete', 'veridis-news-desk')}</span>
        ) : (
          <VeridisBadge tone="warning">{issues}</VeridisBadge>
        )}
      </span>
    </button>
  </li>;
}
