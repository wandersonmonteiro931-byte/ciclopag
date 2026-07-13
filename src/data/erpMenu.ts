export type MenuItem = {
  id: string
  label: string
  icon: string
  children?: Array<{ id: string; label: string }>
}

export const erpMenu: MenuItem[] = [
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: '▤',
    children: [
      { id: 'clientes', label: 'Clientes' },
      { id: 'fornecedores', label: 'Fornecedores' },
      { id: 'funcionarios', label: 'Funcionários' },
      { id: 'transportadoras', label: 'Transportadoras' },
      { id: 'cadastros-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'itens',
    label: 'Itens',
    icon: '▥',
    children: [
      { id: 'produtos', label: 'Produtos' },
      { id: 'servicos', label: 'Serviços' },
      { id: 'itens-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'orcamentos',
    label: 'Orçamentos',
    icon: '▧',
    children: [
      { id: 'orcamentos-produtos', label: 'Produtos' },
      { id: 'orcamentos-servicos', label: 'Serviços' },
      { id: 'orcamentos-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'vendas',
    label: 'Vendas',
    icon: '▰',
    children: [
      { id: 'vendas-produtos', label: 'Produtos' },
      { id: 'vendas-servicos', label: 'Serviços' },
      { id: 'vendas-balcao', label: 'Balcão' },
      { id: 'vendas-devolucoes', label: 'Devoluções' },
      { id: 'vendas-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'ordens-servico',
    label: 'Ordens de serviços',
    icon: '⚒',
    children: [
      { id: 'os-gerenciar', label: 'Gerenciar O.S.' },
      { id: 'os-painel', label: 'Painel' },
      { id: 'os-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'estoque',
    label: 'Estoque',
    icon: '◆',
    children: [
      { id: 'estoque-movimentacoes', label: 'Movimentações' },
      { id: 'estoque-ajustes', label: 'Ajustes' },
      { id: 'estoque-transferencias', label: 'Transferências' },
      { id: 'estoque-cotacoes', label: 'Cotações' },
      { id: 'estoque-compras', label: 'Compras' },
      { id: 'estoque-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: '▣',
    children: [
      { id: 'contas-pagar', label: 'Contas a pagar' },
      { id: 'contas-receber', label: 'Contas a receber' },
      { id: 'dre', label: 'DRE gerencial' },
      { id: 'fluxo-caixa', label: 'Fluxo de caixa' },
      { id: 'boletos', label: 'Boletos bancários' },
      { id: 'financeiro-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal',
    icon: '⌘',
    children: [
      { id: 'notas-produtos', label: 'Notas de produtos' },
      { id: 'notas-servicos', label: 'Notas de serviços' },
      { id: 'notas-consumidor', label: 'Notas do consumidor' },
      { id: 'notas-compras', label: 'Notas de compras' },
      { id: 'fiscal-opcoes', label: 'Opções auxiliares' },
    ],
  },
  {
    id: 'contratos',
    label: 'Contratos',
    icon: '▱',
    children: [
      { id: 'contratos-servicos', label: 'Serviços' },
      { id: 'contratos-locacoes', label: 'Locações' },
      { id: 'contratos-assinaturas', label: 'Assinaturas' },
      { id: 'contratos-opcoes', label: 'Opções auxiliares' },
    ],
  },
  { id: 'atendimentos', label: 'Atendimentos', icon: '●' },
  { id: 'relatorios', label: 'Relatórios', icon: '▩' },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: '⚙',
    children: [
      { id: 'config-gerais', label: 'Gerais' },
      { id: 'meu-plano', label: 'Meu plano' },
      { id: 'usuarios', label: 'Usuários' },
      { id: 'dados-empresa', label: 'Dados da empresa' },
      { id: 'marca-empresa', label: 'Marca da empresa' },
      { id: 'empresas-lojas', label: 'Empresas / Lojas' },
      { id: 'certificado-digital', label: 'Certificado digital' },
      { id: 'modelos-email', label: 'Modelos de e-mails' },
      { id: 'avisos-email', label: 'Avisos por e-mail' },
    ],
  },
]

export const pageTitles: Record<string, { title: string; section: string }> = {
  inicio: { title: 'Início', section: 'Painel' },
}

for (const item of erpMenu) {
  pageTitles[item.id] = { title: item.label, section: item.label }
  for (const child of item.children ?? []) {
    pageTitles[child.id] = { title: child.label, section: item.label }
  }
}
