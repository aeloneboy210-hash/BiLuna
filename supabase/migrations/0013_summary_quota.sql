-- Bug hunt (26 Nov): making a doctor summary calls the AI too, but only chat messages were counted, so
-- remaking summaries in a loop could use up the free AI plan for everyone. A summary now counts as one
-- message in the same daily tally (150 a day, Dhaka time). The tally belongs to the signed-in patient,
-- so calling this directly only spends their own allowance.
create or replace function public.use_ai_quota()
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Dhaka')::date;
  me uuid := (select auth.uid());
  n int;
begin
  if me is null then
    raise exception 'not_signed_in' using errcode = 'P0001';
  end if;

  insert into public.daily_usage (patient_id, day, sent)
  values (me, today, 1)
  on conflict (patient_id, day) do update set sent = public.daily_usage.sent + 1
  returning sent into n;

  -- The exception also undoes the +1 above. Must match DAILY_MESSAGE_LIMIT in src/lib/intelligence/stats.ts.
  if n > 150 then
    raise exception 'daily_limit_reached' using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.use_ai_quota() from public, anon;
grant execute on function public.use_ai_quota() to authenticated;
