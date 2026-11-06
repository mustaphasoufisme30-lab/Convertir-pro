/**
 * PKF file inspector and decoder
 */

import { PkfInspectionResult } from '../types/converter';

export function inspectPkfFile(fileName: string, bytes: Uint8Array): PkfInspectionResult {
  const fileSizeBytes = bytes.length;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  // Read first 4 bytes signature
  let signature = '';
  for (let i = 0; i < Math.min(4, bytes.length); i++) {
    signature += String.fromCharCode(bytes[i]);
  }

  // 1. Adobe Audition Peak File ('PK01' or 'PK02' or 'PEAK')
  if (signature === 'PK01' || signature === 'PK02' || signature.startsWith('PE')) {
    try {
      const version = bytes.length >= 8 ? view.getUint32(4, true) : 1;
      const channels = bytes.length >= 10 ? view.getUint16(8, true) : 1;
      const sampleRate = bytes.length >= 16 ? view.getUint32(12, true) : 44100;
      const samplesPerPeak = bytes.length >= 20 ? view.getUint32(16, true) : 256;
      const peakCount = bytes.length >= 24 ? view.getUint32(20, true) : 0;

      // Extract peaks
      const peaks: { min: number; max: number }[] = [];
      let offset = 24;
      const maxToRead = Math.min(peakCount, 500); // limit to 500 for fast UI display
      for (let i = 0; i < maxToRead && offset + 4 <= bytes.length; i++) {
        const minVal = view.getInt16(offset, true) / 32768;
        const maxVal = view.getInt16(offset + 2, true) / 32768;
        peaks.push({ min: minVal, max: maxVal });
        offset += 4;
      }

      return {
        fileName,
        fileSizeBytes,
        formatType: 'audition-peak',
        formatName: 'Adobe Audition Peak File (Crête Audio)',
        description: `Fichier de données de crête audio généré par Adobe Audition / Premiere Pro. Stocke la forme d'onde visuelle pour un affichage instantané sans recalculer l'audio.`,
        headerSignature: signature,
        channels,
        sampleRate,
        samplesPerPeak,
        peakCount,
        peaks,
        diagnosticAdvice: `Ce fichier .pkf ne contient PAS de texte ni de pages de document. C'est un cache technique lié à un fichier audio (.wav ou .mp3). Vous pouvez le supprimer sans risque : Adobe Audition le recréera si le fichier audio est présent.`
      };
    } catch {
      // Fallback below
    }
  }

  // 2. PKF Document Package Container ('PKF1')
  if (signature === 'PKF1') {
    try {
      let offset = 4;
      const manifestLen = view.getUint32(offset, true);
      offset += 4;
      const manifestBytes = bytes.slice(offset, offset + manifestLen);
      const manifestStr = new TextDecoder().decode(manifestBytes);
      const manifest = JSON.parse(manifestStr);
      offset += manifestLen;

      const textLen = view.getUint32(offset, true);
      offset += 4 + textLen;

      let extractedPdfAvailable = false;
      let extractedPdfBytes: Uint8Array | undefined;

      if (offset + 4 <= bytes.length) {
        const pdfLen = view.getUint32(offset, true);
        offset += 4;
        if (offset + pdfLen <= bytes.length) {
          extractedPdfBytes = bytes.slice(offset, offset + pdfLen);
          extractedPdfAvailable = true;
        }
      }

      return {
        fileName,
        fileSizeBytes,
        formatType: 'package-container',
        formatName: 'Conteneur Document PKF (Package File)',
        description: `Archive sécurisée encapsulant le document PDF original, ses métadonnées, son texte extrait et son empreinte cryptographique SHA-256.`,
        headerSignature: signature,
        packageManifest: {
          originalDocument: manifest.document?.fileName || 'Document',
          pageCount: manifest.document?.pageCount,
          wordCount: manifest.document?.totalWords,
          sha256: manifest.document?.sha256Digest,
          createdAt: manifest.createdAt
        },
        extractedPdfAvailable,
        extractedPdfBytes,
        diagnosticAdvice: `Ce conteneur PKF encapsule le document complet. Vous pouvez extraire le fichier PDF original en un clic ci-dessous.`
      };
    } catch {
      // Fallback
    }
  }

  // 3. PKF Security / Cryptographic Signature ('PKFS')
  if (signature === 'PKFS') {
    try {
      const certBytes = bytes.slice(4);
      const certStr = new TextDecoder().decode(certBytes);
      const cert = JSON.parse(certStr);

      return {
        fileName,
        fileSizeBytes,
        formatType: 'cryptographic-key',
        formatName: 'Certificat Cryptographique PKF',
        description: `Certificat d'intégrité et empreinte SHA-256 pour validation de document PDF.`,
        headerSignature: signature,
        packageManifest: {
          originalDocument: cert.documentFingerprint?.fileName,
          pageCount: cert.documentFingerprint?.pageCount,
          sha256: cert.documentFingerprint?.rootHash,
          createdAt: cert.issuedAt
        },
        diagnosticAdvice: `Ce fichier contient la signature et les sommes de contrôle SHA-256 du document d'origine.`
      };
    } catch {
      // Fallback
    }
  }

  // 4. Unknown Binary File
  return {
    fileName,
    fileSizeBytes,
    formatType: 'unknown',
    formatName: 'Fichier PKF Générique / Non standard',
    description: `Ce fichier porte l'extension .pkf mais sa signature (${signature.trim() || 'inconnue'}) ne correspond pas aux standards Adobe Audition ou Package connus.`,
    headerSignature: signature,
    diagnosticAdvice: `Si ce fichier provient d'un logiciel spécialisé (comme SecretAgent ou un outil CAO propriétaire), il nécessite le logiciel d'origine pour être interprété.`
  };
}
