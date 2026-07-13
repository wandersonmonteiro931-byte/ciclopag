import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import FirstAccessTour from '../components/FirstAccessTour'
import OnboardingWizard from '../components/OnboardingWizard'
import { erpMenu, pageTitles } from '../data/erpMenu'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Empresa = {
  id: string
  nome: string
  slug: string
  status: string
  segmento: string | null
  onboarding_concluido: boolean
}

type Workspace = {
  empresa: Empresa
  papel: string
}

type Cliente = {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  status: string
  criado_em: string
}

type Preferences = {
  boas_vindas_visualizada: boolean
  tour_dashboard_concluido: boolean
  tour_dashboard_pulado: boolean
}

type DashboardData = {
  clients: Cliente[]
  clientCount: number
  receivableToday: number
  payableToday: number
  receivedMonth: number
  expectedMonth: number
  paidMonth: number
  expectedPaymentsMonth: number
  cashFlow: number[]
  sales: number[]
  months: string[]
}

type AuthPanelProps = {
  onReady: (session: Session) => Promise<void>
}

const emptyDashboardData: DashboardData = {
  clients: [],
  clientCount: 0,
  receivableToday: 0,
  payableToday: 0,
  receivedMonth: 0,
  expectedMonth: 0,
  paidMonth: 0,
  expectedPaymentsMonth: 0,
  cashFlow: [0, 0, 0, 0, 0, 0],
  sales: [0, 0, 0, 0, 0, 0],
  months: [],
}

const applications = [
  { label: 'Melhor Envio', icon: '▰' },
  { label: 'Criador de site', icon: '◇' },
  { label: 'Asaas', icon: 'A' },
  { label: 'Recursos Humanos', icon: '♟' },
  { label: 'Assinatura Digital', icon: '✎' },
  { label: 'Agenda Pro', icon: '▦' },
  { label: 'Indicadores', icon: '↗' },
  { label: 'MDF-e', icon: '▤' },
]

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function localDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function monthStart(date = new Date()) {
  return localDate(new Date(date.getFullYear(), date.getMonth(), 1))
}

function nextMonthStart(date = new Date()) {
  return localDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value) || 0
  return 0
}

