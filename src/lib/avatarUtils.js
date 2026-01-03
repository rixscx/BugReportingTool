import { generateAvatarDataURL } from './avatarGenerator.jsx'

/**
 * Generate a unique avatar URL for a user
 * Uses procedural generation - same user ID always gets same avatar
 * Avatars are geometric patterns, not initials
 */
export const generateAvatarUrl = (seed) => {
  if (!seed) return null
  return generateAvatarDataURL(seed, 90)
}

/**
 * Get avatar styles available
 */
export const AVATAR_STYLES = [
  { value: 'geometric', label: 'Geometric (Default)' },
  { value: 'blocks', label: 'Block Pattern' },
  { value: 'dots', label: 'Dot Matrix' },
  { value: 'waves', label: 'Wave Pattern' },
]

/**
 * Generate avatar with custom style
 * Currently all use same algorithm, but seed is modified for variety
 */
export const generateAvatarWithStyle = (seed, style = 'geometric') => {
  if (!seed) return null
  
  // Add style prefix to seed to generate different patterns
  const styledSeed = `${style}-${seed}`
  return generateAvatarDataURL(styledSeed, 90)
}

/**
 * Resolve avatar URL based on invariant priority:
 * 1) OAuth provider avatar (if OAuth user AND provider avatar exists)
 * 2) User-uploaded avatar
 * 3) Procedural avatar for non-OAuth users only
 * 4) Otherwise null (render placeholder)
 */
export const resolveAvatar = ({
  oauthAvatarUrl,
  uploadedAvatarUrl,
  proceduralSeed,
  forceProcedural = false,
}) => {
  if (oauthAvatarUrl) return oauthAvatarUrl

  if (forceProcedural && proceduralSeed) {
    return generateAvatarUrl(proceduralSeed)
  }

  if (uploadedAvatarUrl && !forceProcedural) return uploadedAvatarUrl

  if (proceduralSeed) return generateAvatarUrl(proceduralSeed)

  return null
}