import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from '../lib/supabase'

type Empresa = {
  id: string
  nome: string
  slug: string
  status: string
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

type ModuloEmpresa = {
  modulo: string
  ativo: boolean
}

type Stats = {
  clientes: number
  planos: number
  mensalidadesPendentes: number
  pagamentos: number
}

const nomeModulo: Record<string, string> = {
  financeiro: 'Financeiro',
  clientes: 'Clientes',
  cobrancas: 'Cobranças',
  agenda: 'Agenda',
  vendas: 'Vendas',
  pdv: 'PDV',
  estoque: 'Estoque',
  notas_fiscais: 'Notas fiscais',
  contratos: 'Contratos',
  chamados: 'Chamados',
  relatorios: 'Relatórios',
  lojas: 'Lojas',
  integracoes: 'Integrações',
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function traduzirErro(message: string) {
  const normalizada = message.toLowerCase()
  if (normalizada.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (normalizada.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (normalizada.includes('user already registered')) return 'Este e-mail já está cadastrado.'
  if (normalizada.includes('password should be')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (normalizada.includes('duplicate key') && normalizada.includes('slug')) return 'Esse endereço de empresa já está em uso.'
  if (normalizada.includes('relation') && normalizada.includes('does not exist')) return 'O banco inicial ainda não foi criado no Supabase.'
  return message
}

function AuthPanel() {
  const client = supabase
  const [modo, setModo] = useState<'entrar' | 'cadastrar'>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function enviar(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    setLoading(true)
    setErro('')
    setSucesso('')

    try {
      if (modo === 'entrar') {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password: senha })
        if (error) throw error
      } else {
        if (nome.trim().length < 2) throw new Error('Informe seu nome completo.')
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password: senha,
          options: { data: { nome: nome.trim() } },
        })
        if (error) throw error
        if (!data.session) {
          setSucesso('Cadastro realizado. Abra seu e-mail e confirme a conta para continuar.')
        } else {
          setSucesso('Cadastro realizado com sucesso.')
        }
      }
    } catch (error) {
      setErro(traduzirErro(error instanceof Error ? error.message : 'Não foi possível continuar.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-intro">
        <Link className="brand brand-light" to="/" aria-label="Voltar ao CicloPag">
          <span>Ciclo</span><strong>Pag</strong>
        </Link>
        <div>
          <span className="eyebrow eyebrow-light">Área segura</span>
          <h1>Gestão completa, simples e com a sua marca.</h1>
          <p>Entre para administrar clientes, planos, mensalidades e os módulos ativos da sua empresa.</p>
        </div>
        <small>Dados separados por empresa com Supabase Auth e Row Level Security.</small>
      </section>

      <section className="auth-card-wrap">
        <form className="auth-card" onSubmit={enviar}>
          <span className="eyebrow">CicloPag</span>
          <h2>{modo === 'entrar' ? 'Entrar no sistema' : 'Criar minha conta'}</h2>
          <p>{modo === 'entrar' ? 'Acesse o painel da sua empresa.' : 'Comece a configurar sua empresa gratuitamente.'}</p>

          {modo === 'cadastrar' && (
            <label>
              Nome completo
              <input value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" placeholder="Seu nome" />
            </label>
          )}

          <label>
            E-mail
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" autoComplete="email" placeholder="voce@empresa.com" />
          </label>

          <label>
            Senha
            <input value={senha} onChange={(e) => setSenha(e.target.value)} required type="password" minLength={6} autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} placeholder="Mínimo de 6 caracteres" />
          </label>

          {erro && <div className="form-message error">{erro}</div>}
          {sucesso && <div className="form-message success">{sucesso}</div>}

          <button className="button auth-submit" disabled={loading} type="submit">
            {loading ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>

          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setModo(modo === 'entrar' ? 'cadastrar' : 'entrar')
              setErro('')
              setSucesso('')
            }}
          >
            {modo === 'entrar' ? 'Ainda não tenho conta' : 'Já tenho uma conta'}
          </button>
        </form>
      </section>
    </div>
  )
}

function CompanyOnboarding({ onCreated }: { onCreated: () => Promise<void> }) {
  const client = supabase
  const [nome, setNome] = useState('')
  const slug = useMemo(() => slugify(nome), [nome])
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function criar(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    if (!slug) {
      setErro('Informe o nome da empresa.')
      return
    }
    setLoading(true)
    setErro('')
    const { error } = await client.rpc('criar_empresa_inicial', { p_nome: nome.trim(), p_slug: slug })
    if (error) {
      setErro(traduzirErro(error.message))
      setLoading(false)
      return
    }
    await onCreated()
    setLoading(false)
  }

  return (
    <div className="simple-page onboarding-page">
      <Link className="brand" to="/"><span>Ciclo</span><strong>Pag</strong></Link>
      <form className="simple-card onboarding-card" onSubmit={criar}>
        <span className="eyebrow">Primeira configuração</span>
        <h1>Cadastre sua empresa</h1>
        <p>Essa empresa será o seu ambiente privado dentro do CicloPag.</p>
        <label className="field-left">
          Nome da empresa
          <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Ex.: Barbearia Central" />
        </label>
        <div className="slug-preview">
          Portal: <strong>/portal/{slug || 'sua-empresa'}</strong>
        </div>
        {erro && <div className="form-message error">{erro}</div>}
        <button className="button full-button" disabled={loading} type="submit">
          {loading ? 'Criando empresa...' : 'Criar empresa e abrir painel'}
        </button>
      </form>
    </div>
  )
}

function Dashboard({ session, workspace }: { session: Session; workspace: Workspace }) {
  const client = supabase
  const [aba, setAba] = useState<'inicio' | 'clientes' | 'modulos'>('inicio')
  const [stats, setStats] = useState<Stats>({ clientes: 0, planos: 0, mensalidadesPendentes: 0, pagamentos: 0 })
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [modulos, setModulos] = useState<ModuloEmpresa[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [mostrarCadastro, setMostrarCadastro] = useState(false)
  const [novoCliente, setNovoCliente] = useState({ nome: '', email: '', telefone: '' })
  const [salvando, setSalvando] = useState(false)

  async function carregarDados() {
    if (!client) return
    setCarregando(true)
    setErro('')
    const empresaId = workspace.empresa.id

    const [clientesCount, planosCount, mensalidadesCount, pagamentosCount, clientesResult, modulosResult] = await Promise.all([
      client.from('clientes').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId),
      client.from('planos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('ativo', true),
      client.from('mensalidades').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).in('status', ['pendente', 'vencida', 'parcial']),
      client.from('pagamentos').select('*', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('status', 'confirmado'),
      client.from('clientes').select('id,nome,email,telefone,status,criado_em').eq('empresa_id', empresaId).order('criado_em', { ascending: false }).limit(50),
      client.from('modulos_empresa').select('modulo,ativo').eq('empresa_id', empresaId).order('modulo'),
    ])

    const primeiroErro = [clientesCount.error, planosCount.error, mensalidadesCount.error, pagamentosCount.error, clientesResult.error, modulosResult.error].find(Boolean)
    if (primeiroErro) {
      setErro(traduzirErro(primeiroErro.message))
    } else {
      setStats({
        clientes: clientesCount.count ?? 0,
        planos: planosCount.count ?? 0,
        mensalidadesPendentes: mensalidadesCount.count ?? 0,
        pagamentos: pagamentosCount.count ?? 0,
      })
      setClientes((clientesResult.data ?? []) as Cliente[])
      setModulos((modulosResult.data ?? []) as ModuloEmpresa[])
    }
    setCarregando(false)
  }

  useEffect(() => {
    void carregarDados()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.empresa.id])

  async function cadastrarCliente(event: FormEvent) {
    event.preventDefault()
    if (!client) return
    setSalvando(true)
    setErro('')
    const { error } = await client.from('clientes').insert({
      empresa_id: workspace.empresa.id,
      nome: novoCliente.nome.trim(),
      email: novoCliente.email.trim() || null,
      telefone: novoCliente.telefone.trim() || null,
    })
    if (error) {
      setErro(traduzirErro(error.message))
    } else {
      setNovoCliente({ nome: '', email: '', telefone: '' })
      setMostrarCadastro(false)
      await carregarDados()
      setAba('clientes')
    }
    setSalvando(false)
  }

  async function sair() {
    await client?.auth.signOut()
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="brand brand-light sidebar-brand" to="/"><span>Ciclo</span><strong>Pag</strong></Link>
        <div className="company-badge">
          <span>{workspace.empresa.nome.slice(0, 1).toUpperCase()}</span>
          <div><strong>{workspace.empresa.nome}</strong><small>{workspace.papel}</small></div>
        </div>
        <nav className="app-nav">
          <button className={aba === 'inicio' ? 'active' : ''} onClick={() => setAba('inicio')}>Visão geral</button>
          <button className={aba === 'clientes' ? 'active' : ''} onClick={() => setAba('clientes')}>Clientes</button>
          <button className={aba === 'modulos' ? 'active' : ''} onClick={() => setAba('modulos')}>Módulos</button>
        </nav>
        <button className="logout-button" onClick={sair}>Sair da conta</button>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div>
            <small>Painel da empresa</small>
            <h1>{aba === 'inicio' ? 'Visão geral' : aba === 'clientes' ? 'Clientes' : 'Módulos ativos'}</h1>
          </div>
          <div className="user-chip">
            <span>{(session.user.user_metadata?.nome || session.user.email || 'U').slice(0, 1).toUpperCase()}</span>
            <div><strong>{session.user.user_metadata?.nome || 'Usuário'}</strong><small>{session.user.email}</small></div>
          </div>
        </header>

        {erro && <div className="app-alert">{erro}</div>}

        {aba === 'inicio' && (
          <>
            <section className="app-metrics">
              <article><small>Clientes cadastrados</small><strong>{stats.clientes}</strong><span>Base total</span></article>
              <article><small>Planos ativos</small><strong>{stats.planos}</strong><span>Produtos recorrentes</span></article>
              <article><small>Cobranças abertas</small><strong>{stats.mensalidadesPendentes}</strong><span>Pendentes ou vencidas</span></article>
              <article><small>Pagamentos confirmados</small><strong>{stats.pagamentos}</strong><span>Registros recebidos</span></article>
            </section>

            <section className="app-panel welcome-panel">
              <div>
                <span className="eyebrow">CicloPag V2</span>
                <h2>Sua base multiempresa está funcionando.</h2>
                <p>O login, a empresa, as permissões, os módulos e o primeiro cadastro de clientes já estão conectados ao Supabase.</p>
              </div>
              <button className="button" onClick={() => setMostrarCadastro(true)}>Cadastrar cliente</button>
            </section>

            <section className="app-panel">
              <div className="panel-title"><div><small>Últimos registros</small><h2>Clientes recentes</h2></div><button onClick={() => setAba('clientes')}>Ver todos</button></div>
              {carregando ? <p>Carregando...</p> : clientes.length === 0 ? <div className="empty-state">Nenhum cliente cadastrado ainda.</div> : (
                <div className="client-list compact-list">
                  {clientes.slice(0, 5).map((cliente) => (
                    <div key={cliente.id}><span>{cliente.nome.slice(0, 1).toUpperCase()}</span><div><strong>{cliente.nome}</strong><small>{cliente.email || cliente.telefone || 'Sem contato'}</small></div><em>{cliente.status}</em></div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {aba === 'clientes' && (
          <section className="app-panel">
            <div className="panel-title">
              <div><small>Cadastros</small><h2>Clientes da empresa</h2></div>
              <button className="button button-small" onClick={() => setMostrarCadastro(true)}>Novo cliente</button>
            </div>
            {carregando ? <p>Carregando...</p> : clientes.length === 0 ? <div className="empty-state">Clique em “Novo cliente” para fazer o primeiro cadastro.</div> : (
              <div className="client-list">
                {clientes.map((cliente) => (
                  <div key={cliente.id}><span>{cliente.nome.slice(0, 1).toUpperCase()}</span><div><strong>{cliente.nome}</strong><small>{cliente.email || 'Sem e-mail'} · {cliente.telefone || 'Sem telefone'}</small></div><em>{cliente.status}</em></div>
                ))}
              </div>
            )}
          </section>
        )}

        {aba === 'modulos' && (
          <section className="app-panel">
            <div className="panel-title"><div><small>Configuração inicial</small><h2>Módulos da empresa</h2></div></div>
            <div className="module-status-grid">
              {modulos.map((modulo) => (
                <article className={modulo.ativo ? 'enabled' : ''} key={modulo.modulo}>
                  <span>{modulo.ativo ? 'Ativo' : 'Desativado'}</span>
                  <strong>{nomeModulo[modulo.modulo] || modulo.modulo}</strong>
                  <small>{modulo.ativo ? 'Disponível para a empresa' : 'Poderá ser ativado futuramente'}</small>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {mostrarCadastro && (
        <div className="modal-backdrop" onMouseDown={() => setMostrarCadastro(false)}>
          <form className="modal-card" onSubmit={cadastrarCliente} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-title"><div><span className="eyebrow">Novo cadastro</span><h2>Adicionar cliente</h2></div><button type="button" onClick={() => setMostrarCadastro(false)}>×</button></div>
            <label>Nome<input required value={novoCliente.nome} onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })} placeholder="Nome completo" /></label>
            <label>E-mail<input type="email" value={novoCliente.email} onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })} placeholder="cliente@email.com" /></label>
            <label>Telefone<input value={novoCliente.telefone} onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })} placeholder="(62) 99999-9999" /></label>
            <button className="button full-button" disabled={salvando} type="submit">{salvando ? 'Salvando...' : 'Salvar cliente'}</button>
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
  const [erro, setErro] = useState('')

  async function carregarWorkspace(currentSession = session) {
    if (!client || !currentSession) {
      setWorkspace(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setErro('')
    setSchemaMissing(false)

    const { data, error } = await client
      .from('membros_empresa')
      .select('empresa_id,papel,empresas(id,nome,slug,status)')
      .eq('usuario_id', currentSession.user.id)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.message.toLowerCase().includes('does not exist') || error.code === '42P01') setSchemaMissing(true)
      else setErro(traduzirErro(error.message))
      setWorkspace(null)
      setLoading(false)
      return
    }

    if (!data) {
      setWorkspace(null)
      setLoading(false)
      return
    }

    const empresaRaw = (data as unknown as { empresas: Empresa | Empresa[] | null }).empresas
    const empresa = Array.isArray(empresaRaw) ? empresaRaw[0] : empresaRaw
    if (!empresa) {
      setErro('A empresa vinculada não foi encontrada.')
      setLoading(false)
      return
    }

    setWorkspace({ empresa, papel: (data as { papel: string }).papel })
    setLoading(false)
  }

  useEffect(() => {
    if (!client) {
      setLoading(false)
      return
    }

    client.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) void carregarWorkspace(data.session)
      else setLoading(false)
    })

    const { data: listener } = client.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (newSession) void carregarWorkspace(newSession)
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
        <Link className="brand" to="/"><span>Ciclo</span><strong>Pag</strong></Link>
        <div className="simple-card"><span className="eyebrow">Configuração necessária</span><h1>Conecte o Supabase</h1><p>Cadastre VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas variáveis da Cloudflare e faça um novo deploy.</p><Link className="button" to="/">Voltar ao site</Link></div>
      </div>
    )
  }

  if (loading) return <div className="app-loading"><div className="loading-logo"><span>Ciclo</span><strong>Pag</strong></div><p>Carregando ambiente seguro...</p></div>
  if (!session) return <AuthPanel />

  if (schemaMissing) {
    return (
      <div className="simple-page">
        <Link className="brand" to="/"><span>Ciclo</span><strong>Pag</strong></Link>
        <div className="simple-card"><span className="eyebrow">Banco pendente</span><h1>Execute o SQL inicial</h1><p>Abra o Supabase SQL Editor e execute o arquivo <strong>PASSO_2_SUPABASE.sql</strong> incluído no pacote.</p><button className="button" onClick={() => void carregarWorkspace(session)}>Verificar novamente</button></div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="simple-page">
        <Link className="brand" to="/"><span>Ciclo</span><strong>Pag</strong></Link>
        <div className="simple-card"><span className="eyebrow">Não foi possível carregar</span><h1>Verifique a configuração</h1><p>{erro}</p><button className="button" onClick={() => void carregarWorkspace(session)}>Tentar novamente</button></div>
      </div>
    )
  }

  if (!workspace) return <CompanyOnboarding onCreated={() => carregarWorkspace(session)} />
  return <Dashboard session={session} workspace={workspace} />
}
