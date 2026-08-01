const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.6;

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
}

export async function compressImage(file: File): Promise<CompressionResult> {
  const originalSize = file.size;

  if (file.type === 'application/pdf' || file.type === 'image/heic') {
    return { file, originalSize, compressedSize: originalSize };
  }

  if (!file.type.startsWith('image/')) {
    return { file, originalSize, compressedSize: originalSize };
  }

  const img = await loadImage(file);
  const { width, height } = fitDimensions(img.width, img.height, MAX_DIMENSION);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY);
  const compressed = new File([blob], stripExtension(file.name) + '.jpg', {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  return {
    file: compressed,
    originalSize,
    compressedSize: compressed.size,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function fitDimensions(
  origW: number,
  origH: number,
  maxDim: number,
): { width: number; height: number } {
  if (origW <= maxDim && origH <= maxDim) {
    return { width: origW, height: origH };
  }
  const ratio = Math.min(maxDim / origW, maxDim / origH);
  return {
    width: Math.round(origW * ratio),
    height: Math.round(origH * ratio),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      type,
      quality,
    );
  });
}

function stripExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.substring(0, dot) : name;
}
