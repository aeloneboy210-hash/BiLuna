-- Tests for the demo account setup (0002) and its lock (0003).
-- Rolled back, so the real accounts and their password are untouched.
begin;

do $$
declare
  n int;
  caller text;
begin
  -- The three demo accounts exist, are confirmed, have a profile and can sign in with email.
  select count(*) into n
  from auth.users u join public.profiles p on p.id = u.id
  where u.email in (select email from public.demo_accounts) and u.email_confirmed_at is not null;
  if n <> 3 then raise exception 'expected 3 confirmed demo users with profiles, got %', n; end if;

  select count(*) into n
  from auth.identities i join auth.users u on u.id = i.user_id
  where u.email in (select email from public.demo_accounts) and i.provider = 'email';
  if n <> 3 then raise exception 'expected 3 email identities, got %', n; end if;

  -- The lock: nobody outside the database may call the setup function, even with setup pending.
  if has_function_privilege('anon', 'public.set_demo_password(text)', 'execute') then
    raise exception 'anon may call set_demo_password';
  end if;
  if has_function_privilege('authenticated', 'public.set_demo_password(text)', 'execute') then
    raise exception 'authenticated may call set_demo_password';
  end if;

  update auth.users set encrypted_password = '' where email in (select email from public.demo_accounts);

  foreach caller in array array['anon', 'authenticated'] loop
    execute format('set local role %I', caller);
    begin
      perform public.set_demo_password('correct-horse-1');
      raise exception '% called set_demo_password', caller;
    exception when insufficient_privilege then null;
    end;
    reset role;
  end loop;

  -- Run as the owner (as after a reset from the SQL editor): once only, length checked, demo emails only.
  if not public.demo_setup_needed() then raise exception 'setup should be needed'; end if;
  if public.set_demo_password('short') then raise exception 'short password accepted'; end if;
  if public.set_demo_password(null) then raise exception 'null password accepted'; end if;
  if not public.demo_setup_needed() then raise exception 'a refused password changed the state'; end if;
  if not public.set_demo_password('correct-horse-1') then raise exception 'valid password refused'; end if;
  if public.demo_setup_needed() then raise exception 'setup still needed after success'; end if;
  if public.set_demo_password('another-pass-2') then raise exception 'second call accepted'; end if;

  select count(*) into n from auth.users
  where email in (select email from public.demo_accounts)
    and encrypted_password like '$2a$10$%'
    and encrypted_password = extensions.crypt('correct-horse-1', encrypted_password);
  if n <> 3 then raise exception 'expected 3 accounts with the chosen password, got %', n; end if;

  select count(*) into n from auth.users where email not in (select email from public.demo_accounts);
  if n <> 0 then raise exception '% accounts exist that are not demo accounts', n; end if;
end $$;

rollback;

select 'demo setup tests passed' as result;
