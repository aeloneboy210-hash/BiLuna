-- The owner raised the demo's daily message limit from 40 to 150 (26 Nov), so rehearsals and judges on the
-- shared demo patient account do not run out on stage. It still protects the free AI plan from being used up.
-- Must match DAILY_MESSAGE_LIMIT in src/lib/intelligence/stats.ts.
create or replace function public.enforce_daily_message_limit()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Dhaka')::date;
  n int;
begin
  if new.author <> 'patient' then
    return new;
  end if;

  insert into public.daily_usage (patient_id, day, sent)
  values ((select auth.uid()), today, 1)
  on conflict (patient_id, day) do update set sent = public.daily_usage.sent + 1
  returning sent into n;

  -- The exception also undoes the +1 above, so the tally stays at 150.
  if n > 150 then
    raise exception 'daily_limit_reached' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_daily_message_limit() from public, anon, authenticated;
