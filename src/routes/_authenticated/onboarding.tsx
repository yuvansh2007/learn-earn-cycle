import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useMyProfile,
  useSaveUserSkills,
  useUpsertProfile,
  type SkillSelection,
} from "@/lib/api";
import {
  DAYS,
  EXPERIENCE_LEVELS,
  SKILL_CATEGORIES,
  TIME_SLOTS,
  YEARS,
} from "@/lib/skills-catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ErrorBlock, LoadingBlock } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your SkillSwap profile" },
      {
        name: "description",
        content:
          "Five quick steps: profile, skills you teach, skills you want to learn, availability and session format.",
      },
      { property: "og:title", content: "Set up your SkillSwap profile" },
      { property: "og:description", content: "Onboard onto the student skill exchange." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["Profile", "Teach", "Learn", "Availability", "Format"];

function SkillPicker({
  selected,
  onToggle,
  levels,
  onLevel,
}: {
  selected: Set<string>;
  onToggle: (name: string, category: string) => void;
  levels: Record<string, string>;
  onLevel: (name: string, level: string) => void;
}) {
  return (
    <div className="space-y-6">
      {Object.entries(SKILL_CATEGORIES).map(([category, names]) => (
        <div key={category}>
          <p className="label-mono mb-2">{category}</p>
          <div className="flex flex-wrap gap-2">
            {names.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onToggle(name, category)}
                className={cn(
                  "min-h-9 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  selected.has(name)
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {selected.size > 0 ? (
        <div className="rounded-xl border border-border p-4">
          <p className="label-mono mb-3">Experience level</p>
          <div className="space-y-2">
            {[...selected].map((name) => (
              <div key={name} className="flex flex-wrap items-center gap-2">
                <span className="w-full text-sm sm:w-40 sm:min-w-40">{name}</span>
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onLevel(name, lvl)}
                    className={cn(
                      "min-h-8 rounded-md border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors",
                      (levels[name] ?? "Beginner") === lvl
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const { data: profile, isLoading, error } = useMyProfile();
  const upsertProfile = useUpsertProfile();
  const saveSkills = useSaveUserSkills();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState<string>("");
  const [bio, setBio] = useState("");

  const [teach, setTeach] = useState<Record<string, string>>({});
  const [teachLevels, setTeachLevels] = useState<Record<string, string>>({});
  const [learn, setLearn] = useState<Record<string, string>>({});
  const [learnLevels, setLearnLevels] = useState<Record<string, string>>({});

  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState<string>("Evening");
  const [mode, setMode] = useState<string>("online");
  const [format, setFormat] = useState<"individual" | "group">("group");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName((v) => v || profile.full_name);
    setUniversity((v) => v || profile.university || "");
    setCourse((v) => v || profile.course || "");
    setYear((v) => v || profile.year_of_study || "");
    setBio((v) => v || profile.bio || "");
    if (profile.availability_days.length) setDays((d) => (d.length ? d : profile.availability_days));
    if (profile.preferred_time) setTime((t) => t || profile.preferred_time!);
  }, [profile]);

  const interests = useMemo(
    () => [...new Set(Object.values(learn))].filter(Boolean),
    [learn],
  );

  const toggle =
    (
      set: React.Dispatch<React.SetStateAction<Record<string, string>>>,
      levelSet: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    ) =>
    (name: string, category: string) => {
      set((prev) => {
        const next = { ...prev };
        if (next[name]) delete next[name];
        else next[name] = category;
        return next;
      });
      levelSet((prev) => ({ ...prev, [name]: prev[name] ?? "Beginner" }));
    };

  async function finish() {
    setSubmitting(true);
    try {
      const profileId = await upsertProfile.mutateAsync({
        full_name: fullName.trim(),
        university: university.trim() || null,
        course: course.trim() || null,
        year_of_study: year || null,
        bio: bio.trim() || null,
        availability_days: days,
        preferred_time: time,
        mode: format === "individual" ? mode : `${mode}`,
        onboarded: true,
      });

      const skills: SkillSelection[] = [
        ...Object.entries(teach).map(([name, category]) => ({
          name,
          category,
          level: teachLevels[name] ?? "Beginner",
          kind: "teach" as const,
        })),
        ...Object.entries(learn).map(([name, category]) => ({
          name,
          category,
          level: learnLevels[name] ?? "Beginner",
          kind: "learn" as const,
        })),
      ];
      await saveSkills.mutateAsync({ profileId, skills });
      toast.success("Profile ready — welcome to SkillSwap.");
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) return <div className="p-8"><LoadingBlock label="Loading your profile" /></div>;
  if (error) return <div className="p-8"><ErrorBlock error={error} /></div>;

  const canNext =
    step === 0
      ? fullName.trim().length > 1
      : step === 1
        ? Object.keys(teach).length > 0
        : step === 2
          ? Object.keys(learn).length > 0
          : step === 3
            ? days.length > 0
            : true;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <p className="label-mono">Step {step + 1} of 5 — {STEPS[step]}</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Build your exchange profile
      </h1>
      <Progress value={((step + 1) / 5) * 100} className="mt-4" />

      <div className="mt-8 animate-rise space-y-6">
        {step === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uni">University</Label>
              <Input id="uni" value={university} onChange={(e) => setUniversity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input id="course" value={course} onChange={(e) => setCourse(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Year of study</Label>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(y)}
                    className={cn(
                      "min-h-9 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      year === y
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What you love teaching and what you're chasing this semester."
              />
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Pick the skills you can teach and set your level. Teaching earns SkillSwap Coins.
            </p>
            <SkillPicker
              selected={new Set(Object.keys(teach))}
              onToggle={toggle(setTeach, setTeachLevels)}
              levels={teachLevels}
              onLevel={(n, l) => setTeachLevels((p) => ({ ...p, [n]: l }))}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Pick what you want to learn — these drive your matches and your interests.
            </p>
            <SkillPicker
              selected={new Set(Object.keys(learn))}
              onToggle={toggle(setLearn, setLearnLevels)}
              levels={learnLevels}
              onLevel={(n, l) => setLearnLevels((p) => ({ ...p, [n]: l }))}
            />
            {interests.length > 0 ? (
              <div>
                <p className="label-mono mb-2">Your interests</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <Badge key={i} variant="secondary">
                      {i}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <div>
              <p className="label-mono mb-2">Available days</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setDays((prev) =>
                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                      )
                    }
                    className={cn(
                      "min-h-9 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      days.includes(d)
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label-mono mb-2">Preferred time</p>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={cn(
                      "min-h-9 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      time === t
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <div>
              <p className="label-mono mb-2">Session format</p>
              <div className="flex flex-wrap gap-2">
                {(["individual", "group"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 py-2 text-sm capitalize transition-colors",
                      format === f
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label-mono mb-2">Where you meet</p>
              <div className="flex flex-wrap gap-2">
                {["online", "offline", "hybrid"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "min-h-10 rounded-full border px-4 py-2 text-sm capitalize transition-colors",
                      mode === m
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
              <p className="label-mono mb-2">Review</p>
              <p>
                {fullName || "Unnamed"} · {university || "University not set"} ·{" "}
                {Object.keys(teach).length} teaching, {Object.keys(learn).length} learning skills ·{" "}
                {days.length} available days · {time} · {format} · {mode}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-10 flex items-center justify-between gap-3 border-t border-border bg-background/90 px-4 py-4 backdrop-blur">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
            Continue
          </Button>
        ) : (
          <Button onClick={finish} disabled={submitting}>
            {submitting ? "Saving…" : "Finish setup"}
          </Button>
        )}
      </div>
    </div>
  );
}
