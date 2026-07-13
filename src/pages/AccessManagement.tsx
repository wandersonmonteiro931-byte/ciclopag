import { Fragment, FormEvent, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { permissionModules, type PermissionAction } from '../data/erpCatalog'
import type { AccessControl } from '../lib/permissions'
import { supabase } from '../lib/supabase'

type Navigate = (pageId: string) => void

type Props = {
  pageId: string
  companyId: string
  session: Session
  access: AccessControl
  navigate: Navigate
}

type Group = {
  id: string
  nome: string
  descricao: string | null
  sistema: boolean
  ativo: boolean
  criado_em: string
}

type Permission = {
  id?: string
  grupo_id: string
  empresa_id: string
  modulo: string
  visualizar: boolean
  cadastrar: boolean
  editar: boolean
  excluir: boolean
  imprimir: boolean
  emitir: boolean
}

type Member = {
  id: string
  usuario_id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  grupo_usuario_id: string | null
  grupo_nome: string | null
}


type Invite = {
  id: string
  email: string
  nome: string
  status: string
  expira_em: string
  token: string
  grupos_usuarios: { nome: string } | Array<{ nome: string }> | null
}

const actions: Array<{ key: PermissionAction; label: string }> = [
  { key: 'visualizar', label: 'Visualizar' },
  { key: 'cadastrar', label: 'Cadastrar' },
  { key: 'editar', label: 'Editar' },
  { key: 'excluir', label: 'Excluir' },
  { key: 'imprimir', label: 'Imprimir' },
  { key: 'emitir', label: 'Emitir' },
]

function friendlyError(message: string) {
  const value = message.toLowerCase()
  if (value.includes('grupos_usuarios') || value.includes('grupo_permissoes') || value.includes('convites_acesso')) return 'Execute o arquivo PASSO_5_SUPABASE_PERMISSOES_COMPLETO.sql no Supabase.'
  if (value.includes('row-level security') || value.includes('permission')) return 'Seu usuário não possui permissão para esta ação.'
  return message
}

function inviteGroupName(value: Invite['grupos_usuarios']) {
  if (!value) return ''
  const row = Array.isArray(value) ? value[0] : value
  return row?.nome ?? ''
}

function PageToolbar({ children }: { children: React.ReactNode }) {
  return <div className="module-toolbar access-toolbar">{children}</div>
}

function GroupList({ companyId, navigate, access }: { companyId: string; navigate: Navigate; access: AccessControl }) {
  const client = supabase
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!client) return
    setLoading(true)
    const result = await client.from('grupos_usuarios').select('id,nome,descricao,sistema,ativo,criado_em').eq('empresa_id', companyId).order('sistema', { ascending: false }).order('nome')
    if (result.error) setError(friendlyError(result.error.message))
    else setGroups((result.data ?? []) as Group[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [companyId])

  const filtered = useMemo(() => groups.filter((group) => group.nome.toLowerCase().includes(search.toLowerCase())), [groups, search])

  async function remove(group: Group) {
    if (!client || group.sistema || !access.can('grupos-usuarios', 'excluir')) return
    if (!window.confirm(`Excluir o grupo “${group.nome}”?`)) return
    const result = await client.from('grupos_usuarios').delete().eq('id', group.id)
    if (result.error) setError(friendlyError(result.error.message)); else void load()
  }

  return (
    <section className="standard-module-page access-page">
      <PageToolbar>
        <div className="module-toolbar-left">
          <button className="toolbar-add" disabled={!access.can('grupos-usuarios', 'cadastrar')} onClick={() => navigate('grupos-usuarios-adicionar')} type="button">⊕ Adicionar</button>
          <button className="toolbar-users" onClick={() => navigate('usuarios')} type="button">♟ Usuários</button>
        </div>
        <div className="module-search compact"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar" /><button type="button">⌕</button></div>
      </PageToolbar>
      {error && <div className="record-error">{error}</div>}
      <div className="records-table-wrap access-table-wrap">
        <table className="records-table access-groups-table">
          <thead><tr><th>Grupo</th><th>Ações</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={2}>Carregando...</td></tr>}
            {!loading && filtered.map((group) => (
              <tr key={group.id}>
                <td><strong>{group.nome}</strong>{group.descricao && <small>{group.descricao}</small>}</td>
                <td className="record-actions">
                  <button className="action-lock" title="Permissões" onClick={() => navigate(`grupos-usuarios-permissoes:${group.id}`)} type="button">▣</button>
                  <button className="action-view" title="Visualizar" onClick={() => navigate(`grupos-usuarios-visualizar:${group.id}`)} type="button">⌕</button>
                  <button className="action-edit" title="Editar" disabled={!access.can('grupos-usuarios', 'editar')} onClick={() => navigate(`grupos-usuarios-editar:${group.id}`)} type="button">✎</button>
                  <button className="action-delete" title="Excluir" disabled={group.sistema || !access.can('grupos-usuarios', 'excluir')} onClick={() => void remove(group)} type="button">×</button>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && <tr><td colSpan={2}>Nenhum grupo encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="table-summary">Mostrando {filtered.length} de um total de {groups.length}</p>
    </section>
  )
}

function GroupForm({ companyId, groupId, readOnly, navigate, access }: { companyId: string; groupId?: string | null; readOnly?: boolean; navigate: Navigate; access: AccessControl }) {
  const client = supabase
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [active, setActive] = useState(true)
  const [system, setSystem] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!client || !groupId) return
    client.from('grupos_usuarios').select('nome,descricao,ativo,sistema').eq('id', groupId).single().then(({ data, error: queryError }) => {
      if (queryError) setError(friendlyError(queryError.message))
      else if (data) { setName(data.nome); setDescription(data.descricao ?? ''); setActive(data.ativo); setSystem(data.sistema) }
    })
  }, [groupId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client || readOnly) return
    if (groupId && !access.can('grupos-usuarios', 'editar')) return
    if (!groupId && !access.can('grupos-usuarios', 'cadastrar')) return
    setSaving(true); setError('')
    const payload = { empresa_id: companyId, nome: name.trim(), descricao: description.trim() || null, ativo: active }
    const result = groupId ? await client.from('grupos_usuarios').update(payload).eq('id', groupId) : await client.from('grupos_usuarios').insert(payload)
    setSaving(false)
    if (result.error) setError(friendlyError(result.error.message)); else navigate('grupos-usuarios')
  }

  return (
    <form className="record-form access-form" onSubmit={submit}>
      {error && <div className="record-error">{error}</div>}
      <section className="record-section"><header><span>♟</span><h2>Dados gerais</h2></header><div className="record-section-body form-grid">
        <label className="record-field"><span>Nome do grupo<b>*</b></span><input value={name} onChange={(event) => setName(event.target.value)} required readOnly={readOnly || system} /></label>
        <label className="record-field"><span>Situação</span><select value={active ? 'Ativo' : 'Inativo'} onChange={(event) => setActive(event.target.value === 'Ativo')} disabled={readOnly || system}><option>Ativo</option><option>Inativo</option></select></label>
        <label className="record-field full"><span>Descrição</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} readOnly={readOnly} /></label>
      </div></section>
      <div className="record-form-actions"><button className="record-cancel" onClick={() => navigate('grupos-usuarios')} type="button">Voltar</button>{!readOnly && <button className="record-save" disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar grupo'}</button>}</div>
    </form>
  )
}

