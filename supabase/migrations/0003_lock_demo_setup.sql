-- The owner has set the demo password, so nobody outside the database may call the setup function any more.
--
-- To reset the demo password later, run this in the Supabase SQL editor (as the project owner),
-- choosing the new password yourself. Never grant the function to anon again: that would let a
-- stranger set the password first.
--
--   update auth.users set encrypted_password = '' where email in (select email from public.demo_accounts);
--   select public.set_demo_password('your-new-password');
revoke execute on function public.set_demo_password(text) from anon, authenticated;
