/** 从「Lab Data 后台」原型迁入的页面数据与编号转换规则。 */

export const METHODS = {
  direct: { label: '设备直采', tag: '直连', desc: '设备有通讯接口、可直连读数；App 一键采集，失败可切手输。', bg: '#eef4ff', fg: '#1d54c4', dot: '#2563eb' },
  ocr: { label: '图像采集', tag: 'OCR', desc: '无直连但有读数屏，已配「数据识别规则」；App 拍照识别回填，识别差时手输矫正。', bg: '#efeaff', fg: '#6a48e0', dot: '#7c5cff' },
  ble: { label: '蓝牙采集', tag: '蓝牙', desc: '数显卡尺等蓝牙节点；App 连接后逐条同步读数，连接异常时可手输。', bg: '#e2f7f9', fg: '#0a8a96', dot: '#0fb5c4' },
  serial: { label: '串口采集', tag: '串口', desc: '电子天平等经工业平板串口程序代采写库；App 端读取已采数据，异常时可手输。', bg: '#ede9fe', fg: '#6d4bd1', dot: '#8b6bd6' },
  manual: { label: '人工录入', tag: '手工', desc: '以上均不支持，仅现场手工录入数据。', bg: '#eef1f5', fg: '#5b6677', dot: '#828c9c' },
};

export function methodMeta(row) {
  if (row.method === 'serial' && row.external) {
    return { label: '外部程序采集', bg: '#e2f7f9', fg: '#0a8a96', dot: '#11a3b0' };
  }
  const method = METHODS[row.method];
  return { label: method.label, bg: method.bg, fg: method.fg, dot: method.dot };
}

export const INITIAL_DEVICES = [
  { code: 'JZ-001', name: '万能试验机', model: 'WNSYJ', dept: '应敏科技', area: '力学检测室2', method: 'direct', on: true },
  { code: 'YM-WRH-01', name: '电缆直流电阻快速测量系统-无人化版', model: 'YM-WRH-01', dept: '应敏科技', area: '无人化试验室', method: 'direct', on: true },
  { code: 'YM-S03', name: '智能型数字电桥', model: 'QJ36-ZS', dept: '应敏科技', area: '力学检测室2', method: 'ocr', on: true },
  { code: 'DL-27', name: '数显卡尺', model: '(0-200)mm', dept: '材料检测组', area: '力学检测室1', method: 'ble', on: true },
  { code: 'YM-FMK', name: '电子天平（砝码库）', model: 'YM-FMK', dept: '应敏科技', area: '无人化试验室', method: 'serial', external: true, on: true },
  { code: 'YM-WRH-07', name: '热延伸试验箱', model: 'YRSC-200I', dept: '应敏科技', area: '无人化试验室', method: 'ocr', on: true },
  { code: 'SL-005', name: '安全帽冲击试验机', model: 'YFM-20I', dept: '安全工器具检测组', area: '力学检测室1', method: 'ocr', on: true },
  { code: 'LX-05', name: '微机控制电子万能试验机', model: 'LD26504', dept: '实链检测', area: '力学检测室1', method: 'direct', on: true },
  { code: 'SL-008', name: '操作杆动态弯曲试验机', model: 'YFW-20I', dept: '高压检测组', area: '力学检测室1', method: 'manual', on: false },
  { code: 'YWD-11F', name: '全自动绝缘厚度测试仪（无人化版）', model: 'YWD-11F', dept: '应敏科技', area: '无人化试验室', method: 'direct', on: true },
];

export const RULE_STATUS = {
  pending: { label: '未验证', bg: '#eef1f5', fg: '#5b6677', dot: '#828c9c' },
  passed: { label: '已通过', bg: '#e7f6ec', fg: '#1b8a5a', dot: '#23a866' },
  failed: { label: '未通过', bg: '#fdecec', fg: '#c0392b', dot: '#e23b3b' },
};

export const RULE_TESTS = [
  { code: 'sc_zldz', label: 'sc_zldz【直流电阻试验】', devices: [['智能型数字电桥', 'QJ36-ZS'], ['电缆直流电阻快速测量系统-无人化版', 'YM-WRH-01']] },
  { code: 'sc_gpnysy', label: 'sc_gpnysy【工频耐压试验】', devices: [['工频耐压试验装置', 'YDJ-150']] },
  { code: 't_jyysy', label: 't_jyysy【绝缘液试验】', devices: [['绝缘油介电强度测试仪', 'HCJ-9201']] },
  { code: 'hntdg_ccpc', label: 'hntdg_ccpc【环形混凝土电杆-尺寸偏差】', devices: [['激光测距尺寸检测仪', 'LS-200']] },
  { code: 't_jbfd', label: 't_jbfd【局部放电试验】', devices: [['局部放电检测仪', 'PDS-9']] },
  { code: 'jgt_gcczjc_hxcf', label: 'jgt_gcczjc_hxcf【角钢塔-钢材材质测量】', devices: [['直读光谱仪', 'Q4-TASMAN']] },
  { code: 'sc_wgjc', label: 'sc_wgjc【外观检查】', devices: [['工业相机视觉台', 'CV-X']] },
];

