import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// Canonical action labels from activity_logs.action enum
const actionLabels = {
  bug_created: 'created this bug',
  bug_updated: 'updated this bug',
  bug_status_changed: 'changed status',
  bug_assigned: 'assigned this bug',
  comment_added: 'added a comment',
  comment_edited: 'edited a comment',
  comment_deleted: 'deleted a comment',
  profile_updated: 'updated profile',
}

export default function ActivityTimeline({ bugId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    try {
      // Query activity_logs filtered by entity_id (bug UUID)
      const { data, error: fetchError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_id', bugId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const actorIds = [...new Set((data || []).map(a => a.actor_id).filter(Boolean))]
      let profilesMap = {}
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, email')
          .in('id', actorIds)
        profilesMap = (profiles || []).reduce((acc, p) => { acc[p.id] = p; return acc }, {})
      }

      const enriched = (data || []).map(activity => ({
        ...activity,
        actor: profilesMap[activity.actor_id] || { email: 'Unknown', username: 'Unknown' }
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
    // Realtime subscription on activity_logs for this bug
    const channel = supabase.channel(`activity-logs-${bugId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs', filter: `entity_id=eq.${bugId}` }, async () => { await fetchActivities() })
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
            const userName = activity.actor?.username || activity.actor?.email?.split('@')[0] || 'User'
            const label = actionLabels[activity.action] || activity.action?.replace(/_/g, ' ') || 'performed action'

            // Render metadata based on action type (never infer from raw values)
            let metaDetail = null
            if (activity.action === 'bug_status_changed' && activity.metadata) {
              const { from, to } = activity.metadata
              if (from && to) {
                metaDetail = <span className="text-[#4a4a58]"> · {from} → {to}</span>
              }
            }

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
                    {metaDetail}
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
