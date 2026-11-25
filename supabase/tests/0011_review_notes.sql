-- Access tests for 0011_review_notes. One transaction, rolled back; any failed check raises.
begin;

do $$
declare
  pa uuid; pb uuid; doc uuid; org uuid;
  sa uuid; sb uuid; ra uuid;
  n int;
  ok boolean;
begin
  select id into pa from auth.users where email = 'patient@biluna.demo';
  select id into doc from auth.users where email = 'doctor@biluna.demo';
  select id into org from auth.users where email = 'hospital@biluna.demo';
  if pa is null or doc is null or org is null then raise exception 'demo accounts missing'; end if;

  insert into public.demo_accounts (email, role, display_name) values ('patient-b@biluna.demo', 'patient', 'Test patient B');
  pb := gen_random_uuid();
  insert into auth.users (id, email) values (pb, 'patient-b@biluna.demo');

  -- Patient B: a summary that is NOT shared.
  perform set_config('request.jwt.claims', json_build_object('sub', pb, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.consult_summaries (patient_name, lang, content) values ('B', 'en', '{}') returning id into sb;
  reset role;

  -- Patient A: a summary shared with the doctor.
  perform set_config('request.jwt.claims', json_build_object('sub', pa, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.consult_summaries (patient_name, lang, content) values ('A', 'en', '{}') returning id into sa;
  insert into public.summary_shares (summary_id, doctor_id) values (sa, doc);
  -- A patient cannot write a doctor's note.
  ok := false;
  begin
    insert into public.summary_reviews (summary_id, doctor_id, body) values (sa, doc, 'fake note');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'patient wrote a doctor note'; end if;
  reset role;

  -- Doctor.
  perform set_config('request.jwt.claims', json_build_object('sub', doc, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.summary_reviews (summary_id, body) values (sa, 'Please come to the clinic on Sunday.') returning id into ra;
  select count(*) into n from public.summary_reviews where id = ra and patient_id = pa and doctor_id = doc;
  if n <> 1 then raise exception 'note not tied to the summary owner'; end if;
  -- Only one note per summary; editing works while shared.
  ok := false;
  begin
    insert into public.summary_reviews (summary_id, body) values (sa, 'second');
  exception when unique_violation then ok := true;
  end;
  if not ok then raise exception 'doctor wrote two notes on one summary'; end if;
  update public.summary_reviews set body = 'Edited note', updated_at = now() where id = ra;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'doctor could not edit own note'; end if;
  -- Not on an unshared summary.
  ok := false;
  begin
    insert into public.summary_reviews (summary_id, body) values (sb, 'not shared');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'doctor wrote on an unshared summary'; end if;
  -- Cannot move the note to another patient, cannot write an empty note.
  ok := false;
  begin
    update public.summary_reviews set patient_id = pb where id = ra;
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'doctor moved a note to another patient'; end if;
  ok := false;
  begin
    update public.summary_reviews set body = '   ' where id = ra;
  exception when check_violation then ok := true;
  end;
  if not ok then raise exception 'empty note accepted'; end if;
  reset role;

  -- Patient B sees nothing; patient A sees the note but cannot change it.
  perform set_config('request.jwt.claims', json_build_object('sub', pb, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.summary_reviews;
  if n <> 0 then raise exception 'patient B sees % notes', n; end if;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', pa, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.summary_reviews where body = 'Edited note';
  if n <> 1 then raise exception 'patient A cannot see the note'; end if;
  update public.summary_reviews set body = 'changed by patient' where id = ra;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'patient changed the doctor note'; end if;
  -- Stop sharing: the patient keeps the note.
  update public.summary_shares set revoked_at = now() where summary_id = sa and revoked_at is null;
  select count(*) into n from public.summary_reviews;
  if n <> 1 then raise exception 'patient lost the note after stopping the share'; end if;
  reset role;

  -- After the stop, the doctor can neither see nor change the note.
  perform set_config('request.jwt.claims', json_build_object('sub', doc, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.summary_reviews;
  if n <> 0 then raise exception 'doctor still sees the note after the share stopped'; end if;
  update public.summary_reviews set body = 'after stop', updated_at = now() where id = ra;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'doctor changed the note after the share stopped'; end if;
  ok := false;
  begin
    insert into public.summary_reviews (summary_id, body) values (sa, 'after stop');
  exception when insufficient_privilege or unique_violation then ok := true;
  end;
  if not ok then raise exception 'doctor wrote a note after the share stopped'; end if;
  reset role;

  -- Hospital admin sees nothing and writes nothing.
  perform set_config('request.jwt.claims', json_build_object('sub', org, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.summary_reviews;
  if n <> 0 then raise exception 'hospital admin sees % notes', n; end if;
  ok := false;
  begin
    insert into public.summary_reviews (summary_id, body) values (sa, 'org');
  exception when insufficient_privilege then ok := true;
  end;
  if not ok then raise exception 'hospital admin wrote a note'; end if;
  reset role;

  raise notice 'all 0011 checks passed';
end $$;

rollback;
