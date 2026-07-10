# 批注模式 · 实现参考（通用）

## 推荐目录结构

```
src/annotation/                    # 或 packages/annotation/
├── AnnotationProvider.tsx         # Context：开关、锚点表、overlay 标志
├── AnnotationToggle.tsx           # 批注开关
├── AnnotationSideRails.tsx        # 左右轨道 + 定位逻辑
├── AnnotatedWrapper.tsx           # 锚点包装
├── AnnotationCard.tsx             # 三段式卡片（或 Tooltip）
├── annotation-layout.ts           # 轨道宽度、舞台宽度常量
├── annotation.css                 # 虚线、高亮、轨道样式
├── registry.ts                    # pageKey → 配置模块
└── pages/                         # 按 pageKey 拆分
    ├── [page-home].ts
    ├── [page-list].ts
    └── [page-detail].ts
```

## pageKey 命名约定

| 模式 | 示例 | 说明 |
|------|------|------|
| Tab 根页 | `tab-[name]` | 底部/顶部导航一级 |
| 全屏 Overlay | `overlay-[name]` | 模态、向导、独立流程 |
| 钻取层级 | `[feature]-l[N]` | L1 列表 → L2 详情 → L3 编辑 |
| 聚焦/筛选页 | `focus-[dimension]` | 按状态/标签过滤的子集 |

嵌套页用 `PageKeyProvider` 覆盖父级 pageKey。

## AnnotatedWrapper 参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 锚点 ID，对应配置 key |
| `layout` | `'block' \| 'inline'` | 块级 / 行内锚点 |
| `pageKey` | `string?` | 覆盖当前 Provider 的 pageKey |
| `anchorOnly` | `boolean?` | 仅虚线锚点，不改变子布局 |

## 锚点注册逻辑（伪代码）

```ts
function shouldRegister(el, { overlayActive }) {
  if (!overlayActive) return true;
  return el.closest('.overlay-screen') != null;
}
```

## 轨道定位要点

1. 收集所有已注册锚点的 `getBoundingClientRect()` 相对舞台
2. 卡片 `top` 与锚点垂直居中或顶对齐
3. 左右分配：索引偶数 → 左轨，奇数 → 右轨（或按锚点 `placement`）
4. 碰撞检测：相邻卡片最小间距，必要时纵向错开
5. `railContentHeight = max(设备框高, 最底卡片 bottom + padding)`

## 持久化

```ts
const STORAGE_KEY = '[appId]_annotation_mode'; // 每项目替换 appId
localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
```

## 与外部评审文档的关系

| 载体 | 粒度 | 用途 |
|------|------|------|
| 原型批注（本规范） | UI 锚点级 | 评审时 hover 对照 |
| PRD / 飞书 / Wiki | 章节级 | 背景、范围、非 UI 规则 |

二者表述应一致；以**原型批注**为现场演示源，文档为补充阅读。

## 技术栈适配提示

| 栈 | 建议 |
|----|------|
| React | Context + `useLayoutEffect` 注册锚点 |
| Vue | `provide/inject` + `ref` 锚点 |
| 纯 HTML 原型 | `data-annotation-id` + 单页 JS 定位 |

核心不变：**开关、双轨、三段卡片、双向高亮、overlay 隔离**。

## 新项目启动检查清单

```
[ ] 定义 [应用名称] 与设备框尺寸
[ ] 实现 AnnotationProvider + Toggle + SideRails + Wrapper + Card
[ ] 建立 registry 与 pages/ 配置目录
[ ] 为 [页面列表] 每个主要区域写三段批注
[ ] overlay 场景验证无底层泄漏
[ ] 评审前全文案与 UI 行为走查一遍
```
