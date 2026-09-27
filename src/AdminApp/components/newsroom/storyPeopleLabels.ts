import { __, sprintf } from '@wordpress/i18n';

interface StoryPeople {
  authorId: number;
  authorName: string;
  assignedTo?: number;
  assignedName?: string;
  isUnassigned?: boolean;
}

export function assignedLabel(story: StoryPeople): string {
  return sprintf(
    /* translators: %s: current assignee name or Unassigned. */
    __('Assigned: %s', 'veridis-news-desk'),
    story.isUnassigned || !story.assignedTo
      ? __('Unassigned', 'veridis-news-desk')
      : story.assignedName || __('Unassigned', 'veridis-news-desk'),
  );
}

export function storyPeopleLabels(story: StoryPeople): { author: string; assignee: string | null } {
  const samePerson = !story.isUnassigned && Boolean(story.assignedTo) && story.assignedTo === story.authorId;
  const author = samePerson
    ? sprintf(
      /* translators: %s: person who is both public author and current assignee. */
      __('Author & assignee: %s', 'veridis-news-desk'),
      story.authorName,
    )
    : sprintf(
      /* translators: %s: public WordPress author name. */
      __('Author: %s', 'veridis-news-desk'),
      story.authorName,
    );

  return { author, assignee: samePerson ? null : assignedLabel(story) };
}
