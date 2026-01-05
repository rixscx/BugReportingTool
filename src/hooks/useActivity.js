import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useActivity(options = {}) {
    const { limit = 100, bugId = null } = options
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true)

            // Fetch from activity_logs (new authoritative table)
            let query = supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit)

            // Filter by bug if provided (entity_type = 'bug' and entity_id = bugId)
            if (bugId) {
                query = query.or(`entity_id.eq.${bugId},and(entity_type.eq.bug,entity_id.eq.${bugId})`)
            }

            const { data, error: fetchError } = await query

            if (fetchError) throw fetchError

            // Get unique actor IDs
            const actorIds = [...new Set((data || []).map(a => a.actor_id).filter(Boolean))]

            let profilesMap = {}
            if (actorIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, email, role')
                    .in('id', actorIds)

                profilesMap = (profiles || []).reduce((acc, p) => {
                    acc[p.id] = p
                    return acc
                }, {})
            }

            // Merge profile data
            const enriched = (data || []).map(activity => ({
                ...activity,
                actor: profilesMap[activity.actor_id] || {
                    email: 'Unknown',
                    username: 'Unknown'
                }
            }))

            setActivities(enriched)
            setError(null)
        } catch (err) {
            console.error('Error fetching activity:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [limit, bugId])

    useEffect(() => {
        fetchActivities()

        // Realtime subscription on activity_logs
        const channel = supabase
            .channel('public:activity_logs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'activity_logs',
                },
                () => {
                    // Refresh on new activity
                    fetchActivities()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchActivities])

    return { activities, loading, error, refetch: fetchActivities }
}
