import { generatePixelAvatarDataURL } from './pixelAvatarGenerator.jsx'

/**
 * Generate a unique pixel art avatar URL for a user
 * Uses procedural generation - same user ID always gets same avatar
 * Avatars are 8-bit pixel art style, deterministically generated
 */
export const generateAvatarUrl = (seed) => {
  if (!seed) return null
  return generatePixelAvatarDataURL(seed, 90, 'blocky')
}

/**
 * Get avatar styles available
 */
export const AVATAR_STYLES = [
  { value: 'blocky', label: 'Pixel Art (Default)' },
  { value: 'rounded', label: 'Rounded Pixels' },
  { value: 'robot', label: 'Robot Style' },
]

/**
 * Generate avatar with custom style
 * Different pixel styles for variety
 */
export const generateAvatarWithStyle = (seed, style = 'blocky') => {
  if (!seed) return null
  
  return generatePixelAvatarDataURL(seed, 90, style)
}