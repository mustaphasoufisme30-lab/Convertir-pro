import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Download, 
  Trash2, 
  Search, 
  FileCode, 
  Music, 
  Archive, 
  ShieldCheck, 
  Check, 
  UploadCloud, 
  ExternalLink,
  RefreshCw,
  FolderArchive,
  Smartphone
} from 'lucide-react';
import { StoredPkfItem, getAllStoredPkfItems, deleteStoredPkfItem, clearAllStoredPkfItems } from '../utils/storageManager';
import { MobileDownloadModal } from './MobileDownloadModal';
import JSZip from 'jszip';

interface StorageManagerViewProps {
  onInspectFile: (file: { name: string; bytes: Uint8Array }) => void;
  lang: 'fr' | 'en';
}

export const StorageManagerView: React.FC<StorageManagerViewProps> = ({
  onInspectFile,
  lang,
}) => {
  const [items, setItems] = useState<StoredPkfItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedMobileItem, setSelectedMobileItem] = useState<StoredPkfItem | null>(null);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const data = await getAllStoredPkfItems();
      setItems(data);
    } catch (err) {
      console.error("Failed to load storage items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Filtered list
  const filteredItems = items.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.originalPdfName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.formatType === filterType;
    return matchesSearch && matchesType;
  });

  // Calculate storage metrics
  const totalBytes = items.reduce((acc, it) => acc + (it.fileSizeBytes || it.pkfData?.length || 0), 0);
  const formattedSize = totalBytes > 1024 * 1024
    ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
    : `${(totalBytes / 1024).toFixed(1)} KB`;

  // Download single file
  const downloadFile = (bytes: Uint8Array, fileName: string, mime = 'application/octet-stream') => {
    const blob = new Blob([bytes as ArrayBufferView<ArrayBuffer>], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActionSuccess(fileName);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Delete single file
  const handleDelete = async (id: string, name: string) => {
    if (confirm(lang === 'fr' ? `Supprimer "${name}" du stockage ?` : `Delete "${name}" from storage?`)) {
      await deleteStoredPkfItem(id);
      loadItems();
    }
  };

  // Clear all storage
  const handleClearAll = async () => {
    if (confirm(lang === 'fr' ? 'Supprimer tous les fichiers du stockage ?' : 'Clear all files from storage?')) {
      await clearAllStoredPkfItems();
      loadItems();
    }
  };

  // Export all storage to ZIP
  const handleExportAllZip = async () => {
    if (items.length === 0) return;
    const zip = new JSZip();

    for (const item of items) {
      const data = item.kpfData || item.pkfData || new Uint8Array();
      zip.file(item.fileName, data);
      if (item.wavData) {
        const wavName = item.fileName.replace(/\.(kpf|pkf)$/i, '.wav');
        zip.file(wavName, item.wavData);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Export_Stockage_PKF_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Metrics Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>{lang === 'fr' ? 'Espace Stockage des Livres Kindle .KPF' : 'Kindle .KPF Storage Space'}</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {lang === 'fr' ? 'Stockage Local Persistant' : 'Persistent Storage'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 font-mono">
              <span>{items.length} {lang === 'fr' ? 'livre(s) stocké(s)' : 'book(s) stored'}</span>
              <span> · </span>
              <span className="text-neutral-200">{formattedSize} {lang === 'fr' ? 'consommés' : 'used'}</span>
              <span> · </span>
              <span className="text-neutral-400">IndexedDB sans limitation de session</span>
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={loadItems}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors"
            title={lang === 'fr' ? 'Rafraîchir' : 'Refresh'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {items.length > 0 && (
            <>
              <button
                onClick={handleExportAllZip}
                className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold border border-neutral-700 flex items-center gap-2 transition-colors"
              >
                <FolderArchive className="w-4 h-4 text-cyan-400" />
                <span>{lang === 'fr' ? 'Exporter tout le Storage (.ZIP)' : 'Export All (.ZIP)'}</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/40 flex items-center gap-1.5 transition-colors"
                title={lang === 'fr' ? 'Vider le stockage' : 'Clear storage'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'fr' ? 'Vider' : 'Clear'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification Bar */}
      {actionSuccess && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>
              {lang === 'fr' ? 'Fichier téléchargé depuis le Storage :' : 'Downloaded from Storage:'} <strong>{actionSuccess}</strong>
            </span>
          </div>
          <span className="font-mono text-emerald-400">OK</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === 'fr' ? 'Rechercher un fichier .pkf ou PDF...' : 'Search .pkf or PDF...'}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          {[
            { id: 'all', label: lang === 'fr' ? 'Tous les formats' : 'All formats' },
            { id: 'kpf-kindle', label: 'Amazon Kindle (.KPF)' },
            { id: 'pkf-audition', label: 'Adobe Audition (.PKF)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${
                filterType === f.id
                  ? 'bg-neutral-800 text-cyan-400 font-semibold border border-neutral-700'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stored items list */}
      {isLoading ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center text-xs font-mono text-neutral-400 animate-pulse">
          {lang === 'fr' ? 'Chargement de l’espace stockage...' : 'Loading storage...'}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 mx-auto flex items-center justify-center text-neutral-500">
            <HardDrive className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-200">
            {lang === 'fr' ? 'Aucun fichier dans le stockage' : 'No files in storage'}
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            {lang === 'fr'
              ? 'Lorsque vous convertissez un PDF en PKF, cliquez sur « Sauvegarder dans le Storage » pour conserver vos fichiers et les retrouver ici à tout moment.'
              : 'When you convert a PDF to PKF, click "Save to Storage" to keep your files here indefinitely.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700/90 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
            >
              {/* Left Item Details */}
              <div className="flex items-start gap-3.5 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  item.formatType === 'pkf-audition'
                    ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-400'
                    : item.formatType === 'pkf-package'
                    ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400'
                    : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                }`}>
                  {item.formatType === 'pkf-audition' && <Music className="w-5 h-5" />}
                  {item.formatType === 'pkf-package' && <Archive className="w-5 h-5" />}
                  {item.formatType === 'pkf-security' && <ShieldCheck className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-semibold text-neutral-100 truncate">
                      {item.fileName}
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
                      {item.formatLabel}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 mt-1 font-mono">
                    <span>PDF : <strong className="text-neutral-300">{item.originalPdfName}</strong></span>
                    <span>·</span>
                    <span>{(item.fileSizeBytes / 1024).toFixed(1)} KB</span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
                
                {/* Download Amazon KDP EPUB if available */}
                {item.epubData && (
                  <button
                    onClick={() => downloadFile(item.epubData!, item.epubFileName || item.fileName.replace(/\.kpf$/i, '_Amazon_KDP.epub'), 'application/epub+zip')}
                    className="px-3 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-neutral-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-400/50"
                    title={lang === 'fr' ? 'Télécharger .EPUB pour Amazon KDP (100% Validé)' : 'Download .EPUB for Amazon KDP'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.EPUB (KDP)</span>
                  </button>
                )}

                {/* Download Amazon KDP Word DOCX if available */}
                {item.docxData && (
                  <button
                    onClick={() => downloadFile(item.docxData!, item.docxFileName || item.fileName.replace(/\.(epub|kpf)$/i, '_Amazon_KDP.docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
                    className="px-3 py-1.5 bg-sky-600/90 hover:bg-sky-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-sky-400/50"
                    title={lang === 'fr' ? 'Télécharger .DOCX (Word) pour Amazon KDP' : 'Download .DOCX for Amazon KDP'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.DOCX (KDP)</span>
                  </button>
                )}

                {/* Download Book / KPF */}
                <button
                  onClick={() => downloadFile(item.kpfData || item.pkfData || new Uint8Array(), item.fileName)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={lang === 'fr' ? 'Télécharger le fichier' : 'Download file'}
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{item.fileName.toLowerCase().endsWith('.kpf') ? '.KPF' : '.PKF'}</span>
                </button>

                {/* Download WAV if available */}
                {item.wavData && (
                  <button
                    onClick={() => downloadFile(item.wavData!, item.fileName.replace(/\.(kpf|pkf)$/i, '.wav'), 'audio/wav')}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-semibold border border-neutral-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={lang === 'fr' ? 'Télécharger la piste audio WAV' : 'Download WAV track'}
                  >
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                    <span>.WAV</span>
                  </button>
                )}

                {/* Inspect in Inspector */}
                <button
                  onClick={() => onInspectFile({ name: item.fileName, bytes: item.kpfData || item.pkfData || new Uint8Array() })}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium border border-neutral-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title={lang === 'fr' ? 'Inspecter dans le simulateur' : 'Inspect file'}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === 'fr' ? 'Inspecter' : 'Inspect'}</span>
                </button>

                {/* Mobile Phone Download Button */}
                <button
                  onClick={() => setSelectedMobileItem(item)}
                  className="p-1.5 text-neutral-400 hover:text-emerald-400 hover:bg-neutral-800 rounded-lg border border-neutral-700/80 transition-colors cursor-pointer"
                  title={lang === 'fr' ? 'Télécharger sur mon téléphone' : 'Download to phone'}
                >
                  <Smartphone className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item.id, item.fileName)}
                  className="p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                  title={lang === 'fr' ? 'Supprimer du stockage' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile Download Modal for Stored Item */}
      {selectedMobileItem && (
        <MobileDownloadModal
          isOpen={!!selectedMobileItem}
          onClose={() => setSelectedMobileItem(null)}
          fileName={selectedMobileItem.epubFileName || selectedMobileItem.fileName}
          fileBytes={selectedMobileItem.epubData || selectedMobileItem.kpfData || selectedMobileItem.pkfData || new Uint8Array()}
          epubBytes={selectedMobileItem.epubData}
          epubFileName={selectedMobileItem.epubFileName}
          docxBytes={selectedMobileItem.docxData}
          docxFileName={selectedMobileItem.docxFileName}
          kpfBytes={selectedMobileItem.kpfData}
          kpfFileName={selectedMobileItem.fileName}
          wavBytes={selectedMobileItem.wavData}
          formatLabel={selectedMobileItem.formatLabel}
          lang={lang}
        />
      )}
    </div>
  );
};
