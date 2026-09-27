import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { __, _x } from '@wordpress/i18n';

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDeadlineDisplay(val: string, placeholder?: string): string {
  if (!val) {
    return placeholder || __('Set deadline…', 'veridis-news-desk');
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

export function DateTimePicker({
  value,
  onChange,
  disabled = false,
  id,
  ariaLabel,
  placeholder,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

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
      triggerRef.current?.focus?.({ preventScroll: true });
    }
  }, [open]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(y => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(y => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  // Calculate calendar grid days
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const calendarCells: Array<{ day: number; currentMonth: boolean; dateStr: string }> = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 12 : viewMonth;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarCells.push({ day: d, currentMonth: false, dateStr: `${y}-${pad2(m)}-${pad2(d)}` });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, currentMonth: true, dateStr: `${viewYear}-${pad2(viewMonth + 1)}-${pad2(d)}` });
  }

  const remainder = (7 - (calendarCells.length % 7)) % 7;
  for (let d = 1; d <= remainder; d++) {
    const m = viewMonth === 11 ? 1 : viewMonth + 2;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarCells.push({ day: d, currentMonth: false, dateStr: `${y}-${pad2(m)}-${pad2(d)}` });
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    const targetDate = selectedDate || todayStr;
    const finalVal = `${targetDate}T${pad2(selectedHour)}:${pad2(selectedMinute)}`;
    onChange(finalVal);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <div className="vnd-datetime-picker-wrapper">
      <div className="vnd-datetime-control-row">
        <button
          ref={triggerRef}
          type="button"
          id={id}
          className={`vnd-datetime-toggle ${!value ? 'is-empty' : ''}`}
          disabled={disabled}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={ariaLabel || __('Deadline', 'veridis-news-desk')}
        >
          <span className="vnd-datetime-toggle-text">
            {formatDeadlineDisplay(value, placeholder)}
          </span>
          <svg
            className="vnd-datetime-icon"
            width={15}
            height={15}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x={3} y={4} width={18} height={18} rx={2} ry={2} />
            <line x1={16} y1={2} x2={16} y2={6} />
            <line x1={8} y1={2} x2={8} y2={6} />
            <line x1={3} y1={10} x2={21} y2={10} />
          </svg>
        </button>

        {value && (
          <button
            type="button"
            className="vnd-datetime-clear-btn"
            disabled={disabled}
            onClick={() => onChange('')}
            title={__('Clear deadline', 'veridis-news-desk')}
          >
            {__('Clear', 'veridis-news-desk')}
          </button>
        )}
      </div>

      <dialog
        ref={dialogRef}
        className="vnd-deadline-modal"
        aria-labelledby={titleId}
        onCancel={e => {
          e.preventDefault();
          setOpen(false);
        }}
        onClick={e => {
          if (e.target === e.currentTarget) {
            setOpen(false);
          }
        }}
      >
        <div className="vnd-deadline-modal-inner">
          <header className="vnd-deadline-modal-header">
            <h3 id={titleId}>{__('Set Deadline', 'veridis-news-desk')}</h3>
            <button
              type="button"
              className="vnd-deadline-modal-close"
              onClick={() => setOpen(false)}
              aria-label={__('Close deadline dialog', 'veridis-news-desk')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </header>

          <div className="vnd-deadline-modal-body">
            {/* Month navigation bar */}
            <div className="vnd-deadline-month-nav">
              <button
                type="button"
                className="vnd-deadline-nav-btn"
                onClick={handlePrevMonth}
                aria-label={__('Previous month', 'veridis-news-desk')}
              >
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="vnd-deadline-month-label">
                {`${MONTH_NAMES[viewMonth]} ${viewYear}`}
              </span>
              <button
                type="button"
                className="vnd-deadline-nav-btn"
                onClick={handleNextMonth}
                aria-label={__('Next month', 'veridis-news-desk')}
              >
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Weekdays header */}
            <div className="vnd-deadline-weekdays" aria-hidden="true">
              {WEEKDAY_NAMES.map((wd, idx) => (
                <span key={idx} className="vnd-deadline-weekday">
                  {wd}
                </span>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div
              className="vnd-deadline-grid"
              role="grid"
              aria-label={__('Calendar days', 'veridis-news-desk')}
            >
              {calendarCells.map(cell => {
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

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    className={classNames}
                    aria-label={cell.dateStr}
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedDate(cell.dateStr);
                      if (!cell.currentMonth) {
                        const [cy, cm] = cell.dateStr.split('-').map(Number);
                        setViewYear(cy);
                        setViewMonth(cm - 1);
                      }
                    }}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {/* 24-hour Time Section */}
            <div className="vnd-deadline-time-section">
              <div className="vnd-deadline-time-title">
                {__('Time (24h)', 'veridis-news-desk')}
              </div>
              <div className="vnd-deadline-time-picker">
                <div className="vnd-deadline-time-column">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className="vnd-deadline-time-input"
                    value={pad2(selectedHour)}
                    aria-label={__('Hour', 'veridis-news-desk')}
                    onChange={e => {
                      let v = parseInt(e.target.value, 10);
                      if (isNaN(v)) v = 0;
                      setSelectedHour(Math.max(0, Math.min(23, v)));
                    }}
                  />
                  <span className="vnd-deadline-time-sublabel">
                    {__('Hour', 'veridis-news-desk')}
                  </span>
                </div>
                <span className="vnd-deadline-time-colon" aria-hidden="true">
                  :
                </span>
                <div className="vnd-deadline-time-column">
                  <input
                    type="number"
                    min={0}
                    max={59}
                    step={5}
                    className="vnd-deadline-time-input"
                    value={pad2(selectedMinute)}
                    aria-label={__('Minute', 'veridis-news-desk')}
                    onChange={e => {
                      let v = parseInt(e.target.value, 10);
                      if (isNaN(v)) v = 0;
                      setSelectedMinute(Math.max(0, Math.min(59, v)));
                    }}
                  />
                  <span className="vnd-deadline-time-sublabel">
                    {__('Minute', 'veridis-news-desk')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <footer className="vnd-deadline-modal-footer">
            {value ? (
              <button
                type="button"
                className="vnd-deadline-btn-clear"
                onClick={handleClear}
              >
                {__('Clear deadline', 'veridis-news-desk')}
              </button>
            ) : (
              <span />
            )}
            <div className="vnd-deadline-footer-actions">
              <button
                ref={initialFocusRef}
                type="button"
                className="vnd-deadline-modal-btn vnd-deadline-modal-btn--secondary"
                onClick={() => setOpen(false)}
              >
                {__('Cancel', 'veridis-news-desk')}
              </button>
              <button
                type="button"
                className="vnd-deadline-modal-btn vnd-deadline-modal-btn--primary"
                onClick={handleSave}
              >
                {__('Set deadline', 'veridis-news-desk')}
              </button>
            </div>
          </footer>
        </div>
      </dialog>
    </div>
  );
}
