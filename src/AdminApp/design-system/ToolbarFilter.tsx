export interface ToolbarFilterOption {
  label: string;
  value: string;
}

export interface ToolbarFilterProps {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: [string, string][] | ToolbarFilterOption[];
  className?: string;
}

export function ToolbarFilter({
  label,
  value,
  disabled = false,
  onChange,
  options,
  className = '',
}: ToolbarFilterProps) {
  return (
    <label className={`vnd-filter ${className}`.trim()}>
      <span className="vnd-sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      >
        {options.map(opt => {
          const [optVal, optLabel] = Array.isArray(opt) ? opt : [opt.value, opt.label];
          return (
            <option value={optVal} key={optVal}>
              {optLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
