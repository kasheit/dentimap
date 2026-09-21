import { isImageFile, readImageText } from './ocr';

export const isPdfFile = (f: { type: string; name: string }) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name);
const isTextFile = (f: { type: string; name: string }) => f.type.startsWith('text/') || /\.(txt|text|md)$/i.test(f.name);

export const isSupportedDocument = (f: { type: string; name: string }) => isPdfFile(f) || isImageFile(f) || isTextFile(f);

// A page with fewer characters than this is treated as a scan and read with OCR instead.
const MIN_CHARS_PER_PAGE = 40;

async function readPdfText(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if ('str' in item) text += item.str + (item.hasEOL ? '\n' : ' ');
    }
    if (text.replace(/\s/g, '').length >= MIN_CHARS_PER_PAGE) {
      pages.push(text);
    } else {
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) pages.push(await readImageText(blob));
    }
    onProgress?.(i / doc.numPages);
  }
  await doc.destroy();
  return pages.join('\n\n');
}

export async function readDocumentText(file: File, onProgress?: (fraction: number) => void): Promise<string> {
  if (isPdfFile(file)) return readPdfText(file, onProgress);
  if (isImageFile(file)) return readImageText(file, onProgress);
  if (isTextFile(file)) return file.text();
  throw new Error('Unsupported file type. Use a PDF, an image or a text file.');
}
