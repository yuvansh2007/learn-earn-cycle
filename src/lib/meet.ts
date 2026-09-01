/**
 * Google Meet integration layer.
 *
 * IMPORTANT — this is an integration-ready shim, not a real Google Calendar /
 * Meet API integration. Creating a genuine Meet link requires OAuth-authorised
 * Google Calendar API credentials held server-side. Until those credentials are
 * supplied, `createMeetingLink` returns a clearly-labelled demo link so the
 * full booking → join → complete workflow can be demonstrated end to end.
 *
 * To go live: implement `createMeetingLink` as a server function that calls
 * Google Calendar `events.insert` with `conferenceDataVersion=1`, and persist
 * the returned `hangoutLink` in `sessions.meet_url`. No UI change is needed.
 */

export const MEET_PROVIDER_STATUS = "demo" as const;

export function isDemoMeetLink(url: string | null | undefined) {
  return !!url && url.includes("/demo-");
}

/** Generates a syntactically Meet-shaped demo link. */
export function createMeetingLink(seed?: string): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const chunk = (n: number) =>
    Array.from(
      { length: n },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  const slug = seed
    ? seed.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6) || chunk(6)
    : chunk(3);
  return `https://meet.google.com/demo-${slug}-${chunk(4)}-${chunk(3)}`;
}

/** Builds a Google Calendar "add event" URL — this one is real and needs no key. */
export function calendarUrl(opts: {
  title: string;
  description?: string | null;
  startsAt: string | Date;
  durationMin: number;
  location?: string | null;
}) {
  const start = new Date(opts.startsAt);
  const end = new Date(start.getTime() + opts.durationMin * 60_000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: opts.description ?? "",
    location: opts.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
