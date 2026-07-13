export type OperationalDefinition = {
  id: string
  title: string
  singular: string
  section: string
  icon: string
  addPageId?: string
  formKind?: FormKind
  description: string
  benefits: string[]
}

export type FormKind =
  | 'cliente'
  | 'fornecedor'
  | 'funcionario'
  | 'transportadora'
  | 'produto'
  | 'servico'
  | 'orcamento'
  | 'venda'
  | 'compra'
  | 'conta-pagar'
  | 'contrato'
  | 'generico'

const definitions: OperationalDefinition[] = [
  {
    id: 'clientes',
    title: 'Clientes',
    singular: 'cliente',
    section: 'Cadastros',
    icon: '♟',
    addPageId: 'clientes-adicionar',
    formKind: 'cliente',
    description: 'Clientes são empresas ou pessoas para quem você vende produtos e serviços, envia cobranças e mantém relacionamento comercial.',
    benefits: ['Centralizar informações e contatos', 'Criar vendas e orçamentos', 'Gerar cobranças e recebimentos', 'Registrar contratos e atendimentos'],
  },
  {
    id: 'fornecedores',
    title: 'Fornecedores',
    singular: 'fornecedor',
    section: 'Cadastros',
    icon: '▣',
    addPageId: 'fornecedores-adicionar',
    formKind: 'fornecedor',
    description: 'Cadastre empresas e pessoas que fornecem produtos, materiais e serviços para o seu negócio.',
    benefits: ['Organizar dados de compra', 'Controlar contatos e endereços', 'Relacionar produtos fornecidos', 'Acompanhar pagamentos'],
  },
  {
    id: 'funcionarios',
    title: 'Funcionários',
    singular: 'funcionário',
    section: 'Cadastros',
    icon: '♙',
    addPageId: 'funcionarios-adicionar',
    formKind: 'funcionario',
    description: 'Gerencie colaboradores, acessos ao sistema, dados pessoais e regras de comissionamento.',
    benefits: ['Definir permissões', 'Controlar situação do colaborador', 'Registrar documentos e contatos', 'Configurar comissões'],
  },
  {
    id: 'transportadoras',
    title: 'Transportadoras',
    singular: 'transportadora',
    section: 'Cadastros',
    icon: '▰',
    addPageId: 'transportadoras-adicionar',
    formKind: 'transportadora',
    description: 'Organize transportadoras e responsáveis utilizados nas entregas e movimentações da empresa.',
    benefits: ['Registrar contatos', 'Manter endereços atualizados', 'Utilizar em vendas e compras', 'Facilitar cotações de frete'],
  },
  {
    id: 'produtos',
    title: 'Produtos',
    singular: 'produto',
    section: 'Itens',
    icon: '◆',
    addPageId: 'produtos-adicionar',
    formKind: 'produto',
    description: 'Cadastre produtos com códigos, estoque, valores, dados fiscais, fotos, variações e fornecedores.',
    benefits: ['Controlar estoque', 'Utilizar em vendas e compras', 'Emitir documentos fiscais', 'Organizar custos e preços'],
  },
  {
    id: 'servicos',
    title: 'Serviços',
    singular: 'serviço',
    section: 'Itens',
    icon: '⚒',
    addPageId: 'servicos-adicionar',
    formKind: 'servico',
    description: 'Cadastre os serviços oferecidos, preços, duração, comissão e informações fiscais.',
    benefits: ['Criar orçamentos', 'Registrar vendas de serviços', 'Gerar ordens de serviço', 'Relacionar contratos e agenda'],
  },
  {
    id: 'orcamentos-produtos',
    title: 'Orçamentos de produtos',
    singular: 'orçamento',
    section: 'Orçamentos',
    icon: '▧',
    addPageId: 'orcamentos-produtos-adicionar',
    formKind: 'orcamento',
    description: 'Crie propostas com produtos, serviços, condições de pagamento, frete e observações.',
    benefits: ['Enviar propostas completas', 'Controlar validade', 'Converter em venda', 'Registrar anexos e condições'],
  },
  {
    id: 'orcamentos-servicos',
    title: 'Orçamentos de serviços',
    singular: 'orçamento',
    section: 'Orçamentos',
    icon: '▧',
    addPageId: 'orcamentos-servicos-adicionar',
    formKind: 'orcamento',
    description: 'Crie propostas de serviços com itens, condições, prazos, anexos e observações.',
    benefits: ['Enviar propostas completas', 'Controlar validade', 'Converter em venda', 'Registrar anexos e condições'],
  },
  {
    id: 'vendas-produtos',
    title: 'Vendas de produtos',
    singular: 'venda',
    section: 'Vendas',
    icon: '▰',
    addPageId: 'vendas-produtos-adicionar',
    formKind: 'venda',
    description: 'Registre vendas, produtos, serviços, descontos, pagamento, entrega e anexos.',
    benefits: ['Baixar estoque', 'Gerar contas a receber', 'Controlar vendedores', 'Acompanhar valores e entregas'],
  },
  {
    id: 'vendas-servicos',
    title: 'Vendas de serviços',
    singular: 'venda',
    section: 'Vendas',
    icon: '▰',
    addPageId: 'vendas-servicos-adicionar',
    formKind: 'venda',
    description: 'Registre vendas de serviços, responsáveis, prazos, pagamentos e observações.',
    benefits: ['Gerar recebimentos', 'Controlar responsáveis', 'Relacionar ordens de serviço', 'Acompanhar resultados'],
  },
  {
    id: 'estoque-compras',
    title: 'Compras',
    singular: 'compra',
    section: 'Estoque',
    icon: '▥',
    addPageId: 'compras-adicionar',
    formKind: 'compra',
    description: 'Registre compras de fornecedores e atualize estoque, custos e contas a pagar.',
    benefits: ['Atualizar estoque', 'Controlar fornecedores', 'Registrar número da NF-e', 'Gerar pagamentos'],
  },
  {
    id: 'contas-pagar',
    title: 'Contas a pagar',
    singular: 'pagamento',
    section: 'Financeiro',
    icon: '▣',
    addPageId: 'contas-pagar-adicionar',
    formKind: 'conta-pagar',
    description: 'Organize despesas, vencimentos, formas de pagamento, contas bancárias e recorrências.',
    benefits: ['Controlar vencimentos', 'Evitar atrasos', 'Organizar centros de custo', 'Acompanhar fluxo de caixa'],
  },
  {
    id: 'contratos-servicos',
    title: 'Contratos de serviços',
    singular: 'contrato',
    section: 'Contratos',
    icon: '▱',
    addPageId: 'contratos-adicionar',
    formKind: 'contrato',
    description: 'Gerencie contratos de serviços, períodos, responsáveis, valores e condições de pagamento.',
    benefits: ['Controlar vigências', 'Criar cobranças recorrentes', 'Relacionar clientes e serviços', 'Armazenar anexos'],
  },
]

