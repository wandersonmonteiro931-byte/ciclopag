import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AccessControl } from '../lib/permissions'
import { supabase } from '../lib/supabase'

type Props = {
  pageId: string
  companyId: string
  session: Session
  userName: string
  access: AccessControl
  navigate: (pageId: string) => void
  onCompanyChanged: () => Promise<void>
}

type JsonMap = Record<string, string | number | boolean | null>
type ConfigRow = { secao: string; dados: JsonMap }
type StoreRow = { id: string; nome: string; tipo: string; cep: string | null; logradouro: string | null; numero: string | null; complemento: string | null; bairro: string | null; cidade: string | null; estado: string | null; ativa: boolean }
type NoticeRow = { id: string; nome: string; destinatarios: string[]; frequencia: string; eventos: string[]; ativo: boolean; criado_em: string }
type TemplateRow = { id: string; nome: string; assunto: string; corpo: string; ativo: boolean; atualizado_em: string }
type CertificateRow = { id: string; tipo: string; arquivo_nome: string; arquivo_path: string; validade_fim: string | null; senha_configurada: boolean; ativo: boolean }

const configurationPages = new Set([
  'config-gerais', 'meu-plano', 'dados-empresa', 'marca-empresa', 'empresas-lojas',
  'certificado-digital', 'modelos-email', 'avisos-email',
])

export function isConfigurationPage(pageId: string) {
  return configurationPages.has(pageId)
}

function friendlyError(message: string) {
  const value = message.toLowerCase()
  if (value.includes('does not exist') || value.includes('configuracoes_empresa')) return 'Execute o arquivo PASSO_6_SUPABASE_CONFIGURACOES.sql no Supabase.'
  if (value.includes('row-level security') || value.includes('permission denied')) return 'Seu grupo não possui permissão para alterar esta configuração.'
  if (value.includes('duplicate key')) return 'Já existe um cadastro com estes dados.'
  return message
}

function textValue(value: unknown) { return value == null ? '' : String(value) }
function boolValue(value: unknown) { return Boolean(value) }

