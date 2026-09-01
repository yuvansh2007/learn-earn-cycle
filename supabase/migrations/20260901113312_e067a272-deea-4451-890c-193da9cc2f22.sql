
-- ============ ENUM / ROLES ============
create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- ============ SKILLS ============
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  created_at timestamptz not null default now()
);
grant select, insert on public.skills to authenticated;
grant select on public.skills to anon;
grant all on public.skills to service_role;
alter table public.skills enable row level security;
create policy "skills readable" on public.skills for select using (true);
create policy "skills addable" on public.skills for insert to authenticated with check (true);

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  full_name text not null,
  email text,
  university text,
  course text,
  year_of_study text,
  bio text,
  coins integer not null default 100 check (coins >= 0),
  availability_days text[] not null default '{}',
  preferred_time text,
  mode text not null default 'online',
  rating_avg numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  sessions_taught integer not null default 0,
  sessions_attended integer not null default 0,
  onboarded boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
create policy "insert own profile" on public.profiles for insert to authenticated with check (user_id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.profiles where user_id = auth.uid() limit 1
$$;

-- ============ USER SKILLS ============
create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  kind text not null check (kind in ('teach','learn')),
  level text not null default 'Beginner' check (level in ('Beginner','Intermediate','Advanced','Expert')),
  created_at timestamptz not null default now(),
  unique (profile_id, skill_id, kind)
);
grant select, insert, update, delete on public.user_skills to authenticated;
grant all on public.user_skills to service_role;
alter table public.user_skills enable row level security;
create policy "user_skills readable" on public.user_skills for select to authenticated using (true);
create policy "manage own skills" on public.user_skills for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

-- ============ CONNECTIONS ============
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);
grant select, insert, update, delete on public.connections to authenticated;
grant all on public.connections to service_role;
alter table public.connections enable row level security;
create policy "connections readable" on public.connections for select to authenticated using (true);
create policy "send request" on public.connections for insert to authenticated
  with check (requester_id = public.current_profile_id() and addressee_id <> public.current_profile_id());
create policy "respond to request" on public.connections for update to authenticated
  using (addressee_id = public.current_profile_id()) with check (addressee_id = public.current_profile_id());
create policy "remove connection" on public.connections for delete to authenticated
  using (requester_id = public.current_profile_id() or addressee_id = public.current_profile_id());

-- ============ SESSIONS ============
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  skill_id uuid references public.skills(id) on delete set null,
  description text,
  starts_at timestamptz not null,
  duration_min integer not null default 60 check (duration_min > 0),
  max_participants integer not null default 10 check (max_participants > 0),
  mode text not null default 'online' check (mode in ('online','offline')),
  level text not null default 'Beginner',
  price_coins integer not null default 0 check (price_coins >= 0),
  objectives text,
  meet_url text,
  status text not null default 'scheduled' check (status in ('scheduled','live','completed','cancelled')),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sessions to authenticated;
grant all on public.sessions to service_role;
alter table public.sessions enable row level security;
create policy "sessions readable" on public.sessions for select to authenticated using (true);
create policy "teacher manages sessions" on public.sessions for all to authenticated
  using (teacher_id = public.current_profile_id())
  with check (teacher_id = public.current_profile_id());

create table public.session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  coins_paid integer not null default 0,
  status text not null default 'joined' check (status in ('joined','attended','refunded')),
  created_at timestamptz not null default now(),
  unique (session_id, profile_id)
);
grant select on public.session_participants to authenticated;
grant all on public.session_participants to service_role;
alter table public.session_participants enable row level security;
create policy "participants readable" on public.session_participants for select to authenticated using (true);

-- ============ RATINGS ============
create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  rater_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  stars integer not null check (stars between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (session_id, rater_id)
);
grant select on public.ratings to authenticated;
grant all on public.ratings to service_role;
alter table public.ratings enable row level security;
create policy "ratings readable" on public.ratings for select to authenticated using (true);

-- ============ COIN LEDGER ============
create table public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('SESSION_REWARD','SESSION_JOIN','BOOK_PURCHASE','SESSION_REFUND','BONUS','ADMIN_ADJUSTMENT')),
  amount integer not null,
  description text not null,
  session_id uuid references public.sessions(id) on delete set null,
  book_id uuid,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);
