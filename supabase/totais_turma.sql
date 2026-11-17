-- ============================================================
-- Every Step Count · ATEC Palmela — totais das turmas (ecrã de resumo do grupo no StepUp)
-- Cola tudo no Supabase → SQL Editor e carrega em Run.
-- Pode ser corrido várias vezes sem dar erro.
-- Quando o delegado envia o ecrã de resumo do grupo (só com o total, sem nomes),
-- a Edge Function ler-print grava aqui o total da turma. O ranking de turmas (js/ranking.js) usa esta tabela.
-- ============================================================

-- 1. Um total por turma e por dia
create table if not exists public.totais_turma (
  id          bigint generated always as identity primary key,
  dia         date not null default ((now() at time zone 'Europe/Lisbon')::date),
  dia_inicio  date,  -- só se o print mostrar um intervalo de datas (dia_inicio até dia)
  turma       text not null check (turma <> ''),
  passos      integer not null check (passos >= 0),
  km          numeric(8,1) not null default 0 check (km >= 0),
  membros     integer not null default 0 check (membros >= 0),
  enviado_por uuid,
  criado_em   timestamptz not null default now(),
  -- a mesma turma só tem um total por dia: enviar o mesmo print duas vezes não conta a dobrar
  constraint totais_turma_um_por_dia unique (dia, turma)
);

-- 2. Antes de guardar: turma em maiúsculas e sem espaços a mais (igual à tabela registos)
create or replace function public.arrumar_total_turma()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.turma := upper(btrim(new.turma));
  return new;
end;
$$;

drop trigger if exists arrumar_total_turma on public.totais_turma;
create trigger arrumar_total_turma
  before insert or update on public.totais_turma
  for each row execute function public.arrumar_total_turma();

-- 3. Permissões: toda a gente vê; só a Edge Function ler-print grava (com a chave de serviço)
alter table public.totais_turma enable row level security;

revoke all on public.totais_turma from anon, authenticated;
grant select on public.totais_turma to anon, authenticated;
grant select, insert, update, delete on public.totais_turma to service_role;

drop policy if exists "ver os totais" on public.totais_turma;
create policy "ver os totais" on public.totais_turma
  for select to anon, authenticated
  using (true);

-- 4. Realtime: as páginas do ranking atualizam-se sozinhas quando entra um total
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'totais_turma') then
    alter publication supabase_realtime add table public.totais_turma;
  end if;
end;
$$;

-- 5. Atualizar a cache da API
notify pgrst, 'reload schema';
