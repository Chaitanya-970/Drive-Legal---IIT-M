import { useState, useRef, useEffect, useCallback } from 'react'
import './ImageScanner.css'


let modelPromise = null

function loadModel() {
  if (!modelPromise) {
    modelPromise = Promise.all([
      import('@tensorflow/tfjs'),
      import('@tensorflow-models/coco-ssd'),
    ]).then(([, cocoSsd]) => cocoSsd.load())
  }
  return modelPromise
}


const VEHICLE_MAP = {
  motorcycle: 'Two-Wheeler',
  bicycle: 'Two-Wheeler',
  car: 'Four-Wheeler',
  truck: 'Four-Wheeler',
  bus: 'Four-Wheeler',
}

const VEHICLE_CLASSES = new Set(Object.keys(VEHICLE_MAP))

function ImageScanner({ onVehicleDetected }) {
  const [modelStatus, setModelStatus] = useState('idle') 
  const [detecting, setDetecting] = useState(false)
  const [detections, setDetections] = useState([])
  const [mappedVehicle, setMappedVehicle] = useState(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const modelRef = useRef(null)
  const fileInputRef = useRef(null)

  
  useEffect(() => {
    setModelStatus('loading')
    loadModel()
      .then((model) => {
        modelRef.current = model
        setModelStatus('ready')
      })
      .catch(() => {
        setModelStatus('error')
        modelPromise = null 
      })
  }, [])

  const drawImageOnCanvas = useCallback((img) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    const maxW = 640
    const maxH = 480
    let { naturalWidth: w, naturalHeight: h } = img

    const scale = Math.min(maxW / w, maxH / h, 1)
    w = Math.round(w * scale)
    h = Math.round(h * scale)

    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
  }, [])

  const drawDetections = useCallback((predictions) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    predictions.forEach((pred) => {
      const [x, y, width, height] = pred.bbox
      const isVehicle = VEHICLE_CLASSES.has(pred.class)
      const color = isVehicle ? '#38bdf8' : '#94a3b8'

      
      ctx.strokeStyle = color
      ctx.lineWidth = 2.5
      ctx.strokeRect(x, y, width, height)

      
      const label = `${pred.class} (${Math.round(pred.score * 100)}%)`
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif'
      const textMetrics = ctx.measureText(label)
      const textH = 20
      const textW = textMetrics.width + 10

      ctx.fillStyle = color
      ctx.fillRect(x, y - textH, textW, textH)

      
      ctx.fillStyle = '#0f172a'
      ctx.fillText(label, x + 5, y - 5)
    })
  }, [])

  const runDetection = useCallback(async (img) => {
    if (!modelRef.current) return

    setDetecting(true)
    setDetections([])
    setMappedVehicle(null)

    try {
      const predictions = await modelRef.current.detect(img)
      setDetections(predictions)

      
      drawImageOnCanvas(img)
      drawDetections(predictions)

      
      const vehiclePreds = predictions
        .filter((p) => VEHICLE_CLASSES.has(p.class))
        .sort((a, b) => b.score - a.score)

      if (vehiclePreds.length > 0) {
        const best = vehiclePreds[0]
        const mapped = VEHICLE_MAP[best.class]
        setMappedVehicle({ raw: best.class, type: mapped, score: best.score })
        onVehicleDetected?.(mapped)
      } else {
        setMappedVehicle(null)
      }
    } catch {
      
    } finally {
      setDetecting(false)
    }
  }, [drawImageOnCanvas, drawDetections, onVehicleDetected])

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return

    setImageLoaded(false)
    setDetections([])
    setMappedVehicle(null)

    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      drawImageOnCanvas(img)

      if (modelRef.current) {
        runDetection(img)
      }
    }
    img.src = URL.createObjectURL(file)
  }, [drawImageOnCanvas, runDetection])

  const handleFileChange = (e) => {
    handleFile(e.target.files?.[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleRetry = () => {
    setModelStatus('loading')
    modelPromise = null
    loadModel()
      .then((model) => {
        modelRef.current = model
        setModelStatus('ready')
      })
      .catch(() => {
        setModelStatus('error')
        modelPromise = null
      })
  }

  return (
    <div className="image-scanner">
      <div className="scanner-header">
        <div className="scanner-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <h3>AI Vehicle Scanner</h3>
        <p className="scanner-subtitle">Upload a photo to auto-detect vehicle type</p>
      </div>

      
      <div className={`model-status model-status--${modelStatus}`}>
        {modelStatus === 'loading' && (
          <>
            <div className="model-spinner" />
            <span>Loading AI Model…</span>
          </>
        )}
        {modelStatus === 'ready' && (
          <>
            <span className="model-dot model-dot--ready" />
            <span>AI Model Ready</span>
          </>
        )}
        {modelStatus === 'error' && (
          <>
            <span className="model-dot model-dot--error" />
            <span>Model failed to load</span>
            <button className="retry-btn" onClick={handleRetry}>Retry</button>
          </>
        )}
      </div>

      
      <div
        className={`upload-zone ${dragOver ? 'upload-zone--dragover' : ''} ${imageLoaded ? 'upload-zone--has-image' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="upload-input"
          id="scanner-file-input"
        />

        {!imageLoaded && (
          <div className="upload-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p>Drag &amp; drop an image or <span className="upload-link">browse</span></p>
            <p className="upload-hint">JPG, PNG, WEBP — max 10MB</p>
          </div>
        )}

        <canvas ref={canvasRef} className={`scanner-canvas ${imageLoaded ? 'scanner-canvas--visible' : ''}`} />

        {detecting && (
          <div className="detecting-overlay">
            <div className="model-spinner" />
            <span>Analyzing image…</span>
          </div>
        )}
      </div>

      
      {imageLoaded && !detecting && (
        <button
          className="change-image-btn"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Different Image
        </button>
      )}

      
      {imageLoaded && !detecting && detections.length > 0 && (
        <div className="detection-results">
          <div className="detection-summary">
            <span className="detection-count">{detections.length} object{detections.length !== 1 ? 's' : ''} detected</span>
          </div>

          {mappedVehicle ? (
            <div className="vehicle-result">
              <div className="vehicle-result-icon">
                {mappedVehicle.type === 'Two-Wheeler' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18.5" cy="17.5" r="3.5" />
                    <circle cx="5.5" cy="17.5" r="3.5" />
                    <path d="M15 6a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
                    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17h14v-5H5z" />
                    <path d="M19 12l-2-5H7L5 12" />
                    <circle cx="7.5" cy="17" r="2" />
                    <circle cx="16.5" cy="17" r="2" />
                  </svg>
                )}
              </div>
              <div className="vehicle-result-text">
                <span className="vehicle-result-label">Detected</span>
                <span className="vehicle-result-type">{mappedVehicle.type}</span>
                <span className="vehicle-result-raw">
                  {mappedVehicle.raw} — {Math.round(mappedVehicle.score * 100)}% confidence
                </span>
              </div>
              <div className="vehicle-result-check">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="vehicle-result vehicle-result--none">
              <p>No vehicle detected in this image. Please try another photo.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageScanner
