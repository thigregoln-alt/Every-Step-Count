-- ============================================================
-- Every Step Count · ATEC Palmela — prints das pontuações (Storage)
-- Cola tudo no Supabase → SQL Editor e carrega em Run.
-- Pode ser corrido várias vezes sem dar erro.
-- Requer que o setup.sql já tenha sido corrido (tabela public.submissoes).
-- ============================================================

-- 1. Coluna com os caminhos dos prints de cada submissão
alter table public.submissoes
  add column if not exists prints text[] not null default '{}';

-- 2. Pasta privada "prints" (só PNG/JPG/WebP, até 8 MB cada)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('prints', 'prints', false, 8388608, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Cada delegado só escreve e lê dentro da sua própria pasta (<id do utilizador>/...)
drop policy if exists "enviar os proprios prints" on storage.objects;
create policy "enviar os proprios prints" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'prints' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "ver os proprios prints" on storage.objects;
create policy "ver os proprios prints" on storage.objects
  for select to authenticated
  using (bucket_id = 'prints' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Atualizar a cache da API
notify pgrst, 'reload schema';
