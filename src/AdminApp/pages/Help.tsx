import { __ } from '@wordpress/i18n';

export function Help() {
  return (
    <>
      <div className="vnd-page-heading">
        <div>
          <p className="vnd-eyebrow">{__('HELP', 'veridis-news-desk')}</p>
          <h2>{__('Help', 'veridis-news-desk')}</h2>
          <p>{__('A quick guide to the News Desk workflow.', 'veridis-news-desk')}</p>
        </div>
      </div>

      <div className="vnd-help">
        <section className="vnd-help-section" aria-labelledby="vnd-help-getting-started">
          <h3 id="vnd-help-getting-started">{__('Getting started', 'veridis-news-desk')}</h3>
          <ol className="vnd-help-steps">
            <li>{__('Create a story in Newsroom.', 'veridis-news-desk')}</li>
            <li>{__('Assign responsibility to an eligible user.', 'veridis-news-desk')}</li>
            <li>{__('Set the editorial status, priority, and deadline.', 'veridis-news-desk')}</li>
            <li>{__('Edit the article after it has an assignee.', 'veridis-news-desk')}</li>
            <li>{__('Add Follow-ups for callbacks, updates, and related editorial tasks.', 'veridis-news-desk')}</li>
          </ol>
        </section>

        <section className="vnd-help-section" aria-labelledby="vnd-help-workflow">
          <h3 id="vnd-help-workflow">{__('Editorial workflow', 'veridis-news-desk')}</h3>
          <dl className="vnd-help-definitions">
            <div>
              <dt>{__('Idea', 'veridis-news-desk')}</dt>
              <dd>{__('An early-stage story. It may remain Unassigned.', 'veridis-news-desk')}</dd>
            </div>
            <div>
              <dt>{__('Writing', 'veridis-news-desk')}</dt>
              <dd>{__('The article is being drafted and requires an assignee.', 'veridis-news-desk')}</dd>
            </div>
            <div>
              <dt>{__('Review', 'veridis-news-desk')}</dt>
              <dd>{__('The article is being checked before publication and requires an assignee.', 'veridis-news-desk')}</dd>
            </div>
            <div>
              <dt>{__('Ready to publish', 'veridis-news-desk')}</dt>
              <dd>{__('Editorial work is ready. Publishing still follows existing WordPress roles and capabilities.', 'veridis-news-desk')}</dd>
            </div>
          </dl>
        </section>

        <section className="vnd-help-section" aria-labelledby="vnd-help-people">
          <h3 id="vnd-help-people">{__('Author and responsible editor', 'veridis-news-desk')}</h3>
          <p>{__('Author is the public WordPress article author shown in the byline. The responsible editor, shown as Assigned, is the person currently responsible for the story in the editorial workflow. They may be the same person or different people.', 'veridis-news-desk')}</p>
        </section>

        <section className="vnd-help-section" aria-labelledby="vnd-help-health">
          <h3 id="vnd-help-health">{__('Article Health', 'veridis-news-desk')}</h3>
          <p>{__('Article Health checks whether a story has a featured image, excerpt, source, and photo credit. These are newsroom readiness checks, not SEO scoring or advanced content analysis.', 'veridis-news-desk')}</p>
        </section>

        <section className="vnd-help-section" aria-labelledby="vnd-help-follow-ups">
          <h3 id="vnd-help-follow-ups">{__('Follow-ups', 'veridis-news-desk')}</h3>
          <p>{__('Follow-ups are tasks attached to a story, such as callbacks, updates, or editorial actions. They have their own status and deadline and may remain Unassigned.', 'veridis-news-desk')}</p>
        </section>

        <section className="vnd-help-section" aria-labelledby="vnd-help-roles">
          <h3 id="vnd-help-roles">{__('Roles and permissions', 'veridis-news-desk')}</h3>
          <p>{__('News Desk respects existing WordPress roles and capabilities. It does not replace native publishing permissions or add a separate approval system.', 'veridis-news-desk')}</p>
        </section>

        <section className="vnd-help-section vnd-help-resources" aria-labelledby="vnd-help-resources">
          <h3 id="vnd-help-resources">{__('Resources', 'veridis-news-desk')}</h3>
          <dl>
            <div>
              <dt>
                <a href="https://veridis.dev/products/news-desk/" target="_blank" rel="noopener noreferrer" className="vnd-help-resource-link">
                  <span>{__('Veridis News Desk', 'veridis-news-desk')}</span>
                  <span className="vnd-help-resource-arrow" aria-hidden="true">↗</span>
                </a>
              </dt>
              <dd>{__('Product page', 'veridis-news-desk')}</dd>
            </div>
            <div>
              <dt>
                <a href="https://veridis.dev/products/news-desk/docs/" target="_blank" rel="noopener noreferrer" className="vnd-help-resource-link">
                  <span>{__('Documentation', 'veridis-news-desk')}</span>
                  <span className="vnd-help-resource-arrow" aria-hidden="true">↗</span>
                </a>
              </dt>
              <dd>{__('Guides & reference', 'veridis-news-desk')}</dd>
            </div>
            <div>
              <dt>
                <a href="https://veridis.dev/products/news-desk/support/" target="_blank" rel="noopener noreferrer" className="vnd-help-resource-link">
                  <span>{__('Support', 'veridis-news-desk')}</span>
                  <span className="vnd-help-resource-arrow" aria-hidden="true">↗</span>
                </a>
              </dt>
              <dd>{__('Get help', 'veridis-news-desk')}</dd>
            </div>
            <div>
              <dt>
                <a href="https://veridis.dev/products/news-desk/changelog/" target="_blank" rel="noopener noreferrer" className="vnd-help-resource-link">
                  <span>{__('Changelog', 'veridis-news-desk')}</span>
                  <span className="vnd-help-resource-arrow" aria-hidden="true">↗</span>
                </a>
              </dt>
              <dd>{__('Release notes', 'veridis-news-desk')}</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
