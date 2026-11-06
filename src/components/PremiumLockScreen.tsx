import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShoppingCart, Sparkles, AlertCircle, Phone } from 'lucide-react';

interface PremiumLockScreenProps {
  onUnlock: () => void;
}

export const PremiumLockScreen: React.FC<PremiumLockScreenProps> = ({ onUnlock }) => {
  const [accessCode, setAccessCode] = useState('');
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim() === 'KPF-2026') {
      setHasError(false);
      onUnlock();
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      {/* Top Header Branding */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-white/10">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                Convertisseur <span className="text-cyan-400">Mahfoud Mustapha</span>
              </h1>
              <p className="text-[11px] text-neutral-400 font-mono">
                PDF to KPF (Kindle & Amazon KDP)
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Édition Premium</span>
          </span>
        </div>
      </header>

      {/* Main Lock Card */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 space-y-6 animate-fade-in">
          
          {/* Lock Icon & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/40 mx-auto flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Accès Premium
              </h2>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Entre ton code d'accès pour débloquer le convertisseur
              </p>
            </div>
          </div>

          {/* Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <KeyRound className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    if (hasError) setHasError(false);
                  }}
                  placeholder="Entrez votre code d'accès..."
                  className={`w-full bg-neutral-950 border ${
                    hasError ? 'border-red-500 focus:border-red-500' : 'border-neutral-700 focus:border-cyan-500'
                  } rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-colors`}
                  autoFocus
                />
              </div>

              {/* Error Message in Red */}
              {hasError && (
                <div className="flex items-center gap-2 text-red-500 bg-red-950/40 border border-red-500/40 rounded-lg px-3.5 py-2.5 text-xs font-bold animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>Code incorrect, achète l'accès sur Payhip</span>
                </div>
              )}
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-600 via-teal-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950/60 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Débloquer</span>
            </button>
          </form>

          {/* Divider & Buy Access Button */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col items-center gap-3">
            <p className="text-xs text-neutral-400 text-center">
              Vous n'avez pas encore votre code d'accès ?
            </p>
            <a
              href="https://mahfoud.xyz/b/8cbQk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Acheter l'accès - 5$</span>
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="font-medium text-neutral-300">
            copyright@2026 Mahfoud
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-neutral-400">tél :</span>
            <a 
              href="tel:0635230749" 
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>0635230749</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
