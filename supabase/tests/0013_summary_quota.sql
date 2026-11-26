-- Run in a transaction that is rolled back. Expect: after one = before + 1; at 150 blocked; anon refused.
begin;
create temp table r(step text, ok text) on commit drop;
grant all on r to authenticated, anon;
select set_config('request.jwt.claims', json_build_object('sub', (select id from auth.users where email='patient@biluna.demo'), 'role','authenticated')::text, true);
set local role authenticated;
insert into r select 'before', coalesce((select sent from public.daily_usage where patient_id = auth.uid() and day = (now() at time zone 'Asia/Dhaka')::date),0)::text;
select public.use_ai_quota();
insert into r select 'after one', coalesce((select sent from public.daily_usage where patient_id = auth.uid() and day = (now() at time zone 'Asia/Dhaka')::date),0)::text;
reset role;
update public.daily_usage set sent = 150 where patient_id = (select id from auth.users where email='patient@biluna.demo') and day = (now() at time zone 'Asia/Dhaka')::date;
set local role authenticated;
do $$ begin perform public.use_ai_quota(); insert into r values ('at 150','NOT BLOCKED'); exception when others then insert into r values ('at 150', 'blocked: '||sqlerrm); end $$;
reset role;
set local role anon;
do $$ begin perform public.use_ai_quota(); insert into r values ('anon','NOT BLOCKED'); exception when others then insert into r values ('anon', 'blocked: '||sqlerrm); end $$;
reset role;
select * from r;
rollback;
