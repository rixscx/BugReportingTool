import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { cleanMarkdown } from './MarkdownRenderer'

const columns = [
  { id: 'Open', title: 'Open', color: '#6366f1', gradient: 'from-[#6366f1] to-[#818cf8]' },
  { id: 'In Progress', title: 'In Progress', color: '#a855f7', gradient: 'from-[#a855f7] to-[#c084fc]' },
  { id: 'Resolved', title: 'Resolved', color: '#22c55e', gradient: 'from-[#22c55e] to-[#4ade80]' },
]

const priorityOrder = { High: 0, Medium: 1, Low: 2 }
const priorityDot = { High: 'bg-[#ef4444] shadow-[0_0_5px_rgba(239,68,68,0.4)]', Medium: 'bg-[#f59e0b] shadow-[0_0_5px_rgba(245,158,11,0.4)]', Low: 'bg-[#4a4a58]' }

export default function KanbanBoard({ bugs, onUpdate }) {
  const [draggedBug, setDraggedBug] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [updating, setUpdating] = useState(null)

  const getBugsByStatus = (status) => {
    return bugs
      .filter(bug => bug.status === status && !bug.is_archived)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  }

  const handleDragStart = (e, bug) => {
    setDraggedBug(bug)
    e.dataTransfer.effectAllowed = 'move'
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
    setDraggedBug(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => setDragOverColumn(null)

  const handleDrop = async (e, newStatus) => {
    e.preventDefault()
    setDragOverColumn(null)
    if (!draggedBug || draggedBug.status === newStatus) return
    setUpdating(draggedBug.id)

    try {
      const { error } = await supabase
        .from('bugs')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', draggedBug.id)
      if (error) throw error
      if (onUpdate) onUpdate()
    } catch {
      // Fail silently
    } finally {
      setUpdating(null)
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 86400000) return 'today'
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 px-1">
      {columns.map(column => {
        const columnBugs = getBugsByStatus(column.id)
        const isOver = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            className="flex-1 min-w-[320px]"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-3 mb-4 px-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color, boxShadow: `0 0 12px ${column.color}60` }}
              />
              <span className="text-sm font-semibold text-[#f0f0f5]">{column.title}</span>
              <span
                className="text-[11px] font-medium ml-auto px-2.5 py-1 rounded-full"
                style={{ backgroundColor: `${column.color}15`, color: column.color }}
              >
                {columnBugs.length}
              </span>
            </div>

            {/* Column Container */}
            <div className={`relative rounded-2xl p-3 min-h-[420px] transition-all duration-300 ${isOver ? 'bg-gradient-to-b from-[rgba(99,102,241,0.08)] to-[rgba(99,102,241,0.02)] border-2 border-dashed border-[rgba(99,102,241,0.4)]' : 'bg-gradient-to-b from-[rgba(12,12,18,0.6)] to-[rgba(8,8,12,0.4)] border border-[rgba(255,255,255,0.04)]'}`}>
              {isOver && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_70%)] rounded-2xl pointer-events-none" />}

              <div className="relative space-y-3">
                {columnBugs.map(bug => (
                  <div
                    key={bug.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, bug)}
                    onDragEnd={handleDragEnd}
                    className={`group relative bg-gradient-to-br from-[rgba(18,18,26,0.9)] to-[rgba(12,12,18,0.7)] backdrop-blur-xl rounded-2xl border border-[rgba(255,255,255,0.06)] p-4 cursor-grab active:cursor-grabbing hover:border-[rgba(99,102,241,0.35)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(99,102,241,0.08)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-[350ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${updating === bug.id ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {/* Subtle top highlight */}
                    <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />

                    <Link to={`/bug/${bug.id}`} className="block">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0`}
                          style={{
                            backgroundColor: bug.priority === 'High' ? '#ef4444' : bug.priority === 'Medium' ? '#f59e0b' : '#4a4a58',
                            boxShadow: bug.priority !== 'Low' ? `0 0 10px ${bug.priority === 'High' ? 'rgba(239,68,68,0.5)' : 'rgba(245,158,11,0.5)'}` : 'none'
                          }}
                        />
                        <h4 className="text-[13px] font-semibold text-[#f0f0f5] line-clamp-2 group-hover:text-[#a5b4fc] transition-colors leading-[1.4]">
                          {bug.title}
                        </h4>
                      </div>
                      {bug.description && (
                        <p className="text-[11px] text-[#6b6b7b] line-clamp-2 mb-3.5 pl-5 leading-[1.65] max-w-[280px]">
                          {cleanMarkdown(bug.description)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pl-5">
                        <span className="text-[10px] text-[#4a4a58] bg-[rgba(255,255,255,0.03)] px-2 py-1 rounded-lg">{formatTime(bug.created_at)}</span>
                      </div>
                    </Link>
                  </div>
                ))}

                {columnBugs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                      <svg className="w-5 h-5 text-[#3a3a48]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-[12px] text-[#4a4a58]">{isOver ? 'Drop here' : 'No issues'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
