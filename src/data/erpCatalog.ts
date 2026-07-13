export type PermissionAction = 'visualizar' | 'cadastrar' | 'editar' | 'excluir' | 'imprimir' | 'emitir'

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'datetime-local'
  | 'number'
  | 'money'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'color'
  | 'password'

export type FieldSpec = {
  key: string
  label: string
  type?: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
  help?: string
  width?: 'quarter' | 'third' | 'half' | 'two-thirds' | 'full'
  defaultValue?: string | boolean
  showWhen?: { key: string; equals: string | boolean }
}

export type RepeatableColumn = {
  key: string
  label: string
  type?: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}

export type RepeatableSpec = {
  key: string
  title: string
  icon?: string
  addLabel: string
  columns: RepeatableColumn[]
  minimumRows?: number
  calculateSubtotal?: boolean
}

export type SectionSpec = {
  id: string
  title: string
  icon?: string
  description?: string
  fields?: FieldSpec[]
  repeatables?: RepeatableSpec[]
}

export type TabSpec = {
  id: string
  label: string
  sections: SectionSpec[]
}

export type ModuleDefinition = {
  id: string
  title: string
  singular: string
  section: string
  icon: string
  description: string
  benefits: string[]
  primaryField: string
  statusField?: string
  totalField?: string
  tabs: TabSpec[]
  actions?: string[]
  integrationActions?: string[]
}

const activeOptions = ['Ativo', 'Inativo']
const personOptions = ['Pessoa física', 'Pessoa jurídica', 'Estrangeiro']
const yesNo = ['Sim', 'Não']
const saleChannels = ['Presencial', 'Telefone', 'WhatsApp', 'E-commerce', 'Marketplace', 'Outro']
const paymentModes = ['Dinheiro', 'Pix', 'Cartão de crédito', 'Cartão de débito', 'Boleto', 'Transferência', 'Outro']
const states = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const addresses: RepeatableSpec = {
  key: 'enderecos',
  title: 'Endereços',
  icon: '⌖',
  addLabel: 'Adicionar endereço',
  minimumRows: 1,
  columns: [
    { key: 'tipo', label: 'Tipo', options: ['Principal', 'Comercial', 'Residencial', 'Cobrança', 'Entrega', 'Outro'] },
    { key: 'cep', label: 'CEP', placeholder: '00000-000' },
    { key: 'logradouro', label: 'Logradouro' },
    { key: 'numero', label: 'Número' },
    { key: 'complemento', label: 'Complemento' },
    { key: 'bairro', label: 'Bairro' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'UF', options: states },
  ],
}

const contacts: RepeatableSpec = {
  key: 'contatos',
  title: 'Contatos',
  icon: '☎',
  addLabel: 'Adicionar contato',
  minimumRows: 1,
  columns: [
    { key: 'tipo', label: 'Tipo', options: ['Comercial', 'Financeiro', 'Pessoal', 'WhatsApp', 'Outro'] },
    { key: 'nome', label: 'Nome do contato' },
    { key: 'cargo', label: 'Cargo / função' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'celular', label: 'Celular / WhatsApp' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'observacoes', label: 'Observações' },
  ],
}

