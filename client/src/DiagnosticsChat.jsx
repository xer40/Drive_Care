import { useEffect, useRef, useState } from 'react'
import { authFetch } from './auth.js'
import Markdown from './Markdown.jsx'
import './DiagnosticsChat.css'

// Chat with the AI diagnostic assistant about one vehicle. The backend gives the assistant this car's
// service history and lets it look up more (older records, reminders, past chats, community posts).
// Changing the selected car starts a fresh conversation (the parent re-mounts this with a new key)



// Friendly names for the lookups the assistant ran, shown under its answer
const TOOL_LABELS = {
  list_my_vehicles: 'your vehicles',
  get_maintenance_records: 'your maintenance records',
  get_reminders: 'your service reminders',
  search_past_diagnoses: 'your past conversations',
  search_community_posts: 'community posts',
}

function DiagnosticsChat({ vehicleId, vehicleName, initialMessage }) {
  const [conversationId, setConversationId] = useState(null)
  // Each message: { id, role: 'user' | 'assistant', content, toolsUsed? }
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const endRef = useRef(null)

  // Keep the newest message in view
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, sending])

  const send = async (text) => {
    const message = text.trim()
    if (!message || sending) return

    setError('')
    setInput('')
    setSending(true)
    // Show the question straight away; it is replaced by the saved copy when the answer arrives
    setMessages((prev) => [...prev, { id: 'pending', role: 'user', content: message }])

    try {
      const data = await authFetch('/api/chat', {
        method: 'POST',
        body: { message, conversation_id: conversationId, vehicle_id: vehicleId },
      })
      const [question, answer] = data.messages
      setConversationId(data.conversation.id)
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== 'pending'),
        question,
        { ...answer, toolsUsed: data.tools_used },
      ])
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== 'pending'))
      setInput(message)
      setError(err.message === 'Failed to fetch' ? "Can't reach the server. Is the backend running?" : err.message)
    } finally {
      setSending(false)
    }
  }

  // A question typed into the Quick Diagnostics card is sent as soon as the chat opens.
  // The ref stops React's development double-run from sending it twice
  const sentInitial = useRef(false)
  useEffect(() => {
    if (initialMessage && !sentInitial.current) {
      sentInitial.current = true
      send(initialMessage)
    }
    // Only on first open; send is recreated every render and doesn't need to re-trigger this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    send(input)
  }

  // Enter sends, Shift+Enter adds a new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const startOver = () => {
    setConversationId(null)
    setMessages([])
    setError('')
  }

  return (
  <div className="diag">

    {/* ======================================
        DRIVECARE AI COMMAND CENTER
    ====================================== */}

    <div className="diag-hero">

      <div className="diag-hero-top">

        <div className="diag-brand">
          <span className="diag-brand-icon">✦</span>
          <span>DRIVECARE INTELLIGENCE</span>
        </div>

        <div className="diag-ai-status">
          <span className="diag-status-dot"></span>
          AI ASSISTANT READY
        </div>

      </div>

      <div className="diag-hero-content">

        <div className="diag-hero-text">

          <span className="diag-eyebrow">
            NEXT-GENERATION VEHICLE DIAGNOSTICS
          </span>

          <h2>
            Your Vehicle.
            <br />
            <span>Our Intelligence.</span>
          </h2>

          <p>
            Advanced AI-powered automotive assistance.
            Describe your vehicle's symptoms and receive
            personalized diagnostic guidance.
          </p>

        </div>

        <div className="diag-hero-visual">
          <div className="diag-ai-orb">
            <span>✦</span>
          </div>
        </div>

      </div>

      <div className="diag-vehicle-panel">

        <div className="diag-vehicle-icon">
          🚘
        </div>

        <div className="diag-vehicle-info">
          <span>SELECTED VEHICLE</span>

          <strong>
            {vehicleName || "No Vehicle Selected"}
          </strong>

          <small>
            {vehicleName
              ? "Vehicle context available for AI diagnostics"
              : "Add a vehicle to enable personalized diagnostics"}
          </small>
        </div>

        <div className="diag-vehicle-badge">
          ● AI READY
        </div>

      </div>

      {messages.length > 0 && (
        <button
          type="button"
          className="diag-new"
          onClick={startOver}
          disabled={sending}
        >
          ↻ New Conversation
        </button>
      )}

    </div>

      <div className="diag-thread">
        {messages.length === 0 && (
          
  <div className="diag-empty">

    <div className="diag-welcome">
      <span className="diag-welcome-label">
        ◉ DIAGNOSTIC COMMAND CENTER
      </span>

      <h3>What can I help you diagnose?</h3>

      <p>
        Select a vehicle system below or describe the symptoms
        you're experiencing to begin an AI-assisted diagnosis.
      </p>
    </div>

    <div className="diag-diagnostic-grid">

      <button
        type="button"
        className="diag-diagnostic-card"
        onClick={() => setInput("I hear an unusual noise when driving or braking")}
      >
        <span className="diag-card-icon">🔊</span>
        <strong>Unusual Noises</strong>
        <small>Brakes, suspension, and mechanical sounds</small>
        <span className="diag-card-arrow">↗</span>
      </button>

      <button
        type="button"
        className="diag-diagnostic-card"
        onClick={() => setInput("A warning light appeared on my dashboard")}
      >
        <span className="diag-card-icon">⚠️</span>
        <strong>Warning Lights</strong>
        <small>Dashboard alerts and warning indicators</small>
        <span className="diag-card-arrow">↗</span>
      </button>

      <button
        type="button"
        className="diag-diagnostic-card"
        onClick={() => setInput("My vehicle is experiencing engine or performance issues")}
      >
        <span className="diag-card-icon">⚙️</span>
        <strong>Engine & Performance</strong>
        <small>Acceleration, power, and engine behavior</small>
        <span className="diag-card-arrow">↗</span>
      </button>

      <button
        type="button"
        className="diag-diagnostic-card"
        onClick={() => setInput("My vehicle is having battery or electrical problems")}
      >
        <span className="diag-card-icon">🔋</span>
        <strong>Electrical Systems</strong>
        <small>Battery, starting, and electrical issues</small>
        <span className="diag-card-arrow">↗</span>
      </button>

    </div>

  </div>
)}
        

        {messages.map((message) => (
          <div key={message.id} className={`diag-message ${message.role}`}>
            {message.role === 'assistant' ? <Markdown text={message.content} /> : <p>{message.content}</p>}
            {message.toolsUsed?.length > 0 && (
              <span className="diag-checked">
                Checked {message.toolsUsed.map((tool) => TOOL_LABELS[tool] || tool).join(', ')}
              </span>
            )}
          </div>
        ))}

        {sending && (
          <div className="diag-message assistant diag-thinking">
            <span className="diag-dots"><i /><i /><i /></span>
            Analyzing your car's history...
          </div>
        )}
        <div ref={endRef} />
      </div>

      {error && <p className="diag-error">{error}</p>}

      <form className="diag-composer" onSubmit={handleSubmit}>

  <div className="diag-input-header">
    <span className="diag-input-indicator"></span>
    <span>DIAGNOSTIC INPUT</span>
  </div>

  <div className="diag-input-container">

    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={
        messages.length === 0
          ? "Describe your vehicle's symptoms, noises, or warning lights..."
          : "Ask DriveCare AI a follow-up question..."
      }
      rows={3}
      disabled={sending}
    />

    <button
      type="submit"
      className="diag-send-button"
      disabled={sending || !input.trim()}
    >
      {sending ? (
        <>◉ Analyzing...</>
      ) : (
        <>✦ Run AI Diagnostics →</>
      )}
    </button>

  </div>

  <div className="diag-input-footer">
    <span>⚡ AI-POWERED ANALYSIS</span>
    <span>ENTER TO SEND · SHIFT + ENTER FOR NEW LINE</span>
  </div>

</form>

      <p className="diag-disclaimer">
        AI suggestions are not a substitute for an inspection by a qualified mechanic.
      </p>
    </div>
  )
}

export default DiagnosticsChat
