import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ActivityTimeline({ bugId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('bug_activity')
      .select(`*`)
      .eq('bug_id', bugId)
      .order('created_at', { ascending: false })

    if (!error) {
      setActivities(data || [])
    }
    setLoading(false)
  }, [bugId])

  useEffect(() => {
    fetchActivities()
    const channel = supabase
      .channel(`bug-activity-${bugId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bug_activity',
          filter: `bug_id=eq.${bugId}`,
        },
        async () => {
          await fetchActivities()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [bugId, fetchActivities])

  const getActionIcon = (action) => {
    switch (action) {
      case 'bug_archived':
        return (
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
        )
      case 'bug_restored':
        return (
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        )
      case 'comment_deleted':
      case 'comment_updated':
      case 'bug_created':
      case 'status_change':
      case 'bug_status_changed':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'assignment_change':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )
      case 'comment_added':
      case 'comment_created':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  const getActionText = (activity) => {
    const userName = activity.actor_email || activity.user?.username || activity.user?.email || 'Someone'
    const oldVal = activity.metadata?.old_value || activity.old_value
    const newVal = activity.metadata?.new_value || activity.new_value
    const oldStatus = activity.metadata?.old_status
    const newStatus = activity.metadata?.new_status

    switch (activity.action) {
      case 'bug_status_changed':
      case 'status_change':
        return (
          <>
            <span className="font-medium">{userName}</span> changed status from{' '}
            <span className="font-medium">{oldStatus || oldVal || 'None'}</span> to{' '}
            <span className="font-medium">{newStatus || newVal}</span>
          </>
        )
      case 'assignment_change':
        return (
          <>
            <span className="font-medium">{userName}</span> {newVal ? 'assigned to' : 'unassigned from'}{' '}
            <span className="font-medium">{newVal || oldVal}</span>
          </>
        )
      case 'comment_added':
      case 'comment_created':
        return (
          <>
            <span className="font-medium">{userName}</span> added a comment
          </>
        )
      case 'comment_updated':
        return (
          <>
            <span className="font-medium">{userName}</span> edited a comment
          </>
        )
      case 'comment_deleted':
        return (
          <>
            <span className="font-medium">{userName}</span> deleted a comment
          </>
        )
      case 'bug_archived':
        return (
          <>
            <span className="font-medium">{userName}</span> archived this bug
          </>
        )
      case 'bug_restored':
        return (
          <>
            <span className="font-medium">{userName}</span> restored this bug
          </>
        )
      case 'bug_created':
        return (
          <>
            <span className="font-medium">{userName}</span> reported this bug
          </>
        )
      default:
        return (
          <>
            <span className="font-medium">{userName}</span> {activity.action}
          </>
        )
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Activity</h2>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading activity...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">Activity</h2>
        {activities.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
            {activities.length} event{activities.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex gap-3 relative">
              {/* Connection line */}
              {index < activities.length - 1 && (
                <div className="absolute left-4 top-8 w-px h-full bg-slate-200 -translate-x-1/2"></div>
              )}
              {getActionIcon(activity.action)}
              <div className="flex-1 pb-2">
                <p className="text-sm text-slate-700">
                  {getActionText(activity)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(activity.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
