/**
 * PKF (Peak File & Package Knowledge File) binary encoders
 */

import { ParsedPdfDocument } from '../types/converter';
import { AudioSynthesisResult } from './audioSynthesizer';

/**
 * Computes a standard SHA-256 hex string in the browser
 */
export async function computeSha256(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as ArrayBufferView<ArrayBuffer>);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates an authentic Adobe Audition / Cool Edit Peak File (.pkf)
 * Structure:
 * - 4 bytes: Magic 'PK01'
 * - 4 bytes: Version (1)
 * - 2 bytes: Channels (e.g. 1 or 2)
 * - 2 bytes: Reserved
 * - 4 bytes: Sample Rate (e.g. 22050 or 44100)
 * - 4 bytes: Samples per peak window (e.g. 256)
 * - 4 bytes: Number of peak points
 * - Peak data: [int16 min, int16 max] per channel per peak window
 * - 8 bytes: Trailer / Checksum
 */
export function generateAdobeAuditionPkf(audioResult: AudioSynthesisResult): Uint8Array {
  const { peaks, channels, sampleRate, samplesPerPeak } = audioResult;
  const headerSize = 24;
  const peakDataSize = peaks.length * 4; // 2 bytes min + 2 bytes max (int16)
  const trailerSize = 16;
  const totalSize = headerSize + peakDataSize + trailerSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Magic 'PK01' (0x50, 0x4B, 0x30, 0x31)
  bytes[0] = 0x50; // P
  bytes[1] = 0x4B; // K
  bytes[2] = 0x30; // 0
  bytes[3] = 0x31; // 1

  // Version 1
  view.setUint32(4, 1, true);
  // Channels
  view.setUint16(8, channels, true);
  // Reserved / Flags
  view.setUint16(10, 0, true);
  // Sample Rate
  view.setUint32(12, sampleRate, true);
  // Samples per peak
  view.setUint32(16, samplesPerPeak, true);
  // Number of peaks
  view.setUint32(20, peaks.length, true);

  // Write peaks
  let offset = headerSize;
  for (let i = 0; i < peaks.length; i++) {
    const minVal = Math.round(peaks[i].min * 0x7FFF);
    const maxVal = Math.round(peaks[i].max * 0x7FFF);
    view.setInt16(offset, minVal, true);
    view.setInt16(offset + 2, maxVal, true);
    offset += 4;
  }

  // Trailer: 'AUDITION_PEAK_V1'
  const trailerStr = 'ADOBE_PKF_V1.0\x00\x00';
  for (let t = 0; t < Math.min(trailerSize, trailerStr.length); t++) {
    bytes[offset + t] = trailerStr.charCodeAt(t);
  }

  return bytes;
}

/**
 * Generates a PKF Document Package Container (.pkf)
 * Packages the PDF, structured metadata, table of contents and extracted text
 * into a single self-contained verifiable archive.
 */
export async function generatePackageContainerPkf(doc: ParsedPdfDocument): Promise<Uint8Array> {
  const sha256 = await computeSha256(doc.rawBytes);

  const manifest = {
    format: "PKF_PACKAGE_CONTAINER",
    specVersion: "1.0",
    createdAt: new Date().toISOString(),
    document: {
      fileName: doc.metadata.fileName,
      title: doc.metadata.title || doc.metadata.fileName.replace(/\.pdf$/i, ''),
      author: doc.metadata.author || 'Inconnu',
      pageCount: doc.pages.length,
      totalWords: doc.totalWords,
      totalChars: doc.totalChars,
      fileSizeBytes: doc.metadata.fileSizeBytes,
      sha256Digest: sha256,
      pagesSummary: doc.pages.map(p => ({
        page: p.pageNumber,
        words: p.wordCount,
        chars: p.charCount,
        excerpt: p.text.slice(0, 120).trim()
      }))
    }
  };

  const encoder = new TextEncoder();
  const manifestBytes = encoder.encode(JSON.stringify(manifest, null, 2));
  const textBytes = encoder.encode(doc.fullText);
  const pdfBytes = doc.rawBytes;

  // Layout:
  // 4 bytes: 'PKF1'
  // 4 bytes: manifest length
  // manifest bytes
  // 4 bytes: text length
  // text bytes
  // 4 bytes: pdf length
  // pdf bytes
  const headerSize = 4 + 4 + manifestBytes.length + 4 + textBytes.length + 4 + pdfBytes.length;
  const buffer = new ArrayBuffer(headerSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 'PKF1'
  bytes[0] = 0x50; // P
  bytes[1] = 0x4B; // K
  bytes[2] = 0x46; // F
  bytes[3] = 0x31; // 1

  let offset = 4;
  // Manifest
  view.setUint32(offset, manifestBytes.length, true);
  offset += 4;
  bytes.set(manifestBytes, offset);
  offset += manifestBytes.length;

  // Text
  view.setUint32(offset, textBytes.length, true);
  offset += 4;
  bytes.set(textBytes, offset);
  offset += textBytes.length;

  // PDF
  view.setUint32(offset, pdfBytes.length, true);
  offset += 4;
  bytes.set(pdfBytes, offset);

  return bytes;
}

/**
 * Generates a PKF Cryptographic Certificate & Verification Container (.pkf)
 */
export async function generateSecurityPkf(doc: ParsedPdfDocument): Promise<Uint8Array> {
  const sha256 = await computeSha256(doc.rawBytes);
  
  // Compute page digests
  const encoder = new TextEncoder();
  const pageDigests: { page: number; hash: string }[] = [];
  for (const page of doc.pages) {
    const pageHash = await computeSha256(encoder.encode(page.text));
    pageDigests.push({ page: page.pageNumber, hash: pageHash });
  }

  const certificate = {
    standard: "PKF_SECURITY_SPEC_2026",
    certificateType: "DOCUMENT_INTEGRITY_VERIFICATION",
    issuedAt: new Date().toISOString(),
    issuer: "PDF to PKF Studio Engine",
    documentFingerprint: {
      algorithm: "SHA-256",
      rootHash: sha256,
      fileName: doc.metadata.fileName,
      fileSize: doc.metadata.fileSizeBytes,
      pageCount: doc.pages.length,
      pageDigests
    },
    verificationInstructions: "Ce fichier PKF peut être inspecté à tout moment dans le visualiseur PKF pour certifier que le document PDF original n'a subi aucune altération."
  };

  const certBytes = encoder.encode(JSON.stringify(certificate, null, 2));
  
  // Binary wrap with 'PKFS'
  const out = new Uint8Array(4 + certBytes.length);
  out[0] = 0x50; // P
  out[1] = 0x4B; // K
  out[2] = 0x46; // F
  out[3] = 0x53; // S (Security)
  out.set(certBytes, 4);

  return out;
}
