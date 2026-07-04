# L4 多设备采集实施计划

日期：2026-07-04  
对应 Spec：`docs/superpowers/specs/2026-07-04-l4-multi-device-collection-design.md`  
目标：把当前 L4 多设备原型收敛为可继续接后端配置与真实上传的前端实现

## 1. 实施范围

本计划只覆盖检测员侧移动端 L4：

1. 普通 L4 继续由 `src/screens/Collect.jsx` 承载。
2. 含 `item.subs` 的复合试验项进入多设备采集模式。
3. 多设备采集模式以「试验子项」为工作单元，子项决定设备、采集方式、字段、相别/次数。
4. 当前阶段仍使用 `src/mock.js` 模拟后端配置，不接真实接口。
5. 完成后用 `npm run build` 和浏览器走查验证。

## 2. 现状判断

当前代码已经有可用基础：

1. `src/screens/Collect.jsx` 已按 `ctx.item.subs` 分流到 `CollectStructured`。
2. `src/screens/Collect.jsx` 已包含普通 L4 的采集方式、流程锁定、退回、OCR、附件、上传逻辑示例。
3. `src/screens/CollectStructured.jsx` 已能展示多子项、多设备、多相别、多点测量。
4. `src/mock.js` 已有「结构尺寸检查-导体&绝缘厚度&金属屏蔽」复合试验项示例。

主要缺口：

1. `CollectStructured` 现在的设备切换偏演示态，设备与子项还可以脱钩。
2. 采集单元状态还不是 spec 中的可追溯结构。
3. 缺少复合 L4 的流程锁定、审核退回、上传失败、配置异常等边界态。
4. 子项状态摘要、整体完成度、实际采集设备追溯还不够明确。
5. 复合 L4 的若干通用逻辑与普通 L4 重复，后续维护成本偏高。

## 3. 文件计划

优先保持改动集中：

| 文件 | 动作 | 目的 |
| --- | --- | --- |
| `src/mock.js` | 修改 | 补齐稳定 ID、子项配置、候选设备、异常/锁定示例 |
| `src/screens/CollectStructured.jsx` | 重构 | 实现 spec 定义的复合 L4 主流程 |
| `src/screens/Collect.jsx` | 小改 | 共享流程状态与普通/复合分流上下文 |
| `src/screens/collect-model.js` | 新增 | 放置采集单元、状态汇总、权限判断等纯函数 |
| `src/screens/collect-ui.jsx` | 可选新增 | 抽取 FlowBanner、Stamp、Section、Grid 等 L4 局部 UI |
| `src/styles/app.css` 或内联样式 | 小改 | 只在必要时补充布局和溢出控制 |

暂不改 `components/` 设计系统公共组件，除非出现无法用现有组件解决的布局问题。

## 4. 阶段一：数据结构收敛

目标：让 mock 数据更接近未来接口返回。

任务：

1. 为 `samples[].tests[]` 补充稳定 `id`。
2. 为复合试验项的 `subs[]` 补充稳定 `id`、`device.id`、`candidateDevices` 可选字段。
3. 统一子项字段结构：`key`、`label`、`unit`、`required`、`multi`、`readOnly`。
4. 为示例补齐三类流程态：
   - 正常试验检测
   - 审核退回
   - 组内审核锁定
5. 保留现有示例读数生成逻辑，但让生成结果能按 `subItemId + phase + repeatIndex` 落到采集单元。

验收：

1. 普通试验项仍能打开。
2. 复合试验项仍能从按设备、按样品两条路径打开。
3. 复合试验项上下文包含 `testItemId`、`subItemId`、`deviceId`。

## 5. 阶段二：新增采集模型纯函数

目标：把复杂状态从组件 JSX 中拆出来。

新增 `src/screens/collect-model.js`，包含：

1. `isCompositeItem(item)`：判断是否进入复合 L4。
2. `getSubItems(ctx)`：普通/复合试验项统一返回子项数组。
3. `getPhases(sub)`：返回红/黄/绿或空数组。
4. `getRepeatCount(sub)`：返回每相次数或普通次数。
5. `createCollectCells(ctx)`：按配置生成采集单元。
6. `getCellKey(cell)`：生成稳定 key。
7. `summarizeCells(cells)`：输出 L4、子项、单元完成度。
8. `getMethodCapabilities(method, ocrVerified)`：返回能否整批采集、能否编辑、是否需要附件等。
9. `isFlowLocked(flow)` 与 `isFlowReturned(flow)`：统一流程权限判断。
10. `markCellFilled`、`markCellUploaded`、`markCellFailed`：返回不可变更新结果。

验收：

1. 组件内不再散落大量状态判断。
2. 同一套汇总函数驱动印章、子项摘要、底部上传按钮。
3. 函数不依赖 React，后续可直接加测试。

## 6. 阶段三：重构复合 L4 主界面

目标：让 `CollectStructured` 与 spec 完全对齐。

任务：

