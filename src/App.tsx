import { Link, Route, Routes } from 'react-router-dom'
import { supabaseConfigured } from './lib/supabase'

type ModuleCard = {
  title: string
  description: string
  icon: string
}

const modules: ModuleCard[] = [
  { title: 'Controle financeiro', description: 'Contas a pagar e receber, fluxo de caixa, inadimplência e recorrências.', icon: 'R$' },
  { title: 'Clientes e cadastros', description: 'Clientes, fornecedores, funcionários, produtos, serviços e permissões.', icon: 'ID' },
  { title: 'Cobranças', description: 'Mensalidades, Pix, boletos, links de pagamento e histórico financeiro.', icon: '↻' },
  { title: 'Agendamentos', description: 'Serviços, profissionais, disponibilidade, reservas e reagendamentos.', icon: '◷' },
  { title: 'Vendas e PDV', description: 'Orçamentos, vendas, caixa, código de barras, trocas e devoluções.', icon: '▣' },
  { title: 'Estoque', description: 'Entradas, saídas, variações, estoque mínimo e movimentações entre lojas.', icon: '◇' },
  { title: 'Notas fiscais', description: 'Estrutura preparada para NF-e, NFC-e e NFS-e integradas às vendas.', icon: 'N' },
  { title: 'Contratos', description: 'Vigência, renovação, anexos, reajustes e assinatura eletrônica futura.', icon: '✎' },
  { title: 'Chamados', description: 'Atendimento organizado com responsáveis, prioridades, mensagens e anexos.', icon: '…' },
  { title: 'Relatórios', description: 'Indicadores financeiros, vendas, clientes, agenda, estoque e exportações.', icon: '↗' },
  { title: 'Lojas e filiais', description: 'Unidades, caixas, agendas, equipes e estoques separados ou consolidados.', icon: '⌂' },
  { title: 'Integrações', description: 'Pagamentos, bancos, e-commerce, calendário, assinatura digital e API.', icon: '∞' },
]

const segments = [
  'Academias e personal trainers',
  'Salões, barbearias e estética',
  'Assistências técnicas',
  'Cursos e escolas',
  'Empresas de manutenção',
  'Prestadores de serviços',
]

function Brand() {
  return (
    <Link className="brand" to="/" aria-label="CicloPag - página inicial">
      <span>Ciclo</span><strong>Pag</strong>
    </Link>
  )
}

