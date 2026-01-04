import { useState, useRef, useCallback, useEffect } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

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
  
  const CROP_SIZE = 256
  const CONTAINER_SIZE = 280

  useEffect(() => {
    if (!imageFile) return
    const reader = new FileReader()
    reader.onload = (e) => setImageSrc(e.target.result)
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      imageRef.current = img
      const minDimension = Math.min(img.width, img.height)
      const initialZoom = CONTAINER_SIZE / minDimension
      setZoom(Math.max(initialZoom, 1))
      setPosition({ x: 0, y: 0 })
    }
    img.src = imageSrc
  }, [imageSrc])

  const handleDragStart = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    setDragStart({ x: clientX - position.x, y: clientY - position.y })
  }, [position])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const scaledWidth = imageSize.width * zoom
    const scaledHeight = imageSize.height * zoom
    const maxX = Math.max(0, (scaledWidth - CONTAINER_SIZE) / 2)
    const maxY = Math.max(0, (scaledHeight - CONTAINER_SIZE) / 2)
    setPosition({
      x: clamp(clientX - dragStart.x, -maxX, maxX),
      y: clamp(clientY - dragStart.y, -maxY, maxY)
    })
  }, [isDragging, dragStart, imageSize, zoom])

  const handleDragEnd = useCallback(() => setIsDragging(false), [])

  const handleZoomChange = useCallback((e) => {
    const newZoom = parseFloat(e.target.value)
    setZoom(newZoom)
    const scaledWidth = imageSize.width * newZoom
    const scaledHeight = imageSize.height * newZoom
    const maxX = Math.max(0, (scaledWidth - CONTAINER_SIZE) / 2)
    const maxY = Math.max(0, (scaledHeight - CONTAINER_SIZE) / 2)
    setPosition(prev => ({
      x: clamp(prev.x, -maxX, maxX),
      y: clamp(prev.y, -maxY, maxY)
    }))
  }, [imageSize])

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return
    setLoading(true)
    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = imageRef.current
      canvas.width = CROP_SIZE
      canvas.height = CROP_SIZE
      const scaledWidth = imageSize.width * zoom
      const scaledHeight = imageSize.height * zoom
      const cropCenterX = (scaledWidth / 2) - position.x
      const cropCenterY = (scaledHeight / 2) - position.y
      const srcCenterX = cropCenterX / zoom
      const srcCenterY = cropCenterY / zoom
      const srcSize = CONTAINER_SIZE / zoom
      const srcX = srcCenterX - (srcSize / 2)
      const srcY = srcCenterY - (srcSize / 2)
      ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE)
      ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, CROP_SIZE, CROP_SIZE)
      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob)
        setLoading(false)
      }, 'image/png', 0.95)
    } catch (error) {
      console.error('Crop error:', error)
      setLoading(false)
    }
  }, [imageSize, zoom, position, onCropComplete])

  const minZoom = imageSize.width && imageSize.height
    ? Math.max(CONTAINER_SIZE / imageSize.width, CONTAINER_SIZE / imageSize.height)
    : 1

  if (!imageSrc) {
    return (
      <div className="fixed inset-0 bg-[#06060a]/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
        <div className="relative bg-[rgba(12,12,18,0.95)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(99,102,241,0.05)] to-transparent rounded-2xl pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 w-5 h-5 border-2 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 blur-lg bg-[#6366f1]/30 rounded-full" />
            </div>
            <span className="text-[13px] text-[#9898a8]">Loading image...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#06060a]/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[rgba(99,102,241,0.08)] blur-[100px] pointer-events-none" />
      
      <div className="relative bg-[rgba(12,12,18,0.95)] border border-[rgba(255,255,255,0.08)] rounded-3xl max-w-sm w-full overflow-hidden backdrop-blur-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5),0_0_80px_rgba(99,102,241,0.08)]">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/40 to-transparent" />
        
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h3 className="text-[14px] font-semibold text-[#f0f0f5]">Crop avatar</h3>
          <p className="text-[12px] text-[#4a4a58] mt-1">Drag to position, use slider to zoom</p>
        </div>
        
        <div className="p-5">
          <div 
            ref={containerRef}
            className="relative mx-auto overflow-hidden rounded-2xl bg-[#0a0a0f] cursor-move select-none border border-[rgba(255,255,255,0.06)]"
            style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
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
              <img src={imageSrc} alt="Crop preview" className="w-full h-full object-contain" draggable={false} />
            </div>
            
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{ boxShadow: `0 0 0 9999px rgba(6, 6, 10, 0.7)` }} />
              <div className="absolute inset-0 border-2 border-[rgba(99,102,241,0.4)] rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]" />
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => <div key={i} className="border border-white/5" />)}
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex items-center gap-3">
            <span className="text-[11px] text-[#4a4a58]">−</span>
            <input
              type="range"
              min={minZoom}
              max={Math.max(minZoom * 3, 3)}
              step={0.01}
              value={zoom}
              onChange={handleZoomChange}
              className="flex-1 h-1.5 bg-[#14141c] rounded-full appearance-none cursor-pointer accent-[#6366f1]"
            />
            <span className="text-[11px] text-[#4a4a58]">+</span>
          </div>
          <div className="text-center text-[11px] text-[#4a4a58] mt-2">{Math.round(zoom * 100)}%</div>
        </div>
        
        <div className="px-5 py-4 bg-[#0a0a0f]/50 border-t border-[rgba(255,255,255,0.06)] flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[rgba(255,255,255,0.05)] text-[#9898a8] text-[12px] font-medium rounded-xl hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[12px] font-medium rounded-xl hover:shadow-[0_8px_30px_rgba(99,102,241,0.3)] transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2 hover:-translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : 'Save'}
          </button>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

export default AvatarCropper
