import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type Workspace = {
  empresa: {
    id: string
    nome: string
  }
}

type Props = {
  workspace: Workspace
  userName: string
  onComplete: () => Promise<void>
}

type ModuleOption = {
  id: string
  title: string
  description: string
  icon: string
}

const quickSegments = [
  { id: 'vestuario-moda', label: 'Vestuário e moda', icon: '♧' },
  { id: 'assistencia-tecnica', label: 'Assistência técnica', icon: '⚙' },
  { id: 'distribuidora-produtos', label: 'Distribuidora de produtos', icon: '◆' },
  { id: 'materiais-construcao', label: 'Materiais de construção', icon: '♙' },
  { id: 'oficina-mecanica', label: 'Oficina mecânica', icon: '⚒' },
  { id: 'servicos-ti', label: 'Serviços de TI', icon: '▱' },
]

const otherSegments = [
  'Adega',
  'Artesanato',
  'Automação residencial',
  'Clínica de estética',
  'Clínica veterinária',
  'Clínica de fisioterapia',
  'Consultoria e gestão',
  'Consultório odontológico',
  'Empório / mercearia',
  'Gráfica',
  'Papelaria',
  'Salão de beleza',
  'Tabacaria',
  'Serviços de transporte',
  'Outro',
]

const moduleOptions: ModuleOption[] = [
  {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Quero gerenciar entradas e saídas, centros de custo, plano de contas e DRE.',
    icon: '♛',
  },
  {
    id: 'vendas',
    title: 'Vendas',
    description: 'Quero organizar minhas vendas e contar com PDV integrado ao ERP.',
    icon: '▰',
  },
  {
    id: 'notas_fiscais',
    title: 'Fiscal',
    description: 'Quero emitir NF-e, NFS-e, NFC-e, CT-e ou MDF-e com facilidade.',
    icon: '⌘',
  },
  {
    id: 'ordens_servico',
    title: 'Serviços',
    description: 'Quero organizar ordens de serviço, contratos e atendimentos.',
    icon: '⚒',
  },
  {
    id: 'estoque',
    title: 'Estoque',
    description: 'Quero controlar o que entra e sai do meu estoque.',
    icon: '◆',
  },
  {
    id: 'assinatura_digital',
    title: 'Assinatura Digital',
    description: 'Quero assinar e solicitar assinaturas em documentos, orçamentos e contratos.',
    icon: '▤',
  },
  {
    id: 'contratos',
    title: 'Contratos e Locações',
    description: 'Quero gerenciar contratos, assinaturas e locações.',
    icon: '▱',
  },
  {
    id: 'loja_virtual',
    title: 'Loja Virtual',
    description: 'Quero gerenciar minha loja virtual e catálogo de produtos.',
    icon: '▥',
  },
  {
    id: 'integracoes',
    title: 'Aplicativos',
    description: 'Quero conectar meu negócio a outras plataformas.',
    icon: '∞',
  },
]

const toolOptions = [
  { id: 'planilhas', label: 'Planilhas (Excel/Google Sheets)', icon: '▧' },
  { id: 'papel', label: 'Caneta e papel', icon: '✎' },
  { id: 'outro_sistema', label: 'Outro sistema', icon: '•••' },
  { id: 'nenhum', label: 'Não utilizo nada', icon: '⊘' },
]

const contactOptions = [
  { id: 'whatsapp', label: 'WhatsApp', icon: '●' },
  { id: 'email', label: 'E-mail', icon: '✉' },
  { id: 'ligacao', label: 'Ligação', icon: '☎' },
  { id: 'nao_contatar', label: 'Não quero contato', icon: '⊗' },
]

