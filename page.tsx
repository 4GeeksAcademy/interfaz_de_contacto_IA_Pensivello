'use client'

import { useState } from 'react'
import {
  Activity,
  ArrowUp,
  BarChart3,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Gauge,
  Hash,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PanelRight,
  Plus,
  Search,
  Settings2,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'

const conversations = [
  { title: 'Optimizar cola de trabajos', time: 'Ahora', active: true },
  { title: 'Diseño del flujo de onboarding', time: 'Ayer' },
  { title: 'Migración a Next.js 16', time: 'Ayer' },
  { title: 'Ideas para el dashboard', time: '12 sep' },
]

const messages = [
  {
    role: 'user',
    content: '¿Cómo puedo optimizar la cola de trabajos para procesar picos de tráfico sin aumentar demasiado los costes?',
    time: '10:42:18',
    tokens: '24 tokens',
  },
  {
    role: 'assistant',
    content:
      'Te propongo un enfoque en tres capas: limitar la concurrencia por worker, priorizar los trabajos según su SLA y añadir backoff exponencial cuando la cola supere el umbral. Así absorbes los picos manteniendo estable el consumo.',
    time: '10:42:20',
    tokens: '82 tokens',
  },
  {
    role: 'user',
    content: '¿Qué valores iniciales usarías para la concurrencia y el backoff?',
    time: '10:42:41',
    tokens: '15 tokens',
  },
  {
    role: 'assistant',
    content:
      'Empieza con 8 trabajos concurrentes por worker y un backoff de 250 ms con factor 2, limitado a 8 s. Mide la latencia p95 y ajusta la concurrencia en pasos de 2. Si la cola crece durante más de 60 s, activa un worker temporal.',
    time: '10:42:43',
    tokens: '105 tokens',
  },
]

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
  const [message, setMessage] = useState('')
  const [rightPanel, setRightPanel] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [sent, setSent] = useState(false)

  function sendMessage() {
    if (!message.trim()) return
    setSent(true)
    setMessage('')
    window.setTimeout(() => setSent(false), 1800)
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
          <Metric icon={Hash} label="Tokens sesión" value="12,480" accent />
          <Metric icon={Gauge} label="Consumo" value="$0.084" />
          <Metric icon={Clock3} label="Última respuesta" value="1.82 s" />
          <Metric icon={Zap} label="Tokens / segundo" value="104.2" accent />
        </div>
        <div className="model-select"><span className="status-dot" /> <span>claude-3-7-sonnet</span><ChevronDown /></div>
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
          <div className="chat-header"><div><p className="eyebrow">Sesión activa · 04 mensajes</p><h2>Optimizar cola de trabajos</h2></div><div className="chat-actions"><button className="icon-button" aria-label="Copiar conversación"><Copy /></button><button className="icon-button" aria-label="Más opciones"><MoreHorizontal /></button><button className={`icon-button ${rightPanel ? 'selected' : ''}`} aria-label="Mostrar panel de uso" onClick={() => setRightPanel(!rightPanel)}><PanelRight /></button></div></div>
          <div className="message-scroller">
            <div className="date-marker"><span>Hoy, 10:42</span></div>
            {messages.map((item, index) => <article className={`message-row ${item.role}`} key={`${item.time}-${index}`}><div className={`message-avatar ${item.role}`} aria-hidden="true">{item.role === 'assistant' ? <Sparkles /> : <User />}</div><div className="message-content"><div className="message-meta"><strong>{item.role === 'assistant' ? 'arc' : 'Tú'}</strong><span>{item.time} · {item.tokens}</span></div><p>{item.content}</p>{item.role === 'assistant' && <div className="message-tools"><button><Copy /> Copiar</button><button><Activity /> Analizar</button></div>}</div></article>)}
            {sent && <article className="message-row assistant"><div className="message-avatar assistant"><Sparkles /></div><div className="message-content"><div className="message-meta"><strong>arc</strong><span>Ahora · generando</span></div><p className="typing"><i /><i /><i /></p></div></article>}
          </div>
          <div className="composer-wrap"><div className="composer"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); sendMessage() } }} placeholder="Escribe un mensaje..." rows={1} aria-label="Mensaje" /><div className="composer-footer"><span className="composer-hint">Shift + Enter para una nueva línea</span><button className="send-button" aria-label="Enviar mensaje" onClick={sendMessage}><ArrowUp /></button></div></div><p className="composer-note">arc puede cometer errores. Verifica las respuestas importantes.</p></div>
        </section>

        {rightPanel && <aside className="usage-panel"><div className="usage-header"><div><p className="eyebrow">Observabilidad</p><h2>Uso de la sesión</h2></div><button className="icon-button" aria-label="Cerrar panel" onClick={() => setRightPanel(false)}>×</button></div><div className="usage-card highlight"><div className="usage-card-top"><span>Consumo total</span><BarChart3 /></div><strong>12,480 <small>tokens</small></strong><div className="progress"><span style={{ width: '62%' }} /></div><div className="usage-foot"><span>62% del límite</span><span>20k</span></div></div><div className="usage-grid"><div className="usage-card"><span>Entrada</span><strong>3,846</strong><small>tokens</small></div><div className="usage-card"><span>Salida</span><strong>8,634</strong><small>tokens</small></div></div><section className="usage-section"><div className="section-title"><span>Actividad por mensaje</span><span className="muted">tokens</span></div><div className="bars"><div className="bar-item"><span>10:42</span><i style={{ height: '25%' }} /><b>24</b></div><div className="bar-item"><span>10:42</span><i style={{ height: '64%' }} /><b>82</b></div><div className="bar-item"><span>10:42</span><i style={{ height: '18%' }} /><b>15</b></div><div className="bar-item"><span>10:42</span><i style={{ height: '82%' }} /><b>105</b></div></div></section><section className="usage-section details"><div className="section-title"><span>Detalles del modelo</span><MoreHorizontal /></div><div className="detail-row"><span>Modelo</span><strong>claude-3-7-sonnet</strong></div><div className="detail-row"><span>Ventana de contexto</span><strong>200k tokens</strong></div><div className="detail-row"><span>Temperatura</span><strong>0.7</strong></div><div className="detail-row"><span>Coste estimado</span><strong className="accent-text">$0.084</strong></div></section><div className="usage-tip"><Zap /><p><strong>Rendimiento estable</strong><br />La velocidad está un 12% por encima de tu media.</p></div></aside>}
      </div>
    </main>
  )
}
