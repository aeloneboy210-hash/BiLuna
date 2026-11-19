-- BiLuna Health chat: a patient's conversations with BiLuna.
-- Only the patient who owns a conversation can read or add to it. Doctors and hospital admins
-- see nothing here; sharing with a doctor comes later through Consultation Prep.

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  created_at timestamptz not null default now()
);

create index conversations_patient_created_idx on public.conversations (patient_id, created_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author text not null check (author in ('patient', 'biluna')),
  body text not null check (char_length(body) between 1 and 4000),
  lang text not null check (lang in ('en', 'bn')),
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

create policy "Patients read their own conversations"
  on public.conversations for select
  to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');

create policy "Patients start their own conversations"
  on public.conversations for insert
  to authenticated
  with check (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');

create policy "Patients read messages in their own conversations"
  on public.messages for select
  to authenticated
  using (
    (select public.my_role()) = 'patient'
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.patient_id = (select auth.uid())
    )
  );

create policy "Patients add messages to their own conversations"
  on public.messages for insert
  to authenticated
  with check (
    (select public.my_role()) = 'patient'
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.patient_id = (select auth.uid())
    )
  );

-- At most 40 patient messages per patient per day (Dhaka time), to protect the free AI quota.
-- Runs with the caller's rights, so it can only count the caller's own messages.
create function public.enforce_daily_message_limit()
  returns trigger
  language plpgsql
  set search_path = ''
as $$
declare
  sent int;
begin
  if new.author <> 'patient' then
    return new;
  end if;

  select count(*) into sent
  from public.messages m
  join public.conversations c on c.id = m.conversation_id
  where c.patient_id = (select auth.uid())
    and m.author = 'patient'
    and m.created_at >= (date_trunc('day', now() at time zone 'Asia/Dhaka') at time zone 'Asia/Dhaka');

  if sent >= 40 then
    raise exception 'daily_limit_reached' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_daily_message_limit() from public, anon;

create trigger messages_daily_limit
  before insert on public.messages
  for each row execute function public.enforce_daily_message_limit();
