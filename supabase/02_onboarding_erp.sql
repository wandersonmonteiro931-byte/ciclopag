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
