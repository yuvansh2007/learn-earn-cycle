import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — SkillSwap" },
      {
        name: "description",
        content:
          "Sign in to SkillSwap or create a student account to teach skills, learn from peers and earn SkillSwap Coins.",
      },
      { property: "og:title", content: "Sign in or join — SkillSwap" },
      {
        property: "og:description",
        content: "Peer-to-peer skill exchange for university students.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (err) throw err;
        if (data.session) {
          navigate({ to: "/onboarding", replace: true });
        } else {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("login");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-rise">
        <Link to="/" className="font-display text-2xl font-semibold">
          Skill<span className="text-primary">Swap</span>
        </Link>
        <p className="label-mono mt-2">Student ledger access</p>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "login" | "register");
            setError(null);
          }}
          className="mt-8"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="register">Create account</TabsTrigger>
          </TabsList>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <TabsContent value="register" className="m-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  required={mode === "register"}
                />
              </div>
            </TabsContent>

            <div className="space-y-2">
              <Label htmlFor="email">University email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                {error}
              </p>
            ) : null}
            {notice ? (
              <p className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {notice}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Working…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
        </Tabs>

        <p className="mt-6 text-xs text-muted-foreground">
          SkillSwap Coins are internal reward points with no cash value.
        </p>
      </div>
    </div>
  );
}
