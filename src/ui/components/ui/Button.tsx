import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-brand hover:bg-brand-hover active:bg-brand-pressed text-text-onbrand border border-transparent',
  secondary: 'bg-bg-subtle hover:bg-bg-tertiary text-text border border-border',
  ghost: 'bg-transparent hover:bg-bg-subtle text-text border border-transparent',
  danger: 'bg-red-600/90 hover:bg-red-600 text-white border border-transparent',
};

const SIZE: Record<Size, string> = {
  sm: 'h-6 px-2 text-xs gap-1.5',
  md: 'h-8 px-3 text-xs gap-1.5',
  lg: 'h-9 px-3.5 text-sm gap-1.5',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  iconLeft,
  iconRight,
  children,
  fullWidth,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
