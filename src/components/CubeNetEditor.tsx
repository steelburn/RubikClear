import React, { useState } from 'react';
import type { CubeColor, FaceName, FullCubeState, ValidationResult } from '../types/cube';
import { COLOR_HEX, COLOR_DISPLAY_NAMES } from '../types/cube';
import { getColorCounts, validateCubeState, createSolvedCubeState } from '../solver/cubeState';
import { Camera, CheckCircle2, AlertTriangle, Wand2, RotateCcw, Shuffle } from 'lucide-react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface CubeNetEditorProps {
  state: FullCubeState;
  onChange: (newState: FullCubeState) => void;
  onStartSolving: () => void;
  onOpenScanner: () => void;
  onOpenScrambler: () => void;
  onOpenAbout?: () => void;
}

const PALETTE: CubeColor[] = ['white', 'yellow', 'green', 'blue', 'red', 'orange'];

const FACE_LAYOUT: { face: FaceName; name: string; row: number; col: number }[] = [
  { face: 'U', name: 'Up', row: 0, col: 1 },
  { face: 'L', name: 'Left', row: 1, col: 0 },
  { face: 'F', name: 'Front', row: 1, col: 1 },
  { face: 'R', name: 'Right', row: 1, col: 2 },
  { face: 'B', name: 'Back', row: 1, col: 3 },
  { face: 'D', name: 'Down', row: 2, col: 1 },
];

export const CubeNetEditor: React.FC<CubeNetEditorProps> = ({
  state,
  onChange,
  onStartSolving,
  onOpenScanner,
  onOpenScrambler,
  onOpenAbout,
}) => {
  const [selectedColor, setSelectedColor] = useState<CubeColor>('white');
  const counts = getColorCounts(state);
  const validation: ValidationResult = validateCubeState(state);

  const handleCellClick = (face: FaceName, index: number) => {
    if (index === 4) return; // Keep centers fixed to avoid confusing coordinate system
    const nextFaceState = [...state[face]] as any;
    nextFaceState[index] = selectedColor;

    onChange({
      ...state,
      [face]: nextFaceState,
    });
  };

  const handleReset = () => {
    onChange(createSolvedCubeState());
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top App Bar with PWA Safe Area buffer */}
      <header className="w-full bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl pt-safe px-4 pb-3 z-30 shrink-0">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {/* Brand branding - clickable to open About modal */}
          <button
            onClick={onOpenAbout}
            className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-90 transition active:scale-98 group cursor-pointer"
            title="About RubikClear"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-950 shrink-0 flex items-center justify-center group-hover:ring-2 group-hover:ring-cyan-400/50 transition">
              <img src="/icon-192.png" alt="RubikClear" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-white tracking-tight group-hover:text-cyan-300 transition">RubikClear</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/80">
                  3D AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Tap stickers to paint or snap faces</p>
            </div>
          </button>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onOpenScrambler}
              title="Preset Patterns / Scramble"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95 shadow-sm"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset to Solved"
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenScanner}
              className="px-3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Faces</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 max-w-xl mx-auto w-full flex flex-col justify-between">
        {/* Optional PWA Install Prompt Banner */}
        <PWAInstallPrompt />

        {/* Color Sticker Count Badges */}
        <div className="grid grid-cols-6 gap-1.5 mb-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80 backdrop-blur-sm shrink-0">
          {PALETTE.map((col) => {
            const isComplete = counts[col] === 9;
            return (
              <div
                key={col}
                onClick={() => setSelectedColor(col)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl cursor-pointer transition-all border ${
                  selectedColor === col
                    ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/50 scale-105'
                    : 'border-transparent hover:bg-slate-800/50'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-md shadow-sm border border-black/40 mb-1"
                  style={{ backgroundColor: COLOR_HEX[col] }}
                />
                <span
                  className={`text-[11px] font-bold ${
                    isComplete ? 'text-emerald-400' : counts[col] > 9 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {counts[col]}/9
                </span>
              </div>
            );
          })}
        </div>

        {/* 2D Unfolded Cube Net */}
        <div className="flex-1 flex flex-col items-center justify-center my-1">
          <div className="grid grid-cols-4 grid-rows-3 gap-2 p-3 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
            {FACE_LAYOUT.map(({ face, name, row, col }) => {
              const faceState = state[face];
              return (
                <div
                  key={face}
                  className="flex flex-col items-center"
                  style={{
                    gridRowStart: row + 1,
                    gridColumnStart: col + 1,
                  }}
                >
                  <span className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">
                    {name} ({face})
                  </span>

                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800/80 shadow-inner">
                    {faceState.map((stickerColor, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCellClick(face, idx)}
                        disabled={idx === 4}
                        title={`${name} #${idx + 1}: ${COLOR_DISPLAY_NAMES[stickerColor]}`}
                        className={`w-7 h-7 sm:w-9 sm:h-9 rounded-md transition-all flex items-center justify-center shadow-sm ${
                          idx === 4
                            ? 'border border-white/90 ring-1 ring-white/50 cursor-default font-black text-[10px] text-black drop-shadow'
                            : 'border border-black/30 hover:scale-105 active:scale-95'
                        }`}
                        style={{ backgroundColor: COLOR_HEX[stickerColor] }}
                      >
                        {idx === 4 && face}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Paint Palette Selector */}
        <div className="mt-2 flex items-center justify-between px-3 py-2 bg-slate-900/60 rounded-2xl border border-slate-800 shrink-0">
          <span className="text-xs text-slate-400">
            Paint: <strong className="text-white capitalize">{selectedColor}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            {PALETTE.map((col) => (
              <button
                key={col}
                onClick={() => setSelectedColor(col)}
                className={`w-7 h-7 rounded-lg border transition-all ${
                  selectedColor === col ? 'border-white scale-110 shadow ring-2 ring-cyan-400' : 'border-slate-800 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: COLOR_HEX[col] }}
              />
            ))}
          </div>
        </div>

        {/* Validation Status & Solve Button */}
        <div className="mt-3 pt-1 shrink-0 pb-1">
          {validation.valid ? (
            <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cube configuration is valid! Ready for 3D visual step-by-step solve.</span>
            </div>
          ) : (
            <div className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs mb-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Please adjust the cube:</span>
              </div>
              {validation.errors.slice(0, 3).map((err, i) => (
                <p key={i} className="text-slate-300 pl-5 list-disc text-[11px]">
                  • {err}
                </p>
              ))}
            </div>
          )}

          <button
            onClick={onStartSolving}
            disabled={!validation.valid}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              validation.valid
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Solve Cube in 3D</span>
          </button>
        </div>
      </div>
    </div>
  );
};
