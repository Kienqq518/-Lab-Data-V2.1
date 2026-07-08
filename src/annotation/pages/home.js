/** 首页批注配置 */
export const homeAnnotations = {
  notifyBell: {
    title: '消息通知铃铛',
    requirementLogic: '登录后的检测员在首页右上角可见通知入口。未读数量来自通知中心中 read=false 的条数汇总，与「我的-消息通知」共用同一数据源。仅统计当前登录检测员可见的通知，不含已归档历史。',
    displayRule: '铃铛图标常显；未读数 > 0 时在右上角展示红色圆形角标并显示数字；无未读时不展示角标。角标数字超过 99 时可按产品约定截断为 99+。',
    interactionLogic: '点击后打开消息通知全屏 overlay：先进入通知列表，点击单条进入详情。退回复测类通知在详情页提供「去处理」，深链到退回复测 L3 并窄过滤到对应样品与试验项。',
  },
  companyHeader: {
    title: '公司标题栏',
    requirementLogic: '展示当前登录用户所属检测机构/公司全称，用于建立首页品牌与组织上下文，与 LIMS 下发任务中的委托方字段无直接联动。',
    displayRule: 'SectionTitle 左对齐单行展示；与右侧通知铃铛同一行两端对齐；超长时可省略但不换行。',
    interactionLogic: '纯展示，不可点击，无跳转。',
  },
  brandBanner: {
    title: '品牌宣传条',
    requirementLogic: '首页顶部固定品牌露出位，传达「实验室数智化系统」与「试验数据实时采集」的产品定位，不参与业务统计。',
    displayRule: '深蓝底圆角横幅；含系统名小字、主标语、副标语；右上装饰半透明圆。高度压扁以给下方业务区留空间。',
    interactionLogic: '纯展示，无点击行为。',
  },
  workOverviewSection: {
    title: '今日工作概览（整块）',
    requirementLogic: '聚合展示检测员需优先关注的异常待办三个维度：逾期任务、3 日内到期任务、退回复测任务。数值分别统计：① 检测时效已过且未完成的委托任务数；② 未完成、未逾期且在 3 个自然日内到期的任务数；③ 含退回试验项且尚未复测完成的任务数。本区不含「检测中」维度（该维度在快捷入口展示）。',
    displayRule: '区块标题「今日工作概览」+ 三张 StatCard 横向等分：逾期（红）、3 日内到期（黄）、退回复测（蓝）。数值为 0 时仍展示 0，不隐藏卡片。',
    interactionLogic: '点击「逾期任务」进入 overdue 聚焦页 L2，默认排序「检测时效·最紧急在前」；点击「3 日内到期」进入 dueSoon 聚焦页 L2，默认排序同为「检测时效·最紧急在前」；点击「退回复测」进入 returned 聚焦页 L2，默认排序「退回时间·最新在前」。',
  },
  quickEntrySection: {
    title: '快捷入口（整块）',
    requirementLogic: '按委托任务维度统计三类工作量：① 待检：任务下所有试验项均未开始（含 status=overdue 但尚未有任何试验项进入检测中的任务）；② 检测中：任务或下属试验项存在 testing 状态；③ 已检：任务 status=done 且存在 doneAt（任务完成时间，表示该委托任务已全部检毕并落库的时间戳）。',
    displayRule: '三张 Quick 卡横向等分：待检（黄）、检测中（蓝）、已检（绿）；每张展示图标、数字、标签。数字为 0 时仍展示。',
    interactionLogic: '待检 → pending 聚焦页 L2（列表含已逾期但未开检的任务，支持扫码进 L3）；检测中 → testing 聚焦页 L2（列表含已逾期但仍在检的任务）；已检 → 打开「已检任务」overlay（近 30 天已完成任务复核列表，只读进 L4）。',
  },
  inspectorStats: {
    title: '个人检测统计',
    requirementLogic: '展示当前检测员本人负责的样品检测量与试验检测量趋势，用于自我工作量感知。数据范围仅限本人，不含班组汇总。',
    displayRule: '顶部日期区间（只读）+ 本年/本季/本月 SegmentedSwitch；下方两张折线图 Card：样品检测量（蓝）、试验检测量（橙）。',
    interactionLogic: '切换时间区间刷新 mock 折线数据；点击折线图数据点展示该点 Y 轴具体数值 tooltip；图表不支持钻取到任务明细。',
  },
};
