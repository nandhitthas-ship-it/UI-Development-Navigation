import type { ReactNode } from "react";

export function Screen({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <main className="mt-6">{children}</main>
    </div>
  );
}
