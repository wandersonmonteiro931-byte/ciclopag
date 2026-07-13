import { useEffect, useMemo, useState } from 'react'

type TourStep = {
  target: string
  title: string
  description: string
}

type Props = {
  active: boolean
  onClose: (completed: boolean) => void
}

const steps: TourStep[] = [
  {
    target: '[data-tour="menu"]',
    title: 'Menu principal',
    description: 'Através deste menu você acessa cadastros, orçamentos, vendas, ordens de serviço, estoque, financeiro, fiscal, contratos, relatórios e configurações.',
  },
  {
    target: '[data-tour="receber-hoje"]',
    title: 'Resumo financeiro',
    description: 'Acompanhe o que sua empresa tem para receber e pagar no dia, além dos resultados consolidados do mês.',
  },
  {
    target: '[data-tour="fluxo-caixa"]',
    title: 'Fluxo de caixa',
    description: 'Visualize a evolução das entradas, saídas e do saldo da empresa sem precisar montar planilhas.',
  },
  {
    target: '[data-tour="tutorial-button"]',
    title: 'Passo a passo',
    description: 'Sempre que quiser rever esta apresentação, clique neste botão para iniciar novamente.',
  },
]

export default function FirstAccessTour({ active, onClose }: Props) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const step = steps[index]

  useEffect(() => {
    if (!active) {
      setIndex(0)
      setRect(null)
      return
    }

    function update() {
      const element = document.querySelector(step.target)
      if (!element) {
        setRect(null)
        return
      }
      element.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      setRect(element.getBoundingClientRect())
    }

    const frame = window.requestAnimationFrame(update)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [active, step.target])

  const tooltipStyle = useMemo(() => {
    if (!rect) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

    const width = Math.min(360, window.innerWidth - 30)
    const margin = 16
    let left = rect.right + margin
    let top = rect.top + Math.min(rect.height / 2, 100)

    if (left + width > window.innerWidth - margin) left = Math.max(margin, rect.left - width - margin)
    if (top + 230 > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - 230 - margin)
    if (top < margin) top = margin

    return { left: `${left}px`, top: `${top}px`, width: `${width}px` }
  }, [rect])

  if (!active) return null

  function next() {
    if (index === steps.length - 1) {
      onClose(true)
      return
    }
    setIndex((current) => current + 1)
  }

  return (
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label="Passo a passo do CicloPag">
      {rect && (
        <div
          className="tour-highlight"
          style={{
            left: Math.max(4, rect.left - 7),
            top: Math.max(4, rect.top - 7),
            width: Math.min(window.innerWidth - 8, rect.width + 14),
            height: Math.min(window.innerHeight - 8, rect.height + 14),
          }}
        />
      )}
      <div className="tour-tooltip" style={tooltipStyle}>
        <div className="tour-count">Passo {index + 1} de {steps.length}</div>
        <h3>{step.title}</h3>
        <p>{step.description}</p>
        <div className="tour-actions">
          <button className="tour-cancel" onClick={() => onClose(false)} type="button">✕ Cancelar</button>
          <button className="tour-next" onClick={next} type="button">✓ {index === steps.length - 1 ? 'Concluir' : 'Entendi'}</button>
        </div>
      </div>
    </div>
  )
}
