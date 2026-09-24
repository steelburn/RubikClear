import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { CubeColor, FaceName, CubeFaceState } from '../types/cube';
import { COLOR_HEX } from '../types/cube';
import { Camera, RefreshCw, Check, Zap, Upload, AlertCircle } from 'lucide-react';

interface ScannerProps {
  onScanComplete: (scannedFaces: Record<FaceName, CubeFaceState>) => void;
  onCancel: () => void;
}

interface FaceGuide {
  face: FaceName;
  name: string;
  centerColor: CubeColor;
  topOrientation: string;
  frontOrientation: string;
}

const SCAN_SEQUENCE: FaceGuide[] = [
  { face: 'U', name: 'Top (White)', centerColor: 'white', topOrientation: 'Blue face on Top', frontOrientation: 'Green face facing Front' },
  { face: 'R', name: 'Right (Red)', centerColor: 'red', topOrientation: 'White face on Top', frontOrientation: 'Green face facing Left' },
  { face: 'F', name: 'Front (Green)', centerColor: 'green', topOrientation: 'White face on Top', frontOrientation: 'Green facing Camera' },
  { face: 'D', name: 'Bottom (Yellow)', centerColor: 'yellow', topOrientation: 'Green face on Top', frontOrientation: 'Yellow facing Camera' },
  { face: 'L', name: 'Left (Orange)', centerColor: 'orange', topOrientation: 'White face on Top', frontOrientation: 'Green face facing Right' },
  { face: 'B', name: 'Back (Blue)', centerColor: 'blue', topOrientation: 'White face on Top', frontOrientation: 'Orange face facing Left' },
];

const PALETTE_COLORS: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

// RGB to HSV conversion
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    if (max === r) {
      h = (60 * ((g - b) / diff) + 360) % 360;
    } else if (max === g) {
      h = (60 * ((b - r) / diff) + 120) % 360;
    } else {
      h = (60 * ((r - g) / diff) + 240) % 360;
    }
  }

  return { h, s, v };
}