function LandingPage() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <Brand />
        <nav aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#segmentos">Segmentos</a>
          <a href="#marca">Marca própria</a>
          <Link className="button button-small button-ghost" to="/app">Entrar</Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">Gestão empresarial modular</span>
            <h1>O ciclo completo da sua empresa.</h1>
            <p>
              Clientes, cobranças, agendamentos, contratos e atendimento em uma plataforma que cresce junto com o seu negócio.
            </p>
            <div className="hero-actions">
              <a className="button" href="#recursos">Conhecer recursos</a>
              <Link className="button button-secondary" to="/portal/demonstracao">Ver portal do cliente</Link>
            </div>
            <div className="trust-row">
              <span>✓ Marca própria</span>
              <span>✓ Módulos ativáveis</span>
              <span>✓ Portal do cliente</span>
            </div>
          </div>

          <div className="hero-dashboard" aria-label="Prévia do painel CicloPag">
            <div className="mock-header">
              <span className="mock-dot" />
              <span>Painel da empresa</span>
              <small>Visão geral</small>
            </div>
            <div className="metric-grid">
              <article><small>Recebido no mês</small><strong>R$ 18.420</strong><span>+12,4%</span></article>
              <article><small>Clientes ativos</small><strong>248</strong><span>+16 novos</span></article>
              <article><small>Agendamentos hoje</small><strong>21</strong><span>4 disponíveis</span></article>
              <article><small>Valores pendentes</small><strong>R$ 2.180</strong><span>9 cobranças</span></article>
            </div>
            <div className="chart-card">
              <div className="chart-title"><strong>Receitas</strong><span>Últimos 6 meses</span></div>
              <div className="bars" aria-hidden="true">
                {[42, 58, 51, 70, 82, 94].map((value) => <i key={value} style={{ height: `${value}%` }} />)}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="recursos">
          <div className="section-heading">
            <span className="eyebrow">Tudo integrado</span>
            <h2>Ative somente os módulos que sua empresa precisa</h2>
            <p>Uma única plataforma, com experiência simples para a equipe e para o cliente final.</p>
          </div>
          <div className="module-grid">
            {modules.map((module) => (
              <article className="module-card" key={module.title}>
                <span className="module-icon">{module.icon}</span>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section split-section" id="marca">
          <div>
            <span className="eyebrow">Sua marca em primeiro lugar</span>
            <h2>O portal parece feito exclusivamente para sua empresa</h2>
            <p>
              Personalize nome, logotipo, cores, slogan, contatos, banners e formas de pagamento. Cada cliente acessa um ambiente organizado com a identidade do seu negócio.
            </p>
            <ul className="check-list">
              <li>Portal do cliente personalizado</li>
              <li>PWA instalável no celular</li>
              <li>Funcionários e permissões</li>
              <li>Dados separados com segurança por empresa</li>
            </ul>
          </div>
          <div className="portal-preview">
            <div className="phone-speaker" />
            <div className="portal-brand">Sua Empresa</div>
            <p>Olá, João!</p>
            <div className="status-card"><span>Plano ativo</span><strong>Premium</strong><small>Próximo vencimento: 10/08</small></div>
            <button>Pagar agora</button>
            <div className="portal-links"><span>Mensalidades</span><span>Agendar</span><span>Contratos</span><span>Suporte</span></div>
          </div>
        </section>

        <section className="section soft-section" id="segmentos">
          <div className="section-heading">
            <span className="eyebrow">Feito para negócios reais</span>
            <h2>Um sistema que se adapta ao seu segmento</h2>
          </div>
          <div className="segment-grid">
            {segments.map((segment, index) => <div key={segment}><span>{String(index + 1).padStart(2, '0')}</span>{segment}</div>)}
          </div>
        </section>

        <section className="cta-section">
          <div>
            <span className="eyebrow eyebrow-light">CicloPag</span>
            <h2>Organize a empresa hoje e prepare o crescimento de amanhã.</h2>
            <p>A primeira versão está sendo construída com foco em clientes, mensalidades, portal, contratos, chamados e agendamentos.</p>
          </div>
          <Link className="button button-light" to="/app">Acessar área do sistema</Link>
        </section>
      </main>

      <footer>
        <Brand />
        <p>O ciclo completo da sua empresa.</p>
        <small>© 2026 CicloPag. Plataforma em desenvolvimento.</small>
      </footer>
    </div>
  )
}

function SystemPage() {
  return (
    <div className="simple-page">
      <Brand />
      <div className="simple-card">
        <span className="eyebrow">Painel CicloPag</span>
        <h1>Área do sistema em construção</h1>
        <p>A base do projeto já está publicada. O próximo passo será implementar autenticação, empresas, clientes e permissões.</p>
        <div className={`config-status ${supabaseConfigured ? 'ready' : ''}`}>
          <strong>Supabase:</strong> {supabaseConfigured ? 'configurado' : 'aguardando a chave pública nas variáveis da Cloudflare'}
        </div>
        <Link className="button" to="/">Voltar ao site</Link>
      </div>
    </div>
  )
}

function ClientPortalPage() {
  return (
    <div className="simple-page portal-page">
      <Brand />
      <div className="simple-card">
        <span className="eyebrow">Demonstração</span>
        <h1>Portal do cliente</h1>
        <p>Esta rota receberá a marca e os dados específicos de cada empresa cadastrada no CicloPag.</p>
        <div className="demo-list"><span>Plano e mensalidades</span><span>Pix e pagamentos</span><span>Agendamentos</span><span>Contratos e chamados</span></div>
        <Link className="button" to="/">Voltar ao site</Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<SystemPage />} />
      <Route path="/portal/:slug" element={<ClientPortalPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}

export default App
