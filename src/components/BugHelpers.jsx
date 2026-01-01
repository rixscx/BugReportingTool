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
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">
            Possible Duplicates Found
          </h4>
          <p className="text-xs text-amber-700 mb-3">
            Similar bugs may already exist. Please check before creating a new one.
          </p>
          <div className="space-y-2">
            {similarBugs.map(bug => (
              <button
                key={bug.id}
                onClick={() => onSelect(bug)}
                className="w-full text-left p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 truncate flex-1">
                    {bug.title}
                  </span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    bug.status === 'Open' ? 'bg-blue-100 text-blue-700' :
                    bug.status === 'In Progress' ? 'bg-purple-100 text-purple-700' :
                    'bg-green-100 text-green-700'
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
  { name: 'UI/UX', color: 'bg-pink-100 text-pink-700' },
  { name: 'Backend', color: 'bg-indigo-100 text-indigo-700' },
  { name: 'Database', color: 'bg-cyan-100 text-cyan-700' },
  { name: 'Security', color: 'bg-red-100 text-red-700' },
  { name: 'Performance', color: 'bg-orange-100 text-orange-700' },
  { name: 'Mobile', color: 'bg-purple-100 text-purple-700' },
  { name: 'API', color: 'bg-blue-100 text-blue-700' },
  { name: 'Documentation', color: 'bg-slate-100 text-slate-700' },
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
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Labels
        {selected.length > 0 && (
          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-xs">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-50">
            <p className="text-xs text-slate-500 px-2 py-1 mb-1">Select labels</p>
            <div className="space-y-1">
              {PRESET_LABELS.map(label => (
                <button
                  key={label.name}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    selected.includes(label.name) ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${label.color}`}>
                    {label.name}
                  </span>
                  {selected.includes(label.name) && (
                    <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(labelName => {
            const label = PRESET_LABELS.find(l => l.name === labelName)
            return (
              <span
                key={labelName}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${label?.color || 'bg-slate-100 text-slate-700'}`}
              >
                {labelName}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter(l => l !== labelName))}
                  className="hover:opacity-70"
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
