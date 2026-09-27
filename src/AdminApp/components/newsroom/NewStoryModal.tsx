import { useEffect, useState, type FormEvent } from 'react';
import { __ } from '@wordpress/i18n';
import type { EditorialStatus, Priority, TermOption } from '../../types';
import { useCreateArticle } from '../../hooks/useCreateArticle';
import { useToast } from '../../design-system/VeridisToast';
import { VeridisModal } from '../../design-system/VeridisModal';
import { VeridisButton } from '../../design-system/VeridisButton';
import { DateTimePicker } from '../DateTimePicker';
import { assigneeForStatus, hasExplicitValidAssignee, initialNewStoryAssignee, type NewStoryAssignee } from './newStoryAssignee';

export function NewStoryModal({
  open,
  assignees,
  categories,
  onClose,
  onCreated,
  context = 'newsroom',
}: {
  open: boolean;
  assignees: TermOption[];
  categories: TermOption[];
  onClose: () => void;
  onCreated: (id: number, editorialStatus: EditorialStatus) => void;
  context?: 'newsroom' | 'breaking';
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(0);
  const [editorialStatus, setEditorialStatus] = useState<EditorialStatus>('writing');
  const [assignedTo, setAssignedTo] = useState<NewStoryAssignee>(initialNewStoryAssignee);
  const [showAssigneeValidation, setShowAssigneeValidation] = useState(false);
  const [priority, setPriority] = useState<Priority>('normal');
  const [deadline, setDeadline] = useState('');

  const mutation = useCreateArticle();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setTitle('');
    setCategory(categories[0]?.id ?? 0);
    setEditorialStatus('writing');
    setAssignedTo(initialNewStoryAssignee);
    setShowAssigneeValidation(false);
    setPriority('normal');
    setDeadline('');
    mutation.reset();
  // Reset only when the modal is opened; option lists remain stable during the form interaction.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function create(intent: 'draft' | 'edit') {
    if (!hasExplicitValidAssignee(editorialStatus, assignedTo)) {
      setShowAssigneeValidation(true);
      return;
    }
    try {
      const article = await mutation.mutateAsync({
        title,
        category,
        editorialStatus,
        assignedTo,
        priority,
        deadline: deadline || undefined,
      });
      toast(__('Draft created.', 'veridis-news-desk'), 'success');
      onClose();
      if (intent === 'edit' && article.editUrl) {
        window.location.assign(article.editUrl);
      } else {
        onCreated(article.id, article.editorialStatus);
      }
    } catch {
      /* The mutation error is rendered inside the modal. */
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void create(context === 'breaking' ? 'edit' : 'draft');
  }

  const missingAssignee = !hasExplicitValidAssignee(editorialStatus, assignedTo);
  const unavailable = mutation.isPending || !title.trim() || !category || missingAssignee;

  return (
    <VeridisModal
      open={open}
      onClose={onClose}
      title={__('New story', 'veridis-news-desk')}
      footer={
        <>
          <VeridisButton variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            {__('Cancel', 'veridis-news-desk')}
          </VeridisButton>
          {context === 'breaking' && (
            <VeridisButton
              variant="secondary"
              onClick={() => void create('draft')}
              disabled={unavailable}
            >
              {mutation.isPending ? __('Creating…', 'veridis-news-desk') : __('Create draft', 'veridis-news-desk')}
            </VeridisButton>
          )}
          <VeridisButton
            type="submit"
            form="vnd-new-story"
            disabled={unavailable}
          >
            {mutation.isPending
              ? __('Creating…', 'veridis-news-desk')
              : context === 'breaking'
                ? __('Create & edit article', 'veridis-news-desk')
                : __('Create draft', 'veridis-news-desk')}
          </VeridisButton>
        </>
      }
    >
      <form id="vnd-new-story" className="vnd-story-form" onSubmit={submit}>
        {context === 'breaking' && (
          <p className="vnd-story-form-context">
            {__('Create the draft here, then continue writing in the WordPress editor. Breaking coverage stays inactive until you promote the article.', 'veridis-news-desk')}
          </p>
        )}
        <label>
          <span>{__('Working title', 'veridis-news-desk')}</span>
          <input
            autoFocus
            required
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder={__('e.g. City Hall announces new traffic measures...', 'veridis-news-desk')}
          />
        </label>

        <label>
          <span>{__('Category', 'veridis-news-desk')}</span>
          <select required value={category} onChange={event => setCategory(Number(event.target.value))}>
            {categories.map(item => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="vnd-form-row">
          <label>
            <span>{__('Editorial status', 'veridis-news-desk')}</span>
            <select
              value={editorialStatus}
              onChange={event => {
                const nextStatus = event.target.value as EditorialStatus;
                const nextAssignee = assigneeForStatus(nextStatus, assignedTo);
                setEditorialStatus(nextStatus);
                setAssignedTo(nextAssignee);
                if (nextStatus !== 'idea' && !hasExplicitValidAssignee(nextStatus, nextAssignee)) {
                  setShowAssigneeValidation(true);
                }
              }}
            >
              <option value="idea">{__('Idea', 'veridis-news-desk')}</option>
              <option value="writing">{__('Writing', 'veridis-news-desk')}</option>
              <option value="review">{__('Review', 'veridis-news-desk')}</option>
              <option value="ready">{__('Ready to publish', 'veridis-news-desk')}</option>
            </select>
          </label>

          <label>
            <span>{__('Assigned to', 'veridis-news-desk')}</span>
            <select
              required
              value={assignedTo === null ? '' : String(assignedTo)}
              onBlur={() => setShowAssigneeValidation(true)}
              onChange={event => {
                setShowAssigneeValidation(true);
                setAssignedTo(Number(event.target.value));
              }}
            >
              <option value="" disabled>{__('Choose assignee…', 'veridis-news-desk')}</option>
              {editorialStatus === 'idea' && <option value={0}>{__('Unassigned', 'veridis-news-desk')}</option>}
              {assignees.map(item => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="vnd-text-muted vnd-text-sm">{__('The first assignee becomes the public author. Later reassignment keeps that author.', 'veridis-news-desk')}</p>

        {missingAssignee && showAssigneeValidation && <p className="vnd-form-error" role="alert">{editorialStatus === 'idea'
          ? __('Choose an assignee or Unassigned for this Idea.', 'veridis-news-desk')
          : __('Choose an assignee for Writing, Review, or Ready to publish.', 'veridis-news-desk')}</p>}

        <div className="vnd-form-row">
          <label>
            <span>{__('Priority', 'veridis-news-desk')}</span>
            <select value={priority} onChange={event => setPriority(event.target.value as Priority)}>
              <option value="low">{__('Low', 'veridis-news-desk')}</option>
              <option value="normal">{__('Normal', 'veridis-news-desk')}</option>
              <option value="high">{__('High', 'veridis-news-desk')}</option>
              <option value="urgent">{__('Urgent', 'veridis-news-desk')}</option>
            </select>
          </label>

          <div className="vnd-form-field">
            <span className="vnd-field-label">{__('Deadline (optional)', 'veridis-news-desk')}</span>
            <DateTimePicker
              value={deadline}
              onChange={setDeadline}
              ariaLabel={__('Deadline (optional)', 'veridis-news-desk')}
              placeholder={__('Deadline (optional)', 'veridis-news-desk')}
            />
          </div>
        </div>

        {mutation.isError && <p className="vnd-form-error" role="alert">{mutation.error.message}</p>}
      </form>
    </VeridisModal>
  );
}
