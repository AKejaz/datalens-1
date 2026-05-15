import { useEffect, useState } from 'react'
import { getProfile } from '../utils/api'
import { Search, TrendingUp, Hash, AlignLeft, Calendar } from 'lucide-react'

export default function DataProfile() {
  const [profile, setProfile] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    getProfile().then(r => { setProfile(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const filtered = profile.filter(p => {
    const matchSearch = p.column.toLowerCase().includes(search.toLowerCase())
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    return matchSearch
  })

  const fmt = (v) => {
    if (v == null) return <span className="text-slate-700">—</span>
    if (typeof v === 'number') return <span className="tabular-nums">{v % 1 === 0 ? v.toLocaleString() : v.toFixed(4)}</span>
    return String(v)
  }

  const typeIcon = (t) => {
    if (t === 'numeric') return <Hash className="w-3 h-3" />
    if (t === 'datetime') return <Calendar className="w-3 h-3" />
    return <AlignLeft className="w-3 h-3" />
  }
  const typeColor = (t) => {
    if (t === 'numeric') return { bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: 'rgba(99,102,241,0.2)' }
    if (t === 'datetime') return { bg: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: 'rgba(245,158,11,0.2)' }
    return { bg: 'rgba(16,185,129,0.12)', color: '#6ee7b7', border: 'rgba(16,185,129,0.2)' }
  }

  const NullBar = ({ pct }) => {
    const color = pct > 20 ? '#ef4444' : pct > 5 ? '#f59e0b' : '#10b981'
    const textColor = pct > 20 ? 'text-red-400' : pct > 5 ? 'text-yellow-400' : 'text-emerald-400'
    return (
      <div className="flex items-center gap-2">
        <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className={`text-xs tabular-nums ${textColor}`}>{pct}%</span>
      </div>
    )
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4 animate-fade-in">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
      </div>
      <p className="text-slate-500 text-sm">Computing statistics…</p>
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input className="input pl-9 w-60 rounded-xl" placeholder="Search columns…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {['all', 'numeric', 'categorical', 'datetime', 'text'].map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
              style={typeFilter === f
                ? { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#64748b' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
          <TrendingUp className="w-3.5 h-3.5 text-accent/60" />
          {filtered.length} of {profile.length} columns
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Column','Type','Count','Nulls','Unique','Mean','Median','Std Dev','Min','Max','Q25','Q75'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap"
                    style={{ color: '#475569', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const tc = typeColor(p.type)
                return (
                  <tr key={p.column} className="transition-colors duration-150 hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-200 text-sm">{p.column}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg w-fit font-medium"
                        style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {typeIcon(p.type)} {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{p.count?.toLocaleString()}</td>
                    <td className="px-4 py-3"><NullBar pct={p.null_pct ?? 0} /></td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{p.unique?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.mean)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.median)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.std)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.min)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.max)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.q25)}</td>
                    <td className="px-4 py-3 text-slate-300">{fmt(p.q75)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-600">No columns match your search.</div>
          )}
        </div>
      </div>
    </div>
  )
}