function Field({ label, value, onChange, type = 'text', options, required, help, full, disabled, placeholder }: {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  options?: string[]
  required?: boolean
  help?: string
  full?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <label className={`cfg-field ${full ? 'full' : ''}`}>
      <span>{label}{required && <b>*</b>}{help && <i title={help}>●</i>}</span>
      {options ? (
        <select disabled={disabled} required={required} value={String(value)} onChange={(event) => onChange(event.target.value)}>
          <option value="">Selecione</option>
          {options.map((option) => <option key={option}>{option}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea disabled={disabled} required={required} value={String(value)} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input disabled={disabled} required={required} type={type} value={String(value)} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
      {help && <small>{help}</small>}
    </label>
  )
}

function Check({ label, checked, onChange, disabled, help }: { label: string; checked: boolean; onChange: (value: boolean) => void; disabled?: boolean; help?: string }) {
  return <label className="cfg-check"><input checked={checked} disabled={disabled} type="checkbox" onChange={(event) => onChange(event.target.checked)} /><span>{label}</span>{help && <i title={help}>●</i>}</label>
}

function SaveBar({ saving, onCancel, label = 'Atualizar' }: { saving: boolean; onCancel?: () => void; label?: string }) {
  return <div className="cfg-savebar"><button className="cfg-save" disabled={saving} type="submit">✓ {saving ? 'Salvando...' : label}</button><button className="cfg-cancel" onClick={onCancel} type="button">× Cancelar</button></div>
}

function Section({ title, icon = '⚙', children }: { title: string; icon?: string; children: React.ReactNode }) {
  return <section className="cfg-panel"><header><span>{icon}</span><h2>{title}</h2></header><div className="cfg-panel-body">{children}</div></section>
}

function useConfig(companyId: string, section: string) {
  const client = supabase
  const [data, setData] = useState<JsonMap>({})
  const [initial, setInitial] = useState<JsonMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    if (!client) return
    setLoading(true)
    const result = await client.from('configuracoes_empresa').select('secao,dados').eq('empresa_id', companyId).eq('secao', section).maybeSingle()
    if (result.error) setError(friendlyError(result.error.message))
    const values = (result.data as ConfigRow | null)?.dados ?? {}
    setData(values); setInitial(values); setLoading(false)
  }

  async function save(next = data) {
    if (!client) return false
    setSaving(true); setError(''); setSuccess('')
    const result = await client.from('configuracoes_empresa').upsert({ empresa_id: companyId, secao: section, dados: next }, { onConflict: 'empresa_id,secao' })
    setSaving(false)
    if (result.error) { setError(friendlyError(result.error.message)); return false }
    setInitial(next); setData(next); setSuccess('Configurações atualizadas com sucesso.'); return true
  }

  useEffect(() => { void load() }, [companyId, section])
  return { data, setData, initial, loading, saving, error, success, save, reset: () => setData(initial) }
}

const generalTabs = [
  { id: 'dados-gerais', label: 'Dados gerais' },
  { id: 'numeracoes', label: 'Numerações' },
  { id: 'movimentacoes', label: 'Movimentações' },
  { id: 'fiscal', label: 'Fiscal' },
  { id: 'notificacoes', label: 'Notificações' },
  { id: 'smtp', label: 'SMTP' },
  { id: 'dominio', label: 'Domínio próprio' },
]

function GeneralSettings({ companyId, access }: { companyId: string; access: AccessControl }) {
  const cfg = useConfig(companyId, 'gerais')
  const [tab, setTab] = useState('dados-gerais')
  const canEdit = access.can('config-gerais', 'editar')
  const update = (key: string, value: string | boolean | number) => cfg.setData((current) => ({ ...current, [key]: value }))
  const v = (key: string, fallback = '') => textValue(cfg.data[key] ?? fallback)
  const b = (key: string, fallback = false) => cfg.data[key] == null ? fallback : boolValue(cfg.data[key])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canEdit) return
    const sanitized = { ...cfg.data }
    if (sanitized.smtp_senha) {
      sanitized.smtp_senha_configurada = true
      delete sanitized.smtp_senha
    }
    await cfg.save(sanitized)
  }

  if (cfg.loading) return <div className="module-loading">Carregando configurações...</div>
  return (
    <form className="cfg-page" onSubmit={(event) => void submit(event)}>
      <div className="cfg-tabs">{generalTabs.map((item) => <button className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)} type="button" key={item.id}>{item.label}</button>)}</div>
      {cfg.error && <div className="record-error">{cfg.error}</div>}{cfg.success && <div className="record-success">{cfg.success}</div>}

      {tab === 'dados-gerais' && <Section title="Dados gerais" icon="⚙"><div className="cfg-grid three">
        <Field disabled={!canEdit} label="Casas decimais valor" type="number" value={v('casas_decimais_valor', '2')} onChange={(x) => update('casas_decimais_valor', Number(x))} />
        <Field disabled={!canEdit} label="Casas decimais quantidade" type="number" value={v('casas_decimais_quantidade', '2')} onChange={(x) => update('casas_decimais_quantidade', Number(x))} />
        <Field disabled={!canEdit} label="Limite de registro por página" options={['10','20','30','50','100']} value={v('limite_registro_pagina','20')} onChange={(x) => update('limite_registro_pagina', Number(x))} />
        <Field disabled={!canEdit} label="Estoque produto composição" options={['Controlar estoque','Não controlar estoque']} value={v('estoque_produto_composicao','Controlar estoque')} onChange={(x) => update('estoque_produto_composicao', x)} />
        <Field disabled={!canEdit} label="Produto sem estoque" options={['Permitir vender','Não permitir vender','Alertar e permitir']} value={v('produto_sem_estoque','Permitir vender')} onChange={(x) => update('produto_sem_estoque', x)} />
        <Field disabled={!canEdit} label="Vender sem condições de pagamento" options={['Permitir vender','Não permitir vender']} value={v('vender_sem_condicoes','Permitir vender')} onChange={(x) => update('vender_sem_condicoes', x)} />
        <Field disabled={!canEdit} label="Valor de custo do produto" options={['Não atualizar o valor em compras','Atualizar pela última compra','Atualizar pelo custo médio']} value={v('valor_custo_produto','Não atualizar o valor em compras')} onChange={(x) => update('valor_custo_produto', x)} />
        <Field disabled={!canEdit} label="Permitir acesso do suporte" options={['Sim','Não']} value={v('permitir_suporte','Sim')} onChange={(x) => update('permitir_suporte', x)} />
      </div></Section>}

      {tab === 'numeracoes' && <><Section title="Impressão de pedidos" icon="▤"><div className="cfg-grid three">
        <Field disabled={!canEdit} label="Formato do pedido A4" options={['PDF','HTML']} value={v('formato_pedido_a4','PDF')} onChange={(x) => update('formato_pedido_a4', x)} />
        <Field disabled={!canEdit} label="Tamanho da fonte A4" options={['10px','11px','12px','13px','14px']} value={v('fonte_a4','12px')} onChange={(x) => update('fonte_a4', x)} />
        <Field disabled={!canEdit} label="Tamanho da fonte do cupom" options={['8px','9px','10px','11px','12px']} value={v('fonte_cupom','10px')} onChange={(x) => update('fonte_cupom', x)} />
      </div></Section>
      {['Orçamentos','Vendas','Ordens de serviços','Compras'].map((group) => { const prefix = group.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_'); return <Section title={group} icon="▧" key={group}><div className="cfg-grid two"><Field disabled={!canEdit} full label={group === 'Ordens de serviços' ? 'Termos de garantia / observações externas' : 'Observações externas'} type="textarea" value={v(`${prefix}_observacoes`)} onChange={(x) => update(`${prefix}_observacoes`, x)} /><div className="cfg-check-grid"><strong>Exibir na impressão</strong>{['Coluna item','Coluna código','Coluna imagem','Coluna unidade','Coluna valor unitário','Coluna subtotal','Coluna NCM','Descrição do produto','Imagem do produto','Descrição do serviço','Imagem do serviço'].map((label) => { const key = `${prefix}_${label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_')}`; return <Check disabled={!canEdit} key={key} label={label} checked={b(key, ['Coluna item','Coluna unidade','Coluna valor unitário','Coluna subtotal'].includes(label))} onChange={(x) => update(key,x)} /> })}</div></div></Section> })}</>}

      {tab === 'movimentacoes' && <><Section title="Importar XML de compra" icon="↻"><div className="cfg-check-grid columns-2">
        <Check disabled={!canEdit} label="Considerar frete no produto" checked={b('xml_frete')} onChange={(x) => update('xml_frete',x)} />
        <Check disabled={!canEdit} label="Considerar desconto no produto" checked={b('xml_desconto')} onChange={(x) => update('xml_desconto',x)} />
        <Check disabled={!canEdit} label="Considerar impostos no produto" checked={b('xml_impostos')} onChange={(x) => update('xml_impostos',x)} />
        <Check disabled={!canEdit} label="Considerar outras despesas" checked={b('xml_despesas')} onChange={(x) => update('xml_despesas',x)} />
        <Field disabled={!canEdit} label="Filtragem dos produtos" options={['Filtrar apenas pelo nome do produto','Filtrar por código e nome','Filtrar por código de barras']} value={v('xml_filtro','Filtrar apenas pelo nome do produto')} onChange={(x) => update('xml_filtro',x)} />
      </div></Section><Section title="Vendas balcão / PDV" icon="▰"><div className="cfg-grid three">
        <Field disabled={!canEdit} label="Emitir NFC-e" options={['Habilitado: Confirmar antes de emitir','Habilitado: Emitir automaticamente','Desabilitado']} value={v('pdv_nfce','Habilitado: Confirmar antes de emitir')} onChange={(x) => update('pdv_nfce',x)} />
        <Field disabled={!canEdit} label="Balança do PDV" options={['Não utilizar balança','Balança serial','Balança por etiqueta']} value={v('pdv_balanca','Não utilizar balança')} onChange={(x) => update('pdv_balanca',x)} />
        <Field disabled={!canEdit} label="Habilitar Pix no PDV" options={['Sim','Não']} value={v('pdv_pix','Sim')} onChange={(x) => update('pdv_pix',x)} />
        <Check disabled={!canEdit} label="Sempre indicar vendedor" checked={b('pdv_indicar_vendedor')} onChange={(x) => update('pdv_indicar_vendedor',x)} />
        <Check disabled={!canEdit} label="Sempre indicar cliente" checked={b('pdv_indicar_cliente')} onChange={(x) => update('pdv_indicar_cliente',x)} />
        <Check disabled={!canEdit} label="Adicionar produto automaticamente" checked={b('pdv_add_automatico')} onChange={(x) => update('pdv_add_automatico',x)} />
        <Check disabled={!canEdit} label="Exibir fotos no carrinho" checked={b('pdv_fotos')} onChange={(x) => update('pdv_fotos',x)} />
        <Field disabled={!canEdit} full label="Texto no final da impressão" type="textarea" value={v('pdv_texto_final')} onChange={(x) => update('pdv_texto_final',x)} />
      </div></Section></>}

      {tab === 'fiscal' && <div className="cfg-fiscal-grid">{[
        { title:'NF-e', prefix:'nfe', fields:[['Última NF-e','ultima','0'],['Série NF-e','serie','1'],['Ambiente','ambiente','Produção'],['Versão da NF-e','versao','4.00'],['Informações complementares','informacoes','']] },
        { title:'NFC-e', prefix:'nfce', fields:[['Última NFC-e','ultima','0'],['Série NFC-e','serie','2'],['Token','token','000001'],['CSC','csc',''],['Ambiente','ambiente','Produção'],['Versão da NFC-e','versao','4.00'],['Informações complementares','informacoes','']] },
        { title:'NFS-e', prefix:'nfse', fields:[['Último RPS NFS-e','ultimo_rps','0'],['Série do RPS','serie','1'],['Regime especial de tributação','regime',''],['Natureza de operação','natureza',''],['Ambiente','ambiente','Produção'],['Layout da NFS-e','layout','Integradora'],['Apuração dos tributos','apuracao',''],['Informações complementares','informacoes','']] },
      ].map((card) => <Section title={card.title} icon="⌘" key={card.title}><div className="cfg-grid two">{card.fields.map(([label,key,def]) => <Field disabled={!canEdit} label={label} value={v(`${card.prefix}_${key}`,def)} options={key === 'ambiente' ? ['Produção','Homologação'] : key === 'layout' ? ['Integradora','Padrão municipal'] : undefined} type={key === 'informacoes' ? 'textarea' : 'text'} full={key === 'informacoes'} onChange={(x) => update(`${card.prefix}_${key}`,x)} key={key} />)}{card.prefix === 'nfe' && <><Check disabled={!canEdit} label="Subtrair valor do ICMS da base de cálculo do PIS e COFINS" checked={b('nfe_subtrair_icms')} onChange={(x) => update('nfe_subtrair_icms',x)} /><Check disabled={!canEdit} label="Exibir DANFE simplificado na listagem" checked={b('nfe_danfe_simplificado')} onChange={(x) => update('nfe_danfe_simplificado',x)} /></>}</div></Section>)}</div>}

      {tab === 'notificacoes' && <Section title="Notificações" icon="♟"><div className="cfg-grid two">
        {[
          ['Novos atendimentos na Área do Cliente','notif_atendimento_area_novo'],['Nova interação atendimento na Área do Cliente','notif_atendimento_area_interacao'],['Novos atendimentos Sistema','notif_atendimento_sistema_novo'],['Nova interação atendimento Sistema','notif_atendimento_sistema_interacao'],['Indicar atendente no Sistema','notif_indicar_atendente'],['Cotações respondidas','notif_cotacoes'],
        ].map(([label,key]) => <Field disabled={!canEdit} key={key} label={label} options={['Somente no sistema','No sistema e por e-mail','Não enviar e-mail para o cliente','Desativado']} value={v(key,key === 'notif_cotacoes' ? 'No sistema e por e-mail' : 'Somente no sistema')} onChange={(x) => update(key,x)} />)}
      </div></Section>}

      {tab === 'smtp' && <Section title="SMTP próprio" icon="✉"><p className="cfg-info">O uso de SMTP próprio é opcional. A senha é tratada como segredo e não é exibida novamente no navegador.</p><div className="cfg-grid two">
        <Field disabled={!canEdit} required label="Servidor" value={v('smtp_servidor')} onChange={(x) => update('smtp_servidor',x)} placeholder="smtp.seudominio.com" />
        <Field disabled={!canEdit} required label="Porta" type="number" value={v('smtp_porta','587')} onChange={(x) => update('smtp_porta',Number(x))} />
        <Field disabled={!canEdit} required label="E-mail" type="email" value={v('smtp_email')} onChange={(x) => update('smtp_email',x)} />
        <Field disabled={!canEdit} label={b('smtp_senha_configurada') ? 'Nova senha (já existe uma senha configurada)' : 'Senha'} type="password" value={v('smtp_senha')} onChange={(x) => update('smtp_senha',x)} />
        <Check disabled={!canEdit} label="Utiliza conexão segura (TLS / SSL)" checked={b('smtp_tls',true)} onChange={(x) => update('smtp_tls',x)} />
      </div><div className="cfg-warning">Atenção: o envio real depende da ativação do serviço de e-mail no backend. A senha nunca é gravada como texto visível na configuração pública.</div></Section>}

      {tab === 'dominio' && <Section title="Personalização de domínio" icon="⌂"><div className="domain-hero"><span>◆</span><div><h3>Configure seu domínio personalizado</h3><p>Deixe o sistema com a identidade da sua empresa.</p></div></div><div className="cfg-grid two"><Field disabled={!canEdit} label="Domínio" value={v('dominio')} onChange={(x) => update('dominio',x)} placeholder="sistema.suaempresa.com.br" /><Field disabled label="Situação" value={v('dominio_status','Não configurado')} onChange={() => undefined} /><Check disabled={!canEdit} label="Redirecionar automaticamente para HTTPS" checked={b('dominio_https',true)} onChange={(x) => update('dominio_https',x)} /><Check disabled={!canEdit} label="Usar marca da empresa no domínio" checked={b('dominio_marca',true)} onChange={(x) => update('dominio_marca',x)} /></div></Section>}

      <SaveBar saving={cfg.saving} onCancel={cfg.reset} />
    </form>
  )
}

const plans = [
  { id:'bronze', name:'Bronze', old:'R$ 183,08', price:'R$ 119,00', stores:1, users:1 },
  { id:'prata', name:'Prata', old:'R$ 306,15', price:'R$ 199,00', stores:1, users:3 },
  { id:'ouro', name:'Ouro', old:'R$ 444,62', price:'R$ 289,00', stores:2, users:5 },
  { id:'platina', name:'Platina', old:'R$ 583,08', price:'R$ 379,00', stores:3, users:7 },
]

function PlanSettings({ companyId, access }: { companyId: string; access: AccessControl }) {
  const client = supabase
  const [selected, setSelected] = useState('')
  const [period, setPeriod] = useState('anual')
  const [apps, setApps] = useState<string[]>([])
  const [billing, setBilling] = useState<JsonMap>({})
  const [payment, setPayment] = useState('Pix')
  const [open, setOpen] = useState('plan')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const canEdit = access.can('meu-plano','editar')

  useEffect(() => {
    if (!client) return
    void Promise.all([
      client.from('assinaturas_ciclopag').select('plano,ciclo,aplicativos,forma_pagamento').eq('empresa_id',companyId).maybeSingle(),
      client.from('configuracoes_empresa').select('dados').eq('empresa_id',companyId).eq('secao','faturamento').maybeSingle(),
    ]).then(([subscription, bill]) => {
      if (subscription.data) { setSelected(subscription.data.plano); setPeriod(subscription.data.ciclo); setApps(subscription.data.aplicativos ?? []); setPayment(subscription.data.forma_pagamento ?? 'Pix') }
      if (bill.data?.dados) setBilling(bill.data.dados as JsonMap)
    })
  }, [companyId])

  const plan = plans.find((item) => item.id === selected)
  async function finish() {
    if (!client || !selected || !canEdit) { if (!selected) setError('Escolha um plano antes de continuar.'); return }
    setSaving(true); setError(''); setMessage('')
    const results = await Promise.all([
      client.from('assinaturas_ciclopag').upsert({ empresa_id:companyId, plano:selected, ciclo:period, aplicativos:apps, forma_pagamento:payment, status:'aguardando_pagamento' },{onConflict:'empresa_id'}),
      client.from('configuracoes_empresa').upsert({empresa_id:companyId,secao:'faturamento',dados:billing},{onConflict:'empresa_id,secao'}),
    ])
    setSaving(false)
    const err = results.find((item) => item.error)?.error
    if (err) setError(friendlyError(err.message)); else setMessage('Plano e dados de faturamento salvos. O pagamento será concluído pelo provedor financeiro quando a integração estiver habilitada.')
  }

  return <div className="plan-page">{error && <div className="record-error">{error}</div>}{message && <div className="record-success">{message}</div>}
    <div className="plan-cards">{plans.slice().reverse().map((item) => <article className={`plan-card ${selected===item.id?'selected':''}`} key={item.id}><h2>{item.name}</h2><del>{item.old}</del><strong>{item.price}<small>/mês</small></strong><p>35% de desconto no contrato anual</p><ul><li>✓ Emissão de boletos</li><li>✓ Emissão de notas fiscais</li><li>✓ Layout e domínio personalizado</li><li>✓ {item.stores} empresa{item.stores>1?'s':''}/loja{item.stores>1?'s':''}</li><li>✓ {item.users} usuário{item.users>1?'s':''}</li><li>✓ Assistente IA</li></ul><button disabled={!canEdit} onClick={() => { setSelected(item.id); setOpen('custom') }} type="button">{selected===item.id?'Selecionado':'Escolher plano'}</button></article>)}</div>
    <div className="checkout-accordions">
      <button className={open==='custom'?'open':''} onClick={() => setOpen('custom')} type="button">⚙ Personalize o plano conforme sua necessidade! <span>⌄</span></button>
      {open==='custom' && <div className="checkout-body"><div className="cfg-grid two"><Field label="Período" options={['mensal','anual']} value={period} onChange={setPeriod}/><div className="cfg-check-grid"><strong>Recursos adicionais</strong>{['Agenda Pro','Assinatura Digital','Recursos Humanos','Loja Virtual','Área do Cliente'].map((app) => <Check key={app} label={app} checked={apps.includes(app)} onChange={(checked) => setApps((current) => checked ? [...current,app] : current.filter((value)=>value!==app))}/>)}</div></div></div>}
      <button className={open==='apps'?'open':''} onClick={() => setOpen('apps')} type="button">➤ Turbine seu plano com nossos aplicativos <span>⌄</span></button>
      {open==='apps' && <div className="checkout-body"><div className="app-addon-grid">{['Melhor Envio','Asaas','MDF-e','Criador de site'].map((app)=><label key={app}><input type="checkbox" checked={apps.includes(app)} onChange={(event)=>setApps((current)=>event.target.checked?[...current,app]:current.filter((value)=>value!==app))}/><strong>{app}</strong><small>Aplicativo opcional</small></label>)}</div></div>}
      <button className={open==='billing'?'open':''} onClick={() => setOpen('billing')} type="button">▤ Informe os dados de faturamento <span>⌄</span></button>
      {open==='billing' && <div className="checkout-body"><div className="cfg-grid three">{[['Razão social','razao_social'],['CPF / CNPJ','documento'],['E-mail financeiro','email'],['Telefone','telefone'],['CEP','cep'],['Cidade / UF','cidade']].map(([label,key])=><Field key={key} label={label} value={textValue(billing[key])} onChange={(x)=>setBilling((current)=>({...current,[key]:x}))}/>)}</div></div>}
      <button className={open==='payment'?'open':''} onClick={() => setOpen('payment')} type="button">▣ Escolha uma forma de pagamento <span>⌄</span></button>
      {open==='payment' && <div className="checkout-body"><div className="payment-options">{['Pix','Cartão de crédito','Boleto bancário'].map((item)=><label className={payment===item?'selected':''} key={item}><input type="radio" name="payment" checked={payment===item} onChange={()=>setPayment(item)}/><span>{item}</span></label>)}</div></div>}
    </div>
    <footer className="checkout-footer"><button onClick={()=>setSelected('')} type="button">Voltar</button><div><span>Resumo da compra:</span><strong>{plan ? `${plan.name} — ${plan.price}/mês` : 'Nenhum plano selecionado'}</strong></div><button disabled={saving || !selected || !canEdit} onClick={()=>void finish()} type="button">{saving?'Salvando...':'Continuar'}</button></footer>
  </div>
}

function StoresSettings({ companyId, access }: { companyId: string; access: AccessControl }) {
  const client = supabase
  const [rows,setRows]=useState<StoreRow[]>([]); const [search,setSearch]=useState(''); const [editing,setEditing]=useState<StoreRow|null>(null); const [form,setForm]=useState<JsonMap>({tipo:'Filial',ativa:true}); const [error,setError]=useState(''); const [saving,setSaving]=useState(false)
  const load=async()=>{ if(!client)return; const r=await client.from('lojas_empresa').select('*').eq('empresa_id',companyId).order('tipo').order('nome'); if(r.error)setError(friendlyError(r.error.message));else setRows((r.data??[]) as StoreRow[]) }
  useEffect(()=>{void load()},[companyId])
  const filtered=useMemo(()=>rows.filter((row)=>`${row.nome} ${row.cidade??''}`.toLowerCase().includes(search.toLowerCase())),[rows,search])
  function openForm(row?:StoreRow){setEditing(row??null);setForm(row?{...row}:{tipo:'Filial',ativa:true,nome:'',cep:'',logradouro:'',numero:'',complemento:'',bairro:'',cidade:'',estado:''})}
  async function submit(event:FormEvent){event.preventDefault();if(!client)return;setSaving(true);const payload={empresa_id:companyId,nome:form.nome,tipo:form.tipo,cep:form.cep||null,logradouro:form.logradouro||null,numero:form.numero||null,complemento:form.complemento||null,bairro:form.bairro||null,cidade:form.cidade||null,estado:form.estado||null,ativa:boolValue(form.ativa)};const r=editing?await client.from('lojas_empresa').update(payload).eq('id',editing.id):await client.from('lojas_empresa').insert(payload);setSaving(false);if(r.error)setError(friendlyError(r.error.message));else{setEditing(null);setForm({});void load()}}
  async function remove(row:StoreRow){if(!client||row.tipo==='Matriz'||!window.confirm(`Excluir a loja “${row.nome}”?`))return;const r=await client.from('lojas_empresa').delete().eq('id',row.id);if(r.error)setError(friendlyError(r.error.message));else void load()}
  return <div className="cfg-list-page">{error&&<div className="record-error">{error}</div>}{form.nome!==undefined?<form onSubmit={(event)=>void submit(event)}><Section title={editing?'Editar loja':'Adicionar loja'} icon="⌂"><div className="cfg-grid three"><Field required label="Nome" value={textValue(form.nome)} onChange={(x)=>setForm((c)=>({...c,nome:x}))}/><Field label="Tipo" options={['Matriz','Filial','Loja','Depósito']} value={textValue(form.tipo)} onChange={(x)=>setForm((c)=>({...c,tipo:x}))}/><Field label="CEP" value={textValue(form.cep)} onChange={(x)=>setForm((c)=>({...c,cep:x}))}/><Field label="Logradouro" value={textValue(form.logradouro)} onChange={(x)=>setForm((c)=>({...c,logradouro:x}))}/><Field label="Número" value={textValue(form.numero)} onChange={(x)=>setForm((c)=>({...c,numero:x}))}/><Field label="Complemento" value={textValue(form.complemento)} onChange={(x)=>setForm((c)=>({...c,complemento:x}))}/><Field label="Bairro" value={textValue(form.bairro)} onChange={(x)=>setForm((c)=>({...c,bairro:x}))}/><Field label="Cidade" value={textValue(form.cidade)} onChange={(x)=>setForm((c)=>({...c,cidade:x}))}/><Field label="Estado" value={textValue(form.estado)} onChange={(x)=>setForm((c)=>({...c,estado:x}))}/><Check label="Loja ativa" checked={boolValue(form.ativa)} onChange={(x)=>setForm((c)=>({...c,ativa:x}))}/></div></Section><SaveBar saving={saving} label="Salvar" onCancel={()=>{setForm({});setEditing(null)}}/></form>:<><div className="cfg-list-toolbar"><button disabled={!access.can('empresas-lojas','cadastrar')} onClick={()=>openForm()} type="button">⊕ Adicionar</button><div><input placeholder="Buscar" value={search} onChange={(e)=>setSearch(e.target.value)}/><button type="button">⌕</button></div></div><div className="records-table-wrap"><table className="records-table stores-table"><thead><tr><th>Nome</th><th>CEP</th><th>Logradouro</th><th>Número</th><th>Complemento</th><th>Bairro</th><th>Cidade</th><th>Estado</th><th>Ações</th></tr></thead><tbody>{filtered.map((row)=><tr key={row.id}><td>{row.nome}<small>{row.tipo}</small></td><td>{row.cep||''}</td><td>{row.logradouro||''}</td><td>{row.numero||''}</td><td>{row.complemento||''}</td><td>{row.bairro||''}</td><td>{row.cidade||''}</td><td>{row.estado||''}</td><td className="record-actions"><button className="action-view" onClick={()=>openForm(row)} type="button">⌕</button><button className="action-edit" disabled={!access.can('empresas-lojas','editar')} onClick={()=>openForm(row)} type="button">✎</button><button className="action-delete" disabled={!access.can('empresas-lojas','excluir')||row.tipo==='Matriz'} onClick={()=>void remove(row)} type="button">×</button></td></tr>)}</tbody></table><p className="table-summary">Mostrando {filtered.length} de um total de {rows.length}</p></div></>}</div>
}

function CompanyData({ companyId, access, onCompanyChanged }: { companyId:string; access:AccessControl; onCompanyChanged:()=>Promise<void> }) {
  const client=supabase; const cfg=useConfig(companyId,'dados_empresa'); const [base,setBase]=useState<JsonMap>({}); const canEdit=access.can('dados-empresa','editar')
  useEffect(()=>{if(!client)return;void client.from('empresas').select('nome,documento,email,telefone,status').eq('id',companyId).single().then(({data,error})=>{if(!error&&data)setBase(data as JsonMap)})},[companyId])
  const value=(key:string)=>textValue(cfg.data[key]??base[key]); const update=(key:string,x:string|boolean)=>cfg.setData((c)=>({...c,[key]:x}))
  async function submit(e:FormEvent){e.preventDefault();if(!client||!canEdit)return;const ok=await cfg.save();if(!ok)return;const r=await client.from('empresas').update({nome:value('nome_fantasia')||value('razao_social'),documento:value('cnpj'),email:value('email'),telefone:value('telefone')}).eq('id',companyId);if(r.error)return;await onCompanyChanged()}
  if(cfg.loading)return <div className="module-loading">Carregando...</div>
  return <form className="cfg-page" onSubmit={(e)=>void submit(e)}>{cfg.error&&<div className="record-error">{cfg.error}</div>}{cfg.success&&<div className="record-success">{cfg.success}</div>}<Section title="Dados gerais" icon="⌂"><div className="cfg-grid three"><Field disabled={!canEdit} label="Tipo" options={['Pessoa jurídica','Pessoa física','Estrangeira']} value={value('tipo')||'Pessoa jurídica'} onChange={(x)=>update('tipo',x)}/><Field disabled={!canEdit} label="CNPJ / CPF" value={value('cnpj')} onChange={(x)=>update('cnpj',x)}/><Field disabled={!canEdit} required label="Nome fantasia" value={value('nome_fantasia')} onChange={(x)=>update('nome_fantasia',x)}/><Field disabled={!canEdit} label="Razão social" value={value('razao_social')} onChange={(x)=>update('razao_social',x)}/><Field disabled={!canEdit} label="Ins. estadual" value={value('inscricao_estadual')} onChange={(x)=>update('inscricao_estadual',x)}/><Field disabled={!canEdit} label="Ins. municipal" value={value('inscricao_municipal')} onChange={(x)=>update('inscricao_municipal',x)}/><Field disabled={!canEdit} label="CNAE principal" value={value('cnae')} onChange={(x)=>update('cnae',x)}/><Field disabled={!canEdit} label="Regime tributário" options={['Simples Nacional','Lucro Presumido','Lucro Real','MEI','Isento']} value={value('regime_tributario')} onChange={(x)=>update('regime_tributario',x)}/><Field disabled={!canEdit} label="Regime especial de tributação" value={value('regime_especial')} onChange={(x)=>update('regime_especial',x)}/></div></Section><Section title="I.E. substitutos tributários" icon="⌘"><p className="cfg-info">Registre inscrições estaduais usadas nas operações com substituição tributária.</p><Field disabled={!canEdit} full label="Inscrições por UF" type="textarea" value={value('ie_substitutos')} onChange={(x)=>update('ie_substitutos',x)} placeholder="GO: 000000000; SP: 000000000"/></Section><Section title="Contato" icon="✉"><div className="cfg-grid four"><Field disabled={!canEdit} label="E-mail" type="email" value={value('email')} onChange={(x)=>update('email',x)}/><Field disabled={!canEdit} label="Telefone" value={value('telefone')} onChange={(x)=>update('telefone',x)}/><Field disabled={!canEdit} label="Celular" value={value('celular')} onChange={(x)=>update('celular',x)}/><Field disabled={!canEdit} label="Site" value={value('site')} onChange={(x)=>update('site',x)}/></div></Section><Section title="Endereço" icon="●"><div className="cfg-grid four"><Field disabled={!canEdit} label="CEP" value={value('cep')} onChange={(x)=>update('cep',x)}/><Field disabled={!canEdit} label="Logradouro" value={value('logradouro')} onChange={(x)=>update('logradouro',x)}/><Field disabled={!canEdit} label="Número" value={value('numero')} onChange={(x)=>update('numero',x)}/><Field disabled={!canEdit} label="Complemento" value={value('complemento')} onChange={(x)=>update('complemento',x)}/><Field disabled={!canEdit} label="Bairro" value={value('bairro')} onChange={(x)=>update('bairro',x)}/><Field disabled={!canEdit} label="Cidade" value={value('cidade')} onChange={(x)=>update('cidade',x)}/><Field disabled={!canEdit} label="Estado" value={value('estado')} onChange={(x)=>update('estado',x)}/></div></Section><SaveBar saving={cfg.saving} onCancel={cfg.reset}/></form>
}

function BrandSettings({companyId,access}:{companyId:string;access:AccessControl}){
  const client=supabase; const [form,setForm]=useState<JsonMap>({}); const [preview,setPreview]=useState(''); const [file,setFile]=useState<File|null>(null); const [saving,setSaving]=useState(false); const [error,setError]=useState(''); const [success,setSuccess]=useState(''); const canEdit=access.can('marca-empresa','editar')
  useEffect(()=>{if(!client)return;void client.from('configuracoes_marca').select('*').eq('empresa_id',companyId).maybeSingle().then(async({data,error:e})=>{if(e)setError(friendlyError(e.message));else if(data){setForm(data as JsonMap);if(data.logo_url){const signed=await client.storage.from('erp-anexos').createSignedUrl(data.logo_url,3600);if(signed.data)setPreview(signed.data.signedUrl)}}})},[companyId])
  async function submit(e:FormEvent){e.preventDefault();if(!client||!canEdit)return;setSaving(true);setError('');let path=textValue(form.logo_url);if(file){if(file.size>5*1024*1024){setError('A imagem deve ter no máximo 5 MB.');setSaving(false);return}path=`${companyId}/marca-empresa/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;const up=await client.storage.from('erp-anexos').upload(path,file,{upsert:true});if(up.error){setError(friendlyError(up.error.message));setSaving(false);return}}const payload={empresa_id:companyId,nome_exibicao:textValue(form.nome_exibicao)||'CicloPag',slogan:textValue(form.slogan),logo_url:path||null,favicon_url:textValue(form.favicon_url)||null,cor_primaria:textValue(form.cor_primaria)||'#0B1F2A',cor_secundaria:textValue(form.cor_secundaria)||'#00A86B',cor_fundo:textValue(form.cor_fundo)||'#FFFFFF',whatsapp:textValue(form.whatsapp),email_suporte:textValue(form.email_suporte),dominio_personalizado:textValue(form.dominio_personalizado)};const r=await client.from('configuracoes_marca').upsert(payload,{onConflict:'empresa_id'});setSaving(false);if(r.error)setError(friendlyError(r.error.message));else{setForm(payload as JsonMap);setSuccess('Marca atualizada com sucesso.');if(file)setPreview(URL.createObjectURL(file))}}
  return <form className="cfg-page" onSubmit={(e)=>void submit(e)}>{error&&<div className="record-error">{error}</div>}{success&&<div className="record-success">{success}</div>}<Section title="Marca da empresa" icon="◆"><div className="brand-editor"><div className="brand-upload-preview">{preview?<img src={preview} alt="Logomarca"/>:<div><span>▧</span><em>Logomarca</em></div>}<input disabled={!canEdit} accept="image/png,image/jpeg,image/gif,image/webp" type="file" onChange={(e)=>setFile(e.target.files?.[0]??null)}/><small>PNG, JPG, GIF ou WEBP. Máximo 5 MB.</small></div><div className="cfg-grid two"><Field disabled={!canEdit} label="Nome exibido" value={textValue(form.nome_exibicao)} onChange={(x)=>setForm((c)=>({...c,nome_exibicao:x}))}/><Field disabled={!canEdit} label="Slogan" value={textValue(form.slogan)} onChange={(x)=>setForm((c)=>({...c,slogan:x}))}/><Field disabled={!canEdit} label="Cor primária" type="color" value={textValue(form.cor_primaria)||'#0B1F2A'} onChange={(x)=>setForm((c)=>({...c,cor_primaria:x}))}/><Field disabled={!canEdit} label="Cor secundária" type="color" value={textValue(form.cor_secundaria)||'#00A86B'} onChange={(x)=>setForm((c)=>({...c,cor_secundaria:x}))}/><Field disabled={!canEdit} label="Cor de fundo" type="color" value={textValue(form.cor_fundo)||'#FFFFFF'} onChange={(x)=>setForm((c)=>({...c,cor_fundo:x}))}/><Field disabled={!canEdit} label="Domínio personalizado" value={textValue(form.dominio_personalizado)} onChange={(x)=>setForm((c)=>({...c,dominio_personalizado:x}))}/><Field disabled={!canEdit} label="WhatsApp" value={textValue(form.whatsapp)} onChange={(x)=>setForm((c)=>({...c,whatsapp:x}))}/><Field disabled={!canEdit} label="E-mail de suporte" type="email" value={textValue(form.email_suporte)} onChange={(x)=>setForm((c)=>({...c,email_suporte:x}))}/></div></div></Section><SaveBar saving={saving}/></form>
}

