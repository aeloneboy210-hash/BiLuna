-- Step 2: real accounts (26 Nov). Anyone may now sign up (Google or email); every new account is a
-- patient. Doctor and hospital roles are still given only by hand. The three shared demo accounts are
-- marked as demo, and demo and real accounts can never reach each other's data: a real patient cannot
-- see or share with the demo doctor, and the demo doctor can only ever receive demo summaries.
-- Using BiLuna needs the person's recorded consent. A person can delete their own account.

alter table public.profiles
  add column is_demo boolean not null default false,
  add column consented_at timestamptz,
  add column consent_version text check (consent_version is null or char_length(consent_version) <= 20),
  add column lang text check (lang is null or lang in ('en', 'bn'));

-- The demo accounts are demo, and count as having agreed (judges try them with one tap).
update public.profiles p
set is_demo = true, consented_at = now(), consent_version = 'demo'
where exists (
  select 1 from auth.users u join public.demo_accounts d on d.email = lower(u.email) where u.id = p.id
);

-- New accounts: a demo email gets its listed profile; anyone else becomes a real patient, named from
-- what Google or the sign-up form gave (or the start of their email), at most 80 characters.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  account public.demo_accounts%rowtype;
  given text;
begin
  select * into account from public.demo_accounts d where d.email = lower(new.email);

  if found then
    insert into public.profiles (id, role, display_name, is_demo, consented_at, consent_version)
    values (new.id, account.role, account.display_name, true, now(), 'demo');
    return new;
  end if;

  given := btrim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(coalesce(new.email, ''), '@', 1),
    ''
  ));
  if given = '' then
    given := 'BiLuna user';
  end if;

  insert into public.profiles (id, role, display_name, is_demo)
  values (new.id, 'patient', left(given, 80), false);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Small yes/no lookups used by the rules below. Private schema: not callable through the API.
create or replace function private.i_am_demo()
  returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_demo from public.profiles p where p.id = (select auth.uid())), false);
$$;

create or replace function private.is_demo_account(uid uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_demo from public.profiles p where p.id = uid), false);
$$;

create or replace function private.i_have_consented()
  returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.consented_at is not null);
$$;

revoke all on function private.i_am_demo(), private.is_demo_account(uuid), private.i_have_consented() from public, anon;
grant execute on function private.i_am_demo(), private.is_demo_account(uuid), private.i_have_consented() to authenticated;

-- Patients see only doctors on their own side (demo with demo, real with real).
drop policy "Patients see doctors to share with" on public.profiles;
create policy "Patients see doctors to share with"
  on public.profiles for select to authenticated
  using (role = 'doctor' and (select public.my_role()) = 'patient' and is_demo = (select private.i_am_demo()));

-- Sharing only with a doctor on the same side.
drop policy "Patients share their own summaries with a doctor" on public.summary_shares;
create policy "Patients share their own summaries with a doctor"
  on public.summary_shares for insert to authenticated
  with check (
    patient_id = (select auth.uid())
    and (select public.my_role()) = 'patient'
    and revoked_at is null
    and private.owns_summary(summary_id)
    and exists (select 1 from public.profiles p where p.id = doctor_id and p.role = 'doctor')
    and private.is_demo_account(doctor_id) = (select private.i_am_demo())
  );

-- No chat without consent: starting a conversation is refused until the person has agreed.
create or replace function private.require_consent()
  returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not private.i_have_consented() then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.require_consent() from public, anon, authenticated;

create trigger conversations_require_consent
  before insert on public.conversations
  for each row execute function private.require_consent();

-- The person's own account actions. Each works only on the signed-in person's own row.
create or replace function public.record_consent(version text)
  returns void language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if version is null or char_length(version) > 20 or version !~ '^[0-9a-z.-]+$' then
    raise exception 'bad_version' using errcode = 'P0001';
  end if;
  update public.profiles set consented_at = now(), consent_version = version where id = (select auth.uid());
end;
$$;

create or replace function public.update_my_account(new_name text, new_lang text)
  returns void language plpgsql security definer set search_path = ''
as $$
declare
  clean text := btrim(coalesce(new_name, ''));
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if private.i_am_demo() then
    raise exception 'demo_account' using errcode = 'P0001';
  end if;
  if clean = '' or char_length(clean) > 80 then
    raise exception 'bad_name' using errcode = 'P0001';
  end if;
  if new_lang is not null and new_lang not in ('en', 'bn') then
    raise exception 'bad_lang' using errcode = 'P0001';
  end if;
  update public.profiles set display_name = clean, lang = new_lang where id = (select auth.uid());
end;
$$;

-- Deletes the signed-in person's login; every row they own goes with it (on delete cascade).
-- The shared demo accounts cannot be deleted.
create or replace function public.delete_my_account()
  returns void language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if private.i_am_demo() then
    raise exception 'demo_account' using errcode = 'P0001';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.record_consent(text), public.update_my_account(text, text), public.delete_my_account() from public, anon;
grant execute on function public.record_consent(text), public.update_my_account(text, text), public.delete_my_account() to authenticated;