export const operationalDefinitions = Object.fromEntries(definitions.map((definition) => [definition.id, definition])) as Record<string, OperationalDefinition>

export const formRoutes: Record<string, { basePageId: string; kind: FormKind; title: string; section: string }> = {
  'clientes-adicionar': { basePageId: 'clientes', kind: 'cliente', title: 'Adicionar cliente', section: 'Clientes' },
  'fornecedores-adicionar': { basePageId: 'fornecedores', kind: 'fornecedor', title: 'Adicionar fornecedor', section: 'Fornecedores' },
  'funcionarios-adicionar': { basePageId: 'funcionarios', kind: 'funcionario', title: 'Adicionar funcionário', section: 'Funcionários' },
  'transportadoras-adicionar': { basePageId: 'transportadoras', kind: 'transportadora', title: 'Adicionar transportadora', section: 'Transportadoras' },
  'produtos-adicionar': { basePageId: 'produtos', kind: 'produto', title: 'Adicionar produto', section: 'Produtos' },
  'servicos-adicionar': { basePageId: 'servicos', kind: 'servico', title: 'Adicionar serviço', section: 'Serviços' },
  'orcamentos-produtos-adicionar': { basePageId: 'orcamentos-produtos', kind: 'orcamento', title: 'Adicionar orçamento', section: 'Orçamentos de produtos' },
  'orcamentos-servicos-adicionar': { basePageId: 'orcamentos-servicos', kind: 'orcamento', title: 'Adicionar orçamento', section: 'Orçamentos de serviços' },
  'orcamentos-adicionar': { basePageId: 'orcamentos-servicos', kind: 'orcamento', title: 'Adicionar orçamento', section: 'Orçamentos de serviços' },
  'vendas-produtos-adicionar': { basePageId: 'vendas-produtos', kind: 'venda', title: 'Adicionar venda', section: 'Vendas de produtos' },
  'vendas-servicos-adicionar': { basePageId: 'vendas-servicos', kind: 'venda', title: 'Adicionar venda', section: 'Vendas de serviços' },
  'vendas-adicionar': { basePageId: 'vendas-servicos', kind: 'venda', title: 'Adicionar venda', section: 'Vendas de serviços' },
  'compras-adicionar': { basePageId: 'estoque-compras', kind: 'compra', title: 'Adicionar compra', section: 'Compras' },
  'contas-pagar-adicionar': { basePageId: 'contas-pagar', kind: 'conta-pagar', title: 'Adicionar pagamento', section: 'Contas a pagar' },
  'contratos-adicionar': { basePageId: 'contratos-servicos', kind: 'contrato', title: 'Adicionar contrato', section: 'Contratos de serviços' },
}

export function getOperationalPageInfo(pageId: string) {
  const form = formRoutes[pageId]
  if (form) return { title: form.title, section: form.section }
  const definition = operationalDefinitions[pageId]
  if (definition) return { title: definition.title, section: definition.section }
  if (pageId.endsWith('-adicionar')) {
    const base = pageId.replace(/-adicionar$/, '')
    return { title: 'Adicionar registro', section: operationalDefinitions[base]?.title ?? 'CicloPag' }
  }
  return null
}
