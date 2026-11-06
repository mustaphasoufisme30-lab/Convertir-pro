import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  UploadCloud, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Info,
  BookOpen,
  Book,
  Tablet,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  Music,
  Archive
} from 'lucide-react';
import { ParsedPdfDocument } from '../types/converter';
import { inspectKindleKpf, KpfInspectionResult as KindleKpfResult } from '../utils/kpfInspector';
import { inspectPkfFile } from '../utils/pkfInspector';
import { generateKindleKpf } from '../utils/kpfGenerator';

interface PkfInspectorViewProps {
  currentDoc: ParsedPdfDocument | null;
  initialFileToInspect?: { name: string; bytes: Uint8Array } | null;
  lang: 'fr' | 'en';
}

export const PkfInspectorView: React.FC<PkfInspectorViewProps> = ({ 
  currentDoc, 
  initialFileToInspect,
  lang 
}) => {
  const [kpfResult, setKpfResult] = useState<KindleKpfResult | null>(null);
  const [legacyPkfResult, setLegacyPkfResult] = useState<any | null>(null);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeFile = async (name: string, bytes: Uint8Array) => {
    if (name.toLowerCase().endsWith('.kpf') || !name.toLowerCase().endsWith('.pkf')) {
      const res = await inspectKindleKpf(bytes, name);
      setKpfResult(res);
      setLegacyPkfResult(null);
      setActiveChapterIndex(0);
    } else {
      const legacy = inspectPkfFile(name, bytes);
      setLegacyPkfResult(legacy);
      setKpfResult(null);
    }
  };

  useEffect(() => {
    if (initialFileToInspect) {
      analyzeFile(initialFileToInspect.name, initialFileToInspect.bytes);
    }
  }, [initialFileToInspect]);

  const handleFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    await analyzeFile(file.name, bytes);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Inspect generated Kindle KPF sample
  const inspectSampleKindleKpf = async () => {
    if (!currentDoc) return;
    const res = await generateKindleKpf(currentDoc, {
      title: currentDoc.metadata.title || "Livre_Kindle_Exemple",
      author: "Mahfoud Mustapha",
      publisher: "Convertisseur Mahfoud Mustapha"
    });
    await analyzeFile(res.fileName, res.bytes);
  };

  return (
    <div className="space-y-6">
      {/* Intro explanation banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-start gap-3.5">
        <Search className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-300 space-y-1">
          <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
            <span>{lang === 'fr' ? 'Inspecteur & Simulateur de Fichiers .KPF (Kindle)' : 'Kindle .KPF File Inspector & Reader'}</span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-semibold">
              Amazon KDP
            </span>
          </h3>
          <p className="text-neutral-400 leading-relaxed">
            {lang === 'fr'
              ? 'Déposez votre fichier .KPF (Kindle Package Format) ci-dessous pour inspecter son manifeste book.json, vérifier la conformité Amazon KDP, et feuilleter ses chapitres dans le simulateur liseuse.'
              : 'Drop your .KPF (Kindle Package Format) file below to inspect its book.json manifest, verify KDP compliance, and read chapters in the e-reader simulator.'}
          </p>
        </div>
      </div>

      {/* Drop zone for .kpf and .pkf */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-950/30'
            : 'border-neutral-700/80 hover:border-neutral-600 bg-neutral-900/60 hover:bg-neutral-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".kpf,.KPF,.pkf,.PKF"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-neutral-200">
            {lang === 'fr' ? 'Déposez votre fichier .KPF (Kindle) à inspecter' : 'Drop your Kindle .KPF file to inspect'}
          </p>
          <p className="text-xs text-neutral-400">
            {lang === 'fr' 
              ? 'Compatible Amazon Kindle Package (.kpf) et archives de livres électroniques' 
              : 'Compatible with Amazon Kindle Package (.kpf) and eBook archives'}
          </p>
        </div>
      </div>

      {/* Quick Test Samples */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
        <span className="text-neutral-400 font-medium">
          {lang === 'fr' ? 'Tester avec un exemple de fichier :' : 'Test with a sample file:'}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={inspectSampleKindleKpf}
            className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-300" />
            <span>📖 Exemple Livre Kindle (.KPF)</span>
          </button>
        </div>
      </div>

      {/* KPF Inspection Results */}
      {kpfResult && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6 animate-fade-in shadow-xl">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                <span>{kpfResult.fileName}</span>
                <span>·</span>
                <span className="text-cyan-400">{(kpfResult.fileSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
              <h3 className="text-lg font-bold text-neutral-100 mt-1 flex items-center gap-2">
                <Tablet className="w-5 h-5 text-amber-400" />
                <span>{kpfResult.title}</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Auteur : <strong className="text-neutral-200">{kpfResult.author}</strong> · Éditeur : {kpfResult.publisher}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>KDP Ready</span>
              </span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div className="text-neutral-500">Chapitres / Pages</div>
              <div className="text-neutral-100 font-bold text-sm mt-0.5">{kpfResult.totalChapters}</div>
            </div>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div className="text-neutral-500">Total de mots</div>
              <div className="text-cyan-400 font-bold text-sm mt-0.5">{kpfResult.totalWords.toLocaleString()}</div>
            </div>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div className="text-neutral-500">Mise en page</div>
              <div className="text-neutral-100 font-bold text-sm mt-0.5 capitalize">{kpfResult.layout}</div>
            </div>
            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800">
              <div className="text-neutral-500">Format cible</div>
              <div className="text-amber-300 font-bold text-sm mt-0.5">Amazon Kindle</div>
            </div>
          </div>

          {/* Compatibility Badges */}
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-2.5">
            <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compatibilité Appareils & Services Amazon</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-300">
              <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kindle Direct Publishing (KDP)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Liseuses (Paperwhite, Scribe, Oasis)</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-neutral-900 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>App Kindle (iPhone, iPad, Android)</span>
              </div>
            </div>
          </div>

          {/* Interactive Kindle Reader View */}
          {kpfResult.chapters.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <span>Simulateur Liseuse Kindle (Bookerly Font)</span>
                </h4>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    disabled={activeChapterIndex <= 0}
                    onClick={() => setActiveChapterIndex(p => Math.max(0, p - 1))}
                    className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-neutral-400">
                    Chapitre {activeChapterIndex + 1} / {kpfResult.chapters.length}
                  </span>
                  <button
                    disabled={activeChapterIndex >= kpfResult.chapters.length - 1}
                    onClick={() => setActiveChapterIndex(p => Math.min(kpfResult.chapters.length - 1, p + 1))}
                    className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-neutral-200 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Kindle Reader Screen */}
              <div className="bg-[#fbfbf9] text-[#111111] rounded-xl p-6 sm:p-8 font-serif border border-neutral-300 shadow-inner max-h-80 overflow-y-auto leading-relaxed">
                <div className="text-[11px] font-sans uppercase tracking-widest text-neutral-400 border-b border-neutral-200 pb-2 mb-4 text-center">
                  {kpfResult.chapters[activeChapterIndex]?.title || `Chapitre ${activeChapterIndex + 1}`} · {kpfResult.chapters[activeChapterIndex]?.wordCount} mots
                </div>
                <div 
                  className="text-sm text-justify space-y-3 kindle-preview"
                  dangerouslySetInnerHTML={{ 
                    __html: kpfResult.chapters[activeChapterIndex]?.htmlContent || "<p>Aucun texte disponible.</p>" 
                  }}
                />
              </div>
            </div>
          )}

          {/* Diagnostic Note */}
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-cyan-200">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300 font-semibold">Validation KPF : </strong>
              <span>{kpfResult.diagnosticAdvice}</span>
            </div>
          </div>

        </div>
      )}

      {/* Legacy PKF View (if legacy file dropped) */}
      {legacyPkfResult && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-neutral-200 font-bold text-sm">
            <Music className="w-5 h-5 text-cyan-400" />
            <span>Fichier audio ou paquet .PKF détecté ({legacyPkfResult.formatName})</span>
          </div>
          <p className="text-xs text-neutral-400">{legacyPkfResult.description}</p>
        </div>
      )}

    </div>
  );
};
