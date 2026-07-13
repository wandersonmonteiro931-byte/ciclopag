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
-- ============================================================
-- CICLOPAG V3 - ONBOARDING, PREFERENCIAS E MODULOS ERP
-- Execute este arquivo no Supabase SQL Editor depois do PASSO 2.
-- Seguro para executar novamente: comandos idempotentes.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Novos campos da empresa e do perfil
-- ------------------------------------------------------------
alter table public.empresas
  add column if not exists segmento text,
  add column if not exists onboarding_concluido boolean not null default false,
  add column if not exists onboarding_concluido_em timestamptz;

alter table public.perfis
  add column if not exists whatsapp text;

-- ------------------------------------------------------------
-- Respostas do primeiro acesso por empresa
-- ------------------------------------------------------------
create table if not exists public.onboarding_empresas (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  segmento text not null,
  segmento_outro text,
  modulos_interesse text[] not null default '{}'::text[],
  ferramenta_atual text not null check (ferramenta_atual in ('planilhas','papel','outro_sistema','nenhum')),
  canal_contato text not null check (canal_contato in ('whatsapp','email','ligacao','nao_contatar')),
  possui_certificado_digital boolean not null default false,
  concluido_por uuid references auth.users(id) on delete set null,
  concluido_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Preferencias individuais: modal e tour guiado
create table if not exists public.preferencias_usuario (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  boas_vindas_visualizada boolean not null default false,
  tour_dashboard_concluido boolean not null default false,
  tour_dashboard_pulado boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Amplia a lista de modulos aceitos pelo CicloPag
-- ------------------------------------------------------------
alter table public.modulos_empresa
  drop constraint if exists modulos_empresa_modulo_check;

alter table public.modulos_empresa
  add constraint modulos_empresa_modulo_check check (modulo in (
    'financeiro','clientes','cobrancas','agenda','vendas','pdv','estoque',
    'notas_fiscais','contratos','chamados','relatorios','lojas','integracoes',
    'ordens_servico','assinatura_digital','loja_virtual','orcamentos','atendimentos'
  ));

-- Garante todos os modulos em empresas ja existentes.
insert into public.modulos_empresa (empresa_id, modulo, ativo)
select e.id, m.modulo, m.ativo
from public.empresas e
cross join (values
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
  ('integracoes', false),
  ('ordens_servico', false),
  ('assinatura_digital', false),
  ('loja_virtual', false),
  ('orcamentos', false),
  ('atendimentos', true)
) as m(modulo, ativo)
on conflict (empresa_id, modulo) do nothing;

-- ------------------------------------------------------------
-- Triggers de updated_at
-- ------------------------------------------------------------
drop trigger if exists trg_onboarding_empresas_updated_at on public.onboarding_empresas;
create trigger trg_onboarding_empresas_updated_at
before update on public.onboarding_empresas
for each row execute function public.definir_updated_at();

drop trigger if exists trg_preferencias_usuario_updated_at on public.preferencias_usuario;
create trigger trg_preferencias_usuario_updated_at
before update on public.preferencias_usuario
for each row execute function public.definir_updated_at();

-- Auditoria do onboarding empresarial
drop trigger if exists trg_onboarding_empresas_auditoria on public.onboarding_empresas;
create trigger trg_onboarding_empresas_auditoria
after insert or update or delete on public.onboarding_empresas
for each row execute function public.registrar_auditoria_automatica();

-- ------------------------------------------------------------
-- Atualiza a criacao da primeira empresa
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
    raise exception 'E necessario estar autenticado.';
  end if;

  if char_length(v_nome) < 2 then
    raise exception 'Informe um nome de empresa valido.';
  end if;

  if v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'O endereco da empresa deve conter somente letras minusculas, numeros e hifens.';
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

  insert into public.empresas (nome, slug, criado_por, onboarding_concluido)
  values (v_nome, v_slug, v_usuario, false)
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
    ('integracoes', false),
    ('ordens_servico', false),
    ('assinatura_digital', false),
    ('loja_virtual', false),
    ('orcamentos', false),
    ('atendimentos', true)
  ) as padrao(modulo, ativo)
  on conflict (empresa_id, modulo) do nothing;

  insert into public.preferencias_usuario (usuario_id)
  values (v_usuario)
  on conflict (usuario_id) do nothing;

  return v_empresa;
end;
$$;

revoke all on function public.criar_empresa_inicial(text, text) from public;
grant execute on function public.criar_empresa_inicial(text, text) to authenticated;

-- ------------------------------------------------------------
-- Finaliza o onboarding em uma transacao segura
-- ------------------------------------------------------------
create or replace function public.concluir_onboarding_empresa(
  p_empresa_id uuid,
  p_segmento text,
  p_segmento_outro text,
  p_modulos text[],
  p_ferramenta_atual text,
  p_canal_contato text,
  p_possui_certificado boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_segmento text := trim(coalesce(p_segmento, ''));
  v_modulos text[] := coalesce(p_modulos, '{}'::text[]);
begin
  if v_usuario is null then
    raise exception 'E necessario estar autenticado.';
  end if;

  if not public.usuario_tem_papel(p_empresa_id, array['proprietario','administrador','gerente']) then
    raise exception 'Usuario sem permissao para configurar esta empresa.';
  end if;

  if char_length(v_segmento) < 2 then
    raise exception 'Escolha o ramo de atividade.';
  end if;

  if cardinality(v_modulos) < 1 then
    raise exception 'Escolha pelo menos um modulo de interesse.';
  end if;

  if p_ferramenta_atual not in ('planilhas','papel','outro_sistema','nenhum') then
    raise exception 'Ferramenta atual invalida.';
  end if;

  if p_canal_contato not in ('whatsapp','email','ligacao','nao_contatar') then
    raise exception 'Canal de contato invalido.';
  end if;

  insert into public.onboarding_empresas (
    empresa_id,
    segmento,
    segmento_outro,
    modulos_interesse,
    ferramenta_atual,
    canal_contato,
    possui_certificado_digital,
    concluido_por,
    concluido_em
  ) values (
    p_empresa_id,
    v_segmento,
    nullif(trim(coalesce(p_segmento_outro, '')), ''),
    v_modulos,
    p_ferramenta_atual,
    p_canal_contato,
    coalesce(p_possui_certificado, false),
    v_usuario,
    now()
  )
  on conflict (empresa_id) do update set
    segmento = excluded.segmento,
    segmento_outro = excluded.segmento_outro,
    modulos_interesse = excluded.modulos_interesse,
    ferramenta_atual = excluded.ferramenta_atual,
    canal_contato = excluded.canal_contato,
    possui_certificado_digital = excluded.possui_certificado_digital,
    concluido_por = excluded.concluido_por,
    concluido_em = excluded.concluido_em,
    updated_at = now();

  update public.empresas
  set segmento = v_segmento,
      onboarding_concluido = true,
      onboarding_concluido_em = now()
  where id = p_empresa_id;

  -- Modulos essenciais permanecem ativos. Os demais seguem as escolhas.
  update public.modulos_empresa
  set ativo = (
    modulo = any(v_modulos)
    or modulo in ('clientes','cobrancas','chamados','relatorios','atendimentos')
    or (modulo = 'pdv' and 'vendas' = any(v_modulos))
    or (modulo = 'orcamentos' and ('vendas' = any(v_modulos) or 'ordens_servico' = any(v_modulos)))
  )
  where empresa_id = p_empresa_id;

  insert into public.preferencias_usuario (usuario_id)
  values (v_usuario)
  on conflict (usuario_id) do nothing;
end;
$$;

revoke all on function public.concluir_onboarding_empresa(uuid, text, text, text[], text, text, boolean) from public;
grant execute on function public.concluir_onboarding_empresa(uuid, text, text, text[], text, text, boolean) to authenticated;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.onboarding_empresas enable row level security;
alter table public.preferencias_usuario enable row level security;

-- Remove politicas anteriores desta migracao, se existirem.
drop policy if exists onboarding_ver_membro on public.onboarding_empresas;
drop policy if exists onboarding_gerenciar_gestores on public.onboarding_empresas;
drop policy if exists preferencias_ver_proprio on public.preferencias_usuario;
drop policy if exists preferencias_inserir_proprio on public.preferencias_usuario;
drop policy if exists preferencias_atualizar_proprio on public.preferencias_usuario;

create policy onboarding_ver_membro on public.onboarding_empresas
for select to authenticated
using (public.usuario_e_membro(empresa_id));

create policy onboarding_gerenciar_gestores on public.onboarding_empresas
for all to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','gerente']))
with check (public.usuario_tem_papel(empresa_id, array['proprietario','administrador','gerente']));

create policy preferencias_ver_proprio on public.preferencias_usuario
for select to authenticated
using (usuario_id = (select auth.uid()));

create policy preferencias_inserir_proprio on public.preferencias_usuario
for insert to authenticated
with check (usuario_id = (select auth.uid()));

create policy preferencias_atualizar_proprio on public.preferencias_usuario
for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()));

