-- ============================================================
-- CICLOPAG V2 - BASE INICIAL MULTIEMPRESA COM RLS
-- Execute este arquivo inteiro no Supabase SQL Editor.
-- Projeto: CicloPag
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Função padrão para updated_at
-- ------------------------------------------------------------
create or replace function public.definir_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Tabelas principais
-- ------------------------------------------------------------
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  email text,
  telefone text,
  avatar_url text,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  documento text,
  email text,
  telefone text,
  status text not null default 'ativa' check (status in ('ativa','teste','suspensa','cancelada')),
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.membros_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  papel text not null default 'leitura' check (papel in ('proprietario','administrador','financeiro','atendente','profissional','leitura')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);

create table if not exists public.configuracoes_marca (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  nome_exibicao text not null,
  slogan text,
  logo_url text,
  favicon_url text,
  cor_primaria text not null default '#0B3568',
  cor_secundaria text not null default '#00A994',
  cor_fundo text not null default '#F7FBFF',
  whatsapp text,
  email_suporte text,
  dominio_personalizado text,
  updated_at timestamptz not null default now()
);

create table if not exists public.modulos_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  modulo text not null check (modulo in (
    'financeiro','clientes','cobrancas','agenda','vendas','pdv','estoque',
    'notas_fiscais','contratos','chamados','relatorios','lojas','integracoes'
  )),
  ativo boolean not null default false,
  configuracoes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (empresa_id, modulo)
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 150),
  email text,
  telefone text,
  documento text,
  data_nascimento date,
  observacoes text,
  status text not null default 'ativo' check (status in ('ativo','inativo','bloqueado')),
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, empresa_id)
);

create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  descricao text,
  valor numeric(12,2) not null default 0 check (valor >= 0),
  periodicidade text not null default 'mensal' check (periodicidade in ('unica','semanal','quinzenal','mensal','trimestral','semestral','anual')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, empresa_id)
);

create table if not exists public.assinaturas_clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cliente_id uuid not null,
  plano_id uuid not null,
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  inicio_em date not null default current_date,
  fim_em date,
  status text not null default 'ativa' check (status in ('ativa','pausada','cancelada','encerrada')),
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, empresa_id),
  foreign key (cliente_id, empresa_id) references public.clientes(id, empresa_id),
  foreign key (plano_id, empresa_id) references public.planos(id, empresa_id)
);

create table if not exists public.mensalidades (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cliente_id uuid not null,
  assinatura_id uuid,
  referencia date not null,
  vencimento date not null,
  valor numeric(12,2) not null check (valor >= 0),
  status text not null default 'pendente' check (status in ('pendente','paga','vencida','cancelada','parcial')),
  pago_em timestamptz,
  observacoes text,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, empresa_id),
  foreign key (cliente_id, empresa_id) references public.clientes(id, empresa_id),
  foreign key (assinatura_id, empresa_id) references public.assinaturas_clientes(id, empresa_id)
);

create table if not exists public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cliente_id uuid,
  mensalidade_id uuid,
  valor numeric(12,2) not null check (valor >= 0),
  metodo text not null default 'pix' check (metodo in ('pix','dinheiro','cartao','boleto','transferencia','outro')),
  status text not null default 'confirmado' check (status in ('pendente','confirmado','estornado','cancelado')),
  referencia_externa text,
  pago_em timestamptz,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (cliente_id, empresa_id) references public.clientes(id, empresa_id),
  foreign key (mensalidade_id, empresa_id) references public.mensalidades(id, empresa_id)
);

create table if not exists public.auditoria (
  id bigint generated by default as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  tabela text not null,
  registro_id text,
  operacao text not null,
  dados jsonb,
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Índices para desempenho e RLS
-- ------------------------------------------------------------
create index if not exists idx_membros_usuario on public.membros_empresa(usuario_id) where ativo;
create index if not exists idx_membros_empresa on public.membros_empresa(empresa_id) where ativo;
create index if not exists idx_clientes_empresa on public.clientes(empresa_id);
create index if not exists idx_planos_empresa on public.planos(empresa_id);
create index if not exists idx_assinaturas_empresa on public.assinaturas_clientes(empresa_id);
create index if not exists idx_assinaturas_cliente on public.assinaturas_clientes(cliente_id);
create index if not exists idx_mensalidades_empresa on public.mensalidades(empresa_id);
create index if not exists idx_mensalidades_cliente on public.mensalidades(cliente_id);
create index if not exists idx_mensalidades_vencimento on public.mensalidades(empresa_id, vencimento, status);
create index if not exists idx_pagamentos_empresa on public.pagamentos(empresa_id);
create index if not exists idx_auditoria_empresa on public.auditoria(empresa_id, criado_em desc);

-- ------------------------------------------------------------
-- Triggers updated_at
-- ------------------------------------------------------------
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'perfis','empresas','membros_empresa','configuracoes_marca','modulos_empresa',
    'clientes','planos','assinaturas_clientes','mensalidades','pagamentos'
  ]
  loop
    execute format('drop trigger if exists trg_%I_updated_at on public.%I', tabela, tabela);
    execute format(
      'create trigger trg_%I_updated_at before update on public.%I for each row execute function public.definir_updated_at()',
      tabela, tabela
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- Perfil automático para cada usuário do Supabase Auth
-- ------------------------------------------------------------
create or replace function public.criar_perfil_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(coalesce(new.email, ''), '@', 1), 'Usuário'),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.criar_perfil_novo_usuario();

