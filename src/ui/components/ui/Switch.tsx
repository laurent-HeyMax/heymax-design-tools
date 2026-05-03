import clsx from 'clsx';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: Props) {
  return (
    <label
      className={clsx(
        'flex items-start gap-2.5 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative shrink-0 mt-0.5 h-4 w-7 rounded-full border transition-colors',
          checked
            ? 'bg-brand border-brand'
            : 'bg-bg-tertiary border-border',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 size-2.5 rounded-full bg-white transition-transform',
            checked && 'translate-x-3',
          )}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <div className="text-xs text-text leading-4">{label}</div>}
          {description && <div className="text-2xs text-text-faint mt-0.5 leading-snug">{description}</div>}
        </div>
      )}
    </label>
  );
}
