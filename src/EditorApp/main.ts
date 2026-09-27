import './editor.css';
import type {
  AssigneeOption,
  EditorialArticleData,
  EditorialStatusValue,
  PriorityValue,
  UpdateEditorialPayload,
  VeridisEditorConfig,
} from './types';
import { resolveEditorReturnUrl } from './returnUrl';

function initEditorMode() {
  const wp = window.wp;
  const config = window.veridisEditorMode as VeridisEditorConfig | undefined;

  if (!wp?.plugins?.registerPlugin || !wp?.element || !config?.postId) {
    return;
  }

  const { createElement: el, useState, useEffect, useRef, useMemo, useCallback, createPortal } = wp.element;
  const { registerPlugin } = wp.plugins;
  const editorPkg = wp.editor || wp.editPost;
  const { PluginSidebar, PluginMoreMenuItem } = editorPkg || {};
  const __ = wp.i18n?.__ ?? ((text: string) => text);
  const _x = wp.i18n?._x ?? ((text: string) => text);

  function discardCurrentPostEdits(): boolean {
    try {
      const coreDispatch = wp.data?.dispatch('core');
      const editorSelect = wp.data?.select('core/editor');

      const postType = editorSelect?.getCurrentPostType?.() || 'post';
      const postId = editorSelect?.getCurrentPostId?.() || config?.postId;

      // Discard ONLY the current post's unsaved local entity edits using stable public API
      if (postType && postId && coreDispatch?.clearEntityRecordEdits) {
        coreDispatch.clearEntityRecordEdits('postType', postType, postId);
      }

      const isStillDirty = editorSelect?.isEditedPostDirty?.() ?? false;
      if (isStillDirty) {
        console.warn(
          '[Veridis Editor Mode] Current post remains dirty after clearing local entity edits.',
          { postType, postId }
        );
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Veridis Editor Mode] Failed to clear current post edits cleanly:', err);
      return false;
    }
  }

  function syncUrlWithEditorMode() {
    try {
      const currentUrl = new URL(window.location.href);
      let updated = false;

      if (currentUrl.searchParams.get('vnd_mode') !== 'editor') {
        currentUrl.searchParams.set('vnd_mode', 'editor');
        updated = true;
      }

      const returnUrl = config?.returnUrl;
      if (returnUrl && !currentUrl.searchParams.has('vnd_return')) {
        currentUrl.searchParams.set('vnd_return', returnUrl);
        updated = true;
      }

      if (updated) {
        window.history.replaceState(window.history.state, document.title, currentUrl.toString());
      }
    } catch {
      // ignore
    }
  }

  function executeLeave(discardGutenberg = false): boolean {
    if (discardGutenberg) {
      const discarded = discardCurrentPostEdits();
      if (!discarded) {
        return false;
      }
    }

    let sessionReturn: string | null = null;

    // Check sessionStorage fallback
    try {
      sessionReturn = sessionStorage.getItem('vnd_editor_return');
    } catch {
      // sessionStorage unavailable
    }

    const targetUrl = resolveEditorReturnUrl({
      adminUrl: config?.adminUrl ?? '',
      returnUrl: config?.returnUrl,
      sessionReturn,
    });

    // Clear session storage on confirmed exit
    try {
      sessionStorage.removeItem(`vnd_editor_active_${config?.postId}`);
      sessionStorage.removeItem('vnd_editor_return');
    } catch {
      // ignore
    }

    window.location.href = targetUrl;
    return true;
  }

  function formatDeadlineDisplay(val: string): string {
    if (!val) {
      return __('Set deadline…', 'veridis-news-desk');
    }
    try {
      const [datePart, timePart] = val.split('T');
      if (datePart && timePart) {
        const [y, m, d] = datePart.split('-');
        const [hh, mm] = timePart.split(':');
        if (y && m && d && hh && mm) {
          return `${d}/${m}/${y}, ${hh}:${mm}`;
        }
      }
    } catch {
      // fallback
    }
    return val;
  }

  const MONTH_NAMES = [
    __('January', 'veridis-news-desk'),
    __('February', 'veridis-news-desk'),
    __('March', 'veridis-news-desk'),
    __('April', 'veridis-news-desk'),
    __('May', 'veridis-news-desk'),
    __('June', 'veridis-news-desk'),
    __('July', 'veridis-news-desk'),
    __('August', 'veridis-news-desk'),
    __('September', 'veridis-news-desk'),
    __('October', 'veridis-news-desk'),
    __('November', 'veridis-news-desk'),
    __('December', 'veridis-news-desk'),
  ];

  const WEEKDAY_NAMES = [
    _x('Mo', 'Monday abbreviation', 'veridis-news-desk'),
    _x('Tu', 'Tuesday abbreviation', 'veridis-news-desk'),
    _x('We', 'Wednesday abbreviation', 'veridis-news-desk'),
    _x('Th', 'Thursday abbreviation', 'veridis-news-desk'),
    _x('Fr', 'Friday abbreviation', 'veridis-news-desk'),
    _x('Sa', 'Saturday abbreviation', 'veridis-news-desk'),
    _x('Su', 'Sunday abbreviation', 'veridis-news-desk'),
  ];

  function pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  // --- Veridis Deadline Modal (Compact Centered Dialog) ---
  function VeridisDeadlineModal({
    open,
    value,
    onSet,
    onClear,
    onClose,
    triggerElement,
  }: {
    open: boolean;
    value: string;
    onSet: (val: string) => void;
    onClear: () => void;
    onClose: () => void;
    triggerElement?: HTMLElement | null;
  }) {
    const dialogRef = useRef(null as HTMLDialogElement | null);
    const initialFocusRef = useRef(null as HTMLElement | null);

    // Parse initial date & time from value or default to now
    const parsedInitial = useMemo(() => {
      const now = new Date();
      let y = now.getFullYear();
      let m = now.getMonth();
      let dStr = `${y}-${pad2(m + 1)}-${pad2(now.getDate())}`;
      let h = 18;
      let min = 0;

      if (value) {
        try {
          const [dPart, tPart] = value.split('T');
          if (dPart) {
            const [py, pm, pd] = dPart.split('-').map(Number);
            if (py && pm && pd) {
              y = py;
              m = pm - 1;
              dStr = `${py}-${pad2(pm)}-${pad2(pd)}`;
            }
          }
          if (tPart) {
            const [ph, pmin] = tPart.split(':').map(Number);
            if (!isNaN(ph)) h = Math.max(0, Math.min(23, ph));
            if (!isNaN(pmin)) min = Math.max(0, Math.min(59, pmin));
          }
        } catch {
          // ignore
        }
      }
      return { year: y, month: m, dateStr: dStr, hour: h, minute: min };
    }, [value, open]);

    const [viewYear, setViewYear] = useState(parsedInitial.year);
    const [viewMonth, setViewMonth] = useState(parsedInitial.month);
    const [selectedDate, setSelectedDate] = useState(parsedInitial.dateStr);
    const [selectedHour, setSelectedHour] = useState(parsedInitial.hour);
    const [selectedMinute, setSelectedMinute] = useState(parsedInitial.minute);

    // Synchronize internal state when modal opens
    useEffect(() => {
      if (open) {
        setViewYear(parsedInitial.year);
        setViewMonth(parsedInitial.month);
        setSelectedDate(parsedInitial.dateStr);
        setSelectedHour(parsedInitial.hour);
        setSelectedMinute(parsedInitial.minute);
      }
    }, [open, parsedInitial]);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (open) {
        if (!dialog.open) {
          dialog.showModal();
        }
        initialFocusRef.current?.focus({ preventScroll: true });
      } else {
        if (dialog.open) {
          dialog.close();
        }
        triggerElement?.focus?.({ preventScroll: true });
      }
    }, [open, triggerElement]);

    if (!open) return null;

    const handlePrevMonth = () => {
      if (viewMonth === 0) {
        setViewYear((y: number) => y - 1);
        setViewMonth(11);
      } else {
        setViewMonth((m: number) => m - 1);
      }
    };

    const handleNextMonth = () => {
      if (viewMonth === 11) {
        setViewYear((y: number) => y + 1);
        setViewMonth(0);
      } else {
        setViewMonth((m: number) => m + 1);
      }
    };

    // Calculate calendar grid days
    const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const calendarCells: Array<{ day: number; currentMonth: boolean; dateStr: string }> = [];

    // Prev month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 12 : viewMonth;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      calendarCells.push({ day: d, currentMonth: false, dateStr: `${y}-${pad2(m)}-${pad2(d)}` });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      calendarCells.push({ day: d, currentMonth: true, dateStr: `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}` });
    }

    // Next month leading days (fill row to multiple of 7)
    const remainder = (7 - (calendarCells.length % 7)) % 7;
    for (let d = 1; d <= remainder; d++) {
      const m = viewMonth === 11 ? 1 : viewMonth + 2;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      calendarCells.push({ day: d, currentMonth: false, dateStr: `${y}-${pad2(m)}-${pad2(d)}` });
    }

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

    const handleSave = (e: Event) => {
      e.preventDefault();
      const targetDate = selectedDate || todayStr;
      const finalVal = `${targetDate}T${pad2(selectedHour)}:${pad2(selectedMinute)}`;
      onSet(finalVal);
      onClose();
    };

    const handleClear = () => {
      onClear();
      onClose();
    };

    const dialogNode = el(
      'dialog',
      {
        ref: dialogRef,
        className: 'vnd-deadline-modal',
        'aria-labelledby': 'vnd-deadline-title',
        onCancel: (e: Event) => {
          e.preventDefault();
          onClose();
        },
        onClick: (e: MouseEvent) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        },
      },
      el(
        'div',
        { className: 'vnd-deadline-modal-inner' },
        // Header: Title & Close
        el(
          'header',
          { className: 'vnd-deadline-modal-header' },
          el('h3', { id: 'vnd-deadline-title' }, __('Set Deadline', 'veridis-news-desk')),
          el(
            'button',
            {
              type: 'button',
              className: 'vnd-editor-modal-close',
              onClick: onClose,
              'aria-label': __('Close deadline dialog', 'veridis-news-desk'),
            },
            el(
              'svg',
              { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': 'true' },
              el('path', {
                d: 'M1 1L13 13M13 1L1 13',
                stroke: 'currentColor',
                strokeWidth: 1.75,
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              })
            )
          )
        ),

        // Body: Month Navigation, Calendar, Time
        el(
          'div',
          { className: 'vnd-deadline-modal-body' },
          // Month navigation bar
          el(
            'div',
            { className: 'vnd-deadline-month-nav' },
            el(
              'button',
              {
                type: 'button',
                className: 'vnd-deadline-nav-btn',
                onClick: handlePrevMonth,
                'aria-label': __('Previous month', 'veridis-news-desk'),
              },
              el(
                'svg',
                { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                el('polyline', { points: '15 18 9 12 15 6' })
              )
            ),
            el('span', { className: 'vnd-deadline-month-label' }, `${MONTH_NAMES[viewMonth]} ${viewYear}`),
            el(
              'button',
              {
                type: 'button',
                className: 'vnd-deadline-nav-btn',
                onClick: handleNextMonth,
                'aria-label': __('Next month', 'veridis-news-desk'),
              },
              el(
                'svg',
                { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' },
                el('polyline', { points: '9 18 15 12 9 6' })
              )
            )
          ),

          // Weekdays header
          el(
            'div',
            { className: 'vnd-deadline-weekdays', 'aria-hidden': 'true' },
            WEEKDAY_NAMES.map((wd, idx) => el('span', { key: idx, className: 'vnd-deadline-weekday' }, wd))
          ),

          // Calendar Days Grid
          el(
            'div',
            { className: 'vnd-deadline-grid', role: 'grid', 'aria-label': __('Calendar days', 'veridis-news-desk') },
            calendarCells.map((cell) => {
              const isSelected = selectedDate === cell.dateStr;
              const isToday = cell.dateStr === todayStr;
              const classNames = [
                'vnd-deadline-day',
                !cell.currentMonth && 'is-outside',
                isSelected && 'is-selected',
                isToday && 'is-today',
              ]
                .filter(Boolean)
                .join(' ');

              return el(
                'button',
                {
                  key: cell.dateStr,
                  type: 'button',
                  className: classNames,
                  'aria-label': cell.dateStr,
                  'aria-selected': isSelected,
                  onClick: () => {
                    setSelectedDate(cell.dateStr);
                    if (!cell.currentMonth) {
                      const [cy, cm] = cell.dateStr.split('-').map(Number);
                      setViewYear(cy);
                      setViewMonth(cm - 1);
                    }
                  },
                },
                cell.day
              );
            })
          ),

          // Redesigned 24-hour Time Section
          el(
            'div',
            { className: 'vnd-deadline-time-section' },
            el('div', { className: 'vnd-deadline-time-title' }, __('Time (24h)', 'veridis-news-desk')),
            el(
              'div',
              { className: 'vnd-deadline-time-picker' },
              el(
                'div',
                { className: 'vnd-deadline-time-column' },
                el('input', {
                  type: 'number',
                  min: 0,
                  max: 23,
                  className: 'vnd-deadline-time-input',
                  value: pad2(selectedHour),
                  'aria-label': __('Hour', 'veridis-news-desk'),
                  onChange: (e: any) => {
                    let v = parseInt(e.target.value, 10);
                    if (isNaN(v)) v = 0;
                    setSelectedHour(Math.max(0, Math.min(23, v)));
                  },
                }),
                el('span', { className: 'vnd-deadline-time-sublabel' }, __('Hour', 'veridis-news-desk'))
              ),
              el('span', { className: 'vnd-deadline-time-colon', 'aria-hidden': 'true' }, ':'),
              el(
                'div',
                { className: 'vnd-deadline-time-column' },
                el('input', {
                  type: 'number',
                  min: 0,
                  max: 59,
                  step: 5,
                  className: 'vnd-deadline-time-input',
                  value: pad2(selectedMinute),
                  'aria-label': __('Minute', 'veridis-news-desk'),
                  onChange: (e: any) => {
                    let v = parseInt(e.target.value, 10);
                    if (isNaN(v)) v = 0;
                    setSelectedMinute(Math.max(0, Math.min(59, v)));
                  },
                }),
                el('span', { className: 'vnd-deadline-time-sublabel' }, __('Minute', 'veridis-news-desk'))
              )
            )
          )
        ),

        // Footer: Clear, Cancel, Set deadline
        el(
          'footer',
          { className: 'vnd-deadline-modal-footer' },
          value
            ? el(
                'button',
                {
                  type: 'button',
                  className: 'vnd-deadline-btn-clear',
                  onClick: handleClear,
                },
                __('Clear deadline', 'veridis-news-desk')
              )
            : el('span', null),
          el(
            'div',
            { className: 'vnd-deadline-footer-actions' },
            el(
              'button',
              {
                ref: initialFocusRef,
                type: 'button',
                className: 'vnd-editor-modal-btn vnd-editor-modal-btn--secondary',
                onClick: onClose,
              },
              __('Cancel', 'veridis-news-desk')
            ),
            el(
              'button',
              {
                type: 'button',
                className: 'vnd-editor-modal-btn vnd-editor-modal-btn--primary-save',
                onClick: handleSave,
              },
              __('Set deadline', 'veridis-news-desk')
            )
          )
        )
      )
    );

    return createPortal ? createPortal(dialogNode, document.body) : dialogNode;
  }

  // --- Upgraded Veridis Unsaved Changes Confirmation Modal ---
  function UnsavedChangesModal({
    open,
    isContentDirty,
    isEditorialDirty,
    error,
    isSaving,
    onStay,
    onLeaveWithoutSaving,
    onSaveAndLeave,
  }: {
    open: boolean;
    isContentDirty: boolean;
    isEditorialDirty: boolean;
    error?: string | null;
    isSaving?: boolean;
    onStay: () => void;
    onLeaveWithoutSaving: () => void;
    onSaveAndLeave: () => void;
  }) {
    const dialogRef = useRef(null as HTMLDialogElement | null);
    const triggerRef = useRef(null as HTMLElement | null);
    const primarySaveRef = useRef(null as HTMLButtonElement | null);

    useEffect(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (open) {
        triggerRef.current = document.activeElement as HTMLElement | null;
        if (!dialog.open) {
          dialog.showModal();
        }
        primarySaveRef.current?.focus({ preventScroll: true });
      } else {
        if (dialog.open) {
          dialog.close();
        }
        triggerRef.current?.focus?.({ preventScroll: true });
      }
    }, [open]);

    if (!open) {
      return null;
    }

    let contextMessage = __('You have unsaved changes.', 'veridis-news-desk');
    if (isContentDirty && isEditorialDirty) {
      contextMessage = __('You have unsaved article and editorial changes.', 'veridis-news-desk');
    } else if (isContentDirty) {
      contextMessage = __('You have unsaved article changes.', 'veridis-news-desk');
    } else if (isEditorialDirty) {
      contextMessage = __('You have unsaved editorial changes.', 'veridis-news-desk');
    }

    const dialogNode = el(
      'dialog',
      {
        ref: dialogRef,
        className: 'vnd-editor-modal',
        'aria-labelledby': 'vnd-unsaved-title',
        'aria-describedby': 'vnd-unsaved-desc',
        onCancel: (e: Event) => {
          e.preventDefault();
          if (!isSaving) onStay();
        },
        onClick: (e: MouseEvent) => {
          if (e.target === e.currentTarget && !isSaving) {
            onStay();
          }
        },
      },
      el(
        'div',
        { className: 'vnd-editor-modal-inner' },
        el(
          'header',
          { className: 'vnd-editor-modal-header' },
          el(
            'div',
            { className: 'vnd-editor-modal-title-group' },
            el(
              'span',
              { className: 'vnd-unsaved-icon-wrap', 'aria-hidden': 'true' },
              el(
                'svg',
                {
                  width: 16,
                  height: 16,
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                },
                el('path', {
                  d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
                }),
                el('line', { x1: 12, y1: 9, x2: 12, y2: 13 }),
                el('line', { x1: 12, y1: 17, x2: 12.01, y2: 17 })
              )
            ),
            el('h2', { id: 'vnd-unsaved-title' }, __('Unsaved changes', 'veridis-news-desk'))
          ),
          el(
            'button',
            {
              type: 'button',
              className: 'vnd-editor-modal-close',
              disabled: isSaving,
              onClick: onStay,
              'aria-label': __('Close dialog', 'veridis-news-desk'),
            },
            el(
              'svg',
              {
                width: '14',
                height: '14',
                viewBox: '0 0 14 14',
                fill: 'none',
                'aria-hidden': 'true',
              },
              el('path', {
                d: 'M1 1L13 13M13 1L1 13',
                stroke: 'currentColor',
                strokeWidth: '1.75',
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
              })
            )
          )
        ),
        el(
          'div',
          { className: 'vnd-editor-modal-body' },
          el('p', { id: 'vnd-unsaved-desc', className: 'vnd-unsaved-primary-msg' }, contextMessage),
          el(
            'p',
            { className: 'vnd-unsaved-secondary-msg' },
            __('Choose whether to save your work before leaving to the Newsroom.', 'veridis-news-desk')
          ),
          error && el('div', { className: 'vnd-editor-modal-error', role: 'alert' }, error)
        ),
        el(
          'footer',
          { className: 'vnd-editor-modal-footer' },
          el(
            'button',
            {
              type: 'button',
              className: 'vnd-editor-modal-btn vnd-editor-modal-btn--destructive',
              disabled: isSaving,
              onClick: onLeaveWithoutSaving,
            },
            __('Leave without saving', 'veridis-news-desk')
          ),
          el(
            'div',
            { className: 'vnd-editor-modal-footer-right' },
            el(
              'button',
              {
                type: 'button',
                className: 'vnd-editor-modal-btn vnd-editor-modal-btn--secondary',
                disabled: isSaving,
                onClick: onStay,
              },
              __('Stay in editor', 'veridis-news-desk')
            ),
            el(
              'button',
              {
                ref: primarySaveRef,
                type: 'button',
                className: 'vnd-editor-modal-btn vnd-editor-modal-btn--primary-save',
                disabled: isSaving,
                onClick: onSaveAndLeave,
              },
              isSaving ? __('Saving and leaving…', 'veridis-news-desk') : __('Save and leave', 'veridis-news-desk')
            )
          )
        )
      )
    );

    return createPortal ? createPortal(dialogNode, document.body) : dialogNode;
  }

  // --- Veridis News Desk Toast System (Editor Mode) ---
  interface Toast {
    id: number;
    message: string;
    tone: 'success' | 'error' | 'info' | 'warning';
  }

  function toneLabel(tone: string): string {
    const labels: Record<string, string> = {
      success: _x('Success', 'toast type', 'veridis-news-desk'),
      info: _x('Info', 'toast type', 'veridis-news-desk'),
      warning: _x('Warning', 'toast type', 'veridis-news-desk'),
      error: _x('Error', 'toast type', 'veridis-news-desk'),
    };
    return labels[tone] || tone;
  }

  function VeridisToastItem({
    toast,
    onDismiss,
  }: {
    toast: Toast;
    onDismiss: (id: number) => void;
  }) {
    const [paused, setPaused] = useState(false);

    useEffect(() => {
      if (paused || toast.tone === 'error' || toast.tone === 'warning') return;
      const timer = window.setTimeout(() => onDismiss(toast.id), 6000);
      return () => window.clearTimeout(timer);
    }, [paused, toast.id, toast.tone, onDismiss]);

    return el(
      'div',
      {
        className: `vnd-toast vnd-tone--${toast.tone}`,
        role: toast.tone === 'error' ? 'alert' : 'status',
        onMouseEnter: () => setPaused(true),
        onMouseLeave: () => setPaused(false),
        onFocus: () => setPaused(true),
        onBlur: (event: FocusEvent) => {
          if (!event.currentTarget || !(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
            setPaused(false);
          }
        },
      },
      el(
        'span',
        null,
        el('strong', null, toneLabel(toast.tone)),
        toast.message
      ),
      el(
        'button',
        {
          type: 'button',
          className: 'vnd-toast-dismiss',
          'aria-label': __('Dismiss notification', 'veridis-news-desk'),
          onClick: () => onDismiss(toast.id),
        },
        '×'
      )
    );
  }

  function VeridisToastContainer({
    toasts,
    onDismiss,
  }: {
    toasts: Toast[];
    onDismiss: (id: number) => void;
  }) {
    if (!toasts.length || typeof document === 'undefined') return null;

    const portal = wp.element.createPortal || createPortal;
    const content = el(
      'div',
      {
        className: 'vnd-toasts',
        'aria-label': __('Notifications', 'veridis-news-desk'),
      },
      toasts.map((toast) =>
        el(VeridisToastItem, {
          key: toast.id,
          toast,
          onDismiss,
        })
      )
    );

    return portal ? portal(content, document.body) : content;
  }

  function EditorialSidebarContent({
    onBack,
    onDirtyChange,
    onNotify,
    onRegisterSave,
  }: {
    onBack: () => void;
    onDirtyChange: (dirty: boolean) => void;
    onNotify: (message: string, tone: 'success' | 'error' | 'info') => void;
    onRegisterSave: (saveFn: () => Promise<boolean>) => void;
  }) {
    const [article, setArticle] = useState(null as EditorialArticleData | null);
    const [assignees, setAssignees] = useState([] as AssigneeOption[]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null as string | null);
    const [canEdit, setCanEdit] = useState(config?.canEditEditorial ?? true);

    // Editable form state
    const [editorialStatus, setEditorialStatus] = useState('writing' as EditorialStatusValue);
    const [assignedTo, setAssignedTo] = useState(0 as number);
    const [deadline, setDeadline] = useState('' as string);
    const [priority, setPriority] = useState('normal' as PriorityValue);

    // Deadline modal state
    const [showDeadlineModal, setShowDeadlineModal] = useState(false);
    const deadlineToggleRef = useRef(null as HTMLButtonElement | null);

    // Save state
    const [saving, setSaving] = useState(false);

    // Initial Load: Article and Assignee Options
    useEffect(() => {
      let active = true;
      if (!wp.apiFetch) {
        setLoading(false);
        return;
      }

      const loadArticle = wp
        .apiFetch({ path: `/veridis-news/v1/articles/${config?.postId}` })
        .then((data: unknown) => {
          if (!active) return;
          const art = data as EditorialArticleData;
          setArticle(art);
          setEditorialStatus((art.editorialStatus as EditorialStatusValue) || 'writing');
          setAssignedTo(typeof art.assignedTo === 'number' ? art.assignedTo : 0);
          setPriority((art.priority as PriorityValue) || 'normal');
          setDeadline(art.deadlineLocal || '');
        })
        .catch((err: Error & { status?: number }) => {
          if (!active) return;
          if (err?.status === 401 || err?.status === 403) {
            setCanEdit(false);
          }
          setError(err?.message || __('Failed to load editorial metadata.', 'veridis-news-desk'));
        });

      const loadOptions = wp
        .apiFetch({ path: '/veridis-news/v1/newsroom/options' })
        .then((data: unknown) => {
          if (!active) return;
          const res = data as { assignees?: AssigneeOption[] };
          if (Array.isArray(res?.assignees)) {
            setAssignees(res.assignees);
          }
        })
        .catch((err: unknown) => {
          if (!active) return;
          console.warn('[Veridis Editor Mode] Failed to load assignee options:', err);
        });

      Promise.allSettled([loadArticle, loadOptions]).finally(() => {
        if (active) {
          setLoading(false);
        }
      });

      return () => {
        active = false;
      };
    }, []);

    // Track Form Dirtiness
    const isDirty = useMemo(() => {
      if (!article) return false;
      const initialStatus = (article.editorialStatus as EditorialStatusValue) || 'writing';
      const initialAssigned = typeof article.assignedTo === 'number' ? article.assignedTo : 0;
      const initialPriority = (article.priority as PriorityValue) || 'normal';
      const initialDeadline = article.deadlineLocal || '';

      return (
        editorialStatus !== initialStatus ||
        assignedTo !== initialAssigned ||
        priority !== initialPriority ||
        (deadline || '') !== (initialDeadline || '')
      );
    }, [article, editorialStatus, assignedTo, priority, deadline]);

    useEffect(() => {
      onDirtyChange(isDirty);
    }, [isDirty, onDirtyChange]);

    // Reusable Editorial Save logic (used by explicit Save button & Save-and-Leave)
    const performEditorialSave = useCallback(async (): Promise<boolean> => {
      if (!canEdit) {
        onNotify(__('You do not have permission to edit editorial details.', 'veridis-news-desk'), 'error');
        return false;
      }

      setSaving(true);

      try {
        const payload: UpdateEditorialPayload = {
          editorialStatus,
          assignedTo: Number(assignedTo),
          deadline: deadline ? deadline : null,
          priority,
        };

        const updated = (await wp.apiFetch({
          path: `/veridis-news/v1/articles/${config?.postId}/editorial`,
          method: 'PATCH',
          data: payload,
        })) as EditorialArticleData;

        // Canonical server response updates baseline AND current form values
        setArticle(updated);
        setEditorialStatus((updated.editorialStatus as EditorialStatusValue) || 'writing');
        setAssignedTo(typeof updated.assignedTo === 'number' ? updated.assignedTo : 0);
        setPriority((updated.priority as PriorityValue) || 'normal');
        setDeadline(updated.deadlineLocal || '');

        return true;
      } catch (err: unknown) {
        const errorObj = err as { message?: string; status?: number };
        if (errorObj?.status === 401 || errorObj?.status === 403) {
          setCanEdit(false);
        }
        const errMsg =
          errorObj?.message || __('Could not update editorial details. Please try again.', 'veridis-news-desk');
        onNotify(errMsg, 'error');
        return false;
      } finally {
        setSaving(false);
      }
    }, [canEdit, editorialStatus, assignedTo, deadline, priority, onNotify]);

    // Register save callback with parent extension
    useEffect(() => {
      onRegisterSave(performEditorialSave);
    }, [performEditorialSave, onRegisterSave]);

    // Explicit Save Button Handler
    const handleExplicitSave = async (e?: Event) => {
      e?.preventDefault?.();
      if (!isDirty || saving || !canEdit) return;

      const success = await performEditorialSave();
      if (success) {
        onNotify(__('Editorial details updated.', 'veridis-news-desk'), 'success');
      }
    };

    const statusTone = editorialStatus || 'writing';
    const priorityTone = priority || 'normal';

    const statusLabels: Record<EditorialStatusValue, string> = {
      idea: __('Idea', 'veridis-news-desk'),
      writing: __('Writing', 'veridis-news-desk'),
      review: __('Review', 'veridis-news-desk'),
      ready: __('Ready', 'veridis-news-desk'),
    };

    const priorityLabels: Record<PriorityValue, string> = {
      low: __('Low', 'veridis-news-desk'),
      normal: __('Normal', 'veridis-news-desk'),
      high: __('High', 'veridis-news-desk'),
      urgent: __('Urgent', 'veridis-news-desk'),
    };

    return el(
      'div',
      { className: 'vnd-editor-sidebar' },
      // Back to Newsroom Button
      el(
        'button',
        {
          type: 'button',
          className: 'vnd-editor-back-btn',
          onClick: onBack,
          'aria-label': __('Back to Newsroom', 'veridis-news-desk'),
        },
        el('span', { 'aria-hidden': 'true' }, '←'),
        el('span', null, __('Back to Newsroom', 'veridis-news-desk'))
      ),

      // Meta Header (Article ID)
      el(
        'div',
        { className: 'vnd-editor-meta-header' },
        el('span', { className: 'vnd-editor-article-id' }, `Article #${config?.postId}`)
      ),

      // Permission Warning Notice
      !canEdit &&
        el(
          'div',
          { className: 'vnd-editor-perm-notice', role: 'note' },
          __('You do not have permission to edit editorial details.', 'veridis-news-desk')
        ),

      // Skeleton Loader
      loading &&
        el(
          'div',
          { className: 'vnd-editor-skeleton-group', 'aria-busy': 'true' },
          el(
            'div',
            { className: 'vnd-editor-skeleton-item' },
            el('div', { className: 'vnd-editor-skeleton-label' }),
            el('div', { className: 'vnd-editor-skeleton-input' })
          ),
          el(
            'div',
            { className: 'vnd-editor-skeleton-item' },
            el('div', { className: 'vnd-editor-skeleton-label' }),
            el('div', { className: 'vnd-editor-skeleton-input' })
          ),
          el(
            'div',
            { className: 'vnd-editor-skeleton-item' },
            el('div', { className: 'vnd-editor-skeleton-label' }),
            el('div', { className: 'vnd-editor-skeleton-input' })
          ),
          el(
            'div',
            { className: 'vnd-editor-skeleton-item' },
            el('div', { className: 'vnd-editor-skeleton-label' }),
            el('div', { className: 'vnd-editor-skeleton-input' })
          )
        ),

      // Initial Error
      error && !loading && el('div', { className: 'vnd-editor-error', role: 'alert' }, error),

      // Editable Editorial Controls
      !loading &&
        !error &&
        el(
          'form',
          { onSubmit: handleExplicitSave },
          // 1. Editorial Status
          el(
            'div',
            { className: 'vnd-editor-field' },
            el(
              'div',
              { className: 'vnd-editor-field-header' },
              el('label', { htmlFor: 'vnd-editor-status', className: 'vnd-editor-label' }, __('Editorial Status', 'veridis-news-desk')),
              el(
                'span',
                { className: `vnd-editor-badge vnd-editor-badge--${statusTone}` },
                statusLabels[editorialStatus as EditorialStatusValue] || editorialStatus
              )
            ),
            el(
              'select',
              {
                id: 'vnd-editor-status',
                className: 'vnd-editor-select',
                value: editorialStatus,
                disabled: !canEdit || saving,
                onChange: (e: Event) => {
                  setEditorialStatus((e.target as HTMLSelectElement).value as EditorialStatusValue);
                },
              },
              el('option', { value: 'idea' }, __('Idea', 'veridis-news-desk')),
              el('option', { value: 'writing' }, __('Writing', 'veridis-news-desk')),
              el('option', { value: 'review' }, __('Review', 'veridis-news-desk')),
              el('option', { value: 'ready' }, __('Ready to publish', 'veridis-news-desk'))
            )
          ),

          // 2. Assignee
          el(
            'div',
            { className: 'vnd-editor-field' },
            el(
              'div',
              { className: 'vnd-editor-field-header' },
              el('label', { htmlFor: 'vnd-editor-assignee', className: 'vnd-editor-label' }, __('Assignee', 'veridis-news-desk'))
            ),
            el(
              'select',
              {
                id: 'vnd-editor-assignee',
                className: 'vnd-editor-select',
                value: assignedTo,
                disabled: !canEdit || saving,
                onChange: (e: Event) => {
                  setAssignedTo(Number((e.target as HTMLSelectElement).value));
                },
              },
              assignees.map((assignee: AssigneeOption) => el('option', { key: assignee.id, value: assignee.id }, assignee.name)),
              assignedTo > 0 &&
                !assignees.some((assignee: AssigneeOption) => assignee.id === assignedTo) &&
                el('option', { key: assignedTo, value: assignedTo }, article?.assignedName || `User #${assignedTo}`)
            )
          ),

          // 3. Deadline (Veridis Custom Modal Trigger)
          el(
            'div',
            { className: 'vnd-editor-field' },
            el(
              'div',
              { className: 'vnd-editor-field-header' },
              el('label', { id: 'vnd-editor-deadline-label', htmlFor: 'vnd-editor-deadline', className: 'vnd-editor-label' }, __('Deadline', 'veridis-news-desk')),
              article?.isOverdue &&
                el(
                  'span',
                  { className: 'vnd-editor-badge vnd-editor-badge--overdue' },
                  __('Overdue', 'veridis-news-desk')
                )
            ),
            el(
              'div',
              { className: 'vnd-editor-deadline-control-row' },
              el(
                'button',
                {
                  ref: deadlineToggleRef,
                  type: 'button',
                  id: 'vnd-editor-deadline',
                  className: `vnd-editor-deadline-toggle ${!deadline ? 'is-empty' : ''}`,
                  disabled: !canEdit || saving,
                  onClick: () => setShowDeadlineModal(true),
                  'aria-haspopup': 'dialog',
                  'aria-expanded': showDeadlineModal,
                  'aria-labelledby': 'vnd-editor-deadline-label',
                },
                el('span', { className: 'vnd-editor-deadline-toggle-text' }, formatDeadlineDisplay(deadline)),
                el(
                  'svg',
                  {
                    className: 'vnd-editor-deadline-icon',
                    width: 15,
                    height: 15,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    'aria-hidden': 'true',
                  },
                  el('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, ry: 2 }),
                  el('line', { x1: 16, y1: 2, x2: 16, y2: 6 }),
                  el('line', { x1: 8, y1: 2, x2: 8, y2: 6 }),
                  el('line', { x1: 3, y1: 10, x2: 21, y2: 10 })
                )
              ),
              deadline &&
                el(
                  'button',
                  {
                    type: 'button',
                    className: 'vnd-editor-deadline-clear',
                    disabled: !canEdit || saving,
                    onClick: () => setDeadline(''),
                    title: __('Clear deadline', 'veridis-news-desk'),
                  },
                  __('Clear', 'veridis-news-desk')
                )
            ),
            // Custom Centered Veridis Deadline Modal
            el(VeridisDeadlineModal, {
              open: showDeadlineModal,
              value: deadline,
              onSet: (newVal: string) => setDeadline(newVal),
              onClear: () => setDeadline(''),
              onClose: () => setShowDeadlineModal(false),
              triggerElement: deadlineToggleRef.current,
            })
          ),

          // 4. Priority
          el(
            'div',
            { className: 'vnd-editor-field' },
            el(
              'div',
              { className: 'vnd-editor-field-header' },
              el('label', { htmlFor: 'vnd-editor-priority', className: 'vnd-editor-label' }, __('Priority', 'veridis-news-desk')),
              el(
                'span',
                { className: `vnd-editor-badge vnd-editor-badge--${priorityTone}` },
                priorityLabels[priority as PriorityValue] || priority
              )
            ),
            el(
              'select',
              {
                id: 'vnd-editor-priority',
                className: 'vnd-editor-select',
                value: priority,
                disabled: !canEdit || saving,
                onChange: (e: Event) => {
                  setPriority((e.target as HTMLSelectElement).value as PriorityValue);
                },
              },
              el('option', { value: 'low' }, __('Low', 'veridis-news-desk')),
              el('option', { value: 'normal' }, __('Normal', 'veridis-news-desk')),
              el('option', { value: 'high' }, __('High', 'veridis-news-desk')),
              el('option', { value: 'urgent' }, __('Urgent', 'veridis-news-desk'))
            )
          ),

          // Save Editorial Details Action
          canEdit &&
            el(
              'div',
              { className: 'vnd-editor-actions' },
              el(
                'button',
                {
                  type: 'submit',
                  className: 'vnd-editor-save-btn',
                  disabled: !isDirty || saving,
                },
                saving ? __('Saving…', 'veridis-news-desk') : __('Save editorial details', 'veridis-news-desk')
              )
            )
        )
    );
  }

  function VeridisEditorExtension() {
    const [editorialDirty, setEditorialDirty] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalContentDirty, setModalContentDirty] = useState(false);
    const [modalEditorialDirty, setModalEditorialDirty] = useState(false);
    const [modalError, setModalError] = useState(null as string | null);
    const [isSavingAndLeaving, setIsSavingAndLeaving] = useState(false);

    const editorialSaveRef = useRef(null as (() => Promise<boolean>) | null);

    // Toast notifications state
    const [toasts, setToasts] = useState([] as Toast[]);
    const toastSeq = useRef(0);

    const notify = useCallback((message: string, tone: 'success' | 'error' | 'info' = 'info') => {
      setToasts((cur: Toast[]) => [...cur.slice(-3), { id: ++toastSeq.current, message, tone }]);
    }, []);

    const dismissToast = useCallback((id: number) => {
      setToasts((cur: Toast[]) => cur.filter((t: Toast) => t.id !== id));
    }, []);

    const handleRegisterSave = useCallback((saveFn: () => Promise<boolean>) => {
      editorialSaveRef.current = saveFn;
    }, []);

    const handleRequestBack = () => {
      setModalError(null);
      setIsSavingAndLeaving(false);
      const isContentDirty = wp.data?.select('core/editor')?.isEditedPostDirty?.() ?? false;
      const isEditorialDirty = editorialDirty;

      if (isContentDirty || isEditorialDirty) {
        setModalContentDirty(isContentDirty);
        setModalEditorialDirty(isEditorialDirty);
        setShowModal(true);
      } else {
        executeLeave(false);
      }
    };

    const handleStay = () => {
      setModalError(null);
      setShowModal(false);
    };

    const handleLeaveWithoutSaving = () => {
      const isContentDirty = wp.data?.select('core/editor')?.isEditedPostDirty?.() ?? false;
      const navigated = executeLeave(isContentDirty);
      if (!navigated) {
        setModalError(
          __('Could not discard local edits. Please save your changes or try again.', 'veridis-news-desk')
        );
      } else {
        setShowModal(false);
      }
    };

    // Public Gutenberg save helper
    const performGutenbergSave = async (): Promise<boolean> => {
      try {
        const editorDispatch = wp.data?.dispatch('core/editor');
        const editorSelect = wp.data?.select('core/editor');
        if (!editorDispatch?.savePost) {
          return false;
        }

        await editorDispatch.savePost();

        if (editorSelect?.didPostSaveRequestFail?.()) {
          return false;
        }

        if (editorSelect?.isEditedPostDirty?.()) {
          return false;
        }

        return true;
      } catch (err) {
        console.error('[Veridis Editor Mode] Failed to save post via core/editor:', err);
        return false;
      }
    };

    // Upgraded "Save and leave" action
    const handleSaveAndLeave = async () => {
      if (isSavingAndLeaving) return;
      setIsSavingAndLeaving(true);
      setModalError(null);

      const isContentDirty = wp.data?.select('core/editor')?.isEditedPostDirty?.() ?? false;
      const isEditorialDirty = editorialDirty;

      try {
        // 1. If Gutenberg content is dirty, save it first
        if (isContentDirty) {
          const gutenbergOk = await performGutenbergSave();
          if (!gutenbergOk) {
            setIsSavingAndLeaving(false);
            const errMsg = __('Could not save article changes. Please try again.', 'veridis-news-desk');
            setModalError(errMsg);
            notify(errMsg, 'error');
            return;
          }
        }

        // 2. If editorial details are dirty, save them
        if (isEditorialDirty && editorialSaveRef.current) {
          const editorialOk = await editorialSaveRef.current();
          if (!editorialOk) {
            setIsSavingAndLeaving(false);
            const errMsg = isContentDirty
              ? __('Article saved, but editorial details could not be saved. Please try again.', 'veridis-news-desk')
              : __('Could not save editorial changes. Please try again.', 'veridis-news-desk');
            setModalError(errMsg);
            notify(errMsg, 'error');
            return;
          }
        }

        // Both saves confirmed! Navigate cleanly to Newsroom
        executeLeave(false);
      } catch (err) {
        setIsSavingAndLeaving(false);
        const errMsg = __('An unexpected error occurred while saving.', 'veridis-news-desk');
        setModalError(errMsg);
        notify(errMsg, 'error');
      }
    };

    return el(
      wp.element.Fragment,
      null,
      // 1. More Menu item (official public slot)
      PluginMoreMenuItem &&
        el(
          PluginMoreMenuItem,
          {
            icon: 'arrow-left-alt2',
            onClick: handleRequestBack,
          },
          __('← Back to Newsroom', 'veridis-news-desk')
        ),
      // 2. Official PluginSidebar
      PluginSidebar &&
        el(
          PluginSidebar,
          {
            name: 'veridis-editorial-sidebar',
            title: __('Veridis Editorial', 'veridis-news-desk'),
            icon: 'edit',
          },
          el(EditorialSidebarContent, {
            onBack: handleRequestBack,
            onDirtyChange: setEditorialDirty,
            onNotify: notify,
            onRegisterSave: handleRegisterSave,
          })
        ),
      // 3. Upgraded Veridis Unsaved Changes Confirmation Modal (portaled to document.body)
      el(UnsavedChangesModal, {
        open: showModal,
        isContentDirty: modalContentDirty,
        isEditorialDirty: modalEditorialDirty,
        error: modalError,
        isSaving: isSavingAndLeaving,
        onStay: handleStay,
        onLeaveWithoutSaving: handleLeaveWithoutSaving,
        onSaveAndLeave: handleSaveAndLeave,
      }),
      // 4. Veridis Toast Notifications (portaled to document.body)
      el(VeridisToastContainer, {
        toasts,
        onDismiss: dismissToast,
      })
    );
  }

  registerPlugin('veridis-editor-mode', {
    render: VeridisEditorExtension,
  });

  // Open sidebar automatically on load once DOM/store is ready
  if (wp.domReady) {
    wp.domReady(() => {
      setTimeout(() => {
        const sidebarAction =
          wp.data?.dispatch('core/editor')?.openGeneralSidebar ||
          wp.data?.dispatch('core/edit-post')?.openGeneralSidebar;
        if (sidebarAction) {
          sidebarAction('veridis-editor-mode/veridis-editorial-sidebar');
        }
      }, 250);
    });
  }

  // Record active Editor Mode session for this tab and post
  try {
    sessionStorage.setItem(
      `vnd_editor_active_${config.postId}`,
      JSON.stringify({ active: true, returnUrl: config.returnUrl })
    );
  } catch {
    // ignore
  }

  // Preserve Editor Mode query parameters against Gutenberg's BrowserURL component
  syncUrlWithEditorMode();
  setTimeout(syncUrlWithEditorMode, 150);
  setTimeout(syncUrlWithEditorMode, 400);
  setTimeout(syncUrlWithEditorMode, 800);
  setTimeout(syncUrlWithEditorMode, 1500);

  window.addEventListener('beforeunload', syncUrlWithEditorMode);

  if (wp.data?.subscribe) {
    let wasSaving = false;
    let wasAutosaving = false;

    wp.data.subscribe(() => {
      const editorSelect = wp.data.select('core/editor');
      if (!editorSelect) return;

      const isSaving = editorSelect.isSavingPost?.() ?? false;
      const isAutosaving = editorSelect.isAutosavingPost?.() ?? false;

      if ((wasSaving && !isSaving) || (wasAutosaving && !isAutosaving)) {
        setTimeout(syncUrlWithEditorMode, 350);
      }
      wasSaving = isSaving;
      wasAutosaving = isAutosaving;
    });
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEditorMode);
  } else {
    initEditorMode();
  }
}
