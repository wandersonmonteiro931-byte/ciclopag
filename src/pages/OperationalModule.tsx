import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { pageTitles } from '../data/erpMenu'
import { formRoutes, operationalDefinitions, type FormKind, type OperationalDefinition } from '../data/operationalPages'
import { supabase } from '../lib/supabase'

type Navigate = (pageId: string) => void

type OperationalModuleProps = {
  pageId: string
  companyId: string
  session: Session
  userName: string
  navigate: Navigate
  onDataChanged: () => Promise<void>
}

type GenericRow = {
  id: string
  numero: number | null
  titulo: string
  status: string
  valor_total: number | string | null
  dados: Record<string, unknown> | null
  criado_em: string
}

type ClientRow = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  status: string
  criado_em: string
  dados?: Record<string, unknown> | null
}

type FormValues = Record<string, string | boolean>

type LineItem = {
  id: string
  item: string
  detalhes: string
  quantidade: string
  unidade: string
  valor: string
  desconto: string
}

const initialValues: FormValues = {
  tipo: '',
  situacao: 'Ativo',
  nome: '',
  email: '',
  telefone_comercial: '',
  telefone_celular: '',
  fax: '',
  site: '',
  responsavel: '',
  documento: '',
  cpf: '',
  rg: '',
  nascimento: '',
  sexo: '',
  permitir_acesso: false,
  observacoes: '',
  tipo_endereco: '',
  cep: '',
  logradouro: '',
  numero_endereco: '',
  complemento: '',
  bairro: '',
  cidade_uf: '',
  limite_credito: '',
  codigo_interno: '',
  codigo_barra: '',
  grupo_produto: '',
  movimenta_estoque: 'Sim',
  habilitar_fiscal: 'Sim',
  possui_variacoes: 'Não',
  possui_composicao: 'Não',
  unidade_entrada: 'Unidade',
  unidade_saida: 'Unidade',
  fator_conversao: '1,00',
  custo: '',
  preco_venda: '',
  estoque_atual: '',
  estoque_minimo: '',
  ncm: '',
  cfop: '',
  aliquota: '',
  duracao: '',
  comissao: '',
  numero_registro: '1',
  cliente: '',
  fornecedor: '',
  vendedor: '',
  data: new Date().toLocaleDateString('pt-BR'),
  prazo_entrega: new Date().toLocaleDateString('pt-BR'),
  validade: '',
  canal_venda: 'Presencial',
  centro_custo: '',
  aos_cuidados: '',
  introducao: '',
  valor_frete: '0,00',
  transportadora: '',
  endereco_entrega: false,
  exibir_total: true,
  gerar_pagamento: false,
  observacoes_impressao: '',
  observacoes_internas: '',
  numero_nfe: '',
  data_emissao: new Date().toLocaleDateString('pt-BR'),
  descricao_pagamento: '',
  vencimento: '',
  plano_contas: '',
  forma_pagamento: '',
  conta_bancaria: '',
  pagamento_quitado: 'Não',
  data_compensacao: '',
  valor_bruto: '',
  juros: '',
  desconto_geral: '',
  recorrencia: false,
  periodo_inicio: '',
  periodo_fim: '',
  status_contrato: 'Confirmado',
  detalhes: '',
}

const formTabs: Record<FormKind, string[]> = {
  cliente: ['Dados gerais', 'Endereços', 'Contatos', 'Financeiro', 'Foto', 'Anexos', 'Observações'],
  fornecedor: ['Dados gerais', 'Endereços', 'Contatos', 'Anexos', 'Observações'],
  funcionario: ['Dados gerais', 'Comissionamento', 'Foto', 'Contatos', 'Endereço', 'Anexos'],
  transportadora: ['Dados gerais', 'Endereços', 'Contatos', 'Observações'],
  produto: ['Dados', 'Detalhes', 'Valores', 'Estoque', 'Fotos', 'Fiscal', 'Composição', 'Fornecedores'],
  servico: ['Dados', 'Detalhes', 'Valores', 'Fiscal', 'Comissionamento'],
  orcamento: ['Orçamento'],
  venda: ['Venda'],
  compra: ['Compra'],
  'conta-pagar': ['Lançamento financeiro', 'Outras informações', 'Anexos'],
  contrato: ['Contrato'],
  generico: ['Dados gerais', 'Observações'],
}

function normalizeMoney(value: string) {
  if (!value) return 0
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')
  return Number(normalized) || 0
}

function formatMoney(value: number | string | null | undefined) {
  const number = typeof value === 'number' ? value : Number(value || 0)
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number)
}

function friendlyError(message: string) {
  const value = message.toLowerCase()
  if (value.includes('registros_erp') || value.includes('column') || value.includes('does not exist')) {
    return 'Execute o arquivo PASSO_4_SUPABASE_OPERACIONAL.sql no Supabase e tente novamente.'
  }
  if (value.includes('row-level security')) return 'Seu usuário não possui permissão para salvar este registro.'
  return message
}

function Section({ title, icon, children, className = '' }: { title: string; icon?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`record-section ${className}`}>
      <header><span>{icon ?? '✎'}</span><h2>{title}</h2></header>
      <div className="record-section-body">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  placeholder = '',
  options,
  readOnly = false,
  className = '',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  type?: string
  placeholder?: string
  options?: string[]
  readOnly?: boolean
  className?: string
}) {
  return (
    <label className={`record-field ${className}`}>
      <span>{label}{required && <b>*</b>}</span>
      {options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} required={required}>
          <option value="">Selecione</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required={required} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} required={required} type={type} placeholder={placeholder} readOnly={readOnly} />
      )}
    </label>
  )
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="record-check-field">
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <span>{label}</span>
    </label>
  )
}

function UploadBox({ title, description }: { title: string; description: string }) {
  return (
    <div className="upload-box">
      <div><strong>{title}</strong><p>{description}</p></div>
      <input type="file" />
    </div>
  )
}

