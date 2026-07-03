---
name: shucan-labdata-design
description: Use this skill to generate well-branded interfaces and assets for 数蚕 Lab Data (杭州数蚕智能科技有限公司 · 实验室数智化系统), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, status-badge system, assets, and a 检测员 mobile UI kit for prototyping.
user-invocable: true
---

# 数蚕 Lab Data 设计系统 Skill

Read `readme.md` in this skill for the full design guide (产品背景 / 内容规范 / 视觉基础 / 图标规范 / 状态徽章体系 / 信息架构), then explore the other files.

## 这套系统是什么
实验室数智化系统（Lab Data）的品牌与界面设计系统。核心场景：电力物资检测中心的**检测员**用平板现场采集试验设备数据并自动上传。主色品牌深蓝 `#1D3F8C` / 交互蓝 `#2563EB`，浅色卡片风，简洁工程化。

## 文件导览
- `styles.css` — 全局入口（仅 @import）。任何静态 HTML 产物 `<link>` 这一个文件即获得全部 token。
- `tokens/` — colors / typography / spacing / effects 四个 CSS 变量文件。
- `guidelines/*.html` — 颜色/字体/间距/状态徽章/Logo 规范卡。
- `components/**` — 19 个 React 组件（feedback / forms / data-display / navigation 四组）。每个组件 `<Name>.jsx` + `<Name>.d.ts`。
- `ui_kits/app/` — 检测员移动端全流程可点击原型（登录→首页→检测→采集→上传）。
- `assets/logo-mark.png` — 圆形 S 标。

## 怎么用
- **做视觉产物（slides / mocks / 一次性原型）**：把需要的 assets 复制出来，写静态 HTML，`<link>` 本目录的 `styles.css`，按 readme 的视觉/内容规范排版。状态一律走「状态徽章体系」配色，别自创颜色。
- **写生产代码**：复制 token 与组件，阅读 readme 成为该品牌设计专家；组件以 CSS 自定义属性驱动样式，无第三方依赖。
- **复用组件（在本设计系统工程内）**：HTML 里 `<script src=".../_ds_bundle.js">` 后 `const { Button, StatusTag, DeviceCard, ... } = window.DesignSystem_52fd11`。

## 关键规范（务必遵守）
- 状态词固定：未检测 / 检测中 / 已完成 / 已检测 / 已逾期 / 未上传 / 已上传。不要近义替换。
- 采集方式四态：⚡自动 / 📷拍照识别 / 🔵蓝牙 / ✏️手工——决定采集页录入交互。
- 平板按 **Y700 800×1280 竖屏**设计；触控目标 ≥ 44px。
- 不用渐变背景、彩色左边框、重投影、emoji 当界面图标；图标用 Lucide（线性 2px）。

若用户调用本 skill 但未给具体目标：先问清要做什么（slides / 原型 / 生产页）、面向哪个角色（检测员 / admin）、平板还是别的，再作为该品牌设计专家产出 HTML 产物或生产代码。
