-- Access tests for 0006_intelligence. One transaction, rolled back; any failed check raises.
begin;

do $$
declare
  pa uuid; pb uuid; doc uuid; org uuid;
  ca uuid; cb uuid; ma uuid; mb uuid; pmsg uuid;
  n int;
  ok boolean;
begin
  -- A fresh test patient A, so the demo patient's real (fictional) profile and history don't affect the counts.
  insert into public.demo_accounts (email, role, display_name) values ('patient-a@biluna.demo', 'patient', 'Test patient A');
  pa := gen_random_uuid();
  insert into auth.users (id, email) values (pa, 'patient-a@biluna.demo');
  select id into doc from auth.users where email = 'doctor@biluna.demo';
  select id into org from auth.users where email = 'hospital@biluna.demo';
  if pa is null or doc is null or org is null then raise exception 'demo accounts missing'; end if;

  insert into public.demo_accounts (email, role, display_name) values ('patient-b@biluna.demo', 'patient', 'Test patient B');
  pb := gen_random_uuid();
  insert into auth.users (id, email) values (pb, 'patient-b@biluna.demo');

  -- Patient B: a profile, a chat with a BiLuna reply, an event.
  perform set_config('request.jwt.claims', json_build_object('sub', pb, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.health_profiles (age, allergies, use_in_chat) values (40, 'penicillin', true);
  insert into public.conversations (title) values ('B') returning id into cb;
  insert into public.messages (conversation_id, author, body, lang) values (cb, 'biluna', 'reply B', 'en') returning id into mb;
  insert into public.ai_events (kind, lang) values ('reply', 'en');
  reset role;

  -- Patient A.
  perform set_config('request.jwt.claims', json_build_object('sub', pa, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- Profile: own row only, consent off by default, editable and deletable.
  insert into public.health_profiles (age, blood_group) values (34, 'B+');
  select count(*) into n from public.health_profiles;
  if n <> 1 then raise exception 'patient A sees % profiles', n; end if;
  select count(*) into n from public.health_profiles where use_in_chat;
  if n <> 0 then raise exception 'consent was on by default'; end if;
  update public.health_profiles set use_in_chat = true, allergies = 'none' where patient_id = pa;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'patient A could not update own profile'; end if;
  update public.health_profiles set allergies = 'hacked' where patient_id = pb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'patient A updated patient B profile'; end if;
  ok := false;
  begin
    insert into public.health_profiles (patient_id, age) values (pb, 1);
  exception when insufficient_privilege or unique_violation then ok := true;
  end;
  if not ok then raise exception 'patient A wrote a profile for patient B'; end if;
  ok := false;
  begin
    update public.health_profiles set blood_group = 'Z+' where patient_id = pa;
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'invalid blood group accepted'; end if;

  -- Feedback: only on BiLuna replies in own chats, one per message, changeable.
  insert into public.conversations (title) values ('A') returning id into ca;
  insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'hi', 'en') returning id into pmsg;
  insert into public.messages (conversation_id, author, body, lang) values (ca, 'biluna', 'reply A', 'en') returning id into ma;
  insert into public.message_feedback (message_id, rating) values (ma, 1);
  insert into public.message_feedback (message_id, rating) values (ma, -1)
    on conflict (message_id) do update set rating = excluded.rating;
  select rating into n from public.message_feedback where message_id = ma;
  if n <> -1 then raise exception 'feedback was not changed'; end if;
  ok := false;
  begin
    insert into public.message_feedback (message_id, rating) values (mb, 1);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A rated patient B message'; end if;
  ok := false;
  begin
    insert into public.message_feedback (message_id, rating) values (pmsg, 1);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A rated their own message'; end if;
  ok := false;
  begin
    update public.message_feedback set message_id = mb where message_id = ma;
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A moved feedback to another message'; end if;

  -- Events: own only, append-only.
  insert into public.ai_events (kind, lang) values ('reply', 'bn');
  select count(*) into n from public.ai_events;
  if n <> 1 then raise exception 'patient A sees % events', n; end if;
  ok := false;
  begin
    insert into public.ai_events (patient_id, kind) values (pb, 'reply');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A logged an event for patient B'; end if;
  begin
    delete from public.ai_events;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient A deleted events'; end if;
  exception when insufficient_privilege then null;
  end;
  ok := false;
  begin
    insert into public.ai_events (kind) values ('made_up');
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'unknown event kind accepted'; end if;

  -- Deleting the profile works and removes it.
  delete from public.health_profiles where patient_id = pa;
  select count(*) into n from public.health_profiles;
  if n <> 0 then raise exception 'profile was not deleted'; end if;
  reset role;

  -- Doctor and hospital see none of it.
  foreach n in array array[1, 2] loop
    perform set_config('request.jwt.claims',
      json_build_object('sub', case when n = 1 then doc else org end, 'role', 'authenticated')::text, true);
    set local role authenticated;
    if (select count(*) from public.health_profiles) <> 0 then raise exception 'staff sees profiles'; end if;
    if (select count(*) from public.ai_events) <> 0 then raise exception 'staff sees events'; end if;
    if (select count(*) from public.message_feedback) <> 0 then raise exception 'staff sees feedback'; end if;
    ok := false;
    begin
      insert into public.health_profiles (age) values (1);
    exception when insufficient_privilege then ok := true;
    end;
    if not ok then raise exception 'staff created a profile'; end if;
    reset role;
  end loop;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    if (select count(*) from public.health_profiles) <> 0 then raise exception 'anon sees profiles'; end if;
  exception when insufficient_privilege then null;
  end;
  reset role;
end $$;

rollback;

select 'intelligence access tests passed' as result;