export const INITIAL_RULES = [
  { table: 'sc_zldz', device: '智能型数字电桥|QJ36-ZS', scenario: '屏幕界面', rule: 'zx-正向-1-Reg(\\d*\\.?\\d+),fx-反向-2-Reg(\\d*\\.?\\d+),pj-平均-3-Reg(\\d*\\.?\\d+)', status: 'passed' },
  { table: 'sc_zldz', device: '智能型数字电桥|QJ36-ZS', scenario: '纸质报表', rule: 'cd-长度-1-Reg(\\d*\\.?\\d+),wb-温补-2-Reg(\\d*\\.?\\d+),jg-结果-3-Reg(\\d*\\.?\\d+),jl-结论-4-Reg(.+)', status: 'passed' },
  { table: 'sc_zldz', device: '电缆直流电阻快速测量系统-无人化版|YM-WRH-01', scenario: '屏幕界面', rule: 'wd-温度-1-Reg(\\d*\\.?\\d+),sd-湿度-2-Reg(\\d*\\.?\\d+),scdz-实测电阻-3-Reg(\\d*\\.?\\d+),dz20-20度电阻-4-Reg(\\d*\\.?\\d+)', status: 'passed' },
  { table: 'sc_gpnysy', device: '工频耐压试验装置|YDJ-150', scenario: '屏幕界面', rule: 'cd-re-\\d*\\.?\\d+-t-Pre1000,bcz-re-\\d*\\.?\\d+-t-Pre1000,syz-re-\\d*\\.?\\d+-t-Pre1000', status: 'passed' },
  { table: 't_jyysy', device: '绝缘油介电强度测试仪|HCJ-9201', scenario: '屏幕界面', rule: 'jcdy-ro-宗源-1', status: 'passed' },
  { table: 'hntdg_ccpc', device: '激光测距尺寸检测仪|LS-200', scenario: '屏幕界面', rule: 'a1-re-\\d*\\.?\\d+-t-Pre1000,a5-re-\\d*\\.?\\d+-t-Pre1000,a7-re-\\d*\\.?\\d+-t-Pre1000', status: 'pending' },
  { table: 't_jbfd', device: '局部放电检测仪|PDS-9', scenario: '屏幕界面', rule: 'jzsl-s-[1-1-Sub1-comma].-Reg(\\d*\\.?\\d+)-For00.0,yqzh-s-1)-1-Sub1', status: 'pending' },
  { table: 'jgt_gcczjc_hxcf', device: '直读光谱仪|Q4-TASMAN', scenario: '纸质报表', rule: 'c-o-CH01-1-Reg(\\d*\\.?\\d+),si-o-CH02-1-Reg(\\d*\\.?\\d+),mn-o-CH03-1-Reg(\\d*\\.?\\d+)', status: 'passed' },
  { table: 'sc_wgjc', device: '工业相机视觉台|CV-X', scenario: '屏幕界面', rule: 'bh-col-打保-变比误差|1', status: 'passed' },
];

export const REL_ITEMS = ['电力电缆-直流电阻', '导电鞋-电阻实验', 'test0619_a_b_c', '绝缘斗臂车-绝缘吊臂工频耐压试验', '脚扣-脚扣静态性能试验', '脚扣-脚扣疲劳性能', '脚扣-标识耐久性试验', '安全帽-交流耐压试验', '软梯（绝缘软梯）-边绳静负荷试验', '软梯（绝缘软梯）-软梯头踏档静负荷试验'];

export const REL_TABLES = [
  'dldl_zldz【电力电缆-直流电阻】',
  'ddx_dzsy【导电鞋-电阻试验】',
  'test0619_a_b_c【test0619_a_b_c】',
  'aq_976_28_jydbgpnysy【绝缘斗臂车-绝缘吊臂工频耐压试验耐压试验】',
  'aq_1741_25_jkjtxnsy【脚扣-脚扣静态性能试验耐压试验】',
  'aq_1741_25_jkplxn【脚扣-脚扣疲劳性能耐压试验】',
  'aq_1741_25_bsnjxjc【脚扣-标识耐久性试验耐压试验】',
  'aq_1741_29_xldlsy【安全帽-交流耐压试验耐压试验】',
  'aq_1741_21_bsjfhsy【软梯（绝缘软梯）-边绳静负荷试验耐压试验】',
];

