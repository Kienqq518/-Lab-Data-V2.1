/** 聚焦页（退回复测等）批注配置 */
export const focusAnnotations = {
  taskCard: {
    title: '退回复测任务卡（L2）',
    requirementLogic: '仅展示含退回试验项的任务；L2 状态统一展示为「检测中」。',
    displayRule: '样品名、委托单位、检测时效等与 TaskCard 一致；退回时间参与排序。',
    interactionLogic: '点击进入 L3，仅展示含退回项的样品与试验项。',
  },
  returnedGoProcess: {
    title: '通知详情·去处理',
    requirementLogic: '仅退回复测类通知展示；需带 taskCode、sampleCode、testName。',
    displayRule: '详情展示退回节点、退回人（昵称+部门）；描述区展示退回原因。',
    interactionLogic: '直达退回复测 L3，且窄过滤到该样品 + 该试验项；返回回到通知中心。',
  },
};
