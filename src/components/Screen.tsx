import type { ReactNode } from 'react';

/** Centered column with ~24 px margins and vertical scroll (plan section 6.1). */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {children}
    </main>
  );
}

/** Screen title with an optional intro paragraph. Left-aligned so long intros read as text, not a poster. */
export function ScreenHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3 pt-3 pb-1">
      <h1 className="font-display text-title font-bold text-ink">{title}</h1>
      {children && <p className="text-body text-ink-muted">{children}</p>}
    </header>
  );
}
