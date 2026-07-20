/** 单侧批注轨道展开宽度（加宽以保证 L4 底部长批注卡片完整展露） */
export const RAIL_WIDTH = 560;

/** 批注关闭时轨道占位宽度（仅放开关） */
export const RAIL_WIDTH_COLLAPSED = 52;

/** 手机框设计宽度 */
export const FRAME_WIDTH = 800;

/** 批注开启时舞台总宽度（下限；实际随视口宽度撑满浏览器） */
export const STAGE_WIDTH_ANNOTATED = FRAME_WIDTH + RAIL_WIDTH * 2;

/** 批注开启时按视口宽度计算舞台总宽，使左右轨道均分剩余留白 */
export function getAnnotatedStageWidth(viewportWidth) {
  return Math.max(viewportWidth, STAGE_WIDTH_ANNOTATED);
}

/** 批注关闭时舞台总宽度 */
export const STAGE_WIDTH_COLLAPSED = FRAME_WIDTH + RAIL_WIDTH_COLLAPSED * 2;

/**
 * 按锚点纵向位置将批注分配到左右轨道（交替分配，均衡两侧）
 * @param {Array} items 含 top 的批注项
 * @returns {{ left: Array, right: Array }}
 */
export function splitItemsToSides(items) {
  const sorted = [...items].sort((a, b) => a.top - b.top);
  const left = [];
  const right = [];
  sorted.forEach((item, index) => {
    if (index % 2 === 0) left.push(item);
    else right.push(item);
  });
  return { left, right };
}

/**
 * 根据实测高度纵向错开，确保气泡不重叠
 * @param {Array} items 已排序项
 * @param {Record<string, number>} heightMap id → 实测高度
 * @param {number} minGap 最小间距
 * @returns {Array}
 */
export function spreadNonOverlapping(items, heightMap, minGap = 14) {
  let lastBottom = -minGap;
  return items.map((item) => {
    const height = heightMap[item.id] || 240;
    let top = item.top;
    if (top < lastBottom + minGap) top = lastBottom + minGap;
    lastBottom = top + height;
    return { ...item, top, measuredHeight: height };
  });
}
