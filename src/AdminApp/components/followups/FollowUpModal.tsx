import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { __, _x } from '@wordpress/i18n';
import type { FollowUpItem, FollowUpStatus } from '../../types';
import { VeridisModal } from '../../design-system/VeridisModal';
import { VeridisButton } from '../../design-system/VeridisButton';
import { VeridisBadge } from '../../design-system/VeridisBadge';
import { CategoryBadge } from '../../design-system/CategoryBadge';
import { useNewsroomOptions } from '../../hooks/useNewsroomOptions';
import { useCreateFollowUp } from '../../hooks/useCreateFollowUp';
import { useUpdateFollowUp } from '../../hooks/useUpdateFollowUp';
import { useToast } from '../../design-system/VeridisToast';
import { SearchResultSkeleton } from '../../design-system/VeridisSkeleton';
import { searchBreaking } from '../../api/breaking';
import { DateTimePicker } from '../DateTimePicker';

interface FollowUpModalProps {
  open: boolean;
  onClose: () => void;
  followUp?: FollowUpItem | null;
  initialPostId?: number;
  initialArticleTitle?: string;
  initialAssignedTo?: number;
  onSaved?: (item: FollowUpItem) => void;
}

export function FollowUpModal({
  open,
  onClose,
  followUp,
  initialPostId,
  initialArticleTitle,
  initialAssignedTo,
  onSaved,
}: FollowUpModalProps) {
  const isEditing = Boolean(followUp);
  const optionsQuery = useNewsroomOptions();
  const authors = optionsQuery.data?.authors || [];
  const toast = useToast();

  const [selectedArticle, setSelectedArticle] = useState<{ id: number; title: string } | null>(() => {
    if (followUp) {
      return { id: followUp.postId, title: followUp.articleTitle };
    }
    if (initialPostId) {
      return { id: initialPostId, title: initialArticleTitle || '' };
    }
    return null;
  });

  const [title, setTitle] = useState(followUp ? followUp.title : '');
  const [notes, setNotes] = useState(followUp ? followUp.notes : '');
  const [assignedTo, setAssignedTo] = useState<number>(() => {
    if (followUp) return followUp.assignedTo;
    if (typeof initialAssignedTo === 'number') return initialAssignedTo;
    return 0;
  });
  const [dueAtLocal, setDueAtLocal] = useState(followUp?.dueAtLocal || '');
  const [status, setStatus] = useState<FollowUpStatus>(followUp?.status || 'open');
  const [titleError, setTitleError] = useState<string | null>(null);

  // Article search state when creating without initialPostId
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const searchQuery = useQuery({
    queryKey: ['veridis-news', 'followup-article-search', debouncedSearch],
    queryFn: ({ signal }) => searchBreaking(debouncedSearch, signal),
    enabled: !selectedArticle && open,
    placeholderData: keepPreviousData,
  });
  const isSearching = (search !== debouncedSearch) || (searchQuery.isFetching && !searchQuery.isPending);

  const createMutation = useCreateFollowUp(selectedArticle?.id || 0);
  const updateMutation = useUpdateFollowUp();
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(__('Title is required.', 'veridis-news-desk'));
      return;
    }
    if (title.length > 190) {
      setTitleError(__('Title cannot exceed 190 characters.', 'veridis-news-desk'));
      return;
    }
    setTitleError(null);

    if (!selectedArticle?.id) {
      toast(__('Please select an article first.', 'veridis-news-desk'), 'warning');
      return;
    }

    try {
      if (isEditing && followUp) {
        const updated = await updateMutation.mutateAsync({
          id: followUp.id,
          input: {
            title: title.trim(),
            notes: notes.trim(),
            assignedTo,
            dueAt: dueAtLocal || null,
            status,
          },
        });
        toast(__('Follow-up updated.', 'veridis-news-desk'), 'success');
        onSaved?.(updated);
        onClose();
      } else {
        const created = await createMutation.mutateAsync({
          title: title.trim(),
          notes: notes.trim() || undefined,
          assignedTo,
          dueAt: dueAtLocal || null,
        });
        toast(__('Follow-up added.', 'veridis-news-desk'), 'success');
        onSaved?.(created);
        onClose();
      }
    } catch (err: any) {
      toast(err?.message || __('Could not save follow-up.', 'veridis-news-desk'), 'error');
    }
  }

  return (
    <VeridisModal
      open={open}
      onClose={onClose}
      title={isEditing ? __('Edit follow-up', 'veridis-news-desk') : __('New follow-up', 'veridis-news-desk')}
      footer={
        !selectedArticle ? (
          <VeridisButton variant="ghost" onClick={onClose}>
            {__('Cancel', 'veridis-news-desk')}
          </VeridisButton>
        ) : (
          <>
            <VeridisButton variant="ghost" type="button" onClick={onClose} disabled={isPending}>
              {__('Cancel', 'veridis-news-desk')}
            </VeridisButton>
            <VeridisButton variant="primary" type="submit" form="vnd-followup-form" disabled={isPending}>
              {isPending
                ? __('Saving…', 'veridis-news-desk')
                : isEditing
                ? __('Save changes', 'veridis-news-desk')
                : __('Add follow-up', 'veridis-news-desk')}
            </VeridisButton>
          </>
        )
      }
    >
      {!selectedArticle ? (
        <div className="vnd-followup-article-picker">
          <div className="vnd-breaking-search-help-row">
            <p className="vnd-field-label">{__('Select article to attach follow-up to:', 'veridis-news-desk')}</p>
            {isSearching && <span className="vnd-searching-badge" role="status">{__('Searching…', 'veridis-news-desk')}</span>}
          </div>
          <label className="vnd-search-field">
            <span className="vnd-sr-only">{__('Search articles by title', 'veridis-news-desk')}</span>
            <span className="vnd-search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.75" stroke="currentColor" strokeWidth="1.8" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <input
              autoFocus
              type="search"
              value={search}
              maxLength={200}
              onChange={e => setSearch(e.target.value)}
              placeholder={__('Search article titles…', 'veridis-news-desk')}
            />
            {isSearching && (
              <span className="vnd-search-spinner" aria-label={__('Searching…', 'veridis-news-desk')} title={__('Searching…', 'veridis-news-desk')}>
                <svg className="vnd-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
            )}
          </label>

          <div className="vnd-picker-results-pane">
            {searchQuery.isPending && (
              <div aria-busy="true" aria-label={__('Searching articles', 'veridis-news-desk')} className="vnd-picker-results-state">
                <span className="vnd-sr-only" role="status">{__('Searching…', 'veridis-news-desk')}</span>
                <ul className="vnd-breaking-results" aria-hidden="true">
                  {Array.from({ length: 3 }, (_, index) => (
                    <SearchResultSkeleton key={index} />
                  ))}
                </ul>
              </div>
            )}
            {searchQuery.isError && (
              <div className="vnd-picker-empty-state">
                <p role="alert" className="vnd-breaking-no-results">{searchQuery.error.message}</p>
              </div>
            )}

            {!searchQuery.isPending && searchQuery.data?.items && searchQuery.data.items.length > 0 && (
              <ul className="vnd-breaking-results" style={{ opacity: isSearching ? 0.75 : 1, transition: 'opacity 0.15s ease' }}>
                {searchQuery.data.items.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArticle({ id: item.id, title: item.title });
                        if (item.isUnassigned) {
                          setAssignedTo(0);
                        } else if (item.assignedTo && item.assignedTo > 0) {
                          setAssignedTo(item.assignedTo);
                        }
                      }}
                    >
                      <span className="vnd-breaking-result-copy">
                        <strong>{item.title}</strong>
                        <span className="vnd-breaking-article-meta">
                          <VeridisBadge tone={item.wpStatusTone || item.tone}>{item.statusLabel}</VeridisBadge>
                          <CategoryBadge category={item.primaryCategory} />
                        </span>
                      </span>
                      <span className="vnd-breaking-result-arrow" aria-hidden="true">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!searchQuery.isPending && searchQuery.data?.items && searchQuery.data.items.length === 0 && (
              <div className="vnd-picker-empty-state">
                <p className="vnd-breaking-no-results">{__('No matching articles found.', 'veridis-news-desk')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form id="vnd-followup-form" onSubmit={handleSubmit} className="vnd-followup-form">
          <div className="vnd-followup-attached-story">
            <div>
              <span className="vnd-field-label">{__('Story', 'veridis-news-desk')}</span>
              <strong>{selectedArticle.title}</strong>
            </div>
            {!isEditing && !initialPostId && (
              <VeridisButton
                variant="ghost"
                type="button"
                onClick={() => setSelectedArticle(null)}
              >
                {__('Change', 'veridis-news-desk')}
              </VeridisButton>
            )}
          </div>

          <label className="vnd-form-field">
            <span>{__('Task / Title', 'veridis-news-desk')} *</span>
            <input
              type="text"
              required
              maxLength={190}
              autoFocus
              value={title}
              onChange={e => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder={__('e.g. Call city hall tomorrow for the official response', 'veridis-news-desk')}
              disabled={isPending}
            />
            {titleError && <p className="vnd-form-error">{titleError}</p>}
          </label>

          <div className="vnd-editorial-grid">
            <label className="vnd-form-field">
              <span>{__('Assignee', 'veridis-news-desk')}</span>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(Number(e.target.value))}
                disabled={isPending}
              >
                <option value={0}>{__('Unassigned', 'veridis-news-desk')}</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>
                    {author.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="vnd-form-field">
              <span className="vnd-field-label">{__('Due at', 'veridis-news-desk')}</span>
              <DateTimePicker
                value={dueAtLocal}
                onChange={setDueAtLocal}
                disabled={isPending}
                ariaLabel={__('Due at', 'veridis-news-desk')}
              />
            </div>
          </div>

          {isEditing && (
            <label className="vnd-form-field">
              <span>{__('Status', 'veridis-news-desk')}</span>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as FollowUpStatus)}
                disabled={isPending}
              >
                <option value="open">{__('Open', 'veridis-news-desk')}</option>
                <option value="done">{_x('Completed', 'single follow-up status', 'veridis-news-desk')}</option>
                <option value="cancelled">{_x('Cancelled', 'single follow-up status', 'veridis-news-desk')}</option>
              </select>
            </label>
          )}

          <label className="vnd-form-field">
            <span>{__('Notes / Context', 'veridis-news-desk')}</span>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={__('Optional notes, phone numbers, background context…', 'veridis-news-desk')}
              disabled={isPending}
            />
          </label>
        </form>
      )}
    </VeridisModal>
  );
}
