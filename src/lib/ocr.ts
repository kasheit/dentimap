/** Reads text out of a screenshot in the browser. The image is never uploaded anywhere. */

const MAX_WIDTH = 3200;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file is not an image the browser can open.'));
    };
    img.src = url;
  });
}

/** Upscale small screenshots, convert to grayscale, and invert dark-mode pages so the OCR sees dark text on light. */
export async function prepareImage(blob: Blob): Promise<Blob> {
  const img = await loadImage(blob);
  const scale = Math.min(3, Math.max(1, MAX_WIDTH / img.width), 2200 / Math.max(1, img.width) > 1 ? 2200 / img.width : 1);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  let sum = 0;
  for (let i = 0; i < px.length; i += 4) {
    const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = px[i + 1] = px[i + 2] = g;
    sum += g;
  }
  const invert = sum / (px.length / 4) < 110;
  if (invert) {
    for (let i = 0; i < px.length; i += 4) {
      px[i] = px[i + 1] = px[i + 2] = 255 - px[i];
    }
  }
  ctx.putImageData(data, 0, 0);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? blob), 'image/png'));
}

export async function readImageText(file: Blob, onProgress?: (fraction: number) => void): Promise<string> {
  const prepared = await prepareImage(file);
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    },
  });
  try {
    const { data } = await worker.recognize(prepared);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export const isImageFile = (f: { type: string }) => f.type.startsWith('image/');
