export type MenuNode = {
  id: string
  label: string
  icon: string
  children?: MenuNode[]
}

export const erpMenu: MenuNode[] = [
  {
    id: 'cadastros', label: 'Cadastros', icon: 'cadastros', children: [
      { id: 'clientes', label: 'Clientes', icon: 'clientes' },
      { id: 'fornecedores', label: 'Fornecedores', icon: 'fornecedores' },
      { id: 'funcionarios', label: 'Funcionários', icon: 'funcionarios' },
      { id: 'transportadoras', label: 'Transportadoras', icon: 'transportadoras' },
      {
        id: 'cadastros-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'cadastros-tipos-contatos', label: 'Tipos de contatos', icon: 'tipos-contatos' },
          { id: 'cadastros-tipos-enderecos', label: 'Tipos de endereços', icon: 'tipos-enderecos' },
          { id: 'cadastros-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
        ],
      },
    ],
  },
  {
    id: 'itens', label: 'Itens', icon: 'itens', children: [
      { id: 'produtos', label: 'Produtos', icon: 'produtos' },
      { id: 'servicos', label: 'Serviços', icon: 'servicos' },
      {
        id: 'itens-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'itens-etiquetas', label: 'Etiquetas', icon: 'etiquetas' },
          { id: 'itens-valores-venda', label: 'Valores de venda', icon: 'valores-venda' },
          { id: 'itens-grupos-produtos', label: 'Grupos de produtos', icon: 'grupos-produtos' },
          { id: 'itens-unidades-produtos', label: 'Unidades de produtos', icon: 'unidades-produtos' },
          { id: 'grades-variacoes', label: 'Grades/variações', icon: 'grades-variacoes' },
          { id: 'itens-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
        ],
      },
    ],
  },
  {
    id: 'orcamentos', label: 'Orçamentos', icon: 'orcamentos', children: [
      { id: 'orcamentos-produtos', label: 'Produtos', icon: 'produtos' },
      { id: 'orcamentos-servicos', label: 'Serviços', icon: 'servicos' },
      {
        id: 'orcamentos-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'orcamentos-situacoes', label: 'Situações', icon: 'situacoes' },
          { id: 'orcamentos-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
          { id: 'orcamentos-modelo-email', label: 'Modelo de e-mail', icon: 'modelo-email' },
          { id: 'orcamentos-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  {
    id: 'vendas', label: 'Vendas', icon: 'vendas', children: [
      { id: 'vendas-produtos', label: 'Produtos', icon: 'produtos' },
      { id: 'vendas-servicos', label: 'Serviços', icon: 'servicos' },
      { id: 'vendas-balcao', label: 'Balcão', icon: 'balcao' },
      { id: 'vendas-devolucoes', label: 'Devoluções', icon: 'devolucoes' },
      {
        id: 'vendas-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'vendas-situacoes', label: 'Situações', icon: 'situacoes' },
          { id: 'vendas-canais', label: 'Canais', icon: 'canais' },
          { id: 'vendas-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
          { id: 'vendas-modelo-email', label: 'Modelo de e-mail', icon: 'modelo-email' },
          { id: 'vendas-balancas', label: 'Balanças', icon: 'balancas' },
          { id: 'vendas-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  {
    id: 'ordens-servicos', label: 'Ordens de serviços', icon: 'ordens-servicos', children: [
      { id: 'os-gerenciar', label: 'Gerenciar O.S.', icon: 'gerenciar-os' },
      { id: 'os-painel', label: 'Painel', icon: 'painel' },
      {
        id: 'os-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'os-situacoes', label: 'Situações', icon: 'situacoes' },
          { id: 'os-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
          { id: 'os-modelos-email', label: 'Modelos de e-mail', icon: 'modelos-emails' },
          { id: 'os-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  {
    id: 'estoque', label: 'Estoque', icon: 'estoque', children: [
      { id: 'estoque-movimentacoes', label: 'Movimentações', icon: 'movimentacoes' },
      { id: 'estoque-ajustes', label: 'Ajustes', icon: 'ajustes' },
      { id: 'estoque-transferencias', label: 'Transferências', icon: 'transferencias' },
      { id: 'estoque-cotacoes', label: 'Cotações', icon: 'cotacoes' },
    ],
  },
  {
    id: 'compras', label: 'Compras', icon: 'compras', children: [
      { id: 'compras-produtos', label: 'Produtos', icon: 'produtos' },
      { id: 'compras-servicos', label: 'Serviços', icon: 'servicos' },
      {
        id: 'compras-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'compras-situacoes', label: 'Situações de compras', icon: 'situacoes-compra' },
          { id: 'compras-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
          { id: 'compras-modelo-email', label: 'Modelo de e-mail', icon: 'modelo-email' },
          { id: 'compras-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  {
    id: 'financeiro', label: 'Financeiro', icon: 'financeiro', children: [
      { id: 'contas-pagar', label: 'Contas a pagar', icon: 'contas-pagar' },
      { id: 'contas-receber', label: 'Contas a receber', icon: 'contas-receber' },
      { id: 'financeiro-dre', label: 'DRE gerencial', icon: 'dre' },
      { id: 'financeiro-fluxo-caixa', label: 'Fluxo de caixa', icon: 'fluxo-caixa' },
      {
        id: 'boletos-bancarios', label: 'Boletos bancários', icon: 'boletos-bancarios', children: [
          { id: 'boletos-gerenciar', label: 'Gerenciar boletos', icon: 'gerenciar-boletos' },
          { id: 'boletos-exportar-remessa', label: 'Exportar remessa', icon: 'exportar-remessa' },
          { id: 'boletos-importar-retorno', label: 'Importar retorno', icon: 'importar-retorno' },
        ],
      },
      {
        id: 'financeiro-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'financeiro-caixas', label: 'Caixas', icon: 'caixas' },
          { id: 'contas-bancarias', label: 'Contas bancárias', icon: 'contas-bancarias' },
          { id: 'formas-pagamento', label: 'Formas de pagamento', icon: 'formas-pagamento' },
          { id: 'financeiro-plano-contas', label: 'Plano de contas', icon: 'plano-contas' },
          { id: 'financeiro-situacoes', label: 'Situações', icon: 'situacoes' },
          { id: 'financeiro-centros-custos', label: 'Centros de custos', icon: 'centros-custos' },
          { id: 'financeiro-conciliacao-bancaria', label: 'Conciliação bancária', icon: 'conciliacao-bancaria' },
          { id: 'financeiro-transferencias', label: 'Transferências', icon: 'transferencias' },
          { id: 'financeiro-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
          { id: 'financeiro-modelos-email', label: 'Modelos de e-mails', icon: 'modelos-emails' },
          { id: 'financeiro-tabelas-rateios', label: 'Tabelas de rateios', icon: 'tabelas-rateios' },
          { id: 'financeiro-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  {
    id: 'fiscal', label: 'Fiscal', icon: 'fiscal', children: [
      { id: 'fiscal-notas-produtos', label: 'Notas de produtos', icon: 'notas-produtos' },
      { id: 'fiscal-notas-servicos', label: 'Notas de serviços', icon: 'notas-servicos' },
      { id: 'fiscal-notas-consumidor', label: 'Notas do consumidor', icon: 'notas-consumidor' },
      { id: 'fiscal-notas-compras', label: 'Notas de compras', icon: 'notas-compras' },
      {
        id: 'fiscal-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'fiscal-importar-xml', label: 'Importar XML', icon: 'importar-xml' },
          { id: 'fiscal-certificado-digital', label: 'Certificado digital', icon: 'certificado-digital' },
          { id: 'fiscal-naturezas-operacoes', label: 'Naturezas de operações', icon: 'naturezas-operacoes' },
          { id: 'fiscal-tributacoes', label: 'Tributações', icon: 'tributacoes' },
          { id: 'fiscal-atividades-servicos', label: 'Atividades de serviços', icon: 'atividades-servicos' },
          { id: 'fiscal-modelos-email', label: 'Modelos de e-mails', icon: 'modelos-emails' },
          { id: 'fiscal-intermediadores', label: 'Intermediadores', icon: 'intermediadores' },
          { id: 'fiscal-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  {
    id: 'contratos', label: 'Contratos', icon: 'contratos', children: [
      { id: 'contratos-servicos', label: 'Serviços', icon: 'servicos' },
      { id: 'contratos-locacoes', label: 'Locações', icon: 'locacoes' },
      { id: 'contratos-assinaturas', label: 'Assinaturas', icon: 'assinaturas' },
      {
        id: 'contratos-opcoes', label: 'Opções auxiliares', icon: 'opcoes-auxiliares', children: [
          { id: 'contratos-situacoes', label: 'Situações', icon: 'situacoes' },
          { id: 'contratos-campos-extras', label: 'Campos extras', icon: 'campos-extras' },
          { id: 'contratos-modelos-email', label: 'Modelos de e-mails', icon: 'modelos-emails' },
          { id: 'contratos-configuracoes', label: 'Configurações', icon: 'configuracoes' },
        ],
      },
    ],
  },
  { id: 'atendimentos', label: 'Atendimentos', icon: 'atendimentos' },
  {
    id: 'relatorios', label: 'Relatórios', icon: 'relatorios', children: [
      { id: 'relatorios-cadastros', label: 'Cadastros', icon: 'cadastros' },
      { id: 'relatorios-vendas', label: 'Vendas', icon: 'vendas' },
      { id: 'relatorios-ordens-servicos', label: 'Ordens de serviços', icon: 'ordens-servicos' },
      { id: 'relatorios-estoque', label: 'Estoque', icon: 'estoque' },
      { id: 'relatorios-financeiro', label: 'Financeiro', icon: 'financeiro' },
      { id: 'relatorios-contratos', label: 'Contratos', icon: 'contratos' },
      { id: 'relatorios-fiscal', label: 'Fiscal', icon: 'fiscal' },
      { id: 'relatorios-logs-sistema', label: 'Logs do sistema', icon: 'logs-sistema' },
    ],
  },
  {
    id: 'configuracoes', label: 'Configurações', icon: 'configuracoes', children: [
      { id: 'config-gerais', label: 'Gerais', icon: 'gerais' },
      { id: 'meu-plano', label: 'Meu plano', icon: 'meu-plano' },
      { id: 'usuarios', label: 'Usuários', icon: 'usuarios' },
      { id: 'dados-empresa', label: 'Dados da empresa', icon: 'dados-empresa' },
      { id: 'marca-empresa', label: 'Marca da empresa', icon: 'marca-empresa' },
      { id: 'empresas-lojas', label: 'Empresas / Lojas', icon: 'empresas-lojas' },
      { id: 'certificado-digital', label: 'Certificado digital', icon: 'certificado-digital' },
      { id: 'modelos-email', label: 'Modelos de e-mails', icon: 'modelos-emails' },
      { id: 'avisos-email', label: 'Avisos por e-mail', icon: 'avisos-email' },
    ],
  },
]

export const pageTitles: Record<string, { title: string; section: string }> = {
  inicio: { title: 'Início', section: 'Painel' },
}

function fillTitles(nodes: MenuNode[], rootSection?: string) {
  for (const node of nodes) {
    const section = rootSection ?? node.label
    pageTitles[node.id] = { title: node.label, section }
    if (node.children?.length) fillTitles(node.children, section)
  }
}

fillTitles(erpMenu)
