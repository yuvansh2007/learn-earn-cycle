import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile, useNotifications } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/explore", label: "Explore" },
  { to: "/connections", label: "Connections" },
  { to: "/sessions", label: "Sessions" },
  { to: "/wallet", label: "Wallet" },
  { to: "/library", label: "Library" },
  { to: "/my-library", label: "My Library" },
] as const;

export function CoinBadge({ amount, className }: { amount: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-xs text-primary",
        className,
      )}
    >
      <span className="inline-block size-1.5 rounded-full bg-primary" />
      {amount.toLocaleString()} SC
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: profile } = useMyProfile();
  const { data: notifications } = useNotifications();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const unread = (notifications ?? []).filter((n) => !n.read).length;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <Link
            to="/dashboard"
            className="shrink-0 rounded-md font-display text-lg font-semibold tracking-tight"
          >
            Skill<span className="text-primary">Swap</span>
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === item.to && "bg-secondary font-medium text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
            {profile ? <CoinBadge amount={profile.coins} className="shrink-0" /> : null}
            {unread > 0 ? (
              <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:inline">
                {unread} new
              </span>
            ) : null}
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </Button>
          </div>
        </div>

        {open ? (
          <nav className="animate-rise grid max-h-[70vh] gap-1 overflow-y-auto border-t border-border px-4 py-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  pathname === item.to && "bg-secondary font-medium text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="label-mono mb-2">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border px-5 py-10 text-center sm:px-10">
      <p className="font-display text-base sm:text-lg">{title}</p>
      {hint ? (
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <p className="label-mono animate-pulse-soft">{label}…</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse-soft h-24 rounded-xl border border-border bg-secondary/40"
          />
        ))}
      </div>
    </div>
  );
}

export function ErrorBlock({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive-foreground sm:p-6"
    >
      <p className="label-mono mb-1 text-destructive-foreground/70">Something went wrong</p>
      <p className="break-words">{message}</p>
    </div>
  );
}
