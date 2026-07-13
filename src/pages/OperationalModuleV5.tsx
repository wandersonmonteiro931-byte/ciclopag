import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getModuleDefinition, parseOperationalPage, type FieldSpec, type ModuleDefinition, type RepeatableSpec, type SectionSpec } from '../data/erpCatalog'
import type { AccessControl } from '../lib/permissions'
import { supabase } from '../lib/supabase'

type Navigate = (pageId: string) => void

type Props = {
  pageId: string
  companyId: string
  session: Session
  userName: string
  access: AccessControl
  navigate: Navigate
  onDataChanged: () => Promise<void>
}

type RecordRow = {
  id: string
  numero: number | null
  titulo: string
  status: string
  valor_total: number | string | null
  dados: Record<string, unknown> | null
  criado_em: string
  updated_at?: string
}

type ClientRow = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  status: string
  dados: Record<string, unknown> | null
  criado_em: string
  updated_at?: string
}

type FormValues = Record<string, string | boolean>
type RepeatableValues = Record<string, Array<Record<string, string>>>

type Attachment = {
  name: string
  path: string
  size: number
  type: string
}

type GroupOption = { id: string; nome: string }

const MAX_FILE_SIZE = 5 * 1024 * 1024

function friendlyError(message: string) {
  const value = message.toLowerCase()
  if (value.includes('registros_erp') || value.includes('grupos_usuarios') || value.includes('convites_acesso') || value.includes('does not exist')) return 'Execute o arquivo PASSO_5_SUPABASE_PERMISSOES_COMPLETO.sql no Supabase e tente novamente.'
  if (value.includes('row-level security') || value.includes('permission denied')) return 'Seu grupo de acesso não possui permissão para concluir esta ação.'
  if (value.includes('duplicate key')) return 'Já existe um registro com estes dados.'
  return message
}

function normalizeMoney(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || !value) return 0
  return Number(value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0
}

function formatMoney(value: unknown) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(normalizeMoney(value))
}

function statusForClient(value: string) {
  const normalized = value.toLowerCase()
  if (normalized.includes('inativo')) return 'inativo'
  if (normalized.includes('bloque')) return 'bloqueado'
  return 'ativo'
}

function displayClientStatus(value: string) {
  if (value === 'inativo') return 'Inativo'
  if (value === 'bloqueado') return 'Bloqueado'
  return 'Ativo'
}

function flattenFields(definition: ModuleDefinition) {
  return definition.tabs.flatMap((tab) => tab.sections.flatMap((section) => section.fields ?? []))
}

function flattenRepeatables(definition: ModuleDefinition) {
  return definition.tabs.flatMap((tab) => tab.sections.flatMap((section) => section.repeatables ?? []))
}

function initialValues(definition: ModuleDefinition): FormValues {
  const result: FormValues = {}
  for (const field of flattenFields(definition)) {
    result[field.key] = field.defaultValue ?? (field.type === 'checkbox' ? false : '')
  }
  return result
}

function emptyRepeatableRow(spec: RepeatableSpec) {
  return Object.fromEntries(spec.columns.map((column) => [column.key, column.key === 'quantidade' ? '1' : column.key === 'unidade' ? 'UN' : '']))
}

function initialRepeatables(definition: ModuleDefinition): RepeatableValues {
  const result: RepeatableValues = {}
  for (const spec of flattenRepeatables(definition)) {
    result[spec.key] = Array.from({ length: spec.minimumRows ?? 0 }, () => ({ id: crypto.randomUUID(), ...emptyRepeatableRow(spec) }))
  }
  return result
}

function recordTitle(definition: ModuleDefinition, values: FormValues) {
  const candidate = String(values[definition.primaryField] ?? '').trim()
  if (candidate) return candidate
  const number = String(values.numero ?? '').trim()
  return number && number !== 'Automático' ? `${definition.singular} ${number}` : `${definition.singular} sem identificação`
}