function PermissionMatrix({ companyId, groupId, navigate, access }: { companyId: string; groupId: string; navigate: Navigate; access: AccessControl }) {
  const client = supabase
  const [group, setGroup] = useState<Group | null>(null)
  const [rows, setRows] = useState<Record<string, Permission>>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const canEdit = access.can('grupos-usuarios', 'editar')

  useEffect(() => {
    if (!client) return
    void Promise.all([
      client.from('grupos_usuarios').select('id,nome,descricao,sistema,ativo,criado_em').eq('id', groupId).single(),
      client.from('grupo_permissoes').select('*').eq('grupo_id', groupId),
    ]).then(([groupResult, permissionResult]) => {
      if (groupResult.error) setError(friendlyError(groupResult.error.message)); else setGroup(groupResult.data as Group)
      if (permissionResult.error) setError(friendlyError(permissionResult.error.message)); else {
        const map: Record<string, Permission> = {}
        for (const module of permissionModules) map[module.id] = { grupo_id: groupId, empresa_id: companyId, modulo: module.id, visualizar: false, cadastrar: false, editar: false, excluir: false, imprimir: false, emitir: false }
        for (const row of (permissionResult.data ?? []) as Permission[]) map[row.modulo] = row
        setRows(map)
      }
    })
  }, [companyId, groupId])

  function toggle(moduleId: string, action: PermissionAction, checked: boolean) {
    if (!canEdit) return
    setRows((current) => ({ ...current, [moduleId]: { ...current[moduleId], [action]: checked, ...(action !== 'visualizar' && checked ? { visualizar: true } : {}) } }))
  }

  function toggleSection(section: string, checked: boolean) {
    if (!canEdit) return
    setRows((current) => {
      const next = { ...current }
      for (const module of permissionModules.filter((item) => item.section === section)) {
        next[module.id] = { ...next[module.id], visualizar: checked, cadastrar: checked, editar: checked, excluir: checked, imprimir: checked, emitir: checked }
      }
      return next
    })
  }

  async function save() {
    if (!client || !canEdit) return
    setSaving(true); setError('')
    const result = await client.from('grupo_permissoes').upsert(Object.values(rows), { onConflict: 'grupo_id,modulo' })
    setSaving(false)
    if (result.error) setError(friendlyError(result.error.message)); else navigate('grupos-usuarios')
  }

  const sections = Array.from(new Set(permissionModules.map((module) => module.section)))
  return (
    <section className="permission-page">
      {error && <div className="record-error">{error}</div>}
      <div className="permission-heading"><div><span>▣</span><div><h2>Permissões do grupo</h2><p>{group?.nome ?? 'Carregando...'}</p></div></div><button onClick={() => navigate('grupos-usuarios')} type="button">Voltar</button></div>
      <div className="permission-matrix-wrap">
        <table className="permission-matrix"><thead><tr><th>Módulo</th>{actions.map((action) => <th key={action.key}>{action.label}</th>)}</tr></thead><tbody>
          {sections.map((section) => (
            <Fragment key={section}>
              <tr className="permission-section"><td colSpan={7}><label><input type="checkbox" disabled={!canEdit} onChange={(event) => toggleSection(section, event.target.checked)} /> <strong>{section}</strong></label></td></tr>
              {permissionModules.filter((module) => module.section === section).map((module) => (
                <tr key={module.id}><td>{module.title}</td>{actions.map((action) => <td key={action.key}><input type="checkbox" checked={Boolean(rows[module.id]?.[action.key])} disabled={!canEdit} onChange={(event) => toggle(module.id, action.key, event.target.checked)} /></td>)}</tr>
              ))}
            </Fragment>
          ))}
        </tbody></table>
      </div>
      <div className="record-form-actions"><button className="record-cancel" onClick={() => navigate('grupos-usuarios')} type="button">Cancelar</button><button className="record-save" disabled={!canEdit || saving} onClick={() => void save()} type="button">{saving ? 'Salvando...' : 'Salvar permissões'}</button></div>
    </section>
  )
}

