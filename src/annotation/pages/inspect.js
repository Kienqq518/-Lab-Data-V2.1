/** 检测模块批注配置 */
export const inspectAnnotations = {
  modeSwitch: {
    title: '按设备 / 按任务切换',
    requirementLogic: '两种钻取路径互斥：按设备从设备出发；按任务从委托任务出发。',
    displayRule: '分段切换控件；切换时重置 L2/L3 钻取状态与搜索关键词。',
    interactionLogic: '切换后停留在 L1 列表；按任务模式不展示工位栏。',
  },
  taskList: {
    title: '委托任务列表（L2）',
    requirementLogic: '按任务模式下展示全部可检任务；支持排序与关键词过滤。',
    displayRule: 'TaskCard 展示编号、样品名、委托单位、时效与状态标签。',
    interactionLogic: '点击任务卡进入 L3（样品左栏 + 试验项右栏）；搜索框右侧可扫码直达 L3。',
  },
  testItemCard: {
    title: '试验项卡片（L3）',
    requirementLogic: '仅展示当前样品下试验项；按设备模式过滤为该设备可做项。',
    displayRule: '展示试验名、设备、采集方式、状态；逾期项带 overdueTag。',
    interactionLogic: '点击进入 L4 采集页（Collect / CollectLite / CollectStructured）。',
  },
};
