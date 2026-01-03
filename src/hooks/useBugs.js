import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { deleteBugImages, getBugPreviewImage } from '../lib/bugImageStorage'
import { logBugActivity } from '../lib/activityLogger'

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

      // Log with centralized helper - entity_id is bugId
      await logBugActivity({
        action: 'status_changed',
        bugId: bugId,
        actorId: userId,
        actorEmail: userEmail,
        field: 'status',
        oldValue: oldStatus,
        newValue: newStatus,
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

  const archiveBug = useCallback(async (bugId, userId, userEmail) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Update the bug first
      const { error: archiveError } = await supabase
        .from('bugs')
        .update({ is_archived: true })
        .eq('id', bugId)

      if (archiveError) throw archiveError

      // 2. Log activity with entity_id (bugId is the entity)
      await logBugActivity({
        action: 'bug_archived',
        bugId: bugId,
        actorId: userId,
        actorEmail: userEmail,
        field: 'is_archived',
        oldValue: 'false',
        newValue: 'true',
      })

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  const unarchiveBug = useCallback(async (bugId, userId, userEmail) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Update the bug first
      const { error: unarchiveError } = await supabase
        .from('bugs')
        .update({ is_archived: false })
        .eq('id', bugId)

      if (unarchiveError) throw unarchiveError

      // 2. Log activity with entity_id (bugId is the entity)
      await logBugActivity({
        action: 'bug_restored',
        bugId: bugId,
        actorId: userId,
        actorEmail: userEmail,
        field: 'is_archived',
        oldValue: 'true',
        newValue: 'false',
      })

      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * PROFESSIONAL DELETE FLOW (IDEMPOTENT)
   * Delete permission: Admin OR bug owner (reporter)
   * 
   * Steps (FAIL-FAST - abort if any step fails):
   * 1. Snapshot → Insert full bug data into `deleted_bugs`
   * 2. Log → Insert ONE `bug_deleted` into `bug_activity`
   * 3. Delete → Hard delete from `bugs`
   * 4. Cleanup → Delete images from storage (best-effort)
   * 
   * IDEMPOTENCY: A bug can only be deleted ONCE. Subsequent calls are rejected.
   */

  // Track bugs currently being deleted to prevent duplicate attempts
  const deletingBugIdsRef = useRef(new Set())

  const deleteBug = useCallback(async (bug, actorId, actorEmail, isAdmin = false) => {
    // ═══════════════════════════════════════════════════════════════
    // IDEMPOTENCY CHECK - Prevent duplicate delete attempts
    // ═══════════════════════════════════════════════════════════════
    if (!bug || !bug.id) {
      setError('Invalid bug data')
      return { success: false, error: 'Invalid bug data' }
    }

    if (deletingBugIdsRef.current.has(bug.id)) {
      console.warn('🔒 IDEMPOTENCY: Delete already in progress for bug:', bug.id)
      return { success: false, error: 'Delete already in progress' }
    }

    // Mark this bug as being deleted
    deletingBugIdsRef.current.add(bug.id)
    setLoading(true)
    setError(null)

    // Permission check: Admin OR owner
    const isOwner = bug.user_id === actorId
    if (!isAdmin && !isOwner) {
      setError('Permission denied: Only admin or bug reporter can delete')
      deletingBugIdsRef.current.delete(bug.id)
      setLoading(false)
      return { success: false, error: 'Permission denied' }
    }

    try {
      // ═══════════════════════════════════════════════════════════════
      // STEP 1: SNAPSHOT TO deleted_bugs (CRITICAL - FAIL IF ERROR)
      // ═══════════════════════════════════════════════════════════════
      const snapshotData = {
        original_bug_id: bug.id,
        user_id: bug.user_id,
        title: bug.title,
        description: bug.description,
        status: bug.status,
        priority: bug.priority,
        reported_by_email: bug.reported_by_email || actorEmail,
        reported_by_name: bug.reported_by_name || null,
        deleted_by: actorId,
        deleted_at: new Date().toISOString(),
        original_created_at: bug.created_at,
        metadata: {
          is_archived: bug.is_archived,
          category: bug.category,
          environment: bug.environment,
        }
      }

      const { error: snapshotError } = await supabase
        .from('deleted_bugs')
        .insert(snapshotData)

      if (snapshotError) {
        console.error('❌ STEP 1 FAILED: Snapshot to deleted_bugs failed:', snapshotError)
        throw new Error(`Snapshot failed: ${snapshotError.message}`)
      }
      console.log('✅ STEP 1: Bug snapshotted to deleted_bugs')

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: LOG ACTIVITY (CRITICAL - MUST BE BEFORE DELETION)
      // Uses centralized logger with entity_id enforcement
      // ═══════════════════════════════════════════════════════════════
      const logResult = await logBugActivity({
        action: 'bug_deleted',
        bugId: bug.id,  // REQUIRED: entity_id - NEVER null
        actorId: actorId,
        actorEmail: actorEmail,
        field: 'deleted',
        oldValue: bug.title,  // Store title for audit
        newValue: isAdmin ? 'admin_delete' : 'owner_delete',
      })

      if (!logResult.success) {
        console.error('❌ STEP 2 FAILED: Activity log failed:', logResult.error)
        throw new Error(`Activity log failed: ${logResult.error}`)
      }
      console.log('✅ STEP 2: Activity logged')

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: HARD DELETE FROM bugs (CRITICAL - FAIL IF ERROR)
      // ═══════════════════════════════════════════════════════════════
      const { error: deleteError } = await supabase
        .from('bugs')
        .delete()
        .eq('id', bug.id)

      if (deleteError) {
        console.error('❌ STEP 3 FAILED: Hard delete failed:', deleteError)
        throw new Error(`Delete failed: ${deleteError.message}`)
      }
      console.log('✅ STEP 3: Bug deleted from bugs table')

      // ═══════════════════════════════════════════════════════════════
      // STEP 4: CLEANUP IMAGES (BEST-EFFORT - DON'T FAIL)
      // ═══════════════════════════════════════════════════════════════
      const cleanupResult = await deleteBugImages(bug.user_id, bug.id)
      if (!cleanupResult.success) {
        console.warn('⚠️ STEP 4: Image cleanup failed (non-fatal):', cleanupResult.error)
      } else {
        console.log('✅ STEP 4: Images cleaned up')
      }

      // Keep bug.id in deletingBugIdsRef on success (it's permanently deleted)
      // This prevents any stale UI from attempting to re-delete
      return { success: true, deletedBugId: bug.id }
    } catch (err) {
      console.error('❌ Delete flow aborted:', err.message)
      setError(err.message)
      // On failure, allow retry by removing from the set
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
