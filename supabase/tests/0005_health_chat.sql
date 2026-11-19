-- Access tests for 0005_health_chat. Runs in one transaction that is rolled back,
-- so it leaves nothing behind. Any failed check raises and aborts the run.
begin;

do $$
declare
  pa uuid; pb uuid; doc uuid; org uuid;
  ca uuid; cb uuid;
  n int;
  i int;
  ok boolean;
begin
  -- Use the real demo accounts when they exist, otherwise create them for the test.
  select id into pa from auth.users where email = 'patient@biluna.demo';
  if pa is null then pa := gen_random_uuid(); insert into auth.users (id, email) values (pa, 'patient@biluna.demo'); end if;
  select id into doc from auth.users where email = 'doctor@biluna.demo';
  if doc is null then doc := gen_random_uuid(); insert into auth.users (id, email) values (doc, 'doctor@biluna.demo'); end if;
  select id into org from auth.users where email = 'hospital@biluna.demo';
  if org is null then org := gen_random_uuid(); insert into auth.users (id, email) values (org, 'hospital@biluna.demo'); end if;

  -- A second patient, allowed only inside this rolled-back test.
  insert into public.demo_accounts (email, role, display_name) values ('patient-b@biluna.demo', 'patient', 'Test patient B');
  pb := gen_random_uuid();
  insert into auth.users (id, email) values (pb, 'patient-b@biluna.demo');

  -- Patient B makes a chat.
  perform set_config('request.jwt.claims', json_build_object('sub', pb, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (title) values ('B chat') returning id into cb;
  insert into public.messages (conversation_id, author, body, lang) values (cb, 'patient', 'hello from B', 'en');
  reset role;

  -- Patient A.
  perform set_config('request.jwt.claims', json_build_object('sub', pa, 'role', 'authenticated')::text, true);
  set local role authenticated;

  insert into public.conversations (title) values ('A chat') returning id into ca;
  insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'I have a headache', 'en');
  insert into public.messages (conversation_id, author, body, lang) values (ca, 'biluna', 'Possible reasons...', 'en');

  select count(*) into n from public.conversations;
  if n <> (select count(*) from public.conversations where patient_id = pa) or n < 1 then
    raise exception 'patient A sees conversations that are not theirs';
  end if;
  select count(*) into n from public.conversations where id = cb;
  if n <> 0 then raise exception 'patient A sees patient B conversation'; end if;
  select count(*) into n from public.messages where conversation_id = cb;
  if n <> 0 then raise exception 'patient A sees patient B messages'; end if;

  -- Writing into someone else's chat, or creating a chat in someone else's name, is refused.
  ok := false;
  begin
    insert into public.messages (conversation_id, author, body, lang) values (cb, 'patient', 'sneaky', 'en');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A wrote into patient B conversation'; end if;

  ok := false;
  begin
    insert into public.conversations (patient_id, title) values (pb, 'fake');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A created a conversation for patient B'; end if;

  -- No edits or deletes.
  begin
    update public.messages set body = 'changed' where conversation_id = ca;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient A edited a message'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.conversations where id = ca;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient A deleted a conversation'; end if;
  exception when insufficient_privilege then null;
  end;

  -- Daily limit: 40 patient messages a day. One is already sent above.
  for i in 2..40 loop
    insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'msg ' || i, 'en');
  end loop;
  ok := false;
  begin
    insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'msg 41', 'en');
  exception when others then
    if sqlerrm like '%daily_limit_reached%' then ok := true; else raise; end if;
  end;
  if not ok then raise exception '41st patient message was accepted'; end if;
  -- BiLuna can still answer the last message.
  insert into public.messages (conversation_id, author, body, lang) values (ca, 'biluna', 'reply', 'en');

  reset role;

  -- The doctor and the hospital admin see no chats at all.
  foreach i in array array[1, 2] loop
    perform set_config('request.jwt.claims',
      json_build_object('sub', case when i = 1 then doc else org end, 'role', 'authenticated')::text, true);
    set local role authenticated;
    select count(*) into n from public.conversations;
    if n <> 0 then raise exception 'staff account % sees % conversations', i, n; end if;
    select count(*) into n from public.messages;
    if n <> 0 then raise exception 'staff account % sees % messages', i, n; end if;
    ok := false;
    begin
      insert into public.conversations (title) values ('staff chat');
    exception when insufficient_privilege then ok := true;
    end;
    if not ok then raise exception 'staff account % created a conversation', i; end if;
    reset role;
  end loop;

  -- A visitor who is not signed in sees nothing.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    select count(*) into n from public.messages;
    if n <> 0 then raise exception 'anon can read messages'; end if;
  exception when insufficient_privilege then null;
  end;
  begin
    select count(*) into n from public.conversations;
    if n <> 0 then raise exception 'anon can read conversations'; end if;
  exception when insufficient_privilege then null;
  end;
  reset role;
end $$;

rollback;

select 'health chat access tests passed' as result;
