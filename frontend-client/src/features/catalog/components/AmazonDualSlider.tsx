import React, { useRef, useState, useCallback, useEffect } from 'react'

export interface AmazonDualSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export const AmazonDualSlider: React.FC<AmazonDualSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
}) => {
  const [minVal, maxVal] = value
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Clamp percentages for track
  const minPercent = Math.max(0, Math.min(100, Math.round(((minVal - min) / (max - min || 1)) * 100)))
  const maxPercent = Math.max(0, Math.min(100, Math.round(((maxVal - min) / (max - min || 1)) * 100)))

  const handleMinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - step)
    onChange([Math.max(min, val), maxVal])
  }, [min, maxVal, step, onChange])

  const handleMaxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + step)
    onChange([minVal, Math.min(max, val)])
  }, [max, minVal, step, onChange])

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    const rawVal = min + ratio * (max - min)
    const snapped = Math.round(rawVal / step) * step

    if (Math.abs(snapped - minVal) <= Math.abs(snapped - maxVal)) {
      const newMin = Math.min(snapped, maxVal - step)
      onChange([Math.max(min, newMin), maxVal])
      setActiveThumb('min')
    } else {
      const newMax = Math.max(snapped, minVal + step)
      onChange([minVal, Math.min(max, newMax)])
      setActiveThumb('max')
    }
  }

  // Clear active state on window mouse up
  useEffect(() => {
    const handleUp = () => setActiveThumb(null)
    window.addEventListener('pointerup', handleUp)
    return () => window.removeEventListener('pointerup', handleUp)
  }, [])

  return (
    <div
      ref={trackRef}
      className="amazon-slider-container"
      onClick={handleTrackClick}
    >
      <div className="amazon-slider-rail" />
      <div
        className="amazon-slider-track"
        style={{
          left: `${minPercent}%`,
          width: `${Math.max(0, maxPercent - minPercent)}%`,
        }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        onChange={handleMinChange}
        onPointerDown={(e) => {
          e.stopPropagation()
          setActiveThumb('min')
        }}
        className={`amazon-range-input amazon-range-min ${activeThumb === 'min' ? 'is-active' : ''}`}
        style={{
          zIndex: activeThumb === 'min' ? 10 : minVal > (max - min) * 0.75 ? 5 : 3,
        }}
        aria-label="Minimum value"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        onChange={handleMaxChange}
        onPointerDown={(e) => {
          e.stopPropagation()
          setActiveThumb('max')
        }}
        className={`amazon-range-input amazon-range-max ${activeThumb === 'max' ? 'is-active' : ''}`}
        style={{
          zIndex: activeThumb === 'max' ? 10 : 4,
        }}
        aria-label="Maximum value"
      />
    </div>
  )
}
export default AmazonDualSlider
