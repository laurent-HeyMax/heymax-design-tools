import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: Option[];
}

export function Select({ options, className, ...rest }: Props) {
  return (
    <div className={clsx('relative', className)}>
      <select
        {...rest}
        className={clsx(
          'w-full appearance-none bg-bg-subtle border border-border rounded-md pl-2.5 pr-7 h-8 text-xs text-text',
          'focus:outline-none focus:border-border-brand focus:ring-2 focus:ring-accent/20 transition-colors',
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 text-text-faint" />
    </div>
  );
}
