import { getCameraOrientationConfig, shouldApplyOrientation } from './camera-orientation-config.js';

/**
 * 从 File/Blob 解码为 ImageBitmap（浏览器按 EXIF 扶正像素）
 * @param {Blob} blob
 */
async function loadOrientedBitmap(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      return await createImageBitmap(blob);
    }
  }
  return loadBitmapViaImageElement(blob);
}

/** @param {Blob} blob */
function loadBitmapViaImageElement(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

/**
 * Canvas 顺时针旋转
 * @param {ImageBitmap | HTMLImageElement} source
 * @param {0 | 90 | 180 | 270} degrees
 * @returns {Promise<Blob>}
 */
export async function rotateImage(source, degrees) {
  if (!degrees) {
    if (source instanceof ImageBitmap) {
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      canvas.getContext('2d').drawImage(source, 0, 0);
      return canvasToBlob(canvas);
    }
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    canvas.getContext('2d').drawImage(source, 0, 0);
    return canvasToBlob(canvas);
  }

  const w = source.width ?? source.naturalWidth;
  const h = source.height ?? source.naturalHeight;
  const canvas = document.createElement('canvas');
  const swap = degrees === 90 || degrees === 270;
  canvas.width = swap ? h : w;
  canvas.height = swap ? w : h;
  const ctx = canvas.getContext('2d');
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((degrees * Math.PI) / 180);
  ctx.drawImage(source, -w / 2, -h / 2);
  return canvasToBlob(canvas);
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas toBlob failed'));
    }, 'image/jpeg', 0.92);
  });
}

/**
 * 拍照/选图后、OCR 前：EXIF 扶正 + 用户设定旋转
 * @param {File | Blob} rawFile
 * @param {{ skipUserRotation?: boolean }} [options] 重新识别已归档图时 skipUserRotation=true
 * @returns {Promise<{ blob: Blob, objectUrl: string, orientationApplied: boolean }>}
 */
export async function prepareOcrImage(rawFile, options = {}) {
  const bitmap = await loadOrientedBitmap(rawFile);
  const { enabled, rotation } = getCameraOrientationConfig();
  const applyUser = !options.skipUserRotation && enabled && rotation !== 0;
  const blob = await rotateImage(bitmap, applyUser ? rotation : 0);
  if (bitmap.close) bitmap.close();
  const objectUrl = URL.createObjectURL(blob);
  return {
    blob,
    objectUrl,
    orientationApplied: applyUser || enabled,
  };
}

/**
 * OCR 采集统一入口：有图片则预处理，无图片则走 mock 延迟
 * @param {{
 *   file?: File | Blob | null,
 *   attachment?: { orientationApplied?: boolean } | null,
 *   mockDelayMs?: number,
 *   onProcessing?: () => void,
 * }} params
 */
export async function runOcrCapturePipeline(params) {
  const { file, attachment, mockDelayMs = 900 } = params;
  if (file) {
    const prepared = await prepareOcrImage(file, {
      skipUserRotation: !!attachment?.orientationApplied,
    });
    return { prepared, mock: false };
  }
  await new Promise((r) => setTimeout(r, mockDelayMs));
  return { prepared: null, mock: true };
}

export { shouldApplyOrientation, getCameraOrientationConfig };
