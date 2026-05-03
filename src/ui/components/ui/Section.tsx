import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  trailing?: ReactNode;
  collapsible?: boolean;
  className?: string;
}

export function Section({
  title,
  children,
  defaultOpen = true,
  trailing,
  collapsible = false,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={clsx('rounded-md border border-border bg-bg', className)}>
      <header
        onClick={() => collapsible && setOpen(!open)}
        className={clsx(
          'flex items-center justify-between px-3 py-2',
          collapsible && 'cursor-pointer select-none hover:bg-bg-subtle',
          open && collapsible && 'border-b border-border',
        )}
      >
        <div className="flex items-center gap-1.5">
          {collapsible && (
            <ChevronDown
              className={clsx(
                'size-3 text-text-faint transition-transform',
                !open && '-rotate-90',
              )}
            />
          )}
          <h3 className="text-2xs font-semibold uppercase tracking-wide text-text-muted">
            {title}
          </h3>
        </div>
        {trailing}
      </header>
      {open && <div className="px-3 py-2.5">{children}</div>}
    </section>
  );
}