const productItems: RepeatableSpec = {
  key: 'produtos',
  title: 'Produtos',
  icon: '◆',
  addLabel: 'Adicionar produto',
  minimumRows: 1,
  calculateSubtotal: true,
  columns: [
    { key: 'item', label: 'Produto', required: true, placeholder: 'Digite para buscar' },
    { key: 'detalhes', label: 'Detalhes' },
    { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
    { key: 'unidade', label: 'Unidade', options: ['UN', 'CX', 'KG', 'M', 'M²', 'L', 'PC'] },
    { key: 'valor', label: 'Valor unitário', type: 'money', required: true },
    { key: 'desconto', label: 'Desconto', type: 'money' },
  ],
}

const serviceItems: RepeatableSpec = {
  key: 'servicos',
  title: 'Serviços',
  icon: '⚒',
  addLabel: 'Adicionar serviço',
  minimumRows: 1,
  calculateSubtotal: true,
  columns: [
    { key: 'item', label: 'Serviço', required: true, placeholder: 'Digite para buscar' },
    { key: 'detalhes', label: 'Detalhes' },
    { key: 'quantidade', label: 'Quantidade', type: 'number', required: true },
    { key: 'valor', label: 'Valor unitário', type: 'money', required: true },
    { key: 'desconto', label: 'Desconto', type: 'money' },
  ],
}

const paymentRows: RepeatableSpec = {
  key: 'pagamentos',
  title: 'Condições de pagamento',
  icon: '▣',
  addLabel: 'Adicionar parcela',
  minimumRows: 1,
  columns: [
    { key: 'forma', label: 'Forma de pagamento', options: paymentModes, required: true },
    { key: 'vencimento', label: 'Vencimento', type: 'date', required: true },
    { key: 'valor', label: 'Valor', type: 'money', required: true },
    { key: 'plano_contas', label: 'Plano de contas' },
    { key: 'conta_bancaria', label: 'Conta bancária' },
  ],
}

const attachmentSection: SectionSpec = {
  id: 'anexos',
  title: 'Anexos',
  icon: '▤',
  description: 'Anexe arquivos e documentos de até 5 MB. Os arquivos são armazenados de forma separada por empresa.',
}

const notesSection: SectionSpec = {
  id: 'observacoes',
  title: 'Observações',
  icon: '✎',
  fields: [
    { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' },
    { key: 'observacoes_internas', label: 'Observações internas', type: 'textarea', width: 'full', help: 'Não serão exibidas em documentos enviados ao cliente.' },
  ],
}

const generalActions = ['Visualizar', 'Editar', 'Excluir', 'Copiar', 'Alterar situação', 'Imprimir em A4', 'Exportar', 'Consultar histórico']

const modules: ModuleDefinition[] = [
  {
    id: 'clientes', title: 'Clientes', singular: 'cliente', section: 'Cadastros', icon: '♟',
    description: 'Empresas ou pessoas para quem sua empresa vende produtos e serviços, emite documentos e mantém relacionamento.',
    benefits: ['Centralizar dados pessoais e financeiros', 'Vincular vendas, contratos e atendimentos', 'Importar por planilha ou XML', 'Liberar acesso à Área do Cliente'],
    primaryField: 'nome', statusField: 'situacao',
    tabs: [
      { id: 'dados', label: 'Dados gerais', sections: [{ id: 'dados-gerais', title: 'Dados gerais', icon: '✎', fields: [
        { key: 'tipo_pessoa', label: 'Tipo de cliente', type: 'select', options: personOptions, required: true, defaultValue: 'Pessoa física' },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, required: true, defaultValue: 'Ativo' },
        { key: 'nome', label: 'Nome ou razão social', required: true },
        { key: 'nome_fantasia', label: 'Nome fantasia' },
        { key: 'cpf_cnpj', label: 'CPF ou CNPJ' },
        { key: 'rg', label: 'RG' },
        { key: 'inscricao_estadual', label: 'Inscrição estadual' },
        { key: 'inscricao_municipal', label: 'Inscrição municipal' },
        { key: 'data_nascimento', label: 'Data de nascimento', type: 'date' },
        { key: 'sexo', label: 'Sexo', type: 'select', options: ['Feminino', 'Masculino', 'Outro', 'Não informar'] },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'telefone_comercial', label: 'Telefone comercial', type: 'tel' },
        { key: 'telefone_celular', label: 'Telefone celular / WhatsApp', type: 'tel' },
        { key: 'fax', label: 'FAX', type: 'tel' },
        { key: 'site', label: 'Site' },
        { key: 'vendedor_responsavel', label: 'Vendedor / responsável' },
      ] }] },
      { id: 'enderecos', label: 'Endereços', sections: [{ id: 'enderecos', title: 'Endereços', repeatables: [addresses] }] },
      { id: 'contatos', label: 'Contatos', sections: [{ id: 'contatos', title: 'Contatos', repeatables: [contacts] }] },
      { id: 'financeiro', label: 'Financeiro', sections: [{ id: 'financeiro', title: 'Financeiro', icon: '▣', fields: [
        { key: 'limite_credito', label: 'Limite de crédito', type: 'money', help: 'Deixe em branco para não limitar.' },
        { key: 'ultrapassar_limite', label: 'Permitir ultrapassar o limite de crédito', type: 'checkbox' },
        { key: 'categoria_financeira', label: 'Categoria financeira' },
        { key: 'plano_contas', label: 'Plano de contas' },
      ] }] },
      { id: 'foto', label: 'Foto', sections: [{ id: 'foto', title: 'Foto', description: 'Envie uma imagem JPG, PNG ou GIF de até 5 MB.' }] },
      { id: 'anexos', label: 'Anexos', sections: [attachmentSection] },
      { id: 'observacoes', label: 'Observações', sections: [notesSection] },
    ],
    actions: [...generalActions, 'Ativar ou inativar', 'Importar planilha', 'Importar XML', 'Enviar convite da Área do Cliente'],
    integrationActions: ['Enviar convite por e-mail', 'Enviar por WhatsApp'],
  },
  {
    id: 'fornecedores', title: 'Fornecedores', singular: 'fornecedor', section: 'Cadastros', icon: '▣',
    description: 'Pessoas e empresas que fornecem produtos, insumos e serviços.',
    benefits: ['Vincular compras e cotações', 'Usar em contas a pagar', 'Vincular produtos', 'Importar por planilha'],
    primaryField: 'nome', statusField: 'situacao',
    tabs: [
      { id: 'dados', label: 'Dados gerais', sections: [{ id: 'dados-gerais', title: 'Dados gerais', fields: [
        { key: 'tipo_pessoa', label: 'Tipo de fornecedor', type: 'select', options: personOptions, required: true },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, required: true, defaultValue: 'Ativo' },
        { key: 'nome', label: 'Nome ou razão social', required: true },
        { key: 'nome_fantasia', label: 'Nome fantasia' },
        { key: 'cpf_cnpj', label: 'CPF ou CNPJ' },
        { key: 'rg', label: 'RG' },
        { key: 'inscricao_estadual', label: 'Inscrição estadual' },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'telefone', label: 'Telefone', type: 'tel' },
        { key: 'celular', label: 'Celular / WhatsApp', type: 'tel' },
      ] }] },
      { id: 'enderecos', label: 'Endereços', sections: [{ id: 'enderecos', title: 'Endereços', repeatables: [addresses] }] },
      { id: 'contatos', label: 'Contatos', sections: [{ id: 'contatos', title: 'Contatos', repeatables: [contacts] }] },
      { id: 'anexos', label: 'Anexos', sections: [attachmentSection] },
      { id: 'observacoes', label: 'Observações', sections: [notesSection] },
    ],
    actions: [...generalActions, 'Importar fornecedores', 'Vincular produtos', 'Consultar compras'],
  },
  {
    id: 'funcionarios', title: 'Funcionários', singular: 'funcionário', section: 'Cadastros', icon: '♙',
    description: 'Colaboradores, vendedores, técnicos e usuários internos da empresa.',
    benefits: ['Definir comissão', 'Criar acesso ao sistema', 'Vincular vendas e agenda', 'Controlar permissões por grupo'],
    primaryField: 'nome', statusField: 'situacao',
    tabs: [
      { id: 'dados', label: 'Dados gerais', sections: [{ id: 'dados-gerais', title: 'Dados gerais', fields: [
        { key: 'nome', label: 'Nome', required: true },
        { key: 'cpf', label: 'CPF' },
        { key: 'rg', label: 'RG' },
        { key: 'data_nascimento', label: 'Data de nascimento', type: 'date' },
        { key: 'sexo', label: 'Sexo', type: 'select', options: ['Feminino', 'Masculino', 'Outro', 'Não informar'] },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo', required: true },
        { key: 'permitir_acesso', label: 'Permitir acesso ao sistema', type: 'checkbox' },
        { key: 'grupo_usuario_id', label: 'Grupo de acesso', type: 'select', required: true, options: [], showWhen: { key: 'permitir_acesso', equals: true }, help: 'Os grupos são cadastrados em Configurações → Grupos de usuários.' },
        { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' },
      ] }] },
      { id: 'comissionamento', label: 'Comissionamento', sections: [{ id: 'comissionamento', title: 'Comissionamento', fields: [
        { key: 'percentual_comissao', label: 'Percentual de comissão', type: 'number' },
        { key: 'desconto_maximo', label: 'Desconto máximo permitido', type: 'number' },
      ] }] },
      { id: 'foto', label: 'Foto', sections: [{ id: 'foto', title: 'Foto', description: 'Envie a foto do funcionário em arquivo de até 5 MB.' }] },
      { id: 'contatos', label: 'Contatos', sections: [{ id: 'contatos', title: 'Contatos', repeatables: [contacts] }] },
      { id: 'endereco', label: 'Endereço', sections: [{ id: 'endereco', title: 'Endereço', repeatables: [addresses] }] },
      { id: 'restricoes', label: 'Restrições', sections: [{ id: 'restricoes', title: 'Restrições de acesso', fields: [
        { key: 'hora_entrada', label: 'Horário de entrada', type: 'text' },
        { key: 'almoco_inicio', label: 'Início do almoço', type: 'text' },
        { key: 'almoco_fim', label: 'Fim do almoço', type: 'text' },
        { key: 'hora_saida', label: 'Horário de saída', type: 'text' },
        { key: 'dias_permitidos', label: 'Dias permitidos', placeholder: 'Seg, Ter, Qua, Qui, Sex' },
        { key: 'restricao_ip', label: 'Restrição por IP' },
      ] }] },
      { id: 'anexos', label: 'Anexos', sections: [attachmentSection] },
    ],
    actions: [...generalActions, 'Gerar convite de acesso', 'Relatório de funcionários'],
  },
  {
    id: 'transportadoras', title: 'Transportadoras', singular: 'transportadora', section: 'Cadastros', icon: '▰',
    description: 'Transportadoras utilizadas em vendas, compras, orçamentos e documentos fiscais.',
    benefits: ['Registrar veículo e RNTRC', 'Vincular entregas', 'Usar em NF-e', 'Controlar situação'],
    primaryField: 'nome', statusField: 'situacao',
    tabs: [
      { id: 'dados', label: 'Dados gerais', sections: [{ id: 'dados-gerais', title: 'Dados gerais', fields: [
        { key: 'tipo_transportadora', label: 'Tipo de transportadora', type: 'select', options: personOptions, required: true },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, required: true, defaultValue: 'Ativo' },
        { key: 'nome', label: 'Nome', required: true },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'telefone', label: 'Telefone', type: 'tel' },
        { key: 'celular', label: 'Celular', type: 'tel' },
        { key: 'veiculo', label: 'Veículo' },
        { key: 'placa', label: 'Placa' },
        { key: 'uf_placa', label: 'UF da placa', type: 'select', options: states },
        { key: 'rntrc', label: 'RNTRC' },
      ] }] },
      { id: 'enderecos', label: 'Endereços', sections: [{ id: 'enderecos', title: 'Endereços', repeatables: [addresses] }] },
      { id: 'contatos', label: 'Contatos', sections: [{ id: 'contatos', title: 'Contatos', repeatables: [contacts] }] },
      { id: 'observacoes', label: 'Observações', sections: [notesSection] },
    ],
    actions: generalActions,
  },
  {
    id: 'produtos', title: 'Produtos', singular: 'produto', section: 'Itens', icon: '◆',
    description: 'Produtos, insumos e mercadorias com preço, estoque, fiscal, variações, composição e fornecedores.',
    benefits: ['Controlar estoque por loja', 'Gerar etiquetas e códigos', 'Atualizar preços em massa', 'Usar em vendas e compras'],
    primaryField: 'nome', statusField: 'situacao', totalField: 'valor_venda',
    tabs: [
      { id: 'dados', label: 'Dados', sections: [{ id: 'dados', title: 'Dados', fields: [
        { key: 'tipo', label: 'Tipo', type: 'select', options: ['Produto', 'Insumo', 'Mercadoria'], required: true, defaultValue: 'Produto' },
        { key: 'nome', label: 'Nome', required: true },
        { key: 'codigo_interno', label: 'Código interno / SKU', required: true },
        { key: 'codigo_barras', label: 'Código de barras EAN/GTIN' },
        { key: 'categoria', label: 'Categoria' },
        { key: 'grupo_produto', label: 'Grupo do produto' },
        { key: 'marca', label: 'Marca' },
        { key: 'unidade', label: 'Unidade', type: 'select', options: ['UN', 'CX', 'KG', 'M', 'M²', 'L', 'PC'], defaultValue: 'UN' },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
        { key: 'movimenta_estoque', label: 'Movimenta estoque?', type: 'checkbox', defaultValue: true },
        { key: 'habilitar_nota_fiscal', label: 'Habilitar nota fiscal?', type: 'checkbox', defaultValue: true },
        { key: 'possui_variacoes', label: 'Possui variações?', type: 'checkbox' },
        { key: 'possui_composicao', label: 'Possui composição?', type: 'checkbox' },
        { key: 'venda_separada', label: 'Permitir venda separadamente', type: 'checkbox', defaultValue: true },
        { key: 'disponivel_pdv', label: 'Disponível no PDV', type: 'checkbox', defaultValue: true },
      ] }, { id: 'conversao', title: 'Conversão de unidade', icon: '↔', description: 'Compre em uma unidade e venda em outra.', repeatables: [{
        key: 'conversoes', title: 'Conversões', addLabel: 'Adicionar conversão', minimumRows: 1, columns: [
          { key: 'quantidade_entrada', label: 'Entrada', type: 'number' },
          { key: 'unidade_entrada', label: 'Unidade de entrada' },
          { key: 'quantidade_saida', label: 'Saída', type: 'number' },
          { key: 'unidade_saida', label: 'Unidade de saída' },
        ],
      }] }] },
      { id: 'detalhes', label: 'Detalhes', sections: [{ id: 'detalhes', title: 'Detalhes físicos e descrição', fields: [
        { key: 'descricao', label: 'Descrição', type: 'textarea', width: 'full' },
        { key: 'descricao_complementar', label: 'Descrição complementar', type: 'textarea', width: 'full' },
        { key: 'peso', label: 'Peso', type: 'number' },
        { key: 'largura', label: 'Largura', type: 'number' },
        { key: 'altura', label: 'Altura', type: 'number' },
        { key: 'comprimento', label: 'Comprimento', type: 'number' },
        { key: 'percentual_comissao', label: 'Percentual de comissão', type: 'number' },
      ] }] },
      { id: 'valores', label: 'Valores', sections: [{ id: 'valores', title: 'Valores', icon: '▣', fields: [
        { key: 'valor_custo', label: 'Valor de custo', type: 'money' },
        { key: 'margem_lucro', label: 'Margem de lucro (%)', type: 'number' },
        { key: 'valor_venda', label: 'Valor de venda', type: 'money', required: true },
        { key: 'valor_promocional', label: 'Valor promocional', type: 'money' },
        { key: 'tabela_preco', label: 'Tabela de preço' },
      ] }] },
      { id: 'estoque', label: 'Estoque', sections: [{ id: 'estoque', title: 'Estoque', icon: '◆', fields: [
        { key: 'quantidade_estoque', label: 'Quantidade atual', type: 'number' },
        { key: 'estoque_minimo', label: 'Estoque mínimo', type: 'number' },
        { key: 'loja_estoque', label: 'Loja' },
      ] }, { id: 'variacoes', title: 'Grades e variações', repeatables: [{
        key: 'variacoes', title: 'Variações', addLabel: 'Adicionar variação', minimumRows: 0, columns: [
          { key: 'grade', label: 'Grade' }, { key: 'variacao', label: 'Variação' }, { key: 'codigo_barras', label: 'Código de barras' },
          { key: 'estoque', label: 'Estoque', type: 'number' }, { key: 'custo', label: 'Custo', type: 'money' }, { key: 'valor_venda', label: 'Valor de venda', type: 'money' },
        ],
      }] }] },
      { id: 'fotos', label: 'Fotos', sections: [{ id: 'fotos', title: 'Fotos e imagens', description: 'Adicione a foto principal e imagens complementares de até 5 MB.' }] },
      { id: 'fiscal', label: 'Fiscal', sections: [{ id: 'fiscal', title: 'Dados fiscais', icon: '⌘', fields: [
        { key: 'ncm', label: 'NCM' }, { key: 'cest', label: 'CEST' }, { key: 'origem_mercadoria', label: 'Origem da mercadoria' },
        { key: 'cfop_compra', label: 'CFOP de compra' }, { key: 'cfop_venda', label: 'CFOP de venda' },
        { key: 'cst_csosn', label: 'CST / CSOSN do ICMS' }, { key: 'ipi', label: 'IPI', type: 'number' },
        { key: 'pis', label: 'PIS', type: 'number' }, { key: 'cofins', label: 'COFINS', type: 'number' },
      ] }] },
      { id: 'composicao', label: 'Composição', sections: [{ id: 'composicao', title: 'Produto composto', repeatables: [{
        key: 'componentes', title: 'Componentes', addLabel: 'Adicionar componente', minimumRows: 0, columns: [
          { key: 'produto', label: 'Produto componente' }, { key: 'quantidade', label: 'Quantidade', type: 'number' }, { key: 'custo', label: 'Custo', type: 'money' },
        ],
      }] }] },
      { id: 'fornecedores', label: 'Fornecedores', sections: [{ id: 'fornecedores', title: 'Fornecedores e lojas', repeatables: [{
        key: 'fornecedores', title: 'Fornecedores', addLabel: 'Adicionar fornecedor', minimumRows: 0, columns: [
          { key: 'fornecedor', label: 'Fornecedor' }, { key: 'custo', label: 'Custo', type: 'money' }, { key: 'condicoes', label: 'Condições' }, { key: 'lojas', label: 'Lojas disponíveis' },
        ],
      }] }] },
    ],
    actions: [...generalActions, 'Importar planilha', 'Importar NF-e', 'Gerar etiquetas', 'Atualizar preços em massa', 'Excluir em massa'],
  },
  {
    id: 'servicos', title: 'Serviços', singular: 'serviço', section: 'Itens', icon: '⚒',
    description: 'Serviços oferecidos pela empresa com valores, comissão e dados fiscais.',
    benefits: ['Usar em vendas e orçamentos', 'Emitir NFS-e', 'Vincular ordens de serviço', 'Controlar custo e comissão'],
    primaryField: 'nome', statusField: 'situacao', totalField: 'valor_venda',
    tabs: [
      { id: 'dados', label: 'Dados', sections: [{ id: 'dados', title: 'Dados gerais', fields: [
        { key: 'nome', label: 'Nome do serviço', required: true }, { key: 'codigo_interno', label: 'Código interno' },
        { key: 'valor_venda', label: 'Valor de venda', type: 'money', required: true }, { key: 'valor_custo', label: 'Valor de custo', type: 'money' },
        { key: 'percentual_comissao', label: 'Percentual de comissão', type: 'number' },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
        { key: 'descricao', label: 'Descrição', type: 'textarea', width: 'full' },
      ] }] },
      { id: 'fiscal', label: 'Fiscal', sections: [{ id: 'fiscal', title: 'Dados fiscais', fields: [
        { key: 'atividade_servico', label: 'Atividade do serviço' }, { key: 'codigo_servico', label: 'Código do serviço' },
        { key: 'codigo_tributario', label: 'Código tributário' }, { key: 'cnae', label: 'CNAE' },
        { key: 'aliquota_iss', label: 'Alíquota de ISS', type: 'number' }, { key: 'cofins', label: 'COFINS', type: 'number' },
        { key: 'pis', label: 'PIS', type: 'number' }, { key: 'csll', label: 'CSLL', type: 'number' },
        { key: 'ir', label: 'IR', type: 'number' }, { key: 'inss', label: 'INSS', type: 'number' },
        { key: 'construcao_civil', label: 'Relacionado à construção civil', type: 'checkbox' },
        { key: 'deducoes', label: 'Deduções e descontos tributários', type: 'money' },
      ] }] },
      { id: 'relacionamentos', label: 'Relacionamentos', sections: [{ id: 'relacionamentos', title: 'Fornecedores e lojas', fields: [
        { key: 'fornecedores', label: 'Fornecedores', type: 'textarea', width: 'full' },
        { key: 'lojas', label: 'Lojas em que o serviço ficará disponível', type: 'textarea', width: 'full' },
      ] }] },
      { id: 'foto', label: 'Foto', sections: [{ id: 'foto', title: 'Foto', description: 'Envie uma imagem do serviço de até 5 MB.' }] },
      { id: 'anexos', label: 'Anexos', sections: [attachmentSection] },
    ],
    actions: generalActions,
  },
]

