-- The 40-messages-a-day limit now counts in its own tally, so deleting chats cannot reset it
-- (that would let anyone use up the free AI quota). Patients can read their own tally, never change it.
create table public.daily_usage (
  patient_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  sent int not null default 0,
  primary key (patient_id, day)
);

alter table public.daily_usage enable row level security;
revoke all on public.daily_usage from anon, authenticated;
grant select on public.daily_usage to authenticated;

create policy "Patients read their own daily usage"
  on public.daily_usage for select
  to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');

-- Counts one more patient message for today (Dhaka time) and refuses the 41st.
-- Security definer so it can write the tally the patient may not touch; it only ever counts the caller.
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

  -- The exception also undoes the +1 above, so the tally stays at 40.
  if n > 40 then
    raise exception 'daily_limit_reached' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_daily_message_limit() from public, anon, authenticated;

-- Start today's tally from the messages already sent today.
insert into public.daily_usage (patient_id, day, sent)
select c.patient_id, (now() at time zone 'Asia/Dhaka')::date, count(*)
from public.messages m
join public.conversations c on c.id = m.conversation_id
where m.author = 'patient'
  and m.created_at >= (date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka')
group by c.patient_id
on conflict (patient_id, day) do update set sent = excluded.sent;