function friendlyError(message: string) {
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (normalized.includes('email not confirmed')) return 'A ativação automática de novos usuários ainda não está habilitada no provedor de autenticação.'
  if (normalized.includes('user already registered')) return 'Este e-mail já está cadastrado.'
  if (normalized.includes('password should be')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (normalized.includes('duplicate key') && normalized.includes('slug')) return 'Já existe uma empresa com esse endereço. Tente novamente.'
  if (normalized.includes('does not exist') || normalized.includes('could not find the function')) return 'Execute o SQL da versão atual no Supabase antes de continuar.'
  return message
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand ${light ? 'brand-light' : ''}`} to="/">
      <span>Ciclo</span><strong>Pag</strong>
    </Link>
  )
}

function AuthPanel({ onReady }: AuthPanelProps) {
  const client = supabase
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [terms, setTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createInitialCompany(companyName: string) {
    if (!client) return
    const baseSlug = slugify(companyName) || 'empresa'
    const firstAttempt = await client.rpc('criar_empresa_inicial', { p_nome: companyName, p_slug: baseSlug })
    if (!firstAttempt.error) return

    if (firstAttempt.error.message.toLowerCase().includes('duplicate')) {
      const suffix = Math.random().toString(36).slice(2, 7)
      const secondAttempt = await client.rpc('criar_empresa_inicial', { p_nome: companyName, p_slug: `${baseSlug}-${suffix}` })
      if (secondAttempt.error) throw secondAttempt.error
      return
    }
    throw firstAttempt.error
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    setLoading(true)
    setError('')

    try {
      if (mode === 'login') {
        const { data, error: loginError } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (loginError) throw loginError
        if (data.session) await onReady(data.session)
      } else {
        if (name.trim().length < 2) throw new Error('Informe o nome completo do responsável.')
        if (company.trim().length < 2) throw new Error('Informe o nome da empresa.')
        if (password !== confirmPassword) throw new Error('As senhas digitadas não são iguais.')
        if (!terms) throw new Error('Aceite os Termos de Uso para continuar.')

        const { data, error: signupError } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              nome: name.trim(),
              whatsapp: whatsapp.trim(),
              empresa_nome: company.trim(),
            },
          },
        })
        if (signupError) throw signupError
        if (!data.session) {
          throw new Error('A entrada automática está desativada. Desative a confirmação obrigatória de e-mail e tente novamente.')
        }

        await createInitialCompany(company.trim())
        await onReady(data.session)
      }
    } catch (caught) {
      setError(friendlyError(caught instanceof Error ? caught.message : 'Não foi possível continuar.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout v3-auth-layout">
      <section className="auth-intro v3-auth-intro">
        <Brand light />
        <div>
          <span className="eyebrow eyebrow-light">Gestão empresarial completa</span>
          <h1>O ciclo completo da sua empresa.</h1>
          <p>Cadastros, vendas, financeiro, estoque, contratos, serviços e relatórios em um único ambiente.</p>
        </div>
        <small>Ambiente seguro, separado por empresa e preparado para crescer junto com o seu negócio.</small>
      </section>

      <section className="auth-card-wrap v3-auth-card-wrap">
        <form className={`auth-card v3-auth-card ${mode === 'signup' ? 'signup' : ''}`} onSubmit={submit}>
          <div className="auth-heading">
            <span className="eyebrow">CicloPag</span>
            <h2>{mode === 'login' ? 'Entrar no sistema' : 'Criar minha empresa'}</h2>
            <p>{mode === 'login' ? 'Acesse o painel de gestão.' : 'O acesso é liberado imediatamente após o cadastro.'}</p>
          </div>

          {mode === 'signup' && (
            <div className="auth-fields-grid">
              <label>
                Nome completo
                <input value={name} onChange={(event) => setName(event.target.value)} required autoComplete="name" placeholder="Nome do responsável" />
              </label>
              <label>
                WhatsApp
                <input value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} autoComplete="tel" placeholder="(62) 99999-9999" />
              </label>
              <label className="auth-field-full">
                Nome da empresa
                <input value={company} onChange={(event) => setCompany(event.target.value)} required placeholder="Nome fantasia da empresa" />
              </label>
            </div>
          )}

          <label>
            E-mail
            <input value={email} onChange={(event) => setEmail(event.target.value)} required type="email" autoComplete="email" placeholder="voce@empresa.com" />
          </label>

          <div className={mode === 'signup' ? 'auth-fields-grid' : ''}>
            <label>
              Senha
              <input value={password} onChange={(event) => setPassword(event.target.value)} required type="password" minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo de 6 caracteres" />
            </label>
            {mode === 'signup' && (
              <label>
                Confirmar senha
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required type="password" minLength={6} autoComplete="new-password" placeholder="Digite novamente" />
              </label>
            )}
          </div>

          {mode === 'signup' && (
            <label className="terms-check">
              <input checked={terms} onChange={(event) => setTerms(event.target.checked)} type="checkbox" />
              <span>Li e aceito os Termos de Uso e a Política de Privacidade.</span>
            </label>
          )}

          {error && <div className="form-message error">{error}</div>}

          <button className="button auth-submit" disabled={loading} type="submit">
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar empresa e continuar'}
          </button>

          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
          >
            {mode === 'login' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
          </button>
        </form>
      </section>
    </div>
  )
}

function CompanySetup({ session, onCreated }: { session: Session; onCreated: () => Promise<void> }) {
  const client = supabase
  const [name, setName] = useState(String(session.user.user_metadata?.empresa_nome ?? ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    setLoading(true)
    setError('')
    const baseSlug = slugify(name)
    const { error: rpcError } = await client.rpc('criar_empresa_inicial', { p_nome: name.trim(), p_slug: baseSlug })
    if (rpcError) setError(friendlyError(rpcError.message))
    else await onCreated()
    setLoading(false)
  }

  return (
    <div className="simple-page company-setup-page">
      <Brand />
      <form className="simple-card company-setup-card" onSubmit={submit}>
        <span className="eyebrow">Configuração da empresa</span>
        <h1>Vamos preparar seu ambiente</h1>
        <p>Informe o nome da empresa que será administrada por esta conta.</p>
        <label className="field-left">
          Nome da empresa
          <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nome fantasia" />
        </label>
        {error && <div className="form-message error">{error}</div>}
        <button className="button full-button" disabled={loading} type="submit">{loading ? 'Criando...' : 'Continuar'}</button>
      </form>
    </div>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function monthLabels() {
  const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    return formatter.format(date).replace('.', '')
  })
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function makeSixMonthKeys() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - (5 - index))
    return monthKey(date)
  })
}

function DashboardLineChart({ values, secondary, labels, ariaLabel }: { values: number[]; secondary?: number[]; labels: string[]; ariaLabel: string }) {
  const maxValue = Math.max(1, ...values, ...(secondary ?? []))
  const points = values.map((value, index) => {
    const x = 8 + (index * 84) / Math.max(1, values.length - 1)
    const y = 82 - (value / maxValue) * 64
    return `${x},${y}`
  }).join(' ')
  const secondaryPoints = secondary?.map((value, index) => {
    const x = 8 + (index * 84) / Math.max(1, secondary.length - 1)
    const y = 82 - (value / maxValue) * 64
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="erp-chart" role="img" aria-label={ariaLabel}>
      <svg viewBox="0 0 100 92" preserveAspectRatio="none">
        {[20, 40, 60, 80].map((line) => <line key={line} x1="6" x2="94" y1={line} y2={line} className="chart-grid-line" />)}
        {secondaryPoints && <polyline points={secondaryPoints} className="chart-line secondary" />}
        <polyline points={points} className="chart-line primary" />
        {values.map((value, index) => {
          const x = 8 + (index * 84) / Math.max(1, values.length - 1)
          const y = 82 - (value / maxValue) * 64
          return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" className="chart-dot" />
        })}
      </svg>
      <div className="chart-labels">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  )
}

function DonutCard({ title, realized, expected, color }: { title: string; realized: number; expected: number; color: 'blue' | 'navy' }) {
  const percent = expected > 0 ? Math.min(100, Math.round((realized / expected) * 100)) : 0
  const missing = Math.max(0, expected - realized)
  return (
    <article className={`month-summary-card ${color}`}>
      <div className="month-summary-heading">{title}<button aria-label="Configurações">⚙</button></div>
      <div className="month-summary-content">
        <div className="donut" style={{ '--progress': `${percent * 3.6}deg` } as React.CSSProperties}><strong>{percent}%</strong></div>
        <div>
          <span>Realizado: {formatMoney(realized)}</span>
          <span>Falta: {formatMoney(missing)}</span>
          <span>Previsto: {formatMoney(expected)}</span>
        </div>
      </div>
      <button className="card-footer-link" type="button">Ir para fluxo de caixa ›</button>
    </article>
  )
}

function CalendarCard() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const previousTotal = new Date(year, month, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1
    if (day < 1) return { value: previousTotal + day, muted: true }
    if (day > totalDays) return { value: day - totalDays, muted: true }
    return { value: day, muted: false, today: day === now.getDate() }
  })
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)

  return (
    <section className="dashboard-widget calendar-widget">
      <div className="widget-heading"><h3>Calendário</h3><div><strong>{monthName}</strong><button>‹</button><button>›</button></div></div>
      <div className="calendar-grid weekdays">{['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid days">
        {cells.map((cell, index) => <span className={`${cell.muted ? 'muted' : ''} ${cell.today ? 'today' : ''}`} key={`${cell.value}-${index}`}>{cell.value}</span>)}
      </div>
    </section>
  )
}

function PlaceholderPage({ pageId }: { pageId: string }) {
  const info = pageTitles[pageId] ?? { title: 'Módulo', section: 'CicloPag' }
  return (
    <section className="module-placeholder">
      <div className="module-placeholder-icon">▦</div>
      <span>{info.section}</span>
      <h2>{info.title}</h2>
      <p>A estrutura visual deste módulo já está preparada. As funções operacionais serão adicionadas nas próximas etapas sem alterar o padrão do painel.</p>
      <div className="module-placeholder-actions">
        <button type="button">Ver recursos planejados</button>
        <button className="secondary" type="button">Voltar ao início</button>
      </div>
    </section>
  )
}

function ErpDashboard({ session, workspace, onWorkspaceRefresh }: { session: Session; workspace: Workspace; onWorkspaceRefresh: () => Promise<void> }) {
  const client = supabase
  const [activePage, setActivePage] = useState('inicio')
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['cadastros'])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [data, setData] = useState<DashboardData>({ ...emptyDashboardData, months: monthLabels() })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [tourActive, setTourActive] = useState(false)
  const [clientModal, setClientModal] = useState(false)
  const [newClient, setNewClient] = useState({ nome: '', email: '', telefone: '' })
  const [savingClient, setSavingClient] = useState(false)

  const userName = String(session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário')
  const firstName = userName.trim().split(/\s+/)[0]
  const currentPage = pageTitles[activePage] ?? { title: activePage, section: 'CicloPag' }

  async function loadPreferences() {
    if (!client) return
    const { data: result, error: preferenceError } = await client
      .from('preferencias_usuario')
      .select('boas_vindas_visualizada,tour_dashboard_concluido,tour_dashboard_pulado')
      .eq('usuario_id', session.user.id)
      .maybeSingle()

    if (preferenceError) {
      if (preferenceError.message.toLowerCase().includes('does not exist')) {
        setError('Execute o arquivo PASSO_3_SUPABASE_ONBOARDING.sql para ativar o primeiro acesso completo.')
      }
      return
    }

    const normalized: Preferences = result ?? {
      boas_vindas_visualizada: false,
      tour_dashboard_concluido: false,
      tour_dashboard_pulado: false,
    }
    setPreferences(normalized)
    setWelcomeOpen(!normalized.boas_vindas_visualizada)
  }

  async function updatePreferences(changes: Partial<Preferences>) {
    if (!client) return
    const next = {
      boas_vindas_visualizada: preferences?.boas_vindas_visualizada ?? false,
      tour_dashboard_concluido: preferences?.tour_dashboard_concluido ?? false,
      tour_dashboard_pulado: preferences?.tour_dashboard_pulado ?? false,
      ...changes,
    }
    setPreferences(next)
    const { error: updateError } = await client.from('preferencias_usuario').upsert({
      usuario_id: session.user.id,
      ...next,
    })
    if (updateError) setError(friendlyError(updateError.message))
  }

  async function loadDashboard() {
    if (!client) return
    setLoading(true)
    setError('')
    const companyId = workspace.empresa.id
    const today = localDate()
    const start = monthStart()
    const nextStart = nextMonthStart()
    const sixKeys = makeSixMonthKeys()
    const sixStartDate = `${sixKeys[0]}-01`

    const [clientsResult, todayReceivables, monthReceivables, monthPayments, sixMonthPayments] = await Promise.all([
      client.from('clientes').select('id,nome,email,telefone,status,criado_em').eq('empresa_id', companyId).order('criado_em', { ascending: false }).limit(80),
      client.from('mensalidades').select('valor,status,vencimento').eq('empresa_id', companyId).eq('vencimento', today).in('status', ['pendente', 'vencida', 'parcial']),
      client.from('mensalidades').select('valor,status,vencimento').eq('empresa_id', companyId).gte('vencimento', start).lt('vencimento', nextStart).neq('status', 'cancelada'),
      client.from('pagamentos').select('valor,status,pago_em,criado_em').eq('empresa_id', companyId).eq('status', 'confirmado').gte('criado_em', `${start}T00:00:00`).lt('criado_em', `${nextStart}T00:00:00`),
      client.from('pagamentos').select('valor,status,pago_em,criado_em').eq('empresa_id', companyId).eq('status', 'confirmado').gte('criado_em', `${sixStartDate}T00:00:00`),
    ])

    const firstError = [clientsResult.error, todayReceivables.error, monthReceivables.error, monthPayments.error, sixMonthPayments.error].find(Boolean)
    if (firstError) {
      setError(friendlyError(firstError.message))
      setLoading(false)
      return
    }

    const monthlyValues = Object.fromEntries(sixKeys.map((key) => [key, 0])) as Record<string, number>
    for (const row of sixMonthPayments.data ?? []) {
      const rawDate = row.pago_em || row.criado_em
      if (!rawDate) continue
      const key = monthKey(new Date(rawDate))
      if (key in monthlyValues) monthlyValues[key] += numberValue(row.valor)
    }

    const expectedMonth = (monthReceivables.data ?? []).reduce((total, row) => total + numberValue(row.valor), 0)
    const receivedMonth = (monthPayments.data ?? []).reduce((total, row) => total + numberValue(row.valor), 0)
    const sales = sixKeys.map((key) => monthlyValues[key] ?? 0)

    setData({
      clients: (clientsResult.data ?? []) as Cliente[],
      clientCount: clientsResult.data?.length ?? 0,
      receivableToday: (todayReceivables.data ?? []).reduce((total, row) => total + numberValue(row.valor), 0),
      payableToday: 0,
      receivedMonth,
      expectedMonth,
      paidMonth: 0,
      expectedPaymentsMonth: 0,
      cashFlow: sales,
      sales,
      months: monthLabels(),
    })
    setLoading(false)
  }

  useEffect(() => {
    void Promise.all([loadDashboard(), loadPreferences()])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.empresa.id, session.user.id])

  function toggleMenu(menuId: string) {
    setExpandedMenus((current) => current.includes(menuId) ? current.filter((item) => item !== menuId) : [...current, menuId])
  }

  function navigate(pageId: string) {
    setActivePage(pageId)
    setMobileSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveClient(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    setSavingClient(true)
    const { error: insertError } = await client.from('clientes').insert({
      empresa_id: workspace.empresa.id,
      nome: newClient.nome.trim(),
      email: newClient.email.trim() || null,
      telefone: newClient.telefone.trim() || null,
    })
    if (insertError) setError(friendlyError(insertError.message))
    else {
      setNewClient({ nome: '', email: '', telefone: '' })
      setClientModal(false)
      await loadDashboard()
      navigate('clientes')
    }
    setSavingClient(false)
  }

  async function closeWelcome(startTour: boolean) {
    setWelcomeOpen(false)
    await updatePreferences({
      boas_vindas_visualizada: true,
      tour_dashboard_pulado: !startTour,
    })
    if (startTour) setTourActive(true)
  }

  async function closeTour(completed: boolean) {
    setTourActive(false)
    await updatePreferences({
      boas_vindas_visualizada: true,
      tour_dashboard_concluido: completed,
      tour_dashboard_pulado: !completed,
    })
  }

  async function signOut() {
    await client?.auth.signOut()
  }

  const sidebarClass = `${sidebarOpen ? '' : 'collapsed'} ${mobileSidebarOpen ? 'mobile-open' : ''}`

  return (
    <div className="erp-shell">
      <header className="erp-topbar">
        <div className="erp-topbar-left">
          <div className="erp-logo"><span>ciclo</span><strong>pag</strong><i>◆</i></div>
          <button className="menu-toggle" onClick={() => setSidebarOpen((current) => !current)} aria-label="Recolher menu" type="button">☰</button>
        </div>
        <div className="erp-topbar-actions">
          <button title="Aplicativos" type="button">▦</button>
          <button title="Assistente" type="button">✦</button>
          <button title="Notificações" type="button">♟</button>
          <button className="user-avatar" title={userName} type="button">{firstName.slice(0, 1).toUpperCase()}</button>
        </div>
      </header>

      <aside className={`erp-sidebar ${sidebarClass}`} data-tour="menu">
        <div className="company-logo-card">
          <div>{workspace.empresa.nome.slice(0, 1).toUpperCase()}</div>
          <span>Logomarca</span>
        </div>
        <button className="company-selector" type="button"><strong>Matriz</strong><span>⌄</span></button>
        <nav className="erp-menu" aria-label="Menu principal">
          {erpMenu.map((item) => {
            const expanded = expandedMenus.includes(item.id)
            const active = activePage === item.id || item.children?.some((child) => child.id === activePage)
            return (
              <div className={`erp-menu-group ${active ? 'active' : ''}`} key={item.id}>
                <button
                  className="erp-menu-heading"
                  onClick={() => item.children ? toggleMenu(item.id) : navigate(item.id)}
                  type="button"
                >
                  <span className="erp-menu-icon">{item.icon}</span>
                  <strong>{item.label}</strong>
                  {item.children && <i>{expanded ? '⌃' : '⌄'}</i>}
                </button>
                {item.children && expanded && (
                  <div className="erp-submenu">
                    {item.children.map((child) => (
                      <button className={activePage === child.id ? 'active' : ''} key={child.id} onClick={() => navigate(child.id)} type="button">{child.label}</button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <button className="sidebar-signout" onClick={() => void signOut()} type="button">Sair da conta</button>
      </aside>

      {mobileSidebarOpen && <button className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} aria-label="Fechar menu" type="button" />}

      <main className={`erp-main ${sidebarOpen ? '' : 'expanded'}`}>
        <div className="mobile-main-header">
          <button onClick={() => setMobileSidebarOpen(true)} type="button">☰ Menu</button>
          <div className="erp-logo small"><span>ciclo</span><strong>pag</strong></div>
        </div>

        <header className="erp-page-header">
          <div>
            <h1>{activePage === 'inicio' ? `${greeting()}, ${firstName}` : currentPage.title}</h1>
            {activePage !== 'inicio' && <p>{currentPage.section}</p>}
          </div>
          <div className="breadcrumb"><button onClick={() => navigate('inicio')} type="button">⌂ Início</button>{activePage !== 'inicio' && <span>› {currentPage.title}</span>}</div>
        </header>

        {error && <div className="erp-alert"><span>!</span><p>{error}</p><button onClick={() => setError('')} type="button">×</button></div>}

        {activePage === 'inicio' ? (
          <>
            <section className="finance-summary-grid">
              <article className="today-card receive" data-tour="receber-hoje">
                <small>A receber hoje</small>
                <strong>{formatMoney(data.receivableToday)}</strong>
                <i>↗</i>
                <button onClick={() => navigate('contas-receber')} type="button">Ir para contas a receber ›</button>
              </article>
              <article className="today-card pay">
                <small>A pagar hoje</small>
                <strong>{formatMoney(data.payableToday)}</strong>
                <i>↘</i>
                <button onClick={() => navigate('contas-pagar')} type="button">Ir para contas a pagar ›</button>
              </article>
              <DonutCard title="Recebimentos do mês" realized={data.receivedMonth} expected={data.expectedMonth} color="blue" />
              <DonutCard title="Pagamentos do mês" realized={data.paidMonth} expected={data.expectedPaymentsMonth} color="navy" />
            </section>

            <section className="dashboard-grid-two">
              <article className="dashboard-widget chart-widget" data-tour="fluxo-caixa">
                <div className="widget-heading"><h3>Fluxo de caixa</h3><button type="button">⚙</button></div>
                <DashboardLineChart values={data.cashFlow} labels={data.months} ariaLabel="Gráfico de fluxo de caixa dos últimos seis meses" />
              </article>
              <article className="dashboard-widget chart-widget">
                <div className="widget-heading"><h3>Gráfico de vendas</h3><button type="button">?</button></div>
                <DashboardLineChart values={data.sales} secondary={data.sales.map((value) => value * 0.72)} labels={data.months} ariaLabel="Gráfico de vendas dos últimos seis meses" />
              </article>
              <article className="dashboard-widget bank-widget">
                <div className="widget-heading"><h3>Contas bancárias</h3><button type="button">⚙</button></div>
                <div className="bank-chart"><span style={{ height: data.receivedMonth > 0 ? '62%' : '2%' }} /><div><strong>{formatMoney(data.receivedMonth)}</strong><small>Saldo registrado</small></div></div>
              </article>
              <CalendarCard />
            </section>

            <section className="dashboard-widget apps-widget">
              <div className="widget-heading"><div><h3>Meus aplicativos</h3><p>Conecte recursos adicionais ao CicloPag.</p></div><button type="button">Ver todos</button></div>
              <div className="apps-grid">
                {applications.map((application) => <button key={application.label} type="button"><span>{application.icon}</span><strong>{application.label}</strong></button>)}
              </div>
            </section>
          </>
        ) : activePage === 'clientes' ? (
          <section className="erp-content-panel">
            <div className="content-panel-heading">
              <div><span>Cadastros</span><h2>Clientes</h2><p>{data.clientCount} cliente(s) cadastrado(s)</p></div>
              <button className="erp-primary-button" onClick={() => setClientModal(true)} type="button">＋ Novo cliente</button>
            </div>
            {loading ? <div className="erp-loading-row">Carregando clientes...</div> : data.clients.length === 0 ? (
              <div className="erp-empty-state"><span>▤</span><h3>Nenhum cliente cadastrado</h3><p>Cadastre o primeiro cliente para começar a organizar sua base.</p><button onClick={() => setClientModal(true)} type="button">Cadastrar cliente</button></div>
            ) : (
              <div className="erp-table-wrap">
                <table className="erp-table">
                  <thead><tr><th>Cliente</th><th>Contato</th><th>Status</th><th>Cadastro</th><th /></tr></thead>
                  <tbody>
                    {data.clients.map((clientItem) => (
                      <tr key={clientItem.id}>
                        <td><div className="client-cell"><span>{clientItem.nome.slice(0, 1).toUpperCase()}</span><strong>{clientItem.nome}</strong></div></td>
                        <td><small>{clientItem.email || clientItem.telefone || 'Não informado'}</small></td>
                        <td><em>{clientItem.status}</em></td>
                        <td><small>{new Intl.DateTimeFormat('pt-BR').format(new Date(clientItem.criado_em))}</small></td>
                        <td><button type="button">•••</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <PlaceholderPage pageId={activePage} />
        )}
      </main>

      <button className="tutorial-floating" data-tour="tutorial-button" onClick={() => setTourActive(true)} type="button">▶ <span>Passo a passo</span></button>
      <button className="support-floating" type="button">● Suporte</button>

      {welcomeOpen && (
        <div className="welcome-overlay">
          <div className="welcome-modal">
            <header>Seja bem-vindo ao CicloPag!</header>
            <div>
              <p>Parabéns, agora você já pode começar a utilizar o CicloPag para gerenciar sua empresa.</p>
              <p>O CicloPag permite controlar financeiro, estoque, orçamentos, vendas, ordens de serviços, contratos, cobranças, clientes e muitas outras funcionalidades em um único ambiente.</p>
              <p>Vamos apresentar os principais recursos do seu painel.</p>
            </div>
            <footer>
              <button className="welcome-access" onClick={() => void closeWelcome(false)} type="button">Acessar</button>
              <button className="welcome-continue" onClick={() => void closeWelcome(true)} type="button">Continuar »</button>
            </footer>
          </div>
        </div>
      )}

      <FirstAccessTour active={tourActive} onClose={(completed) => void closeTour(completed)} />

      {clientModal && (
        <div className="modal-backdrop" onMouseDown={() => setClientModal(false)}>
          <form className="modal-card erp-modal" onSubmit={saveClient} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title"><div><span className="eyebrow">Novo cadastro</span><h2>Adicionar cliente</h2></div><button onClick={() => setClientModal(false)} type="button">×</button></div>
            <label>Nome<input required value={newClient.nome} onChange={(event) => setNewClient({ ...newClient, nome: event.target.value })} placeholder="Nome completo" /></label>
            <label>E-mail<input type="email" value={newClient.email} onChange={(event) => setNewClient({ ...newClient, email: event.target.value })} placeholder="cliente@email.com" /></label>
            <label>Telefone<input value={newClient.telefone} onChange={(event) => setNewClient({ ...newClient, telefone: event.target.value })} placeholder="(62) 99999-9999" /></label>
            <button className="erp-primary-button full" disabled={savingClient} type="submit">{savingClient ? 'Salvando...' : 'Salvar cliente'}</button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function SystemPage() {
  const client = supabase
  const [session, setSession] = useState<Session | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [error, setError] = useState('')

  async function loadWorkspace(currentSession = session) {
    if (!client || !currentSession) {
      setWorkspace(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    setSchemaMissing(false)

    const { data, error: queryError } = await client
      .from('membros_empresa')
      .select('empresa_id,papel,empresas(id,nome,slug,status,segmento,onboarding_concluido)')
      .eq('usuario_id', currentSession.user.id)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()

    if (queryError) {
      const normalized = queryError.message.toLowerCase()
      if (normalized.includes('does not exist') || queryError.code === '42P01' || normalized.includes('onboarding_concluido')) setSchemaMissing(true)
      else setError(friendlyError(queryError.message))
      setWorkspace(null)
      setLoading(false)
      return
    }

    if (!data) {
      setWorkspace(null)
      setLoading(false)
      return
    }

    const raw = (data as unknown as { empresas: Empresa | Empresa[] | null }).empresas
    const company = Array.isArray(raw) ? raw[0] : raw
    if (!company) {
      setError('A empresa vinculada não foi encontrada.')
      setLoading(false)
      return
    }

    setWorkspace({ empresa: company, papel: (data as { papel: string }).papel })
    setLoading(false)
  }

  useEffect(() => {
    if (!client) {
      setLoading(false)
      return
    }

    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) void loadWorkspace(data.session)
      else setLoading(false)
    })

    const { data: listener } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) void loadWorkspace(newSession)
      else {
        setWorkspace(null)
        setLoading(false)
      }
    })

    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  if (!supabaseConfigured) {
    return (
      <div className="simple-page">
        <Brand />
        <div className="simple-card"><span className="eyebrow">Configuração necessária</span><h1>Conecte o banco</h1><p>Cadastre VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Cloudflare e faça um novo deploy.</p><Link className="button" to="/">Voltar ao site</Link></div>
      </div>
    )
  }

  if (loading) return <div className="app-loading"><div className="loading-logo"><span>Ciclo</span><strong>Pag</strong></div><p>Carregando ambiente...</p></div>
  if (!session) return <AuthPanel onReady={async (newSession) => { setSession(newSession); await loadWorkspace(newSession) }} />

  if (schemaMissing) {
    return (
      <div className="simple-page">
        <Brand />
        <div className="simple-card"><span className="eyebrow">Atualização necessária</span><h1>Execute o SQL da V3</h1><p>Abra o SQL Editor e execute o arquivo <strong>PASSO_3_SUPABASE_ONBOARDING.sql</strong> incluído no pacote.</p><button className="button" onClick={() => void loadWorkspace(session)}>Verificar novamente</button></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="simple-page">
        <Brand />
        <div className="simple-card"><span className="eyebrow">Não foi possível carregar</span><h1>Verifique a configuração</h1><p>{error}</p><button className="button" onClick={() => void loadWorkspace(session)}>Tentar novamente</button></div>
      </div>
    )
  }

  if (!workspace) return <CompanySetup session={session} onCreated={() => loadWorkspace(session)} />
  if (!workspace.empresa.onboarding_concluido) {
    return (
      <OnboardingWizard
        workspace={workspace}
        userName={String(session.user.user_metadata?.nome || session.user.email?.split('@')[0] || 'Usuário')}
        onComplete={() => loadWorkspace(session)}
      />
    )
  }

  return <ErpDashboard session={session} workspace={workspace} onWorkspaceRefresh={() => loadWorkspace(session)} />
}
