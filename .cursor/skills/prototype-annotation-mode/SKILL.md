---
name: prototype-annotation-mode
description: Guides adding and editing prototype annotation-mode specs for the Lab Data mobile prototype. Use when the user mentions 批注模式, annotation mode, 需求逻辑/展示规则/交互逻辑, AnnotatedWrapper, or wants to document UI regions for review.
---

# 原型批注模式（Annotation Mode）

## 产品定义（原文）

原型内置「批注模式」开关：开启后在手机框两侧留白轨道展示每个区域的批注卡片，每张卡片含三段——需求逻辑、展示规则、交互逻辑，hover 对应区域高亮联动。批注覆盖原型中所有页面及主要功能。

## 何时使用本 Skill

- 新增/修改页面 UI 时，同步补充或更新批注
- 用户要求「写进批注」「批注说明」「评审文档与原型对齐」
- 排查批注不显示、hover 不联动、overlay 下层批注泄漏

## 架构速览

```
src/annotation/
├── AnnotatedWrapper.jsx    # 锚点：虚线框 + hover 高亮
├── AnnotationSideRails.jsx # 左右轨道 + 批注卡片定位
├── AnnotationTooltip.jsx   # 三段式卡片 UI
├── registry.js             # pageKey → 批注配置映射
└── pages/*.js              # 各页面批注文案（数据源）
```

- **开关**：`AnnotationToggle`，状态持久化 `localStorage.labdata_annotation_mode`
- **舞台**：`AnnotationSideRails` 包裹手机框，开启后舞台加宽（`STAGE_WIDTH_ANNOTATED`）
- **overlay 隔离**：`collect` / `done` / `focus` / `notify` 打开时，仅 `.overlay-screen` 内锚点注册，避免底层页批注泄漏

## 批注数据结构

每个锚点对应 `pages/<page>.js` 中的一项：

```js
anchorId: {
  title: '区域标题',
  requirementLogic: '为什么这样设计、业务规则、过滤口径',
  displayRule: '长什么样、字段/颜色/文案/空态',
  interactionLogic: '点击/切换/跳转/锁定态等行为',
}
```

**写作原则**
- 三段各司其职，不混写
- 写评审可对照的具体规则（状态枚举、入口路径、排序默认值）
- 与 mock 数据、飞书评审文档保持一致；改业务逻辑时同步改批注

## 添加批注（最小流程）

1. **确定 pageKey**（见 [reference.md](reference.md)）
   - Tab 级：`home` / `inspect-l1` / `me`
   - Overlay：`collect` / `done` / `notify` / `focus-{kind}`
   - 嵌套层：用 `AnnotationPageKeyProvider` 覆盖，如 `inspect-l3`、`focus-l3`

2. **在 `pages/<page>.js` 增加配置项**（`title` + 三段逻辑）

3. **在 `registry.js` 注册 pageKey**（若为新 key）

4. **用 `AnnotatedWrapper` 包裹目标 UI**

```jsx
import { AnnotatedWrapper } from '../annotation/index.js';

<AnnotatedWrapper id="myAnchor" layout="block">
  <Card>...</Card>
</AnnotatedWrapper>
```

- `id` 必须与配置对象 key 一致
- `layout`: `block`（块级）| `inline`（行内）
- 列表首项可绑批注，其余项 `id={undefined}` 避免重复卡片
- L4 等深层页：确保在 `overlay-screen` 内

5. **验证**：开启批注模式 → hover 区域高亮 → 左右轨道出现对应卡片 → 文案完整

## 常见 pageKey

| 场景 | pageKey |
|------|---------|
| 首页 | `home` |
| 检测 L1 | `inspect-l1` |
| 检测 L2（按设备） | `inspect-l2-device` |
| 检测 L3 | `inspect-l3` |
| L4 采集 | `collect` |
| 聚焦页 L2 | `focus-pending` / `focus-testing` / `focus-overdue` / `focus-dueSoon` / `focus-returned` |
| 聚焦页 L3 | `focus-l3` |
| 已检任务 | `done` |
| 通知中心 | `notify` |
| 我的 | `me` |

完整映射与文件对照见 [reference.md](reference.md)。

## 检查清单

- [ ] `AnnotatedWrapper` 的 `id` 在对应 `pages/*.js` 中存在
- [ ] `registry.js` 已包含该 pageKey
- [ ] 三段文案齐全且与当前 UI 行为一致
- [ ] overlay 页面批注不会与底层页同时出现
- [ ] 嵌套锚点时，内层抢 hover、外层不误清高亮（已有冒泡处理，避免再包多余层）

## 反模式

- 只在飞书文档写规则、不同步 `pages/*.js`（评审时原型批注会缺失）
- 一个锚点混写三种逻辑
- 在未注册 pageKey 的页面加 `AnnotatedWrapper`（批注静默不显示）
- 修改业务过滤/入口路径后忘记更新 `interactionLogic`
