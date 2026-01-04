import { useState, useMemo } from 'react'

/* eslint-disable react-refresh/only-export-components */
export function findSimilarBugs(title, bugs, threshold = 0.3) {
  if (!title || title.length < 3 || !bugs.length) return []

  const words = title.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  
  return bugs
    .map(bug => {
      const bugWords = bug.title.toLowerCase().split(/\s+/)
      const matches = words.filter(word => 
        bugWords.some(bw => bw.includes(word) || word.includes(bw))
      )
      const score = words.length > 0 ? matches.length / words.length : 0
      return { bug, score }
    })
    .filter(item => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.bug)
}
export function DuplicateDetector({ title, bugs, onSelect }) {
  const similarBugs = useMemo(() => findSimilarBugs(title, bugs), [title, bugs])

  if (similarBugs.length === 0) return null

  return (
    <div className="relative bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-2xl p-5 mt-5 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[rgba(251,191,36,0.1)] blur-[60px] pointer-events-none" />
      
      <div className="relative flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-[rgba(251,191,36,0.2)] to-[rgba(251,191,36,0.1)] rounded-xl flex items-center justify-center flex-shrink-0 border border-[rgba(251,191,36,0.2)] shadow-[0_4px_12px_rgba(251,191,36,0.1)]">
          <svg className="w-5 h-5 text-[#fbbf24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-[14px] font-semibold text-[#fbbf24] mb-2">
            Possible Duplicates Found
          </h4>
          <p className="text-[12px] text-[#d4a012] mb-4">
            Similar bugs may already exist. Please check before creating a new one.
          </p>
          <div className="space-y-2">
            {similarBugs.map(bug => (
              <button
                key={bug.id}
                onClick={() => onSelect(bug)}
                className="w-full text-left p-3 bg-[rgba(12,12,18,0.6)] backdrop-blur-xl rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[rgba(251,191,36,0.3)] transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[#f0f0f5] truncate flex-1">
                    {bug.title}
                  </span>
                  <span className={`ml-3 text-[10px] px-2.5 py-1 rounded-full font-medium ${
                    bug.status === 'Open' ? 'bg-[rgba(99,102,241,0.15)] text-[#818cf8] border border-[rgba(99,102,241,0.2)]' :
                    bug.status === 'In Progress' ? 'bg-[rgba(168,85,247,0.15)] text-[#c084fc] border border-[rgba(168,85,247,0.2)]' :
                    'bg-[rgba(34,197,94,0.15)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]'
                  }`}>
                    {bug.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
const PRESET_LABELS = [
  { name: 'UI/UX', color: 'bg-[rgba(236,72,153,0.15)] text-[#f472b6] border-[rgba(236,72,153,0.2)]' },
  { name: 'Backend', color: 'bg-[rgba(99,102,241,0.15)] text-[#818cf8] border-[rgba(99,102,241,0.2)]' },
  { name: 'Database', color: 'bg-[rgba(34,211,238,0.15)] text-[#22d3ee] border-[rgba(34,211,238,0.2)]' },
  { name: 'Security', color: 'bg-[rgba(239,68,68,0.15)] text-[#f87171] border-[rgba(239,68,68,0.2)]' },
  { name: 'Performance', color: 'bg-[rgba(251,146,60,0.15)] text-[#fb923c] border-[rgba(251,146,60,0.2)]' },
  { name: 'Mobile', color: 'bg-[rgba(168,85,247,0.15)] text-[#c084fc] border-[rgba(168,85,247,0.2)]' },
  { name: 'API', color: 'bg-[rgba(59,130,246,0.15)] text-[#60a5fa] border-[rgba(59,130,246,0.2)]' },
  { name: 'Documentation', color: 'bg-[rgba(148,163,184,0.15)] text-[#94a3b8] border-[rgba(148,163,184,0.2)]' },
]

export function LabelSelector({ selected = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleLabel = (label) => {
    if (selected.includes(label.name)) {
      onChange(selected.filter(l => l !== label.name))
    } else {
      onChange([...selected, label.name])
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)] rounded-xl text-[13px] text-[#9898a8] hover:border-[rgba(99,102,241,0.3)] hover:text-[#f0f0f5] transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Labels
        {selected.length > 0 && (
          <span className="bg-[rgba(99,102,241,0.2)] text-[#818cf8] px-2 py-0.5 rounded-full text-[11px] font-medium">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-60 bg-[rgba(12,12,18,0.95)] backdrop-blur-2xl rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.08)] p-2.5 z-50">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/30 to-transparent" />
            
            <p className="text-[11px] text-[#4a4a58] px-2 py-1.5 mb-1 font-medium tracking-wide">Select labels</p>
            <div className="space-y-1">
              {PRESET_LABELS.map(label => (
                <button
                  key={label.name}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] transition-all duration-200 ${
                    selected.includes(label.name) ? 'bg-[rgba(99,102,241,0.1)]' : 'hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${label.color}`}>
                    {label.name}
                  </span>
                  {selected.includes(label.name) && (
                    <svg className="w-4 h-4 text-[#6366f1] ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Display selected labels */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {selected.map(labelName => {
            const label = PRESET_LABELS.find(l => l.name === labelName)
            return (
              <span
                key={labelName}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${label?.color || 'bg-[rgba(148,163,184,0.15)] text-[#94a3b8] border-[rgba(148,163,184,0.2)]'}`}
              >
                {labelName}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter(l => l !== labelName))}
                  className="hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { PRESET_LABELS }