function CertificateSettings({companyId,session,access}:{companyId:string;session:Session;access:AccessControl}){
  const client=supabase;const[rows,setRows]=useState<CertificateRow[]>([]);const[type,setType]=useState('A1');const[file,setFile]=useState<File|null>(null);const[password,setPassword]=useState('');const[confirm,setConfirm]=useState('');const[expiry,setExpiry]=useState('');const[error,setError]=useState('');const[success,setSuccess]=useState('');const[saving,setSaving]=useState(false);const canEdit=access.can('certificado-digital','editar')
  const load=async()=>{if(!client)return;const r=await client.from('certificados_digitais').select('*').eq('empresa_id',companyId).order('criado_em',{ascending:false});if(r.error)setError(friendlyError(r.error.message));else setRows((r.data??[]) as CertificateRow[])};useEffect(()=>{void load()},[companyId])
  async function submit(e:FormEvent){e.preventDefault();if(!client||!canEdit||!file)return;if(file.size>5*1024*1024){setError('O certificado deve ter no máximo 5 MB.');return}if(password!==confirm){setError('As senhas não conferem.');return}setSaving(true);setError('');const path=`${companyId}/certificado-digital/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`;const up=await client.storage.from('erp-anexos').upload(path,file,{upsert:false});if(up.error){setError(friendlyError(up.error.message));setSaving(false);return}const r=await client.from('certificados_digitais').insert({empresa_id:companyId,tipo:type,arquivo_nome:file.name,arquivo_path:path,validade_fim:expiry||null,senha_configurada:Boolean(password),ativo:true,criado_por:session.user.id});setSaving(false);if(r.error)setError(friendlyError(r.error.message));else{setSuccess('Certificado armazenado no bucket privado. A senha não é gravada no frontend.');setFile(null);setPassword('');setConfirm('');void load()}}
  return <div className="cfg-page">{error&&<div className="record-error">{error}</div>}{success&&<div className="record-success">{success}</div>}<div className="certificate-types"><button className={type==='A1'?'active':''} onClick={()=>setType('A1')} type="button"><strong>Certificado A1</strong><span>Arquivo digital PFX/P12, normalmente com validade de 1 ano.</span></button><button className={type==='A3'?'active':''} onClick={()=>setType('A3')} type="button"><strong>Certificado A3</strong><span>Token ou cartão físico. Compatibilidade depende do conector fiscal.</span></button></div><form onSubmit={(e)=>void submit(e)}><Section title={`Configurar certificado ${type}`} icon="▣"><div className="cfg-grid two"><label className="cfg-field"><span>Arquivo do certificado*</span><input disabled={!canEdit} required accept=".pfx,.p12" type="file" onChange={(e)=>setFile(e.target.files?.[0]??null)}/><small>PFX ou P12, máximo 5 MB.</small></label><Field disabled={!canEdit} label="Validade" type="date" value={expiry} onChange={setExpiry}/><Field disabled={!canEdit} required label="Senha do certificado" type="password" value={password} onChange={setPassword}/><Field disabled={!canEdit} required label="Confirme a senha" type="password" value={confirm} onChange={setConfirm}/></div><div className="cfg-warning">Por segurança, a senha não é salva em configuração pública. A transmissão fiscal real deverá usar um segredo criptografado no backend.</div></Section><SaveBar saving={saving} label="Enviar certificado"/></form>{rows.length>0&&<Section title="Certificados cadastrados" icon="▤"><div className="records-table-wrap"><table className="records-table"><thead><tr><th>Tipo</th><th>Arquivo</th><th>Validade</th><th>Senha</th><th>Situação</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td>{row.tipo}</td><td>{row.arquivo_nome}</td><td>{row.validade_fim?new Date(row.validade_fim+'T00:00:00').toLocaleDateString('pt-BR'):'Não informada'}</td><td>{row.senha_configurada?'Configurada':'Não configurada'}</td><td>{row.ativo?'Ativo':'Inativo'}</td></tr>)}</tbody></table></div></Section>}</div>
}

