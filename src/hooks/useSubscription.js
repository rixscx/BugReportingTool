import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Hook to manage bug subscriptions (watch/unwatch)
 * Queries bug_subscriptions table per authoritative schema
 */
export function useSubscription(bugId, userId) {
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [loading, setLoading] = useState(true)

    const fetchSubscription = useCallback(async () => {
        if (!bugId || !userId) {
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('bug_subscriptions')
                .select('*')
                .eq('bug_id', bugId)
                .eq('user_id', userId)
                .single()

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows found (not an error state)
                console.error('Error fetching subscription:', error)
            }

            setIsSubscribed(!!data)
        } catch (err) {
            console.error('Subscription fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, [bugId, userId])

    useEffect(() => {
        fetchSubscription()
    }, [fetchSubscription])

    const subscribe = useCallback(async () => {
        if (!bugId || !userId) return { success: false, error: 'Missing bugId or userId' }

        try {
            const { error } = await supabase
                .from('bug_subscriptions')
                .insert({ bug_id: bugId, user_id: userId })

            if (error) throw error
            setIsSubscribed(true)
            return { success: true }
        } catch (err) {
            console.error('Subscribe error:', err)
            return { success: false, error: err.message }
        }
    }, [bugId, userId])

    const unsubscribe = useCallback(async () => {
        if (!bugId || !userId) return { success: false, error: 'Missing bugId or userId' }

        try {
            const { error } = await supabase
                .from('bug_subscriptions')
                .delete()
                .eq('bug_id', bugId)
                .eq('user_id', userId)

            if (error) throw error
            setIsSubscribed(false)
            return { success: true }
        } catch (err) {
            console.error('Unsubscribe error:', err)
            return { success: false, error: err.message }
        }
    }, [bugId, userId])

    const toggle = useCallback(async () => {
        if (isSubscribed) {
            return await unsubscribe()
        } else {
            return await subscribe()
        }
    }, [isSubscribed, subscribe, unsubscribe])

    return {
        isSubscribed,
        loading,
        subscribe,
        unsubscribe,
        toggle,
        refetch: fetchSubscription
    }
}
