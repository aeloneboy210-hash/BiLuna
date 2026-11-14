-- BiLuna foundation: roles, profiles and the rule that a role cannot be changed from the browser.

create type public.app_role as enum ('patient', 'doctor', 'org_admin');

-- One row per account. The role decides which portal the account may open.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- The only emails that receive a profile. All three are fictional demo accounts.
create table public.demo_accounts (
  email text primary key,
  role public.app_role not null,
  display_name text not null
);

insert into public.demo_accounts (email, role, display_name) values
  ('patient@biluna.demo', 'patient', 'Rahima (demo patient)'),
  ('doctor@biluna.demo', 'doctor', 'Dr. Karim (demo doctor)'),
  ('hospital@biluna.demo', 'org_admin', 'Demo Hospital Admin');

alter table public.profiles enable row level security;
alter table public.demo_accounts enable row level security;

-- Start from nothing, then grant only what is needed.
revoke all on public.profiles from anon, authenticated;
revoke all on public.demo_accounts from anon, authenticated;
grant select on public.profiles to authenticated;

-- A signed-in user can read their own profile and nothing else.
-- There is deliberately no insert, update or delete policy.
create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- The caller's role, or null. Runs with the caller's rights, so the policy above applies.
create function public.my_role()
  returns public.app_role
  language sql
  stable
  set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- When an account is created, give it the profile listed for its email.
-- An email that is not a demo account gets no profile and therefore no portal.
create function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  select new.id, d.role, d.display_name
  from public.demo_accounts d
  where d.email = lower(new.email);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