function calculateTotal(definition: ModuleDefinition, values: FormValues, repeatables: RepeatableValues) {
  if (definition.totalField && normalizeMoney(values[definition.totalField]) > 0) return normalizeMoney(values[definition.totalField])
  let total = 0
  for (const spec of flattenRepeatables(definition).filter((item) => item.calculateSubtotal)) {
    for (const row of repeatables[spec.key] ?? []) {
      const quantity = normalizeMoney(row.quantidade || '1') || 1
      total += Math.max(0, quantity * normalizeMoney(row.valor) - normalizeMoney(row.desconto))
    }
  }
  total += normalizeMoney(values.frete)
  total += normalizeMoney(values.acrescimo)
  total -= normalizeMoney(values.desconto_reais)
  const percent = normalizeMoney(values.desconto_percentual)
  if (percent > 0) total -= total * percent / 100
  return Math.max(0, total)
}

function relationData(row: RecordRow | ClientRow) {
  return row.dados && typeof row.dados === 'object' ? row.dados : {}
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (!rows.length) return
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))))
  const csv = [headers.map(csvEscape).join(';'), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(';'))].join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function StandardListPage({ definition, companyId, access, navigate }: { definition: ModuleDefinition; companyId: string; access: AccessControl; navigate: Navigate }) {
  const client = supabase
  const [rows, setRows] = useState<Array<RecordRow | ClientRow>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [moreOpen, setMoreOpen] = useState(false)

  async function load() {
    if (!client || !access.can(definition.id, 'visualizar')) return
    setLoading(true); setError('')
    if (definition.id === 'clientes') {
      const result = await client.from('clientes').select('id,nome,email,telefone,status,dados,criado_em,updated_at').eq('empresa_id', companyId).order('criado_em', { ascending: false })
      if (result.error) setError(friendlyError(result.error.message)); else setRows((result.data ?? []) as ClientRow[])
    } else {
      const result = await client.from('registros_erp').select('id,numero,titulo,status,valor_total,dados,criado_em,updated_at').eq('empresa_id', companyId).eq('modulo', definition.id).order('criado_em', { ascending: false })
      if (result.error) setError(friendlyError(result.error.message)); else setRows((result.data ?? []) as RecordRow[])
    }
    setLoading(false)
  }

  useEffect(() => { void load() }, [definition.id, companyId])

  const filtered = useMemo(() => rows.filter((row) => {
    const data = relationData(row)
    const title = 'nome' in row ? row.nome : row.titulo
    const text = `${title} ${JSON.stringify(data)}`.toLowerCase()
    const rowStatus = 'nome' in row ? displayClientStatus(row.status) : row.status
    const created = new Date(row.criado_em).toISOString().slice(0, 10)
    return (!search || text.includes(search.toLowerCase())) && (!status || rowStatus === status) && (!startDate || created >= startDate) && (!endDate || created <= endDate)
  }), [rows, search, status, startDate, endDate])

  async function removeOne(row: RecordRow | ClientRow) {
    if (!client || !access.can(definition.id, 'excluir')) return
    const title = 'nome' in row ? row.nome : row.titulo
    if (!window.confirm(`Excluir “${title}”? Esta ação não poderá ser desfeita.`)) return
    const table = definition.id === 'clientes' ? 'clientes' : 'registros_erp'
    const result = await client.from(table).delete().eq('id', row.id)
    if (result.error) setError(friendlyError(result.error.message)); else void load()
  }

  async function bulkDelete() {
    if (!client || !selected.length || !access.can(definition.id, 'excluir')) return
    if (!window.confirm(`Excluir ${selected.length} registro(s) selecionado(s)?`)) return
    const table = definition.id === 'clientes' ? 'clientes' : 'registros_erp'
    const result = await client.from(table).delete().in('id', selected)
    if (result.error) setError(friendlyError(result.error.message)); else { setSelected([]); void load() }
  }

  async function copyRow(row: RecordRow | ClientRow) {
    if (!client || !access.can(definition.id, 'cadastrar')) return
    if ('nome' in row) {
      const data = relationData(row) as Record<string, unknown>
      const result = await client.from('clientes').insert({ empresa_id: companyId, nome: `${row.nome} - Cópia`, email: row.email, telefone: row.telefone, status: row.status, tipo: String(data.tipo_pessoa ?? 'Pessoa física'), documento: String(data.cpf_cnpj ?? ''), dados: { ...data, nome: `${row.nome} - Cópia` } })
      if (result.error) setError(friendlyError(result.error.message)); else void load()
    } else {
      const result = await client.from('registros_erp').insert({ empresa_id: companyId, modulo: definition.id, tipo: definition.singular, titulo: `${row.titulo} - Cópia`, status: row.status, valor_total: row.valor_total, dados: relationData(row) })
      if (result.error) setError(friendlyError(result.error.message)); else void load()
    }
  }

  const statusOptions = Array.from(new Set(rows.map((row) => 'nome' in row ? displayClientStatus(row.status) : row.status))).filter(Boolean)
  const allSelected = filtered.length > 0 && filtered.every((row) => selected.includes(row.id))

  function exportRows() {
    downloadCsv(`${definition.id}-${new Date().toISOString().slice(0, 10)}.csv`, filtered.map((row) => {
      const data = relationData(row)
      return { id: row.id, numero: 'numero' in row ? row.numero : '', titulo: 'nome' in row ? row.nome : row.titulo, status: 'nome' in row ? displayClientStatus(row.status) : row.status, valor_total: 'valor_total' in row ? row.valor_total : '', criado_em: row.criado_em, ...data }
    }))
  }

  return (
    <section className="standard-module-page v5-list-page">
      <div className="module-toolbar">
        <div className="module-toolbar-left">
          <button className="toolbar-add" disabled={!access.can(definition.id, 'cadastrar')} onClick={() => navigate(`${definition.id}-adicionar`)} type="button">⊕ Adicionar</button>
          <div className="toolbar-more-wrap"><button className="toolbar-more" onClick={() => setMoreOpen((value) => !value)} type="button">⚙ Mais ações⌄</button>{moreOpen && <div className="toolbar-more-menu"><button onClick={exportRows} type="button">Exportar planilha</button><button onClick={() => window.print()} type="button">Imprimir listagem</button><button disabled={!selected.length || !access.can(definition.id, 'excluir')} onClick={() => void bulkDelete()} type="button">Excluir selecionados</button></div>}</div>
          <button className="toolbar-view" title="Alterar visualização" type="button">▦</button>
        </div>
        <div className="module-search"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome" /><button aria-label="Buscar" type="button">⌕</button><button onClick={() => setAdvanced((value) => !value)} type="button">◉ Busca avançada</button></div>
      </div>
      {advanced && <div className="advanced-search-panel"><label>Situação<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todas</option>{statusOptions.map((option) => <option key={option}>{option}</option>)}</select></label><label>Data inicial<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label>Data final<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label><button onClick={() => { setStatus(''); setStartDate(''); setEndDate('') }} type="button">Limpar filtros</button></div>}
      {error && <div className="record-error">{error}</div>}
      {loading ? <div className="module-loading">Carregando...</div> : filtered.length === 0 ? <div className="module-empty-state"><div className="empty-state-icon">♟</div><div><h2>{definition.title}</h2><p>{definition.description}</p><div className="empty-actions"><button disabled={!access.can(definition.id, 'cadastrar')} onClick={() => navigate(`${definition.id}-adicionar`)} type="button">⊕ Adicionar meu primeiro {definition.singular}</button><button onClick={() => alert('Use Mais ações → Exportar/Importar. A importação será validada antes de gravar os registros.')} type="button">⬆ Importar registros</button></div><h3>Com este módulo você consegue:</h3><ul>{definition.benefits.map((benefit) => <li key={benefit}>● {benefit}</li>)}</ul></div></div> : <div className="records-table-wrap"><table className="records-table"><thead><tr><th className="select-column"><input type="checkbox" checked={allSelected} onChange={(event) => setSelected(event.target.checked ? filtered.map((row) => row.id) : [])} /></th><th>Número</th><th>Nome / identificação</th><th>Situação</th><th>Valor</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>{filtered.map((row) => {
        const title = 'nome' in row ? row.nome : row.titulo
        const rowStatus = 'nome' in row ? displayClientStatus(row.status) : row.status
        const value = 'valor_total' in row ? row.valor_total : null
        return <tr key={row.id}><td><input type="checkbox" checked={selected.includes(row.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} /></td><td>{'numero' in row ? row.numero ?? '—' : '—'}</td><td><strong>{title}</strong><small>{definition.singular}</small></td><td><span className={`record-status ${rowStatus.toLowerCase().replace(/\s+/g, '-')}`}>{rowStatus}</span></td><td>{value == null ? '—' : formatMoney(value)}</td><td>{new Date(row.criado_em).toLocaleDateString('pt-BR')}</td><td className="record-actions"><button className="action-view" title="Visualizar" onClick={() => navigate(`${definition.id}-visualizar:${row.id}`)} type="button">⌕</button><button className="action-edit" title="Editar" disabled={!access.can(definition.id, 'editar')} onClick={() => navigate(`${definition.id}-editar:${row.id}`)} type="button">✎</button><button className="action-copy" title="Copiar" disabled={!access.can(definition.id, 'cadastrar')} onClick={() => void copyRow(row)} type="button">⧉</button><button className="action-print" title="Imprimir" disabled={!access.can(definition.id, 'imprimir')} onClick={() => { navigate(`${definition.id}-visualizar:${row.id}`); setTimeout(() => window.print(), 350) }} type="button">▤</button><button className="action-delete" title="Excluir" disabled={!access.can(definition.id, 'excluir')} onClick={() => void removeOne(row)} type="button">×</button></td></tr>
      })}</tbody></table><p className="table-summary">Mostrando {filtered.length} de um total de {rows.length}</p></div>}
    </section>
  )
}

function FieldControl({ field, value, groups, readOnly, onChange }: { field: FieldSpec; value: string | boolean; groups: GroupOption[]; readOnly: boolean; onChange: (value: string | boolean) => void }) {
  const options = field.key === 'grupo_usuario_id' ? groups.map((group) => `${group.id}::${group.nome}`) : field.options ?? []
  const label = <span>{field.label}{field.required && <b>*</b>}{field.help && <i title={field.help}>●</i>}</span>
  if (field.type === 'checkbox') return <label className={`record-check-field ${field.width ?? ''}`}><input checked={Boolean(value)} disabled={readOnly} onChange={(event) => onChange(event.target.checked)} type="checkbox" /><span>{field.label}{field.required && <b>*</b>}</span>{field.help && <i title={field.help}>●</i>}</label>
  if (field.type === 'select') return <label className={`record-field ${field.width ?? ''}`}>{label}<select value={String(value ?? '')} disabled={readOnly} required={field.required} onChange={(event) => onChange(event.target.value)}><option value="">Selecione</option>{options.map((option) => { const [rawValue, display] = option.includes('::') ? option.split('::') : [option, option]; return <option key={rawValue} value={rawValue}>{display}</option> })}</select></label>
  if (field.type === 'textarea') return <label className={`record-field ${field.width ?? 'full'}`}>{label}<textarea value={String(value ?? '')} readOnly={readOnly} required={field.required} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>
  return <label className={`record-field ${field.width ?? ''}`}>{label}<input value={String(value ?? '')} readOnly={readOnly} required={field.required} type={field.type === 'money' ? 'text' : field.type ?? 'text'} inputMode={field.type === 'money' || field.type === 'number' ? 'decimal' : undefined} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} /></label>
}

