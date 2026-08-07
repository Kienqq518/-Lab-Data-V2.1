/** 「我的」Tab 及子页批注配置 */
export const meAnnotations = {
  feedbackEmail: {
    title: '意见反馈·邮箱',
    requirementLogic: '帮助与反馈页「意见反馈」行仅展示反馈邮箱地址占位，供检测员通过邮件提交意见；不提供 App 内反馈表单页（无反馈类型、正文、图片上传、提交按钮等二级页面）。邮箱地址由检测机构在数采 Web 端或部署文档中配置，App 只读展示。',
    displayRule: '「意见反馈」行：左侧编辑图标 + 标签 + 右侧灰色邮箱占位（如 feedback@labdata.cn）；无右箭头、不可点击跳转。',
    interactionLogic: '只读展示；检测员自行复制邮箱或通过系统邮件客户端发送反馈，App 不承载表单提交。',
  },
  settingsCameraOrientation: {
    title: '设置·相机方向锁定',
    requirementLogic: '针对华为、小米等 Android 平板拍照方向与 OCR 识别规则不一致问题，提供本机「相机方向锁定」：开启后可固定对拍照/选图结果顺时针旋转 0°/90°/180°/270°，在送入 OCR 前统一为识别规则期望的正立方向。配置仅存本机 localStorage，按设备生效，不上传服务端。关闭时仅依赖浏览器/系统的 EXIF 自动扶正，不做额外旋转。重新识别已归档参照图时不二次旋转。',
    displayRule: '设置页「拍照识别」分区：Switch「相机方向锁定」+ 四选一角度单选（开关关闭时置灰）+ 灰字说明华为/小米平板场景。设置页不再提供 IP 连接配置（改由登录页双击「欢迎来访」进入独立页）。',
    interactionLogic: '开关或角度变更即时保存并 toast「相机方向设置已保存」；拍照识别、相册选图走 ocr-image-pipeline 预处理；重新识别不再旋转已校正图片。',
  },
};
