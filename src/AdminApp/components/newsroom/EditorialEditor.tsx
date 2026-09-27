import { useCallback, useEffect, useLayoutEffect, useMemo, useState, type FormEvent } from 'react';
import { __ } from '@wordpress/i18n';
import type { ArticleDetail, EditorialStatus, Priority, StructuredSource, TermOption } from '../../types';
import { useUpdateEditorial } from '../../hooks/useUpdateEditorial';
import { useToast } from '../../design-system/VeridisToast';
import { VeridisButton } from '../../design-system/VeridisButton';
import { DateTimePicker } from '../DateTimePicker';
import { SourcesEditor } from './SourcesEditor';
import type { EditorialSaveResult } from './drawerExit';

export function EditorialEditor({
  article,
  assignees,
  focusSection,
  onDone,
  onDirtyChange,
  onSaveReady,
}: {
  article: ArticleDetail;
  assignees: TermOption[];
  focusSection?: 'sources' | null;
  onDone: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSaveReady: (save: (() => Promise<EditorialSaveResult>) | null) => void;
}) {
  const [editorialStatus, setEditorialStatus] = useState<EditorialStatus>(article.editorialStatus || 'writing');
  const [assignedTo, setAssignedTo] = useState<number>(article.assignedTo || 0);
  const [priority, setPriority] = useState<Priority>(article.priority || 'normal');
  const [deadline, setDeadline] = useState<string>(article.deadlineLocal || '');
  const [internalNotes, setInternalNotes] = useState<string>(article.internalNotes || '');
  const [sources, setSources] = useState<StructuredSource[]>(() => {
    if (focusSection === 'sources' && (!article.sources || article.sources.length === 0)) {
      return [{ id: `src-${Date.now()}`, name: '', status: 'unverified' }];
    }
    return article.sources || [];
  });

  useEffect(() => {
    if (focusSection === 'sources') {
      const timer = window.setTimeout(() => {
        const el = document.getElementById('vnd-sources-editor');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const input = el.querySelector<HTMLInputElement | HTMLButtonElement>('input.vnd-source-name-input, button');
          input?.focus({ preventScroll: true });
        }
      }, 50);
      return () => window.clearTimeout(timer);
    }
  }, [focusSection]);

  const mutation = useUpdateEditorial(article.id);
  const toast = useToast();

  const isDirty = useMemo(() => {
    const initialStatus = article.editorialStatus || 'writing';
    const initialAssigned = article.assignedTo || 0;
    const initialPriority = article.priority || 'normal';
    const initialDeadline = article.deadlineLocal || '';
    const initialNotes = article.internalNotes || '';
    const initialSources = article.sources || [];

    if (editorialStatus !== initialStatus) return true;
    if (assignedTo !== initialAssigned) return true;
    if (priority !== initialPriority) return true;
    if ((deadline || '') !== (initialDeadline || '')) return true;
    if (internalNotes !== initialNotes) return true;

    if (sources.length !== initialSources.length) return true;
    for (let i = 0; i < sources.length; i++) {
      if (
        sources[i].name !== (initialSources[i]?.name || '') ||
        sources[i].status !== (initialSources[i]?.status || 'unverified')
      ) {
        return true;
      }
    }
    return false;
  }, [article, editorialStatus, assignedTo, priority, deadline, internalNotes, sources]);

  useLayoutEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const saveEditorial = useCallback(async (): Promise<EditorialSaveResult> => {
    if (editorialStatus !== 'idea' && !assignedTo) {
      return { ok: false, error: __('Choose an assignee for Writing, Review, or Ready to publish.', 'veridis-news-desk') };
    }
    try {
      await mutation.mutateAsync({
        editorialStatus,
        assignedTo,
        priority,
        deadline: deadline || null,
        internalNotes,
        sources,
      });
      toast(__('Editorial details updated.', 'veridis-news-desk'), 'success');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : __('Could not save editorial details.', 'veridis-news-desk') };
    }
  }, [editorialStatus, assignedTo, priority, deadline, internalNotes, sources, mutation, toast]);

  useLayoutEffect(() => {
    onSaveReady(saveEditorial);
    return () => onSaveReady(null);
  }, [onSaveReady, saveEditorial]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isDirty) return;
    const result = await saveEditorial();
    if (result.ok) onDone();
  }

  const missingAssignee = editorialStatus !== 'idea' && !assignedTo;

  return (
    <section className="vnd-drawer-section vnd-editorial-editor-section" aria-labelledby="vnd-editorial-edit-title">
      <div className="vnd-editorial-header">
        <h3 id="vnd-editorial-edit-title">{__('Edit editorial details', 'veridis-news-desk')}</h3>
      </div>

      <form id="vnd-editorial-form" className="vnd-editorial-form" onSubmit={handleSubmit}>
        <div className="vnd-form-grid">
          <label className="vnd-form-field">
            <span>{__('Editorial status', 'veridis-news-desk')}</span>
            <select
              value={editorialStatus}
              onChange={e => setEditorialStatus(e.target.value as EditorialStatus)}
              disabled={mutation.isPending}
            >
              <option value="idea">{__('Idea', 'veridis-news-desk')}</option>
              <option value="writing">{__('Writing', 'veridis-news-desk')}</option>
              <option value="review">{__('Review', 'veridis-news-desk')}</option>
              <option value="ready">{__('Ready to publish', 'veridis-news-desk')}</option>
            </select>
          </label>

          <label className="vnd-form-field">
            <span>{__('Assigned to', 'veridis-news-desk')}</span>
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(Number(e.target.value))}
              disabled={mutation.isPending}
            >
              <option value={0}>{__('Unassigned', 'veridis-news-desk')}</option>
              {assignees.map(author => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
          </label>

          <label className="vnd-form-field">
            <span>{__('Priority', 'veridis-news-desk')}</span>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
              disabled={mutation.isPending}
            >
              <option value="low">{__('Low', 'veridis-news-desk')}</option>
              <option value="normal">{__('Normal', 'veridis-news-desk')}</option>
              <option value="high">{__('High', 'veridis-news-desk')}</option>
              <option value="urgent">{__('Urgent', 'veridis-news-desk')}</option>
            </select>
          </label>

          <div className="vnd-form-field">
            <span className="vnd-field-label">{__('Deadline', 'veridis-news-desk')}</span>
            <DateTimePicker
              value={deadline}
              onChange={setDeadline}
              disabled={mutation.isPending}
              ariaLabel={__('Deadline', 'veridis-news-desk')}
            />
          </div>
        </div>

        {missingAssignee && <p className="vnd-form-error" role="alert">{__('Choose an assignee for Writing, Review, or Ready to publish.', 'veridis-news-desk')}</p>}

        <div id="vnd-sources-editor" className="vnd-form-field">
          <span className="vnd-field-label">{__('Sources', 'veridis-news-desk')}</span>
          <SourcesEditor sources={sources} onChange={setSources} />
        </div>

        <label className="vnd-form-field">
          <span>{__('Internal notes', 'veridis-news-desk')}</span>
          <textarea
            rows={2}
            value={internalNotes}
            onChange={e => setInternalNotes(e.target.value)}
            placeholder={__('Private newsroom notes, contact details, or story instructions…', 'veridis-news-desk')}
            disabled={mutation.isPending}
          />
        </label>

        {mutation.isError && (
          <p className="vnd-form-error" role="alert">
            {mutation.error.message}
          </p>
        )}

        <div className="vnd-editorial-form-actions">
          {isDirty ? (
            <span className="vnd-unsaved-indicator" aria-live="polite">
              <span className="vnd-unsaved-dot" aria-hidden="true" />
              {__('Unsaved changes', 'veridis-news-desk')}
            </span>
          ) : <span />}
          <div className="vnd-editorial-actions-group">
            <VeridisButton variant="ghost" type="button" onClick={onDone} disabled={mutation.isPending}>
              {__('Cancel', 'veridis-news-desk')}
            </VeridisButton>
            <VeridisButton type="submit" disabled={mutation.isPending || !isDirty || missingAssignee}>
              {mutation.isPending ? __('Saving…', 'veridis-news-desk') : __('Save changes', 'veridis-news-desk')}
            </VeridisButton>
          </div>
        </div>
      </form>
    </section>
  );
}
