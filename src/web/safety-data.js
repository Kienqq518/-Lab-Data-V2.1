/** 安全管家配置原型数据，字段与编号对齐 Web 后台截图。 */

export const NODE_TYPES = [
  '温湿度节点',
  '视觉节点',
  '开关量节点',
  '人体节点',
  '水浸节点',
  '光照度节点',
  '烟雾节点',
  '可燃气体节点',
];

export const FIELD_OPTIONS = ['wd', 'sd', 'jyhdwd', 'jyhdsd', 'cd', 'syz', 'jl', 'bcz', 'pjz'];

export const EQUIPMENT = [
  { id: 'sl009', name: '绝缘安全工器具综合试验系统', code: 'SL-009', model: 'YFG-150A' },
  { id: 'sll004', name: '船体型卧式拉力试验机', code: 'SLL-004', model: '' },
  { id: 'dl27', name: '数显卡尺', code: 'DL-27', model: '' },
  { id: 'yh04', name: '电子天平', code: 'YH-04', model: '' },
  { id: 'dl29', name: '数显卡尺', code: 'DL-29', model: '' },
  { id: 'lx05', name: '微机控制电子万能试验机', code: 'LX-05', model: '' },
  { id: 'ym02', name: '全自动绝缘厚度测试仪（无人化版）', code: 'YM-WRH-02', model: '' },
  { id: 'ym03', name: '绝缘层机械性能智能测试系统-无人化版', code: 'YM-WRH-03', model: '' },
  { id: 'ym04', name: '电缆热延伸全自动检测系统-无人化版', code: 'YM-WRH-04', model: '' },
];

export const TEST_ITEMS = [
  { id: 'ti-gpny', equipmentId: 'sl009', name: '绝缘杆-工频耐压试验', code: 'aq_1476_10_gpnysy' },
  { id: 'ti-dzd', equipmentId: 'sll004', name: '吊装带-静负荷试验', code: 'dzd_jfh_01' },
  { id: 'ti-dx1', equipmentId: 'dl27', name: '钢芯铝绞线-导线截面积测量', code: 'gxljx_dxjmj' },
  { id: 'ti-zl', equipmentId: 'yh04', name: '钢芯铝绞线-单位长度质量试验', code: 'gxljx_dwcdzl' },
  { id: 'ti-dx2', equipmentId: 'dl29', name: '钢芯铝绞线-导线截面积测量', code: 'gxljx_dxjmj' },
  { id: 'ti-kl', equipmentId: 'lx05', name: '抗拉强度', code: 'klqd' },
  { id: 'ti-gkl', equipmentId: 'lx05', name: '钢芯铝绞线-抗拉强度', code: 'gxljx_klqd' },
  { id: 'ti-jyhd', equipmentId: 'ym02', name: '电缆绝缘厚度', code: 'dl_jyhd' },
  { id: 'ti-jx', equipmentId: 'ym03', name: '电力电缆-低压-老化前绝缘的机械性能试验', code: 'dldl_dy_lhq_jx' },
  { id: 'ti-rys', equipmentId: 'ym04', name: '电缆-热延伸试验', code: 'dl_rys' },
  { id: 'ti-xz', equipmentId: 'sl009', name: '绝缘靴-工频耐压试验', code: 'aq_1476_11_gpnysy' },
  { id: 'ti-aqd', equipmentId: 'sll004', name: '安全带-静负荷试验', code: 'aqd_jfh_01' },
  { id: 'ti-ht', equipmentId: 'ym02', name: '电缆护套厚度', code: 'dl_hthd' },
  { id: 'ti-ydq', equipmentId: 'sl009', name: '验电器-启动电压试验', code: 'ydq_qddy' },
  { id: 'ti-wq', equipmentId: 'lx05', name: '弯曲试验', code: 'wqsy' },
  { id: 'ti-md', equipmentId: 'yh04', name: '密度试验', code: 'mdsy' },
];

const INITIAL_ROWS = [
  ['c1', 'ti-gpny', ['wd', 'sd']],
  ['c2', 'ti-dzd', ['wd', 'sd']],
  ['c3', 'ti-dx1', ['wd', 'sd']],
  ['c4', 'ti-zl', ['wd', 'sd']],
  ['c5', 'ti-dx2', ['wd', 'sd']],
  ['c6', 'ti-kl', ['wd', 'sd']],
  ['c7', 'ti-gkl', ['wd', 'sd']],
  ['c8', 'ti-jyhd', ['jyhdwd', 'jyhdsd']],
  ['c9', 'ti-jx', ['wd', 'sd']],
  ['c10', 'ti-rys', ['wd', 'sd']],
  ['c11', 'ti-xz', ['wd', 'sd']],
  ['c12', 'ti-aqd', ['wd', 'sd']],
  ['c13', 'ti-ht', ['jyhdwd', 'jyhdsd']],
];

