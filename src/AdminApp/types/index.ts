export type Tone = 'neutral' | 'success' | 'info' | 'warning' | 'error';
export interface Stat { id: string; label: string; value: number; note: string; tone: Tone }

export type WordPressPostStatus = 'draft' | 'pending' | 'future' | 'publish';
export type EditorialStatus = 'idea' | 'writing' | 'review' | 'ready';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type SourceStatus = 'confirmed' | 'contacted' | 'waiting' | 'unverified';
export type DeadlineFilter = 'all' | 'overdue' | 'due_today' | 'no_deadline';

export interface StructuredSource {
  id: string;
  name: string;
  status: SourceStatus;
}

export interface Story {
  id: number;
  title: string;
  authorId: number;
  authorName: string;
  authorInitials: string;
  categories: string[];
  status: 'draft' | 'pending' | 'future';
  statusLabel: string;
  tone: Tone;
  editorialStatus?: EditorialStatus;
  editorialStatusLabel?: string;
  editorialStatusTone?: Tone;
  assignedTo?: number;
  assignedName?: string;
  assignedInitials?: string;
  isUnassigned?: boolean;
  deadline?: string | null;
  deadlineLabel?: string | null;
  isOverdue?: boolean;
  priority?: Priority;
  priorityLabel?: string;
  priorityTone?: Tone;
  modifiedAt: string;
  modifiedLabel: string;
  scheduledAt: string | null;
  scheduledLabel: string | null;
  healthIssueCount: number;
}

export interface HealthSummary {
  affectedPosts: number;
  items: { id: string; label: string; detail: string; count: number }[];
}

export type FollowUpStatus = 'open' | 'done' | 'cancelled';
export type FollowUpDueState = 'overdue' | 'due_today' | 'upcoming' | 'no_deadline' | 'done' | 'cancelled';