grant select, insert, update on public.onboarding_empresas to authenticated;
grant select, insert, update on public.preferencias_usuario to authenticated;

commit;

-- Resultado esperado: Success. No rows returned
-- ============================================================
-- CICLOPAG V4 - BASE OPERACIONAL PADRONIZADA
-- Execute este arquivo inteiro no Supabase SQL Editor.
-- Pode ser executado novamente sem duplicar estruturas.
-- ============================================================

begin;

-- Amplia clientes para armazenar o formulario completo sem perder
-- as colunas principais usadas em buscas e no dashboard.
alter table public.clientes
  add column if not exists tipo text not null default 'Pessoa física';

alter table public.clientes
  add column if not exists dados jsonb not null default '{}'::jsonb;

-- Registros operacionais dos modulos. O JSONB mantém todos os campos
-- dos formularios enquanto as colunas principais permitem listas,
-- pesquisas, indicadores e relatorios rapidos.
create table if not exists public.registros_erp (
  id uuid primary key default gen_random_uuid(),
  numero bigint generated by default as identity,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  modulo text not null,
  tipo text not null,
  titulo text not null check (char_length(trim(titulo)) between 1 and 180),
  status text not null default 'Ativo',
  valor_total numeric(14,2) not null default 0,
  dados jsonb not null default '{}'::jsonb,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_registros_erp_empresa_modulo
  on public.registros_erp(empresa_id, modulo, criado_em desc);

create index if not exists idx_registros_erp_empresa_status
  on public.registros_erp(empresa_id, status);

create index if not exists idx_registros_erp_titulo
  on public.registros_erp using gin (to_tsvector('simple', titulo));

-- Atualizacao automatica.
drop trigger if exists trg_registros_erp_updated_at on public.registros_erp;
create trigger trg_registros_erp_updated_at
before update on public.registros_erp
for each row execute function public.definir_updated_at();

-- Auditoria automatica.
drop trigger if exists trg_registros_erp_auditoria on public.registros_erp;
create trigger trg_registros_erp_auditoria
after insert or update or delete on public.registros_erp
for each row execute function public.registrar_auditoria_automatica();

-- RLS multiempresa.
alter table public.registros_erp enable row level security;

drop policy if exists registros_erp_ver_membro on public.registros_erp;
drop policy if exists registros_erp_inserir_equipe on public.registros_erp;
drop policy if exists registros_erp_editar_equipe on public.registros_erp;
drop policy if exists registros_erp_excluir_gestores on public.registros_erp;

create policy registros_erp_ver_membro on public.registros_erp
for select to authenticated
using (public.usuario_e_membro(empresa_id));

create policy registros_erp_inserir_equipe on public.registros_erp
for insert to authenticated
with check (
  public.usuario_tem_papel(
    empresa_id,
    array['proprietario','administrador','financeiro','atendente','profissional']
  )
  and criado_por = (select auth.uid())
);

create policy registros_erp_editar_equipe on public.registros_erp
for update to authenticated
using (
  public.usuario_tem_papel(
    empresa_id,
    array['proprietario','administrador','financeiro','atendente','profissional']
  )
)
with check (
  public.usuario_tem_papel(
    empresa_id,
    array['proprietario','administrador','financeiro','atendente','profissional']
  )
);

create policy registros_erp_excluir_gestores on public.registros_erp
for delete to authenticated
using (public.usuario_tem_papel(empresa_id, array['proprietario','administrador']));

revoke all on public.registros_erp from anon;
grant select, insert, update, delete on public.registros_erp to authenticated;
grant usage, select on all sequences in schema public to authenticated;

commit;

-- Resultado esperado: Success. No rows returned

-- ============================================================================
-- CICLOPAG V5 - GRUPOS, USUARIOS, PERMISSOES, CONVITES E ANEXOS
-- Execute este arquivo INTEIRO no Supabase SQL Editor depois das versões V2-V4.
-- O script é idempotente: pode ser executado novamente.
-- ============================================================================

begin;

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- Grupos de usuários e permissões por módulo
-- --------------------------------------------------------------------------
create table if not exists public.grupos_usuarios (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 80),
  descricao text,
  sistema boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.grupo_permissoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  grupo_id uuid not null references public.grupos_usuarios(id) on delete cascade,
  modulo text not null,
  visualizar boolean not null default false,
  cadastrar boolean not null default false,
  editar boolean not null default false,
  excluir boolean not null default false,
  imprimir boolean not null default false,
  emitir boolean not null default false,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grupo_id, modulo)
);

