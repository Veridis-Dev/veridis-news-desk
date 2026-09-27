import { __ } from '@wordpress/i18n';
import type { ArticleDetail, SourceStatus } from '../../types';
import { VeridisBadge } from '../../design-system/VeridisBadge';

function sourceStatusLabel(status: SourceStatus): string {
  switch (status) {
    case 'confirmed':
      return __('Confirmed', 'veridis-news-desk');
    case 'contacted':
      return __('Contacted', 'veridis-news-desk');
    case 'waiting':
      return __('Waiting', 'veridis-news-desk');
    case 'unverified':
    default:
      return __('Unverified', 'veridis-news-desk');
  }
}

export function EditorialSummary({
  article,
  onEdit,
}: {
  article: ArticleDetail;
  onEdit: () => void;
}) {
  return (
    <section className="vnd-drawer-section vnd-editorial-section" aria-labelledby="vnd-editorial-title">
      <div className="vnd-editorial-header">
        <h3 id="vnd-editorial-title">{__('Editorial', 'veridis-news-desk')}</h3>
        <button
          type="button"
          className="vnd-button vnd-button--secondary vnd-editorial-edit-btn"
          onClick={onEdit}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M11.06 1.772a2.121 2.121 0 1 1 3 3L4.938 13.899a2.5 2.5 0 0 1-1.077.625l-2.61.745a.5.5 0 0 1-.62-.62l.745-2.61a2.5 2.5 0 0 1 .625-1.077L11.06 1.772Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{__('Edit editorial details', 'veridis-news-desk')}</span>
        </button>
      </div>

      <dl className="vnd-editorial-grid">
        <div className="vnd-detail-row">
          <dt>{__('Status', 'veridis-news-desk')}</dt>
          <dd>
            <VeridisBadge tone={article.editorialStatusTone}>{article.editorialStatusLabel}</VeridisBadge>
          </dd>
        </div>

        <div className="vnd-detail-row">
          <dt>{__('Assigned to', 'veridis-news-desk')}</dt>
          <dd className="vnd-assignee-display">
            {article.assignedInitials ? (
              <span className="vnd-avatar vnd-avatar--inline" aria-hidden="true">
                {article.assignedInitials}
              </span>
            ) : null}
            <span className={article.isUnassigned ? 'vnd-text-muted' : ''}>
              {article.assignedName || __('Unassigned', 'veridis-news-desk')}
            </span>
          </dd>
        </div>

        <div className="vnd-detail-row">
          <dt>{__('Deadline', 'veridis-news-desk')}</dt>
          <dd>
            {article.deadlineLabel ? (
              <span className={`vnd-deadline-val ${article.isOverdue ? 'vnd-deadline--overdue' : ''}`}>
                {article.deadlineLabel}
                {article.isOverdue && (
                  <span className="vnd-overdue-tag"> ({__('Overdue', 'veridis-news-desk')})</span>
                )}
              </span>
            ) : (
              <span className="vnd-text-muted">{__('No deadline set', 'veridis-news-desk')}</span>
            )}
          </dd>
        </div>

        <div className="vnd-detail-row">
          <dt>{__('Priority', 'veridis-news-desk')}</dt>
          <dd>
            <VeridisBadge tone={article.priorityTone}>{article.priorityLabel}</VeridisBadge>
          </dd>
        </div>
      </dl>

      <div className="vnd-editorial-subsections">
        <div className="vnd-editorial-subset">
          <h4>{__('Sources', 'veridis-news-desk')}</h4>
          {article.sources && article.sources.length > 0 ? (
            <ul className="vnd-editorial-sources-list">
              {article.sources.map((src, idx) => (
                <li key={src.id || idx} className="vnd-editorial-source-item">
                  <span className={`vnd-source-dot vnd-source-dot--${src.status}`} aria-hidden="true" />
                  <span className="vnd-source-name">{src.name}</span>
                  <span className={`vnd-source-status-badge vnd-source-status-badge--${src.status}`}>
                    {sourceStatusLabel(src.status)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="vnd-text-muted vnd-text-sm">{__('No sources listed yet.', 'veridis-news-desk')}</p>
          )}
        </div>

        <div className="vnd-editorial-subset">
          <h4>{__('Internal notes', 'veridis-news-desk')}</h4>
          {article.internalNotes ? (
            <div className="vnd-internal-notes-block">
              <p>{article.internalNotes}</p>
            </div>
          ) : (
            <p className="vnd-text-muted vnd-text-sm">{__('No internal notes recorded.', 'veridis-news-desk')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
