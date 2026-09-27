import { VeridisCard } from '../design-system/VeridisCard';
import { VeridisSkeleton, StatCardSkeleton } from '../design-system/VeridisSkeleton';
import { __ } from '@wordpress/i18n';

function DashboardRowSkeleton({ showAvatar = true }: { showAvatar?: boolean }) {
  return (
    <li className="vnd-story" style={{ pointerEvents: 'none', listStyle: 'none' }} aria-hidden="true">
      <div className="vnd-story-button" style={{ cursor: 'default' }}>
        {showAvatar ? (
          <VeridisSkeleton shape="circle" style={{ width: '34px', height: '34px', flexShrink: 0 }} />
        ) : (
          <VeridisSkeleton shape="badge" style={{ width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0 }} />
        )}
        <span className="vnd-story-copy">
          <VeridisSkeleton shape="title" style={{ width: '70%', height: '16px', marginBottom: '6px' }} />
          <VeridisSkeleton shape="line" style={{ width: '50%', height: '12px' }} />
        </span>
        <span className="vnd-story-badges">
          <VeridisSkeleton shape="badge" style={{ width: '60px', height: '22px' }} />
        </span>
      </div>
    </li>
  );
}

export function DashboardSkeleton() {
  const panelTitles = [
    { title: __('In progress', 'veridis-news-desk'), avatar: true },
    { title: __('Needs attention', 'veridis-news-desk'), avatar: false },
    { title: __('Deadline watch', 'veridis-news-desk'), avatar: false },
    { title: __('Follow-ups', 'veridis-news-desk'), avatar: true },
  ];
  return (
    <div aria-busy="true" aria-label={__('Loading dashboard', 'veridis-news-desk')}>
      <span className="vnd-sr-only" role="status">{__('Loading your desk…', 'veridis-news-desk')}</span>
      <div className="vnd-stats">
        {Array.from({ length: 4 }, (_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="vnd-dashboard-grid">
        {panelTitles.map(panel => (
          <VeridisCard
            title={panel.title}
            key={panel.title}
            action={<VeridisSkeleton shape="badge" style={{ width: '52px', height: '22px' }} />}
          >
            <ul className="vnd-list">
              <DashboardRowSkeleton showAvatar={panel.avatar} />
              <DashboardRowSkeleton showAvatar={panel.avatar} />
              <DashboardRowSkeleton showAvatar={panel.avatar} />
            </ul>
          </VeridisCard>
        ))}
      </div>
    </div>
  );
}