alter table public.membros_empresa
  add column if not exists grupo_usuario_id uuid references public.grupos_usuarios(id) on delete set null;

create index if not exists idx_grupos_usuarios_empresa on public.grupos_usuarios(empresa_id, ativo, nome);
create index if not exists idx_grupo_permissoes_grupo on public.grupo_permissoes(grupo_id, modulo);
create index if not exists idx_membros_grupo_usuario on public.membros_empresa(grupo_usuario_id);

-- --------------------------------------------------------------------------
-- Convites de acesso. O usuário cria a própria senha no Supabase Auth e o
-- convite o vincula automaticamente à empresa e ao grupo selecionado.
-- --------------------------------------------------------------------------
create table if not exists public.convites_acesso (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  funcionario_registro_id uuid,
  nome text not null,
  email text not null,
  grupo_usuario_id uuid not null references public.grupos_usuarios(id) on delete restrict,
  token text not null unique,
  status text not null default 'pendente' check (status in ('pendente','aceito','cancelado','expirado')),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '7 days'),
  aceito_em timestamptz,
  updated_at timestamptz not null default now(),
  unique (empresa_id, email)
);

create index if not exists idx_convites_empresa_status on public.convites_acesso(empresa_id, status, criado_em desc);
create index if not exists idx_convites_token on public.convites_acesso(token);