export interface FollowUpItem {
  id: number;
  postId: number;
  articleTitle: string;
  articleStatus: string;
  title: string;
  notes: string;
  assignedTo: number;
  assignedName: string;
  assignedInitials: string;
  isUnassigned: boolean;
  status: FollowUpStatus;
  statusLabel: string;
  statusTone: Tone;
  dueAt: string | null;
  dueAtLocal: string | null;
  dueLabel: string;
  dueState: FollowUpDueState;
  isOverdue: boolean;
  createdBy: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface FollowUpSummaryCounts {
  overdue: number;
  dueToday: number;
  upcoming: number;
  noDeadline: number;
  totalOpen: number;
  done: number;
  cancelled: number;
}

export interface FollowUpListingData {
  items: FollowUpItem[];
  total: number;
  pages: number;
  page: number;
  counts: FollowUpSummaryCounts;
  overallStories: number;
}

export interface FollowUpFilters {
  status: 'all' | FollowUpStatus;
  due: 'all' | 'overdue' | 'due_today' | 'upcoming' | 'no_deadline';
  assigned_to: number;
  post_id?: number;
  search: string;
  page: number;
  per_page: number;
}

export interface CreateFollowUpInput {
  title: string;
  notes?: string;
  assignedTo?: number;
  dueAt?: string | null;
}

export interface UpdateFollowUpInput {
  title?: string;
  notes?: string;
  assignedTo?: number;
  dueAt?: string | null;
  status?: FollowUpStatus;
}

export interface DashboardData {
  breaking: BreakingData;
  totalStories: number;
  stats: Stat[];
  stories: Story[];
  deadlineWatch: { overdue: number; dueToday: number; items: Story[]; limit: number };
  health: HealthSummary;
  followups: {
    items: FollowUpItem[];
    summary: {
      overdue: number;
      dueToday: number;
      upcoming: number;
      totalOpen: number;
    };
    limit: number;
  };
  features: { breakingActive: boolean; followUpsActive: boolean };
}

export type HealthFilter = 'all' | 'has_issues' | 'complete' | 'missing_featured_image' | 'missing_excerpt' | 'missing_source' | 'missing_photo_credit';
export type NewsroomSort = 'recent' | 'oldest' | 'date_desc' | 'date_asc' | 'title_asc' | 'deadline_soonest' | 'priority';
export type NewsroomLayout = 'list' | 'board';
export interface TermOption { id: number; name: string }

export interface NewsroomFilters {
  search: string;
  status: 'all' | 'active' | WordPressPostStatus;
  editorial_status: 'all' | EditorialStatus;
  assigned_to: number;
  priority: 'all' | Priority;
  deadline_state: DeadlineFilter;
  author: number;
  category: number;
  health: HealthFilter;
  sort: NewsroomSort;
  period: 'all' | 'today';
  page: number;
  per_page: number;
}

export type NewsroomQueryFilters = NewsroomFilters;

export interface BoardColumnData {
  items: NewsroomItem[];
  total: number;
  limit: number;
}

export interface NewsroomBoardData {
  columns: {
    idea: BoardColumnData;
    writing: BoardColumnData;
    review: BoardColumnData;
    ready: BoardColumnData;
  };
  filters: Partial<NewsroomFilters>;
}

export interface NewsroomItem {
  breaking: BreakingMetadata;
  followUps?: {
    count: number;
    overdueCount: number;
  };
  id: number;
  title: string;
  authorId: number;
  authorName: string;
  authorInitials: string;
  categories: TermOption[];
  primaryCategory: TermOption | null;
  additionalCategoryCount: number;
  // WordPress status
  status: WordPressPostStatus;
  statusLabel: string;
  tone: Tone;
  wpStatus?: WordPressPostStatus;
  wpStatusLabel?: string;
  wpStatusTone?: Tone;
  // Editorial Metadata
  editorialStatus: EditorialStatus;
  editorialStatusLabel: string;
  editorialStatusTone: Tone;
  assignedTo: number;
  assignedName: string;
  assignedInitials: string;
  isUnassigned: boolean;
  deadline: string | null;
  deadlineLocal?: string | null;
  deadlineLabel: string | null;
  isOverdue: boolean;
  priority: Priority;
  priorityLabel: string;
  priorityTone: Tone;
  dateKind: 'modified' | 'scheduled' | 'published';
  dateAt: string;
  dateLabel: string;
  healthIssueCount: number;
  complete: boolean;
}

export interface NewsroomOptionsData {
  authors: TermOption[];
  assignees: TermOption[];
  categories: TermOption[];
}

export interface NewsroomData {
  items: NewsroomItem[];
  overallTotal: number;
  pagination: { page: number; perPage: number; totalItems: number; totalPages: number };
  filters: NewsroomFilters;
}

export interface ArticleDetail extends NewsroomItem {
  tags: TermOption[];
  excerpt: string;
  source: string;
  photoCredit: string;
  healthChecks: { id: string; label: string; passed: boolean }[];
  editUrl: string | null;
  viewUrl: string | null;
  internalNotes: string;
  sources: StructuredSource[];
}

export interface CreateArticleInput {
  title: string;
  author?: number;
  category: number;
  editorialStatus?: EditorialStatus;
  assignedTo?: number;
  priority?: Priority;
  deadline?: string;
}

export interface UpdateEditorialInput {
  editorialStatus?: EditorialStatus;
  assignedTo?: number;
  deadline?: string | null;
  priority?: Priority;
  internalNotes?: string;
  sources?: StructuredSource[];
}

export interface UpdateArticleContentInput {
  excerpt?: string;
  photoCredit?: string;
}

export interface AppConfig { restUrl: string; nonce: string; version: string; utmLink?: string }
declare global { interface Window { veridisNewsDesk: AppConfig } }

export interface BreakingMetadata {
  enabled: boolean; active: boolean; expired: boolean;
  label: string; priority: 'standard' | 'high' | 'critical'; homepageLead: boolean;
  startedAt: string | null; startedAtLabel: string | null;
  expiresAt: string | null; expiresAtLocal: string | null; expiresAtLabel: string | null;
  timezone: string;
}
export interface BreakingData { items: NewsroomItem[]; total: number; limit: number }
export interface UpdateBreakingInput {
  active?: boolean; label?: string; priority?: BreakingMetadata['priority'];
  expiresAt?: string | null; expiryPreset?: string; homepageLead?: boolean;
}

export interface SettingsData {
  preserveDataOnUninstall: boolean;
}

export interface UpdateSettingsInput {
  preserveDataOnUninstall?: boolean;
}

export interface SystemInfo {
  pluginVersion: string;
  wordpressVersion: string;
  phpVersion: string;
  databaseSchemaVersion: string | null;
  canonicalModelVersion: string;
}

export interface SettingsResponse {
  settings: SettingsData;
  canManageSettings: boolean;
  system: SystemInfo;
}
