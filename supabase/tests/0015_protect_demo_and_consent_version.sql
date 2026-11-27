-- Run in a transaction that is rolled back. Every row should say PASS.
-- The demo-login protection itself fires only for the sign-in service's own database role, which a test
-- cannot take on; it was checked by reading and by signing in to the demo after it was added.
begin;
create temp table r(step text, result text) on commit drop;
grant all on r to authenticated;
do $$
declare demo uuid := (select id from auth.users where email = 'patient@biluna.demo');
        real1 uuid := gen_random_uuid(); c uuid;
begin
  insert into auth.users (id, email) values (real1, 'consent.test@example.com');
  update auth.users set updated_at = now(), encrypted_password = encrypted_password where id = demo;
  insert into r values ('owner (postgres) can still update the demo login', 'PASS');
  update auth.users set last_sign_in_at = now() where id = demo;
  insert into r values ('sign-in bookkeeping on demo not blocked', 'PASS');
  perform set_config('request.jwt.claims', json_build_object('sub', real1, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    perform public.record_consent('2020-01-01');
    insert into r values ('old consent version refused', 'FAIL');
  exception when others then insert into r values ('old consent version refused', 'PASS'); end;
  perform public.record_consent('2026-11-26');
  insert into public.conversations (title) values ('t') returning id into c;
  reset role;
  update private.app_settings set value = '2027-01-01' where key = 'consent_version';
  set local role authenticated;
  begin
    insert into public.messages (conversation_id, author, body, lang) values (c, 'patient', 'hi', 'en');
    insert into r values ('new terms: message refused until agreed again', 'FAIL');
  exception when others then insert into r values ('new terms: message refused until agreed again', case when sqlerrm = 'consent_required' then 'PASS' else 'FAIL ' || sqlerrm end); end;
  perform public.record_consent('2027-01-01');
  insert into public.messages (conversation_id, author, body, lang) values (c, 'patient', 'hi', 'en');
  insert into r values ('after agreeing again, message allowed', 'PASS');
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', demo, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (title) values ('demo') returning id into c;
  insert into public.messages (conversation_id, author, body, lang) values (c, 'patient', 'hi', 'en');
  insert into r values ('demo still chats', 'PASS');
  reset role;
end $$;
select * from r;
rollback;
