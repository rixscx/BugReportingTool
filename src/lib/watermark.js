/**
 * Persistent Creator Attribution Watermark
 * 
 * Creates an unremovable watermark badge linking to the creator's GitHub profile.
 * The watermark is protected against removal and modification through:
 * - MutationObserver monitoring and instant re-injection
 * - Object.defineProperty locks on critical attributes
 * - CSS !important rules preventing style override
 * - Prototype-level href protection
 * - Periodic existence verification
 * 
 * @author rixscx (https://github.com/rixscx)
 */

const WATERMARK_ID = 'rixscx-creator-watermark'
const CREATOR_NAME = 'rixscx'
const CREATOR_GITHUB = 'https://github.com/rixscx'
const WATERMARK_CHECK_INTERVAL = 100 // ms

/**
 * Creates the watermark element with styling and protections
 * @returns {HTMLAnchorElement} The watermark badge element
 */
function createWatermarkElement() {
  const watermarkContainer = document.createElement('a')
  watermarkContainer.id = WATERMARK_ID
  watermarkContainer.href = CREATOR_GITHUB
  watermarkContainer.target = '_blank'
  watermarkContainer.rel = 'noopener noreferrer'
  watermarkContainer.setAttribute('role', 'link')
  watermarkContainer.setAttribute('aria-label', `Visit ${CREATOR_NAME} GitHub profile`)
  watermarkContainer.setAttribute('data-immutable', 'true')
  watermarkContainer.setAttribute('data-uneditable', 'true')
  watermarkContainer.style.cssText = `
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2147483647;
    user-select: none;
    pointer-events: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    text-decoration: none;
    cursor: pointer;
  `

  const badgeElement = document.createElement('div')
  badgeElement.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 8px 14px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: 9999px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    white-space: nowrap;
    height: auto;
    transition: all 0.2s ease;
  `

  const nameElement = document.createElement('span')
  nameElement.style.cssText = `
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: white;
    line-height: 1;
    display: flex;
    align-items: center;
  `
  nameElement.textContent = CREATOR_NAME

  badgeElement.appendChild(nameElement)
  watermarkContainer.appendChild(badgeElement)
  Object.defineProperty(watermarkContainer, 'href', {
    value: CREATOR_GITHUB,
    writable: false,
    configurable: false
  })
  
  Object.defineProperty(watermarkContainer, 'target', {
    value: '_blank',
    writable: false,
    configurable: false
  })

  return watermarkContainer
}

/**
 * Injects the watermark into the DOM if not already present
 */
function injectWatermark() {
  const existing = document.getElementById(WATERMARK_ID)
  if (existing) return

  const watermark = createWatermarkElement()
  document.body.appendChild(watermark)
}

/**
 * Monitors DOM changes and prevents watermark removal or modification
 * Uses MutationObserver with aggressive polling as fallback
 */
function watchWatermark() {
  const observer = new MutationObserver((mutations) => {
    let watermarkRemoved = false

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.removedNodes.forEach((node) => {
          if (node.id === WATERMARK_ID || (node.contains && node.contains(document.getElementById(WATERMARK_ID)))) {
            watermarkRemoved = true
          }
        })

        if (!document.getElementById(WATERMARK_ID) && mutation.removedNodes.length > 0) {
          watermarkRemoved = true
        }
      }
      if (mutation.type === 'attributes' && mutation.target.id === WATERMARK_ID) {
        const watermark = mutation.target
        
        if (watermark.href !== CREATOR_GITHUB) {
          watermark.href = CREATOR_GITHUB
        }
        
        if (watermark.target !== '_blank') {
          watermark.target = '_blank'
        }
        
        if (!watermark.getAttribute('data-immutable')) {
          watermark.setAttribute('data-immutable', 'true')
        }
      }
    }

    if (watermarkRemoved) {
      injectWatermark()
    }
  })

  observer.observe(document.body, {
    childList: true,
    attributes: true,
    subtree: true,
    attributeFilter: ['id', 'class', 'style', 'href', 'target']
  })
  setInterval(() => {
    if (!document.getElementById(WATERMARK_ID)) {
      injectWatermark()
    }
  }, WATERMARK_CHECK_INTERVAL)

  return observer
}

/**
 * Applies CSS protection with !important rules to prevent override attempts
 */
function protectWatermarkCSS() {
  const style = document.createElement('style')
  style.textContent = `
    #${WATERMARK_ID} {
      position: fixed !important;
      bottom: 16px !important;
      right: 16px !important;
      z-index: 2147483647 !important;
      user-select: none !important;
      pointer-events: auto !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
      text-decoration: none !important;
      cursor: pointer !important;
    }

    #${WATERMARK_ID}:hover > div {
      box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.5) !important;
      transform: translateY(-2px) !important;
    }

    #${WATERMARK_ID} > div {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      padding: 8px 14px !important;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%) !important;
      color: white !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      border-radius: 9999px !important;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      white-space: nowrap !important;
      height: auto !important;
      transition: all 0.2s ease !important;
    }

    #${WATERMARK_ID} > div > span {
      font-size: 13px !important;
      font-weight: 700 !important;
      letter-spacing: -0.5px !important;
      color: white !important;
      line-height: 1 !important;
      display: flex !important;
      align-items: center !important;
    }
  `
  
  const existingStyle = document.querySelector(`style[data-watermark="true"]`)
  if (existingStyle) {
    existingStyle.remove()
  }
  
  style.setAttribute('data-watermark', 'true')
  style.setAttribute('data-immutable', 'true')
  document.head.appendChild(style)
}

/**
 * Initializes the watermark system with all protection layers
 */
function initWatermark() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectWatermark()
      protectWatermarkCSS()
      watchWatermark()
    })
  } else {
    injectWatermark()
    protectWatermarkCSS()
    watchWatermark()
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => injectWatermark(), 100)
    }
  })
  setInterval(() => {
    if (!document.getElementById(WATERMARK_ID)) {
      injectWatermark()
    }
  }, 500)
}

/**
 * Self-initialization: Watermark automatically initializes when module loads
 * Ensures persistence even if initWatermark() call is removed from App.jsx
 */
if (document.body) {
  initWatermark()
} else {
  document.addEventListener('DOMContentLoaded', initWatermark)
}

/**
 * Prototype-level protection: Prevents href modification via normal assignment
 * Silently restores watermark href if any attempt to change it is made
 */
const originalHref = Object.getOwnPropertyDescriptor(HTMLAnchorElement.prototype, 'href')
Object.defineProperty(HTMLAnchorElement.prototype, 'href', {
  get() {
    return originalHref.get.call(this)
  },
  set(value) {
    if (this.id === WATERMARK_ID && value !== CREATOR_GITHUB) {
      return // Silently reject modification attempts
    }
    originalHref.set.call(this, value)
  },
  configurable: true
})

export { initWatermark, CREATOR_NAME }
