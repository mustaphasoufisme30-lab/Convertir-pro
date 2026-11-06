import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MainPdfToPkfConverter } from './components/MainPdfToPkfConverter';
import { PkfInspectorView } from './components/PkfInspectorView';
import { StorageManagerView } from './components/StorageManagerView';
import { EducationalGuide } from './components/EducationalGuide';
import { PremiumLockScreen } from './components/PremiumLockScreen';
import { ParsedPdfDocument } from './types/converter';
import { getSamplePdfDocument } from './utils/pdfParser';
import { UploadCloud, HardDrive, Phone, Sparkles } from 'lucide-react';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentTab, setCurrentTab] = useState<'convert' | 'inspect' | 'storage' | 'guide'>('convert');
  const [currentDoc, setCurrentDoc] = useState<ParsedPdfDocument | null>(null);
  const [fileToInspect, setFileToInspect] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [isWindowDragActive, setIsWindowDragActive] = useState(false);
  const windowDragCounter = useRef(0);

  // Initialize with sample document on first mount
  useEffect(() => {
    const sample = getSamplePdfDocument('audio-spec');
    setCurrentDoc(sample);
  }, []);

  // Sync dark class on document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Global window drag-and-drop listener
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      windowDragCounter.current += 1;
      if (e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsWindowDragActive(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      windowDragCounter.current -= 1;
      if (windowDragCounter.current <= 0) {
        windowDragCounter.current = 0;
        setIsWindowDragActive(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      windowDragCounter.current = 0;
      setIsWindowDragActive(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.name.toLowerCase().endsWith('.kpf') || file.name.toLowerCase().endsWith('.pkf')) {
          const arrayBuffer = await file.arrayBuffer();
          setFileToInspect({ name: file.name, bytes: new Uint8Array(arrayBuffer) });
          setCurrentTab('inspect');
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [lang]);

  const handleInspectStoredFile = (file: { name: string; bytes: Uint8Array }) => {
    setFileToInspect(file);
    setCurrentTab('inspect');
  };

  const handleReturnHomeInApp = () => {
    setCurrentTab('convert');
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  if (!isUnlocked) {
    return <PremiumLockScreen onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors ${isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'}`}>
      
      {/* Full-Screen Window Drag & Drop Overlay */}
      {isWindowDragActive && (
        <div className="fixed inset-0 z-[100] bg-neutral-950/85 backdrop-blur-md border-4 border-dashed border-cyan-400 flex flex-col items-center justify-center p-6 pointer-events-none animate-fade-in select-none">
          <div className="w-20 h-20 rounded-3xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-400 mb-4 animate-bounce">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {lang === 'fr' ? 'Déposez votre fichier PDF ici' : 'Drop your PDF file here'}
          </h3>
          <p className="text-sm text-cyan-200 mt-2">
            {lang === 'fr' 
              ? 'Relâchez n’importe où pour convertir en format Amazon Kindle (.KPF)' 
              : 'Release anywhere to convert into Amazon Kindle (.KPF) format'}
          </p>
        </div>
      )}

      {/* Header: Convertisseur Mahfoud Mustapha with logo */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'convert') {
            handleReturnHomeInApp();
          }
        }}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        lang={lang}
        onToggleLang={() => setLang(lang === 'fr' ? 'en' : 'fr')}
        onLoadSample={() => {
          const sample = getSamplePdfDocument('audit');
          setCurrentDoc(sample);
          setCurrentTab('convert');
        }}
      />

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow space-y-8">
        
        {/* Navigation Tab Bar */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-xl text-xs shadow-inner">
            <button
              onClick={() => {
                setCurrentTab('convert');
                handleReturnHomeInApp();
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentTab === 'convert'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {lang === 'fr' ? '1. Convertir PDF to KPF' : '1. Convert PDF to KPF'}
            </button>
            <button
              onClick={() => setCurrentTab('storage')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'storage'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{lang === 'fr' ? '2. Espace Stockage' : '2. Storage Space'}</span>
            </button>
            <button
              onClick={() => setCurrentTab('inspect')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentTab === 'inspect'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {lang === 'fr' ? '3. Inspecteur .KPF' : '3. Inspect .KPF'}
            </button>
            <button
              onClick={() => setCurrentTab('guide')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                currentTab === 'guide'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {lang === 'fr' ? '4. Guide Kindle KPF' : '4. Guide Kindle KPF'}
            </button>
          </div>
        </div>

        {/* Tab 1: Primary Requested Conversion Workflow */}
        {currentTab === 'convert' && (
          <MainPdfToPkfConverter
            lang={lang}
            onNavigateToStorage={() => setCurrentTab('storage')}
            onNavigateToInspect={(file) => {
              setFileToInspect(file);
              setCurrentTab('inspect');
            }}
            onReturnHome={handleReturnHomeInApp}
          />
        )}

        {/* Tab 2: Storage View */}
        {currentTab === 'storage' && (
          <StorageManagerView
            onInspectFile={handleInspectStoredFile}
            lang={lang}
          />
        )}

        {/* Tab 3: PKF Inspector View */}
        {currentTab === 'inspect' && (
          <PkfInspectorView
            currentDoc={currentDoc}
            initialFileToInspect={fileToInspect}
            lang={lang}
          />
        )}

        {/* Tab 4: Technical Guide */}
        {currentTab === 'guide' && (
          <EducationalGuide
            lang={lang}
          />
        )}
      </main>

      {/* Footer: Exactly as requested by user */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-6 text-neutral-400 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          
          {/* copyright@2026 Mahfoud */}
          <div className="font-medium text-neutral-300">
            copyright@2026 Mahfoud
          </div>

          {/* tél : 0635230749 */}
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
}