export const INITIAL_NODES = [
  { name: '水浸01', code: 'D13F0LVOA6VQ', type: '水浸节点' },
  { name: '烟雾01', code: 'D12JYTRICGJF', type: '烟雾节点' },
  { name: '开关量01', code: 'D1KU0F9ARLG4', type: '开关量节点' },
  { name: '可燃气体01', code: 'D1281NQ72R0U', type: '可燃气体节点' },
  { name: '光照度01', code: 'D1A51J9A14ZS', type: '光照度节点' },
  { name: '人体01', code: 'D1OIOKD1ODMD', type: '人体节点' },
  { name: '视觉节点01', code: 'D1MX097HAY7I', type: '视觉节点' },
  { name: '温湿度01', code: 'D1DY320M02QT', type: '温湿度节点' },
];

const NODE_TEMPLATES = [
  { name: '水浸01', type: '水浸节点' },
  { name: '烟雾01', type: '烟雾节点' },
  { name: '开关量01', type: '开关量节点' },
  { name: '可燃气体01', type: '可燃气体节点' },
  { name: '光照度01', type: '光照度节点' },
  { name: '人体01', type: '人体节点' },
  { name: '视觉节点01', type: '视觉节点' },
  { name: '温湿度01', type: '温湿度节点' },
];

export function createInitialManagers() {
  return [
    {
      id: 'sm01',
      name: '安全管家01',
      deviceNo: 'D1GHQS04VXA3',
      apiKey: 'AAEB49CCAC4E49388B52127AC664D53A',
      nodes: INITIAL_NODES.map((node) => ({ ...node })),
    },
  ];
}

export function createInitialConfigs() {
  return INITIAL_ROWS.map(([id, itemId, fields]) => {
    const item = TEST_ITEMS.find((entry) => entry.id === itemId);
    return {
      id,
      managerId: 'sm01',
      equipmentId: item.equipmentId,
      itemId,
      fields: [...fields],
      nodeType: '温湿度节点',
    };
  });
}

export function equipmentLabel(equipment, withModel = false) {
  if (!equipment) return '';
  const model = withModel && equipment.model ? ` ${equipment.model}` : '';
  return `${equipment.name} ${equipment.code}${model}`;
}

export function itemLabel(item) {
  if (!item) return '';
  return `${item.name} ${item.code}`;
}

export function managerLabel(manager) {
  if (!manager) return '';
  return `${manager.name} ${manager.deviceNo}`;
}

export function nextManagerName(managers) {
  const max = managers.reduce((current, manager) => {
    const matched = /安全管家(\d+)/.exec(manager.name);
    return Math.max(current, matched ? Number(matched[1]) : 0);
  }, 0);
  return `安全管家${String(max + 1).padStart(2, '0')}`;
}

export function buildNodes(seed) {
  const source = String(seed || 'DEVICE').replace(/[^A-Za-z0-9]/g, '').toUpperCase().padEnd(10, 'X');
  return NODE_TEMPLATES.map((node, index) => ({
    name: node.name,
    type: node.type,
    code: `D1${source.slice(0, 4)}${index.toString(16).toUpperCase()}${source.slice(4, 9)}`.slice(0, 12),
  }));
}

export const MENU = [
  { key: 'home', label: '首页', icon: 'home' },
  { key: 'datasource', label: '数据源管理', icon: 'db' },
  {
    key: 'task',
    label: '任务管理',
    icon: 'task',
    children: [
      { key: 'task-sim', label: '模拟任务' },
      { key: 'task-collect', label: '采集任务' },
      { key: 'task-cron', label: '定时任务' },
    ],
  },
  {
    key: 'base',
    label: '基础数据管理',
    icon: 'base',
    children: [
      { key: 'devices', label: '设备管理' },
      { key: 'relations', label: '关系配置' },
      { key: 'base-third', label: '第三方试验表' },
    ],
  },
  {
    key: 'device',
    label: '设备配置',
    icon: 'device',
    children: [
      { key: 'collect-config', label: '设备采集配置' },
      { key: 'l4-fields', label: 'L4 字段展示' },
      { key: 'mapping', label: '数据映射配置' },
      { key: 'safety', label: '安全管家配置' },
    ],
  },
  {
    key: 'image',
    label: '图片采集配置',
    icon: 'image',
    children: [
      { key: 'rules', label: '数据识别规则' },
      { key: 'ocr-debug', label: '图像识别调试' },
    ],
  },
  {
    key: 'log',
    label: '任务日志',
    icon: 'log',
    children: [
      { key: 'log-test', label: '试验任务日志' },
      { key: 'log-cron', label: '定时任务日志' },
    ],
  },
  {
    key: 'system',
    label: '系统设置',
    icon: 'settings',
    children: [
      { key: 'settings', label: '系统参数' },
    ],
  },
];

export function findMenuItem(key) {
  for (const item of MENU) {
    if (item.key === key) return item;
    const child = item.children?.find((entry) => entry.key === key);
    if (child) return child;
  }
  return null;
}
