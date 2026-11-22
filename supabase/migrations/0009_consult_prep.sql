-- Consultation Prep: a summary the patient makes from a chat, checks, and may share with a doctor.
-- Patient: full control of their own summaries and shares. Doctor: reads a summary only while it is
-- shared with them (stopping the share ends access at once). Hospital admin: no access at all.

create table public.consult_summaries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  patient_name text not null check (char_length(patient_name) <= 80),
  lang text not null check (lang in ('en', 'bn')),
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index consult_summaries_patient_idx on public.consult_summaries (patient_id);

create table public.summary_shares (
  id uuid primary key default gen_random_uuid(),
  summary_id uuid not null references public.consult_summaries (id) on delete cascade,
  patient_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  doctor_id uuid not null references public.profiles (id) on delete cascade,
  shared_at timestamptz not null default now(),
  revoked_at timestamptz
);
-- At most one live share of a summary with the same doctor. Stopped shares stay as history.
create unique index summary_shares_live_idx on public.summary_shares (summary_id, doctor_id) where revoked_at is null;
create index summary_shares_doctor_idx on public.summary_shares (doctor_id);
create index summary_shares_patient_idx on public.summary_shares (patient_id);

alter table public.consult_summaries enable row level security;
alter table public.summary_shares enable row level security;
revoke all on public.consult_summaries, public.summary_shares from anon, authenticated;
grant select, insert, update, delete on public.consult_summaries to authenticated;
grant select, insert on public.summary_shares to authenticated;
grant update (revoked_at) on public.summary_shares to authenticated;

-- Patients may see which accounts are doctors (name only is shown), so they can choose whom to share with.
create policy "Patients see doctors to share with"
  on public.profiles for select to authenticated
  using (role = 'doctor' and (select public.my_role()) = 'patient');

create policy "Patients manage their own summaries"
  on public.consult_summaries for all to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient')
  with check (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');

create policy "Doctors read summaries shared with them"
  on public.consult_summaries for select to authenticated
  using (
    (select public.my_role()) = 'doctor'
    and exists (
      select 1 from public.summary_shares s
      where s.summary_id = consult_summaries.id and s.doctor_id = (select auth.uid()) and s.revoked_at is null
    )
  );

create policy "Patients read their own shares"
  on public.summary_shares for select to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');

create policy "Patients share their own summaries with a doctor"
  on public.summary_shares for insert to authenticated
  with check (
    patient_id = (select auth.uid())
    and (select public.my_role()) = 'patient'
    and revoked_at is null
    and exists (select 1 from public.consult_summaries c where c.id = summary_id and c.patient_id = (select auth.uid()))
    and exists (select 1 from public.profiles p where p.id = doctor_id and p.role = 'doctor')
  );

-- A patient can only stop a share (set the time), never restart it; sharing again makes a new row.
create policy "Patients stop their own shares"
  on public.summary_shares for update to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient' and revoked_at is null)
  with check (patient_id = (select auth.uid()) and revoked_at is not null);

create policy "Doctors read shares made to them"
  on public.summary_shares for select to authenticated
  using (doctor_id = (select auth.uid()) and (select public.my_role()) = 'doctor');
