-- ==========================================================================
-- CICLOPAG V6 - CONFIGURACOES, PLANOS, LOJAS, E-MAIL E CERTIFICADOS
-- Execute inteiro depois do SQL da V5. Script idempotente.
-- ==========================================================================
begin;

create extension if not exists pgcrypto;

create table if not exists public.configuracoes_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  secao text not null,
  dados jsonb not null default '{}'::jsonb,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, secao)
);

create table if not exists public.lojas_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  tipo text not null default 'Filial' check (tipo in ('Matriz','Filial','Loja','Depósito')),
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  ativa boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.avisos_email (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  destinatarios text[] not null default '{}',
  frequencia text not null default 'Semanal' check (frequencia in ('Diário','Semanal','Mensal')),
  eventos text[] not null default '{}',
  ativo boolean not null default true,
  ultimo_envio timestamptz,
  proximo_envio timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(destinatarios) <= 5)
);

create table if not exists public.modelos_email (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  assunto text not null,
  corpo text not null,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (empresa_id, nome)
);

create table if not exists public.assinaturas_ciclopag (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas(id) on delete cascade,
  plano text not null check (plano in ('bronze','prata','ouro','platina')),
  ciclo text not null default 'mensal' check (ciclo in ('mensal','anual')),
  aplicativos text[] not null default '{}',
  forma_pagamento text not null default 'Pix',
  status text not null default 'rascunho' check (status in ('rascunho','aguardando_pagamento','ativa','inadimplente','cancelada')),
  inicio_em date,
  proxima_cobranca date,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificados_digitais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  tipo text not null check (tipo in ('A1','A3')),
  arquivo_nome text not null,
  arquivo_path text not null,
  validade_fim date,
  senha_configurada boolean not null default false,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_configuracoes_empresa_secao on public.configuracoes_empresa(empresa_id,secao);
create index if not exists idx_lojas_empresa_nome on public.lojas_empresa(empresa_id,ativa,nome);
create index if not exists idx_avisos_email_empresa on public.avisos_email(empresa_id,ativo);
create index if not exists idx_modelos_email_empresa on public.modelos_email(empresa_id,ativo,nome);
create index if not exists idx_certificados_empresa on public.certificados_digitais(empresa_id,ativo,validade_fim);

-- Updated_at.
drop trigger if exists trg_configuracoes_empresa_updated_at on public.configuracoes_empresa;
create trigger trg_configuracoes_empresa_updated_at before update on public.configuracoes_empresa for each row execute function public.definir_updated_at();
drop trigger if exists trg_lojas_empresa_updated_at on public.lojas_empresa;
create trigger trg_lojas_empresa_updated_at before update on public.lojas_empresa for each row execute function public.definir_updated_at();
drop trigger if exists trg_avisos_email_updated_at on public.avisos_email;
create trigger trg_avisos_email_updated_at before update on public.avisos_email for each row execute function public.definir_updated_at();
drop trigger if exists trg_assinaturas_ciclopag_updated_at on public.assinaturas_ciclopag;
create trigger trg_assinaturas_ciclopag_updated_at before update on public.assinaturas_ciclopag for each row execute function public.definir_updated_at();
drop trigger if exists trg_certificados_digitais_updated_at on public.certificados_digitais;
create trigger trg_certificados_digitais_updated_at before update on public.certificados_digitais for each row execute function public.definir_updated_at();

create or replace function public.atualizar_modelos_email_timestamp()
returns trigger language plpgsql set search_path='' as $$ begin new.atualizado_em=now(); return new; end $$;
drop trigger if exists trg_modelos_email_updated_at on public.modelos_email;
create trigger trg_modelos_email_updated_at before update on public.modelos_email for each row execute function public.atualizar_modelos_email_timestamp();

-- Matriz automática.
create or replace function public.criar_loja_matriz_empresa()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.lojas_empresa(empresa_id,nome,tipo,ativa,criado_por)
  values(new.id,'Matriz','Matriz',true,new.criado_por)
  on conflict(empresa_id,nome) do nothing;
  return new;
end $$;
drop trigger if exists trg_empresa_criar_loja_matriz on public.empresas;
create trigger trg_empresa_criar_loja_matriz after insert on public.empresas for each row execute function public.criar_loja_matriz_empresa();

insert into public.lojas_empresa(empresa_id,nome,tipo,ativa,criado_por)
select e.id,'Matriz','Matriz',true,e.criado_por from public.empresas e
on conflict(empresa_id,nome) do nothing;

-- Modelos iniciais.
insert into public.modelos_email(empresa_id,nome,assunto,corpo,ativo,criado_por)
select e.id,'Convite para Área do Cliente','Acesse a Área do Cliente da {{empresa}}',
'Olá {{cliente}},\n\nSeu acesso à Área do Cliente da {{empresa}} está disponível.\n\nAcesse: {{link}}\n\nAtenciosamente,\n{{empresa}}',true,e.criado_por
from public.empresas e on conflict(empresa_id,nome) do nothing;

insert into public.modelos_email(empresa_id,nome,assunto,corpo,ativo,criado_por)
select e.id,'Cobrança próxima do vencimento','Sua cobrança vence em {{vencimento}}',
'Olá {{cliente}},\n\nA cobrança no valor de {{valor}} vence em {{vencimento}}.\n\nAtenciosamente,\n{{empresa}}',true,e.criado_por
from public.empresas e on conflict(empresa_id,nome) do nothing;

-- RLS.
alter table public.configuracoes_empresa enable row level security;
alter table public.lojas_empresa enable row level security;
alter table public.avisos_email enable row level security;
alter table public.modelos_email enable row level security;
alter table public.assinaturas_ciclopag enable row level security;
alter table public.certificados_digitais enable row level security;

-- Remove políticas antigas, se houver.
do $$
declare t text; p record;
begin
  foreach t in array array['configuracoes_empresa','lojas_empresa','avisos_email','modelos_email','assinaturas_ciclopag','certificados_digitais'] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy if exists %I on public.%I',p.policyname,t);
    end loop;
  end loop;
end $$;

create policy cfg_ver on public.configuracoes_empresa for select to authenticated using(public.usuario_e_membro(empresa_id));
create policy cfg_inserir on public.configuracoes_empresa for insert to authenticated with check(public.usuario_pode(empresa_id,'config-gerais','editar') or public.usuario_pode(empresa_id,'dados-empresa','editar') or public.usuario_pode(empresa_id,'meu-plano','editar'));
create policy cfg_editar on public.configuracoes_empresa for update to authenticated using(public.usuario_e_membro(empresa_id)) with check(public.usuario_pode(empresa_id,'config-gerais','editar') or public.usuario_pode(empresa_id,'dados-empresa','editar') or public.usuario_pode(empresa_id,'meu-plano','editar'));
create policy cfg_excluir on public.configuracoes_empresa for delete to authenticated using(public.usuario_pode(empresa_id,'config-gerais','excluir'));

create policy lojas_ver on public.lojas_empresa for select to authenticated using(public.usuario_pode(empresa_id,'empresas-lojas','visualizar'));
create policy lojas_inserir on public.lojas_empresa for insert to authenticated with check(public.usuario_pode(empresa_id,'empresas-lojas','cadastrar'));
create policy lojas_editar on public.lojas_empresa for update to authenticated using(public.usuario_pode(empresa_id,'empresas-lojas','editar')) with check(public.usuario_pode(empresa_id,'empresas-lojas','editar'));
create policy lojas_excluir on public.lojas_empresa for delete to authenticated using(public.usuario_pode(empresa_id,'empresas-lojas','excluir') and tipo<>'Matriz');

create policy avisos_ver on public.avisos_email for select to authenticated using(public.usuario_pode(empresa_id,'avisos-email','visualizar'));
create policy avisos_inserir on public.avisos_email for insert to authenticated with check(public.usuario_pode(empresa_id,'avisos-email','cadastrar'));
create policy avisos_editar on public.avisos_email for update to authenticated using(public.usuario_pode(empresa_id,'avisos-email','editar')) with check(public.usuario_pode(empresa_id,'avisos-email','editar'));
create policy avisos_excluir on public.avisos_email for delete to authenticated using(public.usuario_pode(empresa_id,'avisos-email','excluir'));

create policy modelos_ver on public.modelos_email for select to authenticated using(public.usuario_pode(empresa_id,'modelos-email','visualizar'));
create policy modelos_inserir on public.modelos_email for insert to authenticated with check(public.usuario_pode(empresa_id,'modelos-email','cadastrar'));
create policy modelos_editar on public.modelos_email for update to authenticated using(public.usuario_pode(empresa_id,'modelos-email','editar')) with check(public.usuario_pode(empresa_id,'modelos-email','editar'));
create policy modelos_excluir on public.modelos_email for delete to authenticated using(public.usuario_pode(empresa_id,'modelos-email','excluir'));

create policy plano_ver on public.assinaturas_ciclopag for select to authenticated using(public.usuario_pode(empresa_id,'meu-plano','visualizar'));
create policy plano_inserir on public.assinaturas_ciclopag for insert to authenticated with check(public.usuario_pode(empresa_id,'meu-plano','editar'));
create policy plano_editar on public.assinaturas_ciclopag for update to authenticated using(public.usuario_pode(empresa_id,'meu-plano','editar')) with check(public.usuario_pode(empresa_id,'meu-plano','editar'));

create policy certificados_ver on public.certificados_digitais for select to authenticated using(public.usuario_pode(empresa_id,'certificado-digital','visualizar'));
create policy certificados_inserir on public.certificados_digitais for insert to authenticated with check(public.usuario_pode(empresa_id,'certificado-digital','cadastrar') or public.usuario_pode(empresa_id,'certificado-digital','editar'));
create policy certificados_editar on public.certificados_digitais for update to authenticated using(public.usuario_pode(empresa_id,'certificado-digital','editar')) with check(public.usuario_pode(empresa_id,'certificado-digital','editar'));
create policy certificados_excluir on public.certificados_digitais for delete to authenticated using(public.usuario_pode(empresa_id,'certificado-digital','excluir'));

grant select,insert,update,delete on public.configuracoes_empresa,public.lojas_empresa,public.avisos_email,public.modelos_email,public.assinaturas_ciclopag,public.certificados_digitais to authenticated;
grant usage,select on all sequences in schema public to authenticated;

commit;
-- Resultado esperado: Success. No rows returned
