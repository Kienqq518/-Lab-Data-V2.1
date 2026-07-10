---
name: prototype-annotation-mode
description: Generic spec and codegen template for mobile prototype annotation mode—toggle, centered device frame, side annotation rails, hover-linked highlight cards with requirementLogic/displayRule/interactionLogic. Use when building or documenting interactive prototypes, adding review annotations, or when the user mentions 批注模式, annotation mode, AnnotatedWrapper, or three-section spec cards.
---

# 原型批注模式 · 通用规范（Annotation Mode）

## 产品定义

原型内置「批注模式」开关：开启后在**设备框（手机/平板）居中**，**两侧留白轨道**展示每个 UI 区域的批注卡片；每张卡片固定三段——**需求逻辑、展示规则、交互逻辑**；**Hover 批注卡片 ↔ UI 区域**双向高亮联动。批注应覆盖原型中所有主要页面与核心功能区域。

本 Skill 是**跨项目通用**的 AI 指令规范：不绑定任何具体业务域。在新项目中调用时，按本规范实现交互骨架，并将 `[项目名]`、`[页面]`、`[区域]` 等占位符替换为当前需求内容。

---

## 何时调用本 Skill

- 新建/重构可交互移动端原型，需要**评审对照模式**
- 用户要求「加批注」「批注模式」「需求/展示/交互三段说明」
- 为 UI 区域补充评审文档，且需与原型**像素级锚点联动**
- 排查：批注不显示、hover 不联动、overlay 下层批注泄漏

---

## 核心机制（必须保留）

### 1. 布局

```
┌─────────────────────────────────────────────────────────┐
│  [左批注轨道]    ┌──────────────┐    [右批注轨道]      │
│                  │  设备框居中   │                      │
│  批注卡片列表     │  (手机 mock)  │     批注卡片列表      │
│  按锚点 Y 对齐    │  原型 UI      │     按锚点 Y 对齐     │
│                  └──────────────┘                      │
│              [批注模式 Toggle]                            │
└─────────────────────────────────────────────────────────┘
```

- **关闭批注**：仅设备框，标准宽度
- **开启批注**：舞台加宽，左右各留固定宽度轨道（建议 280–360px），设备框仍水平居中
- 轨道内卡片与锚点**垂直对齐**；底部超长卡片可纵向错开，舞台高度随内容扩展

### 2. 交互联动

| 动作 | 效果 |
|------|------|
| Hover UI 锚点区域 | 该区域虚线高亮 + 对应批注卡片高亮 |
| Hover 批注卡片 | 对应 UI 锚点区域高亮 |
| 关闭批注模式 | 隐藏轨道与虚线，清除高亮，状态可持久化（localStorage / URL） |
| 打开全屏 overlay | 仅注册 overlay 内锚点，**屏蔽底层页**批注，防泄漏 |

### 3. 批注卡片数据结构（固定三段）

```ts
type AnnotationSpec = {
  title: string;              // [区域标题]
  requirementLogic: string;   // 需求逻辑：为什么、业务规则、数据口径
  displayRule: string;        // 展示规则：布局、文案、状态色、空态
  interactionLogic: string;   // 交互逻辑：点击、跳转、禁用、排序、反馈
};
```

**写作原则**
- 三段**各司其职**，禁止混写
- 用可评审、可测试的表述（枚举状态、默认排序、入口路径、权限）
- 与原型实际行为一致；改 UI 必须同步改批注

---

## AI 在新项目中的执行流程

调用本 Skill 时，按以下顺序工作：

### Step 1 — 盘点页面与区域

向用户确认或从需求推断：

- `[应用名称]`、`[目标平台]`（手机/平板）
- `[页面列表]`：如 登录 / 首页 / 列表 / 详情 / 设置
- 每页 `[主要功能区域]`：导航、筛选、列表项、表单、底栏等

### Step 2 — 搭建批注基础设施

实现最小可复用模块（命名可随技术栈调整）：

