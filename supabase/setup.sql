-- Execute integralmente no SQL Editor do Supabase, uma única vez.
-- O estado é único e compartilhado por quem usa o aplicativo.
create table if not exists public.rafa_state (
  id integer primary key default 1 check (id = 1),
  stage text not null default 'login' check (stage in ('login','warning','riddle','waiting','final','success','ending')),
  deadline timestamptz,
  final_attempts integer not null default 0 check (final_attempts between 0 and 3),
  selected_date date,
  selected_time time without time zone,
  booking_sent boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.rafa_state (id) values (1) on conflict (id) do nothing;
alter table public.rafa_state enable row level security;
revoke all on public.rafa_state from anon, authenticated;

-- A lista é privada; somente contas do Supabase Auth cadastradas aqui podem reiniciar.
create table if not exists public.rafa_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.rafa_admins enable row level security;
revoke all on public.rafa_admins from anon, authenticated;

-- O prazo é autoritativo no banco de dados, mesmo se o navegador for fechado.
create or replace function public.rafa_get_state()
returns public.rafa_state
language plpgsql security definer set search_path = ''
as $$
declare v public.rafa_state;
begin
  select * into v from public.rafa_state where id = 1 for update;
  if v.stage in ('riddle', 'waiting') and (v.deadline is null or v.deadline <= now()) then
    update public.rafa_state
    set stage = case when v.stage = 'riddle' then 'ending' else 'final' end,
        deadline = null, updated_at = now()
    where id = 1 returning * into v;
  end if;
  return v;
end;
$$;

-- A transição é validada e registrada no servidor para evitar alterações via estado local.
create or replace function public.rafa_advance(
  p_action text,
  p_answer text default '',
  p_date date default null,
  p_time time without time zone default null
)
returns public.rafa_state
language plpgsql security definer set search_path = ''
as $$
declare
  v public.rafa_state;
  v_answer text := lower(trim(coalesce(p_answer, '')));
  v_weekday integer;
  v_hour integer;
  v_minute integer;
begin
  -- Obter o bloqueio primeiro e efetivar eventual encerramento de prazo.
  v := public.rafa_get_state();
  select * into v from public.rafa_state where id = 1 for update;

  if p_action = 'login' and v.stage = 'login' then
    if v_answer <> 'miranda' then return v; end if;
    update public.rafa_state set stage = 'warning', updated_at = now() where id = 1;

  elsif p_action = 'back' and v.stage = 'warning' then
    update public.rafa_state set stage = 'login', updated_at = now() where id = 1;

  elsif p_action = 'start' and v.stage = 'warning' then
    update public.rafa_state set stage = 'riddle', deadline = now() + interval '3 minutes',
      final_attempts = 0, selected_date = null, selected_time = null,
      booking_sent = false, updated_at = now() where id = 1;

  elsif p_action = 'solve_riddle' and v.stage = 'riddle'
    and v.deadline > now() and v_answer = 'gasolina' then
    update public.rafa_state set stage = 'waiting', updated_at = now() where id = 1;

  elsif p_action = 'final_answer' and v.stage = 'final' then
    if v_answer = 'allofme' then
      update public.rafa_state set stage = 'success', updated_at = now() where id = 1;
    else
      update public.rafa_state set final_attempts = v.final_attempts + 1,
        stage = case when v.final_attempts + 1 >= 3 then 'ending' else 'final' end,
        updated_at = now() where id = 1;
    end if;

  elsif p_action = 'booking_sent' and v.stage = 'success' and not v.booking_sent then
    -- Valida dia e intervalo; o Formspree é chamado no frontend antes desta transição.
    if p_date is null or p_time is null then
      raise exception 'Data e horário obrigatórios';
    end if;
    v_weekday := extract(isodow from p_date);
    v_hour := extract(hour from p_time);
    v_minute := extract(minute from p_time);
    if v_weekday = 7 or v_minute not in (0, 30) or
       not ((v_weekday between 1 and 5 and p_time between time '19:00' and time '21:00')
       or (v_weekday = 6 and p_time between time '09:00' and time '21:00')) then
      raise exception 'Horário inválido';
    end if;
    update public.rafa_state set selected_date = p_date, selected_time = p_time,
      booking_sent = true, updated_at = now() where id = 1;
  end if;
  select * into v from public.rafa_state where id = 1;
  return v;
end;
$$;

create or replace function public.rafa_admin_reset()
returns public.rafa_state
language plpgsql security definer set search_path = ''
as $$
declare v public.rafa_state;
begin
  if not exists (select 1 from public.rafa_admins where user_id = auth.uid()) then
    raise exception 'Acesso não autorizado';
  end if;
  update public.rafa_state set stage = 'login', deadline = null,
    final_attempts = 0, selected_date = null, selected_time = null,
    booking_sent = false, updated_at = now() where id = 1 returning * into v;
  return v;
end;
$$;

revoke all on function public.rafa_get_state() from public;
revoke all on function public.rafa_advance(text,text,date,time without time zone) from public;
revoke all on function public.rafa_admin_reset() from public;
grant execute on function public.rafa_get_state() to anon, authenticated;
grant execute on function public.rafa_advance(text,text,date,time without time zone) to anon, authenticated;
grant execute on function public.rafa_admin_reset() to authenticated;

-- Após criar sua conta em Authentication > Users, adicione o UUID abaixo no SQL Editor:
-- insert into public.rafa_admins (user_id) values ('COLE_UUID_DA_SUA_CONTA_AQUI');
