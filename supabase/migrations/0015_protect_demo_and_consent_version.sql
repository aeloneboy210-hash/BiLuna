-- Security review of step 2 (26 Nov).
-- 1. The three shared demo logins cannot have their email, password or phone changed through the sign-in
--    service (Supabase Auth). Anyone using the demo holds a real session for it, so without this one
--    visitor could change the password and lock every judge out, or take the account by changing its email.
--    Changes run by the owner in the SQL editor (as postgres) still work.
-- 2. The database checks the same consent version as the app: when the terms change, everyone is asked
--    again before they can chat, and writing new patient messages needs consent too, not only new chats.

create or replace function private.protect_demo_logins()
  returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if current_user = 'supabase_auth_admin'
     and exists (select 1 from public.demo_accounts d where d.email = lower(old.email))
     and (
       new.email is distinct from old.email
       or new.encrypted_password is distinct from old.encrypted_password
       or coalesce(new.email_change, '') <> coalesce(old.email_change, '')
       or new.phone is distinct from old.phone
       or coalesce(new.phone_change, '') <> coalesce(old.phone_change, '')
     ) then
    raise exception 'The shared demo accounts cannot be changed.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_demo_logins() from public, anon, authenticated;

create trigger protect_demo_logins
  before update on auth.users
  for each row execute function private.protect_demo_logins();

-- The current version of the Terms and Privacy Policy. Must match CONSENT_VERSION in src/lib/legal/content.ts.
create table private.app_settings (
  key text primary key,
  value text not null
);
revoke all on private.app_settings from public, anon, authenticated;
insert into private.app_settings (key, value) values ('consent_version', '2026-11-26');

create or replace function private.current_consent_version()
  returns text language sql stable security definer set search_path = ''
as $$
  select value from private.app_settings where key = 'consent_version';
$$;

create or replace function private.i_have_consented()
  returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.consented_at is not null
      and (p.is_demo or p.consent_version = private.current_consent_version())
  );
$$;

create or replace function public.record_consent(version text)
  returns void language plpgsql security definer set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;
  if version is distinct from private.current_consent_version() then
    raise exception 'bad_version' using errcode = 'P0001';
  end if;
  update public.profiles set consented_at = now(), consent_version = version where id = (select auth.uid());
end;
$$;

-- Patient messages need consent too (BiLuna's own replies are written after a consented message).
create or replace function private.require_consent_for_patient_message()
  returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.author = 'patient' and not private.i_have_consented() then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function private.require_consent_for_patient_message() from public, anon, authenticated;

create trigger messages_require_consent
  before insert on public.messages
  for each row execute function private.require_consent_for_patient_message();

revoke all on function private.current_consent_version() from public, anon;
grant execute on function private.current_consent_version() to authenticated;
