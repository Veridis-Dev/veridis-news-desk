import { VeridisBadge } from '../../design-system/VeridisBadge';
import type { Tone } from '../../types';

interface FollowUpBadgeProps {
  dueState: 'overdue' | 'due_today' | 'upcoming' | 'no_deadline' | 'done' | 'cancelled';
  label: string;
}

export function FollowUpBadge({ dueState, label }: FollowUpBadgeProps) {
  let tone: Tone = 'neutral';
  if (dueState === 'overdue') {
    tone = 'error';
  } else if (dueState === 'due_today') {
    tone = 'warning';
  } else if (dueState === 'upcoming') {
    tone = 'info';
  } else if (dueState === 'done') {
    tone = 'success';
  }

  return <VeridisBadge tone={tone}>{label}</VeridisBadge>;
}
