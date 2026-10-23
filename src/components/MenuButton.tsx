import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router';

type Variant = 'outline' | 'red' | 'blue';

const STYLES: Record<Variant, string> = {
  outline: 'min-h-[52px] border-2 border-alert-blue bg-white text-alert-blue text-base hover:bg-blue-50',
  red: 'min-h-[78px] bg-alert-red text-white text-[22px] shadow-md hover:brightness-110',
  blue: 'min-h-[70px] bg-alert-blue text-white text-xl shadow-md hover:brightness-110',
};

export const BUTTON_CLASS =
  'flex w-full items-center justify-center rounded-xl px-4 py-3 text-center font-bold leading-tight transition';

/** Full-width button that navigates to a route. */
export function MenuButton({ to, variant = 'outline', children }: { to: string; variant?: Variant; children: ReactNode }) {
  return (
    <Link to={to} className={`${BUTTON_CLASS} ${STYLES[variant]}`}>
      {children}
    </Link>
  );
}

/** Full-width button that runs an action. */
export function Button({
  variant = 'outline',
  children,
  ...props
}: { variant?: Variant; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${BUTTON_CLASS} ${STYLES[variant]} disabled:opacity-50`} {...props}>
      {children}
    </button>
  );
}
