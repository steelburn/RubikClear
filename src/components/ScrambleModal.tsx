import React from 'react';
import type { FullCubeState, Move } from '../types/cube';
import { createSolvedCubeState, applyMoveToState } from '../solver/cubeState';
import { X, Shuffle, Sparkles } from 'lucide-react';

interface ScrambleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyState: (state: FullCubeState) => void;
}

interface PatternPreset {
  name: string;
  description: string;
  moves: Move[];
}

const PRESET_PATTERNS: PatternPreset[] = [
  {
    name: 'Checkerboard',
    description: 'Alternating colors on every face (X pattern)',
    moves: ['R2', 'L2', 'U2', 'D2', 'F2', 'B2'] as Move[],
  },
  {
    name: 'Superflip',
    description: 'Every corner solved, every edge flipped in place (Hardest 20-move state)',
    moves: [
      'U', 'R2', 'F', 'B', 'R', 'B2', 'R', 'U2', 'L', 'B2',
      'R', "U'", "D'", 'R2', 'F', "R'", 'L', 'B2', 'U2', 'F2'
    ] as Move[],
  },
  {
    name: 'Cube in a Cube',
    description: 'A 2x2 miniature cube nested inside the 3x3 cube',
    moves: [
      'F', 'L', 'F', "U'", 'R', 'U', 'F2', 'L2', "U'", "L'",
      'B', "D'", "B'", 'L2', 'U'
    ] as Move[],
  },
  {
    name: 'Anaconda',
    description: 'A continuous winding snake pattern around the cube',
    moves: [
      'L', 'U', "B'", "U'", 'R', "L'", 'B', "R'", 'F', "B'",
      'D', 'R', "D'", "F'"
    ] as Move[],
  },
];

const RANDOM_MOVES: Move[] = [
  'U', "U'", 'U2', 'D', "D'", 'D2',
  'R', "R'", 'R2', 'L', "L'", 'L2',
  'F', "F'", 'F2', 'B', "B'", 'B2'
];

function generateRandomScramble(moveCount: number = 20): Move[] {
  const result: Move[] = [];
  let lastFace = '';

  for (let i = 0; i < moveCount; i++) {
    let candidate: Move;
    do {
      candidate = RANDOM_MOVES[Math.floor(Math.random() * RANDOM_MOVES.length)];
    } while (candidate[0] === lastFace);

    result.push(candidate);
    lastFace = candidate[0];
  }

  return result;
}

export const ScrambleModal: React.FC<ScrambleModalProps> = ({
  isOpen,
  onClose,
  onApplyState,
}) => {
  if (!isOpen) return null;

  const handleApplyMoves = (moves: Move[]) => {
    let state = createSolvedCubeState();
    for (const m of moves) {
      state = applyMoveToState(state, m);
    }
    onApplyState(state);
    onClose();
  };

  const handleRandomScramble = () => {
    const scramble = generateRandomScramble(20);
    handleApplyMoves(scramble);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
              <Shuffle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scramble & Presets</h3>
              <p className="text-xs text-slate-400">Generate scrambles or test famous patterns</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Random Scramble Button */}
        <button
          onClick={handleRandomScramble}
          className="w-full py-3.5 px-4 mb-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition active:scale-98"
        >
          <Shuffle className="w-4 h-4" />
          <span>Generate Random 20-Move Scramble</span>
        </button>

        <div className="space-y-2 mb-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Famous Cube Patterns
          </p>

          {PRESET_PATTERNS.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyMoves(p.moves)}
              className="w-full p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center justify-between group active:scale-98"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-200 group-hover:text-cyan-400 transition">
                  {p.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{p.description}</p>
              </div>
              <Sparkles className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
