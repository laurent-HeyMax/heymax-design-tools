import clsx from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  title?: string;
}

export function Chip({ selected, disabled, onClick, children, title }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={clsx(
        'h-6 px-2 rounded-md text-2xs font-medium border transition-colors select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        selected
          ? 'bg-bg-brand-subtle border-border-brand text-text-brand'
          : 'bg-bg-subtle border-border text-text-muted hover:text-text hover:bg-bg-tertiary',
      )}
    >
      {children}
    </button>
  );
}