// Classify sampled pixel color
function classifyColor(r: number, g: number, b: number): CubeColor {
  const { h, s, v } = rgbToHsv(r, g, b);

  // Very low saturation or very bright neutral = White
  if (s < 0.22 && v > 0.35) return 'white';

  // Hue classification
  if (h >= 75 && h < 165) return 'green';
  if (h >= 165 && h < 265) return 'blue';
  if (h >= 42 && h < 75) return 'yellow';
  if (h >= 14 && h < 42) return 'orange';

  // Red spans 0-14 and 340-360
  if (h >= 340 || h < 14) {
    // If it leans slightly yellow/orange
    if (h >= 12 && s > 0.7) return 'orange';
    return 'red';
  }

  // Fallback distance to reference hex
  const refColors: Record<CubeColor, [number, number, number]> = {
    white: [240, 240, 240],
    yellow: [240, 210, 0],
    green: [0, 160, 60],
    blue: [0, 80, 190],
    red: [190, 20, 40],
    orange: [255, 90, 0],
  };

  let bestColor: CubeColor = 'white';
  let minDistance = Infinity;

  for (const [col, [cr, cg, cb]] of Object.entries(refColors) as [CubeColor, [number, number, number]][]) {
    const dist = Math.hypot(r - cr, g - cg, b - cb);
    if (dist < minDistance) {
      minDistance = dist;
      bestColor = col;
    }
  }

  return bestColor;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [scannedFaces, setScannedFaces] = useState<Partial<Record<FaceName, CubeFaceState>>>({});
  const [currentFaceResult, setCurrentFaceResult] = useState<CubeFaceState | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [activePaletteColor, setActivePaletteColor] = useState<CubeColor>('white');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentGuide = SCAN_SEQUENCE[currentStep];

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access unavailable. You can upload photos of each face instead.');
      setCameraActive(false);
    }
  }, []);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Toggle Torch if supported
  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    if (track && (track.getCapabilities as any)?.()?.torch) {
      try {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } catch (e) {
        console.warn('Torch failed', e);
      }
    }
  };

  // Sample the 3x3 grid from an Image or Canvas
  const processImageToFaceState = (imageSource: CanvasImageSource, width: number, height: number): CubeFaceState => {
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return Array(9).fill(currentGuide.centerColor) as any;
    }

    ctx.drawImage(imageSource, 0, 0, width, height);

    // Bounding square in center
    const boxSize = Math.min(width, height) * 0.70;
    const startX = (width - boxSize) / 2;
    const startY = (height - boxSize) / 2;
    const cellSize = boxSize / 3;

    const detected: CubeColor[] = [];

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        // Sample center 40% of cell
        const sampleSize = cellSize * 0.45;
        const cellCenterX = startX + c * cellSize + cellSize / 2;
        const cellCenterY = startY + r * cellSize + cellSize / 2;
        const sampleX = cellCenterX - sampleSize / 2;
        const sampleY = cellCenterY - sampleSize / 2;

        const imgData = ctx.getImageData(sampleX, sampleY, sampleSize, sampleSize);
        const data = imgData.data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        const pixelCount = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
        }

        const avgR = totalR / pixelCount;
        const avgG = totalG / pixelCount;
        const avgB = totalB / pixelCount;

        // For center sticker (index 4), anchor to current target face center
        if (r === 1 && c === 1) {
          detected.push(currentGuide.centerColor);
        } else {
          detected.push(classifyColor(avgR, avgG, avgB));
        }
      }
    }

    return detected as any;
  };

  // Snapshot from video feed
  const captureFromVideo = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    const video = videoRef.current;
    const result = processImageToFaceState(video, video.videoWidth || 640, video.videoHeight || 480);
    setCurrentFaceResult(result);
    setIsCapturing(false);
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const result = processImageToFaceState(img, img.width, img.height);
      setCurrentFaceResult(result);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  };

  // Change single sticker color
  const handleStickerClick = (index: number) => {
    if (!currentFaceResult) return;
    if (index === 4) return; // Keep center locked to face orientation

    const nextResult = [...currentFaceResult] as CubeFaceState;
    nextResult[index] = activePaletteColor;
    setCurrentFaceResult(nextResult);
  };

  // Confirm current face and proceed to next
  const confirmCurrentFace = () => {
    if (!currentFaceResult) return;

    const updated = {
      ...scannedFaces,
      [currentGuide.face]: currentFaceResult,
    };
    setScannedFaces(updated);
    setCurrentFaceResult(null);

    if (currentStep < SCAN_SEQUENCE.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completed all 6 faces!
      stopCamera();
      onScanComplete(updated as Record<FaceName, CubeFaceState>);
    }
  };

  const retakeCurrentFace = () => {
    setCurrentFaceResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header with PWA status bar padding */}
      <div className="flex items-center justify-between px-4 pb-3 pt-safe bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
              Face {currentStep + 1} of 6
            </span>
            <h2 className="text-base font-bold text-white tracking-wide">
              {currentGuide.name}
            </h2>
          </div>
          <p className="text-[12px] text-slate-400 mt-0.5">
            {currentGuide.topOrientation}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive && (
            <button
              onClick={toggleTorch}
              className={`p-2.5 rounded-xl border transition-all ${
                torchOn ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
              title="Toggle Flashlight"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Center Camera / Review Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        {/* Live Camera Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            currentFaceResult ? 'opacity-20 blur-sm' : 'opacity-100'
          }`}
        />

        {/* Camera Error Message / Upload Fallback */}
        {cameraError && !currentFaceResult && (
          <div className="absolute inset-x-6 max-w-sm mx-auto p-5 rounded-2xl bg-slate-900/95 border border-slate-800 text-center shadow-2xl backdrop-blur-md">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-slate-300 mb-4">{cameraError}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              Upload Face Photo
            </button>
          </div>
        )}

        {/* 3x3 Overlay Viewfinder (Active during live scan) */}
        {!currentFaceResult && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* 3x3 Grid Box */}
            <div className="relative w-72 h-72 rounded-2xl border-2 border-cyan-400/80 shadow-[0_0_25px_rgba(56,189,248,0.25)] grid grid-cols-3 grid-rows-3 overflow-hidden backdrop-brightness-110">
              {Array.from({ length: 9 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-cyan-400/30 flex items-center justify-center"
                >
                  {idx === 4 && (
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-white shadow-md animate-pulse"
                      style={{ backgroundColor: COLOR_HEX[currentGuide.centerColor] }}
                    />
                  )}
                </div>
              ))}
            </div>

            <p className="mt-4 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-md">
              Align the 9 stickers inside the square
            </p>
          </div>
        )}

        {/* Review & Touch-Up Card (After snapping photo) */}
        {currentFaceResult && (
          <div className="absolute inset-x-4 max-w-md mx-auto p-5 rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between w-full mb-3">
              <span className="text-sm font-semibold text-white">Review Detected Colors</span>
              <span className="text-xs text-slate-400">Tap sticker to fix</span>
            </div>

            {/* 3x3 Interactive Sticker Face Preview */}
            <div className="w-64 h-64 p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner grid grid-cols-3 gap-2">
              {currentFaceResult.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStickerClick(idx)}
                  disabled={idx === 4}
                  className={`relative rounded-xl border-2 transition-transform active:scale-95 flex items-center justify-center shadow-md ${
                    idx === 4 ? 'border-white/90 ring-2 ring-white/40 cursor-default' : 'border-slate-800/80 hover:brightness-110'
                  }`}
                  style={{ backgroundColor: COLOR_HEX[color] }}
                >
                  {idx === 4 && (
                    <span className="text-[10px] font-black uppercase text-black bg-white/80 px-1 rounded shadow">
                      Center
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Palette Bar */}
            <div className="mt-4 w-full">
              <p className="text-[11px] text-slate-400 text-center mb-1.5">
                Active Paint Color: <span className="font-semibold text-white capitalize">{activePaletteColor}</span>
              </p>
              <div className="flex items-center justify-center gap-2">
                {PALETTE_COLORS.map((col) => (
                  <button
                    key={col}
                    onClick={() => setActivePaletteColor(col)}
                    className={`w-9 h-9 rounded-xl border-2 transition-all ${
                      activePaletteColor === col
                        ? 'border-white scale-110 shadow-lg ring-2 ring-cyan-400'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: COLOR_HEX[col] }}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full mt-5">
              <button
                onClick={retakeCurrentFace}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={confirmCurrentFace}
                className="flex-1 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/30 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {currentStep === 5 ? 'Finish Scan' : 'Confirm Face'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Capture Toolbar (Only when scanning) */}
      {!currentFaceResult && (
        <div className="px-6 py-5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-around backdrop-blur-md z-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
            title="Upload from Gallery"
          >
            <Upload className="w-5 h-5" />
          </button>

          {/* Shutter Snap Button */}
          <button
            onClick={captureFromVideo}
            disabled={!cameraActive || isCapturing}
            className="w-18 h-18 rounded-full border-4 border-white/90 bg-white/20 hover:bg-white/30 active:scale-95 transition-all p-1 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-40"
          >
            <div className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-slate-900">
              <Camera className="w-6 h-6" />
            </div>
          </button>

          <button
            onClick={startCamera}
            className="p-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
            title="Restart Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
