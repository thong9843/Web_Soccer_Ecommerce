'use client';

import { useId } from 'react';

export const inputClass =
  'h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70 ' +
  'transition-colors focus:border-pitch focus:outline-none focus:ring-2 focus:ring-pitch/20 ' +
  'aria-[invalid=true]:border-danger';

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby'?: string;
  }) => React.ReactNode;
}) {
  const id = useId();
  const describedBy = error || hint ? `${id}-desc` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ink">
        {label}
      </label>
      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy,
      })}
      {(error || hint) && (
        <p
          id={describedBy}
          className={`text-xs ${error ? 'text-danger' : 'text-muted'}`}
          role={error ? 'alert' : undefined}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {message}
    </div>
  );
}
