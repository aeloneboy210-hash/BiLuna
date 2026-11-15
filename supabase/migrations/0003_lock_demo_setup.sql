-- The owner has set the demo password, so nobody outside the database may call the setup function any more.
-- To reset the demo password later: clear encrypted_password on the three demo accounts, then
-- grant execute on function public.set_demo_password(text) to anon, authenticated;
-- and set it again on /setup, then apply this file again.
revoke execute on function public.set_demo_password(text) from anon, authenticated;