function NoticesSettings({companyId,access}:{companyId:string;access:AccessControl}){
  const client=supabase;const[rows,setRows]=useState<NoticeRow[]>([]);const[search,setSearch]=useState('');const[form,setForm]=useState<{id?:string;nome:string;destinatarios:string;frequencia:string;eventos:string[];ativo:boolean}|null>(null);const[error,setError]=useState('');const[saving,setSaving]=useState(false);const canEdit=access.can('avisos-email','editar')
  const events=['Recebimentos e pagamentos','Valor total de vendas','Valor total de ordens de serviços','Produtos mais vendidos','Serviços mais vendidos','Produtos com estoque abaixo do mínimo','Informações complementares'];const load=async()=>{if(!client)return;const r=await client.from('avisos_email').select('*').eq('empresa_id',companyId).order('criado_em',{ascending:false});if(r.error)setError(friendlyError(r.error.message));else setRows((r.data??[]) as NoticeRow[])};useEffect(()=>{void load()},[companyId]);const filtered=rows.filter((r)=>r.nome.toLowerCase().includes(search.toLowerCase()))
  async function submit(e:FormEvent){e.preventDefault();if(!client||!form)return;setSaving(true);const payload={empresa_id:companyId,nome:form.nome,destinatarios:form.destinatarios.split(/[,;\n]/).map(x=>x.trim()).filter(Boolean).slice(0,5),frequencia:form.frequencia,eventos:form.eventos,ativo:form.ativo};const r=form.id?await client.from('avisos_email').update(payload).eq('id',form.id):await client.from('avisos_email').insert(payload);setSaving(false);if(r.error)setError(friendlyError(r.error.message));else{setForm(null);void load()}}
  return <div className="cfg-list-page">{error&&<div className="record-error">{error}</div>}{form?<form onSubmit={(e)=>void submit(e)}><Section title={form.id?'Editar aviso por e-mail':'Adicionar aviso por e-mail'} icon="♟"><div className="cfg-grid two"><Field required label="Nome do aviso" value={form.nome} onChange={(x)=>setForm({...form,nome:x})}/><Field required label="Frequência" options={['Diário','Semanal','Mensal']} value={form.frequencia} onChange={(x)=>setForm({...form,frequencia:x})}/><Field full required label="Destinatários (até 5 e-mails)" type="textarea" value={form.destinatarios} onChange={(x)=>setForm({...form,destinatarios:x})}/><div className="cfg-check-grid"><strong>Conteúdo do aviso</strong>{events.map((event)=><Check key={event} label={event} checked={form.eventos.includes(event)} onChange={(checked)=>setForm({...form,eventos:checked?[...form.eventos,event]:form.eventos.filter((x)=>x!==event)})}/>)}</div><Check label="Aviso ativo" checked={form.ativo} onChange={(x)=>setForm({...form,ativo:x})}/></div></Section><SaveBar saving={saving} label="Salvar" onCancel={()=>setForm(null)}/></form>:<><div className="cfg-list-toolbar"><button disabled={!access.can('avisos-email','cadastrar')} onClick={()=>setForm({nome:'',destinatarios:'',frequencia:'Semanal',eventos:[],ativo:true})} type="button">⊕ Adicionar</button><div><input placeholder="Buscar" value={search} onChange={(e)=>setSearch(e.target.value)}/><button type="button">⌕</button></div></div>{filtered.length===0?<div className="configuration-empty"><div>♟</div><section><h2>Avisos por e-mail</h2><p>Envie relatórios periódicos para até cinco destinatários, com informações essenciais da empresa.</p><button onClick={()=>setForm({nome:'',destinatarios:'',frequencia:'Semanal',eventos:[],ativo:true})} type="button">⊕ Adicionar meu primeiro aviso por e-mail</button><h3>Adicionando avisos por e-mail você vai conseguir:</h3><ul>{events.map((event)=><li key={event}>● {event}</li>)}</ul></section></div>:<div className="records-table-wrap"><table className="records-table"><thead><tr><th>Nome</th><th>Destinatários</th><th>Frequência</th><th>Situação</th><th>Ações</th></tr></thead><tbody>{filtered.map((row)=><tr key={row.id}><td>{row.nome}</td><td>{row.destinatarios.join(', ')}</td><td>{row.frequencia}</td><td>{row.ativo?'Ativo':'Inativo'}</td><td className="record-actions"><button className="action-edit" disabled={!canEdit} onClick={()=>setForm({id:row.id,nome:row.nome,destinatarios:row.destinatarios.join('; '),frequencia:row.frequencia,eventos:row.eventos,ativo:row.ativo})} type="button">✎</button></td></tr>)}</tbody></table></div>}</>}</div>
}

