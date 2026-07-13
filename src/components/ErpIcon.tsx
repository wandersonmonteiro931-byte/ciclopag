import type { CSSProperties } from 'react'

export type IconName = string

type Props = {
  name: IconName
  className?: string
  style?: CSSProperties
}

function Svg({ children, className, style, fill = 'none' }: { children: React.ReactNode; className?: string; style?: CSSProperties; fill?: string }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill={fill} aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      {children}
    </svg>
  )
}

export function ErpIcon({ name, className, style }: Props) {
  const common = { stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (name) {
    case 'cadastros':
    case 'itens':
      return <Svg className={className} style={style}><path d="M4 6h16M4 12h16M4 18h16" {...common} /><path d="M6 6v12" {...common} /></Svg>
    case 'clientes':
      return <Svg className={className} style={style}><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...common} /><path d="M3.5 18.5c.9-2.4 2.8-3.5 5.5-3.5s4.6 1.1 5.5 3.5" {...common} /><path d="M16.5 9.5a2.5 2.5 0 1 0 0-5" {...common} /><path d="M16.5 15c2.1 0 3.6.8 4 2.7" {...common} /></Svg>
    case 'fornecedores':
      return <Svg className={className} style={style}><path d="M6 4h9l3 3v13H6z" {...common} /><path d="M15 4v3h3" {...common} /><path d="M9 11h6M9 15h6" {...common} /></Svg>
    case 'funcionarios':
      return <Svg className={className} style={style}><path d="M8 8h8v10H8z" {...common} /><path d="M10 8V6h4v2" {...common} /><path d="M5 10h3M16 10h3" {...common} /></Svg>
    case 'transportadoras':
      return <Svg className={className} style={style}><path d="M3 7h10v8H3zM13 10h4l2 2v3h-6z" {...common} /><circle cx="8" cy="18" r="1.6" {...common} /><circle cx="17" cy="18" r="1.6" {...common} /></Svg>
    case 'opcoes-auxiliares':
      return <Svg className={className} style={style}><path d="M9 4H5v16h10V8z" {...common} /><path d="M9 4v4h6" {...common} /><path d="M11 13h8M15 9v8" {...common} /></Svg>
    case 'tipos-contatos':
      return <Svg className={className} style={style}><path d="M4 12V7l10-3v16l-10-3z" {...common} /><path d="M14 9h2a3 3 0 0 1 0 6h-2" {...common} /></Svg>
    case 'tipos-enderecos':
      return <Svg className={className} style={style}><path d="M12 20s6-4.4 6-10a6 6 0 1 0-12 0c0 5.6 6 10 6 10Z" {...common} /><circle cx="12" cy="10" r="2.2" {...common} /></Svg>
    case 'campos-extras':
      return <Svg className={className} style={style}><path d="M6 4h9l3 3v13H6z" {...common} /><path d="M15 4v3h3" {...common} /><path d="M9 12h6M12 9v6" {...common} /></Svg>
    case 'produtos':
    case 'estoque':
      return <Svg className={className} style={style}><path d="M12 3l8 4.5-8 4.5-8-4.5zM4 7.5V16.5L12 21l8-4.5V7.5" {...common} /></Svg>
    case 'servicos':
      return <Svg className={className} style={style}><path d="M14.5 5.5a3 3 0 1 1 4 4L10 18l-4 1 1-4z" {...common} /><path d="M13 7l4 4" {...common} /></Svg>
    case 'etiquetas':
      return <Svg className={className} style={style}><path d="M4 12V5h7l9 9-6 6-9-9z" {...common} /><circle cx="9" cy="9" r="1.2" {...common} /></Svg>
    case 'valores-venda':
      return <Svg className={className} style={style}><path d="M12 4v16M16 8c0-1.7-1.8-3-4-3s-4 1.3-4 3 1 2.4 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" {...common} /></Svg>
    case 'grupos-produtos':
      return <Svg className={className} style={style}><rect x="4" y="4" width="6" height="6" {...common} /><rect x="14" y="4" width="6" height="6" {...common} /><rect x="9" y="14" width="6" height="6" {...common} /></Svg>
    case 'unidades-produtos':
      return <Svg className={className} style={style}><path d="M9 4h6l-1 4 4 8H6l4-8z" {...common} /><path d="M8 16h8" {...common} /></Svg>
    case 'grades-variacoes':
      return <Svg className={className} style={style}><rect x="4" y="4" width="6" height="6" {...common} /><rect x="14" y="4" width="6" height="6" {...common} /><rect x="4" y="14" width="6" height="6" {...common} /><rect x="14" y="14" width="6" height="6" {...common} /></Svg>
    case 'orcamentos':
      return <Svg className={className} style={style}><path d="M6 4h9l3 3v13H6z" {...common} /><path d="M15 4v3h3" {...common} /><path d="M9 11h6M9 15h4" {...common} /></Svg>
    case 'vendas':
      return <Svg className={className} style={style}><path d="M5 6h14l-1 4H6z" {...common} /><path d="M7 10h10l1 8H6z" {...common} /></Svg>
    case 'balcao':
      return <Svg className={className} style={style}><path d="M5 6h14v11H5z" {...common} /><path d="M8 17v2M16 17v2M8 10h8" {...common} /></Svg>
    case 'devolucoes':
      return <Svg className={className} style={style}><path d="M9 8l-4 4 4 4" {...common} /><path d="M5 12h8a5 5 0 1 1 0 10" {...common} /></Svg>
    case 'situacoes':
    case 'situacoes-compra':
      return <Svg className={className} style={style}><path d="M6 7h12M6 12h12M6 17h12" {...common} /><circle cx="4" cy="7" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="17" r="1" fill="currentColor" /></Svg>
    case 'canais':
      return <Svg className={className} style={style}><path d="M4 11l15-6v14l-15-6z" {...common} /></Svg>
    case 'balancas':
      return <Svg className={className} style={style}><path d="M12 5l7 4-7 4-7-4z" {...common} /><path d="M5 18h14" {...common} /><path d="M9 9l-2 4h4zM15 9l-2 4h4z" {...common} /></Svg>
    case 'ordens-servicos':
      return <Svg className={className} style={style}><circle cx="12" cy="12" r="3" {...common} /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" {...common} /></Svg>
    case 'gerenciar-os':
    case 'servicos-gerenciar':
      return <Svg className={className} style={style}><path d="M14.5 5.5a3 3 0 1 1 4 4L10 18l-4 1 1-4z" {...common} /><path d="M13 7l4 4" {...common} /></Svg>
    case 'painel':
      return <Svg className={className} style={style}><path d="M5 18a7 7 0 1 1 14 0" {...common} /><path d="M12 11l3-3" {...common} /><path d="M12 7v1M8 9l.7.7M16 9l-.7.7" {...common} /></Svg>
    case 'movimentacoes':
      return <Svg className={className} style={style}><path d="M7 7h10l-3-3M17 17H7l3 3" {...common} /><path d="M17 7H9M7 17h8" {...common} /></Svg>
    case 'ajustes':
      return <Svg className={className} style={style}><path d="M14 6l4 4M8 18l-4-4M9 19l9-9-4-4-9 9z" {...common} /></Svg>
    case 'transferencias':
      return <Svg className={className} style={style}><path d="M5 8h12l-3-3M19 16H7l3 3" {...common} /></Svg>
    case 'cotacoes':
      return <Svg className={className} style={style}><path d="M6 4h9l3 3v13H6z" {...common} /><path d="M15 4v3h3" {...common} /><path d="M9 12h6M9 16h3" {...common} /></Svg>
    case 'compras':
      return <Svg className={className} style={style}><path d="M6 7h14l-1 4H7z" {...common} /><path d="M5 5h2l1 14h10l1-9" {...common} /><circle cx="10" cy="20" r="1.3" {...common} /><circle cx="17" cy="20" r="1.3" {...common} /></Svg>
    case 'financeiro':
      return <Svg className={className} style={style}><rect x="5" y="4" width="14" height="16" rx="2" {...common} /><path d="M8 8h8M8 12h8M8 16h5" {...common} /></Svg>
    case 'contas-pagar':
    case 'contas-receber':
      return <Svg className={className} style={style}><path d="M4 7h16v10H4z" {...common} /><path d="M4 10h16" {...common} /><circle cx="12" cy="14" r="2" {...common} /></Svg>
    case 'dre':
    case 'fluxo-caixa':
      return <Svg className={className} style={style}><path d="M5 18V6M5 18h14" {...common} /><path d="M8 15l3-3 2 2 5-6" {...common} /></Svg>
    case 'boletos-bancarios':
      return <Svg className={className} style={style}><path d="M5 6h14v12H5z" {...common} /><path d="M8 6v12M11 8v8M14 8v8M17 6v12" {...common} /></Svg>
    case 'gerenciar-boletos':
      return <Svg className={className} style={style}><path d="M5 6h14v12H5z" {...common} /><path d="M8 6v12M11 8v8M14 8v8M17 6v12" {...common} /><path d="M7 4h10" {...common} /></Svg>
    case 'exportar-remessa':
      return <Svg className={className} style={style}><path d="M12 5v10" {...common} /><path d="M8 11l4 4 4-4" {...common} /><path d="M5 19h14" {...common} /></Svg>
    case 'importar-retorno':
      return <Svg className={className} style={style}><path d="M12 19V9" {...common} /><path d="M8 13l4-4 4 4" {...common} /><path d="M5 5h14" {...common} /></Svg>
    case 'caixas':
      return <Svg className={className} style={style}><rect x="5" y="7" width="14" height="12" {...common} /><path d="M8 7V5h8v2" {...common} /></Svg>
    case 'contas-bancarias':
      return <Svg className={className} style={style}><path d="M4 10l8-5 8 5" {...common} /><path d="M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16" {...common} /></Svg>
    case 'formas-pagamento':
      return <Svg className={className} style={style}><path d="M4 8h16v8H4z" {...common} /><path d="M4 11h16" {...common} /></Svg>
    case 'plano-contas':
      return <Svg className={className} style={style}><path d="M7 6h10M7 12h10M7 18h10" {...common} /><path d="M5 6h.01M5 12h.01M5 18h.01" {...common} /></Svg>
    case 'centros-custos':
      return <Svg className={className} style={style}><path d="M12 4v16M4 12h16" {...common} /><circle cx="12" cy="12" r="7" {...common} /></Svg>
    case 'conciliacao-bancaria':
      return <Svg className={className} style={style}><path d="M7 12l3 3 7-7" {...common} /><rect x="4" y="4" width="16" height="16" rx="2" {...common} /></Svg>
    case 'tabelas-rateios':
      return <Svg className={className} style={style}><rect x="4" y="5" width="16" height="14" {...common} /><path d="M4 10h16M10 5v14" {...common} /></Svg>
    case 'fiscal':
      return <Svg className={className} style={style}><path d="M7 5h10v14H7z" {...common} /><path d="M9 9h6M9 13h6M9 17h4" {...common} /></Svg>
    case 'notas-produtos':
    case 'notas-servicos':
    case 'notas-consumidor':
    case 'notas-compras':
      return <Svg className={className} style={style}><path d="M6 4h12v16l-2-1.5L14 20l-2-1.5L10 20l-2-1.5L6 20z" {...common} /><path d="M9 9h6M9 13h6" {...common} /></Svg>
    case 'importar-xml':
      return <Svg className={className} style={style}><path d="M7 4h10v16H7z" {...common} /><path d="M9 9l-2 3 2 3M15 9l2 3-2 3M11 16l2-8" {...common} /></Svg>
    case 'certificado-digital':
      return <Svg className={className} style={style}><path d="M12 4l7 3v5c0 4.4-3 7.2-7 8-4-.8-7-3.6-7-8V7z" {...common} /><path d="M10 12l2 2 4-4" {...common} /></Svg>
    case 'naturezas-operacoes':
      return <Svg className={className} style={style}><path d="M5 12h14M12 5v14" {...common} /><circle cx="12" cy="12" r="8" {...common} /></Svg>
    case 'tributacoes':
      return <Svg className={className} style={style}><path d="M12 4v16M16 8c0-1.7-1.8-3-4-3s-4 1.3-4 3 1 2.4 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" {...common} /></Svg>
    case 'atividades-servicos':
      return <Svg className={className} style={style}><path d="M8 4h8l4 8-4 8H8l-4-8z" {...common} /></Svg>
    case 'intermediadores':
      return <Svg className={className} style={style}><path d="M7 7h10v10H7z" {...common} /><path d="M3 12h4M17 12h4" {...common} /></Svg>
    case 'contratos':
      return <Svg className={className} style={style}><path d="M6 4h12v16H6z" {...common} /><path d="M9 9h6M9 13h6" {...common} /><path d="M9 17h3" {...common} /></Svg>
    case 'locacoes':
      return <Svg className={className} style={style}><path d="M5 10l7-5 7 5" {...common} /><path d="M7 10v8h10v-8" {...common} /></Svg>
    case 'assinaturas':
      return <Svg className={className} style={style}><path d="M4 17l5-5 4 4 7-7" {...common} /><path d="M14 9h6v6" {...common} /></Svg>
    case 'atendimentos':
      return <Svg className={className} style={style}><path d="M5 7h14v9H9l-4 3z" {...common} /></Svg>
    case 'relatorios':
      return <Svg className={className} style={style}><path d="M5 18V6M5 18h14" {...common} /><rect x="8" y="11" width="2" height="5" fill="currentColor" /><rect x="12" y="9" width="2" height="7" fill="currentColor" /><rect x="16" y="7" width="2" height="9" fill="currentColor" /></Svg>
    case 'logs-sistema':
      return <Svg className={className} style={style}><path d="M12 5v7l4 2" {...common} /><circle cx="12" cy="12" r="7" {...common} /></Svg>
    case 'configuracoes':
    case 'gerais':
      return <Svg className={className} style={style}><circle cx="12" cy="12" r="3" {...common} /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7.7 7.7 0 0 0-1.8-1l-.3-2.6h-4l-.3 2.6a7.7 7.7 0 0 0-1.8 1l-2.4-1-2 3.5L5.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1c.6.4 1.2.7 1.8 1l.3 2.6h4l.3-2.6c.6-.3 1.2-.6 1.8-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1Z" {...common} /></Svg>
    case 'meu-plano':
      return <Svg className={className} style={style}><path d="M12 4l2.2 4.5 5 .7-3.6 3.5.8 5-4.4-2.3-4.4 2.3.8-5L4.8 9.2l5-.7z" {...common} /></Svg>
    case 'usuarios':
      return <Svg className={className} style={style}><path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" {...common} /><path d="M5 19c1-2.8 3.2-4 7-4s6 1.2 7 4" {...common} /></Svg>
    case 'dados-empresa':
      return <Svg className={className} style={style}><path d="M5 20V8l7-4 7 4v12" {...common} /><path d="M9 20v-6h6v6" {...common} /></Svg>
    case 'marca-empresa':
      return <Svg className={className} style={style}><path d="M6 19l3-9 3 4 3-8 3 13" {...common} /></Svg>
    case 'empresas-lojas':
      return <Svg className={className} style={style}><path d="M4 9h16v10H4z" {...common} /><path d="M8 9V6h8v3M8 14h2M14 14h2" {...common} /></Svg>
    case 'modelos-emails':
    case 'modelo-email':
      return <Svg className={className} style={style}><rect x="4" y="6" width="16" height="12" rx="1" {...common} /><path d="m5 8 7 5 7-5" {...common} /></Svg>
    case 'avisos-email':
      return <Svg className={className} style={style}><path d="M4 12V7l10-3v16l-10-3z" {...common} /><path d="M15 10h3M15 14h4" {...common} /></Svg>
    case 'home':
      return <Svg className={className} style={style}><path d="M4 11l8-6 8 6" {...common} /><path d="M6 10v9h12v-9" {...common} /></Svg>
    case 'app-grid':
      return <Svg className={className} style={style}><rect x="4" y="4" width="6" height="6" {...common} /><rect x="14" y="4" width="6" height="6" {...common} /><rect x="4" y="14" width="6" height="6" {...common} /><rect x="14" y="14" width="6" height="6" {...common} /></Svg>
    case 'sparkles':
      return <Svg className={className} style={style}><path d="M12 4l1.5 3.5L17 9l-3.5 1.5L12 14l-1.5-3.5L7 9l3.5-1.5zM18 4l.8 1.8L20.6 6l-1.8.8-.8 1.8-.8-1.8L15.4 6l1.8-.2zM18 15l.8 1.8 1.8.2-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.2z" {...common} /></Svg>
    case 'bell':
      return <Svg className={className} style={style}><path d="M7 10a5 5 0 0 1 10 0v5l2 2H5l2-2z" {...common} /><path d="M10 19a2 2 0 0 0 4 0" {...common} /></Svg>
    case 'logout':
      return <Svg className={className} style={style}><path d="M10 5H6v14h4" {...common} /><path d="M14 8l4 4-4 4M18 12H9" {...common} /></Svg>
    case 'arrow-down':
      return <Svg className={className} style={style}><path d="M6 9l6 6 6-6" {...common} /></Svg>
    case 'arrow-right':
      return <Svg className={className} style={style}><path d="M9 6l6 6-6 6" {...common} /></Svg>
    default:
      return <Svg className={className} style={style}><circle cx="12" cy="12" r="7" {...common} /></Svg>
  }
}

export default ErpIcon