export const INITIAL_RELATIONS = [
  { item: '电力电缆-直流电阻', table: 'dldl_zldz【电力电缆-直流电阻】' },
  { item: '导电鞋-电阻实验', table: 'ddx_dzsy【导电鞋-电阻试验】' },
  { item: 'test0619_a_b_c', table: 'test0619_a_b_c【test0619_a_b_c】' },
  { item: '绝缘斗臂车-绝缘吊臂工频耐压试验', table: 'aq_976_28_jydbgpnysy【绝缘斗臂车-绝缘吊臂工频耐压试验耐压试验】' },
  { item: '脚扣-脚扣静态性能试验', table: 'aq_1741_25_jkjtxnsy【脚扣-脚扣静态性能试验耐压试验】' },
  { item: '脚扣-脚扣疲劳性能', table: 'aq_1741_25_jkplxn【脚扣-脚扣疲劳性能耐压试验】' },
  { item: '脚扣-标识耐久性试验', table: 'aq_1741_25_bsnjxjc【脚扣-标识耐久性试验耐压试验】' },
  { item: '安全帽-交流耐压试验', table: 'aq_1741_29_xldlsy【安全帽-交流耐压试验耐压试验】' },
  { item: '软梯（绝缘软梯）-边绳静负荷试验', table: 'aq_1741_21_bsjfhsy【软梯（绝缘软梯）-边绳静负荷试验耐压试验】' },
  { item: '软梯（绝缘软梯）-软梯头踏档静负荷试验', table: 'aq_1741_21_rttjfhsy【软梯（绝缘软梯）-软梯头踏档静负荷试验耐压试…】' },
];

export const CODE_PREVIEW_SAMPLES = [
  '第三方委托#2026-电缆-A001（杭州）',
  'LIMS/委托单/20260720/001-02',
  '样品编号：SC-2026★00789-超长委托单号-杭州数蚕智能科技有限公司-电缆检测专项',
];

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 6);
}

function extractTokens(text) {
  return (String(text || '').match(/[A-Za-z0-9]+/g) || []).filter(Boolean);
}

function normalizeTokens(tokens) {
  const next = tokens.slice();
  if (next[0] === 'SC' && next[1] && /^\d{4}$/.test(next[1])) next.splice(0, 2, `SC${next[1]}`);
  return next;
}

function isStandardCode(code) {
  if (!code || code.length > 32) return false;
  return /^[A-Za-z0-9]+([/_-][A-Za-z0-9]+)*$/.test(code);
}

function joinTokens(tokens, maxLen) {
  if (!tokens.length) return '';
  const parts = normalizeTokens(tokens);
  let suffix = '';
  if (parts.length >= 2 && /^\d{1,3}$/.test(parts[parts.length - 1])) suffix = parts.pop().padStart(2, '0');
  const main = parts.join('/');
  let result = main && suffix ? `${main}-${suffix}` : (main || suffix);
  if (result.length > maxLen) {
    if (suffix) result = `${main.slice(0, Math.max(maxLen - suffix.length - 1, 4))}-${suffix}`;
    else result = result.slice(0, maxLen);
  }
  return result;
}

function convertPreserveSlashes(original, maxLen) {
  if (!original.includes('/')) return '';
  const segments = original.split('/').map((segment) => joinTokens(extractTokens(segment), maxLen)).filter(Boolean);
  if (!segments.length) return '';
  const result = segments.join('/');
  return isStandardCode(result) && result.length <= maxLen ? result : '';
}

function ensureUnique(base, original) {
  const hash = hashCode(original).slice(0, 4);
  if (base.includes('-')) {
    const index = base.lastIndexOf('-');
    return `${base.slice(0, index)}/${hash}-${base.slice(index + 1)}`;
  }
  return `${base}/${hash}`;
}

export function convertCode(original) {
  if (!original || isStandardCode(original)) return original;
  const maxLen = 32;
  const preserved = convertPreserveSlashes(original, maxLen);
  if (preserved) return preserved;
  const tokens = extractTokens(original);
  let result = joinTokens(tokens, maxLen);
  if (!result || !isStandardCode(result)) result = `TP/${hashCode(original)}`;
  else {
    result = ensureUnique(result, original);
    if (result.length > maxLen) result = result.slice(0, maxLen).replace(/[/\-_]+$/, '');
  }
  return isStandardCode(result) ? result : `TP/${hashCode(original)}`;
}

export function tableLabel(code) {
  return RULE_TESTS.find((item) => item.code === code)?.label || code;
}
