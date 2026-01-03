import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useActivity(options = {}) {
    const { limit = 100 } = options
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchActivities = useCallback(async () => {
        try {
            setLoading(true)

            // Fetch activity with actor profile info
            // Note: We need to fetch profiles manually since we might not have a clean relation or want to avoid complex joins if RLS is strict
            const { data, error: fetchError } = await supabase
                .from('bug_activity')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit)

            if (fetchError) throw fetchError

            // Get unique actor IDs
            const actorIds = [...new Set(data.map(a => a.actor_id).filter(Boolean))]

            let profilesMap = {}
            if (actorIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, email, full_name, avatar_url')
                    .in('id', actorIds)

                profilesMap = (profiles || []).reduce((acc, p) => {
                    acc[p.id] = p
                    return acc
                }, {})
            }

            // Merge profile data
            const enriched = data.map(activity => ({
                ...activity,
                actor: profilesMap[activity.actor_id] || {
                    email: activity.actor_email || 'Unknown',
                    username: activity.actor_email ? activity.actor_email.split('@')[0] : 'Unknown'
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
    }, [limit])

    useEffect(() => {
        fetchActivities()

        const channel = supabase
            .channel('public:bug_activity')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'bug_activity',
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
