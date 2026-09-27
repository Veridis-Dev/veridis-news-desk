import { useEffect, useRef, useState } from 'react';
import { __ } from '@wordpress/i18n';
import { pages, pageUrl, useNavigation } from '../hooks/useNavigation';
import { VeridisTabs } from '../design-system/VeridisTabs';
import { VeridisButton } from '../design-system/VeridisButton';
import { VeridisModal } from '../design-system/VeridisModal';
import { Dashboard } from '../pages/Dashboard';
import { Newsroom } from '../pages/Newsroom';
import { FollowUps } from '../pages/FollowUps';
import { Help } from '../pages/Help';
import { Settings } from '../pages/Settings';
import { WorkspaceToggle } from '../components/WorkspaceToggle';
import { useWideWorkspace } from '../hooks/useWideWorkspace';

export function App() {
  const { page, navigate } = useNavigation();
  const { isWide, toggleWide } = useWideWorkspace();
  const [about, setAbout] = useState(false);
  const content = useRef<HTMLElement>(null);
  const previous = useRef(page);

  const config = typeof window !== 'undefined' ? window.veridisNewsDesk : undefined;
  const version = config?.version;
  /* translators: %s: plugin version number. */
  const versionLabel = version ? `v${version}` : '';
  const utmLink = config?.utmLink;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (typeof window === 'undefined' || !('scrollRestoration' in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    if (previous.current !== page) {
      content.current?.focus({ preventScroll: true });
      previous.current = page;
    }
  }, [page]);

  return <>
    <a className="vnd-skip" href="#vnd-content">{__('Skip to content', 'veridis-news-desk')}</a>
    <header className="vnd-brand-header">
      <div className="vnd-brand-group">
        <span className="vnd-wordmark">{__('VERIDIS', 'veridis-news-desk')} <span>{__('NEWS', 'veridis-news-desk')}</span></span>
        <div>
          <div className="vnd-product-title">
            <h1>{__('News Desk', 'veridis-news-desk')}</h1>
            {versionLabel ? <span className="vnd-version">{versionLabel}</span> : null}
          </div>
          <p>{__('A calmer space for a busy newsroom.', 'veridis-news-desk')}</p>
        </div>
      </div>
      <div className="vnd-brand-actions">
        <WorkspaceToggle isWide={isWide} onToggle={toggleWide} />
        <VeridisButton variant="ghost" onClick={() => setAbout(true)}>{__('About News Desk ↗', 'veridis-news-desk')}</VeridisButton>
      </div>
    </header>
    <div className="vnd-workspace">
      <div className="vnd-navigation">
        <VeridisTabs items={pages} active={page} onChange={navigate} href={pageUrl} />
      </div>
      <main id="vnd-content" className="vnd-content" tabIndex={-1} ref={content}>
        {page === 'dashboard' ? (
          <Dashboard
            onOpenFollowUps={() => navigate('follow-ups')}
            onOpenNewsroom={params => navigate('newsroom', params)}
          />
        ) : page === 'newsroom' ? (
          <Newsroom />
        ) : page === 'follow-ups' ? (
          <FollowUps onOpenArticle={articleId => navigate('newsroom', { article: articleId })} />
        ) : page === 'help' ? (
          <Help />
        ) : page === 'settings' ? (
          <Settings />
        ) : null}
      </main>
    </div>
    <footer className="vnd-admin-footer">
      <p>
        &copy; {currentYear} {__('Developed by', 'veridis-news-desk')}{' '}
        {utmLink ? (
          <a href={utmLink} target="_blank" rel="noopener noreferrer" className="vnd-footer-link">
            {__('Veridis', 'veridis-news-desk')}
          </a>
        ) : (
          <span className="vnd-footer-brand">{__('Veridis', 'veridis-news-desk')}</span>
        )}
        {versionLabel ? <span className="vnd-footer-version">{versionLabel}</span> : null}
      </p>
    </footer>
    <VeridisModal open={about} onClose={() => setAbout(false)} title={__('Meet your News Desk', 'veridis-news-desk')}>
      <p>{__('Your newsroom’s new home inside WordPress. A shared overview, a focused workspace, and room for the next story.', 'veridis-news-desk')}</p>
      <p>{__('Plan stories in Newsroom, track deadlines and follow-ups, and edit articles with your existing WordPress permissions.', 'veridis-news-desk')}</p>
      <p>
        <a href="https://veridis.dev/products/news-desk/" target="_blank" rel="noopener noreferrer" className="vnd-footer-link">
          https://veridis.dev/products/news-desk/ ↗
        </a>
      </p>
    </VeridisModal>
  </>;
}
