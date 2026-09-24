import React, { useState } from 'react';
import type { FullCubeState, FaceName, CubeFaceState } from './types/cube';
import { createSolvedCubeState, applyMoveToState, validateCubeState } from './solver/cubeState';
import { CubeNetEditor } from './components/CubeNetEditor';
import { SolveGuide } from './components/SolveGuide';
import { Scanner } from './components/Scanner';
import { Sandbox3D } from './components/Sandbox3D';
import { ScrambleModal } from './components/ScrambleModal';
import { AboutModal } from './components/AboutModal';
import { Camera, LayoutGrid, Box, Wand2 } from 'lucide-react';

type AppTab = 'editor' | 'sandbox' | 'guide';

export const App: React.FC = () => {
  // Start with a fun sample scramble so users can immediately test solving
  const [cubeState, setCubeState] = useState<FullCubeState>(() => {
    let s = createSolvedCubeState();
    // A quick sample scramble (F R U B L D)
    const initialMoves = ['R', 'U', "R'", "U'", 'F', "U'", "F'"];
    for (const m of initialMoves) {
      s = applyMoveToState(s, m as any);
    }
    return s;
  });

  const [currentTab, setCurrentTab] = useState<AppTab>('editor');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isScrambleOpen, setIsScrambleOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const validation = validateCubeState(cubeState);

  // Handle results from camera scanner
  const handleScanComplete = (scannedFaces: Record<FaceName, CubeFaceState>) => {
    setCubeState({
      U: scannedFaces.U,
      R: scannedFaces.R,
      F: scannedFaces.F,
      D: scannedFaces.D,
      L: scannedFaces.L,
      B: scannedFaces.B,
    });
    setIsScannerOpen(false);
    setCurrentTab('editor');
  };

  const handleStartSolving = () => {
    if (!validation.valid) return;
    setCurrentTab('guide');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-hidden">
      {/* Active Tab Screen */}
      <main className="flex-1 w-full h-full overflow-hidden relative">
        {currentTab === 'editor' && (
          <CubeNetEditor
            state={cubeState}
            onChange={setCubeState}
            onStartSolving={handleStartSolving}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenScrambler={() => setIsScrambleOpen(true)}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        )}

        {currentTab === 'sandbox' && (
          <Sandbox3D
            state={cubeState}
            onChange={setCubeState}
            onSolve={handleStartSolving}
            onBack={() => setCurrentTab('editor')}
            onOpenScramble={() => setIsScrambleOpen(true)}
          />
        )}

        {currentTab === 'guide' && (
          <SolveGuide
            initialState={cubeState}
            onBack={() => setCurrentTab('editor')}
            onSolveAnother={() => {
              setCubeState(createSolvedCubeState());
              setCurrentTab('editor');
            }}
          />
        )}
      </main>

      {/* Persistent Bottom Mobile Navigation Tab Bar (Hidden during full-screen solve guide to maximize 3D view) */}
      {currentTab !== 'guide' && (
        <nav className="w-full bg-slate-900/95 border-t border-slate-800 px-4 py-2 backdrop-blur-xl flex items-center justify-around z-30 safe-area-inset">
          <button
            onClick={() => setCurrentTab('editor')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              currentTab === 'editor' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[11px]">Net Editor</span>
          </button>

          {/* Quick Camera Snap Action */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-4 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-600/30 transition-all active:scale-95 shadow-lg shadow-cyan-950"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[11px] font-bold">Snap Faces</span>
          </button>

          <button
            onClick={() => setCurrentTab('sandbox')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              currentTab === 'sandbox' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-5 h-5" />
            <span className="text-[11px]">3D Sandbox</span>
          </button>

          <button
            onClick={handleStartSolving}
            disabled={!validation.valid}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
              validation.valid
                ? 'text-cyan-400 hover:text-cyan-300 font-bold'
                : 'text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <Wand2 className="w-5 h-5" />
            <span className="text-[11px]">Solve Guide</span>
          </button>
        </nav>
      )}

      {/* Full-Screen Camera Scanner Modal */}
      {isScannerOpen && (
        <Scanner
          onScanComplete={handleScanComplete}
          onCancel={() => setIsScannerOpen(false)}
        />
      )}

      {/* Scramble & Presets Modal */}
      <ScrambleModal
        isOpen={isScrambleOpen}
        onClose={() => setIsScrambleOpen(false)}
        onApplyState={(newState) => setCubeState(newState)}
      />

      {/* About Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};

export default App;
