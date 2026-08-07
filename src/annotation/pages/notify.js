/** 通知中心批注配置 */
export const notifyAnnotations = {
  notifyList: {
    title: '通知列表',
    requirementLogic: '按委托任务为单位聚合退回复测、任务下发、逾期预警等消息（同一任务同一类型合并为一条）。未读条数回写首页铃铛角标。列表按时间倒序，已读/未读影响行背景色。',
    displayRule: '每行：类型图标圆底、标题、未读红点、类型标签、任务级摘要两行、时间。未读浅蓝底，已读白底。',
    interactionLogic: '点击进详情并标记该条已读；不支持批量删除。',
  },
  markAllRead: {
    title: '全部已读',
    requirementLogic: '存在未读时提供一键全部已读，用于快速清零角标。',
    displayRule: 'AppBar 右侧文字按钮；unread=0 时不渲染。',
    interactionLogic: '点击后全部 read=true，铃铛角标归零。',
  },
  notifyDetail: {
    title: '通知详情卡片',
    requirementLogic: '按委托任务展示通知元数据。退回复测类展示任务编号、样品名称、退回节点、退回人（昵称+部门）及任务级退回摘要；任务下发/逾期类展示任务编号、样品名称、来源等字段差异。不按单样品/单试验项拆条。',
    displayRule: '白卡：类型图标、标题、类型标签、时间、键值行、描述灰底区。',
    interactionLogic: '只读；底部展示「去处理」。',
  },
  returnedGoProcess: {
    title: '通知详情·去处理',
    requirementLogic: '各类型通知均展示。携带 taskCode 深链到对应维度（退回复测 / 待检或检测中 / 逾期）的任务 L3；L3 展示该任务下分配给当前检测员的样品试验项（退回复测维度再叠加退回过滤），不再窄到单样品或单试验项。',
    displayRule: '详情区下方主按钮「去处理」。',
    interactionLogic: '直达对应 focus L3；返回链回到通知中心而非首页。',
  },
};
