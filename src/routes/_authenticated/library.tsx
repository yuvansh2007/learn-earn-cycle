import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  CoinBadge,
} from "@/components/app-shell";
import { useBooks, useMyProfile, usePurchases, usePurchaseBook, cleanError } from "@/lib/api";
import { BOOK_CATEGORIES } from "@/lib/skills-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library — SkillSwap" },
      {
        name: "description",
        content:
          "Spend SkillSwap Coins earned by teaching on curated study books in the internal library.",
      },
      { property: "og:title", content: "Library — SkillSwap" },
      { property: "og:description", content: "Books you can unlock with SkillSwap Coins." },
    ],
  }),
  component: Library,
});

function Library() {
  const books = useBooks();
  const mine = useMyProfile();
  const purchases = usePurchases();
  const purchase = usePurchaseBook();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const owned = new Set((purchases.data ?? []).map((p) => p.book_id));

  const rows = useMemo(() => {
    return (books.data ?? []).filter((b) => {
      if (category && b.category !== category) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.skill_tag ?? "").toLowerCase().includes(q)
      );
    });
  }, [books.data, query, category]);

  if (books.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (books.error) return <AppShell><ErrorBlock error={books.error} /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Marketplace"
        title="SkillSwap Library"
        description="Unlock study books with coins you earned by teaching."
        action={mine.data ? <CoinBadge amount={mine.data.coins} /> : undefined}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Input
          placeholder="Search titles, authors or topics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:max-w-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="select-field w-full sm:w-auto sm:min-w-52"
        >
          <option value="">All categories</option>
          {BOOK_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {purchase.error ? (
        <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {cleanError(purchase.error.message)}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="No books found" hint="Try another search or category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((b) => {
            const isOwned = owned.has(b.id);
            const affordable = (mine.data?.coins ?? 0) >= b.price_coins;
            return (
              <article key={b.id} className="flex flex-col rounded-xl border border-border bg-card/40 p-5">
                <div
                  className="mb-4 h-24 rounded-lg"
                  style={{ background: `oklch(0.35 0.09 ${b.cover_hue})` }}
                />
                <h2 className="font-display text-base font-semibold sm:text-lg">{b.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {b.author} · {b.category}
                </p>
                {b.description ? (
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{b.description}</p>
                ) : null}
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-primary">{b.price_coins} SC</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ★ {Number(b.rating).toFixed(1)}
                  </span>
                </div>
                <Button
                  className="mt-4 w-full"
                  size="sm"
                  disabled={isOwned || !affordable || purchase.isPending}
                  onClick={() => purchase.mutate({ p_book_id: b.id })}
                >
                  {isOwned ? "In your library" : affordable ? "Unlock" : "Not enough coins"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