function LineItemsTable({ title, kind, items, setItems }: { title: string; kind: 'produto' | 'servico'; items: LineItem[]; setItems: (items: LineItem[]) => void }) {
  function updateItem(id: string, key: keyof LineItem, value: string) {
    setItems(items.map((item) => item.id === id ? { ...item, [key]: value } : item))
  }

  function addItem() {
    setItems([...items, { id: crypto.randomUUID(), item: '', detalhes: '', quantidade: '1', unidade: kind === 'produto' ? 'UND' : '', valor: '', desconto: '' }])
  }

  function removeItem(id: string) {
    if (items.length === 1) {
      setItems([{ id: crypto.randomUUID(), item: '', detalhes: '', quantidade: '1', unidade: kind === 'produto' ? 'UND' : '', valor: '', desconto: '' }])
      return
    }
    setItems(items.filter((item) => item.id !== id))
  }

  return (
    <Section title={title} icon={kind === 'produto' ? '◆' : '⚒'}>
      <div className="line-items-wrap">
        <table className="line-items-table">
          <thead>
            <tr><th>{kind === 'produto' ? 'Produto' : 'Serviço'}*</th><th>Detalhes</th><th>Quant.*</th>{kind === 'produto' && <th>Unidade*</th>}<th>Valor*</th><th>Desconto</th><th>Subtotal</th><th>Ação</th></tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const subtotal = Math.max(0, normalizeMoney(item.quantidade) * normalizeMoney(item.valor) - normalizeMoney(item.desconto))
              return (
                <tr key={item.id}>
                  <td><input value={item.item} onChange={(event) => updateItem(item.id, 'item', event.target.value)} placeholder="Digite para buscar" required /></td>
                  <td><input value={item.detalhes} onChange={(event) => updateItem(item.id, 'detalhes', event.target.value)} /></td>
                  <td><input value={item.quantidade} onChange={(event) => updateItem(item.id, 'quantidade', event.target.value)} inputMode="decimal" required /></td>
                  {kind === 'produto' && <td><input value={item.unidade} onChange={(event) => updateItem(item.id, 'unidade', event.target.value)} required /></td>}
                  <td><input value={item.valor} onChange={(event) => updateItem(item.id, 'valor', event.target.value)} inputMode="decimal" required /></td>
                  <td><input value={item.desconto} onChange={(event) => updateItem(item.id, 'desconto', event.target.value)} inputMode="decimal" /></td>
                  <td><input value={formatMoney(subtotal)} readOnly /></td>
                  <td><button className="remove-line-button" onClick={() => removeItem(item.id)} type="button">×</button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button className="secondary-record-button" onClick={addItem} type="button">＋ Adicionar {kind}</button>
    </Section>
  )
}

function getFallbackDefinition(pageId: string): OperationalDefinition {
  const info = pageTitles[pageId] ?? { title: pageId.replace(/-/g, ' '), section: 'CicloPag' }
  return {
    id: pageId,
    title: info.title,
    singular: 'registro',
    section: info.section,
    icon: '▦',
    addPageId: `${pageId}-adicionar`,
    formKind: 'generico',
    description: `Gerencie os registros de ${info.title.toLowerCase()} mantendo o mesmo padrão visual e operacional do CicloPag.`,
    benefits: ['Cadastro organizado', 'Pesquisa rápida', 'Histórico por empresa', 'Ações padronizadas'],
  }
}

function StandardListPage({
  definition,
  companyId,
  navigate,
}: {
  definition: OperationalDefinition
  companyId: string
  navigate: Navigate
}) {
  const client = supabase
  const [rows, setRows] = useState<Array<GenericRow | ClientRow>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [advanced, setAdvanced] = useState(false)

  async function load() {
    if (!client) return
    setLoading(true)
    setError('')
    if (definition.id === 'clientes') {
      const result = await client.from('clientes').select('id,nome,email,telefone,status,criado_em,dados').eq('empresa_id', companyId).order('criado_em', { ascending: false })
      if (result.error) setError(friendlyError(result.error.message))
      else setRows((result.data ?? []) as ClientRow[])
    } else {
      const result = await client.from('registros_erp').select('id,numero,titulo,status,valor_total,dados,criado_em').eq('empresa_id', companyId).eq('modulo', definition.id).order('criado_em', { ascending: false })
      if (result.error) setError(friendlyError(result.error.message))
      else setRows((result.data ?? []) as GenericRow[])
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.id, companyId])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => {
      const text = 'nome' in row ? `${row.nome} ${row.email ?? ''} ${row.telefone ?? ''}` : `${row.titulo} ${row.status}`
      return text.toLowerCase().includes(query)
    })
  }, [rows, search])

  async function remove(row: GenericRow | ClientRow) {
    const title = 'nome' in row ? row.nome : row.titulo
    if (!window.confirm(`Excluir “${title}”? Esta ação não poderá ser desfeita.`) || !client) return
    const table = definition.id === 'clientes' ? 'clientes' : 'registros_erp'
    const result = await client.from(table).delete().eq('id', row.id)
    if (result.error) setError(friendlyError(result.error.message))
    else await load()
  }

  return (
    <section className="standard-module-page">
      <div className="module-toolbar">
        <div className="module-toolbar-left">
          <button className="toolbar-add" onClick={() => navigate(definition.addPageId ?? `${definition.id}-adicionar`)} type="button">⊕ Adicionar</button>
          <button className="toolbar-more" type="button">⚙ Mais ações⌄</button>
          <button className="toolbar-view" title="Alterar visualização" type="button">▦</button>
        </div>
        <div className="module-search">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome" />
          <button aria-label="Buscar" type="button">⌕</button>
          <button onClick={() => setAdvanced((value) => !value)} type="button">◉ Busca avançada</button>
        </div>
      </div>

      {advanced && (
        <div className="advanced-search-panel">
          <Field label="Situação" value="" onChange={() => undefined} options={['Ativo', 'Inativo', 'Pendente', 'Concretizada', 'Confirmada']} />
          <Field label="Período inicial" value="" onChange={() => undefined} type="date" />
          <Field label="Período final" value="" onChange={() => undefined} type="date" />
          <button type="button">Aplicar filtros</button>
        </div>
      )}

      {error && <div className="inline-record-error">{error}</div>}
      {loading ? (
        <div className="erp-loading-row">Carregando registros...</div>
      ) : filtered.length === 0 ? (
        <div className="module-intro-state">
          <div className="module-intro-icon">{definition.icon}</div>
          <div className="module-intro-copy">
            <h2>{definition.title}</h2>
            <p>{definition.description}</p>
            <div className="module-intro-actions">
              <button className="toolbar-add" onClick={() => navigate(definition.addPageId ?? `${definition.id}-adicionar`)} type="button">⊕ Adicionar meu primeiro {definition.singular}</button>
              {definition.id === 'clientes' && <button className="toolbar-more" type="button">⇧ Importar meus clientes</button>}
            </div>
            <h3>Adicionando {definition.title.toLowerCase()} você vai conseguir:</h3>
            <ul>{definition.benefits.map((benefit) => <li key={benefit}>● <span>{benefit}</span></li>)}</ul>
          </div>
        </div>
      ) : (
        <div className="standard-table-wrap">
          <table className="standard-table">
            <thead>
              {'nome' in filtered[0]
                ? <tr><th>Nome</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Ações</th></tr>
                : <tr><th>Número</th><th>Descrição</th><th>Situação</th><th>Valor</th><th>Data</th><th>Ações</th></tr>}
            </thead>
            <tbody>
              {filtered.map((row) => 'nome' in row ? (
                <tr key={row.id}><td>{row.nome}</td><td>{row.email || '—'}</td><td>{row.telefone || '—'}</td><td><span className="table-status">{row.status}</span></td><td><div className="table-actions"><button disabled title="Visualização detalhada será habilitada na próxima etapa" type="button">⌕</button><button disabled title="Edição será habilitada na próxima etapa" type="button">✎</button><button title="Excluir" onClick={() => void remove(row)} type="button">×</button></div></td></tr>
              ) : (
                <tr key={row.id}><td>{row.numero ?? '—'}</td><td>{row.titulo}</td><td><span className="table-status">{row.status}</span></td><td>{formatMoney(row.valor_total)}</td><td>{new Intl.DateTimeFormat('pt-BR').format(new Date(row.criado_em))}</td><td><div className="table-actions"><button disabled title="Visualização detalhada será habilitada na próxima etapa" type="button">⌕</button><button disabled title="Edição será habilitada na próxima etapa" type="button">✎</button><button title="Excluir" onClick={() => void remove(row)} type="button">×</button></div></td></tr>
              ))}
            </tbody>
          </table>
          <div className="table-count">Mostrando 1 a {filtered.length} de um total de {filtered.length}</div>
        </div>
      )}
    </section>
  )
}

