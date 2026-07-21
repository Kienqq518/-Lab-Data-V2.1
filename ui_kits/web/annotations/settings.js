/** 数采 Web · 系统设置 / 系统参数 批注配置 */
window.WEB_ANNOTATION_REGISTRY = window.WEB_ANNOTATION_REGISTRY || {};

window.WEB_ANNOTATION_REGISTRY['web-settings'] = {
  sampleCodeConversion: {
    title: '启用样品编号转换',
    requirementLogic:
      '对接第三方 LIMS 时，原样品编号可能含汉字、特殊符号或超长字符串，上位机与设备直连程序无法稳定识别。开启后，后端在任务/样品同步阶段调用编号转换接口：提取原编码中的字母数字片段，拼接为唯一标准 ID（如 SC2026/01001-01、LIMS/20260720/001-02）；允许字符为 A–Z、a–z、0–9 及 /、-、_，且分隔符仅出现在片段之间，不得连续出现（禁止 -_-_-、/_ / 等）。标准 ID 写入映射表，App 与上位机交互一律使用标准 ID；App 列表展示「转换后编号（原编号）」便于现场核对；样品标签二维码编码标准 ID，上位机扫描该码定位样品试验项。关闭时全链路直接使用 LIMS 原编号，适用于数蚕 LIMS 直连或编号已规范的场景。本开关按检测机构生效，检测员 App 只读同步，不可在移动端修改。',
    displayRule:
      '入口：侧边栏「系统设置 → 系统参数」→ Tab「参数设置」。表单项位于「图采压缩开关」下方：左列标签「启用样品编号转换」，右列 Switch + 状态文案「开启/关闭」（开启蓝色 #2563eb，关闭灰色 #9aa3b2）；标签下 12.5px 灰字一行说明转换目的与 App 展示格式。开启后在同一 Tab 内下方展开「转换预览」区（见 sampleCodePreview 批注）。',
    interactionLogic:
      'Toggle 切换后立即保存（原型持久化 localStorage 键 labdata_sample_code_conversion_enabled；生产为 PUT 系统参数接口）。保存成功后 App 在下次拉取任务列表 / 采集上下文时同步该开关；已打开页面需刷新或重新进入 L3/L4 才更新展示。开启/关闭无需二次确认；关闭后不再对新入库样品做转换，历史映射保留。与「数蚕lims直连」独立：直连关闭第三方编号转换仍可单独启用。',
  },
  sampleCodePreview: {
    title: '转换预览',
    requirementLogic:
      '管理端只读展示若干第三方 LIMS 非标编号经转换接口后的标准 ID 与 App 展示格式，供实施与需求评审确认规则效果。预览行数据为内置示例，不代表生产映射表全量；生产环境以 LIMS 下发后后端持久化的「原编号 ↔ 标准 ID」映射为准，同一原编号多次下发应得到稳定标准 ID（幂等）。',
    displayRule:
      '仅当「启用样品编号转换」= 开启时展示。标题「转换预览（第三方 LIMS 非标编号示例）」+ 四列表格：原编号（LIMS 下发）、箭头、标准 ID（系统交互，蓝色加粗 tabular-nums）、App 展示格式（「标准ID（原编号）」）。原编号列 monospace 11.5px，支持换行。',
    interactionLogic:
      '只读演示，无排序、筛选、编辑、导出。开关关闭时整块隐藏。批注模式：预览区右上角显示序号打点，点击后加载批注卡片；与 sampleCodeConversion 打点独立编号（1、2）。',
  },
};
