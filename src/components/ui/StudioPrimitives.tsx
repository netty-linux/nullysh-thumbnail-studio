import React, { useState } from 'react';
import { Check, ChevronDown, Info, X } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-white border border-transparent hover:bg-[var(--accent-hover)] shadow-[0_1px_2px_rgba(0,0,0,0.45)]',
  secondary:
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  danger:
    'bg-transparent text-rose-400 border border-transparent hover:bg-rose-500/10 hover:text-rose-300',
  icon:
    'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5',
  md: 'h-8 px-3 text-xs gap-1.5',
  lg: 'h-9 px-3.5 text-[13px] gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) => {
  const sizeClass =
    variant === 'icon'
      ? size === 'sm'
        ? 'h-7 w-7 p-0'
        : size === 'lg'
        ? 'h-9 w-9 p-0'
        : 'h-8 w-8 p-0'
      : BUTTON_SIZES[size];

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] whitespace-nowrap shrink-0 cursor-pointer select-none transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none ${BUTTON_VARIANTS[variant]} ${sizeClass} ${className}`}
      {...props}
    />
  );
};

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  title?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  fullWidth?: boolean;
  scrollable?: boolean;
  tone?: 'surface' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fullWidth = false,
  scrollable = false,
  tone = 'surface',
  size = 'md',
  className = '',
}: SegmentedControlProps<T>) {
  const padClass = size === 'sm' ? 'h-7 px-1.5 text-[11px] gap-1' : 'h-7 px-2.5 text-xs gap-1.5';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-[var(--radius-md)] bg-[var(--bg-app)] border border-[var(--border-subtle)] ${
        fullWidth ? 'w-full' : ''
      } ${scrollable ? 'overflow-x-auto no-scrollbar max-w-full' : ''} ${className}`}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const activeClass =
          tone === 'accent'
            ? 'bg-[var(--accent)] text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
            : 'bg-[var(--bg-hover)] text-[var(--text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.35)] ring-1 ring-white/10';
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            title={opt.title}
            onClick={() => onChange(opt.value)}
            className={`inline-flex items-center justify-center font-medium rounded-[var(--radius-sm)] whitespace-nowrap shrink-0 cursor-pointer select-none tabular-nums transition-[background-color,color,box-shadow] duration-150 ${padClass} ${
              fullWidth ? 'flex-1 min-w-0' : ''
            } ${
              active
                ? activeClass
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]'
            }`}
          >
            {opt.icon}
            <span className="truncate">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface PresetChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  title?: string;
  rightSlot?: React.ReactNode;
  className?: string;
}

export const PresetChip: React.FC<PresetChipProps> = ({
  label,
  active = false,
  onClick,
  title,
  rightSlot,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-1 h-8 rounded-[var(--radius-md)] border transition-[background-color,border-color,color] duration-150 ${
        active
          ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
      } ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        title={title ?? label}
        className="flex-1 min-w-0 h-full px-2.5 text-xs font-medium text-left truncate cursor-pointer flex items-center gap-1.5"
      >
        {active && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-[var(--accent-text)] shrink-0"
          />
        )}
        <span className="truncate">{label}</span>
      </button>
      {rightSlot}
    </div>
  );
};

interface SliderFieldProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}) => {
  const pct = max === min ? 0 : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="text-[var(--text-secondary)] truncate">
          {label}
        </label>
        <span className="text-[var(--text-primary)] font-mono text-[11px] tabular-nums shrink-0">
          {displayValue}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--range-progress' as string]: `${pct}%` }}
        className="w-full studio-range block"
      />
    </div>
  );
};

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, ariaLabel, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={(e) => {
      e.stopPropagation();
      onChange(!checked);
    }}
    className={`relative inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-150 ${
      checked
        ? 'bg-[var(--accent)] border-[var(--accent)]'
        : 'bg-[var(--bg-elevated)] border-[var(--border-strong)]'
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-150 ${
        checked ? 'translate-x-[15px]' : 'translate-x-[1px]'
      }`}
    />
  </button>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({
  className = '',
  ...props
}) => (
  <input
    className={`w-full h-8 px-2.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-150 ${className}`}
    {...props}
  />
);

export const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className = '',
  ...props
}) => (
  <textarea
    className={`w-full px-2.5 py-2 text-[13px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none resize-none transition-colors duration-150 ${className}`}
    {...props}
  />
);

export const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
  className = '',
  ...props
}) => (
  <select
    className={`w-full h-8 px-2.5 text-xs bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] hover:border-[var(--border-strong)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-150 cursor-pointer ${className}`}
    {...props}
  />
);

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  badge,
  defaultOpen = true,
  open: controlledOpen,
  onOpenChange,
  headerRight,
  children,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? uncontrolledOpen;

  const toggle = () => {
    const next = !isOpen;
    if (controlledOpen === undefined) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <section className="border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors duration-150">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          className="flex-1 min-w-0 flex items-center gap-2 text-left cursor-pointer"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 transition-transform duration-150 ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-medium text-[var(--text-primary)] tracking-[-0.01em] truncate">
                {title}
              </h2>
              {badge}
            </div>
            {description && !isOpen && (
              <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{description}</p>
            )}
          </div>
        </button>
        {headerRight && <div className="flex items-center gap-2 shrink-0">{headerRight}</div>}
      </div>

      {isOpen && (
        <div className="px-4 pb-4 pt-0.5 space-y-3">
          {description && (
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{description}</p>
          )}
          {children}
        </div>
      )}
    </section>
  );
};

interface TooltipProps {
  content: string;
  shortcut?: string;
  side?: 'top' | 'bottom';
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  side = 'bottom',
  children,
}) => (
  <span className="relative inline-flex group/tip">
    {children}
    <span
      role="tooltip"
      className={`pointer-events-none absolute left-1/2 -translate-x-1/2 z-50 px-2 py-1 rounded-[var(--radius-sm)] bg-[#1A1D27] border border-[var(--border-strong)] text-[11px] font-medium text-[var(--text-primary)] whitespace-nowrap shadow-[var(--shadow-soft)] opacity-0 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 transition-opacity duration-150 ${
        side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
      }`}
    >
      <span>{content}</span>
      {shortcut && (
        <kbd className="ml-1.5 px-1 py-0.5 rounded bg-white/10 font-mono text-[10px] text-[var(--text-secondary)]">
          {shortcut}
        </kbd>
      )}
    </span>
  </span>
);

export interface ToastMessage {
  id: string;
  message: string;
  tone?: 'success' | 'info';
}

interface ToastViewportProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastViewport: React.FC<ToastViewportProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-2.5 pl-3 pr-2 py-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-[var(--shadow-soft)] text-xs text-[var(--text-primary)]"
        >
          {toast.tone === 'info' ? (
            <Info className="w-3.5 h-3.5 text-[var(--accent-text)] shrink-0" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar notificação"
            className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};
