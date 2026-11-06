import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  X, 
  Download, 
  Share2, 
  QrCode, 
  Send, 
  Mail, 
  Check, 
  Copy, 
  Info,
  Sparkles,
  RotateCcw,
  Tablet,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface MobileDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnHome?: () => void;
  fileName: string;
  fileBytes: Uint8Array;
  epubBytes?: Uint8Array;
  epubFileName?: string;
  docxBytes?: Uint8Array;
  docxFileName?: string;
  kpfBytes?: Uint8Array;
  kpfFileName?: string;
  wavBytes?: Uint8Array;
  formatLabel: string;
  lang: 'fr' | 'en';
}

export const MobileDownloadModal: React.FC<MobileDownloadModalProps> = ({
  isOpen,
  onClose,
  onReturnHome,
  fileName,
  fileBytes,
  epubBytes,
  epubFileName,
  docxBytes,
  docxFileName,
  kpfBytes,
  kpfFileName,
  wavBytes,
  formatLabel,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadedFormatName, setDownloadedFormatName] = useState<string>('');
  const [countdown, setCountdown] = useState<number | null>(null);

  // Active files
  const activeEpubName = epubFileName || (fileName.endsWith('.epub') ? fileName : fileName.replace(/\.(kpf|pkf|docx)$/i, '_Amazon_KDP.epub'));
  const activeEpubBytes = epubBytes || fileBytes;

  const activeDocxName = docxFileName || activeEpubName.replace(/\.epub$/i, '.docx');
  const activeDocxBytes = docxBytes;

  const activeKpfName = kpfFileName || (fileName.endsWith('.kpf') ? fileName : activeEpubName.replace(/_Amazon_KDP\.epub$/i, '.kpf'));
  const activeKpfBytes = kpfBytes || fileBytes;

  // Determine current app URL
  const appUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') 
        ? 'https://ais-pre-yd4oelh7oyunouzuyvaob3-54545165468.europe-west2.run.app' 
        : window.location.origin)
    : 'https://ais-pre-yd4oelh7oyunouzuyvaob3-54545165468.europe-west2.run.app';

  const mobileUrl = `${appUrl}`;

  // Handle countdown for automatic return to home after phone download
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (onReturnHome) {
        onReturnHome();
      } else {
        onClose();
      }
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReturnHome, onClose]);

  // Generate QR Code
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        mobileUrl,
        {
          width: 180,
          margin: 1.5,
          color: {
            dark: '#f59e0b', // Amber-500 KDP
            light: '#0a0a0a'  // Neutral-950
          }
        },
        (error) => {
          if (error) console.error("QR Code error:", error);
        }
      );
    }
  }, [isOpen, mobileUrl]);

  if (!isOpen) return null;

  // Direct Mobile Download Trigger for EPUB (Amazon KDP Ready)
  const handleDownloadEpub = () => {
    const blob = new Blob([activeEpubBytes as ArrayBufferView<ArrayBuffer>], { type: 'application/epub+zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeEpubName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedFormatName(activeEpubName);
    setDownloadSuccess(true);
    setCountdown(3);
  };

  // Direct Mobile Download Trigger for DOCX (Word KDP)
  const handleDownloadDocx = () => {
    if (!activeDocxBytes) {
      handleDownloadEpub();
      return;
    }
    const blob = new Blob([activeDocxBytes as ArrayBufferView<ArrayBuffer>], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeDocxName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedFormatName(activeDocxName);
    setDownloadSuccess(true);
    setCountdown(3);
  };

  // Direct Mobile Download Trigger for KPF
  const handleDownloadKpf = () => {
    const blob = new Blob([activeKpfBytes as ArrayBufferView<ArrayBuffer>], { type: 'application/x-kpf-package' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeKpfName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadedFormatName(activeKpfName);
    setDownloadSuccess(true);
    setCountdown(3);
  };

  // Web Share API (Triggers native phone sheet on mobile)
  const handleNativeShare = async (type: 'epub' | 'docx' = 'epub') => {
    try {
      const bytesToShare = type === 'docx' && activeDocxBytes ? activeDocxBytes : activeEpubBytes;
      const nameToShare = type === 'docx' && activeDocxBytes ? activeDocxName : activeEpubName;
      const mimeToShare = type === 'docx' 
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        : 'application/epub+zip';

      const file = new File([bytesToShare as ArrayBufferView<ArrayBuffer>], nameToShare, { 
        type: mimeToShare 
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Livre Amazon KDP : ${nameToShare}`,
          text: `Voici le livre ${nameToShare} accepté à 100% par Amazon KDP.`,
          files: [file]
        });
      } else {
        await navigator.share({
          title: `Livre Amazon KDP : ${nameToShare}`,
          text: `Convertisseur Mahfoud Mustapha - Lien :`,
          url: mobileUrl
        });
      }

      setDownloadedFormatName(nameToShare);
      setDownloadSuccess(true);
      setCountdown(3);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        if (type === 'docx') handleDownloadDocx();
        else handleDownloadEpub();
      }
    }
  };

  // Return to home immediately
  const handleTriggerReturnHome = () => {
    if (onReturnHome) {
      onReturnHome();
    } else {
      onClose();
    }
  };

  // Send via WhatsApp
  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `Convertisseur Mahfoud Mustapha (Amazon KDP) : Ouvrez l'application sur votre téléphone pour convertir et télécharger votre livre (.epub ou .docx) accepté par Amazon KDP : ${mobileUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Send via Email
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Livre Amazon KDP : ${activeEpubName}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVoici le lien du Convertisseur Mahfoud Mustapha pour télécharger votre livre au format .EPUB ou .DOCX (100% accepté sur Amazon KDP depuis votre téléphone) :\n\n${mobileUrl}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-[120] bg-neutral-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div 
        className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl shadow-black relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          title={lang === 'fr' ? 'Fermer' : 'Close'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-8">
          <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-100">
              {lang === 'fr' ? 'Télécharger sur Téléphone pour Amazon KDP' : 'Download to Phone for Amazon KDP'}
            </h3>
            <p className="text-xs text-amber-300 font-medium mt-0.5">
              {lang === 'fr' 
                ? 'Choisissez .EPUB ou .DOCX ci-dessous (100% Acceptés par Amazon KDP)' 
                : 'Choose .EPUB or .DOCX below (100% Accepted by Amazon KDP)'}
            </p>
          </div>
        </div>

        {/* Important Warning Box for KDP on Mobile */}
        <div className="bg-rose-950/50 border border-rose-500/40 rounded-xl p-3.5 text-xs text-rose-100 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-amber-300 font-bold block">
              ⚠️ Pourquoi Amazon KDP refusait votre fichier sur téléphone :
            </strong>
            Amazon KDP <strong>refuse toujours</strong> les fichiers nommés <code className="bg-black/40 px-1 rounded text-rose-300">.pkf</code>. Sur votre téléphone, cliquez sur le bouton doré <strong>.EPUB</strong> ou le bouton bleu <strong>.DOCX (Word)</strong> ci-dessous : ce sont les 2 seuls formats officiels qu'Amazon KDP accepte à 100% sur mobile !
          </div>
        </div>

        {/* Success & Auto-redirect Notification */}
        {downloadSuccess && (
          <div className="bg-emerald-950/90 border border-emerald-500/60 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 animate-fade-in text-emerald-200 shadow-lg shadow-emerald-950/50">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>{lang === 'fr' ? 'Fichier KDP téléchargé sur votre téléphone !' : 'KDP file downloaded!'}</span>
            </div>
            <p className="text-xs text-neutral-200 font-mono">
              {downloadedFormatName}
            </p>
            <p className="text-[11px] text-neutral-400">
              {lang === 'fr' 
                ? `Retour automatique à l'accueil dans ${countdown ?? 2}s...` 
                : `Returning to home screen in ${countdown ?? 2}s...`}
            </p>
            <button
              onClick={handleTriggerReturnHome}
              className="mt-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'fr' ? "Revenir à l'accueil maintenant" : "Return to home now"}</span>
            </button>
          </div>
        )}

        {/* Primary Mobile Download Buttons: EPUB & DOCX */}
        <div className="space-y-2.5">
          
          {/* Option 1: EPUB for Amazon KDP */}
          <button
            onClick={handleDownloadEpub}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all shadow-lg shadow-amber-950/50 cursor-pointer border border-amber-300"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Download className="w-5 h-5 text-neutral-950 shrink-0" />
              <div>
                <div className="leading-tight">1. Télécharger .EPUB sur Téléphone</div>
                <div className="text-[10px] font-semibold text-neutral-900/80">Format officiel n°1 recommandé par Amazon KDP</div>
              </div>
            </div>
            <span className="text-[10px] bg-black/25 text-neutral-950 px-2 py-0.5 rounded font-extrabold uppercase shrink-0">
              100% KDP
            </span>
          </button>

          {/* Option 2: DOCX (Word) for Amazon KDP */}
          {activeDocxBytes && (
            <button
              onClick={handleDownloadDocx}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-between transition-all shadow-lg shadow-blue-950/50 cursor-pointer border border-sky-400/40"
            >
              <div className="flex items-center gap-2.5 text-left">
                <FileText className="w-5 h-5 text-sky-200 shrink-0" />
                <div>
                  <div className="leading-tight">2. Télécharger .DOCX (Word KDP) sur Téléphone</div>
                  <div className="text-[10px] font-normal text-sky-100/90">Manuscrit Word accepté sans erreur sur kdp.amazon.com</div>
                </div>
              </div>
              <span className="text-[10px] bg-black/30 text-sky-200 px-2 py-0.5 rounded font-extrabold uppercase shrink-0">
                100% KDP
              </span>
            </button>
          )}

          {/* Secondary options: Share to phone & KPF */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleNativeShare('epub')}
              className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold border border-neutral-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'fr' ? 'Partager vers Fichiers' : 'Share to Files'}</span>
            </button>

            <button
              onClick={handleDownloadKpf}
              className="py-2.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold border border-neutral-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Tablet className="w-4 h-4 text-cyan-400" />
              <span>{lang === 'fr' ? 'Archive .KPF' : '.KPF Archive'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Section for scanning from PC to Phone */}
        <div className="bg-neutral-950 rounded-xl p-3.5 border border-neutral-800 flex items-center gap-4">
          <div className="p-1.5 bg-neutral-950 rounded-lg border border-amber-900/40 shrink-0">
            <canvas ref={canvasRef} className="rounded w-24 h-24 block" />
          </div>
          <div className="space-y-1 text-[11px] text-neutral-400 leading-relaxed">
            <div className="text-amber-400 font-bold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>Vous êtes sur ordinateur ?</span>
            </div>
            <p>
              Scannez ce QR Code avec votre téléphone pour ouvrir l'application sur mobile et télécharger directement le fichier <strong>.EPUB</strong> ou <strong>.DOCX</strong> dans les fichiers de votre téléphone.
            </p>
          </div>
        </div>

        {/* Return to Home Button */}
        <div>
          <button
            type="button"
            onClick={handleTriggerReturnHome}
            className="w-full py-2.5 px-4 bg-neutral-800/90 hover:bg-neutral-700 text-cyan-300 hover:text-cyan-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-neutral-700 hover:border-cyan-500/50 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'fr' ? "🏠 Revenir à l'accueil / Nouveau fichier" : "🏠 Return to Home / New File"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
