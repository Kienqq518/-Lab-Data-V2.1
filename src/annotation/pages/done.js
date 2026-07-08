/** 已检任务 overlay 批注配置 */
export const doneAnnotations = {
  doneSection: {
    title: '已检任务（整块）',
    requirementLogic: '展示检测员近期已完成的委托任务，供复核与抽查。仅包含 status=done 且存在 doneAt（任务完成时间）的记录。支持按近 7/30/90 天及本年筛选。任务下样品 status=done 的进入 L3 只读复核，再进 L4 查看历史上传数据，不可修改已锁定数据。',
    displayRule: '顶部时间范围 SegmentedSwitch；任务列表按 doneAt 降序；任务卡展示编号、样品名、委托单位、完成时间；逾期完成的任务带「逾期完成」标记。L3/L4 为只读复核态。',
    interactionLogic: '点击任务进 L3 样品+试验项主从布局；点击试验项进 L4 Collect 只读模式（reviewMode）。返回逐级回退至本列表。',
  },
};
