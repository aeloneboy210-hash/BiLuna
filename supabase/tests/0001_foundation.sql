-- Access tests for 0001_foundation. Runs in one transaction that is rolled back,
-- so it leaves nothing behind. Any failed check raises and aborts the run.
begin;

do $$
declare
  p uuid;
  d uuid;
  s uuid := gen_random_uuid();
  n int;
  r text;
begin
  -- Use the real demo accounts when they exist, otherwise create them for the test.
  select id into p from auth.users where email = 'patient@biluna.demo';
  if p is null then p := gen_random_uuid(); insert into auth.users (id, email) values (p, 'patient@biluna.demo'); end if;
  select id into d from auth.users where email = 'doctor@biluna.demo';
  if d is null then d := gen_random_uuid(); insert into auth.users (id, email) values (d, 'doctor@biluna.demo'); end if;

  -- No public sign-up: an email that is not a demo account cannot become an account at all.
  begin
    insert into auth.users (id, email) values (s, 'stranger@example.com');
    raise exception 'stranger account was created';
  exception when others then
    if sqlerrm = 'stranger account was created' then raise; end if;
  end;
  select count(*) into n from auth.users where id = s;
  if n <> 0 then raise exception 'stranger account exists'; end if;

  -- Profiles come from demo_accounts; an unknown email gets none.
  select role::text into r from public.profiles where id = p;
  if r is distinct from 'patient' then raise exception 'patient profile role is %', r; end if;
  select role::text into r from public.profiles where id = d;
  if r is distinct from 'doctor' then raise exception 'doctor profile role is %', r; end if;

  -- Acting as the signed-in patient.
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Since 0009 a patient also sees doctors (to share a summary with), never another patient or the hospital admin.
  select count(*) into n from public.profiles where id <> p and role <> 'doctor';
  if n <> 0 then raise exception 'patient sees % other non-doctor profiles', n; end if;
  select count(*) into n from public.profiles where id = p;
  if n <> 1 then raise exception 'patient cannot see own profile'; end if;

  begin
    update public.profiles set role = 'org_admin' where id = p;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient changed own role'; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.profiles (id, role, display_name) values (d, 'org_admin', 'x');
    raise exception 'patient inserted a profile';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.profiles where id = p;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient deleted own profile'; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    select count(*) into n from public.demo_accounts;
    if n <> 0 then raise exception 'patient can read demo_accounts'; end if;
  exception when insufficient_privilege then null;
  end;

  if public.my_role() is distinct from 'patient' then
    raise exception 'my_role() for patient is %', public.my_role();
  end if;

  reset role;

  -- Acting as a visitor who is not signed in.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;

  begin
    select count(*) into n from public.profiles;
    if n <> 0 then raise exception 'anon can read profiles'; end if;
  exception when insufficient_privilege then null;
  end;

  begin
    if public.my_role() is not null then raise exception 'my_role() for anon is not null'; end if;
  exception when insufficient_privilege then null;
  end;

  reset role;
end $$;

rollback;

select 'foundation access tests passed' as result;
