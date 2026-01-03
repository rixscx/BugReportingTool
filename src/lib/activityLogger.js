import { supabase } from './supabaseClient'

/**
 * CENTRALIZED ACTIVITY LOGGING
 * 
 * All activity logs MUST go through this helper.
 * This enforces the entity_id contract - every log must reference an entity.
 * 
 * activity_logs schema:
 * - id, actor_id, actor_email, entity_type, entity_id, action, 
 * - field, old_value, new_value, bug_id, created_at
 * 
 * @param {Object} params
 * @param {string} params.action - Action type (e.g., 'bug_created', 'bug_deleted')
 * @param {string} params.entityType - Entity type ('bug', 'comment')
 * @param {string} params.entityId - UUID of the entity (REQUIRED)
 * @param {string} params.actorId - UUID of the user performing the action
 * @param {string} params.actorEmail - Email of the user performing the action
 * @param {string} [params.bugId] - Bug ID for reference (optional, defaults to entityId for bug actions)
 * @param {string} [params.field] - Field that was changed (for status_changed, etc.)
 * @param {string} [params.oldValue] - Previous value
 * @param {string} [params.newValue] - New value
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function logActivity({
    action,
    entityType,
    entityId,
    actorId,
    actorEmail,
    bugId = null,
    field = null,
    oldValue = null,
    newValue = null,
}) {
    // ═══════════════════════════════════════════════════════════════
    // CONTRACT ENFORCEMENT: entity_id is NEVER optional
    // ═══════════════════════════════════════════════════════════════
    if (!entityId) {
        const errorMsg = `Activity log missing entity_id for action: ${action}`
        console.error('❌ LOGGING CONTRACT VIOLATION:', errorMsg)
        throw new Error(errorMsg)
    }

    if (!entityType) {
        const errorMsg = `Activity log missing entity_type for action: ${action}`
        console.error('❌ LOGGING CONTRACT VIOLATION:', errorMsg)
        throw new Error(errorMsg)
    }

    if (!action) {
        throw new Error('Activity log missing action')
    }

    try {
        const { error } = await supabase.from('activity_logs').insert({
            action,
            entity_type: entityType,
            entity_id: entityId,
            actor_id: actorId,
            actor_email: actorEmail,
            bug_id: bugId || (entityType === 'bug' ? entityId : null),
            field: field,
            old_value: oldValue,
            new_value: newValue,
        })

        if (error) {
            console.error('❌ Activity log insert failed:', error)
            return { success: false, error: error.message }
        }

        console.log(`✅ Activity logged: ${action} on ${entityType}:${entityId}`)
        return { success: true }
    } catch (err) {
        console.error('❌ Activity log exception:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Log bug-related activity
 */
export async function logBugActivity({
    action,
    bugId,
    actorId,
    actorEmail,
    field = null,
    oldValue = null,
    newValue = null,
}) {
    return logActivity({
        action,
        entityType: 'bug',
        entityId: bugId,
        actorId,
        actorEmail,
        bugId,
        field,
        oldValue,
        newValue,
    })
}

/**
 * Log comment-related activity
 */
export async function logCommentActivity({
    action,
    commentId,
    bugId,
    actorId,
    actorEmail,
    field = null,
    oldValue = null,
    newValue = null,
}) {
    return logActivity({
        action,
        entityType: 'comment',
        entityId: commentId,
        actorId,
        actorEmail,
        bugId,
        field,
        oldValue,
        newValue,
    })
}