insert into public.perfis (id, nome, email)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'nome'), ''), split_part(coalesce(u.email, ''), '@', 1), 'Usuário'),
  u.email
from auth.users u
on conflict (id) do update set email = excluded.email;

-- ------------------------------------------------------------
-- Funções auxiliares de autorização multiempresa
-- ------------------------------------------------------------
create or replace function public.usuario_e_membro(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_empresa me
    where me.empresa_id = p_empresa_id
      and me.usuario_id = (select auth.uid())
      and me.ativo = true
  );
$$;

create or replace function public.usuario_tem_papel(p_empresa_id uuid, p_papeis text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.membros_empresa me
    where me.empresa_id = p_empresa_id
      and me.usuario_id = (select auth.uid())
      and me.ativo = true
      and me.papel = any(p_papeis)
  );
$$;

revoke all on function public.usuario_e_membro(uuid) from public;
revoke all on function public.usuario_tem_papel(uuid, text[]) from public;
grant execute on function public.usuario_e_membro(uuid) to authenticated;
grant execute on function public.usuario_tem_papel(uuid, text[]) to authenticated;

-- ------------------------------------------------------------
-- RPC segura para criar a primeira empresa do usuário
-- ------------------------------------------------------------
create or replace function public.criar_empresa_inicial(p_nome text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_empresa uuid;
  v_nome text := trim(p_nome);
  v_slug text := lower(trim(p_slug));
begin
  if v_usuario is null then
    raise exception 'É necessário estar autenticado.';
  end if;

  if char_length(v_nome) < 2 then
    raise exception 'Informe um nome de empresa válido.';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'O endereço da empresa deve conter somente letras minúsculas, números e hífens.';
  end if;

  select me.empresa_id into v_empresa
  from public.membros_empresa me
  where me.usuario_id = v_usuario
    and me.papel = 'proprietario'
    and me.ativo = true
  order by me.criado_em
  limit 1;

  if v_empresa is not null then
    return v_empresa;
  end if;

  insert into public.empresas (nome, slug, criado_por)
  values (v_nome, v_slug, v_usuario)
  returning id into v_empresa;

  insert into public.membros_empresa (empresa_id, usuario_id, papel)
  values (v_empresa, v_usuario, 'proprietario');

  insert into public.configuracoes_marca (empresa_id, nome_exibicao, slogan)
  values (v_empresa, v_nome, 'O ciclo completo da sua empresa.');

  insert into public.modulos_empresa (empresa_id, modulo, ativo)
  select v_empresa, modulo, ativo
  from (values
    ('financeiro', true),
    ('clientes', true),
    ('cobrancas', true),
    ('agenda', false),
    ('vendas', false),
    ('pdv', false),
    ('estoque', false),
    ('notas_fiscais', false),
    ('contratos', true),
    ('chamados', true),
    ('relatorios', true),
    ('lojas', false),
    ('integracoes', false)
  ) as padrao(modulo, ativo);

  return v_empresa;
end;
$$;

revoke all on function public.criar_empresa_inicial(text, text) from public;
grant execute on function public.criar_empresa_inicial(text, text) to authenticated;

-- ------------------------------------------------------------
-- Auditoria automática
-- ------------------------------------------------------------
create or replace function public.registrar_auditoria_automatica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dados jsonb;
  v_empresa uuid;
  v_registro text;
begin
  v_dados := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_empresa := nullif(v_dados ->> 'empresa_id', '')::uuid;
  v_registro := v_dados ->> 'id';

  if v_empresa is not null then
    insert into public.auditoria (empresa_id, usuario_id, tabela, registro_id, operacao, dados)
    values (v_empresa, auth.uid(), tg_table_name, v_registro, tg_op, v_dados);
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'membros_empresa','modulos_empresa','clientes','planos','assinaturas_clientes','mensalidades','pagamentos'
  ]
  loop
    execute format('drop trigger if exists trg_%I_auditoria on public.%I', tabela, tabela);
    execute format(
      'create trigger trg_%I_auditoria after insert or update or delete on public.%I for each row execute function public.registrar_auditoria_automatica()',
      tabela, tabela
    );
  end loop;
end $$;

