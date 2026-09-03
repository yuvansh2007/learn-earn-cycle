import { createFileRoute } from "@tanstack/react-router";
import {
  AppShell,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  CoinBadge,
} from "@/components/app-shell";
import {
  useProfile,
  useMyProfile,
  useRatings,
  useConnectMutation,
  useSendMessage,
} from "@/lib/api";
import { computeMatch } from "@/lib/matching";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/profile/$id")({
  head: () => ({
    meta: [
      { title: "Student profile — SkillSwap" },
      {
        name: "description",
        content:
          "See what a student teaches and wants to learn, their reputation and your match breakdown.",
      },
      { property: "og:title", content: "Student profile — SkillSwap" },
      { property: "og:description", content: "Skills, reputation and match breakdown." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { id } = Route.useParams();
  const query = useProfile(id);
  const mine = useMyProfile();
  const ratings = useRatings(id);
  const connect = useConnectMutation();
  const sendMessage = useSendMessage();
  const [body, setBody] = useState("");

  if (query.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (query.error) return <AppShell><ErrorBlock error={query.error} /></AppShell>;

  const p = query.data!;
  const me = mine.data;
  const match = me && me.id !== p.id ? computeMatch(me, p) : null;

  return (
    <AppShell>
      <PageHeader
        eyebrow="Student"
        title={p.full_name}
        description={[p.course, p.year_of_study, p.university].filter(Boolean).join(" · ")}
        action={<CoinBadge amount={p.coins} />}
      />

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section>
          {p.bio ? <p className="text-sm text-muted-foreground">{p.bio}</p> : null}

          <h2 className="mt-8 font-display text-xl font-semibold">Teaches</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.teaches.map((s) => (
              <span key={s.name} className="rounded-full border border-border px-3 py-1 text-xs">
                {s.name} · {s.level}
              </span>
            ))}
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold">Wants to learn</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {p.learns.map((s) => (
              <span
                key={s.name}
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary"
              >
                {s.name}
              </span>
            ))}
          </div>

          <h2 className="mt-8 font-display text-xl font-semibold">Reviews</h2>
          <ul className="mt-3 space-y-3">
            {(ratings.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">No reviews yet.</li>
            ) : (
              (ratings.data ?? []).map((r) => (
                <li key={r.id} className="rounded-xl border border-border p-4 text-sm">
                  <p className="font-mono text-xs text-primary">{r.stars} / 5</p>
                  {r.review ? <p className="mt-1 text-muted-foreground">{r.review}</p> : null}
                </li>
              ))
            )}
          </ul>
        </section>

        <aside>
          <div className="rounded-xl border border-border p-5">
            <p className="label-mono">Reputation</p>
            <p className="mt-2 font-display text-3xl font-semibold">
              {p.rating_avg ? p.rating_avg.toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {p.rating_count} reviews · {p.sessions_taught} taught · {p.sessions_attended} attended
            </p>
          </div>

          {match ? (
            <div className="mt-4 rounded-xl border border-border p-5">
              <p className="label-mono">Your match</p>
              <p className="mt-2 font-display text-3xl font-semibold text-primary">
                {match.score}%
              </p>
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
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {match.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <Button
                className="mt-4 w-full"
                disabled={connect.isPending}
                onClick={() => me && connect.mutate({ me: me.id, other: p.id })}
              >
                Request connection
              </Button>
            </div>
          ) : null}

          {me && me.id !== p.id ? (
            <div className="mt-4 rounded-xl border border-border p-5">
              <p className="label-mono">Send a message</p>
              <Textarea
                className="mt-3"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Hi! Could you help me with…"
              />
              <Button
                className="mt-3 w-full"
                variant="secondary"
                disabled={!body.trim() || sendMessage.isPending}
                onClick={() =>
                  sendMessage.mutate(
                    { sender_id: me.id, recipient_id: p.id, body: body.trim() },
                    { onSuccess: () => setBody("") },
                  )
                }
              >
                Send
              </Button>
            </div>
          ) : null}
        </aside>
      </div>
    </AppShell>
  );
}
