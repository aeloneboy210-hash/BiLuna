-- No public sign-up. An account may only be created for one of the three demo emails;
-- any other sign-up attempt fails, so no stray account can ever exist.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  account public.demo_accounts%rowtype;
begin
  select * into account from public.demo_accounts d where d.email = lower(new.email);

  if not found then
    raise exception 'Sign-up is closed: only the BiLuna demo accounts can exist.'
      using errcode = 'insufficient_privilege';
  end if;

  insert into public.profiles (id, role, display_name)
  values (new.id, account.role, account.display_name);

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
