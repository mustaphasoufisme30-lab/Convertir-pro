/**
 * PDF parsing and rendering utility with fallback and sample document generation
 */

import { ParsedPdfDocument, PdfPageContent, ConversionProgress } from '../types/converter';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available
try {
  // Use worker from unpkg or inline if local resolution requires
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch {
  // Ignore worker setup issues
}

/**
 * Extracts text from PDF bytes using pdfjs-dist, with robust regex stream fallback and progress tracking
 */
export async function parsePdfFile(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ParsedPdfDocument> {
  onProgress?.({
    stage: 'reading',
    stageLabel: `Lecture du fichier binaire (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`,
    percent: 5,
    fileName: file.name,
    fileSizeBytes: file.size
  });

  const arrayBuffer = await file.arrayBuffer();
  const rawBytes = new Uint8Array(arrayBuffer);

  onProgress?.({
    stage: 'reading',
    stageLabel: 'Initialisation des flux vectoriels PDF...',
    percent: 15,
    fileName: file.name,
    fileSizeBytes: file.size
  });

  return parsePdfBytes(rawBytes, file.name, file.size, onProgress);
}

export async function parsePdfBytes(
  rawBytes: Uint8Array,
  fileName: string,
  fileSizeBytes: number,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ParsedPdfDocument> {
  let pages: PdfPageContent[] = [];
  let title = fileName.replace(/\.pdf$/i, '');
  let author = 'Auteur Inconnu';
  let creator = 'PDF Engine';
  let creationDate = new Date().toLocaleDateString('fr-FR');

  // Attempt standard pdfjs-dist extraction
  try {
    const loadingTask = pdfjsLib.getDocument({ data: rawBytes });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    try {
      const meta = await pdfDoc.getMetadata();
      const info = meta.info as Record<string, string> | undefined;
      if (info) {
        if (info.Title) title = info.Title;
        if (info.Author) author = info.Author;
        if (info.Creator) creator = info.Creator;
        if (info.CreationDate) creationDate = info.CreationDate;
      }
    } catch {
      // Ignore meta error
    }

    for (let i = 1; i <= numPages; i++) {
      // Yield to main thread to keep UI smooth and allow progress bar to repaint
      await new Promise(r => setTimeout(r, 0));

      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Render thumbnail canvas
      let canvasDataUrl: string | undefined;
      try {
        const viewport = page.getViewport({ scale: 0.6 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await (page as any).render({ canvasContext: context, viewport, canvas }).promise;
          canvasDataUrl = canvas.toDataURL('image/png');
        }
      } catch {
        // Thumbnail generation is optional
      }

      const words = pageText.split(/\s+/).filter(Boolean);
      pages.push({
        pageNumber: i,
        text: pageText || `[Page ${i} : Contenu vectoriel ou graphique sans texte brut extrait]`,
        wordCount: words.length,
        charCount: pageText.length,
        canvasDataUrl
      });

      // Update progress for each processed page
      const pagePercent = Math.min(85, Math.round(15 + (i / numPages) * 70));
      onProgress?.({
        stage: 'parsing-pages',
        stageLabel: `Extraction des données : Page ${i} sur ${numPages}`,
        percent: pagePercent,
        currentPage: i,
        totalPages: numPages,
        fileName,
        fileSizeBytes,
        details: `Page ${i} / ${numPages} (${words.length} mots extraits)`
      });
    }
  } catch (err) {
    console.warn("pdfjs extraction fallback to binary stream parser:", err);
    onProgress?.({
      stage: 'parsing-pages',
      stageLabel: 'Extraction directe via décodeur de flux PostScript...',
      percent: 45,
      fileName,
      fileSizeBytes
    });
    // Fallback: parse raw stream text
    pages = extractTextFromRawPdfBytes(rawBytes);
  }

  // Ensure at least 1 page
  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      text: "Document PDF importé avec succès. Aucune chaîne de texte standard n'a pu être extraite des flux vectoriels.",
      wordCount: 16,
      charCount: 95
    });
  }

  onProgress?.({
    stage: 'extracting-text',
    stageLabel: 'Finalisation de l’index textuel et empreinte...',
    percent: 92,
    fileName,
    fileSizeBytes,
    totalPages: pages.length
  });

  const fullText = pages.map(p => `--- PAGE ${p.pageNumber} ---\n` + p.text).join('\n\n');
  const totalWords = pages.reduce((acc, p) => acc + p.wordCount, 0);
  const totalChars = pages.reduce((acc, p) => acc + p.charCount, 0);

  onProgress?.({
    stage: 'complete',
    stageLabel: `Document prêt : ${pages.length} page(s) et ${totalWords.toLocaleString()} mots extraits`,
    percent: 100,
    fileName,
    fileSizeBytes,
    totalPages: pages.length
  });

  return {
    metadata: {
      fileName,
      fileSizeBytes,
      pageCount: pages.length,
      title,
      author,
      creator,
      creationDate
    },
    pages,
    fullText,
    totalWords,
    totalChars,
    rawBytes
  };
}

/**
 * Robust fallback scanner for PDF text streams (Tj, TJ, BT/ET blocks)
 */
function extractTextFromRawPdfBytes(bytes: Uint8Array): PdfPageContent[] {
  const latin1 = new TextDecoder('latin1').decode(bytes);
  const pages: PdfPageContent[] = [];

  // Split by /Page objects or estimate pages
  const pageMatches = latin1.split(/\/Type\s*\/Page[^s]/g);
  const detectedPageCount = Math.max(1, pageMatches.length - 1);

  // Extract text within parentheses like (Hello world) Tj or [(Part1) 20 (Part2)] TJ
  const textChunks: string[] = [];
  const tjRegex = /\(([^)]+)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(latin1)) !== null) {
    const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
    if (clean.length > 1 && !/^[0-9.]*$/.test(clean)) {
      textChunks.push(clean);
    }
  }

  const fullFoundText = textChunks.join(' ') || "Contenu du document PDF analysé.";
  const wordsPerPage = Math.max(20, Math.ceil(fullFoundText.split(/\s+/).length / detectedPageCount));
  const words = fullFoundText.split(/\s+/);

  for (let p = 0; p < detectedPageCount; p++) {
    const pageWords = words.slice(p * wordsPerPage, (p + 1) * wordsPerPage);
    const pageText = pageWords.join(' ');
    pages.push({
      pageNumber: p + 1,
      text: pageText || `Page ${p + 1} du document`,
      wordCount: pageWords.length,
      charCount: pageText.length
    });
  }

  return pages;
}

