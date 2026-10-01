'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronDown,
  Copy,
  FileText,
  Hash,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelRight,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'

const conversations = [
  { title: 'Optimizar cola de trabajos', time: 'Ahora', active: true },
  { title: 'Diseño del flujo de onboarding', time: 'Ayer' },
  { title: 'Migración a Next.js 16', time: 'Ayer' },
  { title: 'Ideas para el dashboard', time: '12 sep' },
]

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  time: string
  tokens: string
  usage?: TokenUsage
}

type TokenUsage = {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

const chatHistoryKey = 'arc-chat-history'

function isTokenUsage(value: unknown): value is TokenUsage {
  if (typeof value !== 'object' || value === null) return false
  const usage = value as Record<string, unknown>
  return typeof usage.promptTokens === 'number' &&
    typeof usage.completionTokens === 'number' &&
    typeof usage.totalTokens === 'number'
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  return (item.role === 'user' || item.role === 'assistant') &&
    typeof item.content === 'string' &&
    typeof item.time === 'string' &&
    typeof item.tokens === 'string' &&
    (item.usage === undefined || isTokenUsage(item.usage))
}

function formatTokens(value: number) {
  return new Intl.NumberFormat('es-ES').format(value)
}

function Metric({ icon: Icon, label, value, accent = false }: { icon: typeof Hash; label: string; value: string; accent?: boolean }) {
  return (
    <div className="metric">
      <div className="metric-icon"><Icon /></div>
      <div>
        <p className="eyebrow">{label}</p>
        <p className={accent ? 'metric-value accent-text' : 'metric-value'}>{value}</p>
      </div>
    </div>
  )
}

export default function Page() {
  const messageScrollerRef = useRef<HTMLDivElement>(null)
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [rightPanel, setRightPanel] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')

  const usageTotals = chatMessages.reduce((totals, item) => ({
    promptTokens: totals.promptTokens + (item.usage?.promptTokens ?? 0),
    completionTokens: totals.completionTokens + (item.usage?.completionTokens ?? 0),
    totalTokens: totals.totalTokens + (item.usage?.totalTokens ?? 0),
  }), { promptTokens: 0, completionTokens: 0, totalTokens: 0 })
  const usageMessages = chatMessages.filter((item) => item.role === 'assistant' && item.usage)
  const recentUsage = usageMessages.slice(-4)
  const latestUsage = usageMessages[usageMessages.length - 1]?.usage
  const maxCompletionTokens = Math.max(1, ...recentUsage.map((item) => item.usage?.completionTokens ?? 0))
  const promptShare = usageTotals.totalTokens
    ? Math.round((usageTotals.promptTokens / usageTotals.totalTokens) * 100)
    : 0
  const completionShare = usageTotals.totalTokens ? 100 - promptShare : 0

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(chatHistoryKey)
      if (savedHistory) {
        const parsedHistory: unknown = JSON.parse(savedHistory)
        if (Array.isArray(parsedHistory)) {
          setChatMessages(parsedHistory.filter(isChatMessage))
        }
      }
    } catch {
      localStorage.removeItem(chatHistoryKey)
    }
    setHistoryLoaded(true)
  }, [])

  useEffect(() => {
    if (historyLoaded) {
      if (chatMessages.length === 0) {
        localStorage.removeItem(chatHistoryKey)
      } else {
        localStorage.setItem(chatHistoryKey, JSON.stringify(chatMessages))
      }
    }
  }, [chatMessages, historyLoaded])

  useEffect(() => {
    const scroller = messageScrollerRef.current
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [chatMessages, isSending])

  function clearConversation() {
    localStorage.removeItem(chatHistoryKey)
    setChatMessages([])
    setError('')
  }

  async function sendMessage() {
    const content = message.trim()
    if (!content || isSending) return

    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const userMessage: ChatMessage = { role: 'user', content, time, tokens: 'enviado' }
    const conversation = [...chatMessages, userMessage]
    setChatMessages(conversation)
    setMessage('')
    setError('')
    setIsSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversation.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      })
      const result = await response.json().catch(() => null) as {
        error?: unknown
        reply?: unknown
        usage?: unknown
      } | null

      if (!response.ok) {
        const details = typeof result?.error === 'string' ? result.error : 'La API no proporcionó detalles del error.'
        throw new Error(`Error HTTP ${response.status}: ${details}`)
      }

      const reply = result?.reply
      if (typeof reply !== 'string' || !reply.trim()) {
        throw new Error('La API respondió sin un mensaje válido.')
      }

      const usageValue = result?.usage
      const usage = isTokenUsage(usageValue) ? usageValue : undefined
      setChatMessages((current) => [...current, {
        role: 'assistant',
        content: reply.trim(),
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        tokens: usage ? `${formatTokens(usage.completionTokens)} tokens de salida` : 'uso no disponible',
        usage,
      }])
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? 'No se pudo conectar con la API. Comprueba tu conexión e inténtalo de nuevo.'
        : requestError instanceof Error ? requestError.message : 'No se pudo enviar el mensaje.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMobileNav(!mobileNav)}><Menu /></button>
          <div className="brand-mark"><Sparkles /></div>
          <span className="brand-name">arc<span>/</span>chat</span>
        </div>
        <div className="topbar-metrics">
          <Metric icon={Hash} label="Tokens totales" value={formatTokens(usageTotals.totalTokens)} accent />
          <Metric icon={ArrowDown} label="Tokens entrada" value={formatTokens(usageTotals.promptTokens)} />
          <Metric icon={ArrowUp} label="Tokens salida" value={formatTokens(usageTotals.completionTokens)} />
          <Metric icon={MessageSquare} label="Respuestas medidas" value={String(usageMessages.length)} accent />
        </div>
        <div className="model-select"><span className="status-dot" /> <span>openai/gpt-oss-20b</span><ChevronDown /></div>
      </header>

      <div className="workspace">
        <aside className={`history-panel ${mobileNav ? 'is-open' : ''}`}>
          <div className="history-head">
            <div><p className="eyebrow">Workspace</p><h1>Conversaciones</h1></div>
            <button className="icon-button" aria-label="Más opciones"><MoreHorizontal /></button>
          </div>
          <button className="new-chat" onClick={() => setMessage('')}><Plus /> Nueva conversación <span>⌘ K</span></button>
          <div className="search-box"><Search /><input aria-label="Buscar conversaciones" placeholder="Buscar conversaciones" /></div>
          <nav className="conversation-list" aria-label="Historial de conversaciones">
            <p className="list-label">Recientes</p>
            {conversations.map((conversation) => (
              <button key={conversation.title} className={`conversation ${conversation.active ? 'active' : ''}`} onClick={() => setMobileNav(false)}>
                <MessageSquare /><span className="conversation-copy"><strong>{conversation.title}</strong><small>{conversation.time}</small></span><MoreHorizontal className="conversation-more" />
              </button>
            ))}
          </nav>
          <div className="history-footer"><button className="footer-link"><Settings2 /> Ajustes</button><div className="profile"><div className="avatar">AM</div><span><strong>Alex Morgan</strong><small>Pro plan</small></span><ChevronDown /></div></div>
        </aside>

        <section className="chat-panel">
          <div className="chat-header"><div><p className="eyebrow">Sesión activa · {chatMessages.length} {chatMessages.length === 1 ? 'mensaje' : 'mensajes'}</p><h2>Optimizar cola de trabajos</h2></div><div className="chat-actions"><button className="icon-button" aria-label="Copiar conversación"><Copy /></button><button className="icon-button" aria-label="Borrar conversación" title="Borrar conversación" onClick={clearConversation} disabled={isSending}><Trash2 /></button><button className="icon-button" aria-label="Más opciones"><MoreHorizontal /></button><button className={`icon-button ${rightPanel ? 'selected' : ''}`} aria-label="Mostrar panel de uso" onClick={() => setRightPanel(!rightPanel)}><PanelRight /></button></div></div>
          <div className="message-scroller" ref={messageScrollerRef}>
            <div className="date-marker"><span>Historial de la conversación</span></div>
            {chatMessages.map((item, index) => <article className={`message-row ${item.role}`} key={`${item.time}-${index}`}><div className={`message-avatar ${item.role}`} aria-hidden="true">{item.role === 'assistant' ? <Sparkles /> : <User />}</div><div className="message-content"><div className="message-meta"><strong>{item.role === 'assistant' ? 'arc' : 'Tú'}</strong><span>{item.time} · {item.tokens}</span></div><p>{item.content}</p>{item.role === 'assistant' && <div className="message-tools"><button><Copy /> Copiar</button><button><Activity /> Analizar</button></div>}</div></article>)}
            {isSending && <article className="message-row assistant"><div className="message-avatar assistant"><Sparkles /></div><div className="message-content"><div className="message-meta"><strong>arc</strong><span>Ahora · generando</span></div><p className="typing"><i /><i /><i /></p></div></article>}
          </div>
          <div className="composer-wrap"><div className="composer"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); sendMessage() } }} placeholder="Escribe un mensaje..." rows={1} aria-label="Mensaje" /><div className="composer-footer"><span className="composer-hint">Shift + Enter para una nueva línea</span><button className="send-button" aria-label="Enviar mensaje" onClick={sendMessage} disabled={isSending || !message.trim()}><ArrowUp /></button></div></div>{error && <p className="composer-error" role="alert">{error}</p>}<p className="composer-note">arc puede cometer errores. Verifica las respuestas importantes.</p></div>
        </section>

        {rightPanel && (
          <aside className="usage-panel">
            <div className="usage-header">
              <div><p className="eyebrow">Observabilidad</p><h2>Uso de la sesión</h2></div>
              <button className="icon-button" aria-label="Cerrar panel" onClick={() => setRightPanel(false)}>×</button>
            </div>
            <div className="usage-card highlight">
              <div className="usage-card-top"><span>Tokens totales</span><BarChart3 /></div>
              <strong>{formatTokens(usageTotals.totalTokens)} <small>tokens</small></strong>
              <div className="progress"><span style={{ width: `${promptShare}%` }} /></div>
              <div className="usage-foot"><span>Entrada {promptShare}%</span><span>Salida {completionShare}%</span></div>
            </div>
            <div className="usage-grid">
              <div className="usage-card"><span>Entrada</span><strong>{formatTokens(usageTotals.promptTokens)}</strong><small>tokens</small></div>
              <div className="usage-card"><span>Salida</span><strong>{formatTokens(usageTotals.completionTokens)}</strong><small>tokens</small></div>
            </div>
            <section className="usage-section">
              <div className="section-title"><span>Salida por respuesta</span><span className="muted">tokens</span></div>
              <div className="bars">
                {recentUsage.map((item, index) => (
                  <div className="bar-item" key={`${item.time}-${index}`}>
                    <span>{item.time}</span>
                    <i style={{ height: `${Math.max(5, ((item.usage?.completionTokens ?? 0) / maxCompletionTokens) * 100)}%` }} />
                    <b>{formatTokens(item.usage?.completionTokens ?? 0)}</b>
                  </div>
                ))}
              </div>
              {recentUsage.length === 0 && <p className="usage-empty">Sin datos de uso de la API todavía.</p>}
            </section>
            <section className="usage-section details">
              <div className="section-title"><span>Última respuesta</span><MoreHorizontal /></div>
              <div className="detail-row"><span>Modelo</span><strong>openai/gpt-oss-20b</strong></div>
              <div className="detail-row"><span>Entrada</span><strong>{latestUsage ? formatTokens(latestUsage.promptTokens) : '—'} tokens</strong></div>
              <div className="detail-row"><span>Salida</span><strong>{latestUsage ? formatTokens(latestUsage.completionTokens) : '—'} tokens</strong></div>
              <div className="detail-row"><span>Total</span><strong>{latestUsage ? formatTokens(latestUsage.totalTokens) : '—'} tokens</strong></div>
            </section>
          </aside>
        )}
      </div>
    </main>
  )
}
