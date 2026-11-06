import React from 'react';
import { ConversionProgress } from '../types/converter';
import { FileText, Loader2, CheckCircle2, AlertCircle, X, Cpu } from 'lucide-react';

interface ConversionProgressBarProps {
  progress: ConversionProgress | null;
  onCancel?: () => void;
  lang: 'fr' | 'en';
}

export const ConversionProgressBar: React.FC<ConversionProgressBarProps> = ({
  progress,
  onCancel,
  lang,
}) => {
  if (!progress || progress.stage === 'idle') {
    return null;
  }

  const isComplete = progress.stage === 'complete';
  const isError = progress.stage === 'error';
  const isRunning = !isComplete && !isError;

  // Stages breakdown for the multi-step progress indicators
  const stages = [
    { key: 'reading', label: lang === 'fr' ? '1. Lecture' : '1. Read' },
    { key: 'parsing-pages', label: lang === 'fr' ? '2. Extraction' : '2. Extract' },
    { key: 'synthesizing-audio', label: lang === 'fr' ? '3. Audio & PKF' : '3. Audio & PKF' },
    { key: 'complete', label: lang === 'fr' ? '4. Prêt' : '4. Ready' },
  ];

  const getStageIndex = (stage: string) => {
    switch (stage) {
      case 'reading': return 0;
      case 'parsing-pages':
      case 'extracting-text': return 1;
      case 'synthesizing-audio':
      case 'calculating-peaks':
      case 'generating-pkf': return 2;
      case 'complete': return 3;
      default: return 0;
    }
  };

  const currentStageIdx = getStageIndex(progress.stage);

  return (
    <div className="bg-neutral-900 border border-neutral-700/80 rounded-xl p-5 shadow-lg shadow-black/30 space-y-4 animate-fade-in transition-all">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
            isComplete
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
              : isError
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
              : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isError ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-neutral-100">
                {isComplete
                  ? (lang === 'fr' ? 'Traitement terminé avec succès' : 'Transformation Complete')
                  : isError
                  ? (lang === 'fr' ? 'Erreur lors du traitement' : 'Processing Error')
                  : (lang === 'fr' ? 'Transformation du document en cours...' : 'Processing Document...')}
              </h4>
              {progress.fileName && (
                <span className="text-xs font-mono text-neutral-400 truncate max-w-xs">
                  · {progress.fileName}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-300 mt-0.5">
              {progress.stageLabel}
            </p>
          </div>
        </div>

        {/* Numeric percentage & cancel */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-base font-bold font-mono tabular-nums text-neutral-100">
            {Math.round(progress.percent)}%
          </span>
          {isRunning && onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-md transition-colors"
              title={lang === 'fr' ? 'Annuler' : 'Cancel'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Progress Bar Track */}
      <div className="space-y-1.5">
        <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-neutral-800">
          <div
            className={`h-full rounded-full transition-all duration-200 ease-out ${
              isComplete
                ? 'bg-emerald-500'
                : isError
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
            }`}
            style={{ width: `${Math.max(4, Math.min(100, progress.percent))}%` }}
          />
        </div>

        {/* Metadata sub-row */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-0.5">
          <div>
            {progress.currentPage && progress.totalPages ? (
              <span>
                {lang === 'fr' ? 'Page' : 'Page'} <strong className="text-neutral-200">{progress.currentPage}</strong> / {progress.totalPages}
              </span>
            ) : progress.details ? (
              <span>{progress.details}</span>
            ) : (
              <span>{lang === 'fr' ? 'Traitement haute précision' : 'High precision pipeline'}</span>
            )}
          </div>

          <div>
            {progress.fileSizeBytes && (
              <span>{(progress.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
            )}
          </div>
        </div>
      </div>

      {/* Step progression indicators */}
      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-neutral-800/80">
        {stages.map((stg, idx) => {
          const isPassed = currentStageIdx > idx || isComplete;
          const isCurrent = currentStageIdx === idx && !isComplete && !isError;

          return (
            <div key={stg.key} className="text-center">
              <div className={`text-[11px] font-medium transition-colors ${
                isPassed
                  ? 'text-cyan-400 font-semibold'
                  : isCurrent
                  ? 'text-neutral-100 font-semibold'
                  : 'text-neutral-500'
              }`}>
                {stg.label}
              </div>
              <div className={`h-1 mt-1 rounded-full transition-colors ${
                isPassed
                  ? 'bg-cyan-500'
                  : isCurrent
                  ? 'bg-cyan-400 animate-pulse'
                  : 'bg-neutral-800'
              }`} />
            </div>
          );
        })}
      </div>

      {/* Error message detail if any */}
      {isError && progress.errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg p-3 text-xs text-rose-200">
          <strong>Erreur : </strong> {progress.errorMessage}
        </div>
      )}
    </div>
  );
};
