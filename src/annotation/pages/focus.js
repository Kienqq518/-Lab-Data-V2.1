/** 聚焦页批注配置（L2/L3，各维度共用） */
export const focusAnnotations = {
  focusL2Search: {
    title: '聚焦页搜索（L2）',
    requirementLogic: '在维度过滤后的任务子集中按编号/样品/单位搜索。',
    displayRule: 'SearchBar；待检/检测中支持扫码，逾期/临期/退回无扫码。',
    interactionLogic: '输入过滤；扫码进 L3 并高亮样品。',
    elementAnalysis: '① 输入框；② 扫码按钮（cfg.scan 为 true 时）。状态：有/无 onScan。',
  },
  focusL2Sort: {
    title: '聚焦页排序（L2）',
    requirementLogic: '各维度排序项不同；退回复测含退回时间排序。',
    displayRule: 'TaskListSort 展示当前排序。',
    interactionLogic: '切换后列表重排。',
    elementAnalysis: '① 排序选项组。退回复测：returnedAt:desc 等；其他：detectDeadline:asc 等。',
  },
  focusL2List: {
    title: '聚焦任务列表（L2）',
    requirementLogic: '按维度过滤：待检/检测中/逾期/临期/退回复测。',
    displayRule: 'TaskCard 列表；退回复测 L2 状态统一展示「检测中」。',
    interactionLogic: '点击进入 L3。',
    elementAnalysis: '① TaskCard 全套字段；② StatusTag（退回时强制 testing 色）。空态：各维度 emptyText。',
  },
  focusL3Summary: {
    title: '聚焦 L3 任务摘要',
    requirementLogic: '与检测模块 L3 一致，展示当前任务元信息。',
    displayRule: 'Card + StatusTag + 委托信息网格。',
    interactionLogic: '只读；返回 L2 或通知深链时直接退出。',
    elementAnalysis: '同 inspect taskSummary 元素。',
  },
  focusL3Samples: {
    title: '聚焦 L3 样品栏',
    requirementLogic: '退回复测仅含退回项样品；通知深链可窄到单样品。',
    displayRule: '同 inspect sampleSidebar。',
    interactionLogic: '切换样品刷新试验项。',
    elementAnalysis: '① 样品按钮列表；② 选中/扫码高亮态。',
  },
  focusL3Tests: {
    title: '聚焦 L3 试验项',
    requirementLogic: '退回复测过滤退回项；通知深链可窄到单项。',
    displayRule: 'TestItemCard 列表。',
    interactionLogic: '点击进入 L4 采集。',
    elementAnalysis: '① 试验名/设备/方式/状态/逾期标。空态「无匹配试验项」。',
  },
  taskCard: {
    title: '退回复测任务卡（L2）',
    requirementLogic: '仅展示含退回试验项的任务；L2 状态统一展示为「检测中」。',
    displayRule: '样品名、委托单位、检测时效等与 TaskCard 一致；退回时间参与排序。',
    interactionLogic: '点击进入 L3，仅展示含退回项的样品与试验项。',
    elementAnalysis: '同 focusL2List 首张卡；StatusTag 固定 testing 展示。',
  },
};
