import { createFileRoute } from "@tanstack/react-router";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  CoinBadge,
} from "@/components/app-shell";
import { useMyProfile, useTransactions } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — SkillSwap" },
      {
        name: "description",
        content:
          "Track your SkillSwap Coin balance, teaching earnings and spending across sessions and books.",
      },
      { property: "og:title", content: "Wallet — SkillSwap" },
      { property: "og:description", content: "Your SkillSwap Coin ledger." },
    ],
  }),
  component: Wallet,
});

function Wallet() {
  const mine = useMyProfile();
  const tx = useTransactions();

  if (tx.isLoading || mine.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (tx.error) return <AppShell><ErrorBlock error={tx.error} /></AppShell>;

  const rows = tx.data ?? [];
  const earned = rows.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const spent = rows.filter((t) => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ledger"
        title="Wallet"
        description="SkillSwap Coins are internal reward points with no cash value."
        action={mine.data ? <CoinBadge amount={mine.data.coins} /> : undefined}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
          <p className="label-mono">Balance</p>
          <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{mine.data?.coins ?? 0} SC</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
          <p className="label-mono">Earned</p>
          <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl text-primary">+{earned}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
          <p className="label-mono">Spent</p>
          <p className="mt-2 font-display text-2xl font-semibold sm:text-3xl">−{spent}</p>
        </div>
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold sm:text-xl">Transactions</h2>
      {rows.length === 0 ? (
        <EmptyState title="No transactions yet" hint="Teach a session to earn your first coins." />
      ) : (
        <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
          {rows.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm">{t.description}</p>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {t.type} · {new Date(t.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={
                  t.amount > 0 ? "font-mono text-primary" : "font-mono text-muted-foreground"
                }
              >
                {t.amount > 0 ? "+" : ""}
                {t.amount} SC
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
