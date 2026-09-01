
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.current_profile_id() from public, anon;
revoke execute on function public.join_session(uuid) from public, anon;
revoke execute on function public.leave_session(uuid) from public, anon;
revoke execute on function public.complete_session(uuid) from public, anon;
revoke execute on function public.purchase_book(uuid) from public, anon;
revoke execute on function public.rate_session(uuid, int, text) from public, anon;
revoke execute on function public.admin_stats() from public, anon;

grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.join_session(uuid) to authenticated;
grant execute on function public.leave_session(uuid) to authenticated;
grant execute on function public.complete_session(uuid) to authenticated;
grant execute on function public.purchase_book(uuid) to authenticated;
grant execute on function public.rate_session(uuid, int, text) to authenticated;
grant execute on function public.admin_stats() to authenticated;
