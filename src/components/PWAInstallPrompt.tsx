import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode (already installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if user previously dismissed today
    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedTime && Date.now() - parseInt(dismissedTime, 10) < 24 * 60 * 60 * 1000) {
      setIsDismissed(true);
      return;
    }

    // Android & Chrome: beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS Detection: iPhone/iPad on Safari and not standalone
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS && isSafari && !isStandalone) {
      setShowIOSPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowIOSPrompt(false);
    setDeferredPrompt(null);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isDismissed) return null;

  // Android / Desktop Install Banner
  if (deferredPrompt) {
    return (
      <div className="relative w-full mb-3 bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-3 shadow-xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/icon-192.png" alt="App Icon" className="w-9 h-9 rounded-xl shrink-0 shadow border border-slate-700" />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">Install RubikClear App</h4>
            <p className="text-[11px] text-slate-400 truncate">Run offline & fullscreen on your device</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95 flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari Install Instructions
  if (showIOSPrompt) {
    return (
      <div className="relative w-full mb-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-xl flex flex-col gap-2 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/apple-touch-icon.png" alt="App Icon" className="w-8 h-8 rounded-lg shadow" />
            <h4 className="text-xs font-bold text-white">Add RubikClear to Home Screen</h4>
          </div>
          <button onClick={handleDismiss} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          Install as an iPhone app: Tap the <Share className="inline w-3.5 h-3.5 text-cyan-400 mx-0.5" /> <strong>Share</strong> button, then scroll down and tap <PlusSquare className="inline w-3.5 h-3.5 text-cyan-400 mx-0.5" /> <strong>Add to Home Screen</strong>.
        </p>
      </div>
    );
  }

  return null;
};