function transactionDefinition(id: string, title: string, singular: string, section: string, kind: 'orcamento' | 'venda' | 'compra' | 'contrato' | 'os'): ModuleDefinition {
  const isPurchase = kind === 'compra'
  const isContract = kind === 'contrato'
  const isOS = kind === 'os'
  const partyLabel = isPurchase ? 'Fornecedor' : 'Cliente'
  const statusOptions = kind === 'orcamento' ? ['Em elaboração', 'Enviado', 'Aprovado', 'Recusado', 'Vencido'] : isPurchase ? ['Pendente', 'Confirmada', 'Recebida', 'Cancelada'] : isContract ? ['Rascunho', 'Confirmado', 'Ativo', 'Suspenso', 'Encerrado', 'Cancelado'] : isOS ? ['Aberta', 'Em análise', 'Aguardando aprovação', 'Em execução', 'Finalizada', 'Entregue', 'Cancelada'] : ['Pendente', 'Concretizada', 'Em separação', 'Entregue', 'Cancelada']
  const generalFields: FieldSpec[] = [
    { key: 'numero', label: 'Número', defaultValue: 'Automático' },
    { key: isPurchase ? 'fornecedor' : 'cliente', label: partyLabel, required: true, placeholder: 'Digite para buscar' },
    { key: 'vendedor_responsavel', label: isPurchase ? 'Comprador / responsável' : 'Vendedor / responsável' },
    { key: 'situacao', label: 'Situação', type: 'select', options: statusOptions, required: true, defaultValue: statusOptions[0] },
    { key: 'data', label: isPurchase ? 'Data de emissão' : 'Data', type: 'date', required: true },
    { key: 'prazo_entrega', label: 'Prazo de entrega', type: 'date' },
    { key: 'canal_venda', label: 'Canal de venda', type: 'select', options: saleChannels, defaultValue: 'Presencial' },
    { key: 'centro_custo', label: 'Centro de custo' },
  ]
  if (kind === 'orcamento') generalFields.push({ key: 'validade', label: 'Validade', placeholder: 'Ex.: 10 dias' }, { key: 'aos_cuidados', label: 'Aos cuidados de' })
  if (isPurchase) generalFields.push({ key: 'numero_nfe', label: 'Número da NF-e' })
  if (isContract) generalFields.push({ key: 'data_inicio', label: 'Data de início', type: 'date', required: true }, { key: 'data_termino', label: 'Data de término', type: 'date', required: true })
  if (isOS) generalFields.push({ key: 'entrada_em', label: 'Data e hora de entrada', type: 'datetime-local' }, { key: 'saida_em', label: 'Data e hora de saída', type: 'datetime-local' }, { key: 'tecnico', label: 'Técnico' })

  const sections: SectionSpec[] = [
    { id: 'dados-gerais', title: 'Dados gerais', icon: '✎', fields: generalFields },
  ]
  if (kind === 'orcamento') sections.push({ id: 'introducao', title: 'Introdução', fields: [{ key: 'introducao', label: 'Introdução ou apresentação', type: 'textarea', width: 'full' }] })
  if (isOS) sections.push({ id: 'equipamentos', title: 'Equipamentos', icon: '⚒', repeatables: [{
    key: 'equipamentos', title: 'Equipamentos', addLabel: 'Adicionar equipamento', minimumRows: 1, columns: [
      { key: 'equipamento', label: 'Equipamento' }, { key: 'marca', label: 'Marca' }, { key: 'modelo', label: 'Modelo' },
      { key: 'numero_serie', label: 'Número de série' }, { key: 'condicoes', label: 'Condições' }, { key: 'defeito', label: 'Defeito relatado' },
      { key: 'acessorios', label: 'Acessórios' }, { key: 'solucao', label: 'Solução aplicada' },
    ],
  }] })
  sections.push({ id: 'itens', title: 'Itens', repeatables: [productItems, serviceItems] })
  sections.push({ id: 'transporte', title: 'Transporte e entrega', icon: '▰', fields: [
    { key: 'frete', label: 'Valor do frete', type: 'money' }, { key: 'transportadora', label: 'Transportadora' },
    { key: 'informar_endereco_entrega', label: 'Informar endereço de entrega', type: 'checkbox' },
  ], repeatables: [addresses] })
  sections.push({ id: 'total', title: 'Totalização', icon: '▣', fields: [
    { key: 'exibir_total_impressao', label: 'Exibir valor total na impressão', type: 'checkbox', defaultValue: true },
    { key: 'acrescimo', label: 'Acréscimo', type: 'money' }, { key: 'desconto_reais', label: 'Desconto (R$)', type: 'money' },
    { key: 'desconto_percentual', label: 'Desconto (%)', type: 'number' }, { key: 'valor_total', label: 'Valor total', type: 'money' },
  ] })
  sections.push({ id: 'pagamento', title: 'Pagamento', icon: '▣', fields: [
    { key: 'tipo_pagamento', label: 'Pagamento', type: 'select', options: ['À vista', 'Parcelado'], defaultValue: 'À vista' },
    { key: 'gerar_financeiro', label: 'Gerar lançamento financeiro', type: 'checkbox', defaultValue: true },
    { key: 'quantidade_parcelas', label: 'Quantidade de parcelas', type: 'number' },
    { key: 'intervalo_parcelas', label: 'Intervalo entre parcelas (dias)', type: 'number' },
    { key: 'primeiro_vencimento', label: 'Data da primeira parcela', type: 'date' },
  ], repeatables: [paymentRows] })
  sections.push(attachmentSection, notesSection)

  const actions = [...generalActions]
  if (kind === 'orcamento') actions.push('Gerar venda', 'Alterar situação')
  if (kind === 'venda') actions.push('Gerar financeiro', 'Registrar troca ou devolução', 'Separar produtos')
  if (kind === 'compra') actions.push('Importar XML', 'Atualizar estoque', 'Consultar financeiro')
  if (kind === 'os') actions.push('Gerar nota fiscal', 'Imprimir cupom', 'Gerar etiqueta')
  if (kind === 'contrato') actions.push('Renovar contrato', 'Gerar parcelas', 'Consultar financeiro')

  return {
    id, title, singular, section, icon: kind === 'compra' ? '▥' : kind === 'contrato' ? '▱' : kind === 'os' ? '⚒' : kind === 'orcamento' ? '▧' : '▰',
    description: `Cadastre e acompanhe ${title.toLowerCase()} mantendo dados, itens, valores, pagamento, anexos e histórico no mesmo padrão operacional.`,
    benefits: ['Cadastro completo', 'Pesquisa e filtros', 'Histórico por empresa', 'Ações conforme permissões'],
    primaryField: isPurchase ? 'fornecedor' : 'cliente', statusField: 'situacao', totalField: 'valor_total',
    tabs: [{ id: 'principal', label: title, sections }], actions,
    integrationActions: ['Enviar por WhatsApp', 'Enviar por e-mail', 'Assinatura digital', 'Emitir documento fiscal'],
  }
}

