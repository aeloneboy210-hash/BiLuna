-- BiLuna Intelligence: the patient's health profile (context memory, used in chat only with consent),
-- feedback on BiLuna's replies, and an append-only log of what the AI layer did.
-- Everything here is visible to the patient who owns it and to no one else.

create table public.health_profiles (
  patient_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  age int check (age between 0 and 120),
  blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies text check (char_length(allergies) <= 200),
  conditions text check (char_length(conditions) <= 200),
  medicines text check (char_length(medicines) <= 200),
  use_in_chat boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.message_feedback (
  message_id uuid primary key references public.messages (id) on delete cascade,
  patient_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  created_at timestamptz not null default now()
);

create table public.ai_events (
  id bigint generated always as identity primary key,
  patient_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in (
    'reply', 'retry', 'blocked', 'clarify', 'profile_used',
    'consent_on', 'consent_off', 'profile_saved', 'profile_deleted',
    'feedback_up', 'feedback_down'
  )),
  lang text check (lang in ('en', 'bn')),
  created_at timestamptz not null default now()
);

create index ai_events_patient_created_idx on public.ai_events (patient_id, created_at desc);

alter table public.health_profiles enable row level security;
alter table public.message_feedback enable row level security;
alter table public.ai_events enable row level security;

revoke all on public.health_profiles, public.message_feedback, public.ai_events from anon, authenticated;
grant select, insert, update, delete on public.health_profiles to authenticated;
grant select, insert on public.message_feedback to authenticated;
-- Only the rating can change, never which message it belongs to.
grant update (rating) on public.message_feedback to authenticated;
grant select, insert on public.ai_events to authenticated;

-- Profiles: the patient's own row, nothing else.
create policy "Patients read their own health profile" on public.health_profiles for select to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
create policy "Patients create their own health profile" on public.health_profiles for insert to authenticated
  with check (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
create policy "Patients change their own health profile" on public.health_profiles for update to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient')
  with check (patient_id = (select auth.uid()));
create policy "Patients delete their own health profile" on public.health_profiles for delete to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');

-- Feedback: only on BiLuna's replies in the patient's own conversations.
create policy "Patients read their own feedback" on public.message_feedback for select to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
create policy "Patients rate BiLuna replies in their own chats" on public.message_feedback for insert to authenticated
  with check (
    patient_id = (select auth.uid())
    and (select public.my_role()) = 'patient'
    and exists (
      select 1 from public.messages m join public.conversations c on c.id = m.conversation_id
      where m.id = message_id and m.author = 'biluna' and c.patient_id = (select auth.uid())
    )
  );
create policy "Patients change their own feedback" on public.message_feedback for update to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient')
  with check (patient_id = (select auth.uid()));

-- Events: the patient reads and appends their own; nobody edits or deletes them.
create policy "Patients read their own AI events" on public.ai_events for select to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
create policy "Patients log their own AI events" on public.ai_events for insert to authenticated
  with check (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
