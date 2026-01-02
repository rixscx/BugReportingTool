/**
 * Generate a unique avatar URL for a user
 * Uses DiceBear API - generates unique avatars based on seed
 * Similar to GitHub's avatars
 */
export const generateAvatarUrl = (seed) => {
  if (!seed) return null
  // DiceBear API with multiple styles, returns unique avatar per seed
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&scale=80`
}

/**
 * Alternative styles available:
 * - avataaars (recommended - colorful, detailed)
 * - pixel-art (retro 8-bit style)
 * - identicon (geometric patterns)
 * - initials (user initials)
 * - bottts (robot style)
 * - personas (illustrated style)
 * 
 * Example:
 * https://api.dicebear.com/7.x/avataaars/svg?seed=john@example.com
 * https://api.dicebear.com/7.x/pixel-art/svg?seed=john@example.com
 */