[English README](./README.en.md)

# 🪄 Prototype Annotation Mode (原型交互式批注模式) · 通用 Skill / Prompt

> **为你的 AI 原型无缝注入灵魂：让聊天记录里的“需求上下文”变为可视化的交互式 PRD。**

## 💡 简介 (Introduction)

在 PM（产品经理）与 AI Agent 的协作流中，通常我们会通过多轮对话生成一个可交互的 HTML 原型。然而，**隐藏在对话中的宝贵业务逻辑、边界条件和交互规则，往往停留在聊天记录里，与最终的视觉原型割裂开来。**

`prototype-annotation-mode` 正是为了解决这个痛点而生！
它的前提是：你已经拥有了一个由 AI 生成的 HTML 交互原型。只需向 AI 调用此 Skill，它就会**自动梳理前序对话中的有效需求和交互逻辑**，并在不破坏现有 UI 设计范式的基础上，为你的原型动态注入一个全局开关的「批注模式」。

开启批注模式后，AI 生成的原型将瞬间变身为一份**“活的交互式产品说明书”**。

## ✨ 核心特性 (Core Features)

- 🧩 **非侵入式无缝注入 (Seamless Integration)**
  基于已有的 HTML 原型进行二次增强。它会严格遵循并复用现有原型的 UI 样式与设计范式（CSS/Tailwind），不破坏原有的视觉结构，仅在开启开关后通过压缩主视图留白来展示内容。
- 🧠 **对话上下文智能提取 (Contextual Logic Extraction)**
  AI 会自动回溯你们之前的对话内容，精准捕获“废话”之外的有效产品需求，并将其结构化地总结到批注中，免去了 PM 手动整理文档的烦恼。
- 🗂️ **标准「三段式」卡片规范 (Standardized Card Structure)**
  每一个批注区域的卡片严格遵循 PM 视角的三维拆解，逻辑清晰且结构化：
  - 📍 **需求逻辑 (Business Logic)**：为什么要做这个功能？核心价值是什么？
  - 👁️ **展示规则 (Display Rules)**：UI 初始状态、空状态、极限值、异常状态的展示逻辑。
  - 🖱️ **交互逻辑 (Interaction)**：用户点击、滑动、Hover 等操作触发的具体动作与反馈。
- 🔗 **精准的双向高亮联动 (Bi-directional Hover Linkage)**
  提供极致的阅读体验。当鼠标 Hover 侧边栏的批注卡片时，原型中对应的 UI 区域会自动高亮（或出现聚焦遮罩）；反之，Hover 原型特定 UI 时，对应的批注卡片也会联动高亮。
- 🎚️ **全局沉浸式开关 (Global Toggle Switch)**
  内置一键切换能力。关闭时，原型保持 100% 纯净的拟真状态，供用户体验；开启时，立即展开左右留白轨道展示逻辑，供研发与测试审阅。

---

## 🖼️ 演示 / 效果 (Demo)

![Demo](./assets/demo.gif)

> 建议录制：关闭批注 → 开启批注 → Hover 卡片与 UI 双向高亮 → 打开 Overlay 验证批注隔离。

---

## 📦 如何安装 / 使用 (Usage)

本仓库是一份**跨平台通用的 AI Agent 指令规范**（Prompt + 实现参考），不是 npm 包。

它不绑定任何特定 IDE 或模型——**Cursor、Claude Code、Windsurf、GitHub Copilot Chat、ChatGPT、通义灵码** 等，只要能读取长文本 Prompt 的 AI 编程助手，都可以使用。把规范交给 AI 后，它会在你已有原型上按标准注入批注模式。

### 方式一：直接粘贴 Prompt（通用 · 推荐）

打开根目录 [`prototype-annotation-mode.md`](./prototype-annotation-mode.md)，将全文复制到 AI 对话中，并补充一句：

> 「请严格按此规范，为我的 HTML/React 原型实现批注模式，并从我们之前的对话中提取需求逻辑。」

适用于所有平台，**无需安装**。

### 方式二：安装为 Cursor Skill

