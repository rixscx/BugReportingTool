import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const actionLabels = {
  bug_created: 'created',
  bug_status_changed: 'changed status',
  bug_archived: 'archived',
  bug_restored: 'restored',
  comment_created: 'commented',
  comment_updated: 'edited comment',
  comment_deleted: 'deleted comment',
}

export default function ActivityTimeline({ bugId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bug_activity')
        .select(`*`)
        .eq('bug_id', bugId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const actorIds = [...new Set((data || []).map(a => a.actor_id).filter(Boolean))]
      let profilesMap = {}
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, username, email').in('id', actorIds)
        profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc }, {})
      }

      const enriched = (data || []).map(activity => ({
        ...activity,
        user: profilesMap[activity.actor_id] || { email: activity.actor_email || 'Unknown', username: activity.actor_email?.split('@')[0] || 'Unknown' }
      }))

      setActivities(enriched)
    } catch (err) {
      console.error('Error fetching activities:', err)
    } finally {
      setLoading(false)
    }
  }, [bugId])

  useEffect(() => {
    fetchActivities()
    const channel = supabase.channel(`bug-activity-${bugId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bug_activity', filter: `bug_id=eq.${bugId}` }, async () => { await fetchActivities() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [bugId, fetchActivities])

  if (loading) {
    return (
      <div className="text-[12px] text-[#4a4a58]">Loading...</div>
    )
  }

  return (
    <div>
      {activities.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[12px] text-[#4a4a58]">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const userName = activity.user?.username || activity.actor_email?.split('@')[0] || 'User'
            const label = actionLabels[activity.action] || activity.action.replace(/_/g, ' ')
            
            return (
              <div key={activity.id} className="flex items-start gap-3 py-2">
                <div className="relative flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#6366f1] shadow-[0_0_8px_rgba(99,102,241,0.4)] flex-shrink-0" />
                  {index < activities.length - 1 && (
                    <div className="w-px h-full bg-gradient-to-b from-[rgba(99,102,241,0.3)] to-transparent absolute top-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0 -mt-0.5">
                  <p className="text-[12px] text-[#9898a8]">
                    <span className="text-[#f0f0f5] font-medium">{userName}</span> {label}
                    {activity.metadata?.old_status && activity.metadata?.new_status && (
                      <span className="text-[#4a4a58]"> · {activity.metadata.old_status} → {activity.metadata.new_status}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-[#4a4a58] mt-1">
                    {new Date(activity.created_at).toLocaleDateString()} {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
