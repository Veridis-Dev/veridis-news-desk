import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import type { NewsroomItem, UpdateBreakingInput } from '../../types';
import { useUpdateBreaking } from '../../hooks/useUpdateBreaking';
import { useToast } from '../../design-system/VeridisToast';
import { VeridisButton } from '../../design-system/VeridisButton';
import { DateTimePicker } from '../DateTimePicker';

export function BreakingEditor({ article, mode = 'edit', onDone }: { article: NewsroomItem; mode?: 'create' | 'edit'; onDone: () => void }) {
  const b = article.breaking;
  const initial = { active: b.active, label: b.label, priority: b.priority, expiresAt: b.expiresAtLocal || '', homepageLead: b.homepageLead };
  const [form, setForm] = useState({ ...initial, active: true });
  const [preset, setPreset] = useState('');
  const mutation = useUpdateBreaking(article.id);
  const toast = useToast();
  const dirty = JSON.stringify(form) !== JSON.stringify(initial) || !!preset;
  const invalid = !form.label.trim() || Array.from(form.label.trim()).length > 40;
  return <form className="vnd-editorial-form vnd-breaking-editor" onSubmit={async event => {
    event.preventDefault();
    if (invalid) return;
    try {
      await mutation.mutateAsync({ ...form, expiresAt: form.expiresAt || null, ...(preset ? { expiryPreset: preset } : {}) });
      toast(__('Breaking coverage saved.', 'veridis-news-desk'), 'success');
      onDone();
    } catch { /* Inline mutation error. */ }
  }}>
    <div className="vnd-breaking-editor-heading"><h3>{__('Breaking details', 'veridis-news-desk')}</h3><p>{__('Configure how this coverage appears across the newsroom.', 'veridis-news-desk')}</p></div>
    {!['publish', 'future'].includes(article.status) && <p className="vnd-form-error">{__('This article is not published or scheduled. Breaking does not publish it.', 'veridis-news-desk')}</p>}
    <fieldset disabled={mutation.isPending}>
      {mode === 'edit' && <label className="vnd-breaking-check"><input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />{__('Active', 'veridis-news-desk')}</label>}
      <div className="vnd-form-grid">
        <label className="vnd-form-field"><span>{__('Label', 'veridis-news-desk')}</span><input required value={form.label} maxLength={40} onChange={e => setForm({ ...form, label: e.target.value })} aria-invalid={invalid} /></label>
        <label className="vnd-form-field"><span>{__('Priority', 'veridis-news-desk')}</span><select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as NonNullable<UpdateBreakingInput['priority']> })}><option value="standard">{__('Standard', 'veridis-news-desk')}</option><option value="high">{__('High', 'veridis-news-desk')}</option><option value="critical">{__('Critical', 'veridis-news-desk')}</option></select></label>
      </div>
      {invalid && <p role="alert">{__('Label must contain 1–40 characters.', 'veridis-news-desk')}</p>}
      <div className="vnd-form-field vnd-breaking-expiry">
        <span className="vnd-field-label">{__('Expiry — site timezone:', 'veridis-news-desk')} {b.timezone}</span>
        <DateTimePicker
          value={form.expiresAt || ''}
          onChange={val => { setPreset(''); setForm({ ...form, expiresAt: val }); }}
          disabled={mutation.isPending}
          ariaLabel={__('Expiry — site timezone:', 'veridis-news-desk')}
        />
      </div>
      <div><span className="vnd-field-label">{__('Presets', 'veridis-news-desk')}</span><div className="vnd-breaking-presets" aria-label={__('Expiry presets', 'veridis-news-desk')}>
        {([['30', __('30 min', 'veridis-news-desk')], ['60', __('1 hour', 'veridis-news-desk')], ['120', __('2 hours', 'veridis-news-desk')], ['240', __('4 hours', 'veridis-news-desk')], ['end_of_day', __('End of day', 'veridis-news-desk')], ['none', __('No expiry', 'veridis-news-desk')]]).map(([value, label]) => <VeridisButton key={value} variant="secondary" type="button" aria-pressed={preset === value} onClick={() => setPreset(value)}>{label}</VeridisButton>)}
      </div></div>
      {preset && <p role="status">{__('Selected preset will be applied at Save, in site time.', 'veridis-news-desk')}</p>}
      <label className="vnd-breaking-check"><input type="checkbox" checked={form.homepageLead} onChange={e => setForm({ ...form, homepageLead: e.target.checked })} />{__('Homepage lead', 'veridis-news-desk')}</label>
    </fieldset>
    {mutation.isError && <p className="vnd-form-error" role="alert">{mutation.error.message}</p>}
    <div className="vnd-editorial-form-actions vnd-breaking-form-actions">{dirty ? <span className="vnd-unsaved-indicator" role="status"><span className="vnd-unsaved-dot" aria-hidden="true" />{__('Unsaved changes', 'veridis-news-desk')}</span> : <span /> }<div className="vnd-editorial-actions-group"><VeridisButton type="button" variant="ghost" disabled={mutation.isPending} onClick={onDone}>{__('Cancel', 'veridis-news-desk')}</VeridisButton><VeridisButton type="submit" disabled={!dirty || invalid || mutation.isPending}>{mutation.isPending ? __('Saving…', 'veridis-news-desk') : __('Save Breaking', 'veridis-news-desk')}</VeridisButton></div></div>
  </form>;
}
