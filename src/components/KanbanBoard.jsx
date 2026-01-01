import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StatusBadge from './StatusBadge'

const columns = [
  { id: 'Open', title: 'Open', color: 'bg-blue-500' },
  { id: 'In Progress', title: 'In Progress', color: 'bg-purple-500' },
  { id: 'Resolved', title: 'Resolved', color: 'bg-green-500' },
]

const priorityOrder = { High: 0, Medium: 1, Low: 2 }
const priorityColors = {
  High: 'border-l-red-500',
  Medium: 'border-l-amber-500',
  Low: 'border-l-emerald-500',
}

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
    e.target.classList.add('opacity-50')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('opacity-50')
    setDraggedBug(null)
    setDragOverColumn(null)
  }

  const handleDragOver = (e, columnId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

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
      // Fail silently - UI reverts on refresh
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => {
        const columnBugs = getBugsByStatus(column.id)
        const isOver = dragOverColumn === column.id

        return (
          <div 
            key={column.id}
            className="flex-1 min-w-[300px]"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${column.color}`} />
              <h3 className="font-semibold text-slate-800">{column.title}</h3>
              <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                {columnBugs.length}
              </span>
            </div>

            {/* Column Content */}
            <div 
              className={`bg-slate-50 rounded-xl p-3 min-h-[400px] transition-all ${
                isOver ? 'bg-blue-50 ring-2 ring-blue-300 ring-dashed' : ''
              }`}
            >
              <div className="space-y-3">
                {columnBugs.map(bug => (
                  <div
                    key={bug.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, bug)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white rounded-lg border border-slate-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all border-l-4 ${priorityColors[bug.priority]} ${
                      updating === bug.id ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Link to={`/bug/${bug.id}`} className="block">
                      <h4 className="font-medium text-slate-800 text-sm mb-2 line-clamp-2 hover:text-blue-600">
                        {bug.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {bug.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          bug.priority === 'High' ? 'bg-red-100 text-red-700' :
                          bug.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {bug.priority}
                        </span>
                        {bug.assignee ? (
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center" title={bug.assignee.username || bug.assignee.email}>
                            <span className="text-xs text-blue-600 font-medium">
                              {(bug.assignee.username || bug.assignee.email)?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}

                {columnBugs.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    {isOver ? 'Drop here' : 'No bugs'}
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