function RecordFormPage({
  kind,
  basePageId,
  companyId,
  session,
  userName,
  navigate,
  onDataChanged,
}: {
  kind: FormKind
  basePageId: string
  companyId: string
  session: Session
  userName: string
  navigate: Navigate
  onDataChanged: () => Promise<void>
}) {
  const client = supabase
  const [values, setValues] = useState<FormValues>({ ...initialValues, responsavel: userName, vendedor: userName })
  const [activeTab, setActiveTab] = useState(formTabs[kind][0])
  const [productItems, setProductItems] = useState<LineItem[]>([{ id: crypto.randomUUID(), item: '', detalhes: '', quantidade: '1', unidade: 'UND', valor: '', desconto: '' }])
  const [serviceItems, setServiceItems] = useState<LineItem[]>([{ id: crypto.randomUUID(), item: '', detalhes: '', quantidade: '1', unidade: '', valor: '', desconto: '' }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function setValue(key: string, value: string | boolean) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const productTotal = productItems.reduce((total, item) => total + Math.max(0, normalizeMoney(item.quantidade) * normalizeMoney(item.valor) - normalizeMoney(item.desconto)), 0)
  const serviceTotal = serviceItems.reduce((total, item) => total + Math.max(0, normalizeMoney(item.quantidade) * normalizeMoney(item.valor) - normalizeMoney(item.desconto)), 0)
  const grandTotal = productTotal + serviceTotal + normalizeMoney(String(values.valor_frete)) + normalizeMoney(String(values.valor_bruto)) + normalizeMoney(String(values.juros)) - normalizeMoney(String(values.desconto_geral))
  const recordTotal = kind === 'produto' || kind === 'servico' ? normalizeMoney(String(values.preco_venda)) : grandTotal

  const definition = operationalDefinitions[basePageId] ?? getFallbackDefinition(basePageId)

  function titleForSave() {
    const candidates = [values.nome, values.descricao_pagamento, values.cliente, values.fornecedor, values.detalhes]
    return String(candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) || `${definition.singular} sem título`)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...values,
        produtos: productItems,
        servicos: serviceItems,
        totais: { produtos: productTotal, servicos: serviceTotal, total: grandTotal },
      }
      if (kind === 'cliente') {
        const result = await client.from('clientes').insert({
          empresa_id: companyId,
          tipo: String(values.tipo || 'Pessoa física'),
          nome: String(values.nome).trim(),
          email: String(values.email).trim() || null,
          telefone: String(values.telefone_celular || values.telefone_comercial).trim() || null,
          documento: String(values.documento || values.cpf).trim() || null,
          observacoes: String(values.observacoes).trim() || null,
          status: String(values.situacao).toLowerCase() === 'ativo' ? 'ativo' : 'inativo',
          dados: payload,
        })
        if (result.error) throw result.error
      } else {
        const result = await client.from('registros_erp').insert({
          empresa_id: companyId,
          modulo: basePageId,
          tipo: kind,
          titulo: titleForSave(),
          status: String(kind === 'contrato' ? values.status_contrato : values.situacao || 'Ativo'),
          valor_total: recordTotal,
          dados: payload,
          criado_por: session.user.id,
        })
        if (result.error) throw result.error
      }
      setSuccess('Registro salvo com sucesso.')
      await onDataChanged()
      window.setTimeout(() => navigate(basePageId), 450)
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : 'Não foi possível salvar o registro.'))
    } finally {
      setSaving(false)
    }
  }

  const sharedAddress = (
    <Section title="Endereços" icon="●">
      <div className="record-grid record-grid-6">
        <Field label="Tipo" value={String(values.tipo_endereco)} onChange={(value) => setValue('tipo_endereco', value)} placeholder="Digite para buscar" />
        <Field label="CEP" value={String(values.cep)} onChange={(value) => setValue('cep', value)} />
        <Field className="span-2" label="Logradouro" value={String(values.logradouro)} onChange={(value) => setValue('logradouro', value)} />
        <Field label="Número" value={String(values.numero_endereco)} onChange={(value) => setValue('numero_endereco', value)} />
        <Field label="Complemento" value={String(values.complemento)} onChange={(value) => setValue('complemento', value)} />
        <Field label="Bairro" value={String(values.bairro)} onChange={(value) => setValue('bairro', value)} />
        <Field className="span-2" label="Cidade/UF" value={String(values.cidade_uf)} onChange={(value) => setValue('cidade_uf', value)} placeholder="Digite para buscar" />
      </div>
    </Section>
  )

  function personGeneral(title: string) {
    return (
      <Section title="Dados gerais" icon="✎">
        <div className="record-grid record-grid-4">
          <Field label={`Tipo de ${title}`} value={String(values.tipo)} onChange={(value) => setValue('tipo', value)} required options={['Pessoa física', 'Pessoa jurídica']} />
          <Field label="Situação" value={String(values.situacao)} onChange={(value) => setValue('situacao', value)} options={['Ativo', 'Inativo']} />
          <Field label="Nome" value={String(values.nome)} onChange={(value) => setValue('nome', value)} required />
          <Field label="E-mail" value={String(values.email)} onChange={(value) => setValue('email', value)} type="email" />
          <Field label="Telefone comercial" value={String(values.telefone_comercial)} onChange={(value) => setValue('telefone_comercial', value)} />
          <Field label="Telefone celular" value={String(values.telefone_celular)} onChange={(value) => setValue('telefone_celular', value)} />
          <Field label="FAX" value={String(values.fax)} onChange={(value) => setValue('fax', value)} />
          <Field label="Site" value={String(values.site)} onChange={(value) => setValue('site', value)} />
          <Field label="Vendedor / Responsável" value={String(values.responsavel)} onChange={(value) => setValue('responsavel', value)} placeholder="Digite para buscar" />
        </div>
      </Section>
    )
  }

  function renderPersonForm(entity: 'cliente' | 'fornecedor' | 'transportadora') {
    const general = personGeneral(entity)
    return (
      <>
        {activeTab === 'Dados gerais' && general}
        {activeTab === 'Endereços' && sharedAddress}
        {activeTab === 'Contatos' && <Section title="Contatos" icon="☎"><div className="record-grid record-grid-4"><Field label="Nome do contato" value={String(values.contato_nome ?? '')} onChange={(value) => setValue('contato_nome', value)} /><Field label="Cargo" value={String(values.contato_cargo ?? '')} onChange={(value) => setValue('contato_cargo', value)} /><Field label="Telefone" value={String(values.contato_telefone ?? '')} onChange={(value) => setValue('contato_telefone', value)} /><Field label="E-mail" value={String(values.contato_email ?? '')} onChange={(value) => setValue('contato_email', value)} type="email" /></div></Section>}
        {activeTab === 'Financeiro' && <Section title="Financeiro" icon="▣"><div className="record-grid record-grid-3"><Field label="Limite de crédito" value={String(values.limite_credito)} onChange={(value) => setValue('limite_credito', value)} placeholder="Deixe em branco para não limitar" /><Field label="Plano de contas" value={String(values.plano_contas)} onChange={(value) => setValue('plano_contas', value)} placeholder="Digite para buscar" /><Field label="Forma de pagamento padrão" value={String(values.forma_pagamento)} onChange={(value) => setValue('forma_pagamento', value)} placeholder="Digite para buscar" /></div></Section>}
        {activeTab === 'Foto' && <Section title="Foto" icon="▧"><UploadBox title={`Foto do ${entity}`} description="Insira uma imagem JPG, PNG ou GIF de até 5 MB." /></Section>}
        {activeTab === 'Anexos' && <Section title="Anexos" icon="▤"><UploadBox title="Arquivos e documentos" description="Utilize este espaço para anexar arquivos. Tamanho máximo de 5 MB por arquivo." /></Section>}
        {activeTab === 'Observações' && <Section title="Observações" icon="✎"><Field label="Observações" value={String(values.observacoes)} onChange={(value) => setValue('observacoes', value)} type="textarea" /></Section>}
      </>
    )
  }

  function renderEmployeeForm() {
    if (activeTab === 'Dados gerais') return <Section title="Dados gerais" icon="♙"><div className="record-grid record-grid-4"><Field label="Nome" value={String(values.nome)} onChange={(value) => setValue('nome', value)} required /><Field label="CPF" value={String(values.cpf)} onChange={(value) => setValue('cpf', value)} /><Field label="RG" value={String(values.rg)} onChange={(value) => setValue('rg', value)} /><Field label="Data de nascimento" value={String(values.nascimento)} onChange={(value) => setValue('nascimento', value)} type="date" /><Field label="Sexo" value={String(values.sexo)} onChange={(value) => setValue('sexo', value)} options={['Masculino', 'Feminino', 'Outro', 'Prefiro não informar']} /><Field label="E-mail" value={String(values.email)} onChange={(value) => setValue('email', value)} type="email" /><Field label="Situação" value={String(values.situacao)} onChange={(value) => setValue('situacao', value)} options={['Ativo', 'Inativo']} /><CheckField label="Permitir acesso ao sistema" checked={Boolean(values.permitir_acesso)} onChange={(value) => setValue('permitir_acesso', value)} /><Field className="span-4" label="Observações" value={String(values.observacoes)} onChange={(value) => setValue('observacoes', value)} type="textarea" /></div></Section>
    if (activeTab === 'Comissionamento') return <Section title="Comissionamento" icon="%"><div className="record-grid record-grid-3"><Field label="Comissão em produtos (%)" value={String(values.comissao_produtos ?? '')} onChange={(value) => setValue('comissao_produtos', value)} /><Field label="Comissão em serviços (%)" value={String(values.comissao_servicos ?? '')} onChange={(value) => setValue('comissao_servicos', value)} /><Field label="Meta mensal" value={String(values.meta_mensal ?? '')} onChange={(value) => setValue('meta_mensal', value)} /></div></Section>
    if (activeTab === 'Foto') return <Section title="Foto" icon="▧"><UploadBox title="Foto do funcionário" description="Insira uma imagem JPG, PNG ou GIF de até 5 MB." /></Section>
    if (activeTab === 'Contatos') return <Section title="Contatos" icon="☎"><div className="record-grid record-grid-3"><Field label="Telefone" value={String(values.telefone_comercial)} onChange={(value) => setValue('telefone_comercial', value)} /><Field label="Celular" value={String(values.telefone_celular)} onChange={(value) => setValue('telefone_celular', value)} /><Field label="Contato de emergência" value={String(values.contato_emergencia ?? '')} onChange={(value) => setValue('contato_emergencia', value)} /></div></Section>
    if (activeTab === 'Endereço') return sharedAddress
    return <Section title="Anexos" icon="▤"><UploadBox title="Documentos do funcionário" description="Anexe contratos, documentos e comprovantes." /></Section>
  }

  function renderProductForm() {
    if (activeTab === 'Dados') return <><Section title="Dados" icon="◆"><div className="record-grid record-grid-4"><Field label="Nome" value={String(values.nome)} onChange={(value) => setValue('nome', value)} required /><Field label="Código interno" value={String(values.codigo_interno)} onChange={(value) => setValue('codigo_interno', value)} required /><Field label="Código de barra" value={String(values.codigo_barra)} onChange={(value) => setValue('codigo_barra', value)} /><Field label="Grupo do produto" value={String(values.grupo_produto)} onChange={(value) => setValue('grupo_produto', value)} placeholder="Digite para buscar" /><Field label="Movimenta estoque?" value={String(values.movimenta_estoque)} onChange={(value) => setValue('movimenta_estoque', value)} options={['Sim', 'Não']} /><Field label="Habilitar nota fiscal?" value={String(values.habilitar_fiscal)} onChange={(value) => setValue('habilitar_fiscal', value)} options={['Sim', 'Não']} /><Field label="Possui variações?" value={String(values.possui_variacoes)} onChange={(value) => setValue('possui_variacoes', value)} options={['Sim', 'Não']} /><Field label="Possui composição?" value={String(values.possui_composicao)} onChange={(value) => setValue('possui_composicao', value)} options={['Sim', 'Não']} /></div></Section><Section title="Conversão de unidade" icon="↔"><div className="record-info">A conversão de unidades permite comprar em uma unidade de medida e vender em outra.</div><div className="conversion-row"><strong>1</strong><Field label="Entrada" value={String(values.unidade_entrada)} onChange={(value) => setValue('unidade_entrada', value)} /><span>equivale a</span><Field label="Fator" value={String(values.fator_conversao)} onChange={(value) => setValue('fator_conversao', value)} /><Field label="Saída" value={String(values.unidade_saida)} onChange={(value) => setValue('unidade_saida', value)} /></div></Section></>
    if (activeTab === 'Detalhes') return <Section title="Detalhes" icon="✎"><Field label="Descrição detalhada" value={String(values.detalhes)} onChange={(value) => setValue('detalhes', value)} type="textarea" /></Section>
    if (activeTab === 'Valores') return <Section title="Valores" icon="▣"><div className="record-grid record-grid-4"><Field label="Custo" value={String(values.custo)} onChange={(value) => setValue('custo', value)} /><Field label="Preço de venda" value={String(values.preco_venda)} onChange={(value) => setValue('preco_venda', value)} required /><Field label="Margem (%)" value={String(values.margem ?? '')} onChange={(value) => setValue('margem', value)} /><Field label="Preço promocional" value={String(values.preco_promocional ?? '')} onChange={(value) => setValue('preco_promocional', value)} /></div></Section>
    if (activeTab === 'Estoque') return <Section title="Estoque" icon="▥"><div className="record-grid record-grid-4"><Field label="Estoque atual" value={String(values.estoque_atual)} onChange={(value) => setValue('estoque_atual', value)} /><Field label="Estoque mínimo" value={String(values.estoque_minimo)} onChange={(value) => setValue('estoque_minimo', value)} /><Field label="Localização" value={String(values.localizacao ?? '')} onChange={(value) => setValue('localizacao', value)} /><Field label="Lote" value={String(values.lote ?? '')} onChange={(value) => setValue('lote', value)} /></div></Section>
    if (activeTab === 'Fotos') return <Section title="Fotos" icon="▧"><UploadBox title="Fotos do produto" description="Adicione imagens para catálogos, vendas e loja virtual." /></Section>
    if (activeTab === 'Fiscal') return <Section title="Fiscal" icon="⌘"><div className="record-grid record-grid-4"><Field label="NCM" value={String(values.ncm)} onChange={(value) => setValue('ncm', value)} /><Field label="CFOP" value={String(values.cfop)} onChange={(value) => setValue('cfop', value)} /><Field label="Alíquota" value={String(values.aliquota)} onChange={(value) => setValue('aliquota', value)} /><Field label="Origem" value={String(values.origem ?? '')} onChange={(value) => setValue('origem', value)} /></div></Section>
    if (activeTab === 'Composição') return <Section title="Composição" icon="◆"><p className="section-helper">Cadastre matérias-primas e itens que compõem este produto.</p><LineItemsTable title="Itens da composição" kind="produto" items={productItems} setItems={setProductItems} /></Section>
    return <Section title="Fornecedores" icon="▣"><div className="record-grid record-grid-2"><Field label="Fornecedor principal" value={String(values.fornecedor)} onChange={(value) => setValue('fornecedor', value)} placeholder="Digite para buscar" /><Field label="Código no fornecedor" value={String(values.codigo_fornecedor ?? '')} onChange={(value) => setValue('codigo_fornecedor', value)} /></div></Section>
  }

  function renderServiceForm() {
    if (activeTab === 'Dados') return <Section title="Dados" icon="⚒"><div className="record-grid record-grid-4"><Field label="Nome" value={String(values.nome)} onChange={(value) => setValue('nome', value)} required /><Field label="Código interno" value={String(values.codigo_interno)} onChange={(value) => setValue('codigo_interno', value)} required /><Field label="Grupo do serviço" value={String(values.grupo_produto)} onChange={(value) => setValue('grupo_produto', value)} placeholder="Digite para buscar" /><Field label="Situação" value={String(values.situacao)} onChange={(value) => setValue('situacao', value)} options={['Ativo', 'Inativo']} /></div></Section>
    if (activeTab === 'Detalhes') return <Section title="Detalhes" icon="✎"><Field label="Descrição do serviço" value={String(values.detalhes)} onChange={(value) => setValue('detalhes', value)} type="textarea" /></Section>
    if (activeTab === 'Valores') return <Section title="Valores" icon="▣"><div className="record-grid record-grid-4"><Field label="Preço de venda" value={String(values.preco_venda)} onChange={(value) => setValue('preco_venda', value)} required /><Field label="Custo estimado" value={String(values.custo)} onChange={(value) => setValue('custo', value)} /><Field label="Duração" value={String(values.duracao)} onChange={(value) => setValue('duracao', value)} placeholder="Ex.: 60 minutos" /><Field label="Unidade" value={String(values.unidade_saida)} onChange={(value) => setValue('unidade_saida', value)} /></div></Section>
    if (activeTab === 'Fiscal') return <Section title="Fiscal" icon="⌘"><div className="record-grid record-grid-3"><Field label="Código do serviço" value={String(values.codigo_servico ?? '')} onChange={(value) => setValue('codigo_servico', value)} /><Field label="Alíquota ISS" value={String(values.aliquota)} onChange={(value) => setValue('aliquota', value)} /><Field label="Item da lista de serviços" value={String(values.item_lista ?? '')} onChange={(value) => setValue('item_lista', value)} /></div></Section>
    return <Section title="Comissionamento" icon="%"><div className="record-grid record-grid-2"><Field label="Comissão (%)" value={String(values.comissao)} onChange={(value) => setValue('comissao', value)} /><Field label="Profissional padrão" value={String(values.responsavel)} onChange={(value) => setValue('responsavel', value)} placeholder="Digite para buscar" /></div></Section>
  }

  function renderCommercialForm(mode: 'orcamento' | 'venda') {
    return <><Section title="Dados gerais" icon="✎"><div className="record-grid record-grid-4"><Field label="Número" value={String(values.numero_registro)} onChange={(value) => setValue('numero_registro', value)} readOnly /><Field label="Cliente" value={String(values.cliente)} onChange={(value) => setValue('cliente', value)} required placeholder="Digite para buscar" /><Field label="Vendedor / Responsável" value={String(values.vendedor)} onChange={(value) => setValue('vendedor', value)} /><Field label={mode === 'venda' ? 'Situação' : 'Validade'} value={String(mode === 'venda' ? values.situacao : values.validade)} onChange={(value) => setValue(mode === 'venda' ? 'situacao' : 'validade', value)} required={mode === 'venda'} options={mode === 'venda' ? ['Concretizada', 'Em aberto', 'Cancelada'] : undefined} placeholder={mode === 'orcamento' ? 'Ex.: 10 dias' : ''} /><Field label="Data" value={String(values.data)} onChange={(value) => setValue('data', value)} required /><Field label="Prazo de entrega" value={String(values.prazo_entrega)} onChange={(value) => setValue('prazo_entrega', value)} /><Field label="Canal de venda" value={String(values.canal_venda)} onChange={(value) => setValue('canal_venda', value)} options={['Presencial', 'Online', 'WhatsApp', 'Telefone', 'Outro']} /><Field label="Centro de custo" value={String(values.centro_custo)} onChange={(value) => setValue('centro_custo', value)} placeholder="Digite para buscar" />{mode === 'orcamento' && <><Field label="Aos cuidados de" value={String(values.aos_cuidados)} onChange={(value) => setValue('aos_cuidados', value)} /><Field className="span-3" label="Introdução" value={String(values.introducao)} onChange={(value) => setValue('introducao', value)} type="textarea" /></>}</div></Section><LineItemsTable title="Produtos" kind="produto" items={productItems} setItems={setProductItems} /><LineItemsTable title="Serviços" kind="servico" items={serviceItems} setItems={setServiceItems} /><Section title="Transporte" icon="▰"><div className="record-grid record-grid-2"><Field label="Valor do frete" value={String(values.valor_frete)} onChange={(value) => setValue('valor_frete', value)} /><Field label="Transportadora" value={String(values.transportadora)} onChange={(value) => setValue('transportadora', value)} placeholder="Digite para buscar" /></div></Section><Section title="Endereço de entrega" icon="●"><CheckField label="Informar endereço de entrega" checked={Boolean(values.endereco_entrega)} onChange={(value) => setValue('endereco_entrega', value)} /></Section><Section title="Total" icon="▣"><CheckField label="Exibir valor total na impressão" checked={Boolean(values.exibir_total)} onChange={(value) => setValue('exibir_total', value)} /><div className="totals-grid"><span>Produtos<strong>{formatMoney(productTotal)}</strong></span><span>Serviços<strong>{formatMoney(serviceTotal)}</strong></span><span>Frete<strong>{formatMoney(normalizeMoney(String(values.valor_frete)))}</strong></span><span>Valor total<strong>{formatMoney(grandTotal)}</strong></span></div></Section><Section title="Pagamento" icon="▣"><CheckField label="Gerar condições de pagamento" checked={Boolean(values.gerar_pagamento)} onChange={(value) => setValue('gerar_pagamento', value)} /><div className="payment-choice"><button type="button">À vista</button><button type="button">Parcelado</button></div></Section><Section title="Anexos" icon="▤"><UploadBox title="Comprovantes e documentos" description="Tamanho máximo de 5 MB por arquivo." /></Section><Section title="Observações" icon="✎"><Field label="Esta observação será impressa no pedido" value={String(values.observacoes_impressao)} onChange={(value) => setValue('observacoes_impressao', value)} type="textarea" /></Section><Section title="Observações internas" icon="✎"><Field label="Uso interno; não será impresso" value={String(values.observacoes_internas)} onChange={(value) => setValue('observacoes_internas', value)} type="textarea" /></Section></>
  }

  function renderPurchaseForm() {
    return <><Section title="Dados gerais" icon="✎"><div className="record-grid record-grid-4"><Field label="Número" value={String(values.numero_registro)} onChange={(value) => setValue('numero_registro', value)} readOnly /><Field className="span-2" label="Fornecedor" value={String(values.fornecedor)} onChange={(value) => setValue('fornecedor', value)} required placeholder="Digite para buscar" /><Field label="Data de emissão" value={String(values.data_emissao)} onChange={(value) => setValue('data_emissao', value)} required /><Field label="Situação" value={String(values.situacao)} onChange={(value) => setValue('situacao', value)} options={['Confirmada', 'Em aberto', 'Cancelada']} /><Field label="Centro de custo" value={String(values.centro_custo)} onChange={(value) => setValue('centro_custo', value)} placeholder="Digite para buscar" /><Field label="Número da NF-e" value={String(values.numero_nfe)} onChange={(value) => setValue('numero_nfe', value)} /></div></Section><LineItemsTable title="Produtos" kind="produto" items={productItems} setItems={setProductItems} /><Section title="Total" icon="▣"><div className="totals-grid"><span>Produtos<strong>{formatMoney(productTotal)}</strong></span><span>Desconto<strong>{formatMoney(normalizeMoney(String(values.desconto_geral)))}</strong></span><span>Frete<strong>{formatMoney(normalizeMoney(String(values.valor_frete)))}</strong></span><span>Valor total<strong>{formatMoney(grandTotal)}</strong></span></div></Section><Section title="Pagamento" icon="▣"><div className="record-grid record-grid-3"><Field label="Forma de pagamento" value={String(values.forma_pagamento)} onChange={(value) => setValue('forma_pagamento', value)} /><Field label="Vencimento" value={String(values.vencimento)} onChange={(value) => setValue('vencimento', value)} type="date" /><Field label="Conta bancária" value={String(values.conta_bancaria)} onChange={(value) => setValue('conta_bancaria', value)} /></div></Section><Section title="Anexos" icon="▤"><UploadBox title="Documentos da compra" description="Anexe nota fiscal, pedido e comprovantes." /></Section><Section title="Observações" icon="✎"><Field label="Observações" value={String(values.observacoes)} onChange={(value) => setValue('observacoes', value)} type="textarea" /></Section></>
  }

  function renderPayableForm() {
    if (activeTab === 'Lançamento financeiro') return <div className="financial-form-grid"><Section title="Dados gerais" icon="✎"><div className="record-grid record-grid-2"><Field label="Descrição do pagamento" value={String(values.descricao_pagamento)} onChange={(value) => setValue('descricao_pagamento', value)} required /><Field label="Vencimento" value={String(values.vencimento)} onChange={(value) => setValue('vencimento', value)} type="date" required /><Field label="Plano de contas" value={String(values.plano_contas)} onChange={(value) => setValue('plano_contas', value)} required placeholder="Digite para buscar" /><Field label="Centro de custo" value={String(values.centro_custo)} onChange={(value) => setValue('centro_custo', value)} placeholder="Digite para buscar" /><Field label="Forma de pagamento" value={String(values.forma_pagamento)} onChange={(value) => setValue('forma_pagamento', value)} required placeholder="Digite para buscar" /><Field label="Conta bancária" value={String(values.conta_bancaria)} onChange={(value) => setValue('conta_bancaria', value)} required placeholder="Digite para buscar" /><Field label="Pagamento quitado" value={String(values.pagamento_quitado)} onChange={(value) => setValue('pagamento_quitado', value)} options={['Não', 'Sim']} /><Field label="Data de compensação" value={String(values.data_compensacao)} onChange={(value) => setValue('data_compensacao', value)} type="date" /></div></Section><Section title="Valores" icon="▣"><div className="record-grid"><Field label="Valor bruto" value={String(values.valor_bruto)} onChange={(value) => setValue('valor_bruto', value)} required /><Field label="Juros" value={String(values.juros)} onChange={(value) => setValue('juros', value)} /><Field label="Desconto" value={String(values.desconto_geral)} onChange={(value) => setValue('desconto_geral', value)} /><CheckField label="Ativar parcelamento/recorrência" checked={Boolean(values.recorrencia)} onChange={(value) => setValue('recorrencia', value)} /><div className="financial-total">Total: <strong>{formatMoney(grandTotal)}</strong></div></div></Section></div>
    if (activeTab === 'Outras informações') return <Section title="Outras informações" icon="✎"><div className="record-grid record-grid-2"><Field label="Fornecedor / Favorecido" value={String(values.fornecedor)} onChange={(value) => setValue('fornecedor', value)} /><Field label="Documento" value={String(values.documento)} onChange={(value) => setValue('documento', value)} /><Field className="span-2" label="Observações" value={String(values.observacoes)} onChange={(value) => setValue('observacoes', value)} type="textarea" /></div></Section>
    return <Section title="Anexos" icon="▤"><UploadBox title="Comprovantes e documentos" description="Anexe boletos, comprovantes e documentos relacionados ao pagamento." /></Section>
  }

  function renderContractForm() {
    return <><Section title="Dados gerais" icon="✎"><div className="record-grid record-grid-4"><Field label="Número" value={String(values.numero_registro)} onChange={(value) => setValue('numero_registro', value)} readOnly /><Field label="Cliente" value={String(values.cliente)} onChange={(value) => setValue('cliente', value)} required placeholder="Digite para buscar" /><Field label="Período inicial" value={String(values.periodo_inicio)} onChange={(value) => setValue('periodo_inicio', value)} type="date" required /><Field label="Período final" value={String(values.periodo_fim)} onChange={(value) => setValue('periodo_fim', value)} type="date" required /><Field label="Vendedor" value={String(values.vendedor)} onChange={(value) => setValue('vendedor', value)} /><Field label="Canal de venda" value={String(values.canal_venda)} onChange={(value) => setValue('canal_venda', value)} options={['Presencial', 'Online', 'WhatsApp', 'Telefone']} /><Field label="Situação" value={String(values.status_contrato)} onChange={(value) => setValue('status_contrato', value)} options={['Confirmado', 'Em elaboração', 'Encerrado', 'Cancelado']} /><Field label="Centro de custo" value={String(values.centro_custo)} onChange={(value) => setValue('centro_custo', value)} /></div></Section><LineItemsTable title="Serviços" kind="servico" items={serviceItems} setItems={setServiceItems} /><Section title="Pagamento" icon="▣"><div className="record-grid record-grid-3"><Field label="Periodicidade" value={String(values.periodicidade ?? '')} onChange={(value) => setValue('periodicidade', value)} options={['Única', 'Mensal', 'Trimestral', 'Semestral', 'Anual']} /><Field label="Forma de pagamento" value={String(values.forma_pagamento)} onChange={(value) => setValue('forma_pagamento', value)} /><Field label="Primeiro vencimento" value={String(values.vencimento)} onChange={(value) => setValue('vencimento', value)} type="date" /></div><div className="financial-total">Valor total: <strong>{formatMoney(grandTotal)}</strong></div></Section><Section title="Anexos" icon="▤"><UploadBox title="Arquivos do contrato" description="Anexe o contrato assinado e documentos relacionados." /></Section><Section title="Observações" icon="✎"><Field label="Observações" value={String(values.observacoes)} onChange={(value) => setValue('observacoes', value)} type="textarea" /></Section></>
  }

  function renderGenericForm() {
    return <>{activeTab === 'Dados gerais' ? <Section title="Dados gerais" icon="✎"><div className="record-grid record-grid-3"><Field className="span-2" label="Nome / descrição" value={String(values.nome)} onChange={(value) => setValue('nome', value)} required /><Field label="Situação" value={String(values.situacao)} onChange={(value) => setValue('situacao', value)} options={['Ativo', 'Inativo', 'Em aberto', 'Concluído']} /><Field className="span-3" label="Detalhes" value={String(values.detalhes)} onChange={(value) => setValue('detalhes', value)} type="textarea" /></div></Section> : <Section title="Observações" icon="✎"><Field label="Observações" value={String(values.observacoes)} onChange={(value) => setValue('observacoes', value)} type="textarea" /></Section>}</>
  }

  function renderContent() {
    if (kind === 'cliente' || kind === 'fornecedor' || kind === 'transportadora') return renderPersonForm(kind)
    if (kind === 'funcionario') return renderEmployeeForm()
    if (kind === 'produto') return renderProductForm()
    if (kind === 'servico') return renderServiceForm()
    if (kind === 'orcamento') return renderCommercialForm('orcamento')
    if (kind === 'venda') return renderCommercialForm('venda')
    if (kind === 'compra') return renderPurchaseForm()
    if (kind === 'conta-pagar') return renderPayableForm()
    if (kind === 'contrato') return renderContractForm()
    return renderGenericForm()
  }

  return (
    <form className="erp-record-form" onSubmit={save}>
      <div className="record-top-actions">
        <button className="record-back-button" onClick={() => navigate(basePageId)} type="button">← Voltar</button>
        <div><button className="record-cancel-button" onClick={() => navigate(basePageId)} type="button">Cancelar</button><button className="record-save-button" disabled={saving} type="submit">{saving ? 'Salvando...' : '✓ Salvar'}</button></div>
      </div>

      {formTabs[kind].length > 1 && (
        <div className="record-tabs">
          {formTabs[kind].map((tab) => <button className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => setActiveTab(tab)} type="button">{tab}</button>)}
        </div>
      )}

      {error && <div className="inline-record-error">{error}</div>}
      {success && <div className="inline-record-success">{success}</div>}
      {renderContent()}

      <div className="record-bottom-actions">
        <button className="record-cancel-button" onClick={() => navigate(basePageId)} type="button">Cancelar</button>
        <button className="record-save-button" disabled={saving} type="submit">{saving ? 'Salvando...' : '✓ Salvar registro'}</button>
      </div>
    </form>
  )
}

export function OperationalModule(props: OperationalModuleProps) {
  const formRoute = formRoutes[props.pageId]
  if (formRoute) {
    return <RecordFormPage kind={formRoute.kind} basePageId={formRoute.basePageId} companyId={props.companyId} session={props.session} userName={props.userName} navigate={props.navigate} onDataChanged={props.onDataChanged} />
  }

  if (props.pageId.endsWith('-adicionar')) {
    const basePageId = props.pageId.replace(/-adicionar$/, '')
    return <RecordFormPage kind="generico" basePageId={basePageId} companyId={props.companyId} session={props.session} userName={props.userName} navigate={props.navigate} onDataChanged={props.onDataChanged} />
  }

  const definition = operationalDefinitions[props.pageId] ?? getFallbackDefinition(props.pageId)
  return <StandardListPage definition={definition} companyId={props.companyId} navigate={props.navigate} />
}