-- Histórico das ações operacionais que dependem de integrações ou mudança de estado.
create table if not exists public.acoes_erp (
  id bigint generated by default as identity primary key,
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  registro_id uuid,
  modulo text not null,
  acao text not null,
  detalhes jsonb not null default '{}'::jsonb,
  executado_por uuid references auth.users(id) on delete set null,
  executado_em timestamptz not null default now()
);
create index if not exists idx_acoes_erp_empresa on public.acoes_erp(empresa_id, executado_em desc);

-- --------------------------------------------------------------------------
-- Updated_at
-- --------------------------------------------------------------------------
drop trigger if exists trg_grupos_usuarios_updated_at on public.grupos_usuarios;
create trigger trg_grupos_usuarios_updated_at before update on public.grupos_usuarios
for each row execute function public.definir_updated_at();

drop trigger if exists trg_grupo_permissoes_updated_at on public.grupo_permissoes;
create trigger trg_grupo_permissoes_updated_at before update on public.grupo_permissoes
for each row execute function public.definir_updated_at();

drop trigger if exists trg_convites_acesso_updated_at on public.convites_acesso;
create trigger trg_convites_acesso_updated_at before update on public.convites_acesso
for each row execute function public.definir_updated_at();

-- --------------------------------------------------------------------------
-- Catálogo oficial de módulos usado para gerar as permissões.
-- --------------------------------------------------------------------------
create table if not exists public.catalogo_modulos_erp (
  modulo text primary key,
  titulo text not null,
  secao text not null,
  ordem integer not null default 0
);

insert into public.catalogo_modulos_erp (modulo,titulo,secao,ordem) values
('clientes','Clientes','Cadastros',10),('fornecedores','Fornecedores','Cadastros',20),('funcionarios','Funcionários','Cadastros',30),('transportadoras','Transportadoras','Cadastros',40),('cadastros-opcoes','Opções auxiliares','Cadastros',50),
('produtos','Produtos','Itens',60),('servicos','Serviços','Itens',70),('grades-variacoes','Grades e variações','Itens',80),('itens-opcoes','Opções auxiliares de itens','Itens',90),
('orcamentos-produtos','Orçamentos de produtos','Orçamentos',100),('orcamentos-servicos','Orçamentos de serviços','Orçamentos',110),('orcamentos-opcoes','Opções auxiliares de orçamentos','Orçamentos',120),
('vendas-produtos','Vendas de produtos','Vendas',130),('vendas-servicos','Vendas de serviços','Vendas',140),('vendas-balcao','PDV e caixa','Vendas',150),('vendas-devolucoes','Trocas e devoluções','Vendas',160),('vendas-opcoes','Opções auxiliares de vendas','Vendas',170),
('os-gerenciar','Ordens de serviço','Ordens de serviços',180),('os-painel','Painel de O.S.','Ordens de serviços',190),('os-opcoes','Opções auxiliares de O.S.','Ordens de serviços',200),
('estoque-movimentacoes','Movimentações','Estoque',210),('estoque-ajustes','Ajustes','Estoque',220),('estoque-transferencias','Transferências','Estoque',230),('estoque-cotacoes','Cotações','Estoque',240),('compras-produtos','Compras de produtos','Estoque',250),('compras-servicos','Compras de serviços','Estoque',260),('estoque-opcoes','Opções auxiliares de estoque','Estoque',270),
('contas-pagar','Contas a pagar','Financeiro',280),('contas-receber','Contas a receber','Financeiro',290),('contas-bancarias','Contas bancárias','Financeiro',300),('formas-pagamento','Formas de pagamento','Financeiro',310),('dre','DRE gerencial','Financeiro',320),('fluxo-caixa','Fluxo de caixa','Financeiro',330),('boletos','Boletos bancários','Financeiro',340),('financeiro-opcoes','Opções auxiliares financeiras','Financeiro',350),
('notas-produtos','Notas de produtos','Fiscal',360),('notas-servicos','Notas de serviços','Fiscal',370),('notas-consumidor','Notas do consumidor','Fiscal',380),('notas-compras','Notas de compras','Fiscal',390),('importacao-dados','Importação de dados','Fiscal',400),('fiscal-opcoes','Opções auxiliares fiscais','Fiscal',410),
('contratos-servicos','Contratos de serviços','Contratos',420),('contratos-locacoes','Contratos de locação','Contratos',430),('contratos-assinaturas','Assinaturas recorrentes','Contratos',440),('contratos-opcoes','Opções auxiliares de contratos','Contratos',450),
('atendimentos','Atendimentos','Atendimentos',460),('agenda','Agenda','Agenda',470),('area-cliente','Área do Cliente','Área do Cliente',480),('relatorios','Relatórios','Relatórios',490),
('integracoes','Integrações e aplicativos','Aplicativos',500),('contabilidade','Área da Contabilidade','Aplicativos',510),('loja-virtual','Loja Virtual','Aplicativos',520),
('config-gerais','Configurações gerais','Configurações',530),('meu-plano','Meu plano','Configurações',540),('usuarios','Usuários','Configurações',550),('grupos-usuarios','Grupos de usuários','Configurações',560),('dados-empresa','Dados da empresa','Configurações',570),('marca-empresa','Marca da empresa','Configurações',580),('empresas-lojas','Empresas / Lojas','Configurações',590),('certificado-digital','Certificado digital','Configurações',600),('modelos-email','Modelos de e-mails','Configurações',610),('avisos-email','Avisos por e-mail','Configurações',620)
on conflict (modulo) do update set titulo=excluded.titulo, secao=excluded.secao, ordem=excluded.ordem;

