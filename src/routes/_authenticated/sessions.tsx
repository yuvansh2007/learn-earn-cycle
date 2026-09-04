import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "@/components/app-shell";
import {
  useSessions,
  useMyProfile,
  useSkills,
  useSaveSession,
  useCancelSession,
  useJoinSession,
  useLeaveSession,
  useCompleteSession,
  useRateSession,
  cleanError,
} from "@/lib/api";
import { createMeetingLink, calendarUrl, isDemoMeetLink } from "@/lib/meet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/sessions")({
  head: () => ({
    meta: [
      { title: "Sessions — SkillSwap" },
      {
        name: "description",
        content:
          "Schedule and join group teaching sessions with meeting links, capacity limits and coin rewards.",
      },
      { property: "og:title", content: "Sessions — SkillSwap" },
      { property: "og:description", content: "Group teaching sessions for students." },
    ],
  }),
  component: SessionsPage,
});

function SessionsPage() {
  const sessions = useSessions();
  const mine = useMyProfile();
  const skills = useSkills();
  const save = useSaveSession();
  const cancel = useCancelSession();
  const join = useJoinSession();
  const leave = useLeaveSession();
  const complete = useCompleteSession();
  const rate = useRateSession();

  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    skill_id: "",
    description: "",
    starts_at: "",
    duration_min: 60,
    max_participants: 6,
    price_coins: 10,
    level: "Beginner",
    mode: "online",
    objectives: "",
  });

  const me = mine.data;

  if (sessions.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (sessions.error) return <AppShell><ErrorBlock error={sessions.error} /></AppShell>;

  const rows = sessions.data ?? [];

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    setError(null);
    try {
      await save.mutateAsync({
        teacher_id: me.id,
        title: form.title,
        skill_id: form.skill_id || null,
        description: form.description || null,
        starts_at: new Date(form.starts_at).toISOString(),
        duration_min: Number(form.duration_min),
        max_participants: Number(form.max_participants),
        price_coins: Number(form.price_coins),
        level: form.level,
        mode: form.mode,
        objectives: form.objectives || null,
        meet_url: createMeetingLink(form.title),
        status: "scheduled",
      });
      setOpen(false);
      setForm({ ...form, title: "", description: "", objectives: "" });
    } catch (err) {
      setError(cleanError(err instanceof Error ? err.message : "Could not create session."));
    }
  }

  function SessionCard({ s }: { s: typeof rows[number] }) {
    const participants = s.session_participants ?? [];
    const joined = participants.some(
      (p) => p.profile_id === me?.id && p.status !== "cancelled",
    );
    const isTeacher = s.teacher_id === me?.id;
    const seatsLeft = s.max_participants - participants.length;

    return (
      <article className="rounded-xl border border-border bg-card/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold sm:text-lg">{s.title}</h2>
            <p className="text-xs text-muted-foreground">
              {s.teacher?.full_name ?? "Student"} · {s.skill?.name ?? "General"} · {s.level}
            </p>
          </div>
          <span className="shrink-0 font-mono text-xs text-primary">{s.price_coins} SC</span>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          {new Date(s.starts_at).toLocaleString()} · {s.duration_min} min ·{" "}
          {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
        </p>
        {s.description ? (
          <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
        ) : null}

        <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {s.status}
          {isDemoMeetLink(s.meet_url) ? " · demo meet link" : ""}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {s.meet_url ? (
            <Button asChild size="sm" variant="secondary">
              <a href={s.meet_url} target="_blank" rel="noreferrer">
                Join meeting
              </a>
            </Button>
          ) : null}
          <Button asChild size="sm" variant="ghost">
            <a
              href={calendarUrl({
                title: s.title,
                description: s.description,
                startsAt: s.starts_at,
                durationMin: s.duration_min,
                location: s.meet_url,
              })}
              target="_blank"
              rel="noreferrer"
            >
              Add to calendar
            </a>
          </Button>

          {s.status === "scheduled" && !isTeacher ? (
            joined ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => leave.mutate({ p_session_id: s.id })}
              >
                Leave
              </Button>
            ) : (
              <Button size="sm" onClick={() => join.mutate({ p_session_id: s.id })}>
                Join for {s.price_coins} SC
              </Button>
            )
          ) : null}

          {isTeacher && s.status === "scheduled" ? (
            <>
              <Button
                size="sm"
                onClick={() => complete.mutate({ p_session_id: s.id })}
              >
                Mark complete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => cancel.mutate(s.id)}>
                Cancel
              </Button>
            </>
          ) : null}

          {s.status === "completed" && joined ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => rate.mutate({ p_session_id: s.id, p_stars: 5 })}
            >
              Rate 5★
            </Button>
          ) : null}
        </div>

        {(join.error || leave.error || complete.error || rate.error) && (
          <p className="mt-3 text-xs text-destructive-foreground">
            {cleanError(
              (join.error || leave.error || complete.error || rate.error)!.message,
            )}
          </p>
        )}
      </article>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Teaching"
        title="Sessions"
        description="Teach a group to earn coins, or join a session to learn."
        action={<Button onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Host a session"}</Button>}
      />

      {open ? (
        <form onSubmit={createSession} className="animate-rise mb-10 grid gap-4 rounded-xl border border-border bg-card/40 p-4 sm:grid-cols-2 sm:p-6">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skill">Skill</Label>
            <select
              id="skill"
              value={form.skill_id}
              onChange={(e) => setForm({ ...form, skill_id: e.target.value })}
              className="select-field"
            >
              <option value="">No specific skill</option>
              {(skills.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="starts">Starts at</Label>
            <Input
              id="starts"
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              value={form.duration_min}
              onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap">Max participants</Label>
            <Input
              id="cap"
              type="number"
              min={1}
              value={form.max_participants}
              onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price (SC)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              value={form.price_coins}
              onChange={(e) => setForm({ ...form, price_coins: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <select
              id="level"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="select-field"
            >
              {["Beginner", "Intermediate", "Advanced"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error ? (
            <p className="sm:col-span-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" className="w-full sm:col-span-2" disabled={save.isPending}>
            {save.isPending ? "Scheduling…" : "Schedule session"}
          </Button>
        </form>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState title="No sessions yet" hint="Be the first to host one." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((s) => {
            const participants = s.session_participants ?? [];
            const joined = participants.some(
              (p) => p.profile_id === me?.id && p.status !== "cancelled",
            );
            const isTeacher = s.teacher_id === me?.id;
            const seatsLeft = s.max_participants - participants.length;

            return (
              <article key={s.id} className="rounded-xl border border-border bg-card/40 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-base font-semibold sm:text-lg">{s.title}</h2>
                    <p className="text-xs text-muted-foreground">
                      {s.teacher?.full_name ?? "Student"} · {s.skill?.name ?? "General"} · {s.level}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-primary">{s.price_coins} SC</span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  {new Date(s.starts_at).toLocaleString()} · {s.duration_min} min ·{" "}
                  {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
                </p>
                {s.description ? (
                  <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                ) : null}

                <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  {s.status}
                  {isDemoMeetLink(s.meet_url) ? " · demo meet link" : ""}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {s.meet_url ? (
                    <Button asChild size="sm" variant="secondary">
                      <a href={s.meet_url} target="_blank" rel="noreferrer">
                        Join meeting
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="ghost">
                    <a
                      href={calendarUrl({
                        title: s.title,
                        description: s.description,
                        startsAt: s.starts_at,
                        durationMin: s.duration_min,
                        location: s.meet_url,
                      })}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Add to calendar
                    </a>
                  </Button>

                  {s.status === "scheduled" && !isTeacher ? (
                    joined ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => leave.mutate({ p_session_id: s.id })}
                      >
                        Leave
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => join.mutate({ p_session_id: s.id })}>
                        Join for {s.price_coins} SC
                      </Button>
                    )
                  ) : null}

                  {isTeacher && s.status === "scheduled" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => complete.mutate({ p_session_id: s.id })}
                      >
                        Mark complete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => cancel.mutate(s.id)}>
                        Cancel
                      </Button>
                    </>
                  ) : null}

                  {s.status === "completed" && joined ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => rate.mutate({ p_session_id: s.id, p_stars: 5 })}
                    >
                      Rate 5★
                    </Button>
                  ) : null}
                </div>

                {(join.error || leave.error || complete.error || rate.error) && (
                  <p className="mt-3 text-xs text-destructive-foreground">
                    {cleanError(
                      (join.error || leave.error || complete.error || rate.error)!.message,
                    )}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