modules.push(
  transactionDefinition('orcamentos-produtos', 'Orçamentos de produtos', 'orçamento', 'Orçamentos', 'orcamento'),
  transactionDefinition('orcamentos-servicos', 'Orçamentos de serviços', 'orçamento', 'Orçamentos', 'orcamento'),
  transactionDefinition('vendas-produtos', 'Vendas de produtos', 'venda', 'Vendas', 'venda'),
  transactionDefinition('vendas-servicos', 'Vendas de serviços', 'venda', 'Vendas', 'venda'),
  transactionDefinition('os-gerenciar', 'Ordens de serviço', 'ordem de serviço', 'Ordens de serviços', 'os'),
  transactionDefinition('compras-produtos', 'Compras de produtos', 'compra', 'Estoque', 'compra'),
  transactionDefinition('compras-servicos', 'Compras de serviços', 'compra', 'Estoque', 'compra'),
  transactionDefinition('contratos-servicos', 'Contratos de prestação de serviços', 'contrato', 'Contratos', 'contrato'),
  transactionDefinition('contratos-locacoes', 'Contratos de locação', 'contrato', 'Contratos', 'contrato'),
)

const simpleModules: ModuleDefinition[] = [
  {
    id: 'vendas-balcao', title: 'PDV e caixa', singular: 'venda de balcão', section: 'Vendas', icon: '▰',
    description: 'Abertura de caixa, vendas rápidas, múltiplas formas de pagamento, troco, cupom e NFC-e.',
    benefits: ['Caixa por usuário', 'Leitura de código de barras', 'Venda em espera', 'Múltiplos pagamentos'],
    primaryField: 'numero', statusField: 'situacao', totalField: 'valor_total',
    tabs: [{ id: 'pdv', label: 'PDV', sections: [
      { id: 'caixa', title: 'Abertura e controle do caixa', fields: [
        { key: 'numero', label: 'Número', defaultValue: 'Automático' }, { key: 'operador', label: 'Operador' },
        { key: 'valor_abertura', label: 'Valor de abertura', type: 'money' }, { key: 'gerar_financeiro', label: 'Gerar lançamento no financeiro', type: 'checkbox' },
        { key: 'situacao', label: 'Situação', type: 'select', options: ['Aberto', 'Em espera', 'Finalizado', 'Cancelado'], defaultValue: 'Aberto' },
      ] },
      { id: 'cliente', title: 'Cliente e vendedor', fields: [
        { key: 'cliente', label: 'Cliente', defaultValue: 'Ao consumidor' }, { key: 'vendedor', label: 'Vendedor' },
        { key: 'limite_desconto', label: 'Limite máximo de desconto', type: 'number' },
      ] },
      { id: 'itens', title: 'Produtos e serviços', repeatables: [productItems, serviceItems] },
      { id: 'pagamento', title: 'Pagamento', fields: [
        { key: 'valor_total', label: 'Valor total', type: 'money' }, { key: 'valor_recebido', label: 'Valor recebido', type: 'money' },
        { key: 'troco', label: 'Troco', type: 'money' }, { key: 'pagamento_parcial', label: 'Pagamento parcial', type: 'checkbox' },
      ], repeatables: [paymentRows] },
    ] }],
    actions: [...generalActions, 'Colocar venda em espera', 'Finalizar venda', 'Imprimir cupom', 'Emitir NFC-e', 'Abrir nova venda'],
  },
  {
    id: 'vendas-devolucoes', title: 'Trocas e devoluções', singular: 'devolução', section: 'Vendas', icon: '↶',
    description: 'Registre trocas e devoluções vinculadas a vendas, produtos e valores.', benefits: ['Manter histórico', 'Atualizar estoque', 'Gerar crédito ou estorno', 'Vincular venda original'],
    primaryField: 'venda_origem', statusField: 'situacao', totalField: 'valor_total', tabs: [{ id: 'dados', label: 'Dados', sections: [
      { id: 'dados', title: 'Dados gerais', fields: [
        { key: 'venda_origem', label: 'Venda de origem', required: true }, { key: 'cliente', label: 'Cliente' }, { key: 'data', label: 'Data', type: 'date', required: true },
        { key: 'tipo', label: 'Tipo', type: 'select', options: ['Troca', 'Devolução', 'Estorno'] }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente', 'Concluída', 'Cancelada'] },
      ] }, { id: 'itens', title: 'Itens', repeatables: [productItems] }, { id: 'total', title: 'Total', fields: [{ key: 'valor_total', label: 'Valor total', type: 'money' }] }, notesSection,
    ] }], actions: generalActions,
  },
  {
    id: 'estoque-ajustes', title: 'Ajustes de estoque', singular: 'ajuste', section: 'Estoque', icon: '◆',
    description: 'Entradas e saídas manuais de estoque com produto, quantidade, custo, frete e observação.', benefits: ['Entrada e saída', 'Ajustes em massa', 'Histórico', 'Saldo por loja'],
    primaryField: 'produto', statusField: 'tipo_movimento', tabs: [{ id: 'dados', label: 'Dados', sections: [
      { id: 'dados', title: 'Ajuste de estoque', fields: [{ key: 'tipo_movimento', label: 'Tipo de movimento', type: 'select', options: ['Entrada', 'Saída'], required: true }, { key: 'loja', label: 'Loja' }, { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' }], repeatables: [{ ...productItems, key: 'itens_estoque', title: 'Produtos', columns: [
        { key: 'item', label: 'Produto', required: true }, { key: 'quantidade', label: 'Quantidade', type: 'number', required: true }, { key: 'unidade', label: 'Unidade' }, { key: 'valor', label: 'Valor de custo', type: 'money' }, { key: 'frete', label: 'Frete', type: 'money' },
      ] }] },
    ] }], actions: generalActions,
  },
  {
    id: 'estoque-transferencias', title: 'Transferências entre lojas', singular: 'transferência', section: 'Estoque', icon: '↔',
    description: 'Transfira produtos entre lojas e acompanhe o histórico.', benefits: ['Loja de origem e destino', 'Vários produtos', 'Atualização de saldo', 'Observações'],
    primaryField: 'loja_origem', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Dados', sections: [{ id: 'dados', title: 'Transferência', fields: [
      { key: 'loja_origem', label: 'Loja de origem', required: true }, { key: 'loja_destino', label: 'Loja de destino', required: true },
      { key: 'data', label: 'Data', type: 'date', required: true }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente', 'Em trânsito', 'Recebida', 'Cancelada'] },
      { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' },
    ], repeatables: [{ ...productItems, key: 'itens_transferencia', title: 'Produtos', columns: [
      { key: 'item', label: 'Produto', required: true }, { key: 'quantidade', label: 'Quantidade', type: 'number', required: true }, { key: 'unidade', label: 'Unidade' },
    ] }] }] }], actions: generalActions,
  },
  {
    id: 'estoque-movimentacoes', title: 'Movimentações de estoque', singular: 'movimentação', section: 'Estoque', icon: '↕',
    description: 'Histórico de entradas, saídas, saldos, lojas e variações.', benefits: ['Filtros por período', 'Saldo por produto', 'Origem da movimentação', 'Exportação'],
    primaryField: 'produto', statusField: 'tipo_movimento', tabs: [{ id: 'filtros', label: 'Movimentação', sections: [{ id: 'dados', title: 'Movimentação', fields: [
      { key: 'produto', label: 'Produto', required: true }, { key: 'loja', label: 'Loja' }, { key: 'tipo_movimento', label: 'Tipo', type: 'select', options: ['Entrada', 'Saída', 'Transferência', 'Ajuste'] },
      { key: 'data', label: 'Data', type: 'date' }, { key: 'quantidade', label: 'Quantidade', type: 'number' }, { key: 'saldo', label: 'Saldo', type: 'number' }, { key: 'origem', label: 'Origem' },
    ] }] }], actions: ['Visualizar', 'Exportar', 'Imprimir', 'Pesquisa avançada'],
  },
  {
    id: 'estoque-cotacoes', title: 'Cotações de compras', singular: 'cotação', section: 'Estoque', icon: '▧',
    description: 'Solicite preços a fornecedores, compare condições e gere compras.', benefits: ['Vários fornecedores', 'Link de resposta', 'Comparação', 'Gerar compra'],
    primaryField: 'fornecedor', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Cotação', sections: [
      { id: 'dados', title: 'Dados gerais', fields: [{ key: 'data', label: 'Data', type: 'date', required: true }, { key: 'prazo_resposta', label: 'Prazo para resposta', type: 'date' }, { key: 'fornecedor', label: 'Fornecedor', required: true }, { key: 'email_fornecedor', label: 'E-mail do fornecedor', type: 'email' }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Rascunho', 'Enviada', 'Respondida', 'Encerrada'] }] },
      { id: 'produtos', title: 'Produtos', repeatables: [productItems] }, { id: 'envio', title: 'Envio', fields: [{ key: 'email_resposta', label: 'E-mail para resposta', type: 'email' }, { key: 'assunto', label: 'Assunto' }, { key: 'mensagem', label: 'Mensagem', type: 'textarea', width: 'full' }] }, notesSection,
    ] }], actions: [...generalActions, 'Enviar cotação', 'Comparar respostas', 'Gerar compra'], integrationActions: ['Enviar e-mail'],
  },
  {
    id: 'contas-receber', title: 'Contas a receber', singular: 'recebimento', section: 'Financeiro', icon: '▣',
    description: 'Recebimentos, vencimentos, formas, contas bancárias e confirmações parciais.', benefits: ['Controlar vencimentos', 'Confirmar parcial', 'Gerar recibo', 'Importar lançamentos'],
    primaryField: 'descricao', statusField: 'situacao', totalField: 'valor', tabs: [{ id: 'lancamento', label: 'Lançamento financeiro', sections: [
      { id: 'dados', title: 'Dados gerais', fields: [{ key: 'entidade', label: 'Cliente ou entidade', required: true }, { key: 'descricao', label: 'Descrição', required: true }, { key: 'vencimento', label: 'Data de vencimento', type: 'date', required: true }, { key: 'forma_pagamento', label: 'Forma de recebimento', type: 'select', options: paymentModes }, { key: 'categoria', label: 'Categoria financeira' }, { key: 'plano_contas', label: 'Plano de contas' }, { key: 'centro_custo', label: 'Centro de custo' }, { key: 'conta_bancaria', label: 'Conta bancária' }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente', 'Recebido', 'Parcial', 'Vencido', 'Cancelado'], defaultValue: 'Pendente' }] },
      { id: 'valores', title: 'Valores', fields: [{ key: 'valor', label: 'Valor bruto', type: 'money', required: true }, { key: 'juros', label: 'Juros', type: 'money' }, { key: 'desconto', label: 'Desconto', type: 'money' }, { key: 'recorrencia', label: 'Ativar parcelamento / recorrência', type: 'checkbox' }] }, attachmentSection, notesSection,
    ] }], actions: [...generalActions, 'Confirmar recebimento', 'Confirmar parcialmente', 'Gerar recibo', 'Importar contas'],
  },
  {
    id: 'contas-pagar', title: 'Contas a pagar', singular: 'pagamento', section: 'Financeiro', icon: '▣',
    description: 'Despesas, vencimentos, fornecedores, contas bancárias e recorrências.', benefits: ['Controlar vencimentos', 'Confirmar parcial', 'Importar documentos', 'Organizar centro de custo'],
    primaryField: 'descricao', statusField: 'situacao', totalField: 'valor', tabs: [{ id: 'lancamento', label: 'Lançamento financeiro', sections: [
      { id: 'dados', title: 'Dados gerais', fields: [{ key: 'entidade', label: 'Fornecedor ou entidade', required: true }, { key: 'descricao', label: 'Descrição do pagamento', required: true }, { key: 'vencimento', label: 'Vencimento', type: 'date', required: true }, { key: 'plano_contas', label: 'Plano de contas', required: true }, { key: 'centro_custo', label: 'Centro de custo' }, { key: 'forma_pagamento', label: 'Forma de pagamento', type: 'select', options: paymentModes, required: true }, { key: 'conta_bancaria', label: 'Conta bancária', required: true }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente', 'Pago', 'Parcial', 'Vencido', 'Cancelado'], defaultValue: 'Pendente' }, { key: 'data_compensacao', label: 'Data de compensação', type: 'date' }] },
      { id: 'valores', title: 'Valores', fields: [{ key: 'valor', label: 'Valor bruto', type: 'money', required: true }, { key: 'juros', label: 'Juros', type: 'money' }, { key: 'desconto', label: 'Desconto', type: 'money' }, { key: 'recorrencia', label: 'Ativar parcelamento / recorrência', type: 'checkbox' }] }, attachmentSection, notesSection,
    ] }], actions: [...generalActions, 'Confirmar pagamento', 'Confirmar parcialmente', 'Importar contas', 'Leitura de documento'],
  },
  {
    id: 'contas-bancarias', title: 'Contas bancárias', singular: 'conta bancária', section: 'Financeiro', icon: '▣',
    description: 'Contas bancárias, saldos iniciais e formas de pagamento vinculadas.', benefits: ['Saldo por conta', 'Conciliação', 'Transferências', 'Extrato'],
    primaryField: 'nome', statusField: 'situacao', totalField: 'saldo_inicial', tabs: [{ id: 'dados', label: 'Dados', sections: [{ id: 'dados', title: 'Conta bancária', fields: [
      { key: 'nome', label: 'Nome da conta', required: true }, { key: 'tipo', label: 'Tipo da conta', type: 'select', options: ['Conta corrente', 'Poupança', 'Caixa', 'Carteira digital', 'Outro'] },
      { key: 'saldo_inicial', label: 'Saldo inicial', type: 'money' }, { key: 'data_saldo_inicial', label: 'Data do saldo inicial', type: 'date' },
      { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' }, { key: 'formas_vinculadas', label: 'Formas de pagamento vinculadas', type: 'textarea', width: 'full' },
    ] }] }], actions: generalActions,
  },
  {
    id: 'formas-pagamento', title: 'Formas de pagamento', singular: 'forma de pagamento', section: 'Financeiro', icon: '▣',
    description: 'Formas de pagamento, parcelamento, taxas e disponibilidade por módulo.', benefits: ['Vincular conta', 'Configurar taxas', 'Disponível no PDV', 'Gerar boleto'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Dados', sections: [
      { id: 'basico', title: 'Dados básicos', fields: [{ key: 'nome', label: 'Nome', required: true }, { key: 'conta_bancaria', label: 'Conta bancária' }, { key: 'disponibilidade', label: 'Disponibilidade', type: 'select', options: ['Contas a pagar', 'Contas a receber', 'Ambas'] }, { key: 'confirmar_automaticamente', label: 'Confirmar automaticamente', type: 'checkbox' }, { key: 'disponivel_pdv', label: 'Disponível no PDV', type: 'checkbox' }, { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' }] },
      { id: 'parcelamento', title: 'Parcelamento', fields: [{ key: 'max_parcelas', label: 'Número máximo de parcelas', type: 'number' }, { key: 'intervalo', label: 'Intervalo em dias', type: 'number' }, { key: 'dias_primeira', label: 'Dias para primeira parcela', type: 'number' }] },
      { id: 'taxas', title: 'Taxas', fields: [{ key: 'tarifa', label: 'Tarifa bancária', type: 'money' }, { key: 'taxa_operadora', label: 'Taxa da operadora (%)', type: 'number' }, { key: 'multa', label: 'Multa (%)', type: 'number' }, { key: 'juros_mora', label: 'Juros de mora (%)', type: 'number' }, { key: 'modalidade', label: 'Modalidade' }, { key: 'gerar_boleto', label: 'Gerar boleto', type: 'checkbox' }] },
    ] }], actions: generalActions,
  },
  {
    id: 'contratos-assinaturas', title: 'Assinaturas e cobranças recorrentes', singular: 'assinatura', section: 'Contratos', icon: '⟳',
    description: 'Cobranças recorrentes, vendas automáticas, repetição, pagamentos e itens.', benefits: ['Gerar cobranças', 'Pausar recorrência', 'Vendas automáticas', 'Acompanhar financeiro'],
    primaryField: 'cliente', statusField: 'situacao', totalField: 'valor_total', tabs: [{ id: 'dados', label: 'Assinatura', sections: [
      { id: 'dados', title: 'Dados gerais', fields: [{ key: 'cliente', label: 'Cliente', required: true }, { key: 'data', label: 'Data', type: 'date' }, { key: 'proximo_vencimento', label: 'Próximo vencimento', type: 'date', required: true }, { key: 'frequencia', label: 'Frequência', type: 'select', options: ['Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'] }, { key: 'repetir_indefinidamente', label: 'Repetir indefinidamente', type: 'checkbox' }, { key: 'data_termino', label: 'Data de término', type: 'date' }, { key: 'quantidade_repeticoes', label: 'Quantidade de repetições', type: 'number' }, { key: 'gerar_venda', label: 'Gerar venda automaticamente', type: 'checkbox' }, { key: 'forma_pagamento', label: 'Forma de pagamento', type: 'select', options: paymentModes }, { key: 'enviar_email', label: 'Enviar e-mail', type: 'checkbox' }, { key: 'vendedor', label: 'Vendedor' }, { key: 'canal_venda', label: 'Canal de venda', type: 'select', options: saleChannels }, { key: 'centro_custo', label: 'Centro de custo' }, { key: 'plano_contas', label: 'Plano de contas' }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Ativa', 'Pausada', 'Encerrada', 'Cancelada'] }] },
      { id: 'itens', title: 'Itens', repeatables: [serviceItems, productItems] }, { id: 'total', title: 'Total', fields: [{ key: 'frete', label: 'Frete', type: 'money' }, { key: 'desconto_reais', label: 'Desconto em reais', type: 'money' }, { key: 'desconto_percentual', label: 'Desconto percentual', type: 'number' }, { key: 'valor_total', label: 'Total da assinatura', type: 'money' }] }, attachmentSection, notesSection,
    ] }], actions: [...generalActions, 'Pausar recorrência', 'Gerar próxima fatura', 'Visualizar vendas geradas', 'Visualizar financeiro'],
  },
  {
    id: 'atendimentos', title: 'Atendimentos', singular: 'atendimento', section: 'Atendimentos', icon: '●',
    description: 'Atendimentos ativos ou receptivos, públicos ou restritos, com histórico do cliente.', benefits: ['Histórico por cliente', 'Situações', 'Visibilidade restrita', 'Exportação'],
    primaryField: 'assunto', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Atendimento', sections: [{ id: 'dados', title: 'Dados gerais', fields: [
      { key: 'cliente', label: 'Cliente', required: true }, { key: 'atendente', label: 'Atendente', required: true }, { key: 'tipo', label: 'Tipo', type: 'select', options: ['Ativo', 'Receptivo'] },
      { key: 'visibilidade', label: 'Visibilidade', type: 'select', options: ['Pública', 'Restrita'] }, { key: 'assunto', label: 'Assunto', required: true },
      { key: 'forma_atendimento', label: 'Forma de atendimento', type: 'select', options: ['Presencial', 'Telefone', 'WhatsApp', 'E-mail', 'Chat', 'Outro'] },
      { key: 'situacao', label: 'Situação', type: 'select', options: ['Aberto', 'Em atendimento', 'Aguardando cliente', 'Resolvido', 'Cancelado'] },
      { key: 'descricao', label: 'Descrição', type: 'textarea', width: 'full', required: true },
    ] }, attachmentSection] }], actions: [...generalActions, 'Imprimir PDF', 'Alterar situação', 'Consultar histórico do cliente'],
  },
  {
    id: 'agenda', title: 'Agenda', singular: 'compromisso', section: 'Agenda', icon: '▦',
    description: 'Compromissos de clientes, fornecedores, transportadoras e funcionários.', benefits: ['Visão mensal, semanal e diária', 'Responsáveis', 'Situações', 'Integração com Google Agenda'],
    primaryField: 'compromisso', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Compromisso', sections: [{ id: 'dados', title: 'Compromisso', fields: [
      { key: 'compromisso', label: 'Compromisso', required: true }, { key: 'responsavel', label: 'Responsável', required: true }, { key: 'tipo_entidade', label: 'Tipo de entidade', type: 'select', options: ['Cliente', 'Fornecedor', 'Transportadora', 'Funcionário'] }, { key: 'entidade', label: 'Entidade vinculada' }, { key: 'data', label: 'Data', type: 'date', required: true }, { key: 'horario_inicio', label: 'Horário de início' }, { key: 'horario_fim', label: 'Horário de fim' }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Agendado', 'Confirmado', 'Concluído', 'Cancelado'] }, { key: 'local', label: 'Local' }, { key: 'descricao', label: 'Descrição', type: 'textarea', width: 'full' },
    ] }] }], actions: [...generalActions, 'Visualização mensal', 'Visualização semanal', 'Visualização diária'], integrationActions: ['Sincronizar Google Agenda'],
  },
]

