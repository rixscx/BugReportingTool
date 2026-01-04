import { generateAvatarDataURL } from './avatarGenerator.jsx'

/**
 * AVATAR SYSTEM - EXPLICIT TYPE-BASED RESOLUTION
 * 
 * Database Schema:
 * - avatar_type: 'uploaded' | 'generated' | null
 * - avatar_url: URL (only valid when avatar_type === 'uploaded')
 * - avatar_seed: string (only valid when avatar_type === 'generated')
 * - avatar_updated_at: timestamp (for cache busting)
 * 
 * INVARIANTS:
 * - Avatar type is EXPLICIT, never inferred
 * - No localStorage for avatar state
 * - No priority-based resolution
 * - Single source of truth: profiles table
 */

/**
 * Avatar type constants
 */
export const AVATAR_TYPES = {
  UPLOADED: 'uploaded',
  GENERATED: 'generated',
  FALLBACK: null,
}

/**
 * SINGLE SOURCE OF TRUTH: Resolve avatar from profile data
 * 
 * This is the ONLY function that should be used to get avatar URLs.
 * Uses explicit type-based logic - NO inference.
 * 
 * @param {Object} profile - User profile from database
 * @returns {{ type: string, src: string | null }}
 */
export function resolveAvatar(profile) {
  if (!profile) {
    return { type: 'fallback', src: null }
  }

  // RULE 1: Uploaded avatar - explicit type check
  if (profile.avatar_type === 'uploaded' && profile.avatar_url) {
    // Cache-bust with avatar_updated_at timestamp
    const cacheBuster = profile.avatar_updated_at
      ? `?v=${new Date(profile.avatar_updated_at).getTime()}`
      : `?v=${Date.now()}`

    return {
      type: 'uploaded',
      src: profile.avatar_url + cacheBuster
    }
  }

  // RULE 2: Generated avatar - explicit type check
  if (profile.avatar_type === 'generated' && profile.avatar_seed) {
    return {
      type: 'generated',
      src: generateAvatarDataURL(profile.avatar_seed, 90)
    }
  }

  // RULE 3: Fallback - no avatar configured
  return { type: 'fallback', src: null }
}

/**
 * Get avatar URL for display in <img> tags
 * Convenience wrapper around resolveAvatar
 * 
 * @param {Object} profile - User profile
 * @returns {string | null} - URL or null for fallback
 */
export function getAvatarUrl(profile) {
  const { src } = resolveAvatar(profile)
  return src
}

/**
 * Generate a new avatar seed
 * Uses userId + timestamp for uniqueness
 * 
 * @param {string} userId - User ID
 * @returns {string} - New seed
 */
export function generateNewAvatarSeed(userId) {
  return `${userId}-${Date.now()}`
}

/**
 * Generate avatar data URL from seed
 * Uses the existing procedural generator
 * 
 * @param {string} seed - Avatar seed
 * @param {number} size - Size in pixels
 * @returns {string | null} - Data URL
 */
export function generateAvatarFromSeed(seed, size = 90) {
  if (!seed) return null
  return generateAvatarDataURL(seed, size)
}

/**
 * Get avatar styles available (for future use)
 */
export const AVATAR_STYLES = [
  { value: 'geometric', label: 'Geometric (Default)' },
  { value: 'blocks', label: 'Block Pattern' },
  { value: 'dots', label: 'Dot Matrix' },
  { value: 'waves', label: 'Wave Pattern' },
]

/**
 * Prepare avatar update data for database
 * 
 * @param {'uploaded' | 'generated' | null} type - Avatar type
 * @param {Object} options - Options based on type
 * @returns {Object} - Data to update in profiles table
 */
export function prepareAvatarUpdate(type, options = {}) {
  const now = new Date().toISOString()

  if (type === 'uploaded') {
    return {
      avatar_type: 'uploaded',
      avatar_url: options.url,
      avatar_seed: null, // Clear seed when uploading
      avatar_updated_at: now,
    }
  }

  if (type === 'generated') {
    return {
      avatar_type: 'generated',
      avatar_seed: options.seed,
      avatar_url: null, // Keep old URL in storage, just don't use it
      avatar_updated_at: now,
    }
  }

  // Reset to default
  return {
    avatar_type: null,
    avatar_url: null,
    avatar_seed: null,
    avatar_updated_at: now,
  }
}