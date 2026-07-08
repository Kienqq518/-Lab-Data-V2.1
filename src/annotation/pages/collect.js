/** L4 采集页批注配置 */
export const collectAnnotations = {
  flowBanner: {
    title: '流程状态条',
    requirementLogic: '展示 LIMS 当前流程节点。进入组内审核及之后节点时数据锁定不可改；从审核退回到「试验检测」时展示退回原因，允许修改并需重新上传。退回复测刚进入且检测员未改数据前，右上角检测状态水印不展示，仅保留历史已上传数据供核对。',
    displayRule: 'FlowBanner 区分正常/退回/锁定底色与文案；退回展示退回节点与原因摘要。水印：未检测(黄)/检测中(蓝)/已检测(绿)，退回未触碰时不显示。',
    interactionLogic: '只读提示；demo 可切换流程态验证锁定与退回。修改或重置数据后水印按进度出现。',
  },
  basicInfo: {
    title: '基础信息区',
    requirementLogic: '展示任务、样品、试验及试验次数等 LIMS 下发且不可改的元数据。试验次数 = 样段×试样×芯数（或任务指定 count），检测员不可调整。逾期试验项在基础区下方红色提示 overdueTag 文案。',
    displayRule: 'Section+Grid：任务编号、样品编号/名称、试验名称、试验次数、检测时效；底部灰字说明次数不可改。',
    interactionLogic: '只读；随 ctx 带入，不因切换设备变化。',
  },
  deviceInfo: {
    title: '设备信息区',
    requirementLogic: '展示当前采集绑定设备。复合试验项（CollectStructured）按子项联动设备；单设备试验项若后台配置多台候选设备，可切换但仅限候选池且受「设备采集配置」约束（无采集关系的 auto 设备不可选）。',
    displayRule: 'CollectBadge + 设备名/编号/型号；多设备时「切换设备」按钮；外部程序/串口有条目说明。',
    interactionLogic: '切换打开 DeviceSwitchDrawer 单选；流程锁定后隐藏切换。设备决定 L4 采集方式与字段模板。',
  },
  envInfo: {
    title: '环境信息区',
    requirementLogic: '温湿度等环境读数；部分试验（如热延伸）环境字段由上位的 OCR/上位机规则锁定为只读并标注来源，防止手改。其余可刷新 mock 读数。',
    displayRule: 'EnvInfoSection：温度、湿度；guard 态只读灰显。',
    interactionLogic: '非 guard 时可点刷新；guard 时仅展示不可编辑。',
  },
  testDataEntry: {
    title: '试验数据录入',
    requirementLogic: '核心录入区，按采集方式自适应：① auto 设备直连：上位机整批写库，一键采集全部次数+汇总，字段只读；② ocr 拍照识别：识别规则验证通过才显示拍照入口，逐条识别可单条上传，默认识别结果锁定可解锁编辑，每次保留一张参照图；③ ble 蓝牙：逐条连接同步，可手输兜底；④ serial 串口：工业平板串口程序写库，App 一键读取已采数据且直接为已上传态，异常可手输；⑤ external 外部程序：平板代采写库，App 无采集按钮，可查看已采+手输补录；⑥ manual 手工：逐条手输。含相别试验按红/黄/绿相展示，每相多次；汇总字段 jl/pjz 在全部次数完成后由 LIMS 规则计算回显，移动端不手录结论。',
    displayRule: '左次数列表+右字段卡主从；methodHint 说明当前方式；auto/serial/external 整批操作区在卡片上方；逐条方式在卡片内采集/上传/重置。逾期退回项修改后 uploaded 重置为 false。',
    interactionLogic: '采集/手输/拍照/上传/重置受流程锁定与采集方式门控；退回复测 touchReturn 后展示水印并允许重传。',
  },
  uploadActions: {
    title: '上传与汇总',
    requirementLogic: '蓝牙/图采支持逐条「确认并上传本次」；全部次数 filled 后可「上传」或底部显示待上传数。全部 uploaded 后按钮变「完成并退出」。流程锁定后仅可返回。汇总区在次数完成后展示结论/平均值只读字段。',
    displayRule: '底栏：重置全部（非锁定）+ 主上传/完成按钮；UploadStatus 文案随 pendingUpload 变化。',
    interactionLogic: '上传后标记 uploaded；锁定态主按钮为「返回（数据已锁定）」。',
  },
};
