import React from 'react';
import { FileCode2, Sun, Moon, Sparkles, BookOpen, Search, ShieldCheck, HardDrive } from 'lucide-react';

interface HeaderProps {
  currentTab: 'convert' | 'inspect' | 'storage' | 'guide';
  onSelectTab: (tab: 'convert' | 'inspect' | 'storage' | 'guide') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  lang: 'fr' | 'en';
  onToggleLang: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  lang,
  onToggleLang,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark with Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-indigo-500 p-[1.5px] shadow-md shadow-cyan-950/50">
            <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18V6l3.5 7L10 6v12" />
                <path d="M14 18V6l3.5 7L21 6v12" />
              </svg>
            </div>
          </div>
          <button 
            onClick={() => onSelectTab('convert')}
            className="text-left flex flex-col justify-center"
          >
            <span className="font-bold text-base sm:text-lg tracking-tight text-neutral-100 hover:text-cyan-400 transition-colors whitespace-nowrap">
              Convertisseur Mahfoud Mustapha
            </span>
            <span className="text-[10px] font-mono text-cyan-400/90 tracking-wider uppercase font-medium">
              PDF to KPF Kindle Studio
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => onSelectTab('convert')}
            className={`transition-colors whitespace-nowrap pb-0.5 ${
              currentTab === 'convert' 
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' 
                : 'hover:text-neutral-200'
            }`}
          >
            {lang === 'fr' ? 'Convertisseur PDF to KPF' : 'PDF to KPF Converter'}
          </button>

          <button
            onClick={() => onSelectTab('inspect')}
            className={`transition-colors whitespace-nowrap pb-0.5 flex items-center gap-1.5 ${
              currentTab === 'inspect' 
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' 
                : 'hover:text-neutral-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            {lang === 'fr' ? 'Inspecteur .KPF' : '.KPF Inspector'}
          </button>

          <button
            onClick={() => onSelectTab('storage')}
            className={`transition-colors whitespace-nowrap pb-0.5 flex items-center gap-1.5 ${
              currentTab === 'storage' 
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' 
                : 'hover:text-neutral-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{lang === 'fr' ? 'Stockage / Storage' : 'Storage'}</span>
          </button>

          <button
            onClick={() => onSelectTab('guide')}
            className={`transition-colors whitespace-nowrap pb-0.5 flex items-center gap-1.5 ${
              currentTab === 'guide' 
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold' 
                : 'hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            {lang === 'fr' ? 'Guide Kindle KPF' : 'Kindle KPF Guide'}
          </button>
        </nav>

        {/* Zone 3: Controls and Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onLoadSample}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700/80 rounded-md border border-neutral-700/70 transition-colors whitespace-nowrap"
            title={lang === 'fr' ? 'Charger un fichier PDF exemple' : 'Load sample PDF file'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'fr' ? 'Exemple PDF' : 'Sample PDF'}</span>
          </button>

          <button
            onClick={onToggleLang}
            className="px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700 rounded-md border border-neutral-700/60 transition-colors whitespace-nowrap"
            title="Changer de langue / Switch language"
          >
            {lang.toUpperCase()}
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
            title={isDark ? 'Mode clair' : 'Dark mode'}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