-- --------------------------------------------------------------------------
-- Cria grupos padrão para uma empresa e preenche permissões.
-- --------------------------------------------------------------------------
create or replace function public.criar_grupos_padrao_empresa(p_empresa_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid;
  v_vendedor uuid;
begin
  insert into public.grupos_usuarios (empresa_id,nome,descricao,sistema,ativo)
  values (p_empresa_id,'Administração','Acesso administrativo completo.',true,true)
  on conflict (empresa_id,nome) do update set sistema=true, ativo=true
  returning id into v_admin;

  insert into public.grupos_usuarios (empresa_id,nome,descricao,sistema,ativo)
  values (p_empresa_id,'Vendedor','Acesso comercial a clientes, orçamentos, vendas, O.S., atendimentos e agenda.',true,true)
  on conflict (empresa_id,nome) do update set sistema=true, ativo=true
  returning id into v_vendedor;

  insert into public.grupo_permissoes (empresa_id,grupo_id,modulo,visualizar,cadastrar,editar,excluir,imprimir,emitir)
  select p_empresa_id,v_admin,c.modulo,true,true,true,true,true,true
  from public.catalogo_modulos_erp c
  on conflict (grupo_id,modulo) do update set visualizar=true,cadastrar=true,editar=true,excluir=true,imprimir=true,emitir=true;

  insert into public.grupo_permissoes (empresa_id,grupo_id,modulo,visualizar,cadastrar,editar,excluir,imprimir,emitir)
  select p_empresa_id,v_vendedor,c.modulo,
    c.modulo in ('clientes','orcamentos-produtos','orcamentos-servicos','vendas-produtos','vendas-servicos','vendas-balcao','vendas-devolucoes','os-gerenciar','os-painel','atendimentos','agenda','produtos','servicos'),
    c.modulo in ('clientes','orcamentos-produtos','orcamentos-servicos','vendas-produtos','vendas-servicos','vendas-balcao','vendas-devolucoes','os-gerenciar','atendimentos','agenda'),
    c.modulo in ('clientes','orcamentos-produtos','orcamentos-servicos','vendas-produtos','vendas-servicos','vendas-balcao','os-gerenciar','atendimentos','agenda'),
    false,
    c.modulo in ('clientes','orcamentos-produtos','orcamentos-servicos','vendas-produtos','vendas-servicos','vendas-balcao','os-gerenciar','atendimentos','agenda'),
    false
  from public.catalogo_modulos_erp c
  on conflict (grupo_id,modulo) do nothing;
end;
$$;

revoke all on function public.criar_grupos_padrao_empresa(uuid) from public;
grant execute on function public.criar_grupos_padrao_empresa(uuid) to authenticated;

create or replace function public.trg_criar_grupos_padrao_empresa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.criar_grupos_padrao_empresa(new.id);
  return new;
end;
$$;

drop trigger if exists on_empresa_criada_grupos on public.empresas;
create trigger on_empresa_criada_grupos after insert on public.empresas
for each row execute function public.trg_criar_grupos_padrao_empresa();

-- Empresas já existentes.
do $$
declare r record;
begin
  for r in select id from public.empresas loop
    perform public.criar_grupos_padrao_empresa(r.id);
  end loop;
end $$;

-- Grupo administrativo automático para proprietários/administradores.
create or replace function public.definir_grupo_padrao_membro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.grupo_usuario_id is null and new.papel in ('proprietario','administrador') then
    select id into new.grupo_usuario_id
    from public.grupos_usuarios
    where empresa_id=new.empresa_id and nome='Administração'
    limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_membros_grupo_padrao on public.membros_empresa;
create trigger trg_membros_grupo_padrao before insert or update of papel,grupo_usuario_id on public.membros_empresa
for each row execute function public.definir_grupo_padrao_membro();

update public.membros_empresa m
set grupo_usuario_id=g.id
from public.grupos_usuarios g
where m.empresa_id=g.empresa_id and g.nome='Administração' and m.papel in ('proprietario','administrador') and m.grupo_usuario_id is null;

-- --------------------------------------------------------------------------
-- Função central de autorização. Proprietário/administrador sempre passam.
-- Demais usuários dependem da permissão do grupo.
-- --------------------------------------------------------------------------
create or replace function public.usuario_pode(p_empresa_id uuid,p_modulo text,p_acao text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membros_empresa m
    left join public.grupo_permissoes gp
      on gp.grupo_id=m.grupo_usuario_id and gp.empresa_id=m.empresa_id and gp.modulo=p_modulo
    where m.empresa_id=p_empresa_id
      and m.usuario_id=(select auth.uid())
      and m.ativo
      and (
        m.papel in ('proprietario','administrador')
        or case p_acao
          when 'visualizar' then coalesce(gp.visualizar,false)
          when 'cadastrar' then coalesce(gp.cadastrar,false)
          when 'editar' then coalesce(gp.editar,false)
          when 'excluir' then coalesce(gp.excluir,false)
          when 'imprimir' then coalesce(gp.imprimir,false)
          when 'emitir' then coalesce(gp.emitir,false)
          else false
        end
      )
  );
$$;

revoke all on function public.usuario_pode(uuid,text,text) from public;
grant execute on function public.usuario_pode(uuid,text,text) to authenticated;

create or replace function public.minhas_permissoes(p_empresa_id uuid)
returns table(modulo text,visualizar boolean,cadastrar boolean,editar boolean,excluir boolean,imprimir boolean,emitir boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select c.modulo,
    case when m.papel in ('proprietario','administrador') then true else coalesce(gp.visualizar,false) end,
    case when m.papel in ('proprietario','administrador') then true else coalesce(gp.cadastrar,false) end,
    case when m.papel in ('proprietario','administrador') then true else coalesce(gp.editar,false) end,
    case when m.papel in ('proprietario','administrador') then true else coalesce(gp.excluir,false) end,
    case when m.papel in ('proprietario','administrador') then true else coalesce(gp.imprimir,false) end,
    case when m.papel in ('proprietario','administrador') then true else coalesce(gp.emitir,false) end
  from public.membros_empresa m
  cross join public.catalogo_modulos_erp c
  left join public.grupo_permissoes gp on gp.grupo_id=m.grupo_usuario_id and gp.modulo=c.modulo
  where m.empresa_id=p_empresa_id and m.usuario_id=(select auth.uid()) and m.ativo
  order by c.ordem;
$$;

revoke all on function public.minhas_permissoes(uuid) from public;
grant execute on function public.minhas_permissoes(uuid) to authenticated;

-- --------------------------------------------------------------------------
-- Convites: consulta segura e aceite pelo próprio e-mail autenticado.
-- --------------------------------------------------------------------------
create or replace function public.consultar_convite_acesso(p_token text)
returns table(email text,nome text,empresa_nome text,grupo_nome text,expira_em timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.email,c.nome,e.nome,g.nome,c.expira_em
  from public.convites_acesso c
  join public.empresas e on e.id=c.empresa_id
  join public.grupos_usuarios g on g.id=c.grupo_usuario_id
  where c.token=p_token and c.status='pendente' and c.expira_em>now()
  limit 1;
$$;

revoke all on function public.consultar_convite_acesso(text) from public;
grant execute on function public.consultar_convite_acesso(text) to anon,authenticated;

create or replace function public.aceitar_convite_acesso(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_email text;
  v_invite public.convites_acesso%rowtype;
  v_member uuid;
begin
  if v_user is null then raise exception 'Usuário não autenticado'; end if;
  select lower(email) into v_email from auth.users where id=v_user;
  select * into v_invite from public.convites_acesso where token=p_token and status='pendente' and expira_em>now() for update;
  if not found then raise exception 'Convite inválido ou expirado'; end if;
  if lower(v_invite.email)<>v_email then raise exception 'O e-mail autenticado não corresponde ao convite'; end if;

  insert into public.membros_empresa (empresa_id,usuario_id,papel,grupo_usuario_id,ativo)
  values (v_invite.empresa_id,v_user,'leitura',v_invite.grupo_usuario_id,true)
  on conflict (empresa_id,usuario_id) do update set grupo_usuario_id=excluded.grupo_usuario_id,ativo=true
  returning id into v_member;

  update public.convites_acesso set status='aceito',aceito_em=now() where id=v_invite.id;
  return v_member;
end;
$$;

revoke all on function public.aceitar_convite_acesso(text) from public;
grant execute on function public.aceitar_convite_acesso(text) to authenticated;

-- Lista segura de usuários da empresa, incluindo perfil e grupo.
create or replace function public.listar_usuarios_empresa(p_empresa_id uuid)
returns table(id uuid,usuario_id uuid,nome text,email text,papel text,ativo boolean,grupo_usuario_id uuid,grupo_nome text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id,m.usuario_id,coalesce(p.nome,'Usuário'),coalesce(p.email,''),m.papel,m.ativo,m.grupo_usuario_id,g.nome
  from public.membros_empresa m
  left join public.perfis p on p.id=m.usuario_id
  left join public.grupos_usuarios g on g.id=m.grupo_usuario_id
  where m.empresa_id=p_empresa_id
    and public.usuario_pode(p_empresa_id,'usuarios','visualizar')
  order by coalesce(p.nome,p.email);
$$;

revoke all on function public.listar_usuarios_empresa(uuid) from public;
grant execute on function public.listar_usuarios_empresa(uuid) to authenticated;

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.grupos_usuarios enable row level security;
alter table public.grupo_permissoes enable row level security;
alter table public.convites_acesso enable row level security;
alter table public.acoes_erp enable row level security;
alter table public.catalogo_modulos_erp enable row level security;

-- Limpa políticas desta versão.
do $$
declare p record;
begin
  for p in select schemaname,tablename,policyname from pg_policies
    where schemaname='public' and tablename in ('grupos_usuarios','grupo_permissoes','convites_acesso','acoes_erp','catalogo_modulos_erp')
  loop execute format('drop policy if exists %I on %I.%I',p.policyname,p.schemaname,p.tablename); end loop;
end $$;

create policy catalogo_modulos_ler on public.catalogo_modulos_erp for select to authenticated using (true);

create policy grupos_ver on public.grupos_usuarios for select to authenticated
using (public.usuario_e_membro(empresa_id));
create policy grupos_inserir on public.grupos_usuarios for insert to authenticated
with check (public.usuario_pode(empresa_id,'grupos-usuarios','cadastrar'));
create policy grupos_editar on public.grupos_usuarios for update to authenticated
using (public.usuario_pode(empresa_id,'grupos-usuarios','editar'))
with check (public.usuario_pode(empresa_id,'grupos-usuarios','editar'));
create policy grupos_excluir on public.grupos_usuarios for delete to authenticated
using (not sistema and public.usuario_pode(empresa_id,'grupos-usuarios','excluir'));

create policy permissoes_ver on public.grupo_permissoes for select to authenticated
using (public.usuario_e_membro(empresa_id));
create policy permissoes_gerenciar on public.grupo_permissoes for all to authenticated
using (public.usuario_pode(empresa_id,'grupos-usuarios','editar'))
with check (public.usuario_pode(empresa_id,'grupos-usuarios','editar'));

create policy convites_ver on public.convites_acesso for select to authenticated
using (public.usuario_pode(empresa_id,'usuarios','visualizar'));
create policy convites_criar on public.convites_acesso for insert to authenticated
with check (public.usuario_pode(empresa_id,'usuarios','cadastrar') and criado_por=(select auth.uid()));
create policy convites_editar on public.convites_acesso for update to authenticated
using (public.usuario_pode(empresa_id,'usuarios','editar'))
with check (public.usuario_pode(empresa_id,'usuarios','editar'));
create policy convites_excluir on public.convites_acesso for delete to authenticated
using (public.usuario_pode(empresa_id,'usuarios','excluir'));

create policy acoes_ver on public.acoes_erp for select to authenticated
using (public.usuario_e_membro(empresa_id));
create policy acoes_inserir on public.acoes_erp for insert to authenticated
with check (public.usuario_e_membro(empresa_id) and executado_por=(select auth.uid()));

-- Usuários: o próprio usuário enxerga seu vínculo; a lista completa exige permissão.
drop policy if exists membros_ver_mesma_empresa on public.membros_empresa;
create policy membros_ver_mesma_empresa on public.membros_empresa for select to authenticated
using (usuario_id=(select auth.uid()) or public.usuario_pode(empresa_id,'usuarios','visualizar'));

-- Administrador também pode gerenciar membros, além do proprietário.
drop policy if exists membros_inserir_gestores on public.membros_empresa;
drop policy if exists membros_editar_gestores on public.membros_empresa;
drop policy if exists membros_excluir_gestores on public.membros_empresa;
create policy membros_inserir_gestores on public.membros_empresa for insert to authenticated
with check (public.usuario_pode(empresa_id,'usuarios','cadastrar'));
create policy membros_editar_gestores on public.membros_empresa for update to authenticated
using (public.usuario_pode(empresa_id,'usuarios','editar'))
with check (public.usuario_pode(empresa_id,'usuarios','editar'));
create policy membros_excluir_gestores on public.membros_empresa for delete to authenticated
using (public.usuario_pode(empresa_id,'usuarios','excluir') and usuario_id<>(select auth.uid()));

-- Perfis de colegas visíveis apenas para quem pode visualizar usuários.
drop policy if exists perfis_ver_colegas_autorizados on public.perfis;
create policy perfis_ver_colegas_autorizados on public.perfis for select to authenticated
using (
  id=(select auth.uid()) or exists (
    select 1 from public.membros_empresa alvo
    where alvo.usuario_id=perfis.id and alvo.ativo and public.usuario_pode(alvo.empresa_id,'usuarios','visualizar')
  )
);

-- Permissões reais nos registros operacionais.
drop policy if exists registros_erp_ver_membro on public.registros_erp;
drop policy if exists registros_erp_inserir_equipe on public.registros_erp;
drop policy if exists registros_erp_editar_equipe on public.registros_erp;
drop policy if exists registros_erp_excluir_gestores on public.registros_erp;
create policy registros_erp_ver_permissao on public.registros_erp for select to authenticated
using (public.usuario_pode(empresa_id,modulo,'visualizar'));
create policy registros_erp_inserir_permissao on public.registros_erp for insert to authenticated
with check (public.usuario_pode(empresa_id,modulo,'cadastrar') and criado_por=(select auth.uid()));
create policy registros_erp_editar_permissao on public.registros_erp for update to authenticated
using (public.usuario_pode(empresa_id,modulo,'editar'))
with check (public.usuario_pode(empresa_id,modulo,'editar'));
create policy registros_erp_excluir_permissao on public.registros_erp for delete to authenticated
using (public.usuario_pode(empresa_id,modulo,'excluir'));

-- Clientes têm tabela própria, mas obedecem ao mesmo grupo.
drop policy if exists clientes_ver_membro on public.clientes;
drop policy if exists clientes_inserir_equipe on public.clientes;
drop policy if exists clientes_editar_equipe on public.clientes;
drop policy if exists clientes_excluir_gestores on public.clientes;
create policy clientes_ver_permissao on public.clientes for select to authenticated
using (public.usuario_pode(empresa_id,'clientes','visualizar'));
create policy clientes_inserir_permissao on public.clientes for insert to authenticated
with check (public.usuario_pode(empresa_id,'clientes','cadastrar'));
create policy clientes_editar_permissao on public.clientes for update to authenticated
using (public.usuario_pode(empresa_id,'clientes','editar'))
with check (public.usuario_pode(empresa_id,'clientes','editar'));
create policy clientes_excluir_permissao on public.clientes for delete to authenticated
using (public.usuario_pode(empresa_id,'clientes','excluir'));

-- --------------------------------------------------------------------------
-- Storage privado para fotos, XML, PDFs e anexos de até 5 MB.
-- --------------------------------------------------------------------------
insert into storage.buckets (id,name,public,file_size_limit)
values ('erp-anexos','erp-anexos',false,5242880)
on conflict (id) do update set public=false,file_size_limit=5242880;

drop policy if exists erp_anexos_ler on storage.objects;
drop policy if exists erp_anexos_inserir on storage.objects;
drop policy if exists erp_anexos_editar on storage.objects;
drop policy if exists erp_anexos_excluir on storage.objects;

create policy erp_anexos_ler on storage.objects for select to authenticated
using (
  bucket_id='erp-anexos'
  and split_part(name,'/',1) ~* '^[0-9a-f-]{36}$'
  and public.usuario_pode(split_part(name,'/',1)::uuid,split_part(name,'/',2),'visualizar')
);
create policy erp_anexos_inserir on storage.objects for insert to authenticated
with check (
  bucket_id='erp-anexos'
  and split_part(name,'/',1) ~* '^[0-9a-f-]{36}$'
  and public.usuario_pode(split_part(name,'/',1)::uuid,split_part(name,'/',2),'cadastrar')
);
create policy erp_anexos_editar on storage.objects for update to authenticated
using (bucket_id='erp-anexos' and split_part(name,'/',1) ~* '^[0-9a-f-]{36}$' and public.usuario_pode(split_part(name,'/',1)::uuid,split_part(name,'/',2),'editar'))
with check (bucket_id='erp-anexos' and split_part(name,'/',1) ~* '^[0-9a-f-]{36}$' and public.usuario_pode(split_part(name,'/',1)::uuid,split_part(name,'/',2),'editar'));
create policy erp_anexos_excluir on storage.objects for delete to authenticated
using (bucket_id='erp-anexos' and split_part(name,'/',1) ~* '^[0-9a-f-]{36}$' and public.usuario_pode(split_part(name,'/',1)::uuid,split_part(name,'/',2),'excluir'));

-- Grants explícitos.
grant select on public.catalogo_modulos_erp to authenticated;
grant select,insert,update,delete on public.grupos_usuarios,public.grupo_permissoes,public.convites_acesso,public.acoes_erp to authenticated;
grant usage,select on all sequences in schema public to authenticated;

commit;

-- Resultado esperado: Success. No rows returned
