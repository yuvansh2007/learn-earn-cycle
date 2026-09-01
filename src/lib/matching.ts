/**
 * SkillSwap matching engine — isolated, pure, and dependency-free.
 *
 * This module is intentionally decoupled from React, the database driver and
 * the UI so it can later be swapped for a graph/DSA implementation (or compiled
 * from C++/WASM) without touching any component.
 *
 * Data structures currently used:
 *   - hash maps (Map/Set) for O(1) skill lookups
 *   - a directed multigraph of students, edges labelled by skill
 *   - depth-first search with an explicit recursion stack for cycle detection
 *
 * Weights (sum = 100):
 *   Skill compatibility      50
 *   Availability overlap     20
 *   Common interests         10
 *   Experience compatibility 10
 *   Reputation / trust       10
 */

export const MATCH_WEIGHTS = {
  skill: 50,
  availability: 20,
  interests: 10,
  experience: 10,
  reputation: 10,
} as const;

export type SkillRef = { name: string; level: string; category?: string };

export interface MatchProfile {
  id: string;
  full_name: string;
  university?: string | null;
  course?: string | null;
  year_of_study?: string | null;
  bio?: string | null;
  rating_avg: number;
  rating_count: number;
  sessions_taught: number;
  sessions_attended: number;
  availability_days: string[];
  preferred_time?: string | null;
  mode: string;
  coins: number;
  teaches: SkillRef[];
  learns: SkillRef[];
}

export interface MatchComponent {
  key: keyof typeof MATCH_WEIGHTS;
  label: string;
  weight: number;
  earned: number;
  ratio: number;
}

export interface MatchResult {
  score: number;
  components: MatchComponent[];
  reasons: string[];
  matchedSkills: string[];
}

const LEVEL_RANK: Record<string, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Expert: 4,
};

const nameSet = (skills: SkillRef[]) => new Set(skills.map((s) => s.name));

/**
 * Score how well `teacher` satisfies `learner`'s goals. Fully explainable:
 * every component reports its own weight, earned points and a human reason.
 */
export function computeMatch(
  learner: MatchProfile,
  teacher: MatchProfile,
  focusSkill?: string,
): MatchResult {
  const reasons: string[] = [];

  const wants = nameSet(learner.learns);
  const teaches = nameSet(teacher.teaches);
  const matchedSkills = [...wants].filter((s) => teaches.has(s));
  const focused = focusSkill && wants.has(focusSkill) && teaches.has(focusSkill);

  // 1. Skill compatibility
  let skillRatio = 0;
  if (matchedSkills.length > 0) {
    skillRatio = Math.min(1, 0.72 + 0.14 * (matchedSkills.length - 1));
    if (focused) skillRatio = 1;
    reasons.push(`You want to learn ${matchedSkills.slice(0, 2).join(" & ")}`);
    reasons.push(`They teach ${matchedSkills.slice(0, 2).join(" & ")}`);
  } else {
    reasons.push("No direct overlap with your learning goals yet");
  }

  // 2. Availability overlap
  const mine = new Set(learner.availability_days);
  const theirs = teacher.availability_days.filter((d) => mine.has(d));
  const availabilityRatio =
    mine.size === 0 ? 0.5 : Math.min(1, theirs.length / Math.min(3, mine.size));
  if (theirs.length > 0) {
    reasons.push(
      `Your schedules overlap on ${theirs.length} day${theirs.length > 1 ? "s" : ""}`,
    );
  }
  if (learner.preferred_time && learner.preferred_time === teacher.preferred_time) {
    reasons.push(`Both prefer ${learner.preferred_time.toLowerCase()} sessions`);
  }

  // 3. Common interests (both want to learn the same things)
  const theirWants = nameSet(teacher.learns);
  const sharedInterests = [...wants].filter((s) => theirWants.has(s));
  const interestsRatio = Math.min(1, sharedInterests.length / 2);
  if (sharedInterests.length > 0) {
    reasons.push(`Shared interest in ${sharedInterests[0]}`);
  }

  // 4. Experience compatibility — teacher should be ahead, not miles ahead
  let experienceRatio = 0.5;
  if (matchedSkills.length > 0) {
    const gaps = matchedSkills.map((s) => {
      const t = teacher.teaches.find((x) => x.name === s);
      const l = learner.learns.find((x) => x.name === s);
      return (LEVEL_RANK[t?.level ?? "Beginner"] ?? 1) - (LEVEL_RANK[l?.level ?? "Beginner"] ?? 1);
    });
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    experienceRatio = avgGap <= 0 ? 0.35 : avgGap >= 3 ? 0.8 : 1 - Math.abs(avgGap - 1.6) / 4;
    experienceRatio = Math.max(0, Math.min(1, experienceRatio));
    const top = teacher.teaches.find((x) => x.name === matchedSkills[0]);
    if (top) reasons.push(`${top.level} level in ${top.name}`);
  }

  // 5. Reputation / trust
  const ratingPart = teacher.rating_count > 0 ? teacher.rating_avg / 5 : 0.55;
  const volumePart = Math.min(1, teacher.sessions_taught / 25);
  const reputationRatio = ratingPart * 0.75 + volumePart * 0.25;
  if (teacher.rating_avg >= 4.5 && teacher.rating_count > 0) {
    reasons.push(`High teaching rating (${teacher.rating_avg.toFixed(1)}★)`);
  }

  const ratios: Record<keyof typeof MATCH_WEIGHTS, number> = {
    skill: skillRatio,
    availability: availabilityRatio,
    interests: interestsRatio,
    experience: experienceRatio,
    reputation: reputationRatio,
  };

  const labels: Record<keyof typeof MATCH_WEIGHTS, string> = {
    skill: "Skill",
    availability: "Availability",
    interests: "Interests",
    experience: "Experience",
    reputation: "Reputation",
  };

  const components: MatchComponent[] = (
    Object.keys(MATCH_WEIGHTS) as (keyof typeof MATCH_WEIGHTS)[]
  ).map((key) => ({
    key,
    label: labels[key],
    weight: MATCH_WEIGHTS[key],
    earned: Math.round(MATCH_WEIGHTS[key] * ratios[key]),
    ratio: ratios[key],
  }));

  const score = components.reduce((sum, c) => sum + c.earned, 0);

  return { score, components, reasons, matchedSkills };
}

