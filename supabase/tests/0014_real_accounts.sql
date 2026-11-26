-- Run in a transaction that is rolled back. Every row of the result should say PASS.
begin;
create temp table r(step text, result text) on commit drop;
grant all on r to authenticated, anon;

do $$
declare
  real1 uuid := gen_random_uuid();
  real2 uuid := gen_random_uuid();
  demo_pat uuid := (select id from auth.users where email = 'patient@biluna.demo');
  demo_doc uuid := (select id from auth.users where email = 'doctor@biluna.demo');
  realdoc uuid := gen_random_uuid();
  conv uuid;
  summ uuid;
  n int;
  prof record;
begin
  -- 1. A new sign-up becomes a real patient, named from Google's full_name, not yet agreed.
  insert into auth.users (id, email, raw_user_meta_data) values (real1, 'amina.test@example.com', '{"full_name":"Amina Test"}');
  insert into auth.users (id, email) values (real2, 'karim.test@example.com');
  select * into prof from public.profiles where id = real1;
  insert into r values ('new user is a real patient', case when prof.role = 'patient' and not prof.is_demo and prof.consented_at is null and prof.display_name = 'Amina Test' then 'PASS' else 'FAIL ' || row_to_json(prof)::text end);
  select * into prof from public.profiles where id = real2;
  insert into r values ('name falls back to email start', case when prof.display_name = 'karim.test' then 'PASS' else 'FAIL ' || prof.display_name end);
  -- a real doctor made by hand (as the owner would)
  insert into auth.users (id, email) values (realdoc, 'realdoc.test@example.com');
  update public.profiles set role = 'doctor' where id = realdoc;

  -- 2. As real1: no chat before consent.
  perform set_config('request.jwt.claims', json_build_object('sub', real1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into public.conversations (title) values ('test');
    insert into r values ('chat refused before consent', 'FAIL');
  exception when others then
    insert into r values ('chat refused before consent', case when sqlerrm = 'consent_required' then 'PASS' else 'FAIL ' || sqlerrm end);
  end;
  -- bad consent versions are refused
  begin
    perform public.record_consent('<script>');
    insert into r values ('bad consent version refused', 'FAIL');
  exception when others then
    insert into r values ('bad consent version refused', 'PASS');
  end;
  perform public.record_consent('2026-11-26');
  insert into public.conversations (title) values ('test') returning id into conv;
  insert into r values ('chat allowed after consent', case when conv is not null then 'PASS' else 'FAIL' end);

  -- 3. real1 sees real doctors only, never the demo doctor; cannot share with the demo doctor.
  select count(*) into n from public.profiles where id = demo_doc;
  insert into r values ('real patient cannot see demo doctor', case when n = 0 then 'PASS' else 'FAIL' end);
  select count(*) into n from public.profiles where id = realdoc;
  insert into r values ('real patient sees real doctor', case when n = 1 then 'PASS' else 'FAIL' end);
  insert into public.consult_summaries (conversation_id, patient_name, lang, content)
    values (conv, 'Amina', 'en', '{}'::jsonb) returning id into summ;
  begin
    insert into public.summary_shares (summary_id, doctor_id) values (summ, demo_doc);
    insert into r values ('real patient cannot share with demo doctor', 'FAIL');
  exception when others then
    insert into r values ('real patient cannot share with demo doctor', 'PASS');
  end;
  insert into public.summary_shares (summary_id, doctor_id) values (summ, realdoc);
  insert into r values ('real patient can share with real doctor', 'PASS');

  -- 4. real1 cannot see real2's or the demo patient's profile; cannot change own role.
  select count(*) into n from public.profiles where id in (real2, demo_pat);
  insert into r values ('patients cannot see each other', case when n = 0 then 'PASS' else 'FAIL' end);
  begin
    update public.profiles set role = 'doctor' where id = real1;
    get diagnostics n = row_count;
    insert into r values ('patient cannot make self a doctor', case when n = 0 then 'PASS' else 'FAIL' end);
  exception when others then
    insert into r values ('patient cannot make self a doctor', 'PASS');
  end;

  -- 5. update_my_account checks its input.
  perform public.update_my_account('Amina B', 'bn');
  begin
    perform public.update_my_account(repeat('x', 81), 'en');
    insert into r values ('too-long name refused', 'FAIL');
  exception when others then
    insert into r values ('too-long name refused', 'PASS');
  end;
  begin
    perform public.update_my_account('Amina', 'fr');
    insert into r values ('bad language refused', 'FAIL');
  exception when others then
    insert into r values ('bad language refused', 'PASS');
  end;
  reset role;
  select * into prof from public.profiles where id = real1;
  insert into r values ('account updated', case when prof.display_name = 'Amina B' and prof.lang = 'bn' then 'PASS' else 'FAIL' end);

  -- 6. The demo doctor sees no real summaries.
  perform set_config('request.jwt.claims', json_build_object('sub', demo_doc, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.consult_summaries where id = summ;
  insert into r values ('demo doctor cannot read real summary', case when n = 0 then 'PASS' else 'FAIL' end);
  reset role;

  -- 7. Demo accounts cannot be deleted or renamed by their (shared) users.
  perform set_config('request.jwt.claims', json_build_object('sub', demo_pat, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.delete_my_account();
    insert into r values ('demo account cannot be deleted', 'FAIL');
  exception when others then
    insert into r values ('demo account cannot be deleted', case when sqlerrm = 'demo_account' then 'PASS' else 'FAIL ' || sqlerrm end);
  end;
  begin
    perform public.update_my_account('hacked', 'en');
    insert into r values ('demo account cannot be renamed', 'FAIL');
  exception when others then
    insert into r values ('demo account cannot be renamed', 'PASS');
  end;
  reset role;

  -- 8. real1 deletes their account: login and every row they own are gone; real2 untouched.
  perform set_config('request.jwt.claims', json_build_object('sub', real1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  perform public.delete_my_account();
  reset role;
  select count(*) into n from auth.users where id = real1;
  insert into r values ('login deleted', case when n = 0 then 'PASS' else 'FAIL' end);
  select (select count(*) from public.profiles where id = real1)
       + (select count(*) from public.conversations where patient_id = real1)
       + (select count(*) from public.consult_summaries where patient_id = real1)
       + (select count(*) from public.summary_shares where patient_id = real1) into n;
  insert into r values ('all their data deleted', case when n = 0 then 'PASS' else 'FAIL ' || n end);
  select count(*) into n from auth.users where id = real2;
  insert into r values ('other accounts untouched', case when n = 1 then 'PASS' else 'FAIL' end);

  -- 9. Signed-out visitors cannot call the account functions.
  set local role anon;
  begin
    perform public.delete_my_account();
    insert into r values ('anon cannot delete', 'FAIL');
  exception when others then
    insert into r values ('anon cannot delete', 'PASS');
  end;
  reset role;
end $$;

select * from r;
rollback;
