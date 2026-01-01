/* eslint-disable react-refresh/only-export-components */
export function exportToCSV(bugs, filename = 'bugs-export') {
  if (!bugs || bugs.length === 0) {
    alert('No bugs to export')
    return
  }
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status' },
    { key: 'priority', label: 'Priority' },
    { key: 'reporter', label: 'Reporter' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'created_at', label: 'Created At' },
    { key: 'updated_at', label: 'Updated At' },
  ]
  const header = columns.map(col => col.label).join(',')
  const rows = bugs.map(bug => {
    return columns.map(col => {
      let value = ''
      switch (col.key) {
        case 'reporter':
          value = bug.reporter?.username || bug.reporter?.email || ''
          break
        case 'assignee':
          value = bug.assignee?.username || bug.assignee?.email || ''
          break
        case 'created_at':
        case 'updated_at':
          value = bug[col.key] ? new Date(bug[col.key]).toLocaleString() : ''
          break
        default:
          value = bug[col.key] || ''
      }
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""')
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`
        }
      }
      return value
    }).join(',')
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Export to JSON
export function exportToJSON(bugs, filename = 'bugs-export') {
  if (!bugs || bugs.length === 0) {
    alert('No bugs to export')
    return
  }

  const data = bugs.map(bug => ({
    id: bug.id,
    title: bug.title,
    description: bug.description,
    status: bug.status,
    priority: bug.priority,
    steps_to_reproduce: bug.steps_to_reproduce,
    reporter: bug.reporter?.username || bug.reporter?.email || null,
    assignee: bug.assignee?.username || bug.assignee?.email || null,
    created_at: bug.created_at,
    updated_at: bug.updated_at,
    is_archived: bug.is_archived,
  }))

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Generate bug report summary
export function generateReport(bugs) {
  const total = bugs.length
  const open = bugs.filter(b => b.status === 'Open').length
  const inProgress = bugs.filter(b => b.status === 'In Progress').length
  const resolved = bugs.filter(b => b.status === 'Resolved').length
  const high = bugs.filter(b => b.priority === 'High').length
  const medium = bugs.filter(b => b.priority === 'Medium').length
  const low = bugs.filter(b => b.priority === 'Low').length

  return {
    total,
    byStatus: { open, inProgress, resolved },
    byPriority: { high, medium, low },
    completionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  }
}

// Export Menu Component
export function ExportMenu({ bugs, onClose }) {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
      <button
        onClick={() => {
          exportToCSV(bugs)
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export as CSV
      </button>
      <button
        onClick={() => {
          exportToJSON(bugs)
          onClose()
        }}
        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        Export as JSON
      </button>
    </div>
  )
}
