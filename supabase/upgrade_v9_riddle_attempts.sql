-- Execute somente esta migração no SQL Editor para adicionar o histórico.
-- Compatível com a rodada em andamento: não altera rafa_state nem suas funções.
begin;

create table if not exists public.rafa_riddle_attempts (
  id bigint generated always as identity primary key,
  answer text not null check (char_length(answer) between 1 and 64),
  created_at timestamptz not null default clock_timestamp()
);

alter table public.rafa_riddle_attempts enable row level security;
revoke all on public.rafa_riddle_attempts from public, anon, authenticated;
revoke all on sequence public.rafa_riddle_attempts_id_seq from public, anon, authenticated;

-- Recebe o texto enviado sem ler, bloquear ou atualizar a sessão do desafio.
-- Não consulta a etapa: a resposta certa pode chegar depois do avanço para waiting.
create or replace function public.rafa_record_riddle_attempt(p_answer text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_answer is null or char_length(p_answer) not between 1 and 64 then
    raise exception 'Palavra-chave inválida';
  end if;
  insert into public.rafa_riddle_attempts (answer) values (p_answer);
end;
$$;

-- Leitura privada, em páginas de 50 registros, das tentativas mais recentes.
create or replace function public.rafa_admin_riddle_attempts(p_offset integer default 0)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare result jsonb;
begin
  if not exists (select 1 from public.rafa_admins where user_id = auth.uid()) then
    raise exception 'Acesso não autorizado';
  end if;
  if p_offset is null or p_offset < 0 then
    raise exception 'Página inválida';
  end if;

  select jsonb_build_object(
    'total', (select count(*) from public.rafa_riddle_attempts),
    'attempts', coalesce((
      select jsonb_agg(to_jsonb(attempt) order by attempt.id desc)
      from (
        select id, answer, created_at
        from public.rafa_riddle_attempts
        order by id desc limit 50 offset p_offset
      ) attempt
    ), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

revoke all on function public.rafa_record_riddle_attempt(text) from public;
revoke all on function public.rafa_admin_riddle_attempts(integer) from public, anon;
grant execute on function public.rafa_record_riddle_attempt(text) to anon, authenticated;
grant execute on function public.rafa_admin_riddle_attempts(integer) to authenticated;

notify pgrst, 'reload schema';
commit;
