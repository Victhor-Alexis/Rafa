-- Execute este arquivo no SQL Editor se já usou setup.sql da versão 7.
-- Não apaga o progresso atual.
alter table public.rafa_state
  add column if not exists timer_duration_seconds integer not null default 259200;

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
  v := public.rafa_get_state();
  select * into v from public.rafa_state where id = 1 for update;
  if p_action = 'login' and v.stage = 'login' then
    if v_answer <> 'miranda' then return v; end if;
    update public.rafa_state set stage = 'warning', updated_at = now() where id = 1;
  elsif p_action = 'back' and v.stage = 'warning' then
    update public.rafa_state set stage = 'login', updated_at = now() where id = 1;
  elsif p_action = 'start' and v.stage = 'warning' then
    update public.rafa_state set stage = 'riddle',
      deadline = now() + make_interval(secs => v.timer_duration_seconds),
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

create or replace function public.rafa_admin_set_timer(
  p_duration_seconds integer,
  p_apply_to_current boolean default false
)
returns public.rafa_state
language plpgsql security definer set search_path = ''
as $$
declare v public.rafa_state;
begin
  if not exists (select 1 from public.rafa_admins where user_id = auth.uid()) then
    raise exception 'Acesso não autorizado';
  end if;
  if p_duration_seconds is null or p_duration_seconds < 60 or p_duration_seconds > 2592000 then
    raise exception 'Duração deve estar entre 1 minuto e 30 dias';
  end if;
  update public.rafa_state
  set timer_duration_seconds = p_duration_seconds,
      deadline = case
        when p_apply_to_current and stage in ('riddle', 'waiting')
          then now() + make_interval(secs => p_duration_seconds)
        else deadline
      end,
      updated_at = now()
  where id = 1 returning * into v;
  return v;
end;
$$;

revoke all on function public.rafa_admin_set_timer(integer, boolean) from public;
grant execute on function public.rafa_admin_set_timer(integer, boolean) to authenticated;
