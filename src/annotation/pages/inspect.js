/** 检测模块批注配置（L1/L2/L3 共用） */
export const inspectAnnotations = {
  modeSwitch: {
    title: '按设备 / 按任务切换',
    requirementLogic: '检测模块两种互斥钻取路径：① 按设备：本页为 L1 设备列表 → 点设备进 L2 委托任务列表 → L3 样品+试验项 → L4 采集；整条链路围绕「当前设备」过滤，仅展示该设备可参与的样品与试验项。② 按任务：本页即为 L2 委托任务列表 → L3 → L4，从任务出发不按单台设备收窄。两种入口的业务区别：按设备适合现场「我在这台仪器前，要看这台设备上要做什么」；按任务适合「我手头有这个委托单，要看所有相关试验项」。',
    displayRule: 'SegmentedSwitch 两段，默认「按任务」在前；切换时清空搜索词、重置 L2/L3 钻取栈、清除采集方式筛选。按任务模式隐藏右上角工位栏，仅显示任务总数。',
    interactionLogic: '切换后回到当前模式 L1/L2 列表首屏，不保留上一次钻取到的任务或样品。按设备模式展示工位选择；按任务模式不展示工位行。',
  },
  stationPicker: {
    title: '工位选择（按设备）',
    requirementLogic: '按设备 L1 时，工位作为设备列表的筛选条件：已选工位仅展示绑定该工位的设备 + 下方「非工位设备」折叠区；未选工位时展示全部工位设备与非工位设备混排列表。',
    displayRule: '定位图标 + 工位名（超长省略号）+「切换」+ 清除按钮（已选时）。未选时文案「未选择工位」。',
    interactionLogic: '切换打开底部工位 Sheet 单选；清除后 stationId 置空，设备列表刷新为全量；工位变化时收起非工位折叠面板。',
  },
  searchBar: {
    title: '搜索与样品扫码（L1/L2）',
    requirementLogic: 'L1 按设备：按设备名称、编号、型号过滤；L1 按任务/L2：按任务编号、样品名称、委托单位过滤。右侧扫码用于扫描样品二维码：解析样品编号后定位所属委托任务，直达 L3 并高亮该样品行，跳过 L2 手工点选。',
    displayRule: 'SearchBar 常驻；L1/L2 展示扫码图标；输入实时过滤列表，无单独「搜索」按钮。',
    interactionLogic: '输入即筛；点扫码打开 ScanSampleOverlay，模拟扫到固定 demo 样品后跳转 L3。扫码失败可关闭重试。L3 搜索见「L3 搜索」批注，L3 无扫码。',
  },
  l3SearchBar: {
    title: 'L3 搜索（样品/试验项）',
    requirementLogic: 'L3 支持按样品名称、样品编号、试验项名称联合过滤。规则：① 关键词命中样品名称或编号时，仅过滤左侧样品卡片列表，右侧展示当前选中样品下的试验项（若试验项名也命中则再收窄右侧）；② 关键词仅命中试验项名称时，左侧仅保留含该试验项的样品，右侧仅展示匹配的试验项卡片。编号搜索同时匹配原编号与转换后编号。不支持扫码。',
    displayRule: 'placeholder「请输入样品名称、样品编号、试验项搜索」；无扫码按钮。',
    interactionLogic: '输入实时过滤左右栏；清空关键词恢复全量。切换样品时右侧随当前样品刷新。',
  },
  methodFilter: {
    title: '采集方式筛选',
    requirementLogic: '按设备 L1 可按采集方式（设备直连/拍照识别/蓝牙/串口/手工录入）筛选设备列表，便于现场按仪器类型查找。计数含当前搜索条件下的设备数。',
    displayRule: '横向滑动 Chip（无「采集类型」文字标签），展示方式名与括号内台数；选中高亮对应 CollectBadge 色系。',
    interactionLogic: '单选切换；再次点击已选中项可取消筛选回到「全部」。与工位筛选、关键词搜索叠加生效。',
  },
  deviceCard: {
    title: '设备卡片（L1）',
    requirementLogic: '展示当前筛选条件下可检设备。点击进入该设备 L2 委托任务列表，后续 L3 仅展示此设备可做的样品与试验项。',
    displayRule: 'DeviceCard：设备名、编号、型号、所在区域（工位名或「非工位设备」）、采集方式徽章、关联试验项数。',
    interactionLogic: '点击进入 L2；列表无匹配时展示空态「无匹配设备」。',
  },
  offDevicePanel: {
    title: '非工位设备折叠区',
    requirementLogic: '展示 Web「设备管理」维护的未绑定工位设备（便携/蓝牙/串口天平等）。与工位内设备分开展示，避免混淆。当右上角选择具体工位时：工位内设备在上方主列表展示，本区仍展示全部非工位设备（不受工位筛选隐藏）。当清除工位筛选（未选工位）时：工位设备与非工位设备在主列表混排，本折叠区仍保留，用于显式区分便携设备集合。',
    displayRule: '虚线边框 BLE 色系；标题「非工位设备/便携设备」+ 台数；默认折叠，展开后 DeviceCard 列表。',
    interactionLogic: '点击标题展开/收起；展开后卡片交互同 L1 设备卡。切换工位或清除工位后列表即时重算，不自动展开。',
  },
  taskSort: {
    title: '任务排序',
    requirementLogic: '委托任务列表支持按任务编号、下发时间、检测时效升降序排列，默认检测时效升序（最紧急在前）。',
    displayRule: '胶囊按钮展示当前排序字段与方向；点击从底部弹出排序面板（移动端 BottomSheet 规范）。',
    interactionLogic: '选择排序项后列表即时重排并关闭面板；点击遮罩或取消关闭。排序面板挂载在手机屏根节点，避免被局部容器裁剪。',
  },
  taskList: {
    title: '委托任务列表（L1 按任务）',
    requirementLogic: '按任务模式下的 L2 入口：展示全部进行中委托任务（待检、检测中、逾期），不含 status=done 已检归档任务（已检任务统一从首页「快捷入口 → 已检任务」进入）。支持排序与关键词过滤。',
    displayRule: 'TaskCard 展示任务编号、样品名、委托单位、下发时间、检测时效、StatusTag。逾期任务时效字段红色。',
    interactionLogic: '点击进 L3；搜索框扫码可直达 L3。试验项逾期时卡片或 L3 试验项展示 overdueTag：已逾期·未检测 / 已逾期·检测中 / 逾期完成。',
  },
  deviceSummary: {
    title: '设备摘要（L2 按设备）',
    requirementLogic: '从 L1 点设备后进入 L2，顶部确认当前检测对象（设备身份、所属工位与采集方式），后续任务列表均围绕该设备过滤。',
    displayRule: 'Card 展示设备名、编号·型号、所属工位（绑定工位名或「未绑定工位」）、CollectBadge。',
    interactionLogic: '只读；AppBar 返回回 L1 设备列表。',
  },
  deviceTaskList: {
    title: '设备相关任务（L2 按设备）',
    requirementLogic: '仅展示下属样品/试验项涉及当前设备的进行中委托任务（排除 status=done 已检归档）；排序与 L1 按任务一致。',
    displayRule: '标题「委托任务（N）」+ TaskCard 列表。',
    interactionLogic: '点击进 L3，样品栏与试验项按设备过滤。',
  },
  taskSummary: {
    title: '任务摘要（L3）',
    requirementLogic: 'L3 顶栏固定展示当前委托任务元信息，不随左侧样品切换而变化（任务级信息）。',
    displayRule: '任务编号 + StatusTag；网格展示委托单位、样品数、下发时间、检测时效（逾期红色）。',
    interactionLogic: '只读；返回回到 L2 来源页（按设备/按任务）。',
  },
  sampleSidebar: {
    title: '样品左栏（L3）',
    requirementLogic: '一个委托任务可含多个样品；左栏切换当前样品驱动右侧试验项。扫码进入时可高亮目标样品。受 L3 搜索过滤：搜样品名/编号时收窄左栏；搜试验项时仅保留含匹配试验项的样品。',
    displayRule: '160px 按钮列表：StatusTag、序号、样品名两行截断；选中左蓝条+浅底；扫码样品加蓝色描边高亮。不展示样品编号，避免卡片过长。',
    interactionLogic: '点击切换样品；点击样品名弹出全名 tooltip（不阻断切换）。',
  },
  testItemCard: {
    title: '试验项卡片（L3）',
    requirementLogic: '展示当前样品下试验项；按设备模式仅展示当前设备可执行项。逾期试验项通过 overdueTag 区分：已逾期·未检测（pending+逾期）、已逾期·检测中（testing+逾期）、逾期完成（done 且超时完成）。',
    displayRule: 'TestItemCard：试验名、设备、采集方式、StatusTag、逾期标签文案。',
    interactionLogic: '点击进入 L4 采集（Collect / CollectLite / CollectStructured 按试验项类型分流）。',
  },
};
