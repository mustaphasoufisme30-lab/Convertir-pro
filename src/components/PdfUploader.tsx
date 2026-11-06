import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, FileCode, FolderOpen } from 'lucide-react';
import { ParsedPdfDocument, ConversionProgress } from '../types/converter';

interface PdfUploaderProps {
  currentDoc: ParsedPdfDocument | null;
  onPdfLoaded: (doc: ParsedPdfDocument) => void;
  onPkfFileDropped: (file: File) => void;
  onSelectSample: (sampleId: 'audit' | 'audio-spec' | 'legal') => void;
  onProgressUpdate: (progress: ConversionProgress | null) => void;
  isLoading: boolean;
  lang: 'fr' | 'en';
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  currentDoc,
  onPdfLoaded,
  onPkfFileDropped,
  onSelectSample,
  onProgressUpdate,
  isLoading,
  lang,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dragCounterRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setErrorMessage(null);

    // If it's a .pkf file, route to the inspector
    if (file.name.toLowerCase().endsWith('.pkf')) {
      onPkfFileDropped(file);
      return;
    }

    try {
      onProgressUpdate({
        stage: 'reading',
        stageLabel: lang === 'fr' 
          ? `Chargement de ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...` 
          : `Loading ${file.name}...`,
        percent: 5,
        fileName: file.name,
        fileSizeBytes: file.size
      });

      const { parsePdfFile } = await import('../utils/pdfParser');
      const doc = await parsePdfFile(file, (p) => {
        onProgressUpdate(p);
      });

      onPdfLoaded(doc);

      // Keep complete state briefly then reset progress
      setTimeout(() => {
        onProgressUpdate(null);
      }, 1500);
    } catch (err: any) {
      console.error("Error processing PDF:", err);
      const msg = err?.message || (lang === 'fr' ? 'Impossible d’analyser ce fichier PDF.' : 'Failed to parse this PDF file.');
      setErrorMessage(msg);
      onProgressUpdate({
        stage: 'error',
        stageLabel: lang === 'fr' ? 'Échec de l’analyse du document' : 'Failed to parse document',
        percent: 0,
        errorMessage: msg,
        fileName: file.name
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 select-none ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/40 ring-4 ring-cyan-500/20 scale-[1.008] shadow-xl shadow-cyan-950/50'
            : 'border-neutral-700/80 hover:border-cyan-500/60 bg-neutral-900/60 hover:bg-neutral-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.PDF,.pkf,.PKF,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="pointer-events-none flex flex-col items-center justify-center gap-3.5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all ${
            isDragOver 
              ? 'bg-cyan-500 text-white border-cyan-400 scale-110 shadow-lg shadow-cyan-500/40' 
              : 'bg-neutral-800 border-neutral-700/80 text-cyan-400'
          }`}>
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <p className="text-base sm:text-lg font-bold text-neutral-100">
              {isDragOver
                ? (lang === 'fr' ? 'Relâchez le fichier pour lancer la conversion !' : 'Drop your file now to start conversion!')
                : (lang === 'fr' ? 'Glissez-déposez votre fichier PDF ici' : 'Drag and drop your PDF file here')}
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">
              {lang === 'fr'
                ? 'Supporte tous les fichiers .PDF (petits ou volumineux), ou déposez un .PKF existant pour l’inspecter'
                : 'Supports all .PDF files (small or large), or drop an existing .PKF to inspect it'}
            </p>
          </div>

          {/* Action Button inside zone */}
          <div className="pointer-events-auto pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg text-xs font-semibold border border-neutral-600/80 flex items-center gap-2 transition-all shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'fr' ? 'Parcourir vos fichiers...' : 'Browse files...'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="bg-rose-950/60 border border-rose-500/50 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-rose-300">
              {lang === 'fr' ? 'Erreur de lecture du fichier :' : 'File reading error:'}
            </strong>
            <p className="mt-0.5 text-neutral-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Preloaded samples bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-400 bg-neutral-900/40 p-3 rounded-lg border border-neutral-800">
        <span className="font-medium text-neutral-300">
          {lang === 'fr' ? 'Tester immédiatement avec un exemple :' : 'Try preloaded sample documents:'}
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSelectSample('audit')}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-200 text-neutral-300 transition-colors border border-neutral-700/60"
          >
            📊 {lang === 'fr' ? 'Rapport d’Audit' : 'Audit Report'}
          </button>
          <button
            onClick={() => onSelectSample('audio-spec')}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-200 text-neutral-300 transition-colors border border-neutral-700/60"
          >
            🎧 {lang === 'fr' ? 'Spécification Audio .PKF' : 'Audio PKF Spec'}
          </button>
          <button
            onClick={() => onSelectSample('legal')}
            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 hover:text-neutral-200 text-neutral-300 transition-colors border border-neutral-700/60"
          >
            ⚖️ {lang === 'fr' ? 'Contrat Juridique' : 'Legal Contract'}
          </button>
        </div>
      </div>

      {/* Loaded document summary info */}
      {currentDoc && !isLoading && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-100 max-w-md truncate">
                  {currentDoc.metadata.fileName}
                </h3>
                <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === 'fr' ? 'Prêt pour conversion' : 'Ready for conversion'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5 font-mono">
                <span>{currentDoc.metadata.pageCount} {lang === 'fr' ? 'page(s)' : 'pages'}</span>
                <span>·</span>
                <span>{currentDoc.totalWords.toLocaleString()} {lang === 'fr' ? 'mots' : 'words'}</span>
                <span>·</span>
                <span>{(currentDoc.metadata.fileSizeBytes / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-neutral-400 font-mono bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800/80">
            {lang === 'fr' ? 'Titre :' : 'Title:'} <span className="text-neutral-200">{currentDoc.metadata.title || currentDoc.metadata.fileName}</span>
          </div>
        </div>
      )}
    </div>
  );
};
