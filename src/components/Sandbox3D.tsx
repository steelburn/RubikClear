import React, { useState } from 'react';
import type { FullCubeState, Move, FaceName } from '../types/cube';
import { applyMoveToState, createSolvedCubeState } from '../solver/cubeState';
import { Cube3D } from './Cube3D';
import { ArrowLeft, RotateCcw, Wand2, Shuffle } from 'lucide-react';

interface Sandbox3DProps {
  state: FullCubeState;
  onChange: (state: FullCubeState) => void;
  onSolve: () => void;
  onBack: () => void;
  onOpenScramble: () => void;
}

const FACES: FaceName[] = ['U', 'L', 'F', 'R', 'B', 'D'];

export const Sandbox3D: React.FC<Sandbox3DProps> = ({
  state,
  onChange,
  onSolve,
  onBack,
  onOpenScramble,
}) => {
  const [activeMove, setActiveMove] = useState<Move | null>(null);

  const handleMove = (m: Move) => {
    if (activeMove) return;
    setActiveMove(m);
  };

  const handleAnimationEnd = () => {
    if (!activeMove) return;
    const nextState = applyMoveToState(state, activeMove);
    onChange(nextState);
    setActiveMove(null);
  };

  const handleReset = () => {
    onChange(createSolvedCubeState());
    setActiveMove(null);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar with PWA status bar padding */}
      <div className="flex items-center justify-between px-4 pb-3 pt-safe bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-20">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Editor</span>
        </button>

        <h2 className="text-sm font-bold text-white tracking-wide">3D Interactive Cube</h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenScramble}
            title="Scramble / Presets"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            title="Reset to Solved"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative flex-1 w-full overflow-hidden">
        <Cube3D
          state={state}
          activeMove={activeMove}
          onAnimationEnd={handleAnimationEnd}
          speed={280}
        />
      </div>

      {/* Manual Turn Controls & Solve Button Bar */}
      <div className="w-full bg-slate-900/90 border-t border-slate-800 p-4 backdrop-blur-xl z-20 max-w-xl mx-auto rounded-t-3xl shadow-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Manual Slice Controls</span>
          <span className="text-[11px] text-slate-500">Clockwise / Counter-Clockwise</span>
        </div>

        {/* Buttons grid for U, L, F, R, B, D */}
        <div className="grid grid-cols-6 gap-1.5">
          {FACES.map((face) => (
            <div key={face} className="flex flex-col gap-1">
              <button
                onClick={() => handleMove(face as Move)}
                disabled={activeMove !== null}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700/80 transition active:scale-95 disabled:opacity-50"
              >
                {face}
              </button>
              <button
                onClick={() => handleMove(`${face}'` as Move)}
                disabled={activeMove !== null}
                className="py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 font-semibold text-xs border border-slate-800 transition active:scale-95 disabled:opacity-50"
              >
                {face}'
              </button>
              <button
                onClick={() => handleMove(`${face}2` as Move)}
                disabled={activeMove !== null}
                className="py-1.5 rounded-xl bg-slate-800/40 hover:bg-slate-700 text-amber-400 font-semibold text-[11px] border border-slate-800 transition active:scale-95 disabled:opacity-50"
              >
                {face}2
              </button>
            </div>
          ))}
        </div>

        {/* Big Solve Button */}
        <button
          onClick={onSolve}
          className="w-full mt-1 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Wand2 className="w-4 h-4" />
          <span>Solve this Cube with Visual Guide</span>
        </button>
      </div>
    </div>
  );
};
