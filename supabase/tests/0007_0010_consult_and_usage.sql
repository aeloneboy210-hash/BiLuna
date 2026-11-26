-- Access tests for 0007 (delete chats), 0008 (daily usage), 0009/0010 (Consultation Prep summaries and shares).
-- One transaction, rolled back; any failed check raises. Works whatever the demo patient already sent today.
begin;

do $$
declare
  pa uuid; pb uuid; doc uuid; org uuid;
  ca uuid; cb uuid; cdel uuid;
  sa uuid; sb uuid; sh uuid;
  n int; i int; ok boolean; before int;
begin
  select id into pa from auth.users where email = 'patient@biluna.demo';
  select id into doc from auth.users where email = 'doctor@biluna.demo';
  select id into org from auth.users where email = 'hospital@biluna.demo';
  if pa is null or doc is null or org is null then raise exception 'demo accounts missing'; end if;

  insert into public.demo_accounts (email, role, display_name) values ('patient-b@biluna.demo', 'patient', 'Test patient B');
  pb := gen_random_uuid();
  insert into auth.users (id, email) values (pb, 'patient-b@biluna.demo');

  -- Patient B: a chat, a message, a summary.
  perform set_config('request.jwt.claims', json_build_object('sub', pb, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.conversations (title) values ('B chat') returning id into cb;
  insert into public.messages (conversation_id, author, body, lang) values (cb, 'patient', 'hello from B', 'en');
  insert into public.consult_summaries (patient_name, lang, content) values ('B', 'en', '{}') returning id into sb;
  reset role;

  select coalesce((select sent from public.daily_usage
                   where patient_id = pa and day = (now() at time zone 'Asia/Dhaka')::date), 0) into before;

  -- ===== Patient A =====
  perform set_config('request.jwt.claims', json_build_object('sub', pa, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 0007: cannot delete B's chat; can delete own (messages go with it).
  delete from public.conversations where id = cb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'patient A deleted patient B chat'; end if;
  insert into public.conversations (title) values ('to delete') returning id into cdel;
  insert into public.messages (conversation_id, author, body, lang) values (cdel, 'biluna', 'x', 'en');
  delete from public.conversations where id = cdel;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'patient A could not delete own chat'; end if;

  -- 0008: the tally is read-only for the patient and private.
  begin
    update public.daily_usage set sent = 0 where patient_id = pa;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient reset own usage'; end if;
  exception when insufficient_privilege then null;
  end;
  ok := false;
  begin
    insert into public.daily_usage (patient_id, day, sent) values (pa, current_date + 1, 0);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient inserted a usage row'; end if;
  begin
    delete from public.daily_usage where patient_id = pa;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'patient deleted usage'; end if;
  exception when insufficient_privilege then null;
  end;
  select count(*) into n from public.daily_usage where patient_id <> pa;
  if n <> 0 then raise exception 'patient A sees other patients usage'; end if;
  ok := false;
  begin
    perform public.enforce_daily_message_limit();
  exception when others then ok := true;
  end;
  if not ok then raise exception 'patient could call the usage function directly'; end if;

  -- 0008: limit at 150 a day, and deleting chats does not reset it.
  insert into public.conversations (title) values ('A chat') returning id into ca;
  for i in (before + 1)..150 loop
    insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'msg ' || i, 'en');
  end loop;
  ok := false;
  begin
    insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'msg 151', 'en');
  exception when others then
    if sqlerrm like '%daily_limit_reached%' then ok := true; else raise; end if;
  end;
  if not ok then raise exception '151st patient message was accepted'; end if;
  delete from public.conversations where id = ca;
  insert into public.conversations (title) values ('after delete') returning id into ca;
  ok := false;
  begin
    insert into public.messages (conversation_id, author, body, lang) values (ca, 'patient', 'after delete', 'en');
  exception when others then
    if sqlerrm like '%daily_limit_reached%' then ok := true; else raise; end if;
  end;
  if not ok then raise exception 'deleting chats reset the daily limit'; end if;
  insert into public.messages (conversation_id, author, body, lang) values (ca, 'biluna', 'BiLuna still replies', 'en');

  -- 0009: own summaries only.
  insert into public.consult_summaries (conversation_id, patient_name, lang, content)
    values (ca, 'A', 'en', '{}') returning id into sa;
  select count(*) into n from public.consult_summaries where patient_id <> pa;
  if n <> 0 then raise exception 'patient A sees other summaries'; end if;
  ok := false;
  begin
    insert into public.consult_summaries (patient_id, patient_name, lang, content) values (pb, 'fake', 'en', '{}');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A made a summary in B''s name'; end if;
  update public.consult_summaries set patient_name = 'x' where id = sb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'patient A changed B''s summary'; end if;
  delete from public.consult_summaries where id = sb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'patient A deleted B''s summary'; end if;
  ok := false;
  begin
    update public.consult_summaries set patient_id = pb where id = sa;
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A moved a summary to B'; end if;

  -- 0009/0010: sharing rules.
  ok := false;
  begin
    insert into public.summary_shares (summary_id, doctor_id) values (sb, doc);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A shared B''s summary'; end if;
  ok := false;
  begin
    insert into public.summary_shares (summary_id, doctor_id) values (sa, org);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A shared with a non-doctor (hospital admin)'; end if;
  ok := false;
  begin
    insert into public.summary_shares (summary_id, doctor_id) values (sa, pb);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A shared with another patient'; end if;
  ok := false;
  begin
    insert into public.summary_shares (summary_id, patient_id, doctor_id) values (sa, pb, doc);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient A faked the share owner'; end if;
  ok := false;
  begin
    insert into public.summary_shares (summary_id, doctor_id, revoked_at) values (sa, doc, now());
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'share created already stopped'; end if;
  insert into public.summary_shares (summary_id, doctor_id) values (sa, doc) returning id into sh;
  ok := false;
  begin
    insert into public.summary_shares (summary_id, doctor_id) values (sa, doc);
  exception when unique_violation then ok := true;
  end;
  if not ok then raise exception 'two live shares with the same doctor'; end if;
  ok := false;
  begin
    update public.summary_shares set doctor_id = org where id = sh;
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient changed the doctor on a share'; end if;
  reset role;

  -- ===== Doctor while shared =====
  perform set_config('request.jwt.claims', json_build_object('sub', doc, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.consult_summaries where id = sa;
  if n <> 1 then raise exception 'doctor cannot read the shared summary'; end if;
  select count(*) into n from public.consult_summaries where id = sb;
  if n <> 0 then raise exception 'doctor reads an unshared summary'; end if;
  select count(*) into n from public.conversations;
  if n <> 0 then raise exception 'doctor sees chats'; end if;
  update public.consult_summaries set patient_name = 'doc edit' where id = sa;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'doctor edited a summary'; end if;
  delete from public.consult_summaries where id = sa;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'doctor deleted a summary'; end if;
  update public.summary_shares set revoked_at = now() where id = sh;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'doctor changed a share'; end if;
  ok := false;
  begin
    insert into public.summary_shares (summary_id, doctor_id) values (sb, doc);
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'doctor shared a summary with themself'; end if;
  ok := false;
  begin
    insert into public.consult_summaries (patient_name, lang, content) values ('doc', 'en', '{}');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'doctor created a summary'; end if;
  reset role;

  -- ===== Patient A stops the share; cannot restart it =====
  perform set_config('request.jwt.claims', json_build_object('sub', pa, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.summary_shares set revoked_at = now() where id = sh;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'patient could not stop the share'; end if;
  update public.summary_shares set revoked_at = null where id = sh;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'patient restarted a stopped share'; end if;
  reset role;

  -- ===== Doctor after the stop =====
  perform set_config('request.jwt.claims', json_build_object('sub', doc, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.consult_summaries where id = sa;
  if n <> 0 then raise exception 'doctor still reads the summary after the stop'; end if;
  reset role;

  -- ===== Hospital admin and Patient B =====
  perform set_config('request.jwt.claims', json_build_object('sub', org, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.consult_summaries;
  if n <> 0 then raise exception 'hospital admin sees % summaries', n; end if;
  select count(*) into n from public.summary_shares;
  if n <> 0 then raise exception 'hospital admin sees % shares', n; end if;
  select count(*) into n from public.daily_usage;
  if n <> 0 then raise exception 'hospital admin sees usage'; end if;
  delete from public.conversations where id = cb;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'hospital admin deleted a chat'; end if;
  ok := false;
  begin
    insert into public.consult_summaries (patient_name, lang, content) values ('org', 'en', '{}');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'hospital admin created a summary'; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', pb, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.consult_summaries where id = sa;
  if n <> 0 then raise exception 'patient B reads A''s summary'; end if;
  select count(*) into n from public.summary_shares where summary_id = sa;
  if n <> 0 then raise exception 'patient B sees A''s shares'; end if;
  select count(*) into n from public.daily_usage where patient_id = pa;
  if n <> 0 then raise exception 'patient B sees A''s usage'; end if;
  reset role;

  -- The tally: exactly 40 for A today, 1 for B.
  select sent into n from public.daily_usage where patient_id = pa and day = (now() at time zone 'Asia/Dhaka')::date;
  if n <> 150 then raise exception 'A tally is % not 150', n; end if;
  select sent into n from public.daily_usage where patient_id = pb;
  if n <> 1 then raise exception 'B tally is % not 1', n; end if;

  -- Anonymous visitors see nothing.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  foreach i in array array[1, 2, 3] loop
    begin
      if i = 1 then select count(*) into n from public.consult_summaries;
      elsif i = 2 then select count(*) into n from public.summary_shares;
      else select count(*) into n from public.daily_usage; end if;
      if n <> 0 then raise exception 'anon reads table %', i; end if;
    exception when insufficient_privilege then null;
    end;
  end loop;
  reset role;

  raise notice 'all 0007-0010 checks passed';
end $$;

rollback;
