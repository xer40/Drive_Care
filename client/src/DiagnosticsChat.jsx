import { useEffect, useRef, useState } from 'react'
import { authFetch } from './auth.js'
import Markdown from './Markdown.jsx'
import './DiagnosticsChat.css'

// Chat with the AI diagnostic assistant about one vehicle. The backend gives the assistant this car's
// service history and lets it look up more (older records, reminders, past chats, community posts).
// Changing the selected car starts a fresh conversation (the parent re-mounts this with a new key)

const SUGGESTIONS = [
  'I hear a squeal when I brake',
  'My car shakes at highway speeds',
  'The check engine light came on',
  'It hesitates when I accelerate',
]

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
      <div className="diag-header">
        <div>
          <h2>Diagnose an Issue</h2>
          <p>
            {vehicleName
              ? <>Describe what your <strong>{vehicleName}</strong> is doing. The assistant checks your service history to rule out what's already been fixed.</>
              : "Describe what your car is doing. Add a vehicle so the assistant can use your service history."}
          </p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="diag-new" onClick={startOver} disabled={sending}>
            New conversation
          </button>
        )}
      </div>

      <div className="diag-thread">
        {messages.length === 0 && (
          <div className="diag-empty">
            <p>Try describing the symptom, when it happens, and anything you've noticed (sounds, smells, warning lights).</p>
            <div className="diag-suggestions">
              {SUGGESTIONS.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => setInput(suggestion)}>
                  {suggestion}
                </button>
              ))}
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
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={messages.length === 0 ? "Describe your vehicle's symptoms..." : 'Ask a follow-up question...'}
          rows={3}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          {sending ? 'Thinking...' : 'Ask AI Assistant'}
        </button>
      </form>

      <p className="diag-disclaimer">
        AI suggestions are not a substitute for an inspection by a qualified mechanic.
      </p>
    </div>
  )
}

export default DiagnosticsChat
