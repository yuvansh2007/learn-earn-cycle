import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillSwap — Peer-to-peer skill exchange for students" },
      {
        name: "description",
        content:
          "Teach what you know, learn what you need. SkillSwap matches university students, detects 3-person exchange cycles and rewards teaching with SkillSwap Coins.",
      },
      { property: "og:title", content: "SkillSwap — Peer-to-peer skill exchange" },
      {
        property: "og:description",
        content:
          "Explainable matching, group sessions and a coin-powered book library for university students.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    title: "Explainable matching",
    body: "Every match shows a 0–100 score broken down by skills, availability, interests, experience and reputation.",
  },
  {
    title: "Exchange cycles",
    body: "A directed graph finds 3-person loops — you teach Priya, Priya teaches Kabir, Kabir teaches you.",
  },
  {
    title: "SkillSwap Coins",
    body: "Earn coins by teaching sessions, spend them in the internal book library. Reward points only, no cash value.",
  },
  {
    title: "Group sessions",
    body: "Schedule sessions with a meeting link, capacity limits and one-tap add-to-calendar.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-display text-lg font-semibold tracking-tight">
          Skill<span className="text-primary">Swap</span>
        </span>
        <Link
          to="/auth"
          className="rounded-md border border-border px-4 py-2 text-sm transition-colors hover:bg-secondary"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="animate-rise border-b border-border py-16">
          <p className="label-mono">A student ledger of skills</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-6xl">
            Teach what you know.<br />
            Learn what you need.
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            SkillSwap is a peer-to-peer learning exchange for university students. No fees,
            no tutors — just a transparent ledger of who can teach whom.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create your account
            </Link>
            <Link
              to="/explore"
              className="rounded-md border border-border px-5 py-2.5 text-sm transition-colors hover:bg-secondary"
            >
              Explore skills
            </Link>
          </div>
        </section>

        <section className="grid gap-px border-b border-border bg-border sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.title} className="bg-background p-8">
              <h2 className="font-display text-xl font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </section>

        <p className="pt-8 text-xs text-muted-foreground">
          SkillSwap Coins are internal reward points with no monetary value.
        </p>
      </main>
    </div>
  );
}