grant select on public.coin_transactions to authenticated;
grant all on public.coin_transactions to service_role;
alter table public.coin_transactions enable row level security;
create policy "own transactions" on public.coin_transactions for select to authenticated
  using (profile_id = public.current_profile_id() or public.has_role(auth.uid(),'admin'));

-- ============ BOOKS ============
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  category text not null,
  description text,
  skill_tag text,
  price_coins integer not null check (price_coins >= 0),
  rating numeric(2,1) not null default 4.5,
  cover_hue integer not null default 40,
  created_at timestamptz not null default now()
);
grant select on public.books to authenticated;
grant all on public.books to service_role;
alter table public.books enable row level security;
create policy "books readable" on public.books for select to authenticated using (true);
create policy "admins manage books" on public.books for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.book_purchases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  price_paid integer not null,
  created_at timestamptz not null default now(),
  unique (profile_id, book_id)
);
grant select on public.book_purchases to authenticated;
grant all on public.book_purchases to service_role;
alter table public.book_purchases enable row level security;
create policy "own purchases" on public.book_purchases for select to authenticated
  using (profile_id = public.current_profile_id() or public.has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications" on public.notifications for select to authenticated
  using (profile_id = public.current_profile_id());
create policy "mark own read" on public.notifications for update to authenticated
  using (profile_id = public.current_profile_id()) with check (profile_id = public.current_profile_id());

-- ============ MESSAGES ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "own conversations" on public.messages for select to authenticated
  using (sender_id = public.current_profile_id() or recipient_id = public.current_profile_id());
create policy "send message" on public.messages for insert to authenticated
  with check (sender_id = public.current_profile_id());

-- ============ COIN / SESSION ENGINE ============
create or replace function public.join_session(p_session_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_s record; v_count int; v_balance int;
begin
  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Complete your profile first'; end if;
  select * into v_s from public.sessions where id = p_session_id for update;
  if not found then raise exception 'Session not found'; end if;
  if v_s.status <> 'scheduled' then raise exception 'This session is no longer open'; end if;
  if v_s.teacher_id = v_profile then raise exception 'You are teaching this session'; end if;
  if exists (select 1 from public.session_participants where session_id = p_session_id and profile_id = v_profile and status <> 'refunded')
    then raise exception 'You have already joined this session'; end if;
  select count(*) into v_count from public.session_participants where session_id = p_session_id and status <> 'refunded';
  if v_count >= v_s.max_participants then raise exception 'This session is full'; end if;
  select coins into v_balance from public.profiles where id = v_profile for update;
  if v_balance < v_s.price_coins then
    raise exception 'You need % more SkillSwap Coins', v_s.price_coins - v_balance; end if;

  update public.profiles set coins = coins - v_s.price_coins where id = v_profile;
  delete from public.session_participants where session_id = p_session_id and profile_id = v_profile;
  insert into public.session_participants(session_id, profile_id, coins_paid) values (p_session_id, v_profile, v_s.price_coins);
  insert into public.coin_transactions(profile_id, type, amount, description, session_id)
    values (v_profile, 'SESSION_JOIN', -v_s.price_coins, 'Reserved seat: ' || v_s.title, p_session_id);
  insert into public.notifications(profile_id, title, body) values
    (v_profile, 'Seat reserved', 'You joined "' || v_s.title || '".'),
    (v_s.teacher_id, 'New participant', 'A student joined "' || v_s.title || '".');
  return json_build_object('ok', true, 'spent', v_s.price_coins);
end $$;

create or replace function public.leave_session(p_session_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_p record; v_s record;
begin
  v_profile := public.current_profile_id();
  select * into v_s from public.sessions where id = p_session_id;
  select * into v_p from public.session_participants where session_id = p_session_id and profile_id = v_profile;
  if not found then raise exception 'You are not in this session'; end if;
  if v_s.status <> 'scheduled' then raise exception 'Session already started'; end if;
  update public.profiles set coins = coins + v_p.coins_paid where id = v_profile;
  delete from public.session_participants where id = v_p.id;
  insert into public.coin_transactions(profile_id, type, amount, description, session_id)
    values (v_profile, 'SESSION_REFUND', v_p.coins_paid, 'Refund: ' || v_s.title, p_session_id);
  return json_build_object('ok', true, 'refunded', v_p.coins_paid);
end $$;

create or replace function public.complete_session(p_session_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_s record; v_count int; v_reward int;
begin
  v_profile := public.current_profile_id();
  select * into v_s from public.sessions where id = p_session_id for update;
  if not found then raise exception 'Session not found'; end if;
  if v_s.teacher_id <> v_profile then raise exception 'Only the teacher can complete this session'; end if;
  if v_s.status = 'completed' then raise exception 'This session is already completed'; end if;
  if v_s.status = 'cancelled' then raise exception 'This session was cancelled'; end if;
  if exists (select 1 from public.coin_transactions where session_id = p_session_id and type = 'SESSION_REWARD')
    then raise exception 'Reward already issued for this session'; end if;

  select count(*) into v_count from public.session_participants where session_id = p_session_id and status <> 'refunded';
  v_reward := v_s.price_coins * v_count;
  if v_reward = 0 then v_reward := greatest(10, v_s.duration_min / 3); end if;

  update public.sessions set status = 'completed' where id = p_session_id;
  update public.session_participants set status = 'attended' where session_id = p_session_id and status = 'joined';
  update public.profiles set coins = coins + v_reward, sessions_taught = sessions_taught + 1 where id = v_profile;
  update public.profiles set sessions_attended = sessions_attended + 1
    where id in (select profile_id from public.session_participants where session_id = p_session_id and status = 'attended');
  insert into public.coin_transactions(profile_id, type, amount, description, session_id)
    values (v_profile, 'SESSION_REWARD', v_reward, 'Taught: ' || v_s.title, p_session_id);
  insert into public.notifications(profile_id, title, body)
    values (v_profile, 'Coins earned', 'You earned ' || v_reward || ' SkillSwap Coins for "' || v_s.title || '".');
  insert into public.notifications(profile_id, title, body)
    select profile_id, 'Session completed', 'Rate your teacher for "' || v_s.title || '".'
    from public.session_participants where session_id = p_session_id and status = 'attended';
  return json_build_object('ok', true, 'earned', v_reward);
end $$;

create or replace function public.purchase_book(p_book_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_b record; v_balance int;
begin
  v_profile := public.current_profile_id();
  if v_profile is null then raise exception 'Complete your profile first'; end if;
  select * into v_b from public.books where id = p_book_id;
  if not found then raise exception 'Book not found'; end if;
  if exists (select 1 from public.book_purchases where profile_id = v_profile and book_id = p_book_id)
    then raise exception 'This title is already in your library'; end if;
  select coins into v_balance from public.profiles where id = v_profile for update;
  if v_balance < v_b.price_coins then
    raise exception 'You need % more SkillSwap Coins', v_b.price_coins - v_balance; end if;
  update public.profiles set coins = coins - v_b.price_coins where id = v_profile;
  insert into public.book_purchases(profile_id, book_id, price_paid) values (v_profile, p_book_id, v_b.price_coins);
  insert into public.coin_transactions(profile_id, type, amount, description, book_id)
    values (v_profile, 'BOOK_PURCHASE', -v_b.price_coins, 'Purchased "' || v_b.title || '"', p_book_id);
  insert into public.notifications(profile_id, title, body)
    values (v_profile, 'Purchase successful', '"' || v_b.title || '" was added to your library.');
  return json_build_object('ok', true, 'spent', v_b.price_coins);
end $$;

create or replace function public.rate_session(p_session_id uuid, p_stars int, p_review text)
returns json language plpgsql security definer set search_path = public as $$
declare v_profile uuid; v_s record;
begin
  v_profile := public.current_profile_id();
  if p_stars < 1 or p_stars > 5 then raise exception 'Rating must be between 1 and 5'; end if;
  select * into v_s from public.sessions where id = p_session_id;
  if not found then raise exception 'Session not found'; end if;
  if v_s.status <> 'completed' then raise exception 'You can only rate completed sessions'; end if;
  if not exists (select 1 from public.session_participants where session_id = p_session_id and profile_id = v_profile and status = 'attended')
    then raise exception 'Only students who attended can rate this session'; end if;
  if exists (select 1 from public.ratings where session_id = p_session_id and rater_id = v_profile)
    then raise exception 'You already rated this session'; end if;
  insert into public.ratings(session_id, rater_id, teacher_id, stars, review)
    values (p_session_id, v_profile, v_s.teacher_id, p_stars, nullif(p_review,''));
  update public.profiles p set
    rating_avg = round(((p.rating_avg * p.rating_count) + p_stars)::numeric / (p.rating_count + 1), 2),
    rating_count = p.rating_count + 1
    where p.id = v_s.teacher_id;
  insert into public.notifications(profile_id, title, body)
    values (v_s.teacher_id, 'New review', 'You received a ' || p_stars || '-star review.');
  return json_build_object('ok', true);
end $$;

create or replace function public.admin_stats()
returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  return json_build_object(
    'total_users', (select count(*) from public.profiles),
    'active_users', (select count(*) from public.profiles where onboarded),
    'total_sessions', (select count(*) from public.sessions),
    'completed_sessions', (select count(*) from public.sessions where status = 'completed'),
    'coins_earned', (select coalesce(sum(amount),0) from public.coin_transactions where amount > 0),
    'coins_spent', (select coalesce(-sum(amount),0) from public.coin_transactions where amount < 0),
    'total_purchases', (select count(*) from public.book_purchases),
    'total_connections', (select count(*) from public.connections where status = 'accepted')
  );
end $$;

-- ============ DEMO DATA ============
insert into public.skills (name, category) values
 ('C++','Programming'),('C','Programming'),('Java','Programming'),('Python','Programming'),
 ('JavaScript','Programming'),('HTML','Programming'),('CSS','Programming'),('React','Programming'),
 ('Data Structures & Algorithms','Programming'),('Machine Learning','Programming'),('Web Development','Programming'),
 ('UI/UX','Design'),('Figma','Design'),('Graphic Design','Design'),('Video Editing','Design'),
 ('Mathematics','Academic'),('Physics','Academic'),('Chemistry','Academic'),('Biology','Academic'),('Economics','Academic'),
 ('Public Speaking','Communication'),('English','Communication'),('Communication Skills','Communication'),('Presentation Skills','Communication'),
 ('Photography','Other'),('Music','Other'),('Marketing','Other'),('Content Writing','Other'),('Entrepreneurship','Other');

insert into public.profiles (id, full_name, university, course, year_of_study, bio, coins, availability_days, preferred_time, mode, rating_avg, rating_count, sessions_taught, sessions_attended, onboarded, is_demo) values
 ('11111111-1111-1111-1111-000000000001','Ananya Sharma','Delhi Technological University','B.Tech Computer Science','4th Year','Frontend obsessive. I have shipped three hackathon products and love teaching JS from first principles.',240,'{Saturday,Sunday,Wednesday}','Evening','online',4.80,25,28,6,true,true),
 ('11111111-1111-1111-1111-000000000002','Rahul Verma','IIT Bombay','B.Tech Electronics','4th Year','ML researcher in training. Ask me about gradient descent at 2am.',310,'{Monday,Friday,Saturday}','Night','online',4.90,31,41,4,true,true),
 ('11111111-1111-1111-1111-000000000003','Meera Kulkarni','NID Ahmedabad','B.Des Interaction Design','3rd Year','Designer who believes good UI is invisible. Figma is my second language.',180,'{Wednesday,Thursday,Sunday}','Afternoon','online',4.70,18,19,9,true,true),
 ('11111111-1111-1111-1111-000000000004','Arjun Nair','NIT Trichy','B.Tech Computer Science','3rd Year','Competitive programmer. C++ STL is genuinely beautiful and I will prove it.',150,'{Saturday,Sunday}','Evening','online',4.60,12,15,7,true,true),
 ('11111111-1111-1111-1111-000000000005','Kabir Singh','Srishti Institute','B.Des Communication Design','2nd Year','Learning to code so I can build what I design.',95,'{Saturday,Sunday,Tuesday}','Evening','online',4.50,8,9,12,true,true),
 ('11111111-1111-1111-1111-000000000006','Priya Iyer','VIT Vellore','B.Tech Information Technology','3rd Year','Full-stack student dev. Currently very into React Server Components.',205,'{Saturday,Monday,Thursday}','Evening','online',4.85,22,24,10,true,true),
 ('11111111-1111-1111-1111-000000000007','Sneha Patel','BITS Pilani','M.Sc Physics','2nd Year','Physics tutor since school. I make calculus feel inevitable.',270,'{Tuesday,Thursday,Saturday}','Morning','offline',4.75,20,26,3,true,true),
 ('11111111-1111-1111-1111-000000000008','Vikram Rao','Manipal Institute of Technology','B.Tech Computer Science','4th Year','Java and DSA. Ex-intern, current interview-prep addict.',160,'{Monday,Wednesday,Friday}','Night','online',4.40,15,17,5,true,true),
 ('11111111-1111-1111-1111-000000000009','Ishita Bose','Jadavpur University','BA English Literature','3rd Year','Debate team captain. I coach people out of stage fright.',130,'{Sunday,Wednesday}','Afternoon','online',4.95,17,21,8,true,true),
 ('11111111-1111-1111-1111-000000000010','Aditya Menon','Anna University','B.E Computer Science','2nd Year','Building websites since class 9. Ask me anything about layout.',110,'{Saturday,Sunday,Friday}','Evening','online',4.30,11,13,11,true,true),
 ('11111111-1111-1111-1111-000000000011','Nikhil Joshi','Symbiosis Institute','BA Mass Communication','3rd Year','Photographer and editor. I teach colour grading that does not look like a filter.',88,'{Thursday,Saturday}','Afternoon','offline',4.60,9,10,6,true,true),
 ('11111111-1111-1111-1111-000000000012','Tanya Gupta','Christ University','BA Journalism','2nd Year','Writer. Trying to learn enough JS to build my own portfolio.',75,'{Tuesday,Sunday}','Morning','online',4.55,7,8,9,true,true),
 ('11111111-1111-1111-1111-000000000013','Rohan Desai','NMIMS Mumbai','BBA Entrepreneurship','3rd Year','Ran two campus startups. Happy to tear apart your pitch deck.',195,'{Monday,Saturday}','Evening','online',4.65,14,16,4,true,true),
 ('11111111-1111-1111-1111-000000000014','Zoya Khan','AIIMS Delhi','MBBS','2nd Year','Biochem is just cooking with rules. Let me show you.',140,'{Wednesday,Sunday}','Night','online',4.70,13,14,7,true,true),
 ('11111111-1111-1111-1111-000000000015','Karan Malhotra','Shri Ram College of Commerce','B.A Economics Honours','3rd Year','Economics and presentation coaching. I make slide decks that do not apologise.',165,'{Tuesday,Friday,Sunday}','Afternoon','online',4.50,10,12,5,true,true);

-- teaching skills
insert into public.user_skills (profile_id, skill_id, kind, level)
select p.id, s.id, 'teach', v.lvl from (values
 ('11111111-1111-1111-1111-000000000001','JavaScript','Advanced'),
 ('11111111-1111-1111-1111-000000000001','React','Advanced'),
 ('11111111-1111-1111-1111-000000000001','HTML','Expert'),
 ('11111111-1111-1111-1111-000000000001','CSS','Advanced'),
 ('11111111-1111-1111-1111-000000000002','Python','Expert'),
 ('11111111-1111-1111-1111-000000000002','Machine Learning','Advanced'),
 ('11111111-1111-1111-1111-000000000002','Data Structures & Algorithms','Advanced'),
 ('11111111-1111-1111-1111-000000000003','Figma','Expert'),
 ('11111111-1111-1111-1111-000000000003','UI/UX','Advanced'),
 ('11111111-1111-1111-1111-000000000003','Graphic Design','Advanced'),
 ('11111111-1111-1111-1111-000000000004','C++','Expert'),
 ('11111111-1111-1111-1111-000000000004','Data Structures & Algorithms','Advanced'),
 ('11111111-1111-1111-1111-000000000005','UI/UX','Advanced'),
 ('11111111-1111-1111-1111-000000000005','Graphic Design','Intermediate'),
 ('11111111-1111-1111-1111-000000000006','JavaScript','Advanced'),
 ('11111111-1111-1111-1111-000000000006','Web Development','Advanced'),
 ('11111111-1111-1111-1111-000000000007','Mathematics','Expert'),
 ('11111111-1111-1111-1111-000000000007','Physics','Expert'),
 ('11111111-1111-1111-1111-000000000008','Java','Advanced'),
 ('11111111-1111-1111-1111-000000000008','Data Structures & Algorithms','Advanced'),
 ('11111111-1111-1111-1111-000000000009','Public Speaking','Expert'),
 ('11111111-1111-1111-1111-000000000009','Communication Skills','Advanced'),
 ('11111111-1111-1111-1111-000000000009','English','Advanced'),
 ('11111111-1111-1111-1111-000000000010','Web Development','Intermediate'),
 ('11111111-1111-1111-1111-000000000010','HTML','Advanced'),
 ('11111111-1111-1111-1111-000000000010','CSS','Advanced'),
 ('11111111-1111-1111-1111-000000000011','Photography','Advanced'),
 ('11111111-1111-1111-1111-000000000011','Video Editing','Advanced'),
 ('11111111-1111-1111-1111-000000000012','Content Writing','Advanced'),
 ('11111111-1111-1111-1111-000000000012','English','Advanced'),
 ('11111111-1111-1111-1111-000000000013','Entrepreneurship','Advanced'),
 ('11111111-1111-1111-1111-000000000013','Marketing','Intermediate'),
 ('11111111-1111-1111-1111-000000000014','Chemistry','Advanced'),
 ('11111111-1111-1111-1111-000000000014','Biology','Expert'),
 ('11111111-1111-1111-1111-000000000015','Economics','Advanced'),
 ('11111111-1111-1111-1111-000000000015','Presentation Skills','Advanced')
) as v(pid, sname, lvl)
join public.profiles p on p.id = v.pid::uuid
join public.skills s on s.name = v.sname;

-- learning goals (includes the 3-person cycle: Arjun -> Priya -> Kabir -> Arjun)
insert into public.user_skills (profile_id, skill_id, kind, level)
select p.id, s.id, 'learn', v.lvl from (values
 ('11111111-1111-1111-1111-000000000001','Machine Learning','Beginner'),
 ('11111111-1111-1111-1111-000000000001','UI/UX','Beginner'),
 ('11111111-1111-1111-1111-000000000002','UI/UX','Beginner'),
 ('11111111-1111-1111-1111-000000000002','Public Speaking','Intermediate'),
 ('11111111-1111-1111-1111-000000000003','Python','Beginner'),
 ('11111111-1111-1111-1111-000000000003','JavaScript','Beginner'),
 ('11111111-1111-1111-1111-000000000004','JavaScript','Beginner'),
 ('11111111-1111-1111-1111-000000000005','C++','Beginner'),
 ('11111111-1111-1111-1111-000000000006','UI/UX','Beginner'),
 ('11111111-1111-1111-1111-000000000007','Content Writing','Beginner'),
 ('11111111-1111-1111-1111-000000000008','Figma','Beginner'),
 ('11111111-1111-1111-1111-000000000009','Python','Beginner'),
 ('11111111-1111-1111-1111-000000000010','Machine Learning','Beginner'),
 ('11111111-1111-1111-1111-000000000011','Marketing','Beginner'),
 ('11111111-1111-1111-1111-000000000012','JavaScript','Beginner'),
 ('11111111-1111-1111-1111-000000000013','Public Speaking','Intermediate'),
 ('11111111-1111-1111-1111-000000000014','Mathematics','Intermediate'),
 ('11111111-1111-1111-1111-000000000015','Entrepreneurship','Beginner')
) as v(pid, sname, lvl)
join public.profiles p on p.id = v.pid::uuid
join public.skills s on s.name = v.sname;

-- sessions
insert into public.sessions (id, teacher_id, title, skill_id, description, starts_at, duration_min, max_participants, mode, level, price_coins, objectives, meet_url, status)
select v.sid::uuid, v.tid::uuid, v.title, s.id, v.descr, now() + (v.offset_hours || ' hours')::interval,
       v.dur, v.maxp, 'online', v.lvl, v.price, v.obj, 'https://meet.google.com/demo-' || left(replace(v.sid,'-',''), 10), v.status
from (values
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-000000000004','Introduction to C++ STL','C++','Vectors, maps, sets and the algorithms header — the toolkit that wins contests.',30,60,10,'Beginner',20,'Use vector and map fluently; understand iterators; solve two live problems.','scheduled'),
 ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-000000000002','Python for Beginners','Python','Zero to writing your first useful script in 45 minutes.',54,45,12,'Beginner',15,'Variables, loops, functions, and reading a CSV file.','scheduled'),
 ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-000000000003','Figma Fundamentals','Figma','Auto-layout, components and variants without the tutorial hell.',78,60,10,'Beginner',18,'Build a reusable component set and a responsive frame.','scheduled'),
 ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-000000000001','JavaScript Closures Demystified','JavaScript','The single interview topic that trips everyone up, explained properly.',102,60,15,'Intermediate',22,'Explain scope chains; write a memoiser from scratch.','scheduled'),
 ('22222222-0000-0000-0000-000000000005','11111111-1111-1111-1111-000000000009','Speak Without Shaking','Public Speaking','A practical workshop on presence, pacing and panic.',126,45,20,'Beginner',12,'Deliver a 2-minute impromptu talk with structure.','scheduled'),
 ('22222222-0000-0000-0000-000000000006','11111111-1111-1111-1111-000000000007','Calculus Crash Course','Mathematics','Limits and derivatives rebuilt from intuition.',150,90,15,'Intermediate',25,'Differentiate confidently; understand what a limit actually means.','scheduled'),
 ('22222222-0000-0000-0000-000000000007','11111111-1111-1111-1111-000000000006','Build a React App in One Hour','React','From create-vite to a deployed component tree.',174,60,12,'Intermediate',24,'Components, props, state, and a real fetch.','scheduled'),
 ('22222222-0000-0000-0000-000000000008','11111111-1111-1111-1111-000000000008','DSA Interview Patterns','Data Structures & Algorithms','Two pointers, sliding window, and when to reach for each.',198,75,10,'Advanced',28,'Recognise four core patterns on sight.','scheduled'),
 ('22222222-0000-0000-0000-000000000009','11111111-1111-1111-1111-000000000002','Intro to Machine Learning','Machine Learning','What a model actually is, without the hype.',-168,60,10,'Beginner',20,'Train a linear regression and read its output honestly.','completed'),
 ('22222222-0000-0000-0000-000000000010','11111111-1111-1111-1111-000000000001','HTML & CSS Foundations','HTML','Semantic markup and the box model, done right the first time.',-96,60,12,'Beginner',15,'Build an accessible page layout from scratch.','completed')
) as v(sid, tid, title, sname, descr, offset_hours, dur, maxp, lvl, price, obj, status)
join public.skills s on s.name = v.sname;

-- participants
insert into public.session_participants (session_id, profile_id, coins_paid, status) values
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-000000000005',20,'joined'),
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-000000000012',20,'joined'),
 ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-000000000010',20,'joined'),
 ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-000000000003',15,'joined'),
 ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-000000000009',15,'joined'),
 ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-000000000008',18,'joined'),
 ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-000000000004',22,'joined'),
 ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-000000000012',22,'joined'),
 ('22222222-0000-0000-0000-000000000007','11111111-1111-1111-1111-000000000005',24,'joined'),
 ('22222222-0000-0000-0000-000000000009','11111111-1111-1111-1111-000000000001',20,'attended'),
 ('22222222-0000-0000-0000-000000000009','11111111-1111-1111-1111-000000000010',20,'attended'),
 ('22222222-0000-0000-0000-000000000010','11111111-1111-1111-1111-000000000005',15,'attended'),
 ('22222222-0000-0000-0000-000000000010','11111111-1111-1111-1111-000000000012',15,'attended');

insert into public.ratings (session_id, rater_id, teacher_id, stars, review) values
 ('22222222-0000-0000-0000-000000000009','11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002',5,'Rahul explained overfitting better than my professor did in a whole semester.'),
 ('22222222-0000-0000-0000-000000000009','11111111-1111-1111-1111-000000000010','11111111-1111-1111-1111-000000000002',5,'Clear, patient, and no hand-waving.'),
 ('22222222-0000-0000-0000-000000000010','11111111-1111-1111-1111-000000000005','11111111-1111-1111-1111-000000000001',5,'Finally understand the box model. Genuinely.'),
 ('22222222-0000-0000-0000-000000000010','11111111-1111-1111-1111-000000000012','11111111-1111-1111-1111-000000000001',4,'Great pace, would have liked more exercises.');

-- connections
insert into public.connections (requester_id, addressee_id, status) values
 ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000002','accepted'),
 ('11111111-1111-1111-1111-000000000001','11111111-1111-1111-1111-000000000003','accepted'),
 ('11111111-1111-1111-1111-000000000004','11111111-1111-1111-1111-000000000006','accepted'),
 ('11111111-1111-1111-1111-000000000005','11111111-1111-1111-1111-000000000004','accepted'),
 ('11111111-1111-1111-1111-000000000006','11111111-1111-1111-1111-000000000005','accepted'),
 ('11111111-1111-1111-1111-000000000012','11111111-1111-1111-1111-000000000001','accepted'),
 ('11111111-1111-1111-1111-000000000009','11111111-1111-1111-1111-000000000002','pending'),
 ('11111111-1111-1111-1111-000000000010','11111111-1111-1111-1111-000000000002','pending'),
 ('11111111-1111-1111-1111-000000000013','11111111-1111-1111-1111-000000000009','accepted'),
 ('11111111-1111-1111-1111-000000000014','11111111-1111-1111-1111-000000000007','accepted');

insert into public.books (title, author, category, description, skill_tag, price_coins, rating, cover_hue) values
 ('JavaScript: The Definitive Guide','David Flanagan','Programming','The complete reference for the language that runs the web.','JavaScript',25,4.7,42),
 ('Eloquent JavaScript','Marijn Haverbeke','Programming','A modern, humane introduction to programming with JS.','JavaScript',18,4.8,28),
 ('Effective Modern C++','Scott Meyers','Programming','42 specific ways to improve your use of C++11 and C++14.','C++',30,4.6,12),
 ('Cracking the Coding Interview','Gayle Laakmann McDowell','Programming','189 programming questions and solutions.','Data Structures & Algorithms',28,4.5,200),
 ('Automate the Boring Stuff','Al Sweigart','Data Science','Practical Python for people who have real work to do.','Python',20,4.7,155),
 ('Hands-On Machine Learning','Aurelien Geron','AI/ML','Scikit-learn, Keras and TensorFlow, end to end.','Machine Learning',35,4.9,320),
 ('Refactoring UI','Steve Schoger & Adam Wathan','Design','Design tactics for developers who have no design training.','UI/UX',22,4.8,265),
 ('The Design of Everyday Things','Don Norman','Design','Why some products delight and others infuriate.','UI/UX',24,4.6,15),
 ('Zero to One','Peter Thiel','Business','Notes on startups, or how to build the future.','Entrepreneurship',20,4.3,55),
 ('Talk Like TED','Carmine Gallo','Communication','The nine public-speaking secrets of the world''s top minds.','Public Speaking',16,4.4,340);

insert into public.coin_transactions (profile_id, type, amount, description) values
 ('11111111-1111-1111-1111-000000000002','SESSION_REWARD',40,'Taught: Intro to Machine Learning'),
 ('11111111-1111-1111-1111-000000000001','SESSION_REWARD',30,'Taught: HTML & CSS Foundations'),
 ('11111111-1111-1111-1111-000000000001','SESSION_JOIN',-20,'Reserved seat: Intro to Machine Learning'),
 ('11111111-1111-1111-1111-000000000005','SESSION_JOIN',-15,'Reserved seat: HTML & CSS Foundations'),
 ('11111111-1111-1111-1111-000000000003','BONUS',50,'Welcome bonus'),
 ('11111111-1111-1111-1111-000000000012','BONUS',50,'Welcome bonus');