modules.push(...simpleModules)

function fiscalDefinition(id: string, title: string, kind: 'nfe' | 'nfse' | 'nfce' | 'compra'): ModuleDefinition {
  const isService = kind === 'nfse'
  return {
    id, title, singular: 'nota fiscal', section: 'Fiscal', icon: '⌘',
    description: `Cadastro e controle de ${title.toLowerCase()} com destinatário, itens, impostos, transporte, pagamento e documentos.`,
    benefits: ['Dados fiscais completos', 'Importação e exportação de XML', 'Histórico por empresa', 'Emissão conforme integração'],
    primaryField: 'numero', statusField: 'situacao', totalField: 'valor_total',
    tabs: [{ id: 'nota', label: title, sections: [
      { id: 'dados', title: 'Dados gerais', fields: [
        { key: 'numero', label: 'Número', defaultValue: 'Automático' }, { key: 'serie', label: 'Série' }, { key: 'natureza_operacao', label: 'Natureza da operação', required: true },
        { key: 'tipo_operacao', label: 'Tipo', type: 'select', options: ['Entrada', 'Saída'] }, { key: 'finalidade', label: 'Finalidade da emissão' },
        { key: 'forma_emissao', label: 'Forma de emissão' }, { key: 'emissao_em', label: 'Data e hora da emissão', type: 'datetime-local' },
        { key: 'situacao', label: 'Situação', type: 'select', options: ['Rascunho', 'Pendente', 'Autorizada', 'Rejeitada', 'Cancelada'] },
      ] },
      { id: 'destinatario', title: isService ? 'Tomador do serviço' : 'Destinatário', fields: [
        { key: 'cliente_fornecedor', label: 'Cliente ou fornecedor', required: true }, { key: 'tipo_pessoa', label: 'Tipo de pessoa', type: 'select', options: personOptions },
        { key: 'razao_social', label: 'Nome ou razão social' }, { key: 'cpf_cnpj', label: 'CPF / CNPJ / documento estrangeiro' },
        { key: 'inscricao_estadual', label: 'Inscrição estadual' }, { key: 'inscricao_municipal', label: 'Inscrição municipal' },
      ], repeatables: [addresses, contacts] },
      { id: 'itens', title: isService ? 'Serviços e tributos' : 'Produtos e impostos', repeatables: [isService ? serviceItems : productItems] },
      { id: 'impostos', title: 'Impostos e retenções', fields: [
        { key: 'base_calculo', label: 'Base de cálculo', type: 'money' }, { key: 'icms', label: 'ICMS', type: 'money' }, { key: 'ipi', label: 'IPI', type: 'money' },
        { key: 'iss', label: 'ISS', type: 'money' }, { key: 'pis', label: 'PIS', type: 'money' }, { key: 'cofins', label: 'COFINS', type: 'money' },
        { key: 'csll', label: 'CSLL', type: 'money' }, { key: 'ir', label: 'IR', type: 'money' }, { key: 'inss', label: 'INSS', type: 'money' },
        { key: 'deducoes', label: 'Deduções', type: 'money' }, { key: 'valor_total', label: 'Valor total', type: 'money' },
      ] },
      { id: 'transporte', title: 'Transporte e volumes', fields: [{ key: 'modalidade_frete', label: 'Modalidade do frete' }, { key: 'transportadora', label: 'Transportadora' }, { key: 'placa', label: 'Placa do veículo' }, { key: 'uf_placa', label: 'UF da placa', type: 'select', options: states }, { key: 'rntrc', label: 'RNTRC' }, { key: 'quantidade_volumes', label: 'Quantidade de volumes', type: 'number' }, { key: 'peso_liquido', label: 'Peso líquido', type: 'number' }, { key: 'peso_bruto', label: 'Peso bruto', type: 'number' }] },
      { id: 'pagamento', title: 'Pagamento', repeatables: [paymentRows] }, attachmentSection, notesSection,
    ] }],
    actions: [...generalActions, 'Emitir', 'Consultar aprovação', 'Cancelar', 'Carta de correção', 'Inutilizar numeração', 'Baixar XML', 'Importar XML'],
    integrationActions: ['Emitir documento fiscal', 'Consultar SEFAZ'],
  }
}