1. 去掉当前全局 `activeDevice` 与 `activeSub` 脱钩的行为。
2. 当前子项默认使用 `sub.device`；若有 `candidateDevices`，只在当前子项内部切换候选设备。
3. 子项切换控件显示子项名称和状态摘要。
4. 设备信息区展示当前子项的实际设备、编号、型号、采集方式徽章。
5. 试验数据区继续使用左侧相别/次数、右侧字段的主从结构。
6. 多点测量字段保留多个输入框；长字段名和长子项名必须不撑破布局。
7. 结论区按相别/次数上传状态回显，只读。
8. 底部按钮按 `pendingUpload`、`allUploaded`、`flowLocked` 控制。

验收：

1. 切换「导体」「绝缘厚度测量」「金属屏蔽」时，设备、字段、采集方式同时变化。
2. 切子项不会清空已填数据。
3. 候选设备切换不会影响其他子项。
4. 页面文案只使用现有状态词：未检测、检测中、已检测、未上传、已上传。

## 7. 阶段四：采集方式行为补齐

目标：复合 L4 中各采集方式与普通 L4 行为一致。

任务：

1. `auto`：整批填充当前子项全部单元，字段只读，不显示附件入口。
2. `ble`：按当前相别/次数连接采集，可手工修正，可上传参照图。
3. `manual`：按当前相别/次数录入读数，可按配置显示附件入口。
4. `ocr`：若后续复合子项配置为 OCR，沿用普通 L4 的拍照识别、锁定、编辑、重新识别逻辑。
5. `external`：支持查看已采数据和补录，文案与普通 L4 一致。
6. 上传单个单元与上传全部都写入同一状态模型。

验收：

1. 设备直连子项可以一键完成全部相别。
2. 蓝牙子项可以逐相采集并单相上传。
3. 手工子项可以逐相录入多点测量。
4. 已上传单元不可被误判为未采集。

## 8. 阶段五：流程与异常态

目标：补齐真实业务边界。

任务：

1. 抽取或复用普通 L4 的 FlowBanner。
2. 进入组内审核及以后节点时，复合 L4 所有字段、附件、重置、上传入口只读/禁用。
3. 审核退回时展示退回原因；修改字段后对应单元变为待上传。
4. 支持配置异常态：
   - 子项缺少设备
   - 设备缺少采集方式
   - 字段模板为空
5. 支持上传失败态：保留读数与附件，显示重试入口。
6. 候选设备切换时，若当前单元已有读数，提示或保留原采集设备标记，避免静默覆盖。

验收：

1. 锁定态下无法编辑、删除附件、重置、上传。
2. 退回态下重新编辑会重新进入待上传。
3. 配置异常不会导致整页崩溃。
4. 上传失败可重试，重试成功后进入已上传。

## 9. 阶段六：共享 UI 与可维护性

目标：减少普通 L4 和复合 L4 的重复逻辑。

任务：

1. 视情况新增 `src/screens/collect-ui.jsx`，抽取：
   - `FlowBanner`
   - `Stamp`
   - `Section`
   - `Grid`
   - `TimeStatusIcon`
   - `Spinner`
2. 保留组件局部语义，不上升到公共 `components/`，避免设计系统被业务状态污染。
3. 保持样式克制，沿用现有 token、卡片、徽章、按钮。
4. 检查 Y700 800x1280 竖屏下的文本溢出。

验收：

1. 普通 L4 与复合 L4 视觉一致。
2. 重复 UI 逻辑减少，业务组件更容易读。
3. 不引入新的依赖。

## 10. 阶段七：验证

必须执行：

1. `npm run build`
2. 启动本地预览或开发服务。
3. 浏览器走查以下路径：
   - 登录
   - 检测
   - 按设备进入结构尺寸检查复合试验项
   - 按样品进入同一复合试验项
   - 切换三个子项
   - 设备直连整批采集
   - 手工录入多点测量
   - 蓝牙逐相采集与上传
   - 上传全部后完成并退出
4. 检查控制台无明显报错。
5. 检查页面文本不重叠、不撑破按钮/卡片。

可选验证：

1. 增加一个锁定态 mock，确认只读。
2. 增加一个退回态 mock，确认可重新上传。
3. 增加一个配置异常 mock，确认异常提示可见。

## 11. 建议提交拆分

建议分 4 个 commit：

1. `Normalize composite collect mock data`
2. `Add collect state helpers`
3. `Refine composite L4 collection flow`
4. `Add composite L4 edge states and verification polish`

如果实现过程中发现 `CollectStructured.jsx` 仍过大，可以在第三个 commit 内拆局部组件，但不要顺手重构其他页面。

## 12. 完成定义

实现完成需满足：

1. Spec 的 11 条验收标准全部可在原型中走通。
2. 普通 L4 行为无回归。
3. 复合 L4 的数据状态能追溯到试验项、子项、设备、相别、次数、字段、采集方式。
4. `npm run build` 通过。
5. 已记录任何未实现的后端依赖或接口假设。

