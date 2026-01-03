import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { deleteBugImages, getBugPreviewImage } from '../lib/bugImageStorage'

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
        .select(`*`)
        .order('created_at', { ascending: false })

      if (!includeArchived) {
        query = query.eq('is_archived', false)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const bugsWithImages = await Promise.all((data || []).map(async (bug) => {
        const preview = await getBugPreviewImage(bug.user_id, bug.id)
        // Extract synthetic steps_to_reproduce from description if present
        let steps = null
        if (bug.description && bug.description.includes('\n\n---\n\n**Steps to Reproduce:**\n\n')) {
          const parts = bug.description.split('\n\n---\n\n**Steps to Reproduce:**\n\n')
          steps = parts[1]?.split('\n\n---')?.[0] || null
        }
        return { ...bug, preview_image: preview || null, steps_to_reproduce: steps }
      }))

      setBugs(bugsWithImages)
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
        .select(`*`)
        .eq('id', bugId)
        .single()

      if (fetchError) throw fetchError
      const preview = await getBugPreviewImage(data.user_id, data.id)
      let steps = null
      if (data.description && data.description.includes('\n\n---\n\n**Steps to Reproduce:**\n\n')) {
        const parts = data.description.split('\n\n---\n\n**Steps to Reproduce:**\n\n')
        steps = parts[1]?.split('\n\n---')?.[0] || null
      }
      setBug({ ...data, preview_image: preview || null, steps_to_reproduce: steps })
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

  const updateStatus = useCallback(async (bugId, newStatus, userId, userEmail, oldStatus) => {
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
        actor_id: userId,
        actor_email: userEmail,
        action: 'bug_status_changed',
        metadata: { old_status: oldStatus, new_status: newStatus },
      })

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // SCHEMA COMPLIANCE: assigned_to field does not exist in authoritative schema
  // Only user_id (owner) exists. Assignment feature disabled.
  const updateAssignee = useCallback(async (bugId, assigneeId) => {
    console.warn('Assignment feature disabled: schema only supports user_id (owner)')
    return { success: false, error: 'Assignment not supported in current schema' }
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

  // STORAGE LIFECYCLE: Delete bug with associated image cleanup
  const deleteBug = useCallback(async (bugId, ownerId = null) => {
    setLoading(true)
    setError(null)

    try {
      // DB/RLS AUDIT: Delete bug from database first
      const { error: deleteError } = await supabase
        .from('bugs')
        .delete()
        .eq('id', bugId)

      if (deleteError) {
        // DB/RLS AUDIT: Fail loudly on delete errors
        console.error('❌ DB/RLS AUDIT: Bug delete failed:', {
          bugId,
          code: deleteError.code,
          message: deleteError.message
        })
        throw deleteError
      }
      
      // STORAGE LIFECYCLE: Clean up bug images AFTER successful DB delete
      const cleanupResult = await deleteBugImages(ownerId, bugId)
      if (!cleanupResult.success) {
        // Log but don't fail - bug is already deleted
        console.error('⚠️ STORAGE LIFECYCLE: Bug image cleanup failed (non-fatal):', cleanupResult.error)
      }
      
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
