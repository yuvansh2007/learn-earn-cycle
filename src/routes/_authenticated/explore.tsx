import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "@/components/app-shell";
import { useMyProfile, useNetwork, useConnectMutation } from "@/lib/api";
import { rankTeachers } from "@/lib/matching";
import { SKILL_CATEGORIES } from "@/lib/skills-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explore skills — SkillSwap" },
      {
        name: "description",
        content:
          "Browse students by skill and see an explainable 0–100 match score for every potential teacher.",
      },
      { property: "og:title", content: "Explore skills — SkillSwap" },
      { property: "og:description", content: "Find the right peer to learn from." },
    ],
  }),
  component: Explore,
});

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

function Explore() {
  const profile = useMyProfile();
  const network = useNetwork();
  const connect = useConnectMutation();
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState<string | undefined>(undefined);

  const me = profile.data;
  const ranked = useMemo(() => {
    if (!me) return [];
    return rankTeachers(me, network.data ?? [], focus).filter(({ profile: p }) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.teaches.some((s) => s.name.toLowerCase().includes(q)) ||
        (p.university ?? "").toLowerCase().includes(q)
      );
    });
  }, [me, network.data, focus, query]);

  if (network.isLoading || profile.isLoading)
    return <AppShell><LoadingBlock /></AppShell>;
  if (network.error) return <AppShell><ErrorBlock error={network.error} /></AppShell>;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Discovery"
        title="Explore skills"
        description="Every score is explainable: skills, availability, interests, experience and reputation."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search students, skills or universities"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={focus ?? ""}
          onChange={(e) => setFocus(e.target.value || undefined)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Focus skill: any</option>
          {ALL_SKILLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {ranked.length === 0 ? (
        <EmptyState title="No students found" hint="Try a different search or focus skill." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map(({ profile: p, match }) => (
            <article key={p.id} className="animate-rise rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    to="/profile/$id"
                    params={{ id: p.id }}
                    className="font-display text-lg font-semibold hover:text-primary"
                  >
                    {p.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {[p.course, p.year_of_study, p.university].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="font-mono text-sm text-primary">{match.score}%</span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${match.score}%` }} />
              </div>

              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {match.components.map((c) => (
                  <li key={c.key} className="flex justify-between">
                    <span>{c.label}</span>
                    <span className="font-mono">
                      {Math.round(c.earned)}/{c.weight}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 text-xs text-muted-foreground">
                {match.reasons.slice(0, 2).join(" · ")}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.teaches.slice(0, 4).map((s) => (
                  <span
                    key={s.name}
                    className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                  >
                    {s.name}
                  </span>
                ))}
              </div>

              <Button
                size="sm"
                variant="secondary"
                className="mt-4 w-full"
                disabled={!me || connect.isPending}
                onClick={() => me && connect.mutate({ me: me.id, other: p.id })}
              >
                Request connection
              </Button>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