-- ------------------------------------------------------------
-- RLS: obrigatório para todas as tabelas expostas
-- ------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.empresas enable row level security;
alter table public.membros_empresa enable row level security;
alter table public.configuracoes_marca enable row level security;
alter table public.modulos_empresa enable row level security;
alter table public.clientes enable row level security;
alter table public.planos enable row level security;
alter table public.assinaturas_clientes enable row level security;
alter table public.mensalidades enable row level security;
alter table public.pagamentos enable row level security;
alter table public.auditoria enable row level security;

-- Remove políticas antigas para permitir executar o arquivo novamente.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'perfis','empresas','membros_empresa','configuracoes_marca','modulos_empresa',
        'clientes','planos','assinaturas_clientes','mensalidades','pagamentos','auditoria'
      )
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Perfis
create policy perfis_ver_proprio on public.perfis
for select to authenticated
using ((select auth.uid()) = id);

create policy perfis_atualizar_proprio on public.perfis
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Empresas
create policy empresas_ver_membro on public.empresas
for select to authenticated
using (public.usuario_e_membro(id));

create policy empresas_editar_gestores on public.empresas
for update to authenticated
using (public.usuario_tem_papel(id, array['proprietario','administrador']))
with check (public.usuario_tem_papel(id, array['proprietario','administrador']));

-- Membros
create policy membros_ver_mesma_empresa on public.membros_empresa
for select to authenticated
using (public.usuario_e_membro(empresa_id));

create policy membros_inserir_gestores on public.membros_empresa
for insert to authenticated
with check (public.usuario_tem_papel(empresa_id, array['proprietario']));

create policy membros_editar_gestores on public.membros_empresa
for update to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario']));

create policy membros_excluir_gestores on public.membros_empresa
for delete to authenticated
using (
  public.usuario_tem_papel(empresa_id, array['proprietario'])
  and usuario_id <> (select auth.uid())
);

-- Marca e módulos
create policy marca_ver_membro on public.configuracoes_marca
for select to authenticated
using (public.usuario_e_membro(empresa_id));

create policy marca_gerenciar_gestores on public.configuracoes_marca
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']));

create policy modulos_ver_membro on public.modulos_empresa
for select to authenticated
using (public.usuario_e_membro(empresa_id));

create policy modulos_gerenciar_gestores on public.modulos_empresa
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']));

-- Clientes
create policy clientes_ver_membro on public.clientes
for select to authenticated
using (public.usuario_e_membro(empresa_id));

create policy clientes_inserir_equipe on public.clientes
for insert to authenticated
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','atendente','financeiro']));

create policy clientes_editar_equipe on public.clientes
for update to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','atendente','financeiro']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','atendente','financeiro']));

create policy clientes_excluir_gestores on public.clientes
for delete to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']));

-- Planos, assinaturas, mensalidades e pagamentos
create policy planos_ver_membro on public.planos
for select to authenticated using (public.usuario_e_membro(empresa_id));
create policy planos_gerenciar_financeiro on public.planos
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']));

create policy assinaturas_ver_membro on public.assinaturas_clientes
for select to authenticated using (public.usuario_e_membro(empresa_id));
create policy assinaturas_gerenciar_financeiro on public.assinaturas_clientes
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']));

create policy mensalidades_ver_membro on public.mensalidades
for select to authenticated using (public.usuario_e_membro(empresa_id));
create policy mensalidades_gerenciar_financeiro on public.mensalidades
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']));

create policy pagamentos_ver_membro on public.pagamentos
for select to authenticated using (public.usuario_e_membro(empresa_id));
create policy pagamentos_gerenciar_financeiro on public.pagamentos
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','financeiro']));

-- Auditoria: apenas proprietários e administradores podem consultar.
create policy auditoria_ver_gestores on public.auditoria
for select to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']));

-- ------------------------------------------------------------
-- Privilégios da API
-- ------------------------------------------------------------
revoke all on public.perfis, public.empresas, public.membros_empresa, public.configuracoes_marca,
  public.modulos_empresa, public.clientes, public.planos, public.assinaturas_clientes,
  public.mensalidades, public.pagamentos, public.auditoria from anon;
grant select, insert, update, delete on public.perfis to authenticated;
grant select, insert, update, delete on public.empresas to authenticated;
grant select, insert, update, delete on public.membros_empresa to authenticated;
grant select, insert, update, delete on public.configuracoes_marca to authenticated;
grant select, insert, update, delete on public.modulos_empresa to authenticated;
grant select, insert, update, delete on public.clientes to authenticated;
grant select, insert, update, delete on public.planos to authenticated;
grant select, insert, update, delete on public.assinaturas_clientes to authenticated;
grant select, insert, update, delete on public.mensalidades to authenticated;
grant select, insert, update, delete on public.pagamentos to authenticated;
grant select on public.auditoria to authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;

-- Resultado esperado: "Success. No rows returned"