| 模块 | 职责 |
|------|------|
| `AnnotationProvider` | 全局开关、活跃锚点 id、锚点注册表、overlay 隔离标志 |
| `AnnotationToggle` | 批注模式开关 |
| `AnnotationSideRails` | 左右轨道 + 卡片定位 |
| `AnnotatedWrapper` | 包裹 UI 区域：虚线框 + hover 注册 |
| `AnnotationCard` | 渲染 title + 三段文案 |
| `annotationRegistry` | `pageKey → Record<anchorId, AnnotationSpec>` |

### Step 3 — 定义 pageKey 与配置

为每个路由/层级定义 `[pageKey]`，例如：

- `[tab-home]`、`[screen-list]`、`[screen-detail]`、`[overlay-modal]`
- 嵌套层用 Provider 覆盖 pageKey（列表进详情、Tab 进子流程）

在 `annotations/[pageKey].ts` 中为每个 `[anchorId]` 填写三段文案。

### Step 4 — 锚点挂载

```jsx
<AnnotatedWrapper id="[anchorId]" layout="block|inline">
  <[YourComponent] />
</AnnotatedWrapper>
```

- `id` 与配置 key **严格一致**
- 列表：仅首项或代表性项绑批注，避免重复卡片
- overlay 内容放在 `.overlay-screen`（或等价容器）内

### Step 5 — 验收

- [ ] 开关切换正常，状态可持久化
- [ ] 左右轨道与锚点垂直对齐
- [ ] Hover 双向高亮
- [ ] overlay 打开时底层批注不泄漏
- [ ] 每锚点三段文案齐全

---

## 占位符模板（复制后替换）

### 单区域批注配置

```js
// annotations/[pageKey].js
export const annotations = {
  [anchorId]: {
    title: '[区域标题，如：顶部搜索栏]',
    requirementLogic: '[为什么需要该区域；数据来源；过滤/权限规则；与 [关联模块] 的关系]',
    displayRule: '[组件形态；字段与标签；[状态A]/[状态B] 的颜色或文案；空态/加载态]',
    interactionLogic: '[点击/输入/滑动行为；跳转至 [目标页面]；禁用条件；错误提示]',
  },
};
```

### 页面级说明（给评审文档用）

```markdown
## [页面名称]

**入口**：[从哪进入，如：底部 Tab · [Tab名] / 首页卡片 · [卡片名]]

| 区域 | 需求逻辑 | 展示规则 | 交互逻辑 |
|------|----------|----------|----------|
| [区域A] | [区域A的数据逻辑] | [区域A的展示规则] | [区域A的交互逻辑] |
| [区域B] | … | … | … |
```

### 示例（虚构电商 App，非业务绑定）

```js
productListSearch: {
  title: '商品搜索栏',
  requirementLogic: '支持按商品名、SKU 模糊搜索当前类目下的在售商品；搜索范围不含已下架商品。',
  displayRule: 'SearchBar 常驻列表顶部；placeholder「请输入商品名或 SKU」；右侧可选扫码图标（若项目有扫码）。',
  interactionLogic: '输入实时过滤列表；点扫码打开 [扫码Overlay]，解析后定位到对应商品详情。',
},
```

---

## 样式约定（可主题化，非写死色值）

用 CSS 变量或 design token，**不要**在 Skill 或批注文案里写死项目品牌色：

```css
/* 建议 token 名 */
--annotation-rail-width: 320px;
--annotation-anchor-border: dashed 2px var(--border-accent);
--annotation-anchor-active-bg: var(--surface-highlight);
--annotation-card-dimmed-opacity: 0.45;
```

批注卡片三段标签建议固定文案：

- 🎯 需求逻辑
- 🎨 展示规则
- 👆 交互逻辑

---

## 反模式

- 在 Skill 或 registry 里写死具体公司名、任务类型、字段 key（应留在项目 annotations 配置里）
- 一个锚点混写三种逻辑
- 未注册 pageKey 却挂载 `AnnotatedWrapper`（批注静默失效）
- overlay 与底层页同时注册锚点（评审时卡片混乱）
- 只写飞书/Word 文档、不在原型挂锚点（无法 hover 联动）

---

## 附加参考

实现细节、目录建议、pageKey 命名模式见 [reference.md](reference.md).
