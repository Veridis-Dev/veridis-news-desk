import type { CSSProperties } from 'react';
import { VeridisCard } from './VeridisCard';

export type SkeletonShape =
  | 'line'
  | 'short'
  | 'title'
  | 'number'
  | 'row'
  | 'badge'
  | 'circle'
  | 'button';

export interface VeridisSkeletonProps {
  shape?: SkeletonShape;
  className?: string;
  style?: CSSProperties;
}

export function VeridisSkeleton({
  shape = 'line',
  className = '',
  style,
}: VeridisSkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`vnd-skeleton vnd-skeleton--${shape} ${className}`.trim()}
      style={style}
    />
  );
}

/** Stat card skeleton matching StatCard loaded geometry */
export function StatCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <VeridisCard className={`vnd-stat vnd-stat--skeleton ${className}`.trim()}>
      <div aria-hidden="true">
        <div className="vnd-stat-label">
          <VeridisSkeleton shape="short" style={{ width: '80px', height: '14px' }} />
          <VeridisSkeleton shape="circle" style={{ width: '7px', height: '7px', borderRadius: '50%' }} />
        </div>
        <VeridisSkeleton shape="number" />
        <VeridisSkeleton shape="line" style={{ width: '130px', height: '12px' }} />
      </div>
    </VeridisCard>
  );
}

/** Newsroom list row skeleton matching NewsroomRow geometry (min-height 70px) */
export function NewsroomRowSkeleton() {
  return (
    <li className="vnd-newsroom-row vnd-newsroom-row--skeleton" aria-hidden="true">
      <div className="vnd-newsroom-row-skeleton-inner">
        <VeridisSkeleton shape="circle" style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0 }} />
        <div className="vnd-newsroom-story">
          <VeridisSkeleton shape="title" style={{ width: '65%', height: '16px', marginBottom: '6px' }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <VeridisSkeleton shape="badge" style={{ width: '56px', height: '18px' }} />
            <VeridisSkeleton shape="line" style={{ width: '140px', height: '12px' }} />
          </div>
        </div>
        <div className="vnd-newsroom-badges">
          <VeridisSkeleton shape="badge" style={{ width: '60px', height: '22px' }} />
          <VeridisSkeleton shape="badge" style={{ width: '50px', height: '22px' }} />
        </div>
      </div>
    </li>
  );
}

/** Breaking row skeleton matching BreakingRow geometry (min-height 92px) */
export function BreakingRowSkeleton() {
  return (
    <li className="vnd-breaking-row vnd-breaking-row--skeleton" aria-hidden="true">
      <div className="vnd-breaking-story" style={{ cursor: 'default' }}>
        <div className="vnd-breaking-row-main">
          <div className="vnd-breaking-row-badges">
            <VeridisSkeleton shape="badge" style={{ width: '68px', height: '22px' }} />
            <VeridisSkeleton shape="badge" style={{ width: '52px', height: '22px' }} />
          </div>
          <VeridisSkeleton shape="title" style={{ width: '80%', height: '16px' }} />
          <div className="vnd-breaking-article-meta">
            <VeridisSkeleton shape="badge" style={{ width: '50px', height: '18px' }} />
            <VeridisSkeleton shape="badge" style={{ width: '60px', height: '18px' }} />
          </div>
        </div>
        <div className="vnd-breaking-row-timing">
          <VeridisSkeleton shape="line" style={{ width: '110px', height: '12px' }} />
          <VeridisSkeleton shape="line" style={{ width: '90px', height: '12px' }} />
        </div>
        <div className="vnd-breaking-row-context">
          <VeridisSkeleton shape="line" style={{ width: '80px', height: '12px' }} />
        </div>
      </div>
      <div className="vnd-breaking-row-actions">
        <VeridisSkeleton shape="button" style={{ width: '48px', height: '30px' }} />
        <VeridisSkeleton shape="button" style={{ width: '60px', height: '30px' }} />
      </div>
    </li>
  );
}

/** Follow-up row skeleton matching FollowUpRow geometry (min-height 64px) */
export function FollowUpRowSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <li className={`vnd-followup-row vnd-followup-row--skeleton ${compact ? 'is-compact' : ''}`} aria-hidden="true">
      <div className="vnd-followup-row-start">
        <VeridisSkeleton shape="circle" style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
      </div>
      <div className="vnd-followup-row-content">
        <div className="vnd-followup-title-line">
          <VeridisSkeleton shape="title" style={{ width: compact ? '70%' : '55%', height: '15px' }} />
          <VeridisSkeleton shape="badge" style={{ width: '60px', height: '20px' }} />
        </div>
        <div className="vnd-followup-meta-line">
          <VeridisSkeleton shape="line" style={{ width: '160px', height: '12px' }} />
        </div>
      </div>
      <div className="vnd-followup-row-actions">
        <VeridisSkeleton shape="button" style={{ width: '44px', height: '28px' }} />
      </div>
    </li>
  );
}

/** Article search result skeleton for Breaking / Follow-up modals (min-height 66px) */
export function SearchResultSkeleton() {
  return (
    <li className="vnd-breaking-result--skeleton" aria-hidden="true">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 8px', minHeight: '66px', width: '100%' }}>
        <div style={{ display: 'grid', gap: '7px', flex: 1 }}>
          <VeridisSkeleton shape="title" style={{ width: '75%', height: '16px' }} />
          <div style={{ display: 'flex', gap: '6px' }}>
            <VeridisSkeleton shape="badge" style={{ width: '55px', height: '18px' }} />
            <VeridisSkeleton shape="badge" style={{ width: '65px', height: '18px' }} />
          </div>
        </div>
        <VeridisSkeleton shape="circle" style={{ width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0 }} />
      </div>
    </li>
  );
}

