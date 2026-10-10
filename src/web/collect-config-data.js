/** 设备采集配置：上位机字段映射。L4 展示顺序单独存在 l4Visible。 */

import { EQUIPMENT } from './safety-data.js';

export const COLLECT_TABLES = [
  {
    id: 'dydldl_jyhd',
    label: 'dydldl_jyhd【电缆绝缘厚度】',
    thirdId: 'CL-dydxdl_jyhd',
  },
  {
    id: 'dldl_zldz',
    label: 'dldl_zldz【电力电缆-直流电阻】',
    thirdId: 'CL-dldl_zldz',
  },
];

export const THIRD_TABLES = [
  { id: 'CL-dydxdl_jyhd', label: 'CL-dydxdl_jyhd【电力电缆-10kV-绝缘厚度测量】' },
  { id: 'CL-dldl_zldz', label: 'CL-dldl_zldz【电力电缆-直流电阻】' },
];

/** 上位机字段目录。key 与中文名成对锁定，中文名必须与上位机一致才能映射。 */
export const HOST_FIELDS = {
  dydldl_jyhd: [
    { key: 'jyhd1', name: '绝缘厚度1' },
    { key: 'jyhd2', name: '绝缘厚度2' },
    { key: 'jyhd3', name: '绝缘厚度3' },
    { key: 'jyhd4', name: '绝缘厚度4' },
    { key: 'jyhd5', name: '绝缘厚度5' },
    { key: 'jyhdmin', name: '绝缘厚度最小值' },
    { key: 'jyhdavg', name: '绝缘厚度平均值' },
    { key: 'jyhdpd', name: '绝缘偏心度' },
    { key: 'jyhdwd', name: '温度' },
    { key: 'jyhdsd', name: '湿度（%）' },
    { key: 'jyhddevStatus2', name: '设备状态2' },
    { key: 'jyhdjl', name: '试验结论' },
    { key: 'jyhddevStatus', name: '设备状态' },
  ],
  dldl_zldz: [
    { key: 'wd', name: '温度' },
    { key: 'sd', name: '湿度' },
    { key: 'scdz', name: '实测电阻' },
    { key: 'dz20', name: '20℃电阻' },
  ],
};

const JYHD_KEYS = HOST_FIELDS.dydldl_jyhd.map((field) => field.key);

export const INITIAL_COLLECT_CONFIGS = [
  {
    id: 'cc1',
    equipmentId: 'ym02',
    tableId: 'dydldl_jyhd',
    thirdId: 'CL-dydxdl_jyhd',
    times: 3,
    remark: '',
    fieldKeys: JYHD_KEYS,
    l4Visible: [...JYHD_KEYS],
  },
  {
    id: 'cc2',
    equipmentId: 'lx05',
    tableId: 'dldl_zldz',
    thirdId: 'CL-dldl_zldz',
    times: 1,
    remark: '',
    fieldKeys: ['wd', 'sd', 'scdz', 'dz20'],
    l4Visible: ['wd', 'sd', 'scdz', 'dz20'],
  },
];

export function equipmentById(id) {
  return EQUIPMENT.find((item) => item.id === id) || null;
}

export function tableById(id) {
  return COLLECT_TABLES.find((item) => item.id === id) || null;
}

export function thirdById(id) {
  return THIRD_TABLES.find((item) => item.id === id) || null;
}

export function hostFields(tableId) {
  return HOST_FIELDS[tableId] || [];
}

export function fieldByKey(tableId, key) {
  return hostFields(tableId).find((field) => field.key === key) || null;
}

export function fieldChip(field) {
  if (!field) return '';
  return `${field.key}【${field.name}】`;
}

/** 映射字段变更后，保留仍存在的 L4 顺序；新勾选的字段默认追加为展示。 */
export function syncL4Visible(nextFieldKeys, previousFieldKeys, l4Visible) {
  const kept = (l4Visible || []).filter((key) => nextFieldKeys.includes(key));
  nextFieldKeys.forEach((key) => {
    if (!previousFieldKeys.includes(key) && !kept.includes(key)) kept.push(key);
  });
  return kept;
}
