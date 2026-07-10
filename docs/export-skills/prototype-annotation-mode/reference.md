# 批注模式参考

## 源码入口

| 文件 | 职责 |
|------|------|
| `src/App.jsx` | `resolveAnnotationPageKey()`、`AnnotationProvider`、`overlay-screen` |
| `src/annotation/registry.js` | pageKey → 配置模块映射 |
| `src/annotation/pages/*.js` | 批注文案源 |
| `src/annotation/annotation.css` | 轨道、虚线框、高亮、tooltip 样式 |

## pageKey 解析（App.jsx）

```js
overlay === 'notify'  → notify
overlay === 'focus'   → focus-{kind}  // pending|testing|overdue|dueSoon|returned
overlay === 'collect' → collect
overlay === 'done'    → done
tab === 'home'        → home
tab === 'inspect'     → inspect-l1
tab === 'me'          → me
```

嵌套覆盖（`AnnotationPageKeyProvider`）：

| 页面 | Provider pageKey |
|------|------------------|
| Inspect L2 按设备 | `inspect-l2-device` |
| Inspect L3 | `inspect-l3` |
| TaskFocus L2 | `focus-{kind}` |
| TaskFocus L3 | `focus-l3` |

## 批注配置文件

| 文件 | 覆盖范围 |
|------|----------|
| `pages/home.js` | 首页：概览、快捷入口、统计、通知铃铛 |
| `pages/inspect.js` | 检测模块 L1/L2/L3 |
| `pages/focus.js` | 聚焦页 L2/L3（各维度共用） |
| `pages/collect.js` | L4 Collect / CollectLite / CollectStructured |
| `pages/done.js` | 已检任务 overlay |
| `pages/notify.js` | 通知中心 |
| `pages/me.js` | 我的及子页 |

## AnnotatedWrapper 参数

| 参数 | 说明 |
|------|------|
| `id` | 锚点 ID，对应配置 key |
| `layout` | `block` \| `inline` |
| `pageKey` | 可选，覆盖当前 Provider pageKey |
| `anchorOnly` | 仅锚点虚线，不改变子元素布局 |

## 批注卡片渲染

`AnnotationTooltip.jsx` 固定三段标签：

- 🎯 需求逻辑 → `requirementLogic`
- 🎨 展示规则 → `displayRule`
- 👆 交互逻辑 → `interactionLogic`

## 与飞书评审文档的关系

飞书文档（如「数采 App 原型重构」）面向产品/研发评审；**原型批注是现场对照源**。业务规则变更时：

1. 先改原型行为（如 L2 过滤、字段隐藏）
2. 同步 `pages/*.js` 批注
3. 按需更新飞书文档对应章节

两者应表述一致，但批注更贴近 UI 锚点粒度。
