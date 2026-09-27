import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useArticle } from '../../hooks/useArticle';
import { useNewsroomOptions } from '../../hooks/useNewsroomOptions';
import { VeridisButton } from '../../design-system/VeridisButton';
import { VeridisNotice } from '../../design-system/VeridisNotice';
import { VeridisModal } from '../../design-system/VeridisModal';
import { DrawerSectionSkeleton, VeridisSkeleton } from '../../design-system/VeridisSkeleton';
import { EmptyState } from '../../design-system/EmptyState';
import { ArticleHealthSummary } from './ArticleHealthSummary';
import { EditorialSummary } from './EditorialSummary';
import { FollowUpSection } from '../followups/FollowUpSection';
import { EditorialEditor } from './EditorialEditor';
import { requestDrawerExit, saveAndContinue, type DrawerExit, type EditorialSaveResult } from './drawerExit';

export function ArticleDrawer({ articleId, onClose }: { articleId: number | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const query = useArticle(articleId);
  const optionsQuery = useNewsroomOptions();
  const [isEditingEditorial, setIsEditingEditorial] = useState(false);
  const [focusSection, setFocusSection] = useState<'sources' | null>(null);
  const [editorialDirty, setEditorialDirty] = useState(false);
  const [pendingExit, setPendingExit] = useState<DrawerExit | null>(null);
  const [exitError, setExitError] = useState('');
  const [isSavingExit, setIsSavingExit] = useState(false);
  const saveEditorialRef = useRef<(() => Promise<EditorialSaveResult>) | null>(null);

  const registerSave = useCallback((save: (() => Promise<EditorialSaveResult>) | null) => {
    saveEditorialRef.current = save;
  }, []);

  const performExit = useCallback((exit: DrawerExit) => {
    if (exit.kind === 'close') {
      onClose();
      return;
    }
    try {
      sessionStorage.setItem('vnd_editor_return', exit.returnUrl);
    } catch {
      // Session storage may be unavailable; the URL still carries the return path.
    }
    window.location.assign(exit.href);
  }, [onClose]);

  const requestExit = (exit: DrawerExit) => {
    setExitError('');
    requestDrawerExit(editorialDirty, exit, setPendingExit, performExit);
  };

  const stay = () => {
    if (isSavingExit) return;
    setPendingExit(null);
    setExitError('');
  };

  const discardAndContinue = () => {
    if (!pendingExit || isSavingExit) return;
    const exit = pendingExit;
    setPendingExit(null);
    performExit(exit);
  };

  const saveAndExit = async () => {
    if (!pendingExit || !saveEditorialRef.current || isSavingExit) return;
    setIsSavingExit(true);
    setExitError('');
    try {
      const result = await saveAndContinue(pendingExit, saveEditorialRef.current, performExit);
      if (!result.ok) setExitError(result.error);
    } finally {
      setIsSavingExit(false);
    }
  };

  useEffect(() => {
    setIsEditingEditorial(false);
    setFocusSection(null);
    setEditorialDirty(false);
    setPendingExit(null);
    setExitError('');
  }, [articleId]);

  useEffect(() => {
    const element = dialog.current;
    if (!articleId || !element) return;

    // Capture triggering element before modal takes focus
    triggerRef.current = document.activeElement as HTMLElement | null;

    // Lock body scroll and preserve previous style states exactly
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    if (!element.open) element.showModal();

    return () => {
      if (element.open) element.close();

      // Restore previous body scroll state exactly
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;

      // Restore focus to original trigger or safe Newsroom fallback target
      const trigger = triggerRef.current;
      const target = (trigger && document.body.contains(trigger))
        ? trigger
        : (document.querySelector<HTMLElement>(`button[data-article-id="${articleId}"]`)
          ?? document.querySelector<HTMLElement>('.vnd-newsroom-row > button')
          ?? document.querySelector<HTMLElement>('.vnd-search-field input')
          ?? document.getElementById('vnd-content'));
      target?.focus({ preventScroll: true });
    };
  }, [articleId]);

  if (!articleId) return null;
  const article = query.data;
	const needsAssignee = Boolean(article?.editUrl && article.editorialStatus === 'idea' && article.isUnassigned);
	let dateLabel = '';
	if (article) {
		/* translators: %s: scheduled local date and time. */
		const scheduledFormat = __('Scheduled %s', 'veridis-news-desk');
		/* translators: %s: published local date and time. */
		const publishedFormat = __('Published %s', 'veridis-news-desk');
		/* translators: %s: last modified local date and time. */
		const modifiedFormat = __('Modified %s', 'veridis-news-desk');
		dateLabel = sprintf(article.dateKind === 'scheduled' ? scheduledFormat : article.dateKind === 'published' ? publishedFormat : modifiedFormat, article.dateLabel);
	}
  return <dialog ref={dialog} className="vnd-drawer" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!pendingExit) requestExit({ kind: 'close' }); }} onClick={event => { if (event.target === event.currentTarget) requestExit({ kind: 'close' }); }}>
    <div className="vnd-drawer-inner">
      <header className="vnd-drawer-header">
        <div>
          <p className="vnd-eyebrow">{__('ARTICLE', 'veridis-news-desk')}</p>
          <h2 id={titleId}>
            {article?.title ?? (
              <VeridisSkeleton shape="title" style={{ width: '280px', height: '22px' }} />
            )}
          </h2>
          <p className="vnd-drawer-subtitle">
            {article ? (
              `${sprintf(__('Author: %s', 'veridis-news-desk'), article.authorName)} · ${article.categories.map(item => item.name).join(', ') || __('Uncategorized', 'veridis-news-desk')} · ${dateLabel}`
            ) : (
              <VeridisSkeleton shape="line" style={{ width: '210px', height: '12px' }} />
            )}
          </p>
        </div>
        <button
          type="button"
          className="vnd-drawer-close"
          onClick={() => requestExit({ kind: 'close' })}
          aria-label={__('Close article', 'veridis-news-desk')}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>
      <div className="vnd-drawer-body">
        {query.isPending ? (
          <div aria-busy="true" aria-label={__('Loading article details', 'veridis-news-desk')}>
            <span className="vnd-sr-only" role="status">{__('Loading article details…', 'veridis-news-desk')}</span>
            <DrawerSectionSkeleton />
            <DrawerSectionSkeleton />
            <DrawerSectionSkeleton />
          </div>
        ) : !article ? (
          <EmptyState
            compact
            title={__('The article could not load', 'veridis-news-desk')}
            description={query.error?.message ?? __('Please try again.', 'veridis-news-desk')}
            action={<VeridisButton onClick={() => query.refetch()}>{__('Try again', 'veridis-news-desk')}</VeridisButton>}
          />
        ) : (
          <>
            {needsAssignee && !isEditingEditorial && (
              <VeridisNotice
                tone="warning"
                title={__('Story needs an assignee', 'veridis-news-desk')}
              >
                {__('Assign this idea before editing its content.', 'veridis-news-desk')}
              </VeridisNotice>
            )}
            {isEditingEditorial ? (
              <EditorialEditor
                article={article}
                assignees={optionsQuery.data?.assignees || []}
                focusSection={focusSection}
                onDirtyChange={setEditorialDirty}
                onSaveReady={registerSave}
                onDone={() => {
                  setIsEditingEditorial(false);
                  setFocusSection(null);
                }}
              />
            ) : (
              <EditorialSummary
                article={article}
                onEdit={() => {
                  setFocusSection(null);
                  setIsEditingEditorial(true);
                }}
              />
            )}

            <FollowUpSection key={`fu-${article.id}`} article={article} />
            <ArticleHealthSummary
              article={article}
              onFixSource={() => {
                setIsEditingEditorial(true);
                setFocusSection('sources');
              }}
            />

            <section className="vnd-drawer-section" aria-labelledby="vnd-details-title">
              <h3 id="vnd-details-title">{__('WordPress details', 'veridis-news-desk')}</h3>
              <dl className="vnd-details-list">
                <Detail label={__('WordPress status', 'veridis-news-desk')} value={article.statusLabel} />
                <Detail label={__('Author', 'veridis-news-desk')} value={article.authorName} />
                <Detail label={__('Categories', 'veridis-news-desk')} value={article.categories.map(item => item.name).join(', ') || __('Uncategorized', 'veridis-news-desk')} />
                <Detail label={__('Tags', 'veridis-news-desk')} value={article.tags.map(item => item.name).join(', ') || __('No tags', 'veridis-news-desk')} />
                <Detail label={__('Excerpt', 'veridis-news-desk')} value={article.excerpt || __('No excerpt', 'veridis-news-desk')} />
                <Detail label={__('Legacy source', 'veridis-news-desk')} value={article.source || __('No source information', 'veridis-news-desk')} />
                <Detail label={__('Photo credit', 'veridis-news-desk')} value={article.photoCredit || __('No photo credit', 'veridis-news-desk')} />
              </dl>
            </section>
          </>
        )}
      </div>
      <footer className="vnd-drawer-footer">
        <VeridisButton variant="ghost" onClick={() => requestExit({ kind: 'close' })}>{__('Close', 'veridis-news-desk')}</VeridisButton>
        {article?.viewUrl && <a className="vnd-button vnd-button--secondary" href={article.viewUrl} target="_blank" rel="noreferrer">{__('View article', 'veridis-news-desk')}</a>}
        {!needsAssignee && article?.editUrl && (() => {
          const pathname = window.location.pathname.replace(/^.*\/wp-admin\//, '');
          const relativeReturn = (pathname || 'admin.php') + window.location.search;
          let editorHref = article.editUrl;
          try {
            const parsed = new URL(article.editUrl, window.location.origin);
            parsed.searchParams.set('vnd_mode', 'editor');
            parsed.searchParams.set('vnd_return', relativeReturn);
            editorHref = parsed.pathname + parsed.search;
          } catch {
            // fallback to original editUrl if parsing fails
          }
          return (
            <a
              className={`vnd-button ${isEditingEditorial ? 'vnd-button--secondary' : 'vnd-button--primary'}`}
              href={editorHref}
              onClick={event => {
                if (editorialDirty) {
                  event.preventDefault();
                  requestExit({ kind: 'edit', href: editorHref, returnUrl: relativeReturn });
                } else {
                  try {
                    sessionStorage.setItem('vnd_editor_return', relativeReturn);
                  } catch {
                    // ignore
                  }
                }
              }}
            >
              {__('Edit article', 'veridis-news-desk')}
            </a>
          );
        })()}
      </footer>
      <VeridisModal
        open={pendingExit !== null}
        onClose={stay}
        title={__('Unsaved changes', 'veridis-news-desk')}
        footer={<div className="vnd-unsaved-modal-footer">
          <VeridisButton type="button" variant="ghost" disabled={isSavingExit} onClick={discardAndContinue}>
            {_x('Discard changes', 'drawer unsaved changes action', 'veridis-news-desk')}
          </VeridisButton>
          <div className="vnd-unsaved-modal-footer-right">
            <VeridisButton type="button" variant="secondary" disabled={isSavingExit} onClick={stay}>
              {_x('Stay', 'drawer unsaved changes action', 'veridis-news-desk')}
            </VeridisButton>
            <VeridisButton type="button" disabled={isSavingExit} onClick={saveAndExit}>
              {isSavingExit ? __('Saving…', 'veridis-news-desk') : _x('Save changes and continue', 'drawer unsaved changes action', 'veridis-news-desk')}
            </VeridisButton>
          </div>
        </div>}
      >
        <p>{__('You have unsaved editorial details.', 'veridis-news-desk')}</p>
        {exitError && <p className="vnd-form-error" role="alert">{exitError}</p>}
      </VeridisModal>
    </div>
  </dialog>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