export default function OnboardingWizard({ workspace, userName, onComplete }: Props) {
  const client = supabase
  const [step, setStep] = useState(1)
  const [segment, setSegment] = useState('')
  const [otherSegment, setOtherSegment] = useState('')
  const [modules, setModules] = useState<string[]>([])
  const [hasCertificate, setHasCertificate] = useState(false)
  const [currentTool, setCurrentTool] = useState('')
  const [contactChannel, setContactChannel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const displayName = useMemo(() => userName.trim().split(/\s+/)[0] || 'Olá', [userName])
  const selectedSegmentLabel = useMemo(() => {
    if (segment === 'outro') return otherSegment
    return quickSegments.find((item) => item.id === segment)?.label ?? ''
  }, [otherSegment, segment])

  function validateStep() {
    if (step === 1 && !selectedSegmentLabel) return 'Escolha o ramo de atividade da empresa.'
    if (step === 2 && modules.length === 0) return 'Escolha pelo menos uma área em que o CicloPag pode ajudar.'
    if (step === 3 && !currentTool) return 'Informe como você organiza a empresa atualmente.'
    if (step === 4 && !contactChannel) return 'Escolha o canal de contato preferido.'
    return ''
  }

  function next() {
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep((current) => Math.min(4, current + 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    setError('')
    setStep((current) => Math.max(1, current - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleModule(id: string) {
    setModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function finish() {
    if (!client) return
    const message = validateStep()
    if (message) {
      setError(message)
      return
    }

    setLoading(true)
    setError('')
    const { error: rpcError } = await client.rpc('concluir_onboarding_empresa', {
      p_empresa_id: workspace.empresa.id,
      p_segmento: selectedSegmentLabel,
      p_segmento_outro: segment === 'outro' ? otherSegment : null,
      p_modulos: modules,
      p_ferramenta_atual: currentTool,
      p_canal_contato: contactChannel,
      p_possui_certificado: hasCertificate,
    })

    if (rpcError) {
      setError(rpcError.message.includes('does not exist')
        ? 'Execute o arquivo PASSO_3_SUPABASE_ONBOARDING.sql antes de finalizar.'
        : rpcError.message)
      setLoading(false)
      return
    }

    await onComplete()
    setLoading(false)
  }

  return (
    <div className="first-access-page">
      <header className="first-access-header">
        <div className="first-access-brand"><span>Ciclo</span><strong>Pag</strong></div>
        <span>Configuração inicial de {workspace.empresa.nome}</span>
      </header>

      <main className="first-access-main">
        <h1>Queremos te conhecer melhor, {displayName}!</h1>

        <div className="onboarding-progress" aria-label={`Etapa ${step} de 4`}>
          {[1, 2, 3, 4].map((item) => (
            <span key={item} className={item === step ? 'active' : item < step ? 'completed' : ''} />
          ))}
        </div>

        {step === 1 && (
          <section className="wizard-section">
            <h2>Qual ramo de atividade melhor descreve sua empresa?</h2>
            <div className="choice-grid choice-grid-three">
              {quickSegments.map((item) => (
                <button
                  className={`choice-card compact ${segment === item.id ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => {
                    setSegment(item.id)
                    setOtherSegment('')
                    setError('')
                  }}
                  type="button"
                >
                  <span>{item.icon}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
              <button
                className={`choice-card compact other-choice ${segment === 'outro' ? 'selected' : ''}`}
                onClick={() => {
                  setSegment('outro')
                  setError('')
                }}
                type="button"
              >
                <span>＋</span>
                <strong>Selecione outro</strong>
              </button>
            </div>

            {segment === 'outro' && (
              <label className="wizard-select-label">
                Outro ramo de atividade
                <select value={otherSegment} onChange={(event) => setOtherSegment(event.target.value)}>
                  <option value="">Selecione outro</option>
                  {otherSegments.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="wizard-section">
            <h2>Como o CicloPag pode ajudar seu negócio?</h2>
            <p className="wizard-helper">Você pode selecionar mais de uma opção.</p>
            <div className="choice-grid choice-grid-three module-choice-grid">
              {moduleOptions.map((item) => {
                const selected = modules.includes(item.id)
                return (
                  <button
                    className={`choice-card module-choice ${selected ? 'selected' : ''}`}
                    key={item.id}
                    onClick={() => toggleModule(item.id)}
                    type="button"
                  >
                    <span className="choice-icon">{item.icon}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                      {item.id === 'notas_fiscais' && selected && (
                        <label className="certificate-check" onClick={(event) => event.stopPropagation()}>
                          <input
                            checked={hasCertificate}
                            onChange={(event) => setHasCertificate(event.target.checked)}
                            type="checkbox"
                          />
                          Já possuo certificado digital
                        </label>
                      )}
                    </div>
                    <i>{selected ? '✓' : ''}</i>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="wizard-section wizard-section-narrow">
            <h2>Atualmente, você já utiliza algum sistema ou ferramenta de gestão?</h2>
            <div className="choice-grid choice-grid-two tools-grid">
              {toolOptions.map((item) => (
                <button
                  className={`choice-card compact ${currentTool === item.id ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => {
                    setCurrentTool(item.id)
                    setError('')
                  }}
                  type="button"
                >
                  <span>{item.icon}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="wizard-section">
            <h2>Qual canal de contato você prefere?</h2>
            <div className="choice-grid choice-grid-four contact-grid">
              {contactOptions.map((item) => (
                <button
                  className={`choice-card compact ${contactChannel === item.id ? 'selected' : ''}`}
                  key={item.id}
                  onClick={() => {
                    setContactChannel(item.id)
                    setError('')
                  }}
                  type="button"
                >
                  <span>{item.icon}</span>
                  <strong>{item.label}</strong>
                </button>
              ))}
            </div>
          </section>
        )}

        {error && <div className="wizard-error">{error}</div>}

        <div className="wizard-actions">
          {step > 1 && <button className="wizard-back" onClick={back} type="button">Voltar</button>}
          {step < 4 ? (
            <button className="wizard-primary" onClick={next} type="button">Avançar</button>
          ) : (
            <button className="wizard-finish" disabled={loading} onClick={() => void finish()} type="button">
              {loading ? 'Finalizando...' : '✓ Finalizar cadastro'}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
