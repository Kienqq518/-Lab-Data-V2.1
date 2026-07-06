/* 数蚕 Lab Data · 检测员 UI Kit 模拟数据
   工位/样品/试验项取自国网绿链泰山物资检测中心实拍工位牌 + Web 试验填报（8.7/10kV-3芯 电缆）。
   采集方式规则：导体直流电阻=拍照识别(ocr)；非金属护套&钢带铠装=蓝牙数显卡尺(ble)；
   其余电缆设备=设备直连(auto)。仅 ble 允许手输，ocr/auto 不可手输。 */
  // 工位（物理区域）—— 取自现场工位牌
  const stations = [
    { id: 'zy', name: '电缆制样工位',   deviceCount: 7, desc: '无人化流水线制样 · ABB 机器人' },
    { id: 'sz', name: '水煮试验工位',   deviceCount: 4, desc: '绝缘电阻 · 透水 · 镀锌层 · 温度循环' },
    { id: 'ny', name: '耐压工位',       deviceCount: 2, desc: '0-150kV 工频耐压 · 手动/自动升压' },
    { id: 'ld', name: '雷电冲击工位',   deviceCount: 1, desc: '电缆/变压器/开关 A级雷电冲击' },
    { id: 'rs', name: '电缆燃烧工位',   deviceCount: 5, desc: '炭黑 · 烟密度 · 耐火 · 成束燃烧' },
    { id: 'by', name: '变压器工位',     deviceCount: 1, desc: '配电变压器 C级综合试验' },
  ];

  // 试验字段模板（采集详情录入）
  const fieldTpl = {
    dcr: [   // 导体直流电阻（智能型数字电桥 · 拍照识别）
      { key: 'zx', label: '正向', unit: 'µΩ' },
      { key: 'fx', label: '反向', unit: 'µΩ' },
      { key: 'pj', label: '平均', unit: 'µΩ' },
      { key: 'cd', label: '长度', unit: 'm' },
      { key: 'wb', label: '温补', unit: 'µΩ' },
      { key: 'jg', label: '结果', unit: 'Ω/km' },
      { key: 'jl', label: '结论', unit: '' },
    ],
    size: [  // 结构尺寸/厚度（设备直连）
      { key: 'bcz', label: '标称值', unit: 'mm' },
      { key: 'csz', label: '测量值', unit: 'mm' },
      { key: 'jsz', label: '计算值', unit: 'mm' },
      { key: 'jl',  label: '结论',   unit: '' },
    ],
    caliper: [ // 非金属护套&钢带铠装（蓝牙数显卡尺，可手输）
      { key: 'hctk', label: '护层厚度', unit: 'mm' },
      { key: 'gdkd', label: '钢带宽度', unit: 'mm' },
      { key: 'dckd', label: '搭盖宽度', unit: 'mm' },
      { key: 'jl',   label: '结论',     unit: '' },
    ],
    mech: [  // 机械性能（设备直连，红外/局放等沿用）
      { key: 'kzqd', label: '抗张强度', unit: 'MPa' },
      { key: 'dlcl', label: '断裂伸长率', unit: '%' },
      { key: 'jl',   label: '结论',     unit: '' },
    ],
    mechIns: [ // 老化前绝缘的机械性能试验（原始测量）
      { key: 'sykd', label: '试样宽度',        unit: 'mm' },
      { key: 'syhd', label: '试样厚度',        unit: 'mm' },
      { key: 'fmax', label: '断裂时最大力Fm',  unit: 'N' },
      { key: 'lu',   label: '断裂时标距长度Lu', unit: 'mm' },
      { key: 'jl',   label: '结论',            unit: '' },
    ],
    mechSheath: [ // 非金属护套老化前的机械性能试验（原始测量）
      { key: 'l0',   label: '试片原始标距L0',   unit: 'mm' },
      { key: 'spkd', label: '试片宽度',        unit: 'mm' },
      { key: 'syhd', label: '试样厚度测量值',   unit: 'mm' },
      { key: 'fmax', label: '断裂时最大力',     unit: 'N' },
      { key: 'lu',   label: '断裂时标距长度Lu', unit: 'mm' },
      { key: 'jl',   label: '结论',            unit: '' },
    ],
    heatext: [ // XLPE绝缘的热延伸试验（原始测量）
      { key: 'l0',   label: '施加负荷前标距L0',       unit: 'mm' },
      { key: 'spkd', label: '试片宽度',              unit: 'mm' },
      { key: 'sphd', label: '试片厚度测量值',         unit: 'mm' },
      { key: 'l1',   label: '施加负荷15min后标距L1',  unit: 'mm' },
      { key: 'l2',   label: '冷却后标距L2',          unit: 'mm' },
      { key: 'jl',   label: '结论',                 unit: '' },
    ],
    shrink: [ // XLPE绝缘的收缩试验（原始测量）
      { key: 'l1', label: '处理后标志间长L1', unit: 'mm' },
      { key: 'jl', label: '结论',           unit: '' },
    ],
    density: [ // 密度测量（电子天平 · 串口采集）
      { key: 'syzjz', label: '试样密度与浸渍液密度对比', options: ['试样密度大于浸渍液密度', '试样密度小于浸渍液密度'] },
      { key: 'jzylx', label: '浸渍液类型', options: ['水', '乙醇'] },
      { key: 'jysd', label: '浸渍液温度', unit: '℃', options: ['23', '27'] },
      { key: 'msa',  label: '试样空气中质量', unit: 'g' },
      { key: 'msil', label: '试样浸渍液中表观质量', unit: 'g', densityMode: 'greater' },
      { key: 'mchui', label: '重锤在浸渍液中的表现质量', unit: 'g', densityMode: 'less' },
      { key: 'msich', label: '试样加重锤在浸渍液中的表现质量', unit: 'g', densityMode: 'less' },
      { key: 'jl',   label: '结论', unit: '' },
    ],
  };

  // 设备（含所在工位 station、采集方式 method、可做试验项 items）
  const devices = [
    { id: 'dcr',  name: '智能型数字电桥', code: 'YM-WRH-100', model: 'QJ36-ZS', station: 'zy', method: 'ocr',
      items: [ { name: '导体直流电阻', tpl: 'dcr' } ] },
    { id: 'thk',  name: '全自动绝缘厚度测试仪', code: 'YM-WRH-02', model: 'YWD-11F', station: 'zy', method: 'auto',
      items: [ { name: '结构尺寸检查—导体&绝缘厚度&金属屏蔽', tpl: 'size' } ] },
    { id: 'cal',  name: '蓝牙数显卡尺', code: 'BT-CAL-01', model: 'IP54-150', station: 'zy', method: 'ble',
      items: [ { name: '结构尺寸检查—非金属护套&钢带铠装', tpl: 'caliper' } ] },
    { id: 'mech', name: '电缆绝缘层机械性能试验机', code: 'YM-WRH-03', model: 'YWL-5D', station: 'zy', method: 'auto',
      items: [ { name: '老化前绝缘的机械性能试验', tpl: 'mechIns' }, { name: '非金属护套老化前的机械性能试验', tpl: 'mechSheath' } ] },
    { id: 'hext', name: '电缆热延伸全自动智能检测平台', code: 'YM-WRH-04', model: 'YWH-6D', station: 'zy', method: 'auto',
      items: [ { name: 'XLPE绝缘的热延伸试验', tpl: 'heatext' } ] },
    { id: 'shr',  name: '电缆热收缩试验智能检测平台', code: 'YM-WRH-05', model: 'YRSC-200I', station: 'zy', method: 'auto',
      items: [ { name: 'XLPE绝缘的收缩试验', tpl: 'shrink' } ] },
    // 手输设备（单机台式仪表，无通讯接口，读数靠人工录入）
    { id: 'tmk',  name: '台式测厚仪', code: 'DF291968', model: '(0~12.7)mm/0.001mm', station: 'zy', method: 'manual',
      items: [ { name: '绝缘厚度测量（手输补录）', tpl: 'size' } ] },
    // ===== 非工位设备（来自 Web「设备管理」维护，未绑定工位 / 便携）=====
    { id: 'ir',   name: '手持式红外热像仪', code: 'IR-808', model: 'FLIR-E8', station: null, method: 'ble',
      items: [] },
    { id: 'pd',   name: '便携式局部放电检测仪', code: 'PD-200', model: 'PDS-9', station: null, method: 'ble',
      items: [] },
    { id: 'cal2', name: '蓝牙数显卡尺（便携）', code: 'BT-CAL-09', model: 'IP54-150', station: null, method: 'ble',
      items: [] },
    // ===== 串口采集设备（电子天平，工业平板串口采集程序代采写库，App 端仅展示 + 异常兜底手输）=====
    { id: 'bal',  name: '电子天平', code: 'YH-04', model: 'HZK-FA110', station: null, method: 'serial',
      items: [ { name: '密度测量', tpl: 'density', count: 3 } ] },
    { id: 'bal2', name: '精密电子天平', code: 'YH-07', model: 'FA2004B', station: null, method: 'serial',
      items: [ { name: '密度测量', tpl: 'density', count: 3 } ] },
    // ===== 安全工器具 · 绝缘操作杆 =====
    { id: 'rodhv', name: '工频耐压试验装置', code: 'NY-150', model: '150kV', station: 'ny', method: 'manual',
      items: [ { name: '绝缘操作杆 - 交流耐压试验' } ] },
    { id: 'rodhv2', name: '工频耐压试验装置（备用）', code: 'NY-151', model: '150kV-B', station: 'ny', method: 'manual',
      items: [ { name: '绝缘操作杆 - 交流耐压试验' } ] },
    { id: 'rodbend', name: '安全工器具力学试验机', code: 'AQ-MECH-01', model: 'YWL-10', station: null, method: 'manual',
      items: [ { name: '绝缘操作杆 - 抗弯动负荷试验' }, { name: '绝缘操作杆 - 抗弯静负荷试验' } ] },
    { id: 'rodbend2', name: '安全工器具力学试验机（便携）', code: 'AQ-MECH-02', model: 'YWL-5', station: null, method: 'manual',
      items: [ { name: '绝缘操作杆 - 抗弯动负荷试验' }, { name: '绝缘操作杆 - 抗弯静负荷试验' } ] },
  ];

  // 「结构尺寸检查—非金属护套&钢带铠装」拆分为两个试验子项（均为蓝牙数显卡尺）
  const caliperDevice = { id: 'cal', name: '数显卡尺', code: 'YBKC-02', model: '(0~300)mm/0.01mm', station: 'zy', method: 'ble' };
  const sheathArmorSubs = [
    { id: 'sheath-metal-armor', name: '金属铠装', method: 'ble', phased: false, device: caliperDevice,
      candidateDevices: [caliperDevice],
      fields: [
        { key: 'kzkd', label: '铠装宽度', unit: 'mm', required: true },
        { key: 'gdjx1', label: '钢带间隙宽度1', unit: 'mm', required: true },
        { key: 'gdjx2', label: '钢带间隙宽度2', unit: 'mm', required: true },
        { key: 'gdjx3', label: '钢带间隙宽度3', unit: 'mm', required: true },
        { key: 'gdjx4', label: '钢带间隙宽度4', unit: 'mm', required: true },
        { key: 'gdjx5', label: '钢带间隙宽度5', unit: 'mm', required: true },
      ] },
    { id: 'sheath-thickness', name: '非金属护套厚度测量', method: 'ble', phased: false, device: caliperDevice,
      candidateDevices: [caliperDevice],
      fields: [
        { key: 'jsdbffs', label: '金属屏蔽层金属带包裹方式', required: true, options: ['单根金属带重叠绕包', '两层金属带间隙绕包', '金属带纵包'] },
        { key: 'jdbs', label: '金属带根数', unit: '根', required: true },
        { key: 'tsmin', label: '外护套各测点厚度t_s', unit: 'mm', required: true, multi: 6 },
      ] },
  ];

  // 轻量 LIMS · 安全工器具（绝缘操作杆）试验参数 — 平铺字段，结论手工录入
  const rodEnvFields = [
    { key: 'wd', label: '室温', unit: '℃' },
    { key: 'qy', label: '气压', unit: 'hPa' },
    { key: 'sd', label: '湿度', unit: '%RH' },
    { key: 'beizhu', label: '备注' },
  ];
  const rodAcFields = [
    { key: 'bzz', label: '标称值', unit: 'kV' },
    { key: 'syz', label: '试验值', unit: 'kV' },
    { key: 'sj', label: '时间', unit: 'min' },
    { key: 'ztms', label: '状态描述' },
    ...rodEnvFields,
  ];
  const rodAppearanceFields = [
    { key: 'wg', label: '外观' },
    { key: 'yxjccd', label: '有效绝缘长度', unit: 'm' },
    { key: 'beizhu', label: '备注' },
  ];
  const rodBendDynamicFields = [
    { key: 'syc', label: '试样长度', unit: 'm' },
    { key: 'bzz', label: '标称值', unit: 'N' },
    { key: 'syz', label: '试验值', unit: 'N' },
    { key: 'ztms', label: '状态描述' },
    ...rodEnvFields,
  ];
  const rodBendStaticFields = [
    { key: 'syc', label: '试样长度', unit: 'm' },
    { key: 'bzz', label: '标称值', unit: 'N' },
    { key: 'syz', label: '试验值', unit: 'N' },
    { key: 'sj', label: '时间', unit: 'min' },
    { key: 'ztms', label: '状态描述' },
    ...rodEnvFields,
  ];

  const rodAcDevice = { id: 'rodhv', name: '工频耐压试验装置', code: 'NY-150', model: '150kV', station: 'ny', method: 'manual' };
  const rodAcDeviceAlt = { id: 'rodhv2', name: '工频耐压试验装置（备用）', code: 'NY-151', model: '150kV-B', station: 'ny', method: 'manual' };
  const rodBendDevice = { id: 'rodbend', name: '安全工器具力学试验机', code: 'AQ-MECH-01', model: 'YWL-10', station: null, method: 'manual' };
  const rodBendDeviceAlt = { id: 'rodbend2', name: '安全工器具力学试验机（便携）', code: 'AQ-MECH-02', model: 'YWL-5', station: null, method: 'manual' };
  const rodAppDevice = { id: 'tmk', name: '台式测厚仪', code: 'DF291968', model: '(0~12.7)mm/0.001mm', station: 'zy', method: 'manual' };
  const visualInspectionDevice = { id: 'visual', name: '目测', code: '—', model: '不连接设备', station: null, method: 'manual', visual: true };
  const rodAcDrawerDevices = [
    rodAcDevice, rodAcDeviceAlt,
    { id: 'ny-power', name: '工频耐压试验装置', code: 'NY-10K-01', model: 'YD-15kVA/50kV', station: 'ny', method: 'auto' },
    { id: 'ny-leak', name: '泄漏电流采集器', code: 'LC-308', model: 'LCM-4', station: 'ny', method: 'ble' },
    { id: 'rodhv-daq', name: '耐压数据采集单元', code: 'DAQ-NY-01', model: 'USB-6010', station: 'ny', method: 'serial' },
    visualInspectionDevice,
  ];
  const rodAppDrawerDevices = [
    visualInspectionDevice, rodAppDevice, caliperDevice,
    { id: 'cal2', name: '蓝牙数显卡尺（便携）', code: 'BT-CAL-09', model: 'IP54-150', station: null, method: 'ble' },
    { id: 'ir', name: '手持式红外热像仪', code: 'IR-808', model: 'FLIR-E8', station: null, method: 'ble' },
    { id: 'thk', name: '全自动绝缘厚度测试仪', code: 'YM-WRH-02', model: 'YWD-11F', station: 'zy', method: 'auto' },
  ];
  const rodBendDrawerDevices = [
    rodBendDevice, rodBendDeviceAlt,
    { id: 'mech', name: '电缆绝缘层机械性能试验机', code: 'YM-WRH-03', model: 'YWL-5D', station: 'zy', method: 'auto' },
    { id: 'sz-logger', name: '水煮温度记录仪', code: 'WT-06', model: 'TLOG-8', station: 'sz', method: 'ble' },
    { id: 'free-meter', name: '便携式万用表', code: 'MM-21', model: 'UT-171B', station: null, method: 'manual' },
    visualInspectionDevice,
  ];

  const doneItem = (name, device, method, extra = {}) => ({ name, device, method, status: 'done', upload: 'done', ...extra });
  const overdueDoneItem = (name, device, method, extra = {}) => doneItem(name, device, method, { overdueTag: 'overdue_done', ...extra });

  // 样品 —— 8.7/10kV-3芯 电力电缆（Web 试验填报同款），含 7 个试验项
  const samples = [
    { id: 's1', code: 'SC2026/01001-01', name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', status: 'testing', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { id: 'dcr', name: '导体直流电阻', device: 'dcr',  method: 'ocr',  status: 'done',    upload: 'done', phased: true, flow: { node: '数据审核' } },
        { id: 'struct-core-ins-shield', name: '结构尺寸检查—导体&绝缘厚度&金属屏蔽', device: 'thk', method: 'auto', status: 'testing', count: 3, phased: true,
          subs: [
            { id: 'struct-conductor', name: '导体', method: 'auto', phased: true,
              device: { id: 'mech', name: '绝缘层机械性能智能测试系统-无人化版', code: 'YM-WRH-03', model: 'YWL-5D', station: 'zy', method: 'auto' },
              fields: [
                { key: 'jg', label: '导体结构', required: true, options: ['实心导体', '非紧压绞合圆形', '紧压绞合圆形', '绞合成型'] },
                { key: 'gs', label: '导体单丝根数', unit: '根', required: true },
                { key: 'zj', label: '导体直径', unit: 'mm', required: true },
              ] },
            { id: 'struct-insulation-thickness', name: '绝缘厚度测量', method: 'manual', phased: true,
              device: { id: 'tmk', name: '台式测厚仪', code: 'DF291968', model: '(0~12.7)mm/0.001mm', station: 'zy', method: 'manual' },
              fields: [
                { key: 'hd', label: '绝缘各测量点厚度', unit: 'mm', required: true, multi: 6 },
              ] },
            { id: 'struct-metal-shield', name: '金属屏蔽', method: 'ble', phased: true,
              device: { id: 'cal', name: '数显卡尺', code: 'YBKC-02', model: '(0~300)mm/0.01mm', station: 'zy', method: 'ble' },
              candidateDevices: [
                { id: 'cal', name: '数显卡尺', code: 'YBKC-02', model: '(0~300)mm/0.01mm', station: 'zy', method: 'ble' },
              ],
              fields: [
                { key: 'tdhd', label: '铜带厚度', unit: 'mm', required: true },
                { key: 'tk1', label: '铜带宽度1', unit: 'mm', required: true }, { key: 'dg1', label: '搭盖宽度1', unit: 'mm', required: true },
                { key: 'tk2', label: '铜带宽度2', unit: 'mm', required: true }, { key: 'dg2', label: '搭盖宽度2', unit: 'mm', required: true },
                { key: 'tk3', label: '铜带宽度3', unit: 'mm', required: true }, { key: 'dg3', label: '搭盖宽度3', unit: 'mm', required: true },
                { key: 'tk4', label: '铜带宽度4', unit: 'mm', required: true }, { key: 'dg4', label: '搭盖宽度4', unit: 'mm', required: true },
                { key: 'tk5', label: '铜带宽度5', unit: 'mm', required: true }, { key: 'dg5', label: '搭盖宽度5', unit: 'mm', required: true },
              ] },
          ] },
        { id: 'struct-sheath-armor', name: '结构尺寸检查—非金属护套&钢带铠装', device: 'cal', method: 'ble',  status: 'testing', upload: 'pending', phased: false, subs: sheathArmorSubs },
        { id: 'mech-insulation-before-aging', name: '老化前绝缘的机械性能试验', device: 'mech', method: 'auto', status: 'pending' },
        { id: 'mech-sheath-before-aging', name: '非金属护套老化前的机械性能试验', device: 'mech', method: 'auto', status: 'pending' },
        { id: 'xlpe-heat-extension', name: 'XLPE绝缘的热延伸试验', device: 'hext', method: 'auto', status: 'pending' },
        { id: 'xlpe-shrink', name: 'XLPE绝缘的收缩试验', device: 'shr',  method: 'auto', status: 'pending' },
      ] },
    { id: 's1b', code: 'SC2026/01001-02', name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', status: 'testing', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr',  method: 'ocr',  status: 'testing', phased: true, uploadedPhases: ['红'] },
        { name: '结构尺寸检查—非金属护套&钢带铠装', device: 'cal', method: 'ble', status: 'pending', phased: false, subs: sheathArmorSubs },
        { name: 'XLPE绝缘的收缩试验', device: 'shr', method: 'auto', status: 'pending' },
      ] },
    { id: 's1c', code: 'SC2026/01001-03', name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', status: 'pending', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { name: '老化前绝缘的机械性能试验', device: 'mech', method: 'auto', status: 'pending' },
        { name: '非金属护套老化前的机械性能试验', device: 'mech', method: 'auto', status: 'pending' },
      ] },
    // 检测中任务补一个「已完成」样品，使 SC2026/01001 同时含 未检测/检测中/已完成 三种样品状态
    { id: 's1d', code: 'SC2026/01001-04', name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', status: 'done', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr', method: 'ocr', status: 'done', upload: 'done' },
        { name: 'XLPE绝缘的收缩试验', device: 'shr', method: 'auto', status: 'done', upload: 'done' },
      ] },
    // 未检测任务 SC2026/01002：样品与试验项全部未检测（含多样品用于「按样品」主从演示）
    { id: 's2', code: 'SC2026/01002-01', name: '8.7/10kV-3芯 电力电缆', status: 'pending', cable: true, client: '国网杭州供电公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr',  method: 'ocr',  status: 'pending' },
        { name: '结构尺寸检查—非金属护套&钢带铠装', device: 'cal', method: 'ble', status: 'pending', phased: false, subs: sheathArmorSubs },
        { name: 'XLPE绝缘的收缩试验', device: 'shr', method: 'auto', status: 'pending' },
      ] },
    // 同任务另一样品仅分到部分试验项（其余分给其他检测员，本端不展示）
    { id: 's2b', code: 'SC2026/01002-02', name: '8.7/10kV-3芯 电力电缆', status: 'pending', cable: true, client: '国网杭州供电公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr',  method: 'ocr',  status: 'pending' },
      ] },
    // 未检测已逾期：任务已超时效，但尚未开始任何试验
    { id: 's2c', code: 'SC2026/01003-01', name: '8.7/10kV-3芯 电力电缆', status: 'overdue', cable: true, client: '国网杭州供电公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr', method: 'ocr', status: 'pending', overdueTag: 'overdue_pending' },
        { name: 'XLPE绝缘的收缩试验', device: 'shr', method: 'auto', status: 'pending', overdueTag: 'overdue_pending' },
      ] },
    { id: 's3', code: 'SC2026/00998-03', name: '0.6/1kV-4芯 电力电缆', status: 'done', cable: true, client: '国网杭州供电公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr',  method: 'ocr',  status: 'done', upload: 'done', flow: { node: '试验检测', returned: true, returnReason: '第 2 次正向电阻读数与历史数据偏差较大，疑似拍照识别误差，请复测后重新上传', returnedFrom: '数据审核', by: '张伟', role: '数据审核', at: '06-25 14:30' } },
        { name: '老化前绝缘的机械性能试验', device: 'mech', method: 'auto', status: 'done', upload: 'done' },
      ] },
    // 已逾期任务 SC2026/00990：样品含 已逾期 + 已完成 混合
    { id: 's4', code: 'SC2026/00990-01', name: '8.7/10kV-1芯 电力电缆', status: 'overdue', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { name: 'XLPE绝缘的热延伸试验', device: 'hext', method: 'auto', status: 'pending', overdueTag: 'overdue_pending' },
        { name: '导体直流电阻', device: 'dcr', method: 'ocr', status: 'testing', phased: true, overdueTag: 'overdue_testing', uploadedPhases: ['红'] },
      ] },
    { id: 's4b', code: 'SC2026/00990-02', name: '8.7/10kV-1芯 电力电缆', status: 'done', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { name: '导体直流电阻', device: 'dcr', method: 'ocr', status: 'done', upload: 'done' },
      ] },
    { id: 's4c', code: 'SC2026/00990-03', name: '8.7/10kV-1芯 电力电缆', status: 'done', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        { name: 'XLPE绝缘的热延伸试验', device: 'hext', method: 'auto', status: 'done', upload: 'done', overdueTag: 'overdue_done' },
      ] },
    { id: 's5', code: 'SC2026/01630101', name: '实壁类塑料电缆导管 带承口 PVC-C', status: 'testing', cable: false, client: '国网杭州供电公司',
      tests: [
        { name: '密度测量', device: 'bal', method: 'serial', status: 'pending', count: 3 },
      ] },
    // 安全工器具 · 绝缘操作杆（轻量 LIMS，参数平铺 + 手工结论）
    { id: 's6', code: 'SC2026/00490101', name: '绝缘操作杆', status: 'testing', cable: false, client: '国网浙江省电力有限公司',
      tests: [
        { id: 'rod-ac', name: '绝缘操作杆 - 交流耐压试验', device: 'rodhv', method: 'manual', limsLite: true, status: 'pending', count: 1, fields: rodAcFields,
          candidateDevices: rodAcDrawerDevices },
        { id: 'rod-app', name: '绝缘操作杆 - 外观及尺寸', device: 'visual', method: 'manual', limsLite: true, status: 'pending', count: 1, fields: rodAppearanceFields,
          candidateDevices: rodAppDrawerDevices },
        { id: 'rod-bd', name: '绝缘操作杆 - 抗弯动负荷试验', device: 'rodbend', method: 'manual', limsLite: true, status: 'pending', count: 1, fields: rodBendDynamicFields,
          candidateDevices: rodBendDrawerDevices },
        { id: 'rod-bs', name: '绝缘操作杆 - 抗弯静负荷试验', device: 'rodbend', method: 'manual', limsLite: true, status: 'pending', count: 1, fields: rodBendStaticFields,
          candidateDevices: rodBendDrawerDevices },
      ] },
    // —— 已检任务样品（status=done，供已检任务 L2-L4 钻取）——
    { id: 's98a', code: 'SC2026/00998-01', name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', status: 'done', cable: true, client: '国网杭州供电公司',
      tests: [
        doneItem('导体直流电阻', 'dcr', 'ocr', { phased: true }),
        doneItem('结构尺寸检查—非金属护套&钢带铠装', 'cal', 'ble', { phased: false, subs: sheathArmorSubs }),
      ] },
    { id: 's98b', code: 'SC2026/00998-02', name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', status: 'done', cable: true, client: '国网杭州供电公司',
      tests: [
        doneItem('老化前绝缘的机械性能试验', 'mech', 'auto', { phased: true }),
        doneItem('XLPE绝缘的热延伸试验', 'hext', 'auto', { phased: true }),
      ] },
    { id: 's82a', code: 'SC2026/00982-01', name: '低烟无卤阻燃聚烯烃护套电力电缆', status: 'done', overdueDone: true, cable: true, client: '国网杭州供电公司',
      tests: [
        overdueDoneItem('导体直流电阻', 'dcr', 'ocr', { phased: true }),
        overdueDoneItem('XLPE绝缘的收缩试验', 'shr', 'auto', { phased: true }),
      ] },
    { id: 's82b', code: 'SC2026/00982-02', name: '低烟无卤阻燃聚烯烃护套电力电缆', status: 'done', overdueDone: true, cable: true, client: '国网杭州供电公司',
      tests: [
        overdueDoneItem('老化前绝缘的机械性能试验', 'mech', 'auto', { phased: true }),
        overdueDoneItem('非金属护套老化前的机械性能试验', 'mech', 'auto'),
      ] },
    { id: 's75a', code: 'SC2026/00975-01', name: '交联聚乙烯绝缘电力电缆', status: 'done', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        doneItem('导体直流电阻', 'dcr', 'ocr', { phased: true }),
        doneItem('老化前绝缘的机械性能试验', 'mech', 'auto', { phased: true }),
      ] },
    { id: 's61a', code: 'SC2026/00961-01', name: '钢带铠装聚氯乙烯护套电力电缆', status: 'done', cable: true, client: '国网杭州供电公司',
      tests: [
        doneItem('导体直流电阻', 'dcr', 'ocr', { phased: true }),
        doneItem('XLPE绝缘的收缩试验', 'shr', 'auto', { phased: true }),
        doneItem('结构尺寸检查—非金属护套&钢带铠装', 'cal', 'ble', { subs: sheathArmorSubs }),
      ] },
    { id: 's40a', code: 'SC2026/00940-01', name: '架空绝缘电缆', status: 'done', cable: true, client: '国网杭州供电公司',
      tests: [
        doneItem('导体直流电阻', 'dcr', 'ocr', { phased: true }),
        doneItem('老化前绝缘的机械性能试验', 'mech', 'auto', { phased: true }),
      ] },
    { id: 's40b', code: 'SC2026/00940-02', name: '架空绝缘电缆', status: 'done', cable: true, client: '国网杭州供电公司',
      tests: [
        doneItem('XLPE绝缘的热延伸试验', 'hext', 'auto', { phased: true }),
        doneItem('非金属护套老化前的机械性能试验', 'mech', 'auto'),
      ] },
    { id: 's02a', code: 'SC2026/00902-01', name: '控制电缆', status: 'done', cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        doneItem('导体直流电阻', 'dcr', 'ocr', { phased: true }),
      ] },
    { id: 's91a', code: 'SC2026/00991-01', name: '8.7/10kV-1芯 电力电缆', status: 'done', overdueDone: true, cable: true, client: '杭州数蚕智能科技有限公司',
      tests: [
        overdueDoneItem('XLPE绝缘的热延伸试验', 'hext', 'auto'),
      ] },
    { id: 'srod-done', code: 'SC2026/00490-01', name: '绝缘操作杆', status: 'done', cable: false, client: '国网浙江省电力有限公司',
      tests: [
        { id: 'rod-ac', name: '绝缘操作杆 - 交流耐压试验', device: 'rodhv', method: 'manual', limsLite: true, status: 'done', upload: 'done', fields: rodAcFields,
          doneVals: { bzz: '45', syz: '45', sj: '1', ztms: '无异常', wd: '23', qy: '1013', sd: '55', beizhu: '', jl: '合格' } },
        { id: 'rod-app', name: '绝缘操作杆 - 外观及尺寸', device: 'visual', method: 'manual', limsLite: true, status: 'done', upload: 'done', fields: rodAppearanceFields,
          doneVals: { wg: '无缺陷', yxjccd: '1.0', beizhu: '', jl: '合格' } },
        { id: 'rod-bd', name: '绝缘操作杆 - 抗弯动负荷试验', device: 'rodbend', method: 'manual', limsLite: true, status: 'done', upload: 'done', fields: rodBendDynamicFields,
          doneVals: { syc: '1', bzz: '1', syz: '93', ztms: '无异常', wd: '23', qy: '1013', sd: '55', beizhu: '', jl: '合格' } },
        { id: 'rod-bs', name: '绝缘操作杆 - 抗弯静负荷试验', device: 'rodbend', method: 'manual', limsLite: true, status: 'done', upload: 'done', fields: rodBendStaticFields,
          doneVals: { syc: '1', bzz: '100', syz: '108', sj: '1', ztms: '无异常', wd: '23', qy: '1013', sd: '55', beizhu: '', jl: '合格' } },
      ] },
  ];

  // 任务列表（首页快捷入口 / 统计）
  // doneAt = 该任务下分配给本检测员的试验项全部完成检测的时间（仅 done 任务有）
  const tasks = [
    { code: 'SC2026/01001', sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', client: '杭州数蚕智能科技有限公司', time: '2026-06-18 09:20:11', status: 'testing', detectDeadline: '2026-07-18' },
    { code: 'SC2026/01002', sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', client: '国网杭州供电公司', time: '2026-06-17 14:05:42', status: 'pending', detectDeadline: '2026-07-17' },
    { code: 'SC2026/01003', sampleName: '8.7/10kV-3芯 电力电缆', client: '国网杭州供电公司', time: '2026-06-10 08:30:00', status: 'overdue', detectDeadline: '2026-06-15' },
    { code: 'SC2026/00998', sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', client: '国网杭州供电公司', time: '2026-06-12 10:18:41', status: 'done', doneAt: '2026-06-24 16:02:10', sampleCount: 3, testCount: 8, detectDeadline: '2026-07-12' },
    { code: 'SC2026/00990', sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆', client: '杭州数蚕智能科技有限公司', time: '2026-05-29 16:31:51', status: 'overdue', detectDeadline: '2026-05-31' },
    { code: 'SC2026/01630', sampleName: '实壁类塑料电缆导管 带承口 PVC-C', client: '国网杭州供电公司', time: '2026-06-20 10:15:00', status: 'testing', detectDeadline: '2026-07-20' },
    { code: 'SC2026/00490101', sampleName: '绝缘操作杆', client: '国网浙江省电力有限公司', time: '2026-06-22 09:00:00', status: 'testing', detectDeadline: '2026-07-22' },
    // —— 历史已检任务（用于「已检任务」时间范围筛选演示）——
    { code: 'SC2026/00982', sampleName: '低烟无卤阻燃聚烯烃护套电力电缆', client: '国网杭州供电公司', time: '2026-06-19 08:40:00', status: 'done', doneAt: '2026-06-23 11:20:00', sampleCount: 2, testCount: 4, detectDeadline: '2026-06-21', overdueDone: true },
    { code: 'SC2026/00975', sampleName: '交联聚乙烯绝缘电力电缆', client: '杭州数蚕智能科技有限公司', time: '2026-06-10 09:12:00', status: 'done', doneAt: '2026-06-16 17:45:00', sampleCount: 1, testCount: 2, detectDeadline: '2026-07-10' },
    { code: 'SC2026/00961', sampleName: '钢带铠装聚氯乙烯护套电力电缆', client: '国网杭州供电公司', time: '2026-05-28 14:00:00', status: 'done', doneAt: '2026-06-04 10:05:00', sampleCount: 1, testCount: 3, detectDeadline: '2026-06-28' },
    { code: 'SC2026/00940', sampleName: '架空绝缘电缆', client: '国网杭州供电公司', time: '2026-05-08 10:30:00', status: 'done', doneAt: '2026-05-15 15:30:00', sampleCount: 2, testCount: 4, detectDeadline: '2026-06-08' },
    { code: 'SC2026/00902', sampleName: '控制电缆', client: '杭州数蚕智能科技有限公司', time: '2026-03-12 09:00:00', status: 'done', doneAt: '2026-03-20 16:40:00', sampleCount: 1, testCount: 1, detectDeadline: '2026-04-12' },
    { code: 'SC2026/00991', sampleName: '8.7/10kV-1芯 电力电缆', client: '杭州数蚕智能科技有限公司', time: '2026-05-29 16:31:51', status: 'done', doneAt: '2026-06-05 14:20:00', sampleCount: 1, testCount: 1, detectDeadline: '2026-05-31', overdueDone: true },
    { code: 'SC2026/00490', sampleName: '绝缘操作杆', client: '国网浙江省电力有限公司', time: '2026-06-15 08:30:00', status: 'done', doneAt: '2026-06-18 16:40:00', sampleCount: 1, testCount: 4, detectDeadline: '2026-07-15' },
  ];

  // 试验项相别/次数规则（含相别 → 红/黄/绿三相，perPhase=每相次数；无相别 → count=总次数）
  const testRules = {
    '导体直流电阻': { phased: true, perPhase: 1 },
    '结构尺寸检查—非金属护套&钢带铠装': { phased: false, count: 1 },
    '老化前绝缘的机械性能试验': { phased: true, perPhase: 5 },
    '非金属护套老化前的机械性能试验': { phased: false, count: 5 },
    'XLPE绝缘的热延伸试验': { phased: true, perPhase: 2 },
    'XLPE绝缘的收缩试验': { phased: true, perPhase: 1 },
    '密度测量': { phased: false, count: 3 },
  };

  const overdueTagLabel = {
    overdue_pending: '已逾期 · 未检测',
    overdue_testing: '已逾期 · 检测中',
    overdue_done: '逾期完成',
  };

  const methodLabel = { auto: '设备直连', ocr: '拍照识别', ble: '蓝牙卡尺', serial: '串口', manual: '手工录入', external: '外部程序' };
  // 蓝牙/串口允许手输（串口异常兜底）
  const allowManualInput = (method) => method === 'ble' || method === 'serial';

  // 数采 Web「设备采集配置」：试验项（采集表名）→ 已配置采集关系的「设备直连(auto)」设备 id 列表。
  // 仅对 auto 设备生效；未配置的 auto 设备在切换设备抽屉中置灰不可选（无采集关系无法回传数据）。
  const deviceCollectConfig = {
    '结构尺寸检查—导体&绝缘厚度&金属屏蔽': ['thk', 'mech'],
    '结构尺寸检查—非金属护套&钢带铠装': [],
    '老化前绝缘的机械性能试验': ['mech'],
    '非金属护套老化前的机械性能试验': ['mech'],
    'XLPE绝缘的热延伸试验': ['hext'],
    'XLPE绝缘的收缩试验': ['shr'],
    '导体直流电阻': [],
    '密度测量': [],
  };

  function taskSamples(task) {
    return samples.filter((s) => s.code.startsWith(task.code));
  }
  function taskTests(task) {
    return taskSamples(task).flatMap((s) => s.tests || []);
  }
  function isPendingTask(task) {
    if (task.status === 'done') return false;
    const tests = taskTests(task);
    const started = tests.some((t) => t.status === 'testing' || t.status === 'done');
    if (started) return false;
    return task.status === 'pending' || task.status === 'overdue';
  }
  function isTestingTask(task) {
    if (task.status === 'done') return false;
    if (task.status === 'testing') return true;
    return taskTests(task).some((t) => t.status === 'testing');
  }
  function resolveLiteDevice(item) {
    const candidates = item?.candidateDevices || [];
    return candidates.find((d) => d.id === item?.device)
      || devices.find((d) => d.id === item?.device)
      || (item?.device === 'visual' ? visualInspectionDevice : null)
      || candidates[0]
      || null;
  }

export const MOCK = { stations, devices, samples, tasks, fieldTpl, methodLabel, testRules, allowManualInput, deviceCollectConfig, overdueTagLabel, offDevices: devices.filter((d) => !d.station), taskSamples, taskTests, isPendingTask, isTestingTask, visualInspectionDevice, resolveLiteDevice };