function EmailTemplates({companyId,access}:{companyId:string;access:AccessControl}){
  const client=supabase;const[rows,setRows]=useState<TemplateRow[]>([]);const[form,setForm]=useState<{id?:string;nome:string;assunto:string;corpo:string;ativo:boolean}|null>(null);const[error,setError]=useState('');const[saving,setSaving]=useState(false);const canEdit=access.can('modelos-email','editar');const load=async()=>{if(!client)return;const r=await client.from('modelos_email').select('*').eq('empresa_id',companyId).order('nome');if(r.error)setError(friendlyError(r.error.message));else setRows((r.data??[]) as TemplateRow[])};useEffect(()=>{void load()},[companyId]);async function submit(e:FormEvent){e.preventDefault();if(!client||!form)return;setSaving(true);const payload={empresa_id:companyId,nome:form.nome,assunto:form.assunto,corpo:form.corpo,ativo:form.ativo};const r=form.id?await client.from('modelos_email').update(payload).eq('id',form.id):await client.from('modelos_email').insert(payload);setSaving(false);if(r.error)setError(friendlyError(r.error.message));else{setForm(null);void load()}}
  return <div className="cfg-list-page">{error&&<div className="record-error">{error}</div>}{form?<form onSubmit={(e)=>void submit(e)}><Section title={form.id?'Editar modelo de e-mail':'Adicionar modelo de e-mail'} icon="✉"><div className="cfg-grid two"><Field required label="Nome do modelo" value={form.nome} onChange={(x)=>setForm({...form,nome:x})}/><Field required label="Assunto" value={form.assunto} onChange={(x)=>setForm({...form,assunto:x})}/><Field full required label="Mensagem" type="textarea" value={form.corpo} onChange={(x)=>setForm({...form,corpo:x})} help="Use variáveis como {{cliente}}, {{empresa}}, {{valor}} e {{vencimento}}."/><Check label="Modelo ativo" checked={form.ativo} onChange={(x)=>setForm({...form,ativo:x})}/></div></Section><SaveBar saving={saving} label="Salvar" onCancel={()=>setForm(null)}/></form>:<><div className="cfg-list-toolbar"><button disabled={!access.can('modelos-email','cadastrar')} onClick={()=>setForm({nome:'',assunto:'',corpo:'',ativo:true})} type="button">⊕ Adicionar</button></div><div className="records-table-wrap"><table className="records-table"><thead><tr><th>Modelo</th><th>Assunto</th><th>Situação</th><th>Atualização</th><th>Ações</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td>{row.nome}</td><td>{row.assunto}</td><td>{row.ativo?'Ativo':'Inativo'}</td><td>{new Date(row.atualizado_em).toLocaleDateString('pt-BR')}</td><td className="record-actions"><button className="action-edit" disabled={!canEdit} onClick={()=>setForm({id:row.id,nome:row.nome,assunto:row.assunto,corpo:row.corpo,ativo:row.ativo})} type="button">✎</button></td></tr>)}</tbody></table></div></>}</div>
}

export function ConfigurationManagement(props: Props) {
  switch (props.pageId) {
    case 'config-gerais': return <GeneralSettings companyId={props.companyId} access={props.access}/>
    case 'meu-plano': return <PlanSettings companyId={props.companyId} access={props.access}/>
    case 'dados-empresa': return <CompanyData companyId={props.companyId} access={props.access} onCompanyChanged={props.onCompanyChanged}/>
    case 'marca-empresa': return <BrandSettings companyId={props.companyId} access={props.access}/>
    case 'empresas-lojas': return <StoresSettings companyId={props.companyId} access={props.access}/>
    case 'certificado-digital': return <CertificateSettings companyId={props.companyId} session={props.session} access={props.access}/>
    case 'modelos-email': return <EmailTemplates companyId={props.companyId} access={props.access}/>
    case 'avisos-email': return <NoticesSettings companyId={props.companyId} access={props.access}/>
    default: return null
  }
}
