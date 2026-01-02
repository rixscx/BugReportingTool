/**
 * Procedural Deterministic Avatar Generator
 * Generates unique geometric avatars from user IDs
 * Similar to GitHub identicons - symmetric, colorful, deterministic
 * 
 * Algorithm:
 * 1. Hash the seed (userId) to get a consistent number
 * 2. Use hash to generate colors (background + foreground)
 * 3. Generate a 5x5 grid pattern using hash bits
 * 4. Mirror left half to right for symmetry
 * 5. Output as SVG string
 */

/**
 * Simple deterministic hash function (djb2)
 * Same input ALWAYS produces same output
 * @param {string} str - Input seed (userId, email, etc)
 * @returns {number} - 32-bit hash number
 */
function hashCode(str) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i) // hash * 33 + char
  }
  return Math.abs(hash)
}

/**
 * Generate HSL color from hash
 * @param {number} hash - Hash number
 * @param {number} offset - Offset to generate different colors from same hash
 * @returns {string} - HSL color string
 */
function hashToColor(hash, offset = 0) {
  const hue = ((hash + offset) % 360)
  const saturation = 50 + ((hash + offset) % 30) // 50-80%
  const lightness = 45 + ((hash + offset) % 20)  // 45-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Generate background color (lighter)
 * @param {number} hash - Hash number
 * @returns {string} - HSL color string
 */
function hashToBackgroundColor(hash) {
  const hue = (hash % 360)
  const saturation = 20 + (hash % 20) // 20-40%
  const lightness = 85 + (hash % 10)  // 85-95%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Generate symmetric 5x5 grid pattern from hash
 * Left side mirrors to right side for symmetry
 * @param {number} hash - Hash number
 * @returns {boolean[][]} - 5x5 grid (true = filled, false = empty)
 */
function generateGrid(hash) {
  const gridSize = 5
  const grid = []
  
  // We only need to generate 3 columns (left + middle)
  // Right 2 columns mirror the left 2
  for (let y = 0; y < gridSize; y++) {
    const row = []
    for (let x = 0; x < gridSize; x++) {
      if (x < 3) {
        // Left side + middle: use hash bits
        const bitIndex = (y * 3) + x
        const bit = (hash >> bitIndex) & 1
        row.push(bit === 1)
      } else {
        // Right side: mirror the left
        const mirrorX = gridSize - 1 - x
        row.push(row[mirrorX])
      }
    }
    grid.push(row)
  }
  
  return grid
}

/**
 * Generate SVG avatar from seed
 * @param {string} seed - User ID, email, or any unique string
 * @param {number} size - Output size in pixels (default: 80)
 * @returns {string} - SVG string
 */
export function generateAvatar(seed, size = 80) {
  if (!seed) return ''
  
  // 1. Hash the seed
  const hash = hashCode(seed)
  
  // 2. Generate colors from hash
  const bgColor = hashToBackgroundColor(hash)
  const fgColor = hashToColor(hash, 123) // Offset for different color
  
  // 3. Generate symmetric grid pattern
  const grid = generateGrid(hash)
  const gridSize = 5
  const blockSize = size / gridSize
  
  // 4. Build SVG rectangles for filled blocks
  const blocks = []
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x]) {
        blocks.push(
          `<rect x="${x * blockSize}" y="${y * blockSize}" width="${blockSize}" height="${blockSize}" fill="${fgColor}"/>`
        )
      }
    }
  }
  
  // 5. Generate final SVG
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  ${blocks.join('\n  ')}
</svg>`
  
  return svg
}

/**
 * Generate data URL for use in <img> src
 * @param {string} seed - User ID or unique string
 * @param {number} size - Size in pixels
 * @returns {string} - Data URL
 */
export function generateAvatarDataURL(seed, size = 80) {
  const svg = generateAvatar(seed, size)
  
  // Use encodeURIComponent for better compatibility
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml,${encoded}`
}

/**
 * React component wrapper (optional)
 * Usage: <Avatar seed={userId} size={100} />
 */
export function Avatar({ seed, size = 80, className = '', alt = 'Avatar' }) {
  const avatarDataURL = generateAvatarDataURL(seed, size)
  
  return (
    <img 
      src={avatarDataURL}
      alt={alt}
      className={className}
      width={size}
      height={size}
      style={{ 
        borderRadius: '8px',
        display: 'block'
      }}
    />
  )
}

// Default export
export default { generateAvatar, generateAvatarDataURL, Avatar }
