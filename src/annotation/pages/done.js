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
    requirementLogic: '展示当前时间范围内已完成的委托任务，供复核。任务下样品 status=done 的进入 L3 复核，再进 L4 查看历史上传数据。L4 默认以复核为主；<b>特定情况下仍可编辑</b>——当 LIMS 流程节点仍在「试验检测」、尚未进入「组内审核」及以后锁定节点时，允许修改并重新上传；流程锁定后只读。',
    displayRule: '任务列表按 doneAt 降序；任务卡展示编号、样品名、委托单位、完成时间、样品/试验项数；逾期完成的任务带「逾期完成」标记。空态提示「该时间范围内暂无已检任务」。',
    interactionLogic: '点击任务进 L3 样品+试验项主从布局；点击试验项进 L4（reviewMode）。流程未锁定时字段可编辑并支持重新上传；流程锁定后底栏仅「返回（数据已锁定）」。返回逐级回退至本列表。',
  },
  doneHistoryHint: {
    title: '历史数据提示',
    requirementLogic: '移动端仅保留近一段时间的已检任务便于复核；更早历史不在本端全量下发，引导用户到 Web 端 LIMS 系统查询。',
    displayRule: '列表底部虚线提示卡：说明当前范围外更早任务数量（若有），并引导「更早的历史数据请前往 Web 端 LIMS 系统查询。」',
    interactionLogic: '只读提示，无跳转；随时间范围切换更新「范围外更早任务」计数文案。',
  },
};