function UsersList({ companyId, navigate, access }: { companyId: string; navigate: Navigate; access: AccessControl }) {
  const client = supabase
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function load() {
    if (!client) return
    const [memberResult, inviteResult, groupResult] = await Promise.all([
      client.rpc('listar_usuarios_empresa', { p_empresa_id: companyId }),
      client.from('convites_acesso').select('id,email,nome,status,expira_em,token,grupos_usuarios(nome)').eq('empresa_id', companyId).order('criado_em', { ascending: false }),
      client.from('grupos_usuarios').select('id,nome,descricao,sistema,ativo,criado_em').eq('empresa_id', companyId).eq('ativo', true).order('nome'),
    ])
    const firstError = memberResult.error || inviteResult.error || groupResult.error
    if (firstError) setError(friendlyError(firstError.message)); else {
      setMembers((memberResult.data ?? []) as unknown as Member[])
      setInvites((inviteResult.data ?? []) as unknown as Invite[])
      setGroups((groupResult.data ?? []) as Group[])
    }
  }
  useEffect(() => { void load() }, [companyId])

  async function changeGroup(memberId: string, groupId: string) {
    if (!client || !access.can('usuarios', 'editar')) return
    const result = await client.from('membros_empresa').update({ grupo_usuario_id: groupId || null }).eq('id', memberId)
    if (result.error) setError(friendlyError(result.error.message)); else void load()
  }

  async function toggleMember(member: Member) {
    if (!client || !access.can('usuarios', 'editar')) return
    const result = await client.from('membros_empresa').update({ ativo: !member.ativo }).eq('id', member.id)
    if (result.error) setError(friendlyError(result.error.message)); else void load()
  }

  const filtered = members.filter((member) => `${member.nome} ${member.email}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <section className="standard-module-page access-page">
      <PageToolbar><div className="module-toolbar-left"><button className="toolbar-add" disabled={!access.can('usuarios', 'cadastrar')} onClick={() => navigate('usuarios-adicionar')} type="button">⊕ Adicionar</button><button className="toolbar-users" onClick={() => navigate('grupos-usuarios')} type="button">▣ Grupos</button></div><div className="module-search compact"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome" /><button type="button">⌕</button></div></PageToolbar>
      {error && <div className="record-error">{error}</div>}
      <div className="records-table-wrap"><table className="records-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Grupo de acesso</th><th>Permite acesso</th><th>Situação</th><th>Ações</th></tr></thead><tbody>
        {filtered.map((member) => <tr key={member.id}><td>{member.nome || 'Usuário'}</td><td>{member.email}</td><td><select value={member.grupo_usuario_id ?? ''} disabled={!access.can('usuarios', 'editar')} onChange={(event) => void changeGroup(member.id, event.target.value)}><option value="">Sem grupo</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.nome}</option>)}</select></td><td className="status-symbol">{member.ativo ? '✓' : '×'}</td><td>{member.ativo ? 'Ativo' : 'Inativo'}</td><td className="record-actions"><button className="action-view" type="button">⌕</button><button className="action-edit" disabled={!access.can('usuarios', 'editar')} type="button">✎</button><button className={member.ativo ? 'action-delete' : 'action-view'} disabled={!access.can('usuarios', 'editar')} onClick={() => void toggleMember(member)} type="button">{member.ativo ? '×' : '✓'}</button></td></tr>)}
        {filtered.length === 0 && <tr><td colSpan={6}>Nenhum usuário encontrado.</td></tr>}
      </tbody></table></div>
      <h3 className="subtable-title">Convites pendentes</h3>
      <div className="records-table-wrap"><table className="records-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Grupo</th><th>Status</th><th>Expira em</th><th>Link</th></tr></thead><tbody>{invites.map((invite) => <tr key={invite.id}><td>{invite.nome}</td><td>{invite.email}</td><td>{inviteGroupName(invite.grupos_usuarios)}</td><td>{invite.status}</td><td>{new Date(invite.expira_em).toLocaleDateString('pt-BR')}</td><td><button className="action-view" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/app?convite=${invite.token}`)} type="button">Copiar</button></td></tr>)}{invites.length === 0 && <tr><td colSpan={6}>Nenhum convite pendente.</td></tr>}</tbody></table></div>
    </section>
  )
}

