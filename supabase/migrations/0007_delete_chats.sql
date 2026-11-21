-- Patients can delete their own chats. Messages and ratings in a deleted chat go with it (on delete cascade).
-- Nobody else can delete a patient's chat: doctors and hospital admins have no delete rule at all.
grant delete on public.conversations to authenticated;

create policy "Patients delete their own conversations"
  on public.conversations for delete
  to authenticated
  using (patient_id = (select auth.uid()) and (select public.my_role()) = 'patient');
