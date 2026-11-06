export type ConversionFormat = 
  | 'kpf-kindle'       // Amazon Kindle Package Format (.kpf)
  | 'pkf-audition'     // Adobe Audition Peak File (.pkf)
  | 'pkf-package'      // Document Package Container (.pkf)
  | 'pkf-security'     // Public Key / Integrity Certificate (.pkf)
  | 'epub'             // eBook (.epub)
  | 'txt'              // Plain text (.txt)
  | 'html';            // Formatted HTML (.html)

export interface PkfInspectionResult {
  fileName: string;
  fileSizeBytes: number;
  formatType: 'audition-peak' | 'package-container' | 'cryptographic-key' | 'unknown';
  formatName: string;
  description: string;
  headerSignature: string;
  channels?: number;
  sampleRate?: number;
  samplesPerPeak?: number;
  peakCount?: number;
  peaks?: { min: number; max: number }[];
  packageManifest?: {
    originalDocument?: string;
    pageCount?: number;
    wordCount?: number;
    sha256?: string;
    createdAt?: string;
  };
  extractedPdfAvailable?: boolean;
  extractedPdfBytes?: Uint8Array;
  diagnosticAdvice: string;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  pageCount: number;
  fileSizeBytes: number;
  fileName: string;
  sha256?: string;
}

export interface PdfPageContent {
  pageNumber: number;
  text: string;
  wordCount: number;
  charCount: number;
  canvasDataUrl?: string;
}

export interface ParsedPdfDocument {
  metadata: PdfMetadata;
  pages: PdfPageContent[];
  fullText: string;
  totalWords: number;
  totalChars: number;
  rawBytes: Uint8Array;
}

export interface ConversionProgress {
  stage: 'idle' | 'reading' | 'parsing-pages' | 'extracting-text' | 'synthesizing-audio' | 'calculating-peaks' | 'generating-pkf' | 'generating-kpf' | 'complete' | 'error';
  stageLabel: string;
  percent: number;
  currentPage?: number;
  totalPages?: number;
  fileName?: string;
  fileSizeBytes?: number;
  details?: string;
  errorMessage?: string;
}