modules.push(
  fiscalDefinition('notas-produtos', 'NF-e', 'nfe'),
  fiscalDefinition('notas-servicos', 'NFS-e', 'nfse'),
  fiscalDefinition('notas-consumidor', 'NFC-e', 'nfce'),
  fiscalDefinition('notas-compras', 'Notas de compras', 'compra'),
)

const genericDefinitions: Array<[string,string,string,string,string]> = [
  ['cadastros-opcoes','Opções auxiliares de cadastros','opção auxiliar','Cadastros','Tipos de endereço, contatos, canais, centros de custo, situações, formas, categorias, marcas e unidades.'],
  ['itens-opcoes','Opções auxiliares de itens','opção auxiliar','Itens','Categorias, marcas, unidades, grades, variações e campos extras.'],
  ['grades-variacoes','Grades e variações','grade','Itens','Grades como tamanho, cor e modelo, com suas variações.'],
  ['orcamentos-opcoes','Opções auxiliares de orçamentos','opção auxiliar','Orçamentos','Situações, modelos, introduções e condições comerciais.'],
  ['vendas-opcoes','Opções auxiliares de vendas','opção auxiliar','Vendas','Situações, canais, limites e configurações comerciais.'],
  ['os-painel','Painel de ordens de serviço','indicador','Ordens de serviços','Indicadores, filas e acompanhamento operacional das ordens de serviço.'],
  ['os-opcoes','Opções auxiliares de O.S.','opção auxiliar','Ordens de serviços','Situações, equipamentos, garantias, técnicos e modelos.'],
  ['estoque-opcoes','Opções auxiliares de estoque','opção auxiliar','Estoque','Situações, unidades, depósitos, locais e regras de movimentação.'],
  ['financeiro-opcoes','Opções auxiliares financeiras','opção auxiliar','Financeiro','Plano de contas, categorias, centros de custo, rateios, situações e campos extras.'],
  ['dre','DRE gerencial','demonstrativo','Financeiro','Receitas, despesas, resultado operacional e filtros por período.'],
  ['fluxo-caixa','Fluxo de caixa','movimento financeiro','Financeiro','Entradas, saídas, saldos previstos e realizados por período.'],
  ['boletos','Boletos bancários','boleto','Financeiro','Emissão, remessa, retorno e acompanhamento de boletos.'],
  ['fiscal-opcoes','Opções auxiliares fiscais','opção auxiliar','Fiscal','Naturezas, séries, CFOP, impostos, CSC, tokens e regras fiscais.'],
  ['importacao-dados','Importação de dados','importação','Fiscal','Importação de clientes, fornecedores, produtos, XML e lançamentos financeiros.'],
  ['contratos-opcoes','Opções auxiliares de contratos','situação','Contratos','Situações de contrato e locação, regras financeiras, cores e bloqueios por grupo.'],
  ['relatorios','Relatórios','relatório','Relatórios','Relatórios de cadastros, vendas, O.S., estoque, financeiro, contratos, fiscal, agenda e logs.'],
  ['area-cliente','Área do Cliente','acesso de cliente','Área do Cliente','Acessos, convites, serviços disponíveis, mensagens e domínio personalizado.'],
  ['integracoes','Integrações e aplicativos','integração','Aplicativos','CRM, marketplaces, bancos, gateways, assinatura, expedição, RH, loja virtual e API.'],
  ['contabilidade','Área da Contabilidade','empresa contábil','Aplicativos','Departamentos, empresas, permissões, exportação, plano de contas, mensagens e Sintegra.'],
  ['loja-virtual','Loja Virtual','configuração de loja','Aplicativos','Produtos, vendas, aparência, domínio, pagamentos, envios, marketing e integrações.'],
  ['config-gerais','Configurações gerais','configuração','Configurações','Preferências gerais, casas decimais, backup, domínio e regras da empresa.'],
  ['meu-plano','Meu plano','plano','Configurações','Plano contratado, limites, módulos, cobrança e histórico.'],
  ['dados-empresa','Dados da empresa','empresa','Configurações','Dados cadastrais, fiscais, contato, endereço e logotipo.'],
  ['marca-empresa','Marca da empresa','marca','Configurações','Logotipo, cores, slogan, favicon e domínio personalizado.'],
  ['empresas-lojas','Empresas / Lojas','loja','Configurações','Matriz, filiais, lojas permitidas, estoque e usuários por loja.'],
  ['certificado-digital','Certificado digital','certificado','Configurações','Certificado A1, validade e uso em documentos fiscais.'],
  ['modelos-email','Modelos de e-mails','modelo de e-mail','Configurações','Assuntos e mensagens para convites, cobranças, vendas e documentos.'],
  ['avisos-email','Avisos por e-mail','aviso','Configurações','Alertas, destinatários, eventos e frequência de envio.'],
]

