import type { ReactNode } from 'react';

/** Centered column with ~24 px margins and vertical scroll (plan section 6.1). */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}

/**
 * Screen title with an optional icon tile, subtitle and intro paragraph.
 * Left-aligned so long intros read as text, not a poster.
 */
export function ScreenHeader({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 pt-3 pb-1">
      <div className="flex items-center gap-3.5">
        {icon}
        <h1 className="font-display text-title font-bold text-ink">{title}</h1>
      </div>
      {subtitle && <p className="font-display text-[1.375rem] leading-tight font-semibold text-ink">{subtitle}</p>}
      {children && <p className="text-body text-ink-muted">{children}</p>}
    </header>
  );
}

/** Colored square that holds a header icon; the color carries the screen's meaning (red = emergency…). */
export function HeaderIcon({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`flex size-12 shrink-0 items-center justify-center rounded-[14px] ${className}`}>{children}</span>
  );
}

/** "Paso 2 de 6" plus one segment per step, so how long the sequence is shows at a glance. */
export function StepProgress({ label, current, total }: { label: string; current: number; total: number }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="font-display text-[1.25rem] leading-none font-bold text-link">{label}</p>
      <div aria-hidden="true" className="flex gap-1.5">
        {Array.from({ length: total }, (_, step) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${step <= current ? 'bg-alert-blue' : 'bg-line'}`}
          />
        ))}
      </div>
    </div>
  );
}
