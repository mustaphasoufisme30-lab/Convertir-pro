import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Layers, 
  Music, 
  Archive, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  Globe, 
  Check, 
  Copy, 
  Sparkles,
  Info,
  HardDrive,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { ParsedPdfDocument, ConversionFormat } from '../types/converter';
import { AudioSynthesisResult, synthesizeTextToWaveformAsync } from '../utils/audioSynthesizer';
import { generateAdobeAuditionPkf, generatePackageContainerPkf, generateSecurityPkf } from '../utils/pkfGenerator';
import { generateEpubFromPdf } from '../utils/epubGenerator';
import { savePkfToStorage } from '../utils/storageManager';
import { WaveformVisualizer } from './WaveformVisualizer';
import { MobileDownloadModal } from './MobileDownloadModal';
import JSZip from 'jszip';

interface PkfConverterViewProps {
  doc: ParsedPdfDocument;
  lang: 'fr' | 'en';
  onProgressUpdate?: (progress: any) => void;
  onNavigateToStorage?: () => void;
}

export const PkfConverterView: React.FC<PkfConverterViewProps> = ({ 
  doc, 
  lang, 
  onProgressUpdate,
  onNavigateToStorage 
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ConversionFormat>('pkf-audition');
  const [audioResult, setAudioResult] = useState<AudioSynthesisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [savedToStorageMsg, setSavedToStorageMsg] = useState<string | null>(null);
  const [mobileDownloadData, setMobileDownloadData] = useState<{ 
    fileName: string; 
    bytes: Uint8Array; 
    formatLabel: string 
  } | null>(null);

  // Compute audio & waveform whenever document changes using async chunking
  useEffect(() => {
    let isCancelled = false;

    const runSynthesis = async () => {
      setIsProcessing(true);
      const synthesisText = doc.fullText.slice(0, 4000);
      try {
        const result = await synthesizeTextToWaveformAsync(
          synthesisText, 
          25,
          (pct, label) => {
            if (!isCancelled && onProgressUpdate) {
              onProgressUpdate({
                stage: 'synthesizing-audio',
                stageLabel: label,
                percent: pct,
                fileName: doc.metadata.fileName,
                details: `${doc.pages.length} pages · calcul des crêtes PK01`
              });
            }
          }
        );
        if (!isCancelled) {
          setAudioResult(result);
          setIsProcessing(false);
          if (onProgressUpdate) {
            setTimeout(() => onProgressUpdate(null), 800);
          }
        }
      } catch (err) {
        console.error("Synthesis error:", err);
        if (!isCancelled) setIsProcessing(false);
      }
    };

    runSynthesis();

    return () => {
      isCancelled = true;
    };
  }, [doc]);

  // Save Adobe Audition PKF to storage
  const handleSaveAuditionToStorage = async () => {
    if (!audioResult) return;
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    const pkfBytes = generateAdobeAuditionPkf(audioResult);
    const id = `pkf-audition-${Date.now()}`;

    await savePkfToStorage({
      id,
      fileName: `${baseName}.pkf`,
      originalPdfName: doc.metadata.fileName,
      formatType: 'pkf-audition',
      formatLabel: 'Adobe Audition PK01',
      fileSizeBytes: pkfBytes.length,
      createdAt: new Date().toISOString(),
      pkfData: pkfBytes,
      wavData: audioResult.wavBytes,
      peaks: audioResult.peaks,
      durationSeconds: audioResult.durationSeconds,
      pageCount: doc.pages.length,
      wordCount: doc.totalWords
    });

    setSavedToStorageMsg(`${baseName}.pkf`);
    setTimeout(() => setSavedToStorageMsg(null), 4500);
  };

  // Save Package PKF to storage
  const handleSavePackageToStorage = async () => {
    const pkfBytes = await generatePackageContainerPkf(doc);
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    const id = `pkf-package-${Date.now()}`;

    await savePkfToStorage({
      id,
      fileName: `${baseName}_Package.pkf`,
      originalPdfName: doc.metadata.fileName,
      formatType: 'pkf-package',
      formatLabel: 'Conteneur PKF1',
      fileSizeBytes: pkfBytes.length,
      createdAt: new Date().toISOString(),
      pkfData: pkfBytes,
      pageCount: doc.pages.length,
      wordCount: doc.totalWords
    });

    setSavedToStorageMsg(`${baseName}_Package.pkf`);
    setTimeout(() => setSavedToStorageMsg(null), 4500);
  };

  // Download Trigger Helper
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(filename);
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // 1. Download Adobe Audition .PKF
  const handleDownloadAuditionPkf = () => {
    if (!audioResult) return;
    const pkfBytes = generateAdobeAuditionPkf(audioResult);
    const blob = new Blob([pkfBytes as ArrayBufferView<ArrayBuffer>], { type: 'application/octet-stream' });
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(blob, `${baseName}.pkf`);
  };

  // 2. Download WAV Audio track
  const handleDownloadWav = () => {
    if (!audioResult) return;
    const blob = new Blob([audioResult.wavBytes as ArrayBufferView<ArrayBuffer>], { type: 'audio/wav' });
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(blob, `${baseName}.wav`);
  };

  // 3. Download Bundle (.pkf + .wav in ZIP)
  const handleDownloadAuditionBundle = async () => {
    if (!audioResult) return;
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    const zip = new JSZip();
    const pkfBytes = generateAdobeAuditionPkf(audioResult);
    
    zip.file(`${baseName}.pkf`, pkfBytes);
    zip.file(`${baseName}.wav`, audioResult.wavBytes);
    zip.file("README_ADOBE_AUDITION.txt", 
      `PACK ADOBE AUDITION / PREMIERE PRO\n` +
      `===================================\n` +
      `Fichier source : ${doc.metadata.fileName}\n` +
      `Fichier audio : ${baseName}.wav\n` +
      `Fichier de crête : ${baseName}.pkf\n\n` +
      `Instructions :\n` +
      `Placez le fichier .wav et le fichier .pkf dans le même répertoire.\n` +
      `Lors de l'ouverture du .wav dans Adobe Audition, la forme d'onde sera chargée instantanément depuis le .pkf.\n`
    );

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `${baseName}_Adobe_Audition_Pack.zip`);
  };

  // 4. Download Package Container .PKF
  const handleDownloadPackagePkf = async () => {
    const pkfBytes = await generatePackageContainerPkf(doc);
    const blob = new Blob([pkfBytes as ArrayBufferView<ArrayBuffer>], { type: 'application/octet-stream' });
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(blob, `${baseName}.pkf`);
  };

  // 5. Download Security Certificate .PKF
  const handleDownloadSecurityPkf = async () => {
    const pkfBytes = await generateSecurityPkf(doc);
    const blob = new Blob([pkfBytes as ArrayBufferView<ArrayBuffer>], { type: 'application/octet-stream' });
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(blob, `${baseName}_integrity_cert.pkf`);
  };

  // 6. Download EPUB
  const handleDownloadEpub = async () => {
    const epubBlob = await generateEpubFromPdf(doc);
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(epubBlob, `${baseName}.epub`);
  };

  // 7. Download TXT
  const handleDownloadTxt = () => {
    const blob = new Blob([doc.fullText], { type: 'text/plain;charset=utf-8' });
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(blob, `${baseName}.txt`);
  };

  // 8. Download HTML
  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${doc.metadata.title || doc.metadata.fileName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 820px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1e293b; }
    h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    .page-box { margin-bottom: 40px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
    .page-title { font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 10px; }
  </style>
</head>
<body>
  <h1>${doc.metadata.title || doc.metadata.fileName}</h1>
  ${doc.pages.map(p => `
    <div class="page-box">
      <div class="page-title">Page ${p.pageNumber}</div>
      ${p.text.split('\n\n').map(t => `<p>${t}</p>`).join('')}
    </div>
  `).join('')}
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
    triggerDownload(blob, `${baseName}.html`);
  };

  return (
    <div className="space-y-6">
      {/* Format Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Adobe Audition PKF */}
        <div
          onClick={() => setSelectedFormat('pkf-audition')}
          className={`cursor-pointer rounded-xl p-5 border transition-all ${
            selectedFormat === 'pkf-audition'
              ? 'bg-neutral-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              Standard Adobe .PKF
            </span>
          </div>
          <h4 className="text-sm font-semibold text-neutral-100">
            {lang === 'fr' ? 'Crête Audio Adobe Audition (.pkf)' : 'Adobe Audition Peak File (.pkf)'}
          </h4>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            {lang === 'fr'
              ? 'Synthétise la lecture audio du PDF et génère le fichier binaire de crêtes .PKF (PK01) pour Audition & Premiere.'
              : 'Synthesizes audio narration from PDF and computes authentic binary .PKF peak file for Adobe Audition.'}
          </p>
        </div>

        {/* Card 2: Package Container PKF */}
        <div
          onClick={() => setSelectedFormat('pkf-package')}
          className={`cursor-pointer rounded-xl p-5 border transition-all ${
            selectedFormat === 'pkf-package'
              ? 'bg-neutral-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Archive className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
              Format Package
            </span>
          </div>
          <h4 className="text-sm font-semibold text-neutral-100">
            {lang === 'fr' ? 'Paquet Document Sécurisé (.pkf)' : 'Secure Package Container (.pkf)'}
          </h4>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            {lang === 'fr'
              ? 'Encapsule le PDF d’origine, son texte structuré, ses métadonnées et son empreinte SHA-256 dans un paquet unique.'
              : 'Encapsulates original PDF, extracted text, metadata, and SHA-256 digest into a single verifiable package file.'}
          </p>
        </div>

        {/* Card 3: Alternative formats (EPUB, TXT, HTML) */}
        <div
          onClick={() => setSelectedFormat('epub')}
          className={`cursor-pointer rounded-xl p-5 border transition-all ${
            ['epub', 'txt', 'html'].includes(selectedFormat)
              ? 'bg-neutral-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
              : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              Formats Usuels
            </span>
          </div>
          <h4 className="text-sm font-semibold text-neutral-100">
            {lang === 'fr' ? 'EPUB, Texte & Web (Alternatifs)' : 'EPUB, Text & Web (Alternatives)'}
          </h4>
          <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
            {lang === 'fr'
              ? 'Si vous cherchiez un format de lecture numérique souvent confondu avec PKF (eBook ePub, TXT brut ou HTML).'
              : 'If you intended a readable digital book format often confused with PKF (EPUB ebook, plain TXT or HTML).'}
          </p>
        </div>

      </div>

      {/* Success Notification Bar */}
      {downloadSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'fr' ? 'Téléchargement réussi :' : 'Downloaded successfully:'} <strong>{downloadSuccess}</strong>
            </span>
          </div>
          <span className="font-mono text-emerald-400">OK</span>
        </div>
      )}

      {/* Storage Saved Notification Bar */}
      {savedToStorageMsg && (
        <div className="bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs animate-fade-in shadow-md shadow-cyan-950/50">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              {lang === 'fr' ? 'Fichier .PKF sauvegardé avec succès dans votre espace Storage :' : 'PKF saved to your Storage:'} <strong>{savedToStorageMsg}</strong>
            </span>
          </div>
          {onNavigateToStorage && (
            <button
              onClick={onNavigateToStorage}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>{lang === 'fr' ? 'Consulter dans le Storage' : 'View in Storage'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Mode View: Adobe Audition PKF */}
      {selectedFormat === 'pkf-audition' && (
        <div className="space-y-4">
          <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-1">
              <p className="font-medium text-neutral-200">
                {lang === 'fr'
                  ? 'Comment fonctionne la conversion PDF vers PKF Adobe Audition ?'
                  : 'How does PDF to Adobe Audition .PKF conversion work?'}
              </p>
              <p className="text-neutral-400 leading-relaxed">
                {lang === 'fr'
                  ? 'Un fichier .pkf n’affiche pas de pages visuelles : il stocke la représentation graphique (forme d’onde) d’un fichier audio pour qu’Adobe Audition ou Premiere l’ouvre instantanément. Nous générons ici la piste audio parlée du PDF et son fichier de crêtes .pkf exact.'
                  : 'A .pkf file does not display visual pages: it caches the graphic waveform for Adobe Audition. We generate the synthesized audio and its exact .pkf peak file.'}
              </p>
            </div>
          </div>

          <WaveformVisualizer 
            audioResult={audioResult} 
            textToSpeak={doc.fullText.slice(0, 1000)}
            lang={lang}
          />

          {/* Action Download Buttons */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-neutral-100">
                {lang === 'fr' ? 'Fichiers prêts pour l’export et le stockage' : 'Files ready for export and storage'}
              </h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                {lang === 'fr'
                  ? 'Téléchargez le fichier .pkf ou conservez-le dans le Storage persistant de l’application'
                  : 'Download the .pkf or save it to your persistent storage'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Phone Download Button */}
              <button
                onClick={() => {
                  if (!audioResult) return;
                  const pkfBytes = generateAdobeAuditionPkf(audioResult);
                  const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
                  setMobileDownloadData({
                    fileName: `${baseName}.pkf`,
                    bytes: pkfBytes,
                    formatLabel: 'Adobe Audition PK01'
                  });
                }}
                className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm shadow-emerald-950"
                title={lang === 'fr' ? 'Télécharger directement sur votre smartphone' : 'Download to phone'}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{lang === 'fr' ? 'Télécharger sur Téléphone' : 'Download to Phone'}</span>
              </button>

              {/* Save to Storage Button */}
              <button
                onClick={handleSaveAuditionToStorage}
                className="px-4 py-2 bg-cyan-700/80 hover:bg-cyan-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-cyan-950"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-200" />
                <span>{lang === 'fr' ? 'Vers le Storage' : 'Save to Storage'}</span>
              </button>

              <button
                onClick={handleDownloadAuditionPkf}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-2 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'fr' ? 'Télécharger .PKF' : 'Download .PKF'}</span>
              </button>

              <button
                onClick={handleDownloadWav}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-medium border border-neutral-700 flex items-center gap-2 transition-colors"
              >
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lang === 'fr' ? 'Télécharger .WAV Audio' : 'Download .WAV Audio'}</span>
              </button>

              <button
                onClick={handleDownloadAuditionBundle}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm shadow-cyan-950"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{lang === 'fr' ? 'Pack Adobe (.ZIP)' : 'Adobe Bundle (.ZIP)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode View: Package Container PKF */}
      {selectedFormat === 'pkf-package' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
          <div className="flex items-start gap-3">
            <Archive className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-neutral-100">
                {lang === 'fr' ? 'Format Paquet Document PKF (Package Container)' : 'PKF Document Package Container'}
              </h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {lang === 'fr'
                  ? 'Ce format paquet scelle le document PDF dans une archive binaire contenant l’arborescence des pages, le texte intégral indexé, et une signature de hachage SHA-256 pour vérifier qu’aucune modification n’a été apportée.'
                  : 'This package format seals the PDF document in a binary archive with page tree, indexed text, and SHA-256 integrity hash.'}
              </p>
            </div>
          </div>

          {/* Container manifest preview */}
          <div className="bg-neutral-950 rounded-lg p-4 font-mono text-xs text-neutral-300 border border-neutral-800/80 space-y-2">
            <div className="text-neutral-500">// Structure du conteneur .PKF généré :</div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Signature Magic :</span>
              <span className="text-indigo-400">PKF1 (4 octets)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Document encapsulé :</span>
              <span className="text-neutral-200">{doc.metadata.fileName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Pages indexées :</span>
              <span className="text-neutral-200">{doc.pages.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Volume brut :</span>
              <span className="text-neutral-200">{(doc.metadata.fileSizeBytes / 1024).toFixed(1)} KB</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="text-xs text-neutral-400 font-mono">
              Format auto-vérifiable dans l’onglet Inspecteur
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={async () => {
                  const pkfBytes = await generatePackageContainerPkf(doc);
                  const baseName = doc.metadata.fileName.replace(/\.pdf$/i, '');
                  setMobileDownloadData({
                    fileName: `${baseName}_Package.pkf`,
                    bytes: pkfBytes,
                    formatLabel: 'Conteneur PKF1'
                  });
                }}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                <span>{lang === 'fr' ? 'Télécharger sur Téléphone' : 'Download to Phone'}</span>
              </button>

              <button
                onClick={handleSavePackageToStorage}
                className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <HardDrive className="w-4 h-4 text-indigo-200" />
                <span>{lang === 'fr' ? 'Télécharger vers le Storage' : 'Save to Storage'}</span>
              </button>

              <button
                onClick={handleDownloadPackagePkf}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold border border-neutral-700 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>{lang === 'fr' ? 'Télécharger sur le PC (.PKF)' : 'Download .PKF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode View: Alternative formats (EPUB, TXT, HTML) */}
      {['epub', 'txt', 'html'].includes(selectedFormat) && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-neutral-100">
              {lang === 'fr' ? 'Formats Fréquemment Recherchés' : 'Frequently Intended Formats'}
            </h4>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              {lang === 'fr'
                ? 'Si votre demande initiale de « PDF vers PKF » était une faute de frappe pour un format de document liseur ou éditable, vous pouvez télécharger directement les équivalents ci-dessous :'
                : 'If your search for "PDF to PKF" was a typo for an eBook or editable document, you can export these standard formats directly:'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* EPUB button */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-semibold text-xs">EPUB 3.0 (.epub)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {lang === 'fr' ? 'Format standard eBook pour liseuses (Kobo, Kindle, Apple Livres).' : 'Standard eBook format for e-readers.'}
                </p>
              </div>
              <button
                onClick={handleDownloadEpub}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'fr' ? 'Télécharger .EPUB' : 'Download .EPUB'}</span>
              </button>
            </div>

            {/* Plain Text button */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold text-xs">Texte Brut (.txt)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {lang === 'fr' ? 'Texte pur extrait page par page, sans balises ni mise en forme.' : 'Raw text extracted page by page.'}
                </p>
              </div>
              <button
                onClick={handleDownloadTxt}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>{lang === 'fr' ? 'Télécharger .TXT' : 'Download .TXT'}</span>
              </button>
            </div>

            {/* HTML Article button */}
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <Globe className="w-4 h-4" />
                  <span className="font-semibold text-xs">Page Web (.html)</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  {lang === 'fr' ? 'Document HTML responsive stylé pour affichage dans tout navigateur.' : 'Clean responsive HTML article view.'}
                </p>
              </div>
              <button
                onClick={handleDownloadHtml}
                className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'fr' ? 'Télécharger .HTML' : 'Download .HTML'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Text Preview Accordion */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-200">
              {lang === 'fr' ? 'Aperçu du contenu extrait du PDF' : 'Extracted PDF Content Preview'}
            </span>
            <span className="text-neutral-500">·</span>
            <span className="text-xs font-mono text-neutral-400">
              {doc.pages.length} {lang === 'fr' ? 'page(s)' : 'pages'}
            </span>
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(doc.fullText);
              setDownloadSuccess(lang === 'fr' ? 'Texte copié dans le presse-papier !' : 'Text copied to clipboard!');
              setTimeout(() => setDownloadSuccess(null), 2500);
            }}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 font-mono transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>{lang === 'fr' ? 'Copier le texte' : 'Copy text'}</span>
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto bg-neutral-950 rounded-lg p-3 text-xs font-mono text-neutral-300 leading-relaxed border border-neutral-800/80 whitespace-pre-wrap">
          {doc.fullText || (lang === 'fr' ? 'Aucun texte extrait' : 'No extracted text')}
        </div>
      </div>

      {/* Mobile Smartphone Download Modal */}
      {mobileDownloadData && (
        <MobileDownloadModal
          isOpen={!!mobileDownloadData}
          onClose={() => setMobileDownloadData(null)}
          fileName={mobileDownloadData.fileName}
          fileBytes={mobileDownloadData.bytes}
          wavBytes={audioResult?.wavBytes}
          formatLabel={mobileDownloadData.formatLabel}
          lang={lang}
        />
      )}
    </div>
  );
};
