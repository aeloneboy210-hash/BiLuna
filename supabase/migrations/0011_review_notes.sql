-- Doctor's review note: the doctor writes one note on a summary a patient shared with them.
-- Doctor: writes and edits their own note only while the summary is still shared; after the patient stops
-- sharing, the doctor can no longer see or change it. Patient: reads every note on their own summaries,
-- and keeps them after stopping the share. Patient cannot write or change a doctor's note.
-- Hospital admin: no access at all.

create table public.summary_reviews (
  id uuid primary key default gen_random_uuid(),
  summary_id uuid not null references public.consult_summaries (id) on delete cascade,
  -- Filled in by the trigger below from the summary itself, so a doctor cannot point a note at someone else.
  patient_id uuid not null references public.profiles (id) on delete cascade,
  doctor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (summary_id, doctor_id)
);
create index summary_reviews_patient_idx on public.summary_reviews (patient_id);

create or replace function private.review_owner()
  returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  select c.patient_id into new.patient_id from public.consult_summaries c where c.id = new.summary_id;
  if new.patient_id is null then raise exception 'no such summary'; end if;
  return new;
end;
$$;
revoke all on function private.review_owner() from public, anon, authenticated;

create trigger summary_reviews_owner
  before insert on public.summary_reviews
  for each row execute function private.review_owner();

alter table public.summary_reviews enable row level security;
revoke all on public.summary_reviews from anon, authenticated;
grant select, insert on public.summary_reviews to authenticated;
grant update (body, updated_at) on public.summary_reviews to authenticated;

create policy "Doctors write notes on summaries shared with them"
  on public.summary_reviews for insert to authenticated
  with check (
    (select public.my_role()) = 'doctor'
    and doctor_id = (select auth.uid())
    and private.summary_shared_with_me(summary_id)
  );

create policy "Doctors read their own notes while shared"
  on public.summary_reviews for select to authenticated
  using (
    (select public.my_role()) = 'doctor'
    and doctor_id = (select auth.uid())
    and private.summary_shared_with_me(summary_id)
  );

create policy "Doctors edit their own notes while shared"
  on public.summary_reviews for update to authenticated
  using (
    (select public.my_role()) = 'doctor'
    and doctor_id = (select auth.uid())
    and private.summary_shared_with_me(summary_id)
  )
  with check (doctor_id = (select auth.uid()) and private.summary_shared_with_me(summary_id));

create policy "Patients read notes on their own summaries"
  on public.summary_reviews for select to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