function RepeatableTable({ spec, rows, readOnly, onChange }: { spec: RepeatableSpec; rows: Array<Record<string, string>>; readOnly: boolean; onChange: (rows: Array<Record<string, string>>) => void }) {
  function update(index: number, key: string, value: string) { onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row)) }
  function add() { onChange([...rows, { id: crypto.randomUUID(), ...emptyRepeatableRow(spec) }]) }
  function remove(index: number) { if (rows.length <= (spec.minimumRows ?? 0)) return; onChange(rows.filter((_, rowIndex) => rowIndex !== index)) }
  return <div className="repeatable-block"><div className="line-items-wrap"><table className="line-items-table"><thead><tr>{spec.columns.map((column) => <th key={column.key}>{column.label}{column.required && '*'}</th>)}{spec.calculateSubtotal && <th>Subtotal</th>}<th>Ação</th></tr></thead><tbody>{rows.map((row, index) => {
    const subtotal = Math.max(0, (normalizeMoney(row.quantidade) || 1) * normalizeMoney(row.valor) - normalizeMoney(row.desconto))
    return <tr key={row.id ?? index}>{spec.columns.map((column) => <td key={column.key}>{column.options ? <select value={row[column.key] ?? ''} disabled={readOnly} required={column.required} onChange={(event) => update(index, column.key, event.target.value)}><option value="">Selecione</option>{column.options.map((option) => <option key={option}>{option}</option>)}</select> : <input value={row[column.key] ?? ''} readOnly={readOnly} required={column.required} type={column.type === 'date' ? 'date' : column.type === 'email' ? 'email' : 'text'} inputMode={column.type === 'money' || column.type === 'number' ? 'decimal' : undefined} placeholder={column.placeholder} onChange={(event) => update(index, column.key, event.target.value)} />}</td>)}{spec.calculateSubtotal && <td><input value={formatMoney(subtotal)} readOnly /></td>}<td><button className="remove-line-button" disabled={readOnly || rows.length <= (spec.minimumRows ?? 0)} onClick={() => remove(index)} type="button">×</button></td></tr>
  })}</tbody></table></div>{!readOnly && <button className="secondary-record-button" onClick={add} type="button">＋ {spec.addLabel}</button>}</div>
}

