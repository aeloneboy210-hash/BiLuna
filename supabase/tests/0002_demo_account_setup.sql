-- Tests for 0002_demo_account_setup. Rolled back, so the real accounts are untouched.
begin;

do $$
declare
  n int;
  h text;
  s uuid := gen_random_uuid();
begin
  select count(*) into n
  from auth.users u join public.profiles p on p.id = u.id
  where u.email in (select email from public.demo_accounts) and u.email_confirmed_at is not null;
  if n <> 3 then raise exception 'expected 3 confirmed demo users with profiles, got %', n; end if;

  select count(*) into n
  from auth.identities i join auth.users u on u.id = i.user_id
  where u.email in (select email from public.demo_accounts) and i.provider = 'email';
  if n <> 3 then raise exception 'expected 3 email identities, got %', n; end if;

  -- Put the accounts back into the "not set up" state for the duration of the test.
  update auth.users set encrypted_password = '' where email in (select email from public.demo_accounts);
  insert into auth.users (id, email, encrypted_password) values (s, 'stranger@example.com', '');

  set local role anon;

  if not public.demo_setup_needed() then raise exception 'setup should be needed'; end if;
  if public.set_demo_password('short') then raise exception 'short password accepted'; end if;
  if public.set_demo_password(null) then raise exception 'null password accepted'; end if;
  if not public.demo_setup_needed() then raise exception 'a refused password changed the state'; end if;
  if not public.set_demo_password('correct-horse-1') then raise exception 'valid password refused'; end if;
  if public.demo_setup_needed() then raise exception 'setup still needed after success'; end if;
  if public.set_demo_password('another-pass-2') then raise exception 'second call accepted'; end if;

  reset role;

  select count(*) into n from auth.users
  where email in (select email from public.demo_accounts)
    and encrypted_password like '$2a$10$%'
    and encrypted_password = extensions.crypt('correct-horse-1', encrypted_password);
  if n <> 3 then raise exception 'expected 3 accounts with the chosen password, got %', n; end if;

  select encrypted_password into h from auth.users where id = s;
  if h <> '' then raise exception 'a non-demo account was changed'; end if;
end $$;

rollback;

select 'demo setup tests passed' as result;
