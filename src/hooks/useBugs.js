import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * Custom hook for fetching and managing bugs
 * Provides bugs data, loading state, and refetch capability
 */
export function useBugs(options = {}) {
  const { includeArchived = false, limit = null } = options
  const [bugs, setBugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('bugs')
        .select(`
          *,
          reporter:profiles!reported_by(username, email),
          assignee:profiles!assigned_to(username, email)
        `)
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('is_archived', false)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setBugs(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load bugs')
    } finally {
      setLoading(false)
    }
  }, [includeArchived, limit])

  useEffect(() => {
    fetchBugs()
  }, [fetchBugs])

  return { bugs, loading, error, refetch: fetchBugs }
}

/**
 * Custom hook for fetching a single bug by ID
 */
export function useBug(bugId) {
  const [bug, setBug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBug = useCallback(async () => {
    if (!bugId) return

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('bugs')
        .select(`
          *,
          reporter:profiles!reported_by(username, email),
          assignee:profiles!assigned_to(username, email)
        `)
        .eq('id', bugId)
        .single()

      if (fetchError) throw fetchError
      setBug(data)
    } catch (err) {
      setError(err.message || 'Bug not found')
    } finally {
      setLoading(false)
    }
  }, [bugId])

  useEffect(() => {
    fetchBug()
  }, [fetchBug])

  const updateBug = useCallback((updates) => {
    setBug(prev => prev ? { ...prev, ...updates } : null)
  }, [])

  return { bug, loading, error, refetch: fetchBug, updateBug }
}

/**
 * Custom hook for bug mutations (create, update, delete)
 */
export function useBugMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateStatus = useCallback(async (bugId, newStatus, userId) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('bugs')
        .update({ status: newStatus })
        .eq('id', bugId)

      if (updateError) throw updateError
      await supabase.from('bug_activity').insert({
        bug_id: bugId,
        user_id: userId,
        action: 'status_change',
        new_value: newStatus,
      })

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAssignee = useCallback(async (bugId, assigneeId) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('bugs')
        .update({ assigned_to: assigneeId || null })
        .eq('id', bugId)

      if (updateError) throw updateError

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const archiveBug = useCallback(async (bugId) => {
    setLoading(true)
    setError(null)

    try {
      const { error: archiveError } = await supabase
        .from('bugs')
        .update({ is_archived: true })
        .eq('id', bugId)

      if (archiveError) throw archiveError
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const unarchiveBug = useCallback(async (bugId) => {
    setLoading(true)
    setError(null)

    try {
      const { error: unarchiveError } = await supabase
        .from('bugs')
        .update({ is_archived: false })
        .eq('id', bugId)

      if (unarchiveError) throw unarchiveError
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteBug = useCallback(async (bugId) => {
    setLoading(true)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('bugs')
        .delete()
        .eq('id', bugId)

      if (deleteError) throw deleteError
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    updateStatus,
    updateAssignee,
    archiveBug,
    unarchiveBug,
    deleteBug,
  }
}
