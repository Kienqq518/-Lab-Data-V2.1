/** 聚焦页批注配置（L2/L3，各维度共用） */
export const focusAnnotations = {
  focusL2Search: {
    title: '聚焦页搜索（L2）',
    requirementLogic: '在维度过滤后的任务子集中，按任务编号、样品名称、委托单位模糊搜索。待检/检测中聚焦页额外支持扫码进 L3；逾期/临期/退回聚焦页无扫码。',
    displayRule: 'SearchBar；仅 pending/testing 配置 onScan 展示扫码图标。',
    interactionLogic: '输入实时过滤；扫码解析样品后直达 L3 并高亮样品（仅 pending/testing）。',
  },
  focusL2Sort: {
    title: '聚焦页排序（L2）',
    requirementLogic: '各维度排序项不同。逾期/临期默认「检测时效·最紧急在前」(detectDeadline:asc)；退回复测默认「退回时间·最新在前」(returnedAt:desc)；待检/检测中默认同为检测时效升序。',
    displayRule: 'TaskListSort 胶囊展示当前排序；退回复测排序项含退回时间。',
    interactionLogic: '切换后列表即时重排；底部 Sheet 选择，避免被父容器裁剪。',
  },
  focusL2List: {
    title: '聚焦任务列表（L2）',
    requirementLogic: '按入口维度过滤：待检（含已逾期但未开检）/ 检测中（含已逾期仍在检）/ 逾期（status=overdue）/ 临期（3 日内到期且未完成未逾期，任务状态可为未检测或检测中）/ 退回复测（含退回试验项）。从首页「逾期任务」「3 日内到期」进入时默认排序均为检测时效最紧急在前。',
    displayRule: 'TaskCard 列表；退回复测 L2 统一展示 StatusTag「检测中」；临期列表同时出现「未检测」「检测中」状态卡。空态展示各维度文案。',
    interactionLogic: '点击进 L3；待检/检测中列表不排除已逾期任务（mock：isPendingTask/isTestingTask 对 overdue 状态仍返回 true）。',
  },
  focusL3Summary: {
    title: '聚焦 L3 任务摘要',
    requirementLogic: '与检测模块 L3 相同，展示当前任务元信息。通知深链进入时返回直接退出聚焦页回通知中心。',
    displayRule: 'Card + StatusTag + 委托信息网格。',
    interactionLogic: '只读；返回逻辑受 fromNotify 控制。',
  },
  focusL3Search: {
    title: '聚焦 L3 搜索',
    requirementLogic: '同检测 L3：样品名称、样品编号、试验项名称联合过滤；搜样品收窄左栏，搜试验项收窄左右栏。退回复测/通知深链场景下样品与试验项可能已预过滤。无扫码。',
    displayRule: 'placeholder 含样品名称与编号；无扫码按钮。',
    interactionLogic: '实时过滤；不支持扫码。',
  },
  focusL3Samples: {
    title: '聚焦 L3 样品栏',
    requirementLogic: '退回复测仅展示含退回试验项的样品；通知「去处理」深链可窄到单样品。受搜索过滤影响。',
    displayRule: '同检测 L3 样品左栏样式与选中/高亮规则。',
    interactionLogic: '切换样品刷新右侧试验项列表。',
  },
  focusL3Tests: {
    title: '聚焦 L3 试验项',
    requirementLogic: '退回复测过滤退回试验项；通知深链可窄到单项。逾期试验项展示三态 overdueTag。点击进入 L4。',
    displayRule: 'TestItemCard 列表；逾期标签与 StatusTag 并存。',
    interactionLogic: '点击采集；空态「无匹配试验项」。',
  },
  taskCard: {
    title: '退回复测任务卡（L2）',
    requirementLogic: '退回复测聚焦页任务卡：仅含被退回且未复测完成的试验项的任务；L2 卡片状态统一展示「检测中」以提示需处理，与任务真实 pending/testing 区分展示。',
    displayRule: '同 TaskCard 字段；StatusTag 强制 testing 色。',
    interactionLogic: '进入 L3 后仅展示含退回项的样品与试验项。',
  },
};
