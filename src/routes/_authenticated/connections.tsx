import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AppShell,
  EmptyState,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
} from "@/components/app-shell";
import {
  useConnections,
  useMyProfile,
  useNetwork,
  useRespondConnection,
  useRemoveConnection,
} from "@/lib/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/connections")({
  head: () => ({
    meta: [
      { title: "Connections — SkillSwap" },
      {
        name: "description",
        content:
          "Manage your SkillSwap connections: incoming requests, sent requests and accepted study partners.",
      },
      { property: "og:title", content: "Connections — SkillSwap" },
      { property: "og:description", content: "Your study partners and pending requests." },
    ],
  }),
  component: Connections,
});

function Connections() {
  const mine = useMyProfile();
  const network = useNetwork();
  const conns = useConnections();
  const respond = useRespondConnection();
  const remove = useRemoveConnection();

  if (conns.isLoading || mine.isLoading) return <AppShell><LoadingBlock /></AppShell>;
  if (conns.error) return <AppShell><ErrorBlock error={conns.error} /></AppShell>;

  const me = mine.data;
  const byId = new Map((network.data ?? []).map((p) => [p.id, p]));
  const rows = conns.data ?? [];

  const incoming = rows.filter((c) => c.status === "pending" && c.addressee_id === me?.id);
  const outgoing = rows.filter((c) => c.status === "pending" && c.requester_id === me?.id);
  const accepted = rows.filter((c) => c.status === "accepted");

  const other = (c: { requester_id: string; addressee_id: string }) =>
    c.requester_id === me?.id ? c.addressee_id : c.requester_id;

  function Row({
    id,
    profileId,
    actions,
  }: {
    id: string;
    profileId: string;
    actions: React.ReactNode;
  }) {
    const p = byId.get(profileId);
    return (
      <li key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <div>
          <Link to="/profile/$id" params={{ id: profileId }} className="font-medium hover:text-primary">
            {p?.full_name ?? "Student"}
          </Link>
          <p className="text-xs text-muted-foreground">
            {[p?.course, p?.university].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2">{actions}</div>
      </li>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="Network"
        title="Connections"
        description="Accepted partners can schedule sessions and message each other."
      />

      <section>
        <h2 className="font-display text-xl font-semibold">Incoming requests</h2>
        {incoming.length === 0 ? (
          <EmptyState title="No incoming requests" />
        ) : (
          <ul className="mt-4 space-y-3">
            {incoming.map((c) => (
              <Row
                key={c.id}
                id={c.id}
                profileId={other(c)}
                actions={
                  <>
                    <Button size="sm" onClick={() => respond.mutate({ id: c.id, accept: true })}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => respond.mutate({ id: c.id, accept: false })}
                    >
                      Decline
                    </Button>
                  </>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Sent requests</h2>
        {outgoing.length === 0 ? (
          <EmptyState title="No pending requests" />
        ) : (
          <ul className="mt-4 space-y-3">
            {outgoing.map((c) => (
              <Row
                key={c.id}
                id={c.id}
                profileId={other(c)}
                actions={
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(c.id)}>
                    Cancel
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Partners</h2>
        {accepted.length === 0 ? (
          <EmptyState title="No connections yet" hint="Explore students and send a request." />
        ) : (
          <ul className="mt-4 space-y-3">
            {accepted.map((c) => (
              <Row
                key={c.id}
                id={c.id}
                profileId={other(c)}
                actions={
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(c.id)}>
                    Remove
                  </Button>
                }
              />
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
