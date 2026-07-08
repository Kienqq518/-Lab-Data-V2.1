/** 通知中心批注配置 */
export const notifyAnnotations = {
  notifyList: {
    title: '通知列表',
    requirementLogic: '聚合退回复测、任务下发、逾期预警等消息。未读条数回写首页铃铛角标。列表按时间倒序，已读/未读影响行背景色。',
    displayRule: '每行：类型图标圆底、标题、未读红点、类型标签、摘要两行、时间。未读浅蓝底，已读白底。',
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
    requirementLogic: '展示通知完整元数据。退回复测类展示退回节点、退回人（昵称+部门）、退回原因；任务下发/逾期类展示来源等字段差异。',
    displayRule: '白卡：类型图标、标题、类型标签、时间、键值行、描述灰底区。',
    interactionLogic: '只读；退回类底部展示「去处理」。',
  },
  returnedGoProcess: {
    title: '通知详情·去处理',
    requirementLogic: '仅退回复测通知展示。需携带 taskCode、sampleCode、testName 以深链到退回复测 L3，并窄过滤到该样品+该试验项，避免检测员在大量退回项中查找。',
    displayRule: '详情区下方主按钮「去处理」。',
    interactionLogic: '直达 focus-returned L3；返回链回到通知中心而非首页。',
  },
};