function RecordForm({ definition, mode, recordId, companyId, session, userName, access, navigate, onDataChanged }: { definition: ModuleDefinition; mode: 'create' | 'edit' | 'view'; recordId: string | null; companyId: string; session: Session; userName: string; access: AccessControl; navigate: Navigate; onDataChanged: () => Promise<void> }) {
  const client = supabase
  const [activeTab, setActiveTab] = useState(definition.tabs[0]?.id ?? '')
  const [values, setValues] = useState<FormValues>(() => initialValues(definition))
  const [repeatables, setRepeatables] = useState<RepeatableValues>(() => initialRepeatables(definition))
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(mode !== 'create')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [actionOpen, setActionOpen] = useState(false)
  const initialSnapshot = useRef('')
  const readOnly = mode === 'view'

  useEffect(() => {
    if (!client || definition.id !== 'funcionarios') return
    client.from('grupos_usuarios').select('id,nome').eq('empresa_id', companyId).eq('ativo', true).order('nome').then(({ data }) => setGroups((data ?? []) as GroupOption[]))
  }, [definition.id, companyId])

  useEffect(() => {
    if (!client || mode === 'create' || !recordId) { initialSnapshot.current = JSON.stringify({ values, repeatables }); return }
    setLoading(true)
    const query = definition.id === 'clientes' ? client.from('clientes').select('id,nome,email,telefone,status,dados').eq('id', recordId).single() : client.from('registros_erp').select('id,titulo,status,valor_total,dados').eq('id', recordId).single()
    query.then(({ data, error: queryError }) => {
      if (queryError) setError(friendlyError(queryError.message))
      else if (data) {
        const raw = (data.dados && typeof data.dados === 'object' ? data.dados : {}) as Record<string, unknown>
        const loadedValues = { ...initialValues(definition), ...((raw.values ?? raw) as FormValues) }
        if (definition.id === 'clientes') {
          loadedValues.nome = String((data as { nome: string }).nome ?? loadedValues.nome ?? '')
          loadedValues.email = String((data as { email: string | null }).email ?? loadedValues.email ?? '')
          loadedValues.telefone_celular = String((data as { telefone: string | null }).telefone ?? loadedValues.telefone_celular ?? '')
          loadedValues.situacao = displayClientStatus((data as { status: string }).status)
        }
        const loadedRepeatables = { ...initialRepeatables(definition), ...((raw.repeatables ?? {}) as RepeatableValues) }
        setValues(loadedValues); setRepeatables(loadedRepeatables); setAttachments((raw.attachments ?? []) as Attachment[])
        initialSnapshot.current = JSON.stringify({ values: loadedValues, repeatables: loadedRepeatables })
      }
      setLoading(false)
    })
  }, [definition.id, mode, recordId])

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!readOnly && initialSnapshot.current && initialSnapshot.current !== JSON.stringify({ values, repeatables })) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [values, repeatables, readOnly])

  function setField(key: string, value: string | boolean) { setValues((current) => ({ ...current, [key]: value })) }

  async function uploadFiles(recordUuid: string) {
    if (!client || pendingFiles.length === 0) return attachments
    const uploaded: Attachment[] = [...attachments]
    for (const file of pendingFiles) {
      if (file.size > MAX_FILE_SIZE) throw new Error(`O arquivo ${file.name} ultrapassa o limite de 5 MB.`)
      const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `${companyId}/${definition.id}/${recordUuid}/${Date.now()}-${safeName}`
      const result = await client.storage.from('erp-anexos').upload(path, file, { upsert: false })
      if (result.error) throw result.error
      uploaded.push({ name: file.name, path, size: file.size, type: file.type })
    }
    return uploaded
  }

  async function createEmployeeInvite(recordUuid: string) {
    if (!client || definition.id !== 'funcionarios' || !values.permitir_acesso) return
    const email = String(values.email ?? '').trim().toLowerCase()
    const groupId = String(values.grupo_usuario_id ?? '')
    if (!email || !groupId) throw new Error('Para permitir acesso, informe o e-mail e selecione o grupo de acesso.')
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const result = await client.from('convites_acesso').upsert({ empresa_id: companyId, funcionario_registro_id: recordUuid, nome: String(values.nome ?? ''), email, grupo_usuario_id: groupId, token, status: 'pendente', criado_por: session.user.id, expira_em: new Date(Date.now() + 7 * 86400000).toISOString() }, { onConflict: 'empresa_id,email' })
    if (result.error) throw result.error
    setInviteLink(`${window.location.origin}/app?convite=${token}`)
  }

  async function submit(event: FormEvent, continueEditing = false) {
    event.preventDefault()
    if (!client || readOnly) return
    if (mode === 'create' && !access.can(definition.id, 'cadastrar')) return
    if (mode === 'edit' && !access.can(definition.id, 'editar')) return
    setSaving(true); setError(''); setSuccess('')
    try {
      const recordUuid = recordId ?? crypto.randomUUID()
      const uploaded = await uploadFiles(recordUuid)
      const total = calculateTotal(definition, values, repeatables)
      const title = recordTitle(definition, values)
      const status = String(values[definition.statusField ?? 'situacao'] ?? 'Ativo') || 'Ativo'
      const data = { values, repeatables, attachments: uploaded, responsavel: userName, atualizado_em: new Date().toISOString() }
      if (definition.id === 'clientes') {
        const payload = { id: recordUuid, empresa_id: companyId, nome: title, email: String(values.email ?? '') || null, telefone: String(values.telefone_celular ?? values.telefone_comercial ?? '') || null, documento: String(values.cpf_cnpj ?? '') || null, data_nascimento: String(values.data_nascimento ?? '') || null, observacoes: String(values.observacoes ?? '') || null, status: statusForClient(status), tipo: String(values.tipo_pessoa ?? 'Pessoa física'), dados: data }
        const result = mode === 'edit' ? await client.from('clientes').update(payload).eq('id', recordUuid) : await client.from('clientes').insert(payload)
        if (result.error) throw result.error
      } else {
        const payload = { id: recordUuid, empresa_id: companyId, modulo: definition.id, tipo: definition.singular, titulo: title, status, valor_total: total, dados: data, criado_por: session.user.id }
        const result = mode === 'edit' ? await client.from('registros_erp').update(payload).eq('id', recordUuid) : await client.from('registros_erp').insert(payload)
        if (result.error) throw result.error
      }
      await createEmployeeInvite(recordUuid)
      setAttachments(uploaded); setPendingFiles([]); initialSnapshot.current = JSON.stringify({ values, repeatables })
      await onDataChanged()
      if (continueEditing) { setSuccess('Registro salvo com sucesso.'); if (mode === 'create') navigate(`${definition.id}-editar:${recordUuid}`) }
      else navigate(definition.id)
    } catch (caught) { setError(friendlyError(caught instanceof Error ? caught.message : 'Não foi possível salvar.')) }
    finally { setSaving(false) }
  }

  async function downloadAttachment(attachment: Attachment) {
    if (!client) return
    const result = await client.storage.from('erp-anexos').createSignedUrl(attachment.path, 60)
    if (result.error) setError(friendlyError(result.error.message)); else window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function runAction(action: string) {
    setActionOpen(false)
    if (!client) return
    if (action.includes('Imprimir')) { window.print(); return }
    const email = String(values.email ?? '')
    const phone = String(values.telefone_celular ?? values.celular ?? values.whatsapp ?? '').replace(/\D/g, '')
    if (action.includes('WhatsApp') && phone) { window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(`Olá! Seguem informações sobre ${recordTitle(definition, values)}.`)}`, '_blank', 'noopener,noreferrer'); return }
    if (action.includes('e-mail') && email) { window.location.href = `mailto:${email}?subject=${encodeURIComponent(recordTitle(definition, values))}`; return }
    if (!recordId) return
    const result = await client.from('acoes_erp').insert({ empresa_id: companyId, registro_id: recordId, modulo: definition.id, acao: action, detalhes: { titulo: recordTitle(definition, values) }, executado_por: session.user.id })
    if (result.error) setError(friendlyError(result.error.message)); else setSuccess(`Ação “${action}” registrada com sucesso.`)
  }

  if (loading) return <div className="module-loading">Carregando registro...</div>
  const total = calculateTotal(definition, values, repeatables)
  const currentTab = definition.tabs.find((tab) => tab.id === activeTab) ?? definition.tabs[0]

  return <form className="record-form v5-record-form" onSubmit={(event) => void submit(event)}>
    <div className="record-tabs">{definition.tabs.map((tab) => <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">{tab.label}</button>)}</div>
    {error && <div className="record-error">{error}</div>}{success && <div className="record-success">{success}</div>}
    {inviteLink && <div className="invite-success"><strong>Acesso preparado.</strong><p>Envie este link ao funcionário para ele criar a senha e entrar no grupo selecionado:</p><div><input value={inviteLink} readOnly /><button onClick={() => navigator.clipboard.writeText(inviteLink)} type="button">Copiar link</button></div></div>}
    {currentTab?.sections.map((section: SectionSpec) => {
      const visibleFields = (section.fields ?? []).filter((field) => !field.showWhen || values[field.showWhen.key] === field.showWhen.equals)
      const isFileSection = section.id === 'anexos' || section.id === 'foto' || section.id === 'fotos'
      return <section className="record-section" key={section.id}><header><span>{section.icon ?? '✎'}</span><h2>{section.title}</h2></header><div className="record-section-body">{section.description && <div className="section-information">{section.description}</div>}{visibleFields.length > 0 && <div className="form-grid">{visibleFields.map((field) => <FieldControl key={field.key} field={field} value={values[field.key] ?? ''} groups={groups} readOnly={readOnly} onChange={(value) => setField(field.key, value)} />)}</div>}{(section.repeatables ?? []).map((spec) => <RepeatableTable key={spec.key} spec={spec} rows={repeatables[spec.key] ?? []} readOnly={readOnly} onChange={(rows) => setRepeatables((current) => ({ ...current, [spec.key]: rows }))} />)}{isFileSection && <div className="attachment-manager"><label className="upload-box"><div><strong>Selecionar arquivos</strong><p>PNG, JPG, PDF, XML, planilhas ou documentos de até 5 MB.</p></div><input multiple disabled={readOnly} type="file" onChange={(event) => setPendingFiles(Array.from(event.target.files ?? []))} /></label>{pendingFiles.length > 0 && <ul>{pendingFiles.map((file) => <li key={`${file.name}-${file.size}`}>{file.name} — {(file.size / 1024).toFixed(1)} KB</li>)}</ul>}{attachments.length > 0 && <div className="saved-attachments">{attachments.map((attachment) => <button key={attachment.path} onClick={() => void downloadAttachment(attachment)} type="button">▤ {attachment.name}</button>)}</div>}</div>}</div></section>
    })}
    {definition.totalField && <section className="record-total-panel"><span>Total do registro</span><strong>{formatMoney(total)}</strong></section>}
    <div className="record-form-actions"><button className="record-cancel" onClick={() => navigate(definition.id)} type="button">{readOnly ? 'Voltar' : 'Cancelar'}</button>{readOnly ? <><button className="record-secondary-save" disabled={!access.can(definition.id, 'imprimir')} onClick={() => window.print()} type="button">Imprimir</button><button className="record-save" disabled={!access.can(definition.id, 'editar')} onClick={() => navigate(`${definition.id}-editar:${recordId}`)} type="button">Editar</button></> : <><button className="record-secondary-save" disabled={saving} onClick={(event) => void submit(event, true)} type="button">Salvar e continuar</button><button className="record-save" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar'}</button></>}
      {(readOnly || mode === 'edit') && <div className="record-actions-dropdown"><button className="record-more-actions" onClick={() => setActionOpen((value) => !value)} type="button">Mais ações⌄</button>{actionOpen && <div>{[...(definition.actions ?? []), ...(definition.integrationActions ?? [])].map((action) => <button key={action} onClick={() => void runAction(action)} type="button">{action}</button>)}</div>}</div>}
    </div>
  </form>
}

export function OperationalModuleV5(props: Props) {
  const route = parseOperationalPage(props.pageId)
  const definition = getModuleDefinition(route.moduleId)
  if (!definition) return <div className="module-empty-state"><div className="empty-state-icon">▦</div><div><h2>Módulo em configuração</h2><p>Este módulo ainda não possui definição operacional.</p></div></div>
  if (!props.access.can(definition.id, 'visualizar')) return <div className="permission-denied"><span>▣</span><h2>Acesso não permitido</h2><p>Seu grupo de usuários não possui permissão para visualizar {definition.title}.</p><button onClick={() => props.navigate('inicio')} type="button">Voltar ao início</button></div>
  if (route.mode === 'list') return <StandardListPage definition={definition} companyId={props.companyId} access={props.access} navigate={props.navigate} />
  return <RecordForm definition={definition} mode={route.mode} recordId={route.recordId} companyId={props.companyId} session={props.session} userName={props.userName} access={props.access} navigate={props.navigate} onDataChanged={props.onDataChanged} />
}
