/**
 * Standards-compliant EPUB 3.0 generator from ParsedPdfDocument using JSZip
 */

import JSZip from 'jszip';
import { ParsedPdfDocument } from '../types/converter';

export async function generateEpubFromPdf(doc: ParsedPdfDocument): Promise<Blob> {
  const zip = new JSZip();

  // 1. mimetype (MUST be stored uncompressed, first file in ZIP)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  const title = doc.metadata.title || doc.metadata.fileName.replace(/\.pdf$/i, '');
  const author = doc.metadata.author || 'Auteur Document';
  const bookId = 'urn:uuid:' + (crypto.randomUUID ? crypto.randomUUID() : 'pkf-doc-' + Date.now());

  // 3. OEBPS/style.css
  const styleCss = `
body {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  line-height: 1.6;
  margin: 1.5rem;
  color: #1e293b;
  background-color: #ffffff;
}
h1 {
  font-size: 1.75rem;
  color: #0f172a;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0.5rem;
}
h2 {
  font-size: 1.25rem;
  color: #334155;
  margin-top: 1.5rem;
}
p {
  margin-bottom: 1rem;
  text-align: justify;
}
.page-badge {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 1rem;
}
`;
  zip.file('OEBPS/style.css', styleCss);

  // 4. Generate chapters for each page
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  const ncxNavPoints: string[] = [];

  manifestItems.push('<item id="style" href="style.css" media-type="text/css"/>');
  manifestItems.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');

  for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages[i];
    const pageNum = page.pageNumber;
    const itemId = `chapter_${pageNum}`;
    const fileName = `chapter_${pageNum}.xhtml`;

    manifestItems.push(`<item id="${itemId}" href="${fileName}" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${itemId}"/>`);
    ncxNavPoints.push(`
    <navPoint id="navPoint-${pageNum}" playOrder="${pageNum}">
      <navLabel><text>Page ${pageNum}</text></navLabel>
      <content src="${fileName}"/>
    </navPoint>`);

    // Escape HTML text
    const paragraphs = page.text
      .split('\n\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${escapeXml(p)}</p>`)
      .join('\n');

    const chapterXhtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr">
<head>
  <title>${escapeXml(title)} - Page ${pageNum}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="page-badge">PAGE ${pageNum} SUR ${doc.pages.length}</div>
  ${paragraphs || '<p><em>Page sans contenu textuel détectable.</em></p>'}
</body>
</html>`;

    zip.file(`OEBPS/${fileName}`, chapterXhtml);
  }

  // 5. OEBPS/content.opf
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:language>fr</dc:language>
    <dc:identifier id="BookID">${bookId}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;
  zip.file('OEBPS/content.opf', contentOpf);

  // 6. OEBPS/toc.ncx
  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="${doc.pages.length}"/>
    <meta name="dtb:maxPageNumber" content="${doc.pages.length}"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    ${ncxNavPoints.join('')}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', tocNcx);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip'
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
