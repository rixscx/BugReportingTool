/**
 * AvatarCropper Component
 * 
 * Lightweight image cropper for avatar uploads with:
 * - Square crop area (1:1 aspect ratio)
 * - Zoom in/out via slider
 * - Drag to reposition image
 * - Exports cropped image as 256x256 PNG blob
 * - No external dependencies required
 */

import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Main AvatarCropper component
 * @param {Object} props
 * @param {File} props.imageFile - The image file to crop
 * @param {Function} props.onCropComplete - Callback with cropped blob
 * @param {Function} props.onCancel - Callback when user cancels
 */
export function AvatarCropper({ imageFile, onCropComplete, onCancel }) {
  const [imageSrc, setImageSrc] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [loading, setLoading] = useState(false)
  
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const containerRef = useRef(null)
  
  // Crop area size (visible square)
  const CROP_SIZE = 256
  // Preview container size
  const CONTAINER_SIZE = 300

  // Load image when file changes
  useEffect(() => {
    if (!imageFile) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target.result)
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Load image dimensions when src is ready
  useEffect(() => {
    if (!imageSrc) return
    
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      imageRef.current = img
      
      // Calculate initial zoom to fit image in container
      const minDimension = Math.min(img.width, img.height)
      const initialZoom = CONTAINER_SIZE / minDimension
      setZoom(Math.max(initialZoom, 1))
      setPosition({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc])

  // Handle mouse/touch drag start
  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    })
  }, [position])

  // Handle mouse/touch drag move
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    
    // Calculate bounds based on zoom level
    const scaledWidth = imageSize.width * zoom
    const scaledHeight = imageSize.height * zoom
    const maxX = Math.max(0, (scaledWidth - CONTAINER_SIZE) / 2)
    const maxY = Math.max(0, (scaledHeight - CONTAINER_SIZE) / 2)
    
    setPosition({
      x: clamp(clientX - dragStart.x, -maxX, maxX),
      y: clamp(clientY - dragStart.y, -maxY, maxY)
    })
  }, [isDragging, dragStart, imageSize, zoom])

  // Handle mouse/touch drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle zoom change
  const handleZoomChange = useCallback((e) => {
    const newZoom = parseFloat(e.target.value)
    setZoom(newZoom)
    
    // Recalculate bounds when zoom changes
    const scaledWidth = imageSize.width * newZoom
    const scaledHeight = imageSize.height * newZoom
    const maxX = Math.max(0, (scaledWidth - CONTAINER_SIZE) / 2)
    const maxY = Math.max(0, (scaledHeight - CONTAINER_SIZE) / 2)
    
    setPosition(prev => ({
      x: clamp(prev.x, -maxX, maxX),
      y: clamp(prev.y, -maxY, maxY)
    }))
  }, [imageSize])

  // Generate cropped image
  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return
    
    setLoading(true)
    
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = imageRef.current
      
      // Set canvas to output size (256x256)
      canvas.width = CROP_SIZE
      canvas.height = CROP_SIZE
      
      // Calculate crop coordinates
      const scaledWidth = imageSize.width * zoom
      const scaledHeight = imageSize.height * zoom
      
      // Center of the crop area in scaled image coordinates
      const cropCenterX = (scaledWidth / 2) - position.x
      const cropCenterY = (scaledHeight / 2) - position.y
      
      // Convert to original image coordinates
      const srcCenterX = cropCenterX / zoom
      const srcCenterY = cropCenterY / zoom
      
      // Source rectangle (in original image coordinates)
      const srcSize = CONTAINER_SIZE / zoom
      const srcX = srcCenterX - (srcSize / 2)
      const srcY = srcCenterY - (srcSize / 2)
      
      // Clear canvas and draw cropped image
      ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)
      ctx.drawImage(
        img,
        srcX, srcY, srcSize, srcSize,  // Source rectangle
        0, 0, CROP_SIZE, CROP_SIZE      // Destination rectangle
      )
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob)
        }
        setLoading(false)
      }, 'image/png', 0.95)
      
    } catch (error) {
      console.error('Crop error:', error)
      setLoading(false)
    }
  }, [imageSize, zoom, position, onCropComplete])

  // Calculate min zoom to ensure image covers crop area
  const minZoom = imageSize.width && imageSize.height
    ? Math.max(CONTAINER_SIZE / imageSize.width, CONTAINER_SIZE / imageSize.height)
    : 1

  if (!imageSrc) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-700">Loading image...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Crop Avatar</h3>
          <p className="text-sm text-slate-500">Drag to position, use slider to zoom</p>
        </div>
        
        {/* Crop Area */}
        <div className="p-6">
          <div 
            ref={containerRef}
            className="relative mx-auto overflow-hidden rounded-xl bg-slate-900 cursor-move select-none"
            style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* Image layer */}
            <div
              className="absolute"
              style={{
                width: imageSize.width * zoom,
                height: imageSize.height * zoom,
                left: `calc(50% + ${position.x}px)`,
                top: `calc(50% + ${position.y}px)`,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none'
              }}
            >
              <img
                src={imageSrc}
                alt="Crop preview"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            
            {/* Overlay with crop window */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-transparent overlay */}
              <div 
                className="absolute inset-0"
                style={{
                  boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5)`,
                  borderRadius: '0.75rem'
                }}
              />
              {/* Crop border */}
              <div 
                className="absolute inset-0 border-2 border-white rounded-xl"
                style={{
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)'
                }}
              />
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Zoom Slider */}
          <div className="mt-6 flex items-center gap-4">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <input
              type="range"
              min={minZoom}
              max={Math.max(minZoom * 3, 3)}
              step={0.01}
              value={zoom}
              onChange={handleZoomChange}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </div>
          
          {/* Zoom percentage */}
          <div className="text-center text-xs text-slate-500 mt-2">
            {Math.round(zoom * 100)}%
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Avatar
              </>
            )}
          </button>
        </div>
        
        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default AvatarCropper
