import clsx from 'clsx';

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function Tabs<T extends string>({ value, onChange, options, className }: Props<T>) {
  return (
    <div
      className={clsx(
        'inline-flex p-0.5 bg-bg-subtle border border-border-subtle rounded-xl2',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={clsx(
              'h-7 px-3 rounded-[10px] text-xs font-medium transition-colors',
              active
                ? 'bg-bg-input text-text shadow-soft'
                : 'text-text-muted hover:text-text',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
