import clsx from 'clsx';
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const base =
  'w-full bg-bg-subtle border border-border rounded-md px-2.5 text-xs text-text placeholder:text-text-faint focus:outline-none focus:border-border-brand focus:ring-2 focus:ring-accent/20 transition-colors';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={clsx(base, 'h-8', className)} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        {...rest}
        className={clsx(base, 'py-2 resize-none leading-snug', className)}
      />
    );
  },
);

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx('block text-2xs font-medium text-text-muted mb-1', className)}>
      {children}
    </label>
  );
}
