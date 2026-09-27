export interface VeridisEditorConfig {
  postId: number;
  restUrl: string;
  nonce: string;
  adminUrl: string;
  returnUrl: string;
  version: string;
  canEditEditorial?: boolean;
}

export type EditorialStatusValue = 'idea' | 'writing' | 'review' | 'ready';
export type PriorityValue = 'urgent' | 'high' | 'normal' | 'low';

export interface AssigneeOption {
  id: number;
  name: string;
}

export interface EditorialArticleData {
  id: number;
  title: string;
  editorialStatus: string;
  editorialStatusLabel: string;
  editorialStatusTone: string;
  assignedTo: number;
  assignedName: string;
  isUnassigned?: boolean;
  deadline: string | null;
  deadlineLocal: string | null;
  deadlineLabel: string | null;
  isOverdue: boolean;
  priority: string;
  priorityLabel: string;
  priorityTone: string;
}

export interface UpdateEditorialPayload {
  editorialStatus?: string;
  assignedTo?: number;
  deadline?: string | null;
  priority?: string;
}

declare global {
  interface Window {
    veridisEditorMode?: VeridisEditorConfig;
    wp?: any;
  }
}
