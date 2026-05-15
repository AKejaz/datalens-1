import { useState } from 'react'
import { getSummary } from '../utils/api'
import ReactMarkdown from 'react-markdown'
import { Sparkles, RefreshCw, FileText, Rows, Columns } from 'lucide-react'

export default function Summary() {
  const [summary, setSummary] = useState('')
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)

  const generate = async () => {
    setLoading(true); setSummary('')
    try {
      const res = await getSummary()
      setSummary(res.data.summary)
      setMeta({ filename: res.data.filename, rows: res.data.rows, columns: res.data.columns })
      setGenerated(true)
    } catch (e) {
      setSummary('❌ Failed: ' + (e.response?.data?.detail || e.message))
      setGenerated(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)' }} />

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Sparkles className="w-5 h-5 text-accent2" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-white">Executive Summary</h2>
              <p className="text-xs text-slate-500 mt-0.5">AI-generated business analyst narrative powered by Groq</p>
            </div>
            {generated && !loading && (
              <button onClick={generate} className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all btn-ghost">
                <RefreshCw className="w-3.5 h-3.5" /> Regenerate
              </button>
            )}
          </div>

          {!generated && !loading && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center animate-float"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Sparkles className="w-8 h-8 text-accent2" />
              </div>
              <p className="text-slate-400 mb-2 font-medium">Ready to analyze your dataset</p>
              <p className="text-slate-600 text-sm mb-8 max-w-sm mx-auto">
                The AI will identify key patterns, outliers, and provide actionable business insights.
              </p>
              <button onClick={generate} className="btn-primary flex items-center gap-2 mx-auto px-6 py-3 text-sm">
                <Sparkles className="w-4 h-4" /> Generate Executive Summary
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center py-20 gap-5">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-accent/15" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              </div>
              <div className="text-center">
                <p className="text-white font-medium mb-1">Analyzing your data…</p>
                <p className="text-slate-500 text-sm">Groq AI is generating insights</p>
              </div>
            </div>
          )}

          {generated && summary && !loading && (
            <div className="animate-fade-in">
              {meta && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {[
                    { icon: FileText, label: meta.filename, color: '#6366f1' },
                    { icon: Rows, label: `${meta.rows?.toLocaleString()} rows`, color: '#10b981' },
                    { icon: Columns, label: `${meta.columns} columns`, color: '#f59e0b' },
                  ].map(({ icon: Icon, label, color }) => (
                    <div key={label} className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                      style={{ background: `${color}0f`, border: `1px solid ${color}22`, color: '#94a3b8' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="truncate max-w-[160px]">{label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-slate-300 leading-relaxed text-sm space-y-3"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.5rem' }}>
                <ReactMarkdown components={{
                  h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-5 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-base font-semibold text-accent2 mt-3 mb-1">{children}</h3>,
                  p:  ({ children }) => <p className="mb-3 text-slate-300 leading-relaxed">{children}</p>,
                  strong: ({ children }) => <strong className="text-accent2 font-semibold">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 mb-3 text-slate-300">{children}</ul>,
                  li: ({ children }) => <li className="text-slate-300">{children}</li>,
                }}>{summary}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