/** Board card skeleton matching EditorialBoardCard */
export function BoardCardSkeleton() {
  return (
    <div className="vnd-board-card vnd-board-card--skeleton" aria-hidden="true">
      <div className="vnd-board-card-header">
        <VeridisSkeleton shape="badge" style={{ width: '50px', height: '16px' }} />
        <VeridisSkeleton shape="badge" style={{ width: '40px', height: '16px' }} />
      </div>
      <VeridisSkeleton shape="title" style={{ width: '90%', height: '15px' }} />
      <VeridisSkeleton shape="line" style={{ width: '60%', height: '13px' }} />
      <div className="vnd-board-card-assignee">
        <VeridisSkeleton shape="circle" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
        <VeridisSkeleton shape="line" style={{ width: '70px', height: '12px' }} />
      </div>
      <div className="vnd-board-card-footer">
        <VeridisSkeleton shape="badge" style={{ width: '48px', height: '18px' }} />
        <VeridisSkeleton shape="button" style={{ width: '56px', height: '22px', marginLeft: 'auto' }} />
      </div>
    </div>
  );
}

/** Drawer section skeleton matching drawer sections */
export function DrawerSectionSkeleton() {
  return (
    <section className="vnd-drawer-section vnd-editorial-section" aria-hidden="true">
      <div className="vnd-editorial-header">
        <VeridisSkeleton shape="title" style={{ width: '100px', height: '16px' }} />
        <VeridisSkeleton shape="button" style={{ width: '90px', height: '28px' }} />
      </div>
      <div className="vnd-editorial-grid">
        <div className="vnd-detail-row">
          <VeridisSkeleton shape="short" style={{ width: '50px', height: '11px', marginBottom: '4px' }} />
          <VeridisSkeleton shape="badge" style={{ width: '70px', height: '22px' }} />
        </div>
        <div className="vnd-detail-row">
          <VeridisSkeleton shape="short" style={{ width: '70px', height: '11px', marginBottom: '4px' }} />
          <VeridisSkeleton shape="line" style={{ width: '90px', height: '16px' }} />
        </div>
        <div className="vnd-detail-row">
          <VeridisSkeleton shape="short" style={{ width: '60px', height: '11px', marginBottom: '4px' }} />
          <VeridisSkeleton shape="line" style={{ width: '110px', height: '16px' }} />
        </div>
        <div className="vnd-detail-row">
          <VeridisSkeleton shape="short" style={{ width: '55px', height: '11px', marginBottom: '4px' }} />
          <VeridisSkeleton shape="badge" style={{ width: '60px', height: '22px' }} />
        </div>
      </div>
    </section>
  );
}

/** Restrained neutral panel skeleton for top-level Breaking page (preserves volume without implying fake stories) */
export function BreakingPanelSkeleton() {
  return (
    <div className="vnd-breaking-skeleton-panel" aria-hidden="true">
      <VeridisSkeleton shape="badge" style={{ width: '46px', height: '46px', borderRadius: '10px' }} />
      <VeridisSkeleton shape="title" style={{ width: '210px', height: '18px', marginTop: '6px' }} />
      <VeridisSkeleton shape="line" style={{ width: '320px', height: '13px' }} />
      <VeridisSkeleton shape="line" style={{ width: '220px', height: '13px', marginTop: '2px' }} />
    </div>
  );
}

/** Restrained neutral panel skeleton for top-level Follow-ups workspace (preserves volume without implying fake tasks) */
export function FollowUpPanelSkeleton() {
  return (
    <div className="vnd-followup-skeleton-panel" aria-hidden="true">
      <VeridisSkeleton shape="badge" style={{ width: '46px', height: '46px', borderRadius: '10px' }} />
      <VeridisSkeleton shape="title" style={{ width: '220px', height: '18px', marginTop: '6px' }} />
      <VeridisSkeleton shape="line" style={{ width: '300px', height: '13px' }} />
      <VeridisSkeleton shape="line" style={{ width: '200px', height: '13px', marginTop: '2px' }} />
    </div>
  );
}

/** Content-shaped skeleton matching the complete Live Data workspace */
export function LiveDataPageSkeleton() {
  return (
    <>
      <div className="vnd-page-heading">
        <div>
          <p className="vnd-eyebrow">LIVE DATA</p>
          <h2>Live Data</h2>
          <p>Real-time feeds and external data integrations for the newsroom.</p>
        </div>
      </div>

      <VeridisCard
        title="Connected Feeds"
        action={
          <VeridisSkeleton
            shape="badge"
            style={{ width: '58px', height: '22px' }}
          />
        }
        className="vnd-live-data-skeleton"
      >
        <div
          className="vnd-live-data-skeleton-body"
          aria-hidden="true"
        >
          <VeridisSkeleton
            shape="title"
            style={{ width: '190px', height: '17px' }}
          />

          <VeridisSkeleton
            shape="line"
            style={{ width: '340px', maxWidth: '80%', height: '13px' }}
          />

          <div className="vnd-live-data-skeleton-types">
            <VeridisSkeleton shape="line" style={{ width: '82px', height: '12px' }} />
            <VeridisSkeleton shape="line" style={{ width: '120px', height: '12px' }} />
            <VeridisSkeleton shape="line" style={{ width: '115px', height: '12px' }} />
          </div>

          <VeridisSkeleton
            shape="line"
            style={{ width: '280px', maxWidth: '70%', height: '11px' }}
          />
        </div>
      </VeridisCard>
    </>
  );
}
