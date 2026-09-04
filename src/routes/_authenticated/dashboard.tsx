import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "@/components/app-shell";
import {
  useMyProfile,
  useNetwork,
  useSessions,
  useTransactions,
  useNotifications,
  useMarkNotificationRead,
} from "@/lib/api";
import { rankTeachers, buildExchangeGraph, findExchangeCycles } from "@/lib/matching";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SkillSwap" },
      {
        name: "description",
        content:
          "Your SkillSwap dashboard: coin balance, upcoming sessions, top matches and exchange cycles.",
      },
      { property: "og:title", content: "Dashboard — SkillSwap" },
      { property: "og:description", content: "Your skill exchange at a glance." },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
      <p className="label-mono">{label}</p>
      <p className="mt-2 truncate font-display text-2xl font-semibold sm:text-3xl">{value}</p>
    </div>
  );
}

function Dashboard() {
  const profile = useMyProfile();
  const network = useNetwork();
  const sessions = useSessions();
  const tx = useTransactions();
  const notes = useNotifications();
  const markRead = useMarkNotificationRead();

  const me = profile.data;
  const profiles = network.data ?? [];

  const matches = useMemo(
    () => (me ? rankTeachers(me, profiles).slice(0, 4) : []),
    [me, profiles],
  );

  const cycles = useMemo(() => {
    if (!me || profiles.length === 0) return [];
    const graph = buildExchangeGraph(profiles);
    return findExchangeCycles(graph, { minLength: 3, maxLength: 3, limit: 6 }).filter((c) =>
      c.members.includes(me.id),
    );
  }, [me, profiles]);

  const upcoming = (sessions.data ?? [])
    .filter((s) => s.status === "scheduled" && new Date(s.starts_at) > new Date())
    .slice(0, 4);

  if (profile.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (profile.error) return <AppShell><ErrorBlock error={profile.error} /></AppShell>;

  if (!me?.onboarded) {
    return (
      <AppShell>
        <PageHeader
          eyebrow="Welcome"
          title="Finish setting up"
          description="Complete onboarding so we can match you with the right students."
        />
        <Button asChild>
          <Link to="/onboarding">Start onboarding</Link>
        </Button>
      </AppShell>
    );
  }

  const nameById = new Map(profiles.map((p) => [p.id, p.full_name]));

  return (
    <AppShell>
      <PageHeader
        eyebrow="Ledger"
        title={`Welcome back, ${me.full_name.split(" ")[0]}`}
        description="Your matches, sessions and coin activity."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Coin balance" value={`${me.coins} SC`} />
        <Stat label="Sessions taught" value={me.sessions_taught} />
        <Stat label="Sessions attended" value={me.sessions_attended} />
        <Stat label="Rating" value={me.rating_avg ? me.rating_avg.toFixed(1) : "—"} />
      </div>

      <div className="mt-8 grid gap-8 sm:mt-10 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <section>
          <h2 className="font-display text-lg font-semibold sm:text-xl">Top matches</h2>
          {network.isLoading ? (
            <LoadingBlock />
          ) : matches.length === 0 ? (
            <EmptyState title="No matches yet" hint="Add learning goals in your profile." />
          ) : (
            <ul className="mt-4 space-y-3">
              {matches.map(({ profile: p, match }) => (
                <li key={p.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/profile/$id"
                        params={{ id: p.id }}
                        className="block truncate font-medium hover:text-primary"
                      >
                        {p.full_name}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.course ?? "Student"} · {p.university ?? ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-sm text-primary">{match.score}%</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {match.reasons.slice(0, 2).join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-lg font-semibold sm:text-xl">Exchange cycles</h2>
          {cycles.length === 0 ? (
            <EmptyState
              title="No cycles found yet"
              hint="Cycles appear when three students can teach each other in a loop."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {cycles.map((c) => (
                <li key={c.members.join("-")}>
                  <CycleCard cycle={c} nameById={nameById} highlightId={me.id} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <h2 className="font-display text-lg font-semibold sm:text-xl">Upcoming sessions</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing scheduled" hint="Browse sessions to join one." />
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.map((s) => (
                <li key={s.id} className="rounded-xl border border-border p-4">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.starts_at).toLocaleString()} · {s.duration_min} min
                  </p>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mt-10 font-display text-lg font-semibold sm:text-xl">Recent coin activity</h2>
          <ul className="mt-4 space-y-2">
            {(tx.data ?? []).slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 border-b border-border py-2 text-sm">
                <span className="min-w-0 text-muted-foreground">{t.description}</span>
                <span className="shrink-0 font-mono text-primary">
                  {t.amount > 0 ? "+" : ""}
                  {t.amount}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-display text-lg font-semibold sm:text-xl">Notifications</h2>
          <ul className="mt-4 space-y-2">
            {(notes.data ?? []).slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={n.read ? "text-muted-foreground" : "font-medium"}>{n.title}</p>
                    {n.body ? <p className="text-xs text-muted-foreground">{n.body}</p> : null}
                  </div>
                  {!n.read ? (
                    <Button size="sm" variant="ghost" className="shrink-0" onClick={() => markRead.mutate(n.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
