import { CaretRight, type Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';

/** Icon tile color by meaning: preparation, safe condition (green), premium (brand orange), emergency, settings. */
type Tone = 'brand' | 'safe' | 'signal' | 'danger' | 'muted';

const TONES: Record<Tone, string> = {
  brand: 'text-brand',
  safe: 'text-safe',
  signal: 'text-signal',
  danger: 'text-danger',
  muted: 'text-ink-muted',
};

/** Grouped list of destinations; the dividers start after the icon so each row reads as one unit. */
export function NavList({ children }: { children: ReactNode }) {
  return <ul className="overflow-hidden rounded-[20px] bg-surface">{children}</ul>;
}

export function NavItem({
  to,
  icon: ItemIcon,
  tone = 'brand',
  children,
}: {
  to: string;
  icon: Icon;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <li className="group/item">
      <Link
        to={to}
        className="flex min-h-16 items-center gap-4 pl-4 transition-colors duration-150 hover:bg-surface-pressed active:bg-surface-pressed"
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-page ${TONES[tone]}`}>
          <ItemIcon size={22} weight="bold" aria-hidden="true" />
        </span>
        <span className="flex min-h-16 flex-1 items-center gap-3 self-stretch border-b border-line py-3 pr-3 group-last/item:border-b-0">
          <span className="flex-1 font-display text-[1.3125rem] leading-tight font-semibold tracking-[0.02em] text-ink">
            {children}
          </span>
          <CaretRight size={18} weight="bold" aria-hidden="true" className="shrink-0 text-ink-muted" />
        </span>
      </Link>
    </li>
  );
}
