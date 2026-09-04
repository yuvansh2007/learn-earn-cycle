-- profiles: hide email from other members via column-level grants
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, user_id, full_name, university, course, year_of_study, bio, coins,
  availability_days, preferred_time, mode, rating_avg, rating_count,
  sessions_taught, sessions_attended, onboarded, is_demo, created_at
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- connections: only the two parties (or admins)
DROP POLICY IF EXISTS "connections readable" ON public.connections;
CREATE POLICY "connections readable" ON public.connections
FOR SELECT TO authenticated
USING (
  requester_id = public.current_profile_id()
  OR addressee_id = public.current_profile_id()
  OR public.has_role(auth.uid(), 'admin')
);

-- ratings: rater, teacher, admin
DROP POLICY IF EXISTS "ratings readable" ON public.ratings;
CREATE POLICY "ratings readable" ON public.ratings
FOR SELECT TO authenticated
USING (
  rater_id = public.current_profile_id()
  OR teacher_id = public.current_profile_id()
  OR public.has_role(auth.uid(), 'admin')
);

-- session_participants: participant, session teacher, admin
DROP POLICY IF EXISTS "participants readable" ON public.session_participants;
CREATE POLICY "participants readable" ON public.session_participants
FOR SELECT TO authenticated
USING (
  profile_id = public.current_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_participants.session_id
      AND s.teacher_id = public.current_profile_id()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- user_skills: own rows, onboarded members' directory rows, admins
DROP POLICY IF EXISTS "user_skills readable" ON public.user_skills;
CREATE POLICY "user_skills readable" ON public.user_skills
FOR SELECT TO authenticated
USING (
  profile_id = public.current_profile_id()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = user_skills.profile_id AND p.onboarded
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- admin_stats: not directly callable by clients
REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO service_role;