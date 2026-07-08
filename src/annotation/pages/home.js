/** 首页批注配置 */
export const homeAnnotations = {
  notifyBell: {
    title: '消息通知铃铛',
    requirementLogic: '登录检测员可见；未读数来自通知中心未读条数统计。',
    displayRule: '未读 > 0 时右上角显示红色角标数字；无未读仅展示铃铛图标。',
    interactionLogic: '点击打开消息通知 overlay（列表 + 详情）；退回复测类支持「去处理」深链。',
  },
  workOverview: {
    title: '今日工作概览',
    requirementLogic: '仅展示需优先处理的异常维度：逾期、3 日内到期、退回复测；不含与快捷入口重复的「检测中」。',
    displayRule: '数值取自 inspectorWorkMetrics；三卡横向等分排列。',
    interactionLogic: '分别进入 focus overlay：overdue / dueSoon / returned 聚焦页 L2 任务列表。',
  },
  overdueCard: {
    title: '逾期任务卡',
    requirementLogic: '统计检测时效已过且任务未完成的委托任务数。',
    displayRule: '逾期色调 StatCard；数值为 0 时仍展示。',
    interactionLogic: '点击进入 overdue 聚焦页 L2。',
  },
  quickPending: {
    title: '快捷入口·待检任务',
    requirementLogic: '统计当前检测员名下 status 为 pending 的委托任务数。',
    displayRule: '数字 + 待检色调；任务数为 0 仍展示 0。',
    interactionLogic: '点击打开 pending 聚焦页（L2 任务列表，支持扫码进 L3）。',
  },
};
