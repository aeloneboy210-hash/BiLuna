-- One-time setup of the three demo accounts.
--
-- The accounts are created here with NO password, so nobody can sign in yet.
-- The project owner then chooses one password on the app's /setup page, which calls
-- set_demo_password(). That function works exactly once: as soon as the demo accounts
-- have a password it refuses every further call. It can only ever touch the three
-- emails listed in demo_accounts.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  d.email, '', now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from public.demo_accounts d
where not exists (select 1 from auth.users u where u.email = d.email);

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now()
from auth.users u
where u.email in (select email from public.demo_accounts)
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

-- True while any demo account still has no password.
create function public.demo_setup_needed()
  returns boolean
  language sql
  stable
  security definer
  set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.email in (select email from public.demo_accounts)
      and coalesce(u.encrypted_password, '') = ''
  );
$$;

-- Sets the same password on every demo account that has none. Returns false and changes
-- nothing when the password is too short or too long, or when setup is already done.
create function public.set_demo_password(new_password text)
  returns boolean
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  if new_password is null or length(new_password) < 8 or length(new_password) > 72 then
    return false;
  end if;

  if not public.demo_setup_needed() then
    return false;
  end if;

  update auth.users u
  set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where u.email in (select email from public.demo_accounts)
    and coalesce(u.encrypted_password, '') = '';

  return true;
end;
$$;

revoke execute on function public.demo_setup_needed() from public;
revoke execute on function public.set_demo_password(text) from public;
grant execute on function public.demo_setup_needed() to anon, authenticated;
grant execute on function public.set_demo_password(text) to anon, authenticated;
