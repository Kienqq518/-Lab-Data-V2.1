/** 已检任务 overlay 批注配置（拆为 tab / 列表 / 底部提示三块） */
export const doneAnnotations = {
  doneRangeTabs: {
    title: '时间范围切换',
    requirementLogic: '按完成时间（doneAt）筛选近期已检任务，便于移动端复核与抽查。仅包含 status=done 且存在 doneAt 的记录。支持近 7/30/90 天及本年四个档位；默认近 30 天。',
    displayRule: '顶部 Segmented 四档按钮；下方展示当前筛选起止日期与命中任务数「共 N 个已检任务」。',
    interactionLogic: '点击切换档位后列表与底部提示即时按新范围重算；不改变任务本身状态。',
  },
  doneTaskList: {
    title: '已检任务列表',
    requirementLogic: '展示当前时间范围内已完成的委托任务，供复核。任务下样品 status=done 的进入 L3 只读复核，再进 L4 查看历史上传数据，不可修改已锁定数据。',
    displayRule: '任务列表按 doneAt 降序；任务卡展示编号、样品名、委托单位、完成时间、样品/试验项数；逾期完成的任务带「逾期完成」标记。空态提示「该时间范围内暂无已检任务」。',
    interactionLogic: '点击任务进 L3 样品+试验项主从布局；点击试验项进 L4 Collect 只读模式（reviewMode）。返回逐级回退至本列表。列表区域可纵向滚动，确保近 90 天/本年等长列表能加载完全并滚到列表末尾。',
  },
  doneHistoryHint: {
    title: '历史数据提示',
    requirementLogic: '移动端仅保留近一段时间的已检任务便于复核；更早历史不在本端全量下发，引导用户到 Web 端 LIMS 系统查询。',
    displayRule: '列表底部虚线提示卡：说明当前范围外更早任务数量（若有），并引导「更早的历史数据请前往 Web 端 LIMS 系统查询。」',
    interactionLogic: '只读提示，无跳转；随时间范围切换更新「范围外更早任务」计数文案。',
  },
};
