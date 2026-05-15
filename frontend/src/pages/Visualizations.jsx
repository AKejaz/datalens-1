import { useEffect, useState, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { getCharts, getFilterOpts } from '../utils/api'
import { SlidersHorizontal, X, RefreshCw, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#22c55e','#f97316','#a855f7']

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(13,17,32,0.95)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: 12, color: '#e2e8f0', fontSize: 12,
    backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  labelStyle: { color: '#a5b4fc', fontWeight: 600 },
  cursor: { fill: 'rgba(99,102,241,0.05)' },
}
const axisStyle = { fill: '#475569', fontSize: 11 }
const gridStyle = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '3 3' }

// ── Loading skeleton ──────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl p-5 h-80"
          style={{ background: 'rgba(13,17,32,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="skeleton h-4 w-40 mb-2 rounded" />
          <div className="skeleton h-3 w-56 mb-6 rounded" />
          <div className="skeleton h-52 w-full rounded-xl" />
        </div>
      ))}
    </div>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────
function HeatmapViz({ chart }) {
  const { labels, matrix } = chart.data
  const flat = matrix.flat().filter(v => v != null)
  const min = Math.min(...flat), max = Math.max(...flat)
  const color = (v) => {
    const t = (v - min) / (max - min || 1)
    if (t > 0.6) return `rgba(99,102,241,${0.25 + t * 0.75})`
    if (t > 0.3) return `rgba(16,185,129,${0.2 + t * 0.6})`
    return `rgba(239,68,68,${0.2 + t * 0.5})`
  }
  return (
    <div className="overflow-auto h-64 mt-1">
      <div className="grid gap-1" style={{ gridTemplateColumns: `72px repeat(${labels.length}, 1fr)`, minWidth: 300 }}>
        <div />
        {labels.map(l => (
          <div key={l} className="text-[9px] text-slate-500 text-center truncate px-0.5"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{l}</div>
        ))}
        {matrix.map((row, ri) => (
          <div key={ri} className="contents">
            <div className="text-[9px] text-slate-500 text-right pr-2 flex items-center justify-end truncate">{labels[ri]}</div>
            {row.map((v, ci) => (
              <div key={ci} className="h-9 flex items-center justify-center text-[9px] text-white rounded-md transition-all duration-200 hover:scale-110 cursor-default"
                style={{ background: v != null ? color(v) : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}
                title={`${labels[ri]} × ${labels[ci]}: ${v?.toFixed(3)}`}>
                {v?.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Chart card ────────────────────────────────────────────────────────────
function ChartCard({ chart, index }) {
  const { chartType, title, description, data } = chart

  const renderContent = () => {
    if (chartType === 'heatmap') return <HeatmapViz chart={chart} />

    if (chartType === 'pie') {
      const items = data.labels.map((l, i) => ({ name: String(l).slice(0, 20), value: data.datasets[0].values[i] }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={items} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={35} paddingAngle={3}
              label={({ percent }) => percent > 0.05 ? `${(percent*100).toFixed(0)}%` : ''} labelLine={false}>
              {items.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />)}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ color:'#94a3b8', fontSize:11 }}>{v}</span>} />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'scatter') {
      const pts = (data.datasets[0].values || []).map(p => ({ x: p.x, y: p.y }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="x" type="number" name={chart.xKey} tick={axisStyle} tickLine={false} />
            <YAxis dataKey="y" type="number" name={chart.yKeys?.[0]} tick={axisStyle} tickLine={false} />
            <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(99,102,241,0.3)' }} />
            <Scatter data={pts} fill="#6366f1" fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'line') {
      const pts = data.labels.map((l, i) => ({ label: l, value: data.datasets[0].values[i] }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={pts}>
            <defs>
              <linearGradient id={`grad-${chart.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fill={`url(#grad-${chart.id})`} dot={false} name={data.datasets[0].name} />
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'radar') {
      const pts = data.labels.map((l, i) => ({ subject: String(l).slice(0, 12), value: data.datasets[0].values[i] }))
      return (
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={pts}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
            <PolarRadiusAxis tick={{ fill: '#475569', fontSize: 9 }} />
            <Radar name={data.datasets[0].name} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            <Tooltip {...tooltipStyle} />
          </RadarChart>
        </ResponsiveContainer>
      )
    }

    if (chartType === 'area') {
      const pts = data.labels.map((l, i) => {
        const obj = { label: l }
        data.datasets.forEach(ds => { obj[ds.name] = ds.values[i] })
        return obj
      })
      return (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={pts}>
            <defs>
              {data.datasets.map((ds, i) => (
                <linearGradient key={ds.name} id={`area-${chart.id}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="label" tick={axisStyle} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            {data.datasets.map((ds, i) => (
              <Area key={ds.name} type="monotone" dataKey={ds.name} stroke={COLORS[i]} strokeWidth={2} fill={`url(#area-${chart.id}-${i})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )
    }

    // default: bar
    const pts = data.labels.map((l, i) => {
      const obj = { label: String(l).slice(0, 18) }
      data.datasets.forEach(ds => { obj[ds.name] = ds.values[i] })
      return obj
    })
    return (
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={pts} barCategoryGap="30%">
          <CartesianGrid {...gridStyle} />
          <XAxis dataKey="label" tick={axisStyle} tickLine={false} interval={0}
            angle={pts.length > 8 ? -30 : 0} textAnchor={pts.length > 8 ? 'end' : 'middle'} height={pts.length > 8 ? 50 : 30} />
          <YAxis tick={axisStyle} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          {data.datasets.map((ds, i) => (
            <Bar key={ds.name} dataKey={ds.name} fill={COLORS[i % COLORS.length]} radius={[6,6,0,0]} fillOpacity={0.9} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <div className="chart-card-hover rounded-2xl overflow-hidden"
      style={{ background:'rgba(13,17,32,0.7)', border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(20px)' }}>
      <div className="h-px w-full" style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.5),transparent)' }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-semibold text-white text-sm">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <div className="px-2 py-0.5 rounded-full text-[10px] font-medium text-accent2"
            style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)' }}>
            {chartType}
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  )
}

// ── Range slider component ────────────────────────────────────────────────
function RangeFilter({ col, opts, value, onChange }) {
  const { min, max } = opts
  const [local, setLocal] = useState(value || { min, max })

  useEffect(() => { setLocal(value || { min, max }) }, [value, min, max])

  const fmt = (v) => {
    if (v == null) return ''
    if (Math.abs(v) >= 1000000) return (v/1000000).toFixed(1) + 'M'
    if (Math.abs(v) >= 1000) return (v/1000).toFixed(1) + 'K'
    return Number(v).toFixed(v % 1 === 0 ? 0 : 2)
  }

  const commit = (newVal) => {
    // only filter if not full range
    if (newVal.min <= min && newVal.max >= max) {
      onChange(col, null)
    } else {
      onChange(col, newVal)
    }
  }

  return (
    <div className="flex flex-col gap-2 min-w-[180px]">
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium truncate max-w-[100px]" title={col}>{col}</span>
        <span className="text-[10px] text-accent2 tabular-nums">{fmt(local.min)} – {fmt(local.max)}</span>
      </div>
      <div className="flex gap-2 items-center">
        <input type="range" min={min} max={max} step={(max - min) / 100 || 1}
          value={local.min}
          onChange={e => {
            const v = Math.min(Number(e.target.value), local.max - (max-min)/100)
            setLocal(p => ({ ...p, min: v }))
          }}
          onMouseUp={() => commit(local)}
          onTouchEnd={() => commit(local)}
          className="flex-1 accent-indigo-500 h-1 cursor-pointer"
          style={{ accentColor: '#6366f1' }}
        />
        <input type="range" min={min} max={max} step={(max - min) / 100 || 1}
          value={local.max}
          onChange={e => {
            const v = Math.max(Number(e.target.value), local.min + (max-min)/100)
            setLocal(p => ({ ...p, max: v }))
          }}
          onMouseUp={() => commit(local)}
          onTouchEnd={() => commit(local)}
          className="flex-1 cursor-pointer"
          style={{ accentColor: '#6366f1' }}
        />
      </div>
    </div>
  )
}

// ── Main Visualizations page ──────────────────────────────────────────────
export default function Visualizations() {
  const [charts, setCharts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterOpts, setFilterOpts] = useState({})
  const [filters, setFilters] = useState({})
  const [meta, setMeta] = useState({})
  const [refreshing, setRefreshing] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(true)

  const fetchCharts = useCallback(async (f = {}) => {
    setLoading(true)
    try {
      // strip null/empty filters
      const active = Object.fromEntries(Object.entries(f).filter(([,v]) => v != null && v !== ''))
      const res = await getCharts(Object.keys(active).length ? active : null)
      setCharts(res.data.charts)
      setMeta({ filtered: res.data.filtered_rows, total: res.data.total_rows })
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    fetchCharts()
    getFilterOpts().then(r => {
      setFilterOpts(r.data || {})
    }).catch(() => {})
  }, [fetchCharts])

  const handleFilterChange = (col, val) => {
    setFilters(prev => {
      const updated = { ...prev, [col]: val }
      fetchCharts(updated)
      return updated
    })
  }

  const clearFilters = () => { setFilters({}); fetchCharts({}) }

  const activeCount = Object.values(filters).filter(v => v != null && v !== '' && v !== '__all__').length
  const catCols = Object.entries(filterOpts).filter(([,o]) => o.type === 'categorical')
  const numCols = Object.entries(filterOpts).filter(([,o]) => o.type === 'numeric')
  const hasAnyFilters = catCols.length > 0 || numCols.length > 0

  return (
    <div className="animate-fade-in">

      {/* ── Filter Panel ── */}
      {hasAnyFilters && (
        <div className="mb-5 rounded-2xl overflow-hidden"
          style={{ background:'rgba(13,17,32,0.7)', border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(20px)' }}>
          <div className="h-px w-full" style={{ background:'linear-gradient(90deg,transparent,rgba(99,102,241,0.4),transparent)' }} />

          {/* Header row */}
          <div className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none"
            onClick={() => setFiltersOpen(o => !o)}>
            <SlidersHorizontal className="w-4 h-4 text-accent2" />
            <span className="text-sm font-medium text-slate-300">Filters</span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                style={{ background:'rgba(99,102,241,0.5)' }}>{activeCount} active</span>
            )}
            {activeCount > 0 && (
              <button onClick={e => { e.stopPropagation(); clearFilters() }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 ml-1 transition-colors"
                style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', padding:'2px 8px', borderRadius:8 }}>
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
            <div className="ml-auto flex items-center gap-3">
              {activeCount > 0 && meta.filtered != null && (
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-accent2" />
                  {meta.filtered?.toLocaleString()} / {meta.total?.toLocaleString()} rows
                </span>
              )}
              <button onClick={e => { e.stopPropagation(); setRefreshing(true); fetchCharts(filters) }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white transition-colors"
                style={{ background:'rgba(255,255,255,0.04)' }}>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-accent' : ''}`} />
              </button>
              {filtersOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>

          {/* Filter controls */}
          {filtersOpen && (
            <div className="px-5 pb-5" style={{ borderTop:'1px solid rgba(255,255,255,0.04)' }}>

              {/* Categorical dropdowns */}
              {catCols.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3 font-semibold">Categorical</p>
                  <div className="flex flex-wrap gap-3">
                    {catCols.map(([col, opts]) => (
                      <div key={col} className="flex flex-col gap-1 min-w-[140px]">
                        <label className="text-xs text-slate-500 truncate max-w-[160px]" title={col}>{col}</label>
                        <select
                          value={filters[col] || ''}
                          onChange={e => handleFilterChange(col, e.target.value || null)}
                          className="input text-xs rounded-xl"
                          style={{ minWidth: 140, maxWidth: 200 }}>
                          <option value="">All</option>
                          {opts.values.map(v => (
                            <option key={v} value={v}>{String(v).slice(0, 30)}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numeric range sliders */}
              {numCols.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-3 font-semibold">Numeric Range</p>
                  <div className="flex flex-wrap gap-5">
                    {numCols.map(([col, opts]) => (
                      <RangeFilter
                        key={col}
                        col={col}
                        opts={opts}
                        value={filters[col]}
                        onChange={handleFilterChange}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Charts grid ── */}
      {loading ? <LoadingSkeleton /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {charts.map((c, i) => <ChartCard key={c.id} chart={c} index={i} />)}
        </div>
      )}
    </div>
  )
}
