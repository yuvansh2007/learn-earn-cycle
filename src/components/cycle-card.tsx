import type { ExchangeCycle } from "@/lib/matching";

/**
 * Visualises a closed skill-exchange loop:
 *   Arjun ──C++──> Priya ──JavaScript──> Kabir ──UI/UX──> Arjun
 */
export function CycleCard({
  cycle,
  nameById,
  highlightId,
}: {
  cycle: ExchangeCycle;
  nameById: Map<string, string>;
  highlightId?: string;
}) {
  const name = (id: string) => nameById.get(id) ?? "Student";

  return (
    <article className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-primary">{cycle.length}-person cycle</p>
        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
          closed loop
        </span>
      </div>

      <ol className="mt-4 space-y-1">
        {cycle.edges.map((e, i) => (
          <li key={`${e.from}-${e.to}-${e.skill}-${i}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
            <span
              className={`truncate text-right text-sm ${
                e.from === highlightId ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {name(e.from)}
            </span>
            <span className="flex min-w-0 flex-col items-center">
              <span className="max-w-[9rem] truncate font-mono text-[11px] text-primary">
                {e.skill}
              </span>
              <span aria-hidden className="text-muted-foreground">
                <svg width="56" height="8" viewBox="0 0 56 8" fill="none" className="w-12 sm:w-14">
                  <path d="M0 4h48" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <path d="M48 1l6 3-6 3z" fill="currentColor" />
                </svg>
              </span>
            </span>
            <span
              className={`truncate text-sm ${
                e.to === highlightId ? "font-semibold text-foreground" : "text-muted-foreground"
              }`}
            >
              {name(e.to)}
            </span>
          </li>
        ))}
      </ol>

      <ul className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <li>✓ Everyone gets a skill they want</li>
        <li>✓ No direct 1-to-1 exchange required</li>
      </ul>
    </article>
  );
}
