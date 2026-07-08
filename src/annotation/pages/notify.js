/** 通知中心批注配置 */
export const notifyAnnotations = {
  notifyList: {
    title: '通知列表',
    requirementLogic: '展示退回复测、任务下发、逾期预警等消息；未读高亮。',
    displayRule: '列表项：类型图标圆底、标题、未读红点、类型标签、摘要两行、时间。',
    interactionLogic: '点击进详情并标已读。',
    elementAnalysis: '① TypeIcon（returned/assigned/overdue 三色）；② 未读蓝底/已读白底；③ 未读红点 8px。状态：read true/false。',
  },
  markAllRead: {
    title: '全部已读',
    requirementLogic: '一键将所有未读通知标为已读。',
    displayRule: 'AppBar 右侧文字按钮；无未读时不展示。',
    interactionLogic: '点击后列表项全部 read=true，角标清零。',
    elementAnalysis: '① 「全部已读」链接按钮。状态：unread>0 显示 / 隐藏。',
  },
  notifyDetail: {
    title: '通知详情卡片',
    requirementLogic: '展示通知完整元数据与描述正文。',
    displayRule: '白卡：类型图标、标题、类型标签、时间、键值行、描述灰底区。',
    interactionLogic: '只读；退回类底部有「去处理」。',
    elementAnalysis: '① 标题+meta 行；② DetailLine 多行（任务编号/样品/试验/退回节点/退回人）；③ desc 区。类型差异：returned 展示退回节点与人。',
  },
  returnedGoProcess: {
    title: '通知详情·去处理',
    requirementLogic: '仅退回复测类通知展示；需带 taskCode、sampleCode、testName。',
    displayRule: '详情展示退回节点、退回人（昵称+部门）；描述区展示退回原因。',
    interactionLogic: '直达退回复测 L3，且窄过滤到该样品 + 该试验项；返回回到通知中心。',
    elementAnalysis: '① 主按钮「去处理」block lg。状态：仅 type=returned 渲染。',
  },
};