将整个 skill 目录复制到 Cursor 用户级 skills 路径：

```bash
git clone https://github.com/Kienqq518/prototype-annotation-mode.git
mkdir -p ~/.cursor/skills
cp -R prototype-annotation-mode/skills/prototype-annotation-mode ~/.cursor/skills/
```

复制后目录结构应为：

```
~/.cursor/skills/prototype-annotation-mode/
├── SKILL.md
└── reference.md
```

重启 Cursor 或重新打开项目后，在对话中直接说：

> 「请使用 **prototype-annotation-mode** skill，为当前 HTML/React 原型注入批注模式。」

**项目级共享**：复制到 `.cursor/skills/` 并提交到仓库，团队成员拉取后即可使用。

也可在 Cursor 中执行 `/create-skill`，将 `SKILL.md` 内容粘贴为 skill 正文，命名为 `prototype-annotation-mode`。

### 方式三：安装为 Claude Code Skill

```bash
git clone https://github.com/Kienqq518/prototype-annotation-mode.git
mkdir -p ~/.claude/skills
cp -R prototype-annotation-mode/skills/prototype-annotation-mode ~/.claude/skills/
```

或使用 Claude Code 的 skills 安装命令（若已配置）：

```bash
npx skills add Kienqq518/prototype-annotation-mode
```

### 方式四：写入项目规则文件

将 `prototype-annotation-mode.md` 全文或摘要放入项目根目录的以下文件之一，让 AI 在该项目中自动遵循：

| 工具 | 常见规则文件 |
|------|-------------|
| Cursor | `.cursorrules` 或 `.cursor/rules/*.md` |
| Windsurf | `.windsurfrules` |
| 通用 | `AGENTS.md` / `CLAUDE.md` |

也可在对话开始时用 `@prototype-annotation-mode.md` 引用该文件（若你的工具支持 `@` 文件上下文）。

### 典型工作流

1. 与 AI 多轮对话，生成可交互 HTML/React 原型（本 skill **不替代**原型生成，只做增强）。
2. 调用本 skill，让 AI 回溯对话、盘点页面与 UI 区域。
3. AI 实现 `AnnotationProvider`、`AnnotatedWrapper`、左右轨道与 config 注册表。
4. 为每个锚点填写三段批注：`requirementLogic` / `displayRule` / `interactionLogic`。
5. 验收：开关、双向 Hover、Overlay 隔离、文案与 UI 行为一致。

代码骨架参考见 [`example/ExamplePage.tsx`](./example/ExamplePage.tsx)。

---

## 📁 仓库结构 (Repository Layout)

```
prototype-annotation-mode/
├── README.md                          # 中文说明（本文件）
├── README.en.md                       # English README
├── LICENSE                            # MIT
├── prototype-annotation-mode.md       # 可复制的完整 Prompt（与 SKILL.md 同步）
├── assets/                            # Demo 截图 / GIF
├── example/
│   └── ExamplePage.tsx                # 伪代码骨架示例
└── skills/
    └── prototype-annotation-mode/
        ├── SKILL.md                   # Agent Skill 入口（Cursor / Claude Code 等自动读取）
        └── reference.md               # 实现参考：目录、pageKey、定位算法
```

---

## 📜 Prompt 源码 (The Prompt / Skill)

以下为 `SKILL.md` 完整正文，可直接复制使用。实现细节另见 [`reference.md`](./skills/prototype-annotation-mode/reference.md)。

<details>
<summary><strong>点击展开完整 Skill Prompt</strong></summary>

```markdown
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

实现细节、目录建议、pageKey 命名模式见 reference.md。
```

</details>

也可直接打开 [`prototype-annotation-mode.md`](./prototype-annotation-mode.md) 获取与 `SKILL.md` 同步的单一文件版本。

---

## 🤝 贡献与反馈

欢迎通过 [Issues](https://github.com/Kienqq518/prototype-annotation-mode/issues) 提交改进建议或分享你的批注模式实践案例。

## 📄 许可证 (License)

[MIT](LICENSE) © [Kienqq518](https://github.com/Kienqq518)
