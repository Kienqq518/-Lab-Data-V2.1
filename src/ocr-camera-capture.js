/**
 * OCR 拍照 / 相册选图：HTML file input 封装
 * · 相册：accept=image/*，无 capture，走系统图库
 * · 相机：accept=image/* + capture=environment，平板/手机优先调起后置摄像头
 */

/** @param {React.RefObject<HTMLInputElement>} ref */
export function openGalleryPicker(ref) {
  ref.current?.click();
}

/** @param {React.RefObject<HTMLInputElement>} ref */
export function openCameraCapture(ref) {
  ref.current?.click();
}

/**
 * @param {React.ChangeEvent<HTMLInputElement>} event
 * @returns {File | null}
 */
export function readPickedImageFile(event) {
  const file = event.target.files?.[0] || null;
  event.target.value = '';
  return file;
}

export const OCR_GALLERY_INPUT_PROPS = {
  type: 'file',
  accept: 'image/*',
};

export const OCR_CAMERA_INPUT_PROPS = {
  type: 'file',
  accept: 'image/*',
  capture: 'environment',
};
