import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { __ } from '@wordpress/i18n';
import { useNavigationGuard, type NavigationGuard } from '../hooks/useNavigation';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useToast } from '../design-system/VeridisToast';
import { VeridisCard } from '../design-system/VeridisCard';
import { VeridisButton } from '../design-system/VeridisButton';
import { VeridisModal } from '../design-system/VeridisModal';
import { VeridisSkeleton } from '../design-system/VeridisSkeleton';
import { EmptyState } from '../design-system/EmptyState';
import type { SettingsData } from '../types';

export function Settings() {
  const query = useSettings();
  const mutation = useUpdateSettings();
  const toast = useToast();

  const serverSettings = query.data?.settings;
  const canManage = query.data?.canManageSettings ?? false;

  const [form, setForm] = useState<SettingsData | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (serverSettings) {
      setForm(serverSettings);
    }
  }, [serverSettings]);

  const isDirty = form !== null && serverSettings !== undefined && (
    form.preserveDataOnUninstall !== serverSettings.preserveDataOnUninstall
  );

  // 1. Browser refresh/close protection via native beforeunload
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // 2. SPA in-app tab navigation interception via useNavigationGuard
  useNavigationGuard(
    useCallback<NavigationGuard>(
      (_next, _params, proceed) => {
        if (!isDirty) {
          return true;
        }
        setPendingNavigation(() => proceed);
        return false;
      },
      [isDirty]
    )
  );

  const handleDiscard = () => {
    if (serverSettings) {
      setForm(serverSettings);
    }
  };

  const handleStay = () => {
    setPendingNavigation(null);
  };

  const handleLeaveWithoutSaving = () => {
    const proceed = pendingNavigation;
    if (serverSettings) {
      setForm(serverSettings);
    }
    setPendingNavigation(null);
    if (proceed) {
      proceed();
    }
  };

  const handleSaveAndLeave = async () => {
    if (!form || mutation.isPending || !canManage) return;
    const proceed = pendingNavigation;

    try {
      const result = await mutation.mutateAsync(form);
      setForm(result.settings);
      toast(__('Settings saved successfully.', 'veridis-news-desk'), 'success');
      setPendingNavigation(null);
      if (proceed) {
        proceed();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : __('Failed to save settings.', 'veridis-news-desk');
      toast(message, 'error');
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isDirty || !form || mutation.isPending || !canManage) return;

    try {
      const result = await mutation.mutateAsync(form);
      setForm(result.settings);
      toast(__('Settings saved successfully.', 'veridis-news-desk'), 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : __('Failed to save settings.', 'veridis-news-desk');
      toast(message, 'error');
    }
  };

  return (
    <>
      <div className="vnd-page-heading">
        <div>
          <p className="vnd-eyebrow">{__('SETTINGS', 'veridis-news-desk')}</p>
          <h2>{__('Settings', 'veridis-news-desk')}</h2>
          <p>{__('Manage News Desk data, privacy preferences, and system information.', 'veridis-news-desk')}</p>
        </div>
      </div>

      {query.isPending && !query.data && (
        <div
          className="vnd-settings-layout"
          aria-busy="true"
          aria-label={__('Loading Settings', 'veridis-news-desk')}
        >
          <span className="vnd-sr-only" role="status">
            {__('Loading Settings…', 'veridis-news-desk')}
          </span>

          <div className="vnd-settings-col">
            <VeridisCard title={__('Data & Privacy', 'veridis-news-desk')}>
              <div className="vnd-settings-skeleton-privacy" aria-hidden="true">
                <div className="vnd-settings-skeleton-check">
                  <VeridisSkeleton
                    shape="badge"
                    style={{ width: '16px', height: '16px', borderRadius: '4px', flexShrink: 0 }}
                  />
                  <VeridisSkeleton
                    shape="title"
                    style={{ width: '230px', height: '15px' }}
                  />
                </div>

                <VeridisSkeleton
                  shape="line"
                  style={{ width: '92%', height: '12px' }}
                />
                <VeridisSkeleton
                  shape="line"
                  style={{ width: '72%', height: '12px' }}
                />
              </div>
            </VeridisCard>
          </div>

          <div className="vnd-settings-col">
            <VeridisCard title={__('System Information', 'veridis-news-desk')}>
              <div className="vnd-settings-skeleton-system" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div className="vnd-settings-skeleton-system-row" key={index}>
                    <VeridisSkeleton
                      shape="line"
                      style={{ width: index === 0 ? '125px' : '90px', height: '12px' }}
                    />
                    <VeridisSkeleton
                      shape="line"
                      style={{ width: index === 2 ? '70px' : '52px', height: '12px' }}
                    />
                  </div>
                ))}
              </div>
            </VeridisCard>
          </div>
        </div>
      )}

      {query.isError && !query.data && (
        <EmptyState
          title={__('Settings could not load', 'veridis-news-desk')}
          description={query.error.message}
          action={<VeridisButton onClick={() => query.refetch()}>{__('Try again', 'veridis-news-desk')}</VeridisButton>}
        />
      )}

      {query.data && form && (
        <form className="vnd-settings-form" onSubmit={handleSubmit}>
          {!canManage && (
            <div className="vnd-settings-notice vnd-settings-notice--info" role="status">
              <span className="vnd-settings-notice-icon" aria-hidden="true">ℹ</span>
              <p>
                {__('You can view Settings. An administrator can change them.', 'veridis-news-desk')}
              </p>
            </div>
          )}

          <div className="vnd-settings-layout">
            {/* Left Column: Data & Privacy */}
            <div className="vnd-settings-col">
              <VeridisCard title={__('Data & Privacy', 'veridis-news-desk')}>
                <div className="vnd-settings-item">
                  <label className="vnd-settings-check">
                    <input
                      type="checkbox"
                      checked={form.preserveDataOnUninstall}
                      disabled={!canManage || mutation.isPending}
                      onChange={e => setForm({ ...form, preserveDataOnUninstall: e.target.checked })}
                    />
                    <span className="vnd-settings-check-label">
                      {__('Preserve News Desk data on uninstall', 'veridis-news-desk')}
                    </span>
                  </label>
                  <p className="vnd-settings-desc">
                    {__('When enabled, News Desk editorial metadata and plugin data remain in WordPress if the plugin is deleted.', 'veridis-news-desk')}
                  </p>

                  {!form.preserveDataOnUninstall && (
                    <div className="vnd-settings-warning-box" role="alert">
                      <span className="vnd-settings-warning-icon" aria-hidden="true">⚠</span>
                      <p>
                        {__('Warning: Deleting the plugin will permanently remove News Desk-owned metadata, follow-ups, settings, and related plugin data.', 'veridis-news-desk')}
                      </p>
                    </div>
                  )}
                </div>
              </VeridisCard>
            </div>

            {/* Right Column: System Information */}
            <div className="vnd-settings-col">
              <VeridisCard title={__('System Information', 'veridis-news-desk')}>
                <dl className="vnd-settings-system-list">
                  <div className="vnd-settings-system-item">
                    <dt>{__('Veridis News Desk', 'veridis-news-desk')}</dt>
                    <dd>{`v${query.data.system.pluginVersion}`}</dd>
                  </div>
                  <div className="vnd-settings-system-item">
                    <dt>{__('Canonical Model', 'veridis-news-desk')}</dt>
                    <dd>{`v${query.data.system.canonicalModelVersion}`}</dd>
                  </div>
                  <div className="vnd-settings-system-item">
                    <dt>{__('WordPress', 'veridis-news-desk')}</dt>
                    <dd>{query.data.system.wordpressVersion}</dd>
                  </div>
                  <div className="vnd-settings-system-item">
                    <dt>{__('PHP', 'veridis-news-desk')}</dt>
                    <dd>{query.data.system.phpVersion}</dd>
                  </div>
                  <div className="vnd-settings-system-item">
                    <dt>{__('Database Schema', 'veridis-news-desk')}</dt>
                    <dd>
                      {query.data.system.databaseSchemaVersion
                        ? `v${query.data.system.databaseSchemaVersion}`
                        : __('Not installed', 'veridis-news-desk')}
                    </dd>
                  </div>
                </dl>
              </VeridisCard>
            </div>
          </div>

          {canManage && (
            <div className="vnd-settings-actions-bar">
              {isDirty ? (
                <span className="vnd-unsaved-indicator" aria-live="polite">
                  <span className="vnd-unsaved-dot" aria-hidden="true" />
                  {__('Unsaved changes', 'veridis-news-desk')}
                </span>
              ) : (
                <span />
              )}
              <div className="vnd-settings-actions-group">
                <VeridisButton
                  type="button"
                  variant="ghost"
                  disabled={!isDirty || mutation.isPending}
                  onClick={handleDiscard}
                >
                  {__('Discard changes', 'veridis-news-desk')}
                </VeridisButton>
                <VeridisButton
                  type="submit"
                  disabled={!isDirty || mutation.isPending}
                >
                  {mutation.isPending ? __('Saving…', 'veridis-news-desk') : __('Save settings', 'veridis-news-desk')}
                </VeridisButton>
              </div>
            </div>
          )}
        </form>
      )}

      {/* Unsaved Changes Confirmation Modal for Tab Navigation */}
      <VeridisModal
        open={pendingNavigation !== null}
        onClose={handleStay}
        title={__('Unsaved changes', 'veridis-news-desk')}
        footer={
          <div className="vnd-unsaved-modal-footer">
            <VeridisButton
              type="button"
              variant="ghost"
              disabled={mutation.isPending}
              onClick={handleLeaveWithoutSaving}
            >
              {__('Leave without saving', 'veridis-news-desk')}
            </VeridisButton>
            <div className="vnd-unsaved-modal-footer-right">
              <VeridisButton
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
                onClick={handleStay}
              >
                {__('Stay', 'veridis-news-desk')}
              </VeridisButton>
              <VeridisButton
                type="button"
                variant="primary"
                disabled={mutation.isPending}
                onClick={handleSaveAndLeave}
              >
                {mutation.isPending ? __('Saving…', 'veridis-news-desk') : __('Save and leave', 'veridis-news-desk')}
              </VeridisButton>
            </div>
          </div>
        }
      >
        <p>{__('You have unsaved changes to your News Desk settings.', 'veridis-news-desk')}</p>
        <p style={{ color: 'var(--vnd-muted)', fontSize: '13px', marginTop: '6px' }}>
          {__('Choose whether to save your changes before leaving this page.', 'veridis-news-desk')}
        </p>
      </VeridisModal>
    </>
  );
}
