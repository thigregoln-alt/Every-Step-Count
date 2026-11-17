-- ============================================================
-- Every Step Count · ATEC Palmela — registos lidos dos prints (rankings)
-- Cola tudo no Supabase → SQL Editor e carrega em Run.
-- Pode ser corrido várias vezes sem dar erro.
-- As páginas do ranking (js/ranking.js) leem desta tabela e atualizam-se sozinhas quando ela muda.
-- ============================================================

-- 1. Uma linha por formando e por dia, com o que o print do StepUp mostra
create table if not exists public.registos (
  id          bigint generated always as identity primary key,
  dia         date not null default ((now() at time zone 'Europe/Lisbon')::date),
  turma       text not null check (turma <> ''),
  nome        text not null check (nome <> ''),
  passos      integer not null check (passos >= 0),
  km          numeric(7,1) not null default 0 check (km >= 0),
  enviado_por uuid,
  criado_em   timestamptz not null default now(),
  -- o mesmo formando só tem um registo por dia: enviar o mesmo print duas vezes não conta a dobrar
  constraint registos_um_por_dia unique (dia, turma, nome)
);

-- 2. Antes de guardar: tira os espaços a mais, põe a turma em maiúsculas e anota quem enviou
--    (a Edge Function ler-print grava com a chave de serviço e manda o id de quem enviou o print).
--    Assim "pipl0925 " e "PIPL0925" não aparecem no ranking como duas turmas diferentes.
create or replace function public.arrumar_registo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.turma := upper(btrim(new.turma));
  new.nome := btrim(new.nome);
  new.enviado_por := coalesce(auth.uid(), new.enviado_por);
  return new;
end;
$$;

drop trigger if exists arrumar_registo on public.registos;
create trigger arrumar_registo
  before insert or update on public.registos
  for each row execute function public.arrumar_registo();

-- 3. Permissões: toda a gente vê; ninguém grava a partir do site.
--    Só a Edge Function ler-print grava (com a chave de serviço), depois de o Gemini aceitar o print.
--    Assim ninguém consegue pôr números falsos no ranking pelo F12.
--    Apagar ou corrigir à mão: só no painel do Supabase.
alter table public.registos enable row level security;

revoke all on public.registos from anon, authenticated;
grant select on public.registos to anon, authenticated;
grant select, insert, update, delete on public.registos to service_role;

drop policy if exists "ver os registos" on public.registos;
create policy "ver os registos" on public.registos
  for select to anon, authenticated
  using (true);

-- regras antigas (deixavam qualquer utilizador com login gravar e alterar): apagadas
drop policy if exists "enviar registos" on public.registos;
drop policy if exists "corrigir registos" on public.registos;

-- 4. Realtime: o Supabase avisa as páginas abertas sempre que um registo entra, muda ou sai
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'registos') then
    alter publication supabase_realtime add table public.registos;
  end if;
end;
$$;

-- 5. Atualizar a cache da API
notify pgrst, 'reload schema';

-- ------------------------------------------------------------
-- Quem grava nesta tabela: só a Edge Function supabase/functions/ler-print.
-- Com o upsert (dia, turma, nome), enviar outra vez o print do mesmo dia corrige os números em vez de os duplicar.
-- ------------------------------------------------------------
