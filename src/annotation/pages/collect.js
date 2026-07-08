/** L4 采集页批注配置 */
export const collectAnnotations = {
  flowBanner: {
    title: '流程状态条',
    requirementLogic: '展示 LIMS 当前流程节点；退回/锁定影响可编辑性。',
    displayRule: 'FlowBanner：正常/退回/锁定不同底色与文案；退回展示原因摘要。',
    interactionLogic: '只读；demo 可切换流程态。',
    elementAnalysis: '① 节点名；② 退回原因/锁定提示；③ 右上角检测状态水印（未检测黄/检测中蓝/已检测绿；退回复测未修改前隐藏）。状态：normal | returned | locked。',
  },
  basicInfo: {
    title: '基础信息区',
    requirementLogic: '展示任务、样品、试验及次数等不可改元数据。',
    displayRule: 'Section+Grid：任务编号、样品编号/名称、试验名、试验次数、检测时效、逾期标签。',
    interactionLogic: '只读；试验次数不可修改。',
    elementAnalysis: '① 标题「基础信息」；② 键值对网格；③ 逾期红色提示（有 overdueTag 时）。',
  },
  deviceInfo: {
    title: '设备信息区',
    requirementLogic: '展示当前采集设备；多设备试验项可切换。',
    displayRule: 'CollectBadge + 设备名/编号/型号；外部/串口有额外说明行。',
    interactionLogic: '多设备时「切换设备」打开 DeviceSwitchDrawer。',
    elementAnalysis: '① 设备三字段；② 切换按钮（itemDevices>1 且未锁定）；③ 外部/串口提示条。状态：锁定后隐藏切换。',
  },
  envInfo: {
    title: '环境信息区',
    requirementLogic: '温湿度等环境读数；部分试验强制从上位机/OCR 拉取不可手改。',
    displayRule: 'EnvInfoSection：温度、湿度字段；guard 时只读+来源标识。',
    interactionLogic: '可刷新 mock 环境值（非 guard）。',
    elementAnalysis: '① 温度 wd；② 湿度 sd；③ 刷新按钮；④ OCR/上位机锁定态置灰。',
  },
  testDataEntry: {
    title: '试验数据录入',
    requirementLogic: '按采集方式展示不同录入形态：整批/逐条/手输/图采/外部只读。',
    displayRule: '左次数列表+右字段卡；methodHint 说明；auto/serial/external 整批按钮。',
    interactionLogic: '采集、手输、拍照、上传、重置按方式与流程门控。',
    elementAnalysis: '① 次数 Tab（含相别色条）；② 各测点 FieldRow；③ 采集/上传/重置按钮；④ 图采附件缩略图。状态：idle/filled/uploading/busy/locked。',
  },
  uploadActions: {
    title: '上传与汇总',
    requirementLogic: '全部次数完成后可上传；汇总字段 jl/pjz 整组计算。',
    displayRule: '底部上传按钮+UploadStatus；汇总区在次数完成后展示。',
    interactionLogic: '上传后标记 uploaded；流程锁定禁止改。',
    elementAnalysis: '① 上传主按钮；② 进度文案；③ 汇总结论/平均值字段。状态：pendingUpload/allUploaded/flowLocked。',
  },
};