function InviteForm({ companyId, navigate, access }: { companyId: string; navigate: Navigate; access: AccessControl }) {
  const client = supabase
  const [groups, setGroups] = useState<Group[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [groupId, setGroupId] = useState('')
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (client) client.from('grupos_usuarios').select('id,nome,descricao,sistema,ativo,criado_em').eq('empresa_id', companyId).eq('ativo', true).order('nome').then(({ data }) => setGroups((data ?? []) as Group[])) }, [companyId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client || !access.can('usuarios', 'cadastrar')) return
    setSaving(true); setError('')
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const result = await client.from('convites_acesso').insert({ empresa_id: companyId, nome: name.trim(), email: email.trim().toLowerCase(), grupo_usuario_id: groupId, token, criado_por: client ? (await client.auth.getUser()).data.user?.id : null })
    setSaving(false)
    if (result.error) setError(friendlyError(result.error.message)); else setLink(`${window.location.origin}/app?convite=${token}`)
  }

  return (
    <form className="record-form access-form" onSubmit={submit}>
      {error && <div className="record-error">{error}</div>}
      {link && <div className="invite-success"><strong>Convite criado.</strong><p>Envie este link para o usuário:</p><div><input value={link} readOnly /><button onClick={() => navigator.clipboard.writeText(link)} type="button">Copiar link</button></div></div>}
      <section className="record-section"><header><span>♟</span><h2>Novo usuário</h2></header><div className="record-section-body form-grid">
        <label className="record-field"><span>Nome<b>*</b></span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label className="record-field"><span>E-mail<b>*</b></span><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required /></label>
        <label className="record-field"><span>Grupo de acesso<b>*</b></span><select value={groupId} onChange={(event) => setGroupId(event.target.value)} required><option value="">Selecione</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.nome}</option>)}</select></label>
      </div></section>
      <div className="record-form-actions"><button className="record-cancel" onClick={() => navigate('usuarios')} type="button">Voltar</button><button className="record-save" disabled={saving || !access.can('usuarios', 'cadastrar')} type="submit">{saving ? 'Criando...' : 'Criar convite de acesso'}</button></div>
    </form>
  )
}

export function AccessManagement({ pageId, companyId, session: _session, access, navigate }: Props) {
  if (pageId === 'grupos-usuarios') return <GroupList companyId={companyId} navigate={navigate} access={access} />
  if (pageId === 'grupos-usuarios-adicionar') return <GroupForm companyId={companyId} navigate={navigate} access={access} />
  if (pageId.startsWith('grupos-usuarios-editar:')) return <GroupForm companyId={companyId} groupId={pageId.split(':')[1]} navigate={navigate} access={access} />
  if (pageId.startsWith('grupos-usuarios-visualizar:')) return <GroupForm companyId={companyId} groupId={pageId.split(':')[1]} readOnly navigate={navigate} access={access} />
  if (pageId.startsWith('grupos-usuarios-permissoes:')) return <PermissionMatrix companyId={companyId} groupId={pageId.split(':')[1]} navigate={navigate} access={access} />
  if (pageId === 'usuarios') return <UsersList companyId={companyId} navigate={navigate} access={access} />
  if (pageId === 'usuarios-adicionar') return <InviteForm companyId={companyId} navigate={navigate} access={access} />
  return null
}

export function isAccessPage(pageId: string) {
  return pageId === 'usuarios' || pageId === 'usuarios-adicionar' || pageId === 'grupos-usuarios' || pageId.startsWith('grupos-usuarios-')
}