/** Rank candidate teachers for a learner. */
export function rankTeachers(
  learner: MatchProfile,
  candidates: MatchProfile[],
  focusSkill?: string,
): Array<{ profile: MatchProfile; match: MatchResult }> {
  return candidates
    .filter((c) => c.id !== learner.id)
    .map((profile) => ({ profile, match: computeMatch(learner, profile, focusSkill) }))
    .sort((a, b) => b.match.score - a.match.score);
}

/** Students who want to learn something the given profile can teach. */
export function rankStudents(
  teacher: MatchProfile,
  candidates: MatchProfile[],
): Array<{ profile: MatchProfile; match: MatchResult; wants: string[] }> {
  const teaches = nameSet(teacher.teaches);
  return candidates
    .filter((c) => c.id !== teacher.id)
    .map((profile) => ({
      profile,
      match: computeMatch(profile, teacher),
      wants: profile.learns.map((l) => l.name).filter((n) => teaches.has(n)),
    }))
    .filter((x) => x.wants.length > 0)
    .sort((a, b) => b.match.score - a.match.score);
}

/* ------------------------------------------------------------------ */
/* Exchange graph + cycle detection                                    */
/* ------------------------------------------------------------------ */

export interface ExchangeEdge {
  from: string; // student who teaches
  to: string; // student who learns
  skill: string;
}

export interface ExchangeGraph {
  nodes: MatchProfile[];
  edges: ExchangeEdge[];
  adjacency: Map<string, ExchangeEdge[]>;
}

/**
 * Build a directed graph where an edge A -> B means
 * "A can teach a skill that B wants to learn".
 */
export function buildExchangeGraph(profiles: MatchProfile[]): ExchangeGraph {
  const edges: ExchangeEdge[] = [];
  const adjacency = new Map<string, ExchangeEdge[]>();

  // hash map: skill name -> students who want it
  const wantIndex = new Map<string, string[]>();
  for (const p of profiles) {
    for (const l of p.learns) {
      const list = wantIndex.get(l.name) ?? [];
      list.push(p.id);
      wantIndex.set(l.name, list);
    }
  }

  for (const p of profiles) {
    adjacency.set(p.id, adjacency.get(p.id) ?? []);
    for (const t of p.teaches) {
      for (const learnerId of wantIndex.get(t.name) ?? []) {
        if (learnerId === p.id) continue;
        const edge: ExchangeEdge = { from: p.id, to: learnerId, skill: t.name };
        edges.push(edge);
        const list = adjacency.get(p.id) ?? [];
        list.push(edge);
        adjacency.set(p.id, list);
      }
    }
  }

  return { nodes: profiles, edges, adjacency };
}

export interface ExchangeCycle {
  members: string[]; // ordered student ids
  edges: ExchangeEdge[]; // edges[i] goes members[i] -> members[i+1]
  length: number;
}

/**
 * Depth-first search with an explicit path stack to enumerate simple directed
 * cycles up to `maxLength`. Cycles are canonicalised (rotated to start at the
 * smallest id) and de-duplicated with a hash set.
 */
export function findExchangeCycles(
  graph: ExchangeGraph,
  { minLength = 2, maxLength = 4, limit = 12 } = {},
): ExchangeCycle[] {
  const found: ExchangeCycle[] = [];
  const seen = new Set<string>();

  const dfs = (
    start: string,
    current: string,
    path: string[],
    pathEdges: ExchangeEdge[],
    visited: Set<string>,
  ) => {
    if (found.length >= limit) return;
    for (const edge of graph.adjacency.get(current) ?? []) {
      if (edge.to === start && path.length >= minLength) {
        const cycle = [...path];
        const cycleEdges = [...pathEdges, edge];
        // canonical key: rotate so smallest id first
        const min = cycle.indexOf([...cycle].sort()[0]!);
        const rotated = [...cycle.slice(min), ...cycle.slice(0, min)];
        const key = rotated.join(">");
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ members: cycle, edges: cycleEdges, length: cycle.length });
        }
        continue;
      }
      if (visited.has(edge.to) || path.length >= maxLength) continue;
      visited.add(edge.to);
      dfs(start, edge.to, [...path, edge.to], [...pathEdges, edge], visited);
      visited.delete(edge.to);
    }
  };

  for (const node of graph.nodes) {
    if (found.length >= limit) break;
    dfs(node.id, node.id, [node.id], [], new Set([node.id]));
  }

  // Prefer three-person cycles (the showcase case), then shorter ones.
  return found.sort((a, b) => {
    const rank = (n: number) => (n === 3 ? 0 : n === 2 ? 1 : 2);
    return rank(a.length) - rank(b.length) || a.length - b.length;
  });
}