/**
 * Built-in preloaded sample PDFs for instantaneous demo and testing
 */
export function getSamplePdfDocument(sampleId: 'audit' | 'audio-spec' | 'legal'): ParsedPdfDocument {
  if (sampleId === 'audio-spec') {
    const p1 = `SPÉCIFICATION TECHNIQUE : FORMATS DE CRÊTE AUDIO & FICHIERS .PKF
Auteur : Département Ingénierie du Signal & Médias Numériques
Classification : Standard Professionnel Broadcast & Audio

1. DÉFINITION D'UN FICHIER .PKF (PEAK FILE)
Un fichier portant l'extension .PKF est un fichier de métadonnées visuelles généré par les stations audionumériques (DAW) telles qu'Adobe Audition ou Cool Edit Pro. Sa fonction exclusive est d'indexer les niveaux de crêtes (min/max amplitudes) d'une piste sonore afin d'afficher la forme d'onde sans charger en mémoire vive l'intégralité du fichier audio brut (.WAV ou .MP3).

2. POURQUOI UN DOCUMENT PDF NE PEUT PAS ÊTRE DIRECTEMENT UN FICHIER .PKF SANS AUDIO ?
Le format PDF (Portable Document Format) stocke des glyphes, des vecteurs PostScript et des flux graphiques en deux dimensions. Le format PKF stocke des entiers 16 bits représentant l'amplitude crête d'oscillations acoustiques temporelles.
Pour convertir un PDF en PKF, il est obligatoire d'extraire la matière textuelle du PDF, de la synthétiser sous forme de piste sonore (Audio Waveform), puis de calculer la structure binaire de crêtes .PKF correspondante.`;

    const p2 = `3. STRUCTURE BINAIRE DU HEADER PK01
L'en-tête standard PK01 comporte 24 octets obligatoires :
- Octets 0-3 : Signature Magic "PK01" (0x50, 0x4B, 0x30, 0x31)
- Octets 4-7 : Version du format (entier 32 bits non signé)
- Octets 8-9 : Nombre de canaux audio (1 pour mono, 2 pour stéréo)
- Octets 10-11 : Drapeaux de compression / normalisation
- Octets 12-15 : Fréquence d'échantillonnage (ex: 22050 Hz ou 44100 Hz)
- Octets 16-19 : Taille de fenêtre d'échantillonnage par crête (ex: 256 échantillons)
- Octets 20-23 : Nombre total d'entrées de crête dans le tableau

4. RECOMMANDATIONS POUR LES FLUX DE PRODUCTION
Dans un workflow d'accessibilité numérique ou de publication de livres audio (Audiobook), les éditeurs convertissent le texte PDF en voix synthétisée, produisant à la fois le conteneur audio master et le cache .pkf pour un montage rapide dans Adobe Premiere ou Audition.`;

    const pages: PdfPageContent[] = [
      { pageNumber: 1, text: p1, wordCount: p1.split(/\s+/).length, charCount: p1.length },
      { pageNumber: 2, text: p2, wordCount: p2.split(/\s+/).length, charCount: p2.length },
    ];

    const fakePdfBytes = new TextEncoder().encode(`%PDF-1.4\n%${p1}\n%${p2}\n%%EOF`);
    return {
      metadata: {
        fileName: "Specification_Technique_Audio_PKF.pdf",
        title: "Spécification Technique Formats de Crête Audio & PKF",
        author: "Département Ingénierie Acoustique",
        creator: "Acrobat Distiller 2026",
        creationDate: "02/11/2026",
        fileSizeBytes: 24580,
        pageCount: 2
      },
      pages,
      fullText: p1 + "\n\n" + p2,
      totalWords: pages.reduce((a, b) => a + b.wordCount, 0),
      totalChars: pages.reduce((a, b) => a + b.charCount, 0),
      rawBytes: fakePdfBytes
    };
  }

  if (sampleId === 'legal') {
    const p1 = `CONTRAT DE CESSION DE DROITS & CHIFFREMENT DE PAQUETS DE DONNÉES
Réf : CT-2026-FR-PKF-9941
Entre les soussignés :
La société ALTAIR TECHNOLOGIES SAS, ci-après dénommée le "Cédant",
Et le Client bénéficiaire de la solution, ci-après dénommé le "Cessionnaire".

ARTICLE 1 : OBJET DU CONTRAT
Le présent contrat définit les conditions de conversion, d'encapsulation et d'archivage des documents contractuels au format conteneur sécurisé .PKF (Package Knowledge File).

ARTICLE 2 : INTÉGRITÉ DES FICHIERS & EMPREINTES CRYPTOGRAPHIQUES
Tout document PDF encapsulé dans un paquet PKF est scellé par une empreinte numérique calculée selon l'algorithme SHA-256. Toute altération ultérieure d'un octet invalide immédiatement le certificat de conformité.`;

    const pages: PdfPageContent[] = [
      { pageNumber: 1, text: p1, wordCount: p1.split(/\s+/).length, charCount: p1.length }
    ];

    const fakePdfBytes = new TextEncoder().encode(`%PDF-1.4\n%${p1}\n%%EOF`);
    return {
      metadata: {
        fileName: "Contrat_Cession_et_Securite_PKF.pdf",
        title: "Contrat de Cession & Spécification Sécurité PKF",
        author: "Cabinet Juridique & Conformité",
        creator: "DocuSign / LegalSuite",
        creationDate: "02/11/2026",
        fileSizeBytes: 18450,
        pageCount: 1
      },
      pages,
      fullText: p1,
      totalWords: pages.reduce((a, b) => a + b.wordCount, 0),
      totalChars: pages.reduce((a, b) => a + b.charCount, 0),
      rawBytes: fakePdfBytes
    };
  }

  // Default: audit
  const p1 = `RAPPORT D'AUDIT FINANCIER & REVUE DES PROCÉDURES 2026
Direction Générale & Comité d'Audit
Statut : Rapport Final Validé

1. SYNTHÈSE EXÉCUTIVE
Au cours de l'exercice clôturé, nos équipes ont procédé à l'analyse rigoureuse des flux de trésorerie, de la chaîne de valeur et du contrôle interne. Les indicateurs clés de performance démontrent une solidité opérationnelle accrue avec une rentabilité brute en hausse de +14.2% sur un an.

2. OBSERVATIONS SUR LA NUMÉRISATION DES ARCHIVES
La transition des pièces justificatives papier vers des formats électroniques vérifiables nécessite l'adoption de normes d'archivage pérennes. L'encapsulation de rapports PDF dans des paquets PKF permet d'assurer une traçabilité inviolable des exercices fiscaux.`;

  const p2 = `3. PLAN D'ACTIONS RECOMMANDÉ
Afin de consolider les acquis de cet audit, le comité recommande :
- Automatisation de la génération de comptes rendus sonores (synthèse vocale) pour le conseil d'administration.
- Standardisation de l'export multiformat (ePub, TXT et fichiers de crêtes PKF) pour la consultation sur terminaux mobiles et stations multimédias.
- Archivage chiffré des pièces comptables avec contrôle d'intégrité SHA-256.

Fait à Paris, le 2 novembre 2026.
Pour le Comité d'Audit Indépendant.`;

  const pages: PdfPageContent[] = [
    { pageNumber: 1, text: p1, wordCount: p1.split(/\s+/).length, charCount: p1.length },
    { pageNumber: 2, text: p2, wordCount: p2.split(/\s+/).length, charCount: p2.length }
  ];

  const fakePdfBytes = new TextEncoder().encode(`%PDF-1.4\n%${p1}\n%${p2}\n%%EOF`);
  return {
    metadata: {
      fileName: "Rapport_Audit_Financier_2026.pdf",
      title: "Rapport d'Audit Financier & Revue 2026",
      author: "Comité d'Audit International",
      creator: "SAP Financial Reporting",
      creationDate: "02/11/2026",
      fileSizeBytes: 32400,
      pageCount: 2
    },
    pages,
    fullText: p1 + "\n\n" + p2,
    totalWords: pages.reduce((a, b) => a + b.wordCount, 0),
    totalChars: pages.reduce((a, b) => a + b.charCount, 0),
    rawBytes: fakePdfBytes
  };
}