for (const [id,title,singular,section,description] of genericDefinitions) {
  modules.push({
    id, title, singular, section, icon: '▦', description,
    benefits: ['Cadastro padronizado', 'Pesquisa e filtros', 'Permissões por grupo', 'Histórico e auditoria'],
    primaryField: 'nome', statusField: 'situacao',
    tabs: [{ id: 'dados', label: 'Dados', sections: [{ id: 'dados', title: 'Dados gerais', fields: [
      { key: 'nome', label: 'Nome / identificação', required: true },
      { key: 'tipo', label: 'Tipo / categoria' },
      { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
      { key: 'cor', label: 'Cor', type: 'color' },
      { key: 'descricao', label: 'Descrição / configuração', type: 'textarea', width: 'full' },
      { key: 'configuracoes_adicionais', label: 'Configurações adicionais', type: 'textarea', width: 'full' },
    ] }, attachmentSection] }], actions: generalActions,
  })
}



// Definições detalhadas para configurações, importações, relatórios e portais.
modules.push(
  {
    id: 'cadastros-opcoes', title: 'Opções auxiliares de cadastros', singular: 'opção auxiliar', section: 'Cadastros', icon: '▦',
    description: 'Cadastros reutilizados nos demais módulos.', benefits: ['Padronizar preenchimento', 'Evitar duplicidade', 'Controlar situações', 'Aplicar em toda a empresa'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Opção auxiliar', sections: [{ id: 'dados', title: 'Dados gerais', fields: [
      { key: 'tipo', label: 'Tipo de cadastro', type: 'select', options: ['Tipo de endereço','Tipo de contato','Canal de venda','Centro de custo','Situação personalizada','Forma de pagamento','Categoria financeira','Categoria de produto','Marca','Unidade','Vendedor','Técnico','Outro'], required: true },
      { key: 'nome', label: 'Nome', required: true }, { key: 'codigo', label: 'Código' }, { key: 'cor', label: 'Cor', type: 'color' },
      { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
      { key: 'padrao', label: 'Definir como padrão', type: 'checkbox' }, { key: 'descricao', label: 'Descrição', type: 'textarea', width: 'full' },
    ] }] }], actions: generalActions,
  },
  {
    id: 'grades-variacoes', title: 'Grades e variações', singular: 'grade', section: 'Itens', icon: '▦',
    description: 'Grades de tamanho, cor, modelo e outras variações usadas nos produtos.', benefits: ['Gerar variações', 'Código de barras por variação', 'Estoque independente', 'Preço e custo específicos'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Grade', sections: [{ id: 'dados', title: 'Dados da grade', fields: [
      { key: 'nome', label: 'Nome da grade', required: true }, { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
      { key: 'descricao', label: 'Descrição', type: 'textarea', width: 'full' },
    ], repeatables: [{ key: 'variacoes', title: 'Variações', addLabel: 'Adicionar variação', minimumRows: 1, columns: [
      { key: 'nome', label: 'Variação', required: true }, { key: 'codigo', label: 'Código' }, { key: 'cor', label: 'Cor' }, { key: 'ordem', label: 'Ordem', type: 'number' },
    ] }] }] }], actions: generalActions,
  },
  {
    id: 'importacao-dados', title: 'Importação de dados', singular: 'importação', section: 'Fiscal', icon: '⬆',
    description: 'Importe planilhas, XML e lançamentos para os módulos do CicloPag.', benefits: ['Clientes e fornecedores', 'Produtos e NF-e', 'Compras e XML', 'Contas a pagar e receber'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'importacao', label: 'Importação', sections: [
      { id: 'dados', title: 'Configuração da importação', fields: [
        { key: 'nome', label: 'Identificação da importação', required: true },
        { key: 'tipo', label: 'Tipo de importação', type: 'select', options: ['Clientes por planilha','Clientes por XML','Fornecedores por planilha','Produtos por planilha','Produtos por NF-e','XML de compra por arquivo','Buscar XML na SEFAZ','XML sem financeiro','Contas a pagar','Contas a receber'], required: true },
        { key: 'gerar_financeiro', label: 'Gerar lançamento financeiro', type: 'checkbox' }, { key: 'atualizar_existentes', label: 'Atualizar registros existentes', type: 'checkbox' },
        { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente','Validando','Concluída','Com erros'], defaultValue: 'Pendente' },
        { key: 'observacoes', label: 'Observações', type: 'textarea', width: 'full' },
      ] }, attachmentSection] }], actions: [...generalActions, 'Validar arquivo', 'Processar importação', 'Baixar relatório de erros'], integrationActions: ['Buscar XML na SEFAZ'],
  },
  {
    id: 'relatorios', title: 'Relatórios', singular: 'relatório', section: 'Relatórios', icon: '▩',
    description: 'Relatórios operacionais, financeiros, fiscais, comerciais e de auditoria.', benefits: ['Filtros completos', 'Exportação', 'Impressão', 'Dados por loja e usuário'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'filtros', label: 'Relatório', sections: [{ id: 'filtros', title: 'Filtros do relatório', fields: [
      { key: 'nome', label: 'Nome do relatório', required: true }, { key: 'categoria', label: 'Categoria', type: 'select', options: ['Cadastros','Clientes','Fornecedores','Funcionários','Produtos','Serviços','Vendas','Ordens de serviço','Estoque','Comissões','Financeiro','Contratos','Notas fiscais','Atendimentos','Agendamentos','Logs'], required: true },
      { key: 'data_inicial', label: 'Período inicial', type: 'date' }, { key: 'data_final', label: 'Período final', type: 'date' }, { key: 'situacao_filtro', label: 'Situação' },
      { key: 'vendedor', label: 'Vendedor' }, { key: 'cliente', label: 'Cliente' }, { key: 'fornecedor', label: 'Fornecedor' }, { key: 'loja', label: 'Loja' }, { key: 'produto', label: 'Produto' },
      { key: 'formato', label: 'Formato', type: 'select', options: ['Tela','PDF','CSV','Excel'], defaultValue: 'Tela' }, { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
    ] }] }], actions: ['Visualizar','Gerar relatório','Imprimir','Exportar PDF','Exportar CSV','Salvar modelo'],
  },
  {
    id: 'dados-empresa', title: 'Dados da empresa', singular: 'empresa', section: 'Configurações', icon: '⌂',
    description: 'Dados cadastrais, fiscais, contato, endereço e logotipo da empresa.', benefits: ['Documentos fiscais', 'Identidade da empresa', 'Contato comercial', 'Configuração tributária'],
    primaryField: 'nome_fantasia', statusField: 'situacao', tabs: [
      { id: 'empresa', label: 'Dados gerais', sections: [{ id: 'dados', title: 'Dados da empresa', fields: [
        { key: 'tipo_pessoa', label: 'Tipo de pessoa', type: 'select', options: personOptions, required: true }, { key: 'nome_fantasia', label: 'Nome fantasia', required: true },
        { key: 'razao_social', label: 'Razão social', required: true }, { key: 'cnpj', label: 'CNPJ / CPF' }, { key: 'inscricao_estadual', label: 'Inscrição estadual' },
        { key: 'inscricao_municipal', label: 'Inscrição municipal' }, { key: 'cnae_principal', label: 'CNAE principal' },
        { key: 'regime_tributario', label: 'Regime tributário', type: 'select', options: ['Simples Nacional','Lucro Presumido','Lucro Real','MEI','Outro'] },
        { key: 'regime_especial', label: 'Regime especial de tributação' }, { key: 'substituicao_tributaria', label: 'Regime de substituição tributária' },
        { key: 'email', label: 'E-mail', type: 'email' }, { key: 'telefone', label: 'Telefone', type: 'tel' }, { key: 'celular', label: 'Celular', type: 'tel' }, { key: 'site', label: 'Site' },
        { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
      ] }] },
      { id: 'endereco', label: 'Endereço', sections: [{ id: 'endereco', title: 'Endereço', repeatables: [addresses] }] },
      { id: 'logotipo', label: 'Logotipo', sections: [{ id: 'foto', title: 'Logotipo', description: 'PNG, JPG ou GIF de até 5 MB com ferramenta de recorte.' }] },
    ], actions: ['Visualizar','Editar','Salvar','Imprimir ficha cadastral'],
  },
  {
    id: 'marca-empresa', title: 'Marca da empresa', singular: 'configuração de marca', section: 'Configurações', icon: '◆',
    description: 'Personalização visual da empresa no CicloPag e na Área do Cliente.', benefits: ['Logotipo', 'Cores próprias', 'Slogan', 'Domínio personalizado'],
    primaryField: 'nome_exibicao', statusField: 'situacao', tabs: [{ id: 'marca', label: 'Marca', sections: [{ id: 'marca', title: 'Identidade visual', fields: [
      { key: 'nome_exibicao', label: 'Nome de exibição', required: true }, { key: 'slogan', label: 'Slogan' },
      { key: 'cor_primaria', label: 'Cor primária', type: 'color', defaultValue: '#0b1e2a' }, { key: 'cor_secundaria', label: 'Cor secundária', type: 'color', defaultValue: '#00a95c' },
      { key: 'cor_fundo', label: 'Cor de fundo', type: 'color', defaultValue: '#f5f6f7' }, { key: 'dominio_personalizado', label: 'Domínio personalizado' },
      { key: 'email_suporte', label: 'E-mail de suporte', type: 'email' }, { key: 'whatsapp', label: 'WhatsApp', type: 'tel' }, { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
    ] }, { id: 'foto', title: 'Logotipo e favicon', description: 'Envie logotipo e favicon em arquivos de até 5 MB.' }] }], actions: generalActions,
  },
  {
    id: 'empresas-lojas', title: 'Empresas / Lojas', singular: 'loja', section: 'Configurações', icon: '⌂',
    description: 'Matriz, filiais, lojas, usuários permitidos e estoque por unidade.', benefits: ['Multiempresa', 'Multiloja', 'Estoque por loja', 'Usuários por unidade'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'loja', label: 'Loja', sections: [{ id: 'dados', title: 'Dados da loja', fields: [
      { key: 'nome', label: 'Nome da loja', required: true }, { key: 'tipo', label: 'Tipo', type: 'select', options: ['Matriz','Filial','Loja','Depósito'] },
      { key: 'documento', label: 'CNPJ / CPF' }, { key: 'inscricao_estadual', label: 'Inscrição estadual' }, { key: 'email', label: 'E-mail', type: 'email' },
      { key: 'telefone', label: 'Telefone', type: 'tel' }, { key: 'estoque_independente', label: 'Estoque independente', type: 'checkbox' },
      { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
    ], repeatables: [addresses] }, { id: 'usuarios', title: 'Usuários permitidos', repeatables: [{ key: 'usuarios_loja', title: 'Usuários', addLabel: 'Adicionar usuário', minimumRows: 0, columns: [{ key: 'usuario', label: 'Usuário' }, { key: 'grupo', label: 'Grupo' }, { key: 'acesso', label: 'Acesso', options: ['Permitido','Bloqueado'] }] }] }] }], actions: generalActions,
  },
  {
    id: 'area-cliente', title: 'Área do Cliente', singular: 'acesso de cliente', section: 'Área do Cliente', icon: '♟',
    description: 'Acessos de clientes, convites, serviços disponíveis, mensagens e domínio próprio.', benefits: ['Convite por e-mail', 'Cadastro manual', 'Documentos permitidos', 'Atendimentos e contratos'],
    primaryField: 'cliente', statusField: 'situacao', tabs: [{ id: 'acesso', label: 'Acesso', sections: [
      { id: 'dados', title: 'Dados do acesso', fields: [{ key: 'cliente', label: 'Cliente', required: true }, { key: 'email', label: 'E-mail', type: 'email', required: true }, { key: 'forma_criacao', label: 'Forma de criação', type: 'select', options: ['Convite por e-mail','Cadastro manual'] }, { key: 'senha', label: 'Senha inicial', type: 'password' }, { key: 'confirmar_senha', label: 'Confirmar senha', type: 'password' }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente','Ativo','Bloqueado'], defaultValue: 'Pendente' }] },
      { id: 'servicos', title: 'Serviços disponíveis', fields: [{ key: 'consultar_atendimentos', label: 'Consultar atendimentos', type: 'checkbox', defaultValue: true }, { key: 'consultar_documentos', label: 'Consultar documentos', type: 'checkbox', defaultValue: true }, { key: 'consultar_financeiro', label: 'Consultar financeiro', type: 'checkbox' }, { key: 'consultar_contratos', label: 'Consultar contratos', type: 'checkbox' }] },
      { id: 'mensagem', title: 'Mensagem do convite', fields: [{ key: 'nome_remetente', label: 'Nome do remetente' }, { key: 'email_resposta', label: 'E-mail de resposta', type: 'email' }, { key: 'assunto', label: 'Assunto' }, { key: 'mensagem', label: 'Mensagem', type: 'textarea', width: 'full' }, { key: 'dominio', label: 'Domínio personalizado' }] },
    ] }], actions: [...generalActions, 'Enviar convite', 'Redefinir senha', 'Bloquear acesso'], integrationActions: ['Enviar convite por e-mail'],
  },
  {
    id: 'integracoes', title: 'Integrações e aplicativos', singular: 'integração', section: 'Aplicativos', icon: '▦',
    description: 'Conexões com CRM, marketplaces, pagamentos, bancos, assinatura, expedição, RH e API.', benefits: ['API por token', 'Marketplaces', 'Bancos e gateways', 'Aplicativos adicionais'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'integracao', label: 'Integração', sections: [{ id: 'dados', title: 'Configuração da integração', fields: [
      { key: 'nome', label: 'Integração', type: 'select', options: ['Pipedrive','Mercado Livre','Mercado Pago','Shopee','NuvemShop','Loja Integrada','Tray','PagSeguro','PagHiper','Efí Bank','Banco Inter','Cora','Iugu','Stone','SendGrid','Assinatura digital','Controle de produção','Controle patrimonial','Cobranças','CT-e','MDF-e','Expedição','Recursos Humanos','Área do Cliente','Loja Virtual','API por token'], required: true },
      { key: 'ambiente', label: 'Ambiente', type: 'select', options: ['Produção','Homologação'] }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Não configurada','Ativa','Pausada','Com erro'], defaultValue: 'Não configurada' },
      { key: 'identificador_publico', label: 'Identificador público' }, { key: 'endpoint', label: 'Endpoint / URL' }, { key: 'configuracoes', label: 'Configurações não secretas', type: 'textarea', width: 'full', help: 'Segredos devem ficar em Worker/Supabase Secrets, nunca no frontend.' },
    ] }] }], actions: [...generalActions, 'Testar conexão', 'Sincronizar agora', 'Consultar logs'],
  },
  {
    id: 'contabilidade', title: 'Área da Contabilidade', singular: 'configuração contábil', section: 'Aplicativos', icon: '▦',
    description: 'Empresas, departamentos, permissões, exportações, mensagens e Sintegra.', benefits: ['Exportação fiscal', 'Exportação contábil', 'Convite ao contador', 'Departamentos e permissões'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'dados', label: 'Contabilidade', sections: [
      { id: 'empresa', title: 'Dados do escritório / contador', fields: [{ key: 'nome', label: 'Nome', required: true }, { key: 'documento', label: 'CPF / CNPJ' }, { key: 'email', label: 'E-mail', type: 'email' }, { key: 'telefone', label: 'Telefone', type: 'tel' }, { key: 'situacao', label: 'Situação', type: 'select', options: activeOptions, defaultValue: 'Ativo' }] },
      { id: 'departamentos', title: 'Departamentos', fields: [{ key: 'departamento_contabil', label: 'Departamento contábil', type: 'checkbox' }, { key: 'departamento_fiscal', label: 'Departamento fiscal', type: 'checkbox' }, { key: 'departamento_administrativo', label: 'Departamento administrativo', type: 'checkbox' }, { key: 'departamento_pessoal', label: 'Departamento pessoal', type: 'checkbox' }] },
      { id: 'recursos', title: 'Recursos permitidos', fields: [{ key: 'exportacao_fiscal', label: 'Exportação fiscal', type: 'checkbox' }, { key: 'exportacao_contabil', label: 'Exportação contábil', type: 'checkbox' }, { key: 'sintegra', label: 'Sintegra', type: 'checkbox' }, { key: 'plano_contas', label: 'Plano de contas', type: 'checkbox' }, { key: 'recibos', label: 'Recibos', type: 'checkbox' }] },
    ] }], actions: [...generalActions, 'Convidar contador', 'Exportar fiscal', 'Exportar contábil', 'Gerar Sintegra'],
  },
  {
    id: 'loja-virtual', title: 'Loja Virtual', singular: 'configuração de loja virtual', section: 'Aplicativos', icon: '▦',
    description: 'Administração de catálogo, aparência, domínio, pagamentos, envios e marketing.', benefits: ['Catálogo e vendas', 'CSS e HTML personalizados', 'Domínio próprio', 'Marketing e integrações'],
    primaryField: 'nome', statusField: 'situacao', tabs: [
      { id: 'dados', label: 'Dados da loja', sections: [{ id: 'dados', title: 'Dados da loja', fields: [{ key: 'nome', label: 'Nome da loja', required: true }, { key: 'dominio', label: 'Domínio' }, { key: 'email', label: 'E-mail', type: 'email' }, { key: 'telefone', label: 'Telefone', type: 'tel' }, { key: 'situacao', label: 'Situação', type: 'select', options: ['Rascunho','Publicada','Pausada'], defaultValue: 'Rascunho' }] }] },
      { id: 'aparencia', label: 'Aparência', sections: [{ id: 'aparencia', title: 'Aparência', fields: [{ key: 'cor_primaria', label: 'Cor primária', type: 'color' }, { key: 'cor_secundaria', label: 'Cor secundária', type: 'color' }, { key: 'css', label: 'CSS personalizado', type: 'textarea', width: 'full' }, { key: 'html', label: 'HTML personalizado', type: 'textarea', width: 'full' }] }, { id: 'foto', title: 'Logotipo e banners', description: 'Envie logotipo, banners e imagens da loja.' }] },
      { id: 'comercial', label: 'Comercial', sections: [{ id: 'comercial', title: 'Configurações comerciais', fields: [{ key: 'formas_pagamento', label: 'Formas de pagamento', type: 'textarea', width: 'full' }, { key: 'formas_envio', label: 'Formas de envio', type: 'textarea', width: 'full' }, { key: 'situacoes_venda', label: 'Situações das vendas', type: 'textarea', width: 'full' }, { key: 'modelos_email', label: 'Modelos de e-mail', type: 'textarea', width: 'full' }, { key: 'redirecionamentos', label: 'Redirecionamentos', type: 'textarea', width: 'full' }] }] },
    ], actions: [...generalActions, 'Publicar loja', 'Visualizar loja', 'Sincronizar produtos'],
  },
  {
    id: 'contratos-opcoes', title: 'Situações de contratos e locações', singular: 'situação', section: 'Contratos', icon: '▱',
    description: 'Situações personalizadas com efeitos financeiros, estoque e restrição por grupo.', benefits: ['Situação padrão', 'Gerar financeiro', 'Movimentar estoque', 'Restringir grupos'],
    primaryField: 'nome', statusField: 'situacao', tabs: [{ id: 'situacao', label: 'Situação', sections: [{ id: 'dados', title: 'Configuração da situação', fields: [
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Contrato de serviço','Contrato de locação'], required: true }, { key: 'nome', label: 'Nome da situação', required: true },
      { key: 'gerar_financeiro', label: 'Gerar financeiro', type: 'checkbox' }, { key: 'movimentar_estoque', label: 'Movimentar estoque', type: 'checkbox' },
      { key: 'cor', label: 'Cor', type: 'color' }, { key: 'padrao', label: 'Situação padrão', type: 'checkbox' }, { key: 'mostrar_listagem', label: 'Mostrar na listagem', type: 'checkbox', defaultValue: true },
      { key: 'grupos_bloqueados', label: 'Grupos de usuários bloqueados', type: 'textarea', width: 'full' }, { key: 'situacao', label: 'Situação do cadastro', type: 'select', options: activeOptions, defaultValue: 'Ativo' },
    ] }] }], actions: generalActions,
  },
)

const uniqueModuleMap = new Map<string, ModuleDefinition>()
for (const module of modules) uniqueModuleMap.set(module.id, module)

export const moduleCatalog = Object.fromEntries(uniqueModuleMap) as Record<string, ModuleDefinition>

export const permissionModules = [
  ...Array.from(uniqueModuleMap.values()).map((module) => ({ id: module.id, title: module.title, section: module.section })),
  { id: 'usuarios', title: 'Usuários', section: 'Configurações' },
  { id: 'grupos-usuarios', title: 'Grupos de usuários', section: 'Configurações' },
].sort((a, b) => a.section.localeCompare(b.section, 'pt-BR') || a.title.localeCompare(b.title, 'pt-BR'))

export function getModuleDefinition(pageId: string) {
  const clean = pageId.split(':')[0].replace(/-(adicionar|editar|visualizar)$/, '')
  return moduleCatalog[clean] ?? null
}

export function parseOperationalPage(pageId: string) {
  const [route, recordId] = pageId.split(':')
  if (route.endsWith('-adicionar')) return { mode: 'create' as const, moduleId: route.replace(/-adicionar$/, ''), recordId: null }
  if (route.endsWith('-editar')) return { mode: 'edit' as const, moduleId: route.replace(/-editar$/, ''), recordId: recordId ?? null }
  if (route.endsWith('-visualizar')) return { mode: 'view' as const, moduleId: route.replace(/-visualizar$/, ''), recordId: recordId ?? null }
  return { mode: 'list' as const, moduleId: route, recordId: null }
}
