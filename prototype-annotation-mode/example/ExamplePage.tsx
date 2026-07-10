/**
 * ExamplePage.tsx — 伪代码骨架示例
 *
 * 展示 AI 按 prototype-annotation-mode Skill 生成代码时的典型结构：
 * - 全局批注开关（AnnotationProvider + Toggle）
 * - pageKey 与批注 config 数组
 * - 居中设备框 + 左右批注轨道
 * - AnnotatedWrapper 锚点挂载
 *
 * 本文件仅为示意，不可直接运行；请结合你的技术栈实现 annotation 模块。
 */

import React from 'react';
// import {
//   AnnotationProvider,
//   AnnotationSideRails,
//   AnnotatedWrapper,
// } from '../src/annotation';

/** 批注配置：pageKey → anchorId → 三段式 spec */
const PAGE_KEY = 'tab-home';

const homeAnnotations = {
  searchBar: {
    title: '顶部搜索栏',
    requirementLogic: '支持按关键词模糊搜索当前列表；搜索范围不含已归档数据。',
    displayRule: 'SearchBar 常驻页顶；placeholder「请输入关键词」；无结果时展示空态插画。',
    interactionLogic: '输入实时过滤；清空按钮恢复全量列表；回车不跳转。',
  },
  statsRow: {
    title: '统计卡片区',
    requirementLogic: '聚合展示三个核心待办维度，数值来自同一 mock/API 数据源。',
    displayRule: '三张 StatCard 横向等分；数值为 0 时仍展示 0，不隐藏卡片。',
    interactionLogic: '点击各卡片进入对应聚焦列表页；默认排序规则写在批注中。',
  },
  bottomNav: {
    title: '底部导航',
    requirementLogic: '一级 Tab 切换：首页 / 列表 / 我的；当前 Tab 高亮。',
    displayRule: '固定底栏；图标 + 文案；选中态品牌色。',
    interactionLogic: '点击切换路由；切换时保留各 Tab 滚动位置（若产品要求）。',
  },
};

export default function ExamplePage() {
  const frameRef = React.useRef(null);
  const [overlayActive, setOverlayActive] = React.useState(false);

  return (
    // <AnnotationProvider pageKey={PAGE_KEY} frameRef={frameRef} overlayActive={overlayActive}>
    <div className="annotation-stage">
      {/* 左右批注轨道：开启批注模式后展开，卡片按锚点 Y 对齐 */}
      {/* <AnnotationSideRails frameRef={frameRef} /> */}

      <div className="annotation-stage__center">
        {/* 居中设备框（手机 mock） */}
        <div ref={frameRef} className="device-frame">
          <div className="device-frame__screen">
            {/* 批注锚点：id 必须与 config key 严格一致 */}
            {/* <AnnotatedWrapper id="searchBar" layout="block"> */}
            <header className="search-bar">[ SearchBar ]</header>
            {/* </AnnotatedWrapper> */}

            {/* <AnnotatedWrapper id="statsRow" layout="block"> */}
            <section className="stats-row">
              <div className="stat-card">逾期 · 3</div>
              <div className="stat-card">待办 · 12</div>
              <div className="stat-card">完成 · 8</div>
            </section>
            {/* </AnnotatedWrapper> */}

            <main className="page-content">[ 页面主体内容 ]</main>

            {/* <AnnotatedWrapper id="bottomNav" layout="block"> */}
            <nav className="bottom-nav">首页 · 列表 · 我的</nav>
            {/* </AnnotatedWrapper> */}
          </div>
        </div>
      </div>

      {/* 全屏 overlay 示例：打开时仅注册 .overlay-screen 内锚点 */}
      {overlayActive && (
        <div className="overlay-screen">
          {/* <AnnotatedWrapper id="modalHeader" pageKey="overlay-detail"> */}
          <h2>详情 Overlay</h2>
          {/* </AnnotatedWrapper> */}
          <button type="button" onClick={() => setOverlayActive(false)}>
            关闭
          </button>
        </div>
      )}

      <button type="button" onClick={() => setOverlayActive(true)}>
        打开 Overlay（演示隔离）
      </button>
    </div>
    // </AnnotationProvider>
  );
}

/**
 * 典型目录对照（完整实现见 skills/prototype-annotation-mode/reference.md）：
 *
 * src/annotation/
 *   AnnotationProvider.tsx    — 开关、锚点注册表、overlay 隔离
 *   AnnotationToggle.tsx      — 批注模式 Toggle
 *   AnnotationSideRails.tsx   — 左右轨道 + 卡片定位
 *   AnnotatedWrapper.tsx      — 虚线锚点 + hover 联动
 *   AnnotationCard.tsx        — 三段式卡片 UI
 *   registry.ts               — pageKey → annotations 映射
 *   pages/home.ts               — 本示例的 homeAnnotations 配置
 */
