import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Database, BarChart2, Table, Bot, FileText, RefreshCw, Sparkles, Shield } from 'lucide-react'
import { uploadCSV } from './utils/api'
import Visualizations from './pages/Visualizations'
import DataProfile from './pages/DataProfile'
import AIAssistant from './pages/AIAssistant'
import Summary from './pages/Summary'

const TABS = [
  { id: 'viz',     label: 'Visualizations',    icon: BarChart2 },
  { id: 'profile', label: 'Data Profile',      icon: Table },
  { id: 'summary', label: 'Executive Summary', icon: FileText },
  { id: 'ai',      label: 'AI Assistant',      icon: Bot },
]

export default function App() {
  const [fileInfo, setFileInfo] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('viz')

  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) { setError('Only .csv files are accepted.'); return }
    if (file.size > 52428800) { setError('File exceeds the 50 MB limit.'); return }
    setError(''); setUploading(true); setProgress(0)
    try {
      const res = await uploadCSV(file, setProgress)
      setFileInfo(res.data)
      setTab('viz')
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'text/csv': ['.csv'] }, multiple: false,
  })

  const handleReset = () => { setFileInfo(null); setError(''); setTab('viz') }

  if (!fileInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
        {/* Ambient orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        {/* Grid overlay */}
        <div className="fixed inset-0 z-0" style={{
          backgroundImage: `linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="w-full max-w-xl text-center relative z-10 animate-fade-in">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-glow-pulse"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold gradient-text">DataLens</span>
          </div>

          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Explore Your Data<br />
            <span className="gradient-text">with AI Power</span>
          </h1>
          <p className="text-slate-400 mb-10 text-base leading-relaxed">
            Upload any CSV up to 50 MB for instant smart visualizations,<br />
            descriptive statistics, and an AI-powered chat assistant.
          </p>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`relative cursor-pointer transition-all duration-300 mb-5 rounded-2xl p-10
              ${isDragActive ? 'neon-border scale-[1.02]' : 'card-glass hover:border-accent/30'}
              ${uploading ? 'opacity-60 pointer-events-none' : ''}
            `}
            style={{ border: isDragActive ? '' : '1px solid rgba(255,255,255,0.07)' }}
          >
            <input {...getInputProps()} />

            {/* Corner accents */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-accent/40 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-accent/40 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-accent/40 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-accent/40 rounded-br-lg" />

            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-accent/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.7s' }} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1">Uploading & Analyzing…</p>
                  <p className="text-accent2 text-sm">{progress}% complete</p>
                </div>
                <div className="w-56 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />
                </div>
              </div>
            ) : (
              <>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300
                  ${isDragActive ? 'scale-110' : 'animate-float'}`}
                  style={{ background: isDragActive ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.1)' }}>
                  <Upload className={`w-7 h-7 ${isDragActive ? 'text-accent' : 'text-slate-400'}`} />
                </div>
                <p className="text-white font-semibold text-xl mb-2">
                  {isDragActive ? '✨ Release to analyze!' : 'Drop your CSV file here'}
                </p>
                <p className="text-slate-500 text-sm">or <span className="text-accent2 font-medium">click to browse</span> — up to 50 MB</p>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 animate-fade-in"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Feature cards */}
          <div className="grid grid-cols-4 gap-3 mt-8">
            {[
              { icon: BarChart2, label: '6+ Smart Charts', color: '#6366f1' },
              { icon: Table,     label: 'Column Stats',    color: '#10b981' },
              { icon: Sparkles,  label: 'AI Summary',      color: '#f59e0b' },
              { icon: Bot,       label: 'Chat Assistant',  color: '#8b5cf6' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="card-glass p-4 text-center transition-all duration-200 hover:scale-105 rounded-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-8 h-8 mx-auto mb-2 rounded-xl flex items-center justify-center"
                  style={{ background: `${color}18` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="text-xs text-slate-400 font-medium leading-tight">{label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-600">
            <Shield className="w-3 h-3" />
            <span>Data stays local — nothing sent to external servers</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg relative">
      {/* Subtle ambient orbs */}
      <div className="orb orb-1" style={{ opacity: 0.5 }} />
      <div className="orb orb-2" style={{ opacity: 0.4 }} />

      {/* Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(99,102,241,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      {/* Header */}
      <header className="relative z-10 px-6 py-3 flex items-center gap-4 sticky top-0"
        style={{ background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 mr-auto">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 15px rgba(99,102,241,0.4)' }}>
            <Database className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">DataLens</span>
        </div>

        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span className="text-sm font-medium text-white max-w-[180px] truncate">{fileInfo.filename}</span>
          <span className="text-xs text-slate-500 border-l border-white/10 pl-2.5">{fileInfo.rows.toLocaleString()} rows · {fileInfo.columns} cols</span>
        </div>

        <button onClick={handleReset} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> New File
        </button>
      </header>

      {/* Tabs */}
      <nav className="relative z-10 px-6 py-2.5 flex gap-1.5"
        style={{ background: 'rgba(7,8,15,0.6)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`tab-btn flex items-center gap-2 ${tab === id ? 'active' : ''}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>

      <main className="relative z-10 flex-1 p-6 overflow-x-hidden">
        <div className="page-enter">
          {tab === 'viz'     && <Visualizations fileInfo={fileInfo} />}
          {tab === 'profile' && <DataProfile />}
          {tab === 'summary' && <Summary />}
          {tab === 'ai'      && <AIAssistant fileInfo={fileInfo} />}
        </div>
      </main>
    </div>
  )
}
