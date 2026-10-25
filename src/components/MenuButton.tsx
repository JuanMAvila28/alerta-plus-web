import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';

type Variant = 'outline' | 'danger' | 'red' | 'blue';

const STYLES: Record<Variant, string> = {
  outline: 'border-2 border-ink/20 bg-transparent text-ink hover:bg-surface active:bg-surface-pressed',
  /** Secondary destructive action (delete a person): red text, not a red block. */
  danger: 'border-2 border-danger/45 bg-transparent text-danger hover:bg-danger/8 active:bg-danger/12',
  red: 'bg-alert-red text-white hover:bg-alert-red-deep active:bg-alert-red-deep',
  blue: 'bg-alert-blue text-white hover:bg-alert-blue-deep active:bg-alert-blue-deep',
};

export const BUTTON_CLASS =
  'flex min-h-14 w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] px-5 py-3 text-center text-label font-bold tracking-[0.03em] transition-[background-color,scale] duration-150 ease-out-quart active:scale-[0.98] [&>svg]:shrink-0';

/** Two buttons side by side (previous / next): under 360 px the arrows go so the labels still fit. */
export const PAIR_BUTTON_CLASS = 'max-[359px]:px-3 max-[359px]:[&>svg]:hidden';

/** Full-width button that navigates to a route. */
export function MenuButton({
  to,
  variant = 'outline',
  className = '',
  children,
}: {
  to: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={`${BUTTON_CLASS} ${STYLES[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/** Full-width button that runs an action. */
export function Button({
  variant = 'outline',
  className = '',
  children,
  ...props
}: { variant?: Variant; children: ReactNode } & ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`${BUTTON_CLASS} ${STYLES[variant]} disabled:pointer-events-none disabled:opacity-45 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
