import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MatchProfile } from "@/lib/matching";

/* ---------------------------------- types --------------------------------- */

export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Profile extends MatchProfile {
  user_id: string | null;
  email: string | null;
  onboarded: boolean;
  is_demo: boolean;
  created_at: string;
}

export interface SessionRow {
  id: string;
  teacher_id: string;
  title: string;
  skill_id: string | null;
  description: string | null;
  starts_at: string;
  duration_min: number;
  max_participants: number;
  mode: string;
  level: string;
  price_coins: number;
  objectives: string | null;
  meet_url: string | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
  teacher: { id: string; full_name: string; rating_avg: number } | null;
  skill: { name: string; category: string } | null;
  session_participants: Array<{ id: string; profile_id: string; status: string }>;
}

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
  session_id: string | null;
  book_id: string | null;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  description: string | null;
  skill_tag: string | null;
  price_coins: number;
  rating: number;
  cover_hue: number;
}

/* --------------------------------- helpers -------------------------------- */

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

type RawProfile = Record<string, unknown> & {
  user_skills?: Array<{
    kind: string;
    level: string;
    skills: { name: string; category: string } | null;
  }>;
};

function toProfile(row: RawProfile): Profile {
  const skills = row.user_skills ?? [];
  const pick = (kind: string) =>
    skills
      .filter((s) => s.kind === kind && s.skills)
      .map((s) => ({
        name: s.skills!.name,
        level: s.level,
        category: s.skills!.category,
      }));
  return {
    ...(row as unknown as Profile),
    rating_avg: Number(row["rating_avg"] ?? 0),
    teaches: pick("teach"),
    learns: pick("learn"),
  };
}

const PROFILE_SELECT = "*, user_skills(kind, level, skills(name, category))";

/* ---------------------------------- auth ---------------------------------- */

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 30_000,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_SELECT)
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? toProfile(data as RawProfile) : null;
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id)
        .eq("role", "admin")
        .maybeSingle();
      return !!data;
    },
  });
}

/* --------------------------------- reads ---------------------------------- */

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async (): Promise<Skill[]> =>
      unwrap(await supabase.from("skills").select("*").order("name")),
    staleTime: 5 * 60_000,
  });
}

export function useNetwork(options?: Partial<UseQueryOptions<Profile[]>>) {
  return useQuery({
    queryKey: ["network"],
    queryFn: async (): Promise<Profile[]> => {
      const rows = unwrap<RawProfile[]>(
        await supabase.from("profiles").select(PROFILE_SELECT).order("rating_avg", {
          ascending: false,
        }),
      );
      return rows.map(toProfile);
    },
    ...options,
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: async (): Promise<Profile> => {
      const row = unwrap<RawProfile>(
        await supabase.from("profiles").select(PROFILE_SELECT).eq("id", id).single(),
      );
      return toProfile(row);
    },
    enabled: !!id,
  });
}

const SESSION_SELECT =
  "*, teacher:profiles!sessions_teacher_id_fkey(id, full_name, rating_avg), skill:skills(name, category), session_participants(id, profile_id, status)";

export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async (): Promise<SessionRow[]> =>
      unwrap(
        await supabase.from("sessions").select(SESSION_SELECT).order("starts_at"),
      ) as SessionRow[],
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: async (): Promise<Connection[]> =>
      unwrap(await supabase.from("connections").select("*")),
  });
}

export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async (): Promise<Transaction[]> =>
      unwrap(
        await supabase
          .from("coin_transactions")
          .select("*")
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async (): Promise<Book[]> =>
      unwrap(await supabase.from("books").select("*").order("title")),
  });
}

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () =>
      unwrap<Array<{ id: string; book_id: string; price_paid: number; created_at: string; books: Book }>>(
        await supabase
          .from("book_purchases")
          .select("*, books(*)")
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () =>
      unwrap<Array<{ id: string; title: string; body: string | null; read: boolean; created_at: string }>>(
        await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ),
  });
}

export function useMessages() {
  return useQuery({
    queryKey: ["messages"],
    queryFn: async () =>
      unwrap<Array<{ id: string; sender_id: string; recipient_id: string; body: string; created_at: string }>>(
        await supabase.from("messages").select("*").order("created_at"),
      ),
  });
}

export function useRatings(teacherId?: string) {
  return useQuery({
    queryKey: ["ratings", teacherId],
    queryFn: async () =>
      unwrap<Array<{ id: string; stars: number; review: string | null; created_at: string; rater_id: string }>>(
        await supabase
          .from("ratings")
          .select("*")
          .eq("teacher_id", teacherId!)
          .order("created_at", { ascending: false }),
      ),
    enabled: !!teacherId,
  });
}

/* -------------------------------- mutations ------------------------------- */

function useInvalidator() {
  const qc = useQueryClient();
  return (keys: string[]) =>
    keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useRpc(fn: string, invalidates: string[]) {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (args: Record<string, unknown>) => {
      const { data, error } = await supabase.rpc(
        fn as Parameters<typeof supabase.rpc>[0],
        args as Parameters<typeof supabase.rpc>[1],
      );
      if (error) throw new Error(cleanError(error.message));
      return data;
    },
    onSuccess: () => invalidate(invalidates),
  });
}

export function cleanError(message: string) {
  return message
    .replace(/^.*?(?:ERROR|error):\s*/i, "")
    .replace(/\s*\(SQLSTATE.*\)$/, "")
    .trim();
}

export function useConnectMutation() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ me, other }: { me: string; other: string }) => {
      const { error } = await supabase
        .from("connections")
        .insert({ requester_id: me, addressee_id: other });
      if (error) throw new Error(cleanError(error.message));
    },
    onSuccess: () => invalidate(["connections"]),
  });
}

export function useRespondConnection() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, accept }: { id: string; accept: boolean }) => {
      if (accept) {
        const { error } = await supabase
          .from("connections")
          .update({ status: "accepted" })
          .eq("id", id);
        if (error) throw new Error(cleanError(error.message));
      } else {
        const { error } = await supabase.from("connections").delete().eq("id", id);
        if (error) throw new Error(cleanError(error.message));
      }
    },
    onSuccess: () => invalidate(["connections"]),
  });
}

export function useRemoveConnection() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("connections").delete().eq("id", id);
      if (error) throw new Error(cleanError(error.message));
    },
    onSuccess: () => invalidate(["connections"]),
  });
}

export function useSendMessage() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (payload: { sender_id: string; recipient_id: string; body: string }) => {
      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw new Error(cleanError(error.message));
    },
    onSuccess: () => invalidate(["messages"]),
  });
}

export function useSaveSession() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async ({ id, ...values }: Record<string, unknown> & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from("sessions").update(values).eq("id", id);
        if (error) throw new Error(cleanError(error.message));
        return id;
      }
      const { data, error } = await supabase
        .from("sessions")
        .insert(values as never)
        .select("id")
        .single();
      if (error) throw new Error(cleanError(error.message));
      return data.id as string;
    },
    onSuccess: () => invalidate(["sessions"]),
  });
}

export function useCancelSession() {
  const invalidate = useInvalidator();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sessions")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw new Error(cleanError(error.message));
    },
    onSuccess: () => invalidate(["sessions"]),
  });
}
