/** 本机「相机方向锁定」配置（localStorage，按设备生效） */

const KEY_ENABLED = 'labdata_camera_orientation_enabled';
const KEY_ROTATION = 'labdata_camera_orientation_rotation';

/** @typedef {0 | 90 | 180 | 270} CameraRotation */

/** @typedef {{ enabled: boolean, rotation: CameraRotation }} CameraOrientationConfig */

export const CAMERA_ROTATION_OPTIONS = [
  { value: 0, label: '不旋转（0°）' },
  { value: 90, label: '顺时针 90°' },
  { value: 180, label: '180°' },
  { value: 270, label: '顺时针 270°' },
];

const DEFAULT_CONFIG = /** @type {CameraOrientationConfig} */ ({ enabled: false, rotation: 0 });

function parseRotation(raw) {
  const n = Number(raw);
  return n === 90 || n === 180 || n === 270 ? n : 0;
}

/**
 * 读取相机方向锁定配置
 * @returns {CameraOrientationConfig}
 */
export function getCameraOrientationConfig() {
  try {
    const enabled = localStorage.getItem(KEY_ENABLED) === '1';
    const rotation = parseRotation(localStorage.getItem(KEY_ROTATION));
    return { enabled, rotation };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存相机方向锁定配置（部分更新）
 * @param {Partial<CameraOrientationConfig>} partial
 * @returns {CameraOrientationConfig}
 */
export function setCameraOrientationConfig(partial) {
  const current = getCameraOrientationConfig();
  const next = {
    enabled: partial.enabled != null ? !!partial.enabled : current.enabled,
    rotation: partial.rotation != null ? parseRotation(partial.rotation) : current.rotation,
  };
  try {
    localStorage.setItem(KEY_ENABLED, next.enabled ? '1' : '0');
    localStorage.setItem(KEY_ROTATION, String(next.rotation));
  } catch {
    /* 忽略存储失败 */
  }
  return next;
}

/**
 * 是否应对新拍/新选图片应用旋转（已校正过的归档图不再旋转）
 * @param {{ orientationApplied?: boolean }} attachment
 */
export function shouldApplyOrientation(attachment) {
  if (attachment?.orientationApplied) return false;
  const { enabled, rotation } = getCameraOrientationConfig();
  return enabled && rotation !== 0;
}

export { KEY_ENABLED, KEY_ROTATION, DEFAULT_CONFIG };
