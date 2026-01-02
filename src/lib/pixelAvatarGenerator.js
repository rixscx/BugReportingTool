/**
 * Pixel Art Avatar Generator
 * Generates retro 8-bit style pixel avatars deterministically
 * 
 * Features:
 * - Deterministic: same seed = same avatar
 * - Procedural: no images, no AI, 100% SVG
 * - Pixel art style: 8x8 grid with blocky appearance
 * - Symmetric: mirrored horizontally for classic pixel art look
 * - Scalable: renders as SVG, no blur or pixelation artifacts
 * 
 * Algorithm:
 * 1. Hash seed into stable byte array (djb2 hash)
 * 2. Use hash bytes to generate 8x8 pixel grid
 * 3. Mirror left half to right for symmetry
 * 4. Generate foreground and background colors from hash
 * 5. Render as SVG with square pixels
 */

/**
 * Stable hash function (djb2 variant)
 * Converts string to array of bytes (0-255)
 * @param {string} str - Input seed
 * @returns {Uint8Array} - Hash bytes (32 bytes)
 */
function hashSeed(str) {
  const hash = new Uint8Array(32)
  let h = 5381
  
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i) // XOR for better distribution
  }
  
  // Fill hash array with deterministic values
  for (let i = 0; i < 32; i++) {
    h = ((h << 5) + h) ^ (h >> 8)
    hash[i] = h & 0xFF
  }
  
  return hash
}

/**
 * Convert hash bytes to HSL color
 * @param {Uint8Array} hash - Hash bytes
 * @param {number} offset - Offset into hash array
 * @returns {string} - HSL color string
 */
function hashToColor(hash, offset = 0) {
  const hue = hash[(offset) % 32] % 360
  const saturation = 60 + (hash[(offset + 1) % 32] % 40) // 60-100%
  const lightness = 45 + (hash[(offset + 2) % 32] % 25) // 45-70%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Convert hash bytes to background color (desaturated)
 * @param {Uint8Array} hash - Hash bytes
 * @returns {string} - HSL color string
 */
function hashToBackgroundColor(hash) {
  const hue = hash[0] % 360
  const saturation = 15 + (hash[1] % 15) // 15-30%
  const lightness = 92 + (hash[2] % 6) // 92-98%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Generate 8x8 pixel grid from hash
 * Left 4 columns are generated, right 4 are mirrored
 * @param {Uint8Array} hash - Hash bytes
 * @returns {boolean[][]} - 8x8 grid (true = filled, false = empty)
 */
function generatePixelGrid(hash) {
  const gridSize = 8
  const grid = []
  
  // Generate left half + middle
  for (let y = 0; y < gridSize; y++) {
    const row = []
    for (let x = 0; x < gridSize; x++) {
      if (x < 4) {
        // Left side: use hash byte to determine if pixel is filled
        // Use bits from hash to create pixel pattern
        const hashIndex = (y * 4 + x) % 32
        const bit = (hash[hashIndex] >> (y % 8)) & 1
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
 * Generate pixel art SVG from seed
 * Output is a crisp, scalable pixel avatar
 * @param {string} seed - User ID, email, or any unique string
 * @param {number} size - Output size in pixels (default: 90)
 * @param {string} style - Pixel style: 'blocky' (default), 'rounded', 'robot'
 * @returns {string} - SVG string
 */
export function generatePixelAvatar(seed, size = 90, style = 'blocky') {
  if (!seed) return ''
  
  // 1. Hash the seed
  const hash = hashSeed(seed)
  
  // 2. Generate colors
  const bgColor = hashToBackgroundColor(hash)
  const fgColor = hashToColor(hash, 8)
  const accentColor = hashToColor(hash, 16) // Optional second color for variety
  
  // 3. Generate symmetric pixel grid
  const grid = generatePixelGrid(hash)
  const gridSize = 8
  const pixelSize = size / gridSize
  
  // 4. Build SVG rectangles for pixels
  const pixels = []
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (grid[y][x]) {
        const px = x * pixelSize
        const py = y * pixelSize
        
        // Determine color (alternate some pixels for depth)
        const colorIndex = (hash[(y * gridSize + x) % 32]) % 3
        let pixelColor = fgColor
        if (colorIndex === 1 && style !== 'blocky') {
          pixelColor = accentColor
        }
        
        if (style === 'rounded') {
          // Rounded corners on pixels
          pixels.push(
            `<rect x="${px}" y="${py}" width="${pixelSize}" height="${pixelSize}" fill="${pixelColor}" rx="${pixelSize * 0.15}" ry="${pixelSize * 0.15}"/>`
          )
        } else if (style === 'robot') {
          // Slightly offset for robot appearance
          const offset = pixelSize * 0.05
          pixels.push(
            `<rect x="${px + offset}" y="${py + offset}" width="${pixelSize - offset * 2}" height="${pixelSize - offset * 2}" fill="${pixelColor}"/>`
          )
        } else {
          // blocky: clean square pixels
          pixels.push(
            `<rect x="${px}" y="${py}" width="${pixelSize}" height="${pixelSize}" fill="${pixelColor}"/>`
          )
        }
      }
    }
  }
  
  // 5. Build final SVG with sharp rendering
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges;">
  <rect width="${size}" height="${size}" fill="${bgColor}"/>
  ${pixels.join('\n  ')}
</svg>`
  
  return svg
}

/**
 * Generate data URL for use in <img> src
 * @param {string} seed - User ID or unique string
 * @param {number} size - Size in pixels
 * @param {string} style - Pixel style
 * @returns {string} - Data URL
 */
export function generatePixelAvatarDataURL(seed, size = 90, style = 'blocky') {
  const svg = generatePixelAvatar(seed, size, style)
  
  // Use encodeURIComponent for better compatibility
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml,${encoded}`
}

/**
 * React component wrapper
 * Usage: <PixelAvatar seed={userId} size={90} style="blocky" />
 */
export function PixelAvatar({ seed, size = 90, style = 'blocky', className = '', alt = 'Avatar' }) {
  const avatarDataURL = generatePixelAvatarDataURL(seed, size, style)
  
  return (
    <img 
      src={avatarDataURL}
      alt={alt}
      className={className}
      width={size}
      height={size}
      style={{ 
        borderRadius: '4px',
        display: 'block',
        imageRendering: 'pixelated',
        imageRendering: 'crisp-edges',
      }}
    />
  )
}

// Default export
export default { generatePixelAvatar, generatePixelAvatarDataURL, PixelAvatar }
