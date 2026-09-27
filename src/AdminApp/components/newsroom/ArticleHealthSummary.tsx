import { useEffect, useState, type FormEvent } from 'react';
import { __ } from '@wordpress/i18n';
import type { ArticleDetail } from '../../types';
import { useUpdateArticleContent } from '../../hooks/useUpdateArticleContent';
import { useToast } from '../../design-system/VeridisToast';
import { VeridisButton } from '../../design-system/VeridisButton';
import { canUseArticleHealthFix } from './articleHealthFix';

export function ArticleHealthSummary({
  article,
  onFixSource,
}: {
  article: ArticleDetail;
  onFixSource: () => void;
}) {
  const [activeFix, setActiveFix] = useState<'excerpt' | 'photoCredit' | null>(null);
  const [excerpt, setExcerpt] = useState(article.excerpt || '');
  const [photoCredit, setPhotoCredit] = useState(article.photoCredit || '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useUpdateArticleContent(article.id);
  const toast = useToast();
  const contentFixBlocked = !canUseArticleHealthFix(article, 'excerpt');

  useEffect(() => {
    setActiveFix(null);
    setExcerpt(article.excerpt || '');
    setPhotoCredit(article.photoCredit || '');
    setError(null);
  }, [article.id]);

  useEffect(() => {
    if (activeFix !== 'excerpt') setExcerpt(article.excerpt || '');
    if (activeFix !== 'photoCredit') setPhotoCredit(article.photoCredit || '');
  }, [article.excerpt, article.photoCredit, activeFix]);

  useEffect(() => {
    if (contentFixBlocked) setActiveFix(null);
  }, [contentFixBlocked]);

  async function handleSaveExcerpt(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ excerpt });
      toast(__('Excerpt updated.', 'veridis-news-desk'), 'success');
      setActiveFix(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : __('Failed to update excerpt.', 'veridis-news-desk'));
    }
  }

  async function handleSavePhotoCredit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutation.mutateAsync({ photoCredit });
      toast(__('Photo credit updated.', 'veridis-news-desk'), 'success');
      setActiveFix(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : __('Failed to update photo credit.', 'veridis-news-desk'));
    }
  }

  return (
    <section className="vnd-drawer-section" aria-labelledby="vnd-health-title">
      <h3 id="vnd-health-title">{__('Article Health', 'veridis-news-desk')}</h3>
      <ul className="vnd-health-checks">
        {article.healthChecks.map(check => {
          const fixAllowed = canUseArticleHealthFix(article, check.id);
          const isExcerptActive = fixAllowed && check.id === 'excerpt' && activeFix === 'excerpt';
          const isPhotoCreditActive = fixAllowed && check.id === 'photoCredit' && activeFix === 'photoCredit';
          const isItemExpanded = isExcerptActive || isPhotoCreditActive;

          return (
            <li
              key={check.id}
              className={`${check.passed ? 'is-passed' : 'has-warning'}${isItemExpanded ? ' is-expanded' : ''}`}
            >
              <div className="vnd-health-check-header">
                <span aria-hidden="true">{check.passed ? '✓' : '!'}</span>
                <div className="vnd-health-check-label">
                  <strong>{check.label}</strong>
                  <small>
                    {check.passed
                      ? __('Complete', 'veridis-news-desk')
                      : __('Needs attention', 'veridis-news-desk')}
                  </small>
                </div>

                {!check.passed && (
                  <div className="vnd-health-check-action">
                    {!fixAllowed && <span className="vnd-health-fix-hint">{__('Assign the story to fix this.', 'veridis-news-desk')}</span>}
                    {fixAllowed && check.id === 'featuredImage' && article.editUrl && (
                      <a
                        href={article.editUrl}
                        className="vnd-health-fix-btn"
                        title={__('Set featured image in WordPress editor', 'veridis-news-desk')}
                      >
                        {__('Fix', 'veridis-news-desk')}
                      </a>
                    )}
                    {fixAllowed && check.id === 'source' && (
                      <button
                        type="button"
                        className="vnd-health-fix-btn"
                        onClick={onFixSource}
                      >
                        {__('Fix', 'veridis-news-desk')}
                      </button>
                    )}
                    {fixAllowed && check.id === 'excerpt' && (
                      <button
                        type="button"
                        className="vnd-health-fix-btn"
                        onClick={() => {
                          setError(null);
                          setActiveFix(isExcerptActive ? null : 'excerpt');
                        }}
                        aria-expanded={isExcerptActive}
                      >
                        {isExcerptActive ? __('Cancel', 'veridis-news-desk') : __('Fix', 'veridis-news-desk')}
                      </button>
                    )}
                    {fixAllowed && check.id === 'photoCredit' && (
                      <button
                        type="button"
                        className="vnd-health-fix-btn"
                        onClick={() => {
                          setError(null);
                          setActiveFix(isPhotoCreditActive ? null : 'photoCredit');
                        }}
                        aria-expanded={isPhotoCreditActive}
                      >
                        {isPhotoCreditActive ? __('Cancel', 'veridis-news-desk') : __('Fix', 'veridis-news-desk')}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isExcerptActive && (
                <form className="vnd-health-inline-form" onSubmit={handleSaveExcerpt}>
                  <label htmlFor="vnd-inline-excerpt-input" className="vnd-field-label">
                    {__('Article excerpt', 'veridis-news-desk')}
                  </label>
                  <textarea
                    id="vnd-inline-excerpt-input"
                    className="vnd-health-textarea"
                    rows={3}
                    value={excerpt}
                    onChange={e => setExcerpt(e.target.value)}
                    placeholder={__('Write a short excerpt for this article…', 'veridis-news-desk')}
                    disabled={mutation.isPending}
                    autoFocus
                  />
                  {error && (
                    <p className="vnd-inline-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="vnd-health-inline-actions">
                    <VeridisButton
                      type="submit"
                      variant="primary"
                      disabled={mutation.isPending || excerpt === (article.excerpt || '')}
                    >
                      {mutation.isPending ? __('Saving…', 'veridis-news-desk') : __('Save', 'veridis-news-desk')}
                    </VeridisButton>
                    <VeridisButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setExcerpt(article.excerpt || '');
                        setActiveFix(null);
                        setError(null);
                      }}
                      disabled={mutation.isPending}
                    >
                      {__('Cancel', 'veridis-news-desk')}
                    </VeridisButton>
                  </div>
                </form>
              )}

              {isPhotoCreditActive && (
                <form className="vnd-health-inline-form" onSubmit={handleSavePhotoCredit}>
                  <label htmlFor="vnd-inline-credit-input" className="vnd-field-label">
                    {__('Photo credit', 'veridis-news-desk')}
                  </label>
                  <input
                    id="vnd-inline-credit-input"
                    type="text"
                    className="vnd-health-input"
                    value={photoCredit}
                    onChange={e => setPhotoCredit(e.target.value)}
                    placeholder={__('e.g. Photo: Veridis Archive / Reuters', 'veridis-news-desk')}
                    disabled={mutation.isPending}
                    autoFocus
                  />
                  {error && (
                    <p className="vnd-inline-error" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="vnd-health-inline-actions">
                    <VeridisButton
                      type="submit"
                      variant="primary"
                      disabled={mutation.isPending || photoCredit === (article.photoCredit || '')}
                    >
                      {mutation.isPending ? __('Saving…', 'veridis-news-desk') : __('Save', 'veridis-news-desk')}
                    </VeridisButton>
                    <VeridisButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setPhotoCredit(article.photoCredit || '');
                        setActiveFix(null);
                        setError(null);
                      }}
                      disabled={mutation.isPending}
                    >
                      {__('Cancel', 'veridis-news-desk')}
                    </VeridisButton>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
