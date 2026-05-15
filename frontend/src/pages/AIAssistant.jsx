import { useState, useRef, useEffect } from 'react'
import { sendChat, clearChat } from '../utils/api'
import ReactMarkdown from 'react-markdown'
import { Send, Trash2, Bot, User, Zap, Hash, AlignLeft } from 'lucide-react'

const SUGGESTIONS = [
  'What are the main patterns in this dataset?',
  'Which column has the most missing values?',
  'What are the top 5 most frequent values?',
  'Summarize the numeric statistics.',
  'Are there any notable outliers?',
  'What is the average of each numeric column?',
]

export default function AIAssistant({ fileInfo }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `👋 Hi! I'm **DataLens AI** powered by Groq. I use **tool-calling** to query your data directly — no hallucinations.\n\nI've loaded **${fileInfo.filename}** (${fileInfo.rows?.toLocaleString()} rows, ${fileInfo.columns} columns). Ask me anything!`,
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await sendChat(msg)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ ' + (e.response?.data?.detail || 'Request failed.') }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleClear = async () => {
    await clearChat().catch(() => {})
    setMessages([{ role: 'assistant', content: 'Chat history cleared. How can I help you?' }])
  }

  return (
    <div className="flex gap-4 animate-fade-in" style={{ height: 'calc(100vh - 160px)', minHeight: 520 }}>
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
        {/* Dataset info */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <div className="h-px w-full mb-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">Dataset</h4>
          <div className="space-y-2.5">
            {[['File', fileInfo.filename], ['Rows', fileInfo.rows?.toLocaleString()], ['Columns', fileInfo.columns]].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-xs text-slate-600">{k}</span>
                <span className="text-xs text-white font-medium truncate max-w-[130px]">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="rounded-2xl p-4" style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">Try Asking</h4>
          <div className="space-y-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="w-full text-left text-xs leading-relaxed px-3 py-2 rounded-xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Columns */}
        <div className="rounded-2xl p-4 flex-1 overflow-hidden" style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">Columns</h4>
          <div className="space-y-1.5 overflow-y-auto max-h-52">
            {fileInfo.column_info?.map(c => (
              <div key={c.name} className="flex items-center gap-2 text-xs py-0.5">
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: c.type === 'numeric' ? 'rgba(99,102,241,0.15)' : c.type === 'datetime' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' }}>
                  {c.type === 'numeric' ? <Hash className="w-2.5 h-2.5 text-accent2" /> : <AlignLeft className="w-2.5 h-2.5 text-emerald-400" />}
                </div>
                <span className="text-slate-400 truncate flex-1">{c.name}</span>
                <span className="text-slate-700 text-[9px]">{c.dtype}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 animate-fade-in ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0`}
                style={m.role === 'assistant'
                  ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.2)' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {m.role === 'assistant' ? <Bot className="w-4 h-4 text-accent2" /> : <User className="w-4 h-4 text-slate-400" />}
              </div>
              <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed`}
                style={m.role === 'user'
                  ? { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: '#e2e8f0' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                <ReactMarkdown components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="text-accent2 font-semibold">{children}</strong>,
                  code: ({ children }) => <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{children}</code>,
                  pre: ({ children }) => <pre className="rounded-xl p-3 overflow-x-auto my-2 text-xs" style={{ background: 'rgba(0,0,0,0.3)' }}>{children}</pre>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                }}>{m.content}</ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Bot className="w-4 h-4 text-accent2" />
              </div>
              <div className="px-4 py-4 rounded-2xl flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span className="text-xs text-slate-500">Querying data with tools…</span>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce"
                      style={{ animationDelay: `${i*150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 flex gap-3 items-end" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,8,15,0.5)' }}>
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask anything about your data… (Enter to send)"
            rows={2} disabled={loading}
            className="flex-1 input resize-none text-sm leading-relaxed rounded-xl disabled:opacity-50" />
          <div className="flex flex-col gap-2">
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-default"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: input.trim() ? '0 0 20px rgba(99,102,241,0.4)' : 'none' }}>
              <Send className="w-4 h-4 text-white" />
            </button>
            <button onClick={handleClear}
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 text-slate-600 hover:text-red-400"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
