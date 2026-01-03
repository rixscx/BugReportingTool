import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { formatSmartDate } from '../lib/dateUtils'

const priorityConfig = {
  High: { color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500', ring: 'ring-red-200', border: 'border-red-100' },
  Medium: { color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500', ring: 'ring-amber-200', border: 'border-amber-100' },
  Low: { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', ring: 'ring-emerald-200', border: 'border-emerald-100' },
}

export default function BugCard({ bug }) {
  const priority = priorityConfig[bug.priority] || priorityConfig.Medium
  const hasImage = bug.preview_image

  return (
    <Link to={`/bug/${bug.id}`} className="block group">
      <div className={`bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col overflow-hidden ${bug.priority === 'High' ? 'ring-2 ring-red-100 border-red-200' : ''}`}>
        {/* Image Preview */}
        {hasImage && (
          <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden relative">
            <img 
              src={bug.preview_image} 
              alt="" 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        
        <div className="p-5 flex flex-col flex-grow">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {bug.title}
            </h3>
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${priority.bg} ${priority.color} border ${priority.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot} animate-pulse`}></span>
              {bug.priority}
            </span>
          </div>

          {/* Description */}
          <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-grow leading-relaxed">
            {bug.description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <StatusBadge status={bug.status} />
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatSmartDate(bug.created_at)}
            </span>
            {(bug.reported_by_name || bug.reported_by_email) && (
              <span className="truncate ml-2 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {bug.reported_by_name || (bug.reported_by_email ? bug.reported_by_email.split('@')[0] : '')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
