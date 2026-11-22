-- 0009's sharing rules looked each other up (summaries <-> shares), which Postgres refuses as infinite
-- recursion, so sharing always failed. Two small yes/no checks now do those lookups. They live in a private
-- schema that the API does not expose, so no one can call them from outside; they only ever answer about
-- the signed-in user's own rows.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.owns_summary(sid uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.consult_summaries c where c.id = sid and c.patient_id = (select auth.uid()));
$$;

create or replace function private.summary_shared_with_me(sid uuid)
  returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.summary_shares s
    where s.summary_id = sid and s.doctor_id = (select auth.uid()) and s.revoked_at is null
  );
$$;

revoke all on function private.owns_summary(uuid), private.summary_shared_with_me(uuid) from public, anon;
grant execute on function private.owns_summary(uuid), private.summary_shared_with_me(uuid) to authenticated;

drop policy "Doctors read summaries shared with them" on public.consult_summaries;
create policy "Doctors read summaries shared with them"
  on public.consult_summaries for select to authenticated
  using ((select public.my_role()) = 'doctor' and private.summary_shared_with_me(id));

drop policy "Patients share their own summaries with a doctor" on public.summary_shares;
create policy "Patients share their own summaries with a doctor"
  on public.summary_shares for insert to authenticated
  with check (
    patient_id = (select auth.uid())
    and (select public.my_role()) = 'patient'
    and revoked_at is null
    and private.owns_summary(summary_id)
    and exists (select 1 from public.profiles p where p.id = doctor_id and p.role = 'doctor')
  );
