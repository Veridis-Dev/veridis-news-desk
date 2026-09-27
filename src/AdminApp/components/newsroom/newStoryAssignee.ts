import type { EditorialStatus } from '../../types';

export type NewStoryAssignee = number | null;

export const initialNewStoryAssignee: NewStoryAssignee = null;

export function assigneeForStatus(status: EditorialStatus, assignee: NewStoryAssignee): NewStoryAssignee {
  return status !== 'idea' && assignee === 0 ? null : assignee;
}

export function hasExplicitValidAssignee(status: EditorialStatus, assignee: NewStoryAssignee): assignee is number {
  return assignee !== null && (assignee > 0 || (status === 'idea' && assignee === 0));
}
