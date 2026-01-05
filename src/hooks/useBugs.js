import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { deleteBugImages, getBugPreviewImage } from '../lib/bugImageStorage'
// NOTE: Client-side activity logging removed - DB triggers handle all activity_logs

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
        .select(`*, reporter:profiles!reported_by(id, username, email)`)
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
        // Use reported_by for ownership per new schema
        const preview = await getBugPreviewImage(bug.reported_by, bug.id)
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
      // Use reported_by for ownership per new schema
      const preview = await getBugPreviewImage(data.reported_by, data.id)
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

  const updateStatus = useCallback(async (bugId, newStatus) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('bugs')
        .update({ status: newStatus })
        .eq('id', bugId)

      if (updateError) throw updateError
      // DB trigger handles activity_logs

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  // Update assigned_to (new schema supports assigned_to field)
  const updateAssignee = useCallback(async (bugId, assigneeId) => {
    setLoading(true)
    setError(null)
    try {
      const { error: updateError } = await supabase
        .from('bugs')
        .update({ assigned_to: assigneeId })
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
      // DB trigger handles activity_logs

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
      // DB trigger handles activity_logs

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * DELETE FLOW (SIMPLIFIED)
   * Delete permission: Admin OR bug owner (reported_by)
   * DB triggers handle activity_logs
   */

  // Track bugs currently being deleted to prevent duplicate attempts
  const deletingBugIdsRef = useRef(new Set())

  const deleteBug = useCallback(async (bug, actorId, isAdmin = false) => {
    if (!bug || !bug.id) {
      setError('Invalid bug data')
      return { success: false, error: 'Invalid bug data' }
    }

    if (deletingBugIdsRef.current.has(bug.id)) {
      console.warn('Delete already in progress for bug:', bug.id)
      return { success: false, error: 'Delete already in progress' }
    }

    deletingBugIdsRef.current.add(bug.id)
    setLoading(true)
    setError(null)

    // Permission check: Admin OR owner (using reported_by field)
    const isOwner = bug.reported_by === actorId
    if (!isAdmin && !isOwner) {
      setError('Permission denied: Only admin or bug reporter can delete')
      deletingBugIdsRef.current.delete(bug.id)
      setLoading(false)
      return { success: false, error: 'Permission denied' }
    }

    try {
      // Hard delete from bugs (RLS enforced, DB triggers handle logging)
      const { error: deleteError } = await supabase
        .from('bugs')
        .delete()
        .eq('id', bug.id)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        throw new Error(`Delete failed: ${deleteError.message}`)
      }

      // Cleanup images (best-effort)
      const cleanupResult = await deleteBugImages(bug.reported_by, bug.id)
      if (!cleanupResult.success) {
        console.warn('Image cleanup failed (non-fatal):', cleanupResult.error)
      }

      return { success: true, deletedBugId: bug.id }
    } catch (err) {
      console.error('Delete flow aborted:', err.message)
      setError(err.message)
      deletingBugIdsRef.current.delete(bug.id)
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
