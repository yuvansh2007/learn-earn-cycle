import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "@/components/app-shell";
import { usePurchases } from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/my-library")({
  head: () => ({
    meta: [
      { title: "My Library — SkillSwap" },
      {
        name: "description",
        content: "Every book you have unlocked with SkillSwap Coins, with the price you paid.",
      },
      { property: "og:title", content: "My Library — SkillSwap" },
      { property: "og:description", content: "Your unlocked SkillSwap books." },
    ],
  }),
  component: MyLibrary,
});

function MyLibrary() {
  const purchases = usePurchases();

  if (purchases.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (purchases.error) return <AppShell><ErrorBlock error={purchases.error} /></AppShell>;

  const rows = purchases.data ?? [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Collection"
        title="My Library"
        description="Books unlocked with coins you earned by teaching."
        action={
          <Button asChild variant="secondary">
            <Link to="/library">Browse library</Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No books yet" hint="Unlock your first book from the library." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <article key={p.id} className="rounded-xl border border-border p-5">
              <div
                className="mb-4 h-24 rounded-lg"
                style={{ background: `oklch(0.35 0.09 ${p.books?.cover_hue ?? 60})` }}
              />
              <h2 className="font-display text-lg font-semibold">{p.books?.title}</h2>
              <p className="text-xs text-muted-foreground">
                {p.books?.author} · {p.books?.category}
              </p>
              <p className="mt-3 font-mono text-xs text-primary">Paid {p.price_paid} SC</p>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
