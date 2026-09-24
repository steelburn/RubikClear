import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FullCubeState, MoveStep, Move } from '../types/cube';
import { solveCube, applyMoveToState, cloneCubeState, invertMove } from '../solver/cubeState';
import { Cube3D } from './Cube3D';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ArrowLeft,
  Sparkles,
  Gauge
} from 'lucide-react';

interface SolveGuideProps {
  initialState: FullCubeState;
  onBack: () => void;
  onSolveAnother: () => void;
}

export const SolveGuide: React.FC<SolveGuideProps> = ({
  initialState,
  onBack,
  onSolveAnother,
}) => {
  const [steps, setSteps] = useState<MoveStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDisplayState, setCurrentDisplayState] = useState<FullCubeState>(cloneCubeState(initialState));
  const [activeAnimatingMove, setActiveAnimatingMove] = useState<Move | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 0.5x, 1x, 1.5x
  const [isCompleted, setIsCompleted] = useState(false);

  // Compute all states at each step so user can scrub freely
  const historyStatesRef = useRef<FullCubeState[]>([]);

  // Compute solution on mount
  useEffect(() => {
    try {
      const solutionMoves = solveCube(initialState);
      setSteps(solutionMoves);

      // Precalculate history states: [initial, after move 0, after move 1, ...]
      const states: FullCubeState[] = [cloneCubeState(initialState)];
      let curr = cloneCubeState(initialState);
      for (const s of solutionMoves) {
        curr = applyMoveToState(curr, s.move);
        states.push(cloneCubeState(curr));
      }
      historyStatesRef.current = states;

      if (solutionMoves.length === 0) {
        setIsCompleted(true);
        triggerCelebration();
      }
    } catch (err) {
      console.error('Failed to solve cube:', err);
    }
  }, [initialState]);

  const triggerCelebration = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');

  // Duration in ms based on playbackSpeed
  const animationDuration = Math.round(450 / playbackSpeed);

  // Forward one step with animation
  const stepForward = useCallback(() => {
    if (activeAnimatingMove !== null) return;
    if (currentStepIndex >= steps.length) {
      setIsPlaying(false);
      return;
    }
    const move = steps[currentStepIndex].move;
    setAnimationDirection('forward');
    setActiveAnimatingMove(move);
  }, [currentStepIndex, steps, activeAnimatingMove]);

  // Backward one step with reverse animation
  const stepBackward = useCallback(() => {
    if (activeAnimatingMove !== null) return;
    if (currentStepIndex <= 0) return;
    setIsPlaying(false);

    // The move that led to current step index is steps[currentStepIndex - 1]
    const moveThatWasApplied = steps[currentStepIndex - 1].move;
    const reverseMove = invertMove(moveThatWasApplied);

    setAnimationDirection('backward');
    setActiveAnimatingMove(reverseMove);
  }, [currentStepIndex, steps, activeAnimatingMove]);

  // When 3D animation ends
  const handleAnimationEnd = useCallback(() => {
    if (animationDirection === 'forward') {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      setCurrentDisplayState(cloneCubeState(historyStatesRef.current[nextIndex]));
      setActiveAnimatingMove(null);

      if (nextIndex >= steps.length) {
        setIsPlaying(false);
        setIsCompleted(true);
        triggerCelebration();
      }
    } else {
      // Backward animation finished
      const prevIndex = Math.max(0, currentStepIndex - 1);
      setCurrentStepIndex(prevIndex);
      setCurrentDisplayState(cloneCubeState(historyStatesRef.current[prevIndex]));
      setActiveAnimatingMove(null);
      setIsCompleted(false);
    }
  }, [currentStepIndex, steps.length, triggerCelebration, animationDirection]);

  // Auto-play loop
  useEffect(() => {
    if (!isPlaying) return;
    if (activeAnimatingMove) return;

    if (currentStepIndex >= steps.length) {
      setIsPlaying(false);
      setIsCompleted(true);
      triggerCelebration();
      return;
    }

    const timer = setTimeout(() => {
      stepForward();
    }, 200 / playbackSpeed);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, activeAnimatingMove, playbackSpeed, stepForward, triggerCelebration]);

  const toggleSpeed = () => {
    if (playbackSpeed === 1) setPlaybackSpeed(1.5);
    else if (playbackSpeed === 1.5) setPlaybackSpeed(0.5);
    else setPlaybackSpeed(1);
  };

  const jumpToStep = (index: number) => {
    setIsPlaying(false);
    setActiveAnimatingMove(null);
    setCurrentStepIndex(index);
    setCurrentDisplayState(cloneCubeState(historyStatesRef.current[index]));
    if (index >= steps.length) {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  };

  const currentStep = steps[currentStepIndex] || null;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar with PWA status bar padding */}
      <div className="flex items-center justify-between px-4 pb-3 pt-safe bg-slate-900/90 border-b border-slate-800 backdrop-blur-md z-20">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 text-xs font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
            {steps.length === 0 ? 'Solved' : `Step ${Math.min(currentStepIndex + 1, steps.length)} of ${steps.length}`}
          </span>
        </div>

        <button
          onClick={toggleSpeed}
          className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1 text-xs font-semibold"
          title="Toggle Animation Speed"
        >
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>{playbackSpeed}x</span>
        </button>
      </div>

      {/* Main 3D Viewport */}
      <div className="relative flex-1 w-full overflow-hidden">
        <Cube3D
          state={currentDisplayState}
          activeMove={activeAnimatingMove}
          onAnimationEnd={handleAnimationEnd}
          speed={animationDuration}
        />

        {/* Floating Reference Cue Banner */}
        <div className="absolute top-3 left-3 bg-slate-900/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-2xl pointer-events-none text-[11px] text-slate-300 shadow-lg">
          Cube Reference: <strong className="text-white">White Top</strong> • <strong className="text-emerald-400">Green Front</strong>
        </div>
      </div>

      {/* Bottom Step Guide Card & Controls */}
      <div className="w-full bg-slate-900/95 border-t border-slate-800 p-4 backdrop-blur-xl z-20 max-w-xl mx-auto rounded-t-3xl shadow-2xl flex flex-col gap-3">
        {/* Step Instruction Display */}
        {isCompleted ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-lg font-black text-white">Cube Solved!</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Congratulations! Your Rubik's cube is now completely solved.
            </p>
            <button
              onClick={onSolveAnother}
              className="mt-3 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg transition"
            >
              Solve Another Cube
            </button>
          </div>
        ) : currentStep ? (
          <div className="flex items-center gap-3">
            {/* Big Notation Badge */}
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center font-black text-2xl shadow-inner shrink-0 tracking-wider">
              {currentStep.move}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-tight">
                {currentStep.instruction}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {currentStep.tip}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-slate-400">
            Cube is in solved state.
          </div>
        )}

        {/* Progress Scrubber */}
        {steps.length > 0 && (
          <div className="w-full">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
              <span>Start</span>
              <span>{Math.round((currentStepIndex / steps.length) * 100)}%</span>
              <span>Solved</span>
            </div>
            <input
              type="range"
              min="0"
              max={steps.length}
              value={currentStepIndex}
              onChange={(e) => jumpToStep(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        )}

        {/* Playback Button Controls */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            onClick={stepBackward}
            disabled={currentStepIndex <= 0 || activeAnimatingMove !== null}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 border border-slate-700/60 shadow"
            title="Previous Move"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (currentStepIndex >= steps.length) {
                jumpToStep(0);
                setIsPlaying(true);
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            disabled={activeAnimatingMove !== null}
            className="p-4 rounded-3xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-600/30 transition active:scale-95"
            title={isPlaying ? 'Pause' : 'Play Auto-Guide'}
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
          </button>

          <button
            onClick={stepForward}
            disabled={currentStepIndex >= steps.length || activeAnimatingMove !== null}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 border border-slate-700/60 shadow"
            title="Next Move"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
