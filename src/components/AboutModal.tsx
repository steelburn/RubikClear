import React from 'react';
import { X, ExternalLink, Heart, Smartphone, Cpu, Box, Compass } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 overflow-hidden max-h-[90vh]">
        {/* Glow background accent */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header with App Icon and Close button */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-950/60 flex items-center justify-center shrink-0">
              <img src="/icon-192.png" alt="RubikClear" className="w-full h-full rounded-[14px] object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">RubikClear</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-slate-400">3D Rubik's Cube Solver PWA</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto pr-1 flex flex-col gap-4 text-xs text-slate-300 leading-relaxed z-10">
          <p>
            <strong>RubikClear</strong> is a modern, cross-platform Rubik's Cube solver designed to run seamlessly in browsers, Android, and iOS as an installable Progressive Web App.
          </p>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>Kociemba Solver</span>
              </div>
              <p className="text-[11px] text-slate-400">Two-Phase algorithm finding near-optimal solutions under 22 moves.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Box className="w-3.5 h-3.5" />
                <span>3D Stepped Guide</span>
              </div>
              <p className="text-[11px] text-slate-400">Visual 3D slice rotations with stepped 180° turns and animated undo.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Smartphone className="w-3.5 h-3.5" />
                <span>PWA Ready</span>
              </div>
              <p className="text-[11px] text-slate-400">Install to your home screen for full-screen offline solving.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Compass className="w-3.5 h-3.5" />
                <span>Touch & Pinch</span>
              </div>
              <p className="text-[11px] text-slate-400">Two-finger pinch-to-zoom and full 360° orbit rotation.</p>
            </div>
          </div>

          {/* GitHub Link */}
          <div className="pt-2">
            <a
              href="https://github.com/steelburn/RubikClear"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition active:scale-98 shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 fill-current text-slate-200 group-hover:text-cyan-400 transition" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">steelburn/RubikClear</span>
                  <span className="text-[11px] text-slate-400">View source code on GitHub</span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 z-10">
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
            <span>for speedcubers</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
