/* @ds-bundle: {"format":3,"namespace":"DesignSystem_52fd11","components":[{"name":"Card","sourcePath":"components/data-display/Card.jsx"},{"name":"DeviceCard","sourcePath":"components/data-display/DeviceCard.jsx"},{"name":"FieldRow","sourcePath":"components/data-display/FieldRow.jsx"},{"name":"SampleListItem","sourcePath":"components/data-display/SampleListItem.jsx"},{"name":"SectionTitle","sourcePath":"components/data-display/SectionTitle.jsx"},{"name":"StatCard","sourcePath":"components/data-display/StatCard.jsx"},{"name":"TaskCard","sourcePath":"components/data-display/TaskCard.jsx"},{"name":"TestItemCard","sourcePath":"components/data-display/TestItemCard.jsx"},{"name":"CollectBadge","sourcePath":"components/feedback/CollectBadge.jsx"},{"name":"StatusDot","sourcePath":"components/feedback/StatusDot.jsx"},{"name":"StatusTag","sourcePath":"components/feedback/StatusTag.jsx"},{"name":"UploadStatus","sourcePath":"components/feedback/UploadStatus.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SearchBar","sourcePath":"components/forms/SearchBar.jsx"},{"name":"SegmentedSwitch","sourcePath":"components/forms/SegmentedSwitch.jsx"},{"name":"AppBar","sourcePath":"components/navigation/AppBar.jsx"},{"name":"BottomTabBar","sourcePath":"components/navigation/BottomTabBar.jsx"},{"name":"StationBar","sourcePath":"components/navigation/StationBar.jsx"}],"sourceHashes":{"CollectStructured.jsx":"a7e857ebe4d7","components/data-display/Card.jsx":"7d34469c4073","components/data-display/DeviceCard.jsx":"3a4ad98cb0d3","components/data-display/FieldRow.jsx":"5857171741e5","components/data-display/SampleListItem.jsx":"d74a6bec514a","components/data-display/SectionTitle.jsx":"4f0c34b160a4","components/data-display/StatCard.jsx":"08bda0210b39","components/data-display/TaskCard.jsx":"f691acca846e","components/data-display/TestItemCard.jsx":"d664bc2da511","components/feedback/CollectBadge.jsx":"a7c3743da75f","components/feedback/StatusDot.jsx":"08ed51753b23","components/feedback/StatusTag.jsx":"c7a2a8dce9f7","components/feedback/UploadStatus.jsx":"223041811db7","components/forms/Button.jsx":"f3bd149636a8","components/forms/Input.jsx":"368e0414dfcf","components/forms/SearchBar.jsx":"0fb822837fa3","components/forms/SegmentedSwitch.jsx":"01494c3ae379","components/navigation/AppBar.jsx":"f685eddd0f9e","components/navigation/BottomTabBar.jsx":"d0dab37e0577","components/navigation/StationBar.jsx":"0797d46d8aa5","ui_kits/app/Collect.jsx":"24900127d1b6","ui_kits/app/CollectStructured.jsx":"fdc5c06d534e","ui_kits/app/DoneTasks.jsx":"7d387949d88e","ui_kits/app/Home.jsx":"b0d20a4588d7","ui_kits/app/Inspect.jsx":"2b240d6e7110","ui_kits/app/Login.jsx":"aaf80da6d377","ui_kits/app/Mine.jsx":"520a8eaf5ce3","ui_kits/app/mock.js":"9beaea152805"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_52fd11 = window.DesignSystem_52fd11 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// CollectStructured.jsx
try { (() => {
/* 采集详情（L4·结构尺寸检查—导体&绝缘厚度&金属屏蔽）
   —— 一个试验项含多个「试验子项」，每个子项关联一台设备、一种采集方式。
   · 设备信息区域：在该试验项关联的多台设备间切换；切换设备＝切换子项，下方录入区按采集方式变换样式。
   · 试验数据：仅展示「测量值」；按相别（红/黄/绿）逐相录入，部分字段（如绝缘各测量点厚度）需多次测量→多个输入框。
   · 结论：按相别分组，相同相别合并判定为 1 个结论，三个相别 → 3 个结论；无相别子项仅 1 个结论。
   · 采集方式：auto=设备直连（整批写库·只读·无附件图片）；ble=蓝牙数显卡尺（逐相连接·可手输·可附图）；manual=台式测厚仪（手工录入）。 */
(function () {
  const DS = window.DesignSystem_52fd11;
  const {
    AppBar,
    FieldRow,
    Button,
    CollectBadge,
    Card,
    SegmentedSwitch
  } = DS;
  const Input = DS.Input;
  const PHASES = [{
    v: '红',
    c: 'var(--danger,#e23b3b)'
  }, {
    v: '黄',
    c: 'var(--status-pending,#e8a93a)'
  }, {
    v: '绿',
    c: 'var(--status-done,#1faa54)'
  }];

  // 测量值示例生成（read-only/示例填充用）
  const FIXED = {
    jg: '紧压绞合圆形'
  };
  const BASE = {
    gs: 8,
    zj: 8.00,
    tdhd: 10.00,
    tk1: 13,
    dg1: 14,
    tk2: 15,
    dg2: 14,
    tk3: 13,
    dg3: 14,
    tk4: 15,
    dg4: 14,
    tk5: 13,
    dg5: 14
  };
  const DEC = {
    gs: 0,
    zj: 2,
    tdhd: 2,
    tk1: 1,
    dg1: 1,
    tk2: 1,
    dg2: 1,
    tk3: 1,
    dg3: 1,
    tk4: 1,
    dg4: 1,
    tk5: 1,
    dg5: 1
  };
  function genVal(field, pi) {
    if (FIXED[field.key]) return FIXED[field.key];
    if (field.multi) return Array.from({
      length: field.multi
    }, (_, k) => (12 + k + pi * 0.2).toFixed(1));
    const b = BASE[field.key];
    if (b == null) return '';
    const jit = b * 0.01 * ((pi * 3 + field.key.length) % 5 - 2) / 2;
    return (b + jit).toFixed(DEC[field.key] ?? 2);
  }
  function CollectStructured({
    ctx,
    onBack,
    onDone
  }) {
    const subs = ctx.item.subs;
    const N = subs[0].phased ? PHASES.length : 1; // 每个子项的相别数 = 试验次数
    const subConcl = ['合格', '不合格', '合格']; // 各子项相别结论（示例，对应附件图：绝缘厚度不合格）

    const [activeSub, setActiveSub] = React.useState(0);
    const [activeDevice, setActiveDevice] = React.useState(0);
    const [activePhase, setActivePhase] = React.useState(0);
    const blank = () => subs.map(() => Array.from({
      length: N
    }, () => ({
      filled: false,
      uploaded: false,
      vals: {}
    })));
    const [cells, setCells] = React.useState(blank);
    const [busy, setBusy] = React.useState(null); // 'all' | 'c-si-pi' | 'up-si-pi'
    const [attach, setAttach] = React.useState({}); // { 'si-pi': [{id}] }
    const [env] = React.useState({
      wd: '21.0',
      sd: '30.7'
    });
    const sub = subs[activeSub];
    // 设备与试验子项解除绑定：设备决定采集方式/录入样式，子项决定展示哪些测量值字段
    const devices = [];
    subs.forEach(s => {
      if (s.device && !devices.some(d => d.code === s.device.code)) devices.push({
        ...s.device,
        method: s.method
      });
    });
    const dev = devices[activeDevice] || {};
    const method = dev.method || 'auto';
    const phased = !!sub.phased;
    const editable = method !== 'auto';
    function fillCell(si, pi) {
      const v = {};
      subs[si].fields.forEach(f => {
        v[f.key] = genVal(f, pi);
      });
      setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => b !== pi ? c : {
        ...c,
        filled: true,
        vals: v
      })));
    }
    function setField(si, pi, key, value, idx) {
      setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => {
        if (b !== pi) return c;
        let nv;
        if (idx != null) {
          const arr = Array.isArray(c.vals[key]) ? c.vals[key].slice() : [];
          arr[idx] = value;
          nv = arr;
        } else nv = value;
        return {
          ...c,
          filled: true,
          vals: {
            ...c.vals,
            [key]: nv
          }
        };
      })));
    }
    function captureAll(si) {
      setBusy('all');
      setTimeout(() => {
        const v = pi => {
          const o = {};
          subs[si].fields.forEach(f => {
            o[f.key] = genVal(f, pi);
          });
          return o;
        };
        setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => ({
          ...c,
          filled: true,
          vals: v(b)
        }))));
        setBusy(null);
      }, 1000);
    }
    function connectCell(si, pi) {
      setBusy('c-' + si + '-' + pi);
      setTimeout(() => {
        fillCell(si, pi);
        setBusy(null);
      }, 1100);
    }
    function uploadCell(si, pi) {
      setBusy('up-' + si + '-' + pi);
      setTimeout(() => {
        setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => b !== pi ? c : {
          ...c,
          uploaded: true
        })));
        setBusy(null);
      }, 800);
    }
    function uploadAll() {
      setBusy('all');
      setTimeout(() => {
        setCells(prev => prev.map(s => s.map(c => c.filled ? {
          ...c,
          uploaded: true
        } : c)));
        setBusy(null);
      }, 1100);
    }
    function reset() {
      setCells(blank());
      setAttach({});
    }
    function addAttach(si, pi) {
      setAttach(p => ({
        ...p,
        [si + '-' + pi]: [...(p[si + '-' + pi] || []), {
          id: Date.now() + Math.random()
        }]
      }));
    }
    function removeAttach(si, pi, id) {
      setAttach(p => ({
        ...p,
        [si + '-' + pi]: (p[si + '-' + pi] || []).filter(a => a.id !== id)
      }));
    }
    const flat = cells.flat();
    const totalCells = flat.length;
    const uploadedCount = flat.filter(c => c.uploaded).length;
    const filledCount = flat.filter(c => c.filled).length;
    const pendingUpload = flat.filter(c => c.filled && !c.uploaded).length;
    const allUploaded = totalCells > 0 && uploadedCount === totalCells;
    const inspectState = allUploaded ? 'done' : uploadedCount > 0 ? 'doing' : 'todo';
    const methodHint = {
      auto: '设备直连 · 上位机算毕整批写库，点下方「一键采集」整批回填，不可手输',
      ble: '蓝牙数显卡尺 · 逐相连接同步读数，也可手动输入；可附识别参照图',
      manual: '台式测厚仪为单机设备 · 无通讯接口，读数由检测员手工录入'
    }[method];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(AppBar, {
      title: "\u68C0\u6D4B\u4EFB\u52A1",
      onBack: onBack
    }), /*#__PURE__*/React.createElement(Stamp, {
      state: inspectState
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        paddingBottom: 0
      }
    }, /*#__PURE__*/React.createElement(Section, {
      title: "\u57FA\u7840\u4FE1\u606F",
      icon: "info"
    }, /*#__PURE__*/React.createElement(Grid, {
      items: [['样品编号', ctx.sample.code], ['样品名称', ctx.sample.name], ['试验名称', ctx.item.name], ['试验次数', `${N} 次`]]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-tertiary,#9aa3b2)'
      }
    }, "\u542B ", subs.length, " \u4E2A\u8BD5\u9A8C\u5B50\u9879 \xB7 \u8BD5\u9A8C\u6B21\u6570\u968F\u4EFB\u52A1\u4E0B\u53D1\uFF0C\u4E0D\u53EF\u4FEE\u6539"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto',
        padding: 'var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Section, {
      title: "\u8BBE\u5907\u4FE1\u606F",
      icon: "cpu",
      extra: /*#__PURE__*/React.createElement(CollectBadge, {
        method: method,
        size: "sm"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        flexWrap: 'wrap'
      }
    }, devices.map((d, i) => {
      const on = i === activeDevice;
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        onClick: () => setActiveDevice(i),
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--radius-pill)',
          cursor: 'pointer',
          border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
          background: on ? 'var(--surface-selected)' : 'var(--white)',
          color: on ? 'var(--brand-action)' : 'var(--text-body)',
          fontSize: 'var(--fs-sm)',
          fontWeight: on ? 600 : 400
        }
      }, /*#__PURE__*/React.createElement(CollectDot, {
        method: d.method,
        on: on
      }), d.name);
    })), /*#__PURE__*/React.createElement(Grid, {
      items: [['检测设备', dev.name || '—'], ['设备编号', dev.code || '—'], ['设备型号', dev.model || '—']]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        lineHeight: 1.5
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"
    })), "\u8BE5\u8BD5\u9A8C\u9879\u5173\u8054 ", devices.length, " \u53F0\u8BBE\u5907\uFF0C\u8BBE\u5907\u4E0E\u8BD5\u9A8C\u5B50\u9879\u76F8\u4E92\u72EC\u7ACB\uFF1A\u5207\u8BBE\u5907\u6539\u91C7\u96C6\u65B9\u5F0F/\u5F55\u5165\u6837\u5F0F\uFF0C\u5207\u5B50\u9879\u6539\u6D4B\u91CF\u503C\u5B57\u6BB5")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-lg)',
        fontWeight: 600
      }
    }, "\u8BD5\u9A8C\u5B50\u9879")), /*#__PURE__*/React.createElement(SegmentedSwitch, {
      value: String(activeSub),
      onChange: v => {
        setActiveSub(+v);
        setActivePhase(0);
      },
      options: subs.map((s, i) => ({
        value: String(i),
        label: s.name
      }))
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        margin: '0 2px',
        lineHeight: 1.5
      }
    }, methodHint), method === 'auto' && cells[activeSub].some(c => !c.filled) && /*#__PURE__*/React.createElement(Card, {
      padding: "18px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, busy === 'all' ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--brand-action)'
      }
    }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        marginTop: 10
      }
    }, "\u6B63\u5728\u4ECE\u6570\u636E\u5E93\u6574\u6279\u53D6\u503C\u2026")) : /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      onClick: () => captureAll(activeSub)
    }, "\u26A1 \u4E00\u952E\u91C7\u96C6\uFF08", N, " \u4E2A\u76F8\u522B\uFF09"))), /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        minHeight: 280
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 132,
        flex: 'none',
        borderRight: '1px solid var(--divider)',
        background: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)'
      }
    }, Array.from({
      length: N
    }, (_, pi) => {
      const on = pi === activePhase;
      const c = cells[activeSub][pi];
      const state = c.uploaded ? 'uploaded' : c.filled ? 'done' : 'pending';
      const ph = PHASES[pi % 3];
      return /*#__PURE__*/React.createElement("button", {
        key: pi,
        onClick: () => setActivePhase(pi),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '13px 11px',
          cursor: 'pointer',
          textAlign: 'left',
          border: 'none',
          borderBottom: '1px solid var(--divider)',
          borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
          background: on ? 'var(--white)' : 'transparent'
        }
      }, /*#__PURE__*/React.createElement(TimeStatusIcon, {
        state: state
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-base)',
          fontWeight: on ? 700 : 600,
          color: on ? 'var(--brand-action)' : 'var(--text-title)'
        }
      }, phased && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: ph.c,
          flex: 'none'
        }
      }), phased ? ph.v + '相' : '第 1 次'), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: state === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : 'var(--text-tertiary,#9aa3b2)',
          whiteSpace: 'nowrap'
        }
      }, state === 'uploaded' ? '已上传' : c.filled ? '待上传' : '待采集')));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, (() => {
      const pi = activePhase;
      const c = cells[activeSub][pi];
      const busyCell = busy === 'c-' + activeSub + '-' + pi;
      const akey = activeSub + '-' + pi;
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)'
        }
      }, "\u6D4B\u91CF\u503C", phased ? ` · ${PHASES[pi % 3].v}相` : ''), method === 'ble' && !c.filled && /*#__PURE__*/React.createElement(Button, {
        onClick: () => connectCell(activeSub, pi),
        disabled: busyCell
      }, "\uD83D\uDD35 \u8FDE\u63A5\u91C7\u96C6"), method === 'manual' && !c.filled && /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => fillCell(activeSub, pi)
      }, "\u5F55\u5165\u672C\u76F8\u8BFB\u6570")), busyCell ? /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: 'center',
          padding: '32px 0',
          color: 'var(--brand-action)'
        }
      }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          marginTop: 10
        }
      }, "\u6B63\u5728\u8FDE\u63A5\u8BBE\u5907\u2026")) : /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }
      }, sub.fields.map(f => f.multi ? /*#__PURE__*/React.createElement(MultiField, {
        key: f.key,
        field: f,
        values: c.vals[f.key],
        readOnly: !editable,
        onChange: (idx, val) => setField(activeSub, pi, f.key, val, idx)
      }) : /*#__PURE__*/React.createElement(FieldRow, {
        key: f.key,
        label: f.label,
        unit: f.unit,
        required: true,
        value: c.vals[f.key] || '',
        placeholder: c.filled ? '' : '待采集',
        readOnly: !editable,
        onChange: e => setField(activeSub, pi, f.key, e.target.value)
      })), method === 'auto' && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--collect-auto,#1d54c4)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      })), "\u8BBE\u5907\u76F4\u91C7\u6570\u636E\uFF0C\u4E0D\u53EF\u4FEE\u6539"), method === 'manual' && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--collect-manual,#828c9c)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 20h9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      })), "\u53F0\u5F0F\u6D4B\u539A\u4EEA\u65E0\u901A\u8BAF\u63A5\u53E3 \xB7 \u8BFB\u6570\u624B\u5DE5\u5F55\u5165"), method === 'ble' && c.filled && /*#__PURE__*/React.createElement("div", {
        style: {
          paddingTop: 10,
          borderTop: '1px dashed var(--divider)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 8
        }
      }, "\u8BC6\u522B\u53C2\u7167\u56FE ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-placeholder)'
        }
      }, "\xB7 \u968F\u6570\u636E\u4E00\u8D77\u4E0A\u4F20\u5F52\u6863")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10
        }
      }, (attach[akey] || []).map(a => /*#__PURE__*/React.createElement("div", {
        key: a.id,
        style: {
          position: 'relative',
          width: 76,
          height: 76,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
          background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "22",
        height: "22",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "var(--text-secondary)",
        strokeWidth: "1.6",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      })), /*#__PURE__*/React.createElement("button", {
        onClick: () => removeAttach(activeSub, pi, a.id),
        style: {
          position: 'absolute',
          top: 3,
          right: 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, "\xD7"))), /*#__PURE__*/React.createElement("button", {
        onClick: () => addAttach(activeSub, pi),
        style: {
          width: 76,
          height: 76,
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-strong)',
          background: 'var(--bg-app)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 5v14M5 12h14"
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10
        }
      }, "\u62CD\u7167/\u4E0A\u4F20")))), c.filled && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          marginTop: 2,
          paddingTop: 12,
          borderTop: '1px dashed var(--divider)'
        }
      }, c.uploaded ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--status-done-fg,#1b8a5a)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      })), "\u672C\u76F8\u5DF2\u4E0A\u4F20") : /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => uploadCell(activeSub, pi),
        disabled: busy === 'up-' + activeSub + '-' + pi
      }, busy === 'up-' + activeSub + '-' + pi ? '上传中…' : '确认并上传本相'))));
    })()))), /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v18h18"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m19 9-5 5-4-4-3 3"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, "\u7ED3\u8BBA")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, Array.from({
      length: phased ? N : 1
    }, (_, pi) => {
      const ph = PHASES[pi % 3];
      const c = cells[activeSub][pi];
      const ok = subConcl[activeSub] === '合格';
      const show = c && c.uploaded;
      return /*#__PURE__*/React.createElement("div", {
        key: pi,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }
      }, /*#__PURE__*/React.createElement("label", {
        style: {
          width: 110,
          flex: 'none',
          fontSize: 'var(--fs-base)',
          color: 'var(--text-body)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }
      }, phased && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: ph.c,
          flex: 'none'
        }
      }), phased ? `结论（${ph.v}相）` : '结论'), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          height: 44,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-sunken,#f5f6f8)',
          fontSize: 'var(--fs-base)',
          color: show ? ok ? 'var(--status-done-fg,#1b8a5a)' : 'var(--danger,#e23b3b)' : 'var(--text-placeholder)',
          fontWeight: show ? 600 : 400
        }
      }, show ? subConcl[activeSub] : '本相上传后回显'));
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        lineHeight: 1.5
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none',
        marginTop: 1
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 16v-4 M12 8h.01"
    })), /*#__PURE__*/React.createElement("span", null, phased ? '相同相别的测量数据（一次或多次）合并判定为一个结论；' : '', "\u7ED3\u8BBA\u4E0D\u5728\u672C\u7AEF\u5F55\u5165\uFF0C\u7531 LIMS \u6309\u8BA1\u7B97\u4E0E\u7ED3\u679C\u5224\u5B9A\u914D\u7F6E\u81EA\u52A8\u56DE\u663E")))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 8
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        padding: 'var(--gap-page)',
        borderTop: '1px solid var(--border-default)',
        background: 'var(--white)'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      block: true,
      onClick: reset
    }, "\u91CD\u7F6E\u5168\u90E8"), /*#__PURE__*/React.createElement(Button, {
      block: true,
      disabled: allUploaded ? false : pendingUpload === 0 || busy === 'all',
      onClick: allUploaded ? onDone : uploadAll
    }, busy === 'all' ? '上传中…' : allUploaded ? '完成并退出' : `上传全部（${pendingUpload}/${totalCells}）`)));
  }

  // 多次测量字段：多个输入框（如「绝缘各测量点厚度」）
  function MultiField({
    field,
    values,
    readOnly,
    onChange
  }) {
    const arr = Array.isArray(values) ? values : [];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        width: 110,
        flex: 'none',
        fontSize: 'var(--fs-base)',
        color: 'var(--text-body)',
        display: 'flex',
        gap: 2,
        paddingTop: 11
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--danger)'
      }
    }, "*"), /*#__PURE__*/React.createElement("span", null, field.label, field.unit ? `（${field.unit}）` : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8
      }
    }, Array.from({
      length: field.multi
    }, (_, k) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 9,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 10,
        color: 'var(--text-placeholder)',
        pointerEvents: 'none'
      }
    }, k + 1), /*#__PURE__*/React.createElement("input", {
      value: arr[k] || '',
      readOnly: readOnly,
      onChange: e => onChange(k, e.target.value),
      placeholder: "\u2014",
      style: {
        width: '100%',
        height: 40,
        padding: '0 8px 0 22px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)',
        fontSize: 'var(--fs-sm)',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-title)',
        textAlign: 'center',
        outline: 'none',
        boxSizing: 'border-box'
      }
    })))));
  }
  function CollectDot({
    method,
    on
  }) {
    const col = {
      auto: 'var(--collect-auto)',
      ble: 'var(--collect-ble)',
      manual: 'var(--collect-manual)',
      ocr: 'var(--collect-ocr)'
    }[method] || 'var(--collect-auto)';
    return /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: col,
        flex: 'none',
        opacity: on ? 1 : 0.7
      }
    });
  }
  function TimeStatusIcon({
    state
  }) {
    if (state === 'uploaded') return /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--status-done-fg,#1b8a5a)",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m9 12 2 2 4-4"
    }));
    return /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--status-pending,#e8a93a)",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 8v4 M12 16h.01"
    }));
  }
  function Section({
    title,
    icon,
    extra,
    children
  }) {
    const paths = {
      info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3'
    };
    return /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: paths[icon]
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, title)), extra), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16
      }
    }, children));
  }
  function Grid({
    items
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px 16px'
      }
    }, items.map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 8,
        fontSize: 'var(--fs-base)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        flex: 'none'
      }
    }, k), /*#__PURE__*/React.createElement("span", {
      title: v,
      style: {
        color: 'var(--text-title)',
        fontWeight: 500,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums'
      }
    }, v))));
  }
  function Stamp({
    state
  }) {
    const C = {
      todo: {
        label: '未检测',
        color: '#E8A93A',
        fill: 'rgba(245,196,99,0.14)'
      },
      doing: {
        label: '检测中',
        color: '#5B95E8',
        fill: 'rgba(127,176,242,0.16)'
      },
      done: {
        label: '已检测',
        color: '#4FB97E',
        fill: 'rgba(134,214,166,0.16)'
      }
    }[state];
    const cx = 110,
      cy = 110,
      R = 100;
    const stars = Array.from({
      length: 30
    }, (_, i) => {
      const a = i / 30 * Math.PI * 2 - Math.PI / 2;
      const r = R - 9;
      return /*#__PURE__*/React.createElement("circle", {
        key: i,
        cx: cx + Math.cos(a) * r,
        cy: cy + Math.sin(a) * r,
        r: i % 2 ? 2.2 : 3.4,
        fill: C.color
      });
    });
    return /*#__PURE__*/React.createElement("div", {
      "aria-label": C.label,
      style: {
        position: 'absolute',
        top: 46,
        right: 8,
        width: 120,
        height: 120,
        zIndex: 6,
        pointerEvents: 'none',
        opacity: 0.9,
        transform: 'rotate(-15deg)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 220 220",
      width: "120",
      height: "120"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: R,
      fill: C.fill,
      stroke: C.color,
      strokeWidth: "6"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: R - 13,
      fill: "none",
      stroke: C.color,
      strokeWidth: "2.5"
    }), stars, /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 6,
      textAnchor: "middle",
      dominantBaseline: "middle",
      transform: `rotate(-8 ${cx} ${cy})`,
      fill: C.color,
      fontSize: "60",
      fontWeight: "900",
      letterSpacing: "1",
      style: {
        fontFamily: 'var(--font-sans, sans-serif)'
      }
    }, C.label)));
  }
  function Spinner() {
    return /*#__PURE__*/React.createElement("svg", {
      width: "32",
      height: "32",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      style: {
        animation: 'lk-spin 0.9s linear infinite'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M21 12a9 9 0 1 1-6.219-8.56"
    }));
  }
  window.CollectStructured = CollectStructured;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "CollectStructured.jsx", error: String((e && e.message) || e) }); }

// components/data-display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 基础卡片。白底 + 12px 圆角 + 1px 淡描边 + 轻阴影。
 * selectable + selected: 选中态加蓝边 + 浅蓝底。onClick 时带触控按压反馈。
 */
function Card({
  selected = false,
  selectable = false,
  onClick,
  padding = 'var(--gap-card)',
  children,
  style,
  ...rest
}) {
  const [pressed, setPressed] = React.useState(false);
  const interactive = selectable || !!onClick;
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onPointerDown: () => interactive && setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    style: {
      background: selected ? 'var(--surface-selected)' : 'var(--surface-card)',
      border: `${selected ? '1.5px' : '1px'} solid ${selected ? 'var(--brand-action)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding,
      cursor: interactive ? 'pointer' : 'default',
      transform: pressed ? 'scale(0.99)' : 'scale(1)',
      transition: 'transform var(--dur-fast) var(--ease-out), border-color var(--dur-fast), background var(--dur-fast)',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/Card.jsx", error: String((e && e.message) || e) }); }

// components/data-display/SectionTitle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 区块标题。左侧 4px 品牌蓝竖条 + 标题（沿用旧 app 风格）。
 * 右侧可放操作（more 链接等）。
 */
function SectionTitle({
  children,
  extra,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 16,
      borderRadius: 2,
      background: 'var(--brand)',
      flex: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-h3)',
      fontWeight: 600,
      color: 'var(--text-title)'
    }
  }, children)), extra && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-link)'
    }
  }, extra));
}
Object.assign(__ds_scope, { SectionTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/SectionTitle.jsx", error: String((e && e.message) || e) }); }

// components/data-display/StatCard.jsx
try { (() => {
/**
 * 统计卡。首页「任务状态统计」用：大数字 + 标签 + 状态点。
 * tone: pending/testing/done/overdue/brand → 决定数字与圆点颜色。
 */
const TONE = {
  pending: 'var(--status-pending)',
  testing: 'var(--status-testing-fg)',
  done: 'var(--status-done)',
  overdue: 'var(--status-overdue)',
  brand: 'var(--brand-action)'
};
function StatCard({
  label,
  value,
  tone = 'brand',
  onClick,
  style
}) {
  const c = TONE[tone] || TONE.brand;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      flex: 1,
      background: 'var(--surface-card)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-card)',
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: c
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-secondary)'
    }
  }, label)), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-numeric)',
      fontSize: 32,
      fontWeight: 700,
      color: c,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1.1
    }
  }, value));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/CollectBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 采集方式徽章。auto(自动⚡) | ocr(拍照📷·camera) | ble(蓝牙🔵) | manual(手工✏️)
 * 图标用 Lucide 路径：zap / camera / bluetooth / pencil。
 */
const MAP = {
  auto: {
    c: 'var(--collect-auto)',
    bg: 'var(--collect-auto-bg)',
    label: '设备直连'
  },
  ocr: {
    c: 'var(--collect-ocr)',
    bg: 'var(--collect-ocr-bg)',
    label: '拍照识别'
  },
  ble: {
    c: 'var(--collect-ble)',
    bg: 'var(--collect-ble-bg)',
    label: '蓝牙同步'
  },
  manual: {
    c: 'var(--collect-manual)',
    bg: 'var(--collect-manual-bg)',
    label: '手工录入'
  }
};
function MethodIcon({
  method,
  color,
  size
}) {
  const c = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  switch (method) {
    case 'auto':
      return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("polygon", {
        points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2"
      }));
    case 'ocr':
      return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("path", {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      }));
    case 'ble':
      return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("path", {
        d: "m7 7 10 10-5 5V2l5 5L7 17"
      }));
    default:
      return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("path", {
        d: "M12 20h9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      }));
  }
}
function CollectBadge({
  method = 'auto',
  showLabel = true,
  size = 'md',
  style,
  ...rest
}) {
  const s = MAP[method] || MAP.auto;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: showLabel ? sm ? '2px 8px' : '4px 10px' : sm ? 4 : 6,
      borderRadius: 'var(--radius-pill)',
      background: s.bg,
      color: s.c,
      font: 'var(--font-sans)',
      fontSize: sm ? 'var(--fs-xs)' : 'var(--fs-sm)',
      fontWeight: 600,
      lineHeight: 1.3,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(MethodIcon, {
    method: method,
    color: s.c,
    size: sm ? 13 : 15
  }), showLabel && s.label);
}
Object.assign(__ds_scope, { CollectBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/CollectBadge.jsx", error: String((e && e.message) || e) }); }

// components/data-display/DeviceCard.jsx
try { (() => {
/**
 * 设备卡。检测模块「按设备」列表项。
 * 展示设备名/编号/型号/所在区域/采集方式/可做试验项数；可选中。
 */
function DeviceCard({
  name,
  code,
  model,
  area,
  method = 'auto',
  itemCount,
  enabled = true,
  selected = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    selected: selected,
    onClick: onClick,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0,
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-lg)',
      fontWeight: 600,
      color: 'var(--text-title)'
    }
  }, name), !enabled && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-secondary)',
      background: 'var(--surface-sunken)',
      padding: '1px 7px',
      borderRadius: 'var(--radius-pill)'
    }
  }, "\u505C\u7528")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px 16px',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-secondary)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("span", null, "\u7F16\u53F7 ", code), model && /*#__PURE__*/React.createElement("span", null, "\u578B\u53F7 ", model)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-secondary)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })), area))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 8,
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.CollectBadge, {
    method: method,
    size: "sm"
  }), itemCount != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-secondary)'
    }
  }, "\u53EF\u505A ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: 'var(--brand-action)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, itemCount), " \u9879"))));
}
Object.assign(__ds_scope, { DeviceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/DeviceCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 试验状态圆点。pending(未检测·印章黄) | testing(检测中·浅蓝) | done(已检测·绿)
 * 可带文案；用于试验项行内状态。
 */
const COLOR = {
  pending: {
    c: 'var(--status-pending-dot)',
    label: '未检测'
  },
  testing: {
    c: 'var(--status-testing)',
    label: '检测中'
  },
  done: {
    c: 'var(--status-done)',
    label: '已检测'
  }
};
function StatusDot({
  status = 'pending',
  label,
  size = 11,
  style,
  ...rest
}) {
  const s = COLOR[status] || COLOR.pending;
  const dot = /*#__PURE__*/React.createElement("span", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: s.c,
      flex: 'none',
      display: 'inline-block'
    }
  });
  if (label === false) return React.cloneElement(dot, {
    style: {
      ...dot.props.style,
      ...style
    },
    ...rest
  });
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-body)',
      ...style
    }
  }, rest), dot, label ?? s.label);
}
Object.assign(__ds_scope, { StatusDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusDot.jsx", error: String((e && e.message) || e) }); }

// components/feedback/StatusTag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 状态标签（胶囊）。用于"样品检测状态 / 任务状态"。
 * status: pending(未检测·印章黄) | testing(检测中·浅蓝) | done(已完成·绿) | overdue(已逾期·红)
 */
const MAP = {
  pending: {
    bg: 'var(--status-pending-bg)',
    fg: 'var(--status-pending-fg)',
    label: '未检测'
  },
  testing: {
    bg: 'var(--status-testing-bg)',
    fg: 'var(--status-testing-fg)',
    label: '检测中'
  },
  done: {
    bg: 'var(--status-done-bg)',
    fg: 'var(--status-done-fg)',
    label: '已完成'
  },
  overdue: {
    bg: 'var(--status-overdue-bg)',
    fg: 'var(--status-overdue-fg)',
    label: '已逾期'
  }
};
function StatusTag({
  status = 'pending',
  children,
  size = 'md',
  style,
  ...rest
}) {
  const s = MAP[status] || MAP.pending;
  const pad = size === 'sm' ? '1px 8px' : '3px 11px';
  const fs = size === 'sm' ? 'var(--fs-xs)' : 'var(--fs-sm)';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: pad,
      borderRadius: 'var(--radius-pill)',
      background: s.bg,
      color: s.fg,
      font: 'var(--font-sans)',
      fontSize: fs,
      fontWeight: 600,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      ...style
    }
  }, rest), children ?? s.label);
}
Object.assign(__ds_scope, { StatusTag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/StatusTag.jsx", error: String((e && e.message) || e) }); }

// components/data-display/SampleListItem.jsx
try { (() => {
/**
 * 样品列表项（左侧栏）。沿用旧 L3/L4 左侧序号栏样式：
 * 序号 + 样品编号 + 检测状态标签，选中态高亮。
 */
function SampleListItem({
  index,
  code,
  status = 'pending',
  selected = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      width: '100%',
      textAlign: 'left',
      padding: '12px 14px',
      cursor: 'pointer',
      background: selected ? 'var(--surface-selected)' : 'var(--white)',
      border: 'none',
      borderLeft: `3px solid ${selected ? 'var(--brand-action)' : 'transparent'}`,
      borderBottom: '1px solid var(--divider)',
      transition: 'background var(--dur-fast)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-xs)',
      fontWeight: 600,
      color: selected ? 'var(--brand-action)' : 'var(--text-secondary)',
      background: selected ? 'var(--blue-100)' : 'var(--surface-sunken)',
      borderRadius: 'var(--radius-sm)',
      padding: '1px 7px',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "\u5E8F\u53F7 ", index), /*#__PURE__*/React.createElement(__ds_scope.StatusTag, {
    status: status,
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-body)',
      fontWeight: selected ? 600 : 400,
      fontVariantNumeric: 'tabular-nums',
      wordBreak: 'break-all'
    }
  }, code));
}
Object.assign(__ds_scope, { SampleListItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/SampleListItem.jsx", error: String((e && e.message) || e) }); }

// components/data-display/TaskCard.jsx
try { (() => {
/**
 * 任务卡。任务列表（待检/检测中/已完成/已逾期）的列表项。
 * 沿用旧 app：任务编号 / 样品名称 / 委托单位 / 下发时间 + 右上状态标签。
 */
function TaskCard({
  code,
  sampleName,
  client,
  time,
  status = 'pending',
  onClick,
  style
}) {
  const Row = ({
    label,
    value
  }) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      fontSize: 'var(--fs-sm)',
      lineHeight: 1.7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      flex: 'none'
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)',
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, value));
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    onClick: onClick,
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-lg)',
      fontWeight: 600,
      color: 'var(--text-title)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, "\u4EFB\u52A1\u7F16\u53F7 ", code), /*#__PURE__*/React.createElement(__ds_scope.StatusTag, {
    status: status
  })), /*#__PURE__*/React.createElement(Row, {
    label: "\u6837\u54C1\u540D\u79F0",
    value: sampleName
  }), /*#__PURE__*/React.createElement(Row, {
    label: "\u59D4\u6258\u5355\u4F4D",
    value: client
  }), /*#__PURE__*/React.createElement(Row, {
    label: "\u4E0B\u53D1\u65F6\u95F4",
    value: time
  }));
}
Object.assign(__ds_scope, { TaskCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/TaskCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/UploadStatus.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 上传状态图标 + 文案。
 * status: pending(未上传·橙告警) | done(已上传·绿对勾)
 * 图标采用 Lucide alert-circle / check-circle 路径。
 */
function Icon({
  name,
  color,
  size
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  if (name === 'check') {
    return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m9 12 2 2 4-4"
    }));
  }
  return /*#__PURE__*/React.createElement("svg", common, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  }));
}
function UploadStatus({
  status = 'pending',
  showLabel = true,
  size = 16,
  style,
  ...rest
}) {
  const done = status === 'done';
  const color = done ? 'var(--upload-done)' : 'var(--upload-pending)';
  const label = done ? '已上传' : '未上传';
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      color,
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 600,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(Icon, {
    name: done ? 'check' : 'alert',
    color: color,
    size: size
  }), showLabel && label);
}
Object.assign(__ds_scope, { UploadStatus });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/UploadStatus.jsx", error: String((e && e.message) || e) }); }

// components/data-display/TestItemCard.jsx
try { (() => {
/**
 * 试验项卡。样品详情 / 检测列表里的一条试验项。
 * 展示：试验项名 + 试验状态圆点 + 检测设备 + 采集方式 + 上传状态。
 * status: pending/testing/done；upload?: pending/done。
 */
function TestItemCard({
  name,
  device,
  status = 'pending',
  method = 'auto',
  upload,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement(__ds_scope.Card, {
    onClick: onClick,
    padding: "14px var(--gap-card)",
    style: style
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.StatusDot, {
    status: status,
    label: false,
    size: 10
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-lg)',
      fontWeight: 600,
      color: 'var(--text-title)'
    }
  }, name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      flex: 'none'
    }
  }, upload && /*#__PURE__*/React.createElement(__ds_scope.UploadStatus, {
    status: upload,
    showLabel: false
  }), /*#__PURE__*/React.createElement(__ds_scope.CollectBadge, {
    method: method,
    size: "sm",
    showLabel: false
  }), /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-placeholder)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  })))), device && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      paddingLeft: 18,
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-secondary)'
    }
  }, "\u68C0\u6D4B\u8BBE\u5907\uFF1A", device));
}
Object.assign(__ds_scope, { TestItemCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/TestItemCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 按钮。variant: primary(实心蓝) | secondary(描边) | ghost(无底) | danger(红)
 * size: lg(48) | md(40) | sm(32)。block 占满整行。支持 icon。
 * 按压：scale(0.97) + 主色加深一档（无弹跳）。
 */
const VARIANT = {
  primary: {
    bg: 'var(--brand-action)',
    fg: '#fff',
    bd: 'transparent',
    press: 'var(--brand-action-press)'
  },
  secondary: {
    bg: 'var(--white)',
    fg: 'var(--brand-action)',
    bd: 'var(--brand-action)',
    press: 'var(--blue-50)'
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--text-body)',
    bd: 'transparent',
    press: 'var(--surface-hover)'
  },
  danger: {
    bg: 'var(--danger)',
    fg: '#fff',
    bd: 'transparent',
    press: '#c22a2a'
  }
};
const SIZE = {
  lg: {
    h: 'var(--control-h)',
    fs: 'var(--fs-lg)',
    px: 24
  },
  md: {
    h: 40,
    fs: 'var(--fs-base)',
    px: 18
  },
  sm: {
    h: 'var(--control-h-sm)',
    fs: 'var(--fs-sm)',
    px: 14
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  icon,
  children,
  style,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  ...rest
}) {
  const v = VARIANT[variant] || VARIANT.primary;
  const s = SIZE[size] || SIZE.md;
  const [pressed, setPressed] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    disabled: disabled,
    onMouseDown: e => {
      setPressed(true);
      onMouseDown?.(e);
    },
    onMouseUp: e => {
      setPressed(false);
      onMouseUp?.(e);
    },
    onMouseLeave: e => {
      setPressed(false);
      onMouseLeave?.(e);
    },
    style: {
      display: block ? 'flex' : 'inline-flex',
      width: block ? '100%' : 'auto',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      height: s.h,
      padding: `0 ${s.px}px`,
      minWidth: s.h,
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${v.bd}`,
      background: pressed && !disabled ? v.press : v.bg,
      color: v.fg,
      font: 'var(--font-sans)',
      fontSize: s.fs,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.45 : 1,
      transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
      transition: 'transform var(--dur-fast) var(--ease-out), background var(--dur-fast)',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      ...style
    }
  }, rest), icon, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 输入框 / 带前置图标。聚焦：蓝边 + 蓝色外发光。
 * 用于编号搜索、试验字段录入等。
 */
function Input({
  value,
  onChange,
  placeholder,
  disabled = false,
  readOnly = false,
  prefix,
  suffix,
  unit,
  size = 'md',
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === 'lg' ? 'var(--control-h)' : size === 'sm' ? 'var(--control-h-sm)' : 44;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: h,
      padding: '0 12px',
      borderRadius: 'var(--radius-md)',
      background: readOnly ? 'var(--surface-sunken)' : 'var(--white)',
      border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'border var(--dur-fast), box-shadow var(--dur-fast)',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: 'var(--text-secondary)',
      flex: 'none'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    readOnly: readOnly,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-base)',
      color: 'var(--text-title)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, rest)), unit && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-secondary)',
      fontSize: 'var(--fs-sm)',
      flex: 'none'
    }
  }, unit), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      color: 'var(--text-secondary)',
      flex: 'none'
    }
  }, suffix));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/data-display/FieldRow.jsx
try { (() => {
/**
 * 试验字段录入行。采集详情页的字段，如「正向电阻 [μΩ]」。
 * required 显示红星；readOnly 显示已采集只读值（灰底）。
 */
function FieldRow({
  label,
  value,
  onChange,
  unit,
  placeholder = '数值',
  required = false,
  readOnly = false,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      ...style
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      width: 110,
      flex: 'none',
      fontSize: 'var(--fs-base)',
      color: 'var(--text-body)',
      display: 'flex',
      gap: 2
    }
  }, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--danger)'
    }
  }, "*"), /*#__PURE__*/React.createElement("span", null, label, unit ? `（${unit}）` : '')), /*#__PURE__*/React.createElement(__ds_scope.Input, {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    readOnly: readOnly,
    style: {
      flex: 1
    }
  }));
}
Object.assign(__ds_scope, { FieldRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/FieldRow.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 搜索栏。左侧放大镜、右侧可选扫码按钮（现场扫样品/设备条码）。
 * 沿用旧 app："请输入试验编号、试验名称进行搜索" + 扫码。
 */
function SearchBar({
  value,
  onChange,
  placeholder = '请输入编号或名称搜索',
  onScan,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: 44,
      padding: '0 14px',
      background: 'var(--white)',
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${focus ? 'var(--border-focus)' : 'var(--border-default)'}`,
      boxShadow: focus ? 'var(--shadow-focus)' : 'none',
      transition: 'border var(--dur-fast), box-shadow var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--text-placeholder)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.3-4.3"
  })), /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: onChange,
    placeholder: placeholder,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-base)',
      color: 'var(--text-title)'
    }
  })), onScan && /*#__PURE__*/React.createElement("button", {
    onClick: onScan,
    "aria-label": "\u626B\u7801",
    style: {
      width: 44,
      height: 44,
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--white)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      color: 'var(--brand-action)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 7V5a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17 3h2a2 2 0 0 1 2 2v2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 17v2a2 2 0 0 1-2 2h-2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 21H5a2 2 0 0 1-2-2v-2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "12",
    x2: "17",
    y2: "12"
  }))));
}
Object.assign(__ds_scope, { SearchBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedSwitch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * 分段切换控件（segmented）。检测模块右上「按设备 / 按样品」模式切换即用它。
 * options: [{ value, label }]；受控 value + onChange。
 */
function SegmentedSwitch({
  options = [],
  value,
  onChange,
  size = 'md',
  style,
  ...rest
}) {
  const h = size === 'sm' ? 32 : 38;
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'inline-flex',
      height: h,
      padding: 3,
      background: 'var(--surface-sunken)',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-default)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 3,
      bottom: 3,
      left: 3,
      width: `calc((100% - 6px) / ${options.length})`,
      transform: `translateX(${idx * 100}%)`,
      background: 'var(--white)',
      borderRadius: 'var(--radius-pill)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  }), options.map(o => {
    const active = o.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: o.value,
      onClick: () => onChange?.(o.value),
      style: {
        position: 'relative',
        zIndex: 1,
        flex: 1,
        border: 'none',
        background: 'transparent',
        padding: '0 18px',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        font: 'var(--font-sans)',
        fontSize: 'var(--fs-sm)',
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--brand-action)' : 'var(--text-secondary)',
        transition: 'color var(--dur-fast)'
      }
    }, o.label);
  }));
}
Object.assign(__ds_scope, { SegmentedSwitch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedSwitch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppBar.jsx
try { (() => {
/**
 * 顶部导航栏。左返回（可选）+ 居中标题 + 右操作（可选，如扫码）。
 * 高度 var(--appbar-h)；白底 + 底部 1px 分隔。
 */
function AppBar({
  title,
  onBack,
  right,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--appbar-h)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      background: 'var(--white)',
      borderBottom: '1px solid var(--border-default)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      flex: 'none'
    }
  }, onBack && /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "\u8FD4\u56DE",
    style: {
      width: 40,
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-title)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m15 18-6-6 6-6"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      font: 'var(--font-sans)',
      fontSize: 'var(--fs-h3)',
      fontWeight: 600,
      color: 'var(--text-title)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      flex: 'none',
      display: 'flex',
      justifyContent: 'flex-end'
    }
  }, right));
}
Object.assign(__ds_scope, { AppBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomTabBar.jsx
try { (() => {
/**
 * 底部 Tab 栏。检测员：首页 / 我的。
 * items: [{ key, label, icon:'home'|'user' }]；active + onChange。
 */
function TabIcon({
  name,
  active
}) {
  const color = active ? 'var(--brand-action)' : 'var(--text-secondary)';
  const c = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round'
  };
  if (name === 'user') return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("path", {
    d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  }));
  if (name === 'clipboard') return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("rect", {
    width: "8",
    height: "4",
    x: "8",
    y: "2",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m9 14 2 2 4-4"
  }));
  return /*#__PURE__*/React.createElement("svg", c, /*#__PURE__*/React.createElement("path", {
    d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 22 9 12 15 12 15 22"
  }));
}
function BottomTabBar({
  items = [],
  active,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 'var(--tabbar-h)',
      display: 'flex',
      background: 'var(--white)',
      borderTop: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-tabbar)',
      ...style
    }
  }, items.map(it => {
    const on = it.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      onClick: () => onChange?.(it.key),
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer'
      }
    }, /*#__PURE__*/React.createElement(TabIcon, {
      name: it.icon,
      active: on
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-xs)',
        fontWeight: on ? 600 : 400,
        color: on ? 'var(--brand-action)' : 'var(--text-secondary)'
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { BottomTabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomTabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/StationBar.jsx
try { (() => {
/**
 * 工位上下文条。检测模块顶部常驻，显示当前工位，可点击切换。
 * 体现"工位为持久上下文，而非每次必选第一步"的核心交互。
 */
function StationBar({
  station,
  onSwitch,
  onClear,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 14px',
      background: 'var(--blue-50)',
      border: '1px solid var(--blue-100)',
      borderRadius: 'var(--radius-md)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "var(--brand-action)",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10",
    r: "3"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-secondary)',
      flex: 'none'
    }
  }, "\u5F53\u524D\u5DE5\u4F4D"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--fs-base)',
      fontWeight: 600,
      color: 'var(--text-title)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    }
  }, station), onClear && /*#__PURE__*/React.createElement("button", {
    onClick: onClear,
    "aria-label": "\u6E05\u9664\u5DE5\u4F4D",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 'none',
      width: 22,
      height: 22,
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--text-secondary)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m15 9-6 6 M9 9l6 6"
  })))), /*#__PURE__*/React.createElement("button", {
    onClick: onSwitch,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      flex: 'none',
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: 'var(--brand-action)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 600
    }
  }, "\u5207\u6362", /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "m6 9 6 6 6-6"
  }))));
}
Object.assign(__ds_scope, { StationBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/StationBar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Collect.jsx
try { (() => {
/* 采集详情（L4）— 基础/设备/环境 + 按「采集方式」自适应的 N 次字段录入 + 汇总 + 上传
   试验次数 N = 样段数量 × 试样数量 × 测试芯数（随 LIMS 任务下发，检测员不可改）。
   · 设备直采(auto)：上位机算完整批写库，页面一键从库取值整批回填，只读。
   · 蓝牙/串口(ble)：逐条采集（一次一条读数），可手输。
   · 图像采集(ocr)：逐条拍照识别；拍照入口仅当「采集方式=图采 且 识别规则验证状态=已通过」时出现，否则回退手输。
   · 外部程序(external)：电子天平类，平板程序代采写库，App 不出现采集按钮，仅手输补录 + 查看已采数据。
   · 汇总字段（结论 jl / 平均值 pjz）：N 次全部完成后整体计算一次（auto 由上位机随数据回传）。 */
(function () {
  const {
    AppBar,
    FieldRow,
    Button,
    CollectBadge,
    UploadStatus,
    Card
  } = window.DesignSystem_52fd11;
  const M = window.MOCK;
  const SUMMARY_KEYS = new Set(['jl', 'pjz']); // 汇总字段：整组算一次

  // 各字段每次的基准读数（按次轻微抖动，模拟真实多芯/多试样差异）
  const BASE = {
    zx: 159.88,
    fx: 143.10,
    cd: 1.000,
    jggd: 12.5,
    sywd: 20.0,
    scdz: 0.0186,
    dz20: 0.124,
    bcz: 4.50,
    csz: 4.52,
    jsz: 4.50,
    hctk: 2.48,
    gdkd: 40.0,
    dckd: 20.0,
    kzqd: 18.6,
    dlcl: 480,
    fhcl: 85,
    lqbx: 12,
    sssl: 3.2,
    jysd: 23,
    msa: 12.42,
    msil: 5.18,
    myd: 1.42
  };
  const DEC = {
    zx: 2,
    fx: 2,
    pj: 2,
    wb: 2,
    jg: 4,
    cd: 3,
    scdz: 4,
    dz20: 3,
    bcz: 2,
    csz: 2,
    jsz: 2,
    hctk: 2,
    gdkd: 1,
    dckd: 1,
    kzqd: 1,
    sssl: 1,
    jggd: 1,
    sywd: 1,
    dlcl: 0,
    fhcl: 0,
    lqbx: 0,
    jysd: 0,
    msa: 2,
    msil: 2,
    myd: 3
  };
  function valAt(key, i) {
    if (key === 'sywd') return BASE.sywd.toFixed(1); // 试验温度恒定
    if (key === 'jysd') return BASE.jysd.toFixed(0); // 浸渍液温度恒定
    if (key === 'cd') return BASE.cd.toFixed(3); // 长度恒定
    if (key === 'pj' || key === 'wb' || key === 'jg') {
      // 平均/温补/结果由正反向推算
      const zx = +valAt('zx', i),
        fx = +valAt('fx', i);
      const pj = (zx + fx) / 2;
      if (key === 'pj') return pj.toFixed(2);
      const wb = pj * 1.086; // 温度补偿
      if (key === 'wb') return wb.toFixed(2);
      return (wb / BASE.cd / 1000).toFixed(4); // 结果 Ω/km
    }
    const base = BASE[key];
    if (base == null) return '';
    const jitter = base * 0.012 * ((i * 37 + key.length * 13) % 7 - 3) / 3; // ±~1.2%
    return (base + jitter).toFixed(DEC[key] ?? 2);
  }

  // 试验次数：样段 × 试样 × 芯数（芯数从样品名解析，样段/试样取自任务，demo=1）
  function deriveCount(ctx) {
    const explicit = ctx.count ?? ctx.item?.count;
    if (explicit != null) return {
      duan: 1,
      shi: explicit,
      xin: 1,
      total: explicit
    };
    const m = (ctx.sample?.name || '').match(/(\d+)\s*芯/);
    const xin = m ? +m[1] : 1;
    const duan = ctx.seg || 1,
      shi = ctx.specimen || 1;
    return {
      duan,
      shi,
      xin,
      total: duan * shi * xin
    };
  }
  function Collect({
    ctx,
    onBack,
    onDone
  }) {
    // 含「试验子项」的试验项（如 结构尺寸检查—导体&绝缘厚度&金属屏蔽）走专用的子项/设备切换体验
    if (ctx.item && ctx.item.subs && ctx.item.subs.length && window.CollectStructured) {
      return /*#__PURE__*/React.createElement(window.CollectStructured, {
        ctx: ctx,
        onBack: onBack,
        onDone: onDone
      });
    }
    const dev = ctx.device || {};
    const method = ctx.method || dev.method || 'auto';
    const tpl = ctx.item?.tpl ? M.fieldTpl[ctx.item.tpl] : M.fieldTpl.size;
    const rule = M.testRules && M.testRules[ctx.item?.name] || {};
    const measureFields = tpl.filter(f => !SUMMARY_KEYS.has(f.key));
    const summaryFields = tpl.filter(f => SUMMARY_KEYS.has(f.key));

    // 图采是否就绪：采集方式=图采 且 识别规则验证状态=已通过
    const ocrReady = method === 'ocr' && ctx.ocrVerified !== false;
    const isExternal = method === 'external';
    const editable = method === 'ble' || method === 'manual' || method === 'ocr' || isExternal;
    const phasedCfg = ctx.item && ctx.item.phased != null ? ctx.item.phased : rule.phased != null ? rule.phased : null;
    const isCable = phasedCfg != null ? !!phasedCfg : !!ctx.sample?.cable; // 是否含相别
    // 试验次数模型：含相别 → 红/黄/绿 三相，每相 perPhase 次；无相别 → 共 count 次
    const phaseList = isCable ? ['红', '黄', '绿'] : null;
    const perPhase = isCable ? ctx.item?.perPhase ?? rule.perPhase ?? ctx.item?.count ?? 1 : ctx.item?.count ?? rule.count ?? deriveCount(ctx).total;
    const N = isCable ? phaseList.length * perPhase : perPhase;
    const phaseOf = i => isCable ? phaseList[Math.floor(i / perPhase)] : null;
    const phaseWithin = i => isCable ? i % perPhase : i;
    const PHASE_C = {
      '红': 'var(--danger,#e23b3b)',
      '黄': 'var(--status-pending,#e8a93a)',
      '绿': 'var(--status-done,#1faa54)'
    };
    // LIMS 流程门控：进入「组内审核」及以后 → 数据锁定不可改；退回到「试验检测」→ 可改并需重新上传
    const FLOW_LOCK_AFTER = ['组内审核', '数据审核', '报告编制', '报告审核', '报告签发', '报告处理', '收费审批', '报告发放', '任务归档', '任务完成'];
    const DEMO_FLOWS = {
      normal: {
        node: '试验检测'
      },
      returned: {
        node: '试验检测',
        returned: true,
        returnReason: '第 2 次正向电阻读数与历史数据偏差较大，疑似拍照识别误差，请复测后重新上传',
        returnedFrom: '数据审核',
        by: '张伟',
        role: '数据审核',
        at: '06-25 14:30'
      },
      locked: {
        node: '组内审核'
      }
    };
    const [demoFlow, setDemoFlow] = React.useState(null);
    const flow = demoFlow ? DEMO_FLOWS[demoFlow] : ctx.flow || ctx.item?.flow || {
      node: '试验检测'
    };
    const flowLocked = FLOW_LOCK_AFTER.includes(flow.node);
    const flowReturned = !flowLocked && !!flow.returned;
    const initTimes = () => Array.from({
      length: N
    }, () => ({
      status: 'idle',
      vals: {},
      uploaded: false
    }));
    const [times, setTimes] = React.useState(initTimes);
    const [summary, setSummary] = React.useState({
      status: 'idle',
      vals: {}
    });
    const [busy, setBusy] = React.useState(null); // 'all' | time index | null
    const [phase, setPhase] = React.useState(ctx.status === 'done' ? 'done' : 'idle'); // idle|filled|uploading|done
    const [env, setEnv] = React.useState({
      wd: '21.0',
      sd: '30.7'
    });
    // 环境数据来源（两种方案）：
    //   guard = 安全管家物联节点：上位机物理绑定具体温湿度物联节点，经安全管家平台取数
    //           → 标识 = 安全管家 + 物联节点名称 + 节点编号
    //   wifi  = 数采系统直连传感器：传感器经 Wi-Fi 主动上报至数采系统（RS-WS-WIFI-6）
    //           → 标识 = 采集方式类型文本 + 传感器型号（型号不单独作标识）
    const GUARD_NODES = {
      thk: {
        nodeName: '温湿度RK2D',
        code: 'D1XQ988PK03P'
      },
      hext: {
        nodeName: '温湿度PT8F',
        code: 'D1XQ977QK21M'
      }
    };
    const isGuardEnv = !!GUARD_NODES[dev.id];
    const envSrc = isGuardEnv ? {
      scheme: 'guard',
      platform: '安全管家',
      node: GUARD_NODES[dev.id].nodeName,
      code: GUARD_NODES[dev.id].code
    } : {
      scheme: 'wifi',
      typeLabel: '独立温湿度传感器',
      model: 'RS-WS-WIFI-6'
    };
    const [activeTime, setActiveTime] = React.useState(0);
    const [scenes, setScenes] = React.useState({});
    const [shootIdx, setShootIdx] = React.useState(null); // 拍照识别取景页目标次序
    const [shotPhase, setShotPhase] = React.useState('idle'); // idle|recognizing
    const [attachments, setAttachments] = React.useState({}); // { [次序]: [{id, kind}] }
    const [editTimes, setEditTimes] = React.useState({}); // 拍照识别：{ [次序]: true } 表示该次已解锁可编辑（默认锁定置灰防误触）
    const [phases, setPhases] = React.useState({}); // 电缆相别：{ [次序]: '红'|'黄'|'绿' }

    function addAttach(i, kind) {
      setAttachments(p => ({
        ...p,
        [i]: [...(p[i] || []), {
          id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          kind
        }]
      }));
    }
    function removeAttach(i, id) {
      setAttachments(p => ({
        ...p,
        [i]: (p[i] || []).filter(a => a.id !== id)
      }));
    }
    function fillTime(i) {
      const v = {};
      measureFields.forEach(f => {
        v[f.key] = valAt(f.key, i);
      });
      return v;
    }
    function computeSummary(allTimes) {
      const v = {};
      summaryFields.forEach(f => {
        if (f.key === 'jl') v[f.key] = '合格';else {
          // 平均值
          const nums = allTimes.map(t => parseFloat(t.vals[measureFields[measureFields.length - 1]?.key])).filter(x => !isNaN(x));
          v[f.key] = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '';
        }
      });
      return v;
    }
    React.useEffect(() => {
      if (ctx.status === 'done') {
        const ts = Array.from({
          length: N
        }, (_, i) => ({
          status: 'filled',
          vals: fillTime(i),
          uploaded: true
        }));
        setTimes(ts);
        setSummary({
          status: 'done',
          vals: computeSummary(ts)
        });
      }
    }, []);
    const allFilled = times.every(t => t.status === 'filled');
    const filledCount = times.filter(t => t.status === 'filled').length;
    const pendingUpload = times.filter(t => t.status === 'filled' && !t.uploaded).length;
    const uploadedCount = times.filter(t => t.uploaded).length;
    const allUploaded = N > 0 && uploadedCount === N;

    // L4 检测状态印章：未检测（无已上传数据）→ 检测中（完成至少一次上传）→ 已检测（全部上传完成）
    const inspectState = allUploaded ? 'done' : uploadedCount > 0 ? 'doing' : 'todo';

    // 设备直采：上位机整批写库，一键取值，全部时次 + 汇总一次性回填（只读）
    function captureAll() {
      setBusy('all');
      setTimeout(() => {
        const ts = Array.from({
          length: N
        }, (_, i) => ({
          status: 'filled',
          vals: fillTime(i),
          uploaded: false
        }));
        setTimes(ts);
        setSummary({
          status: 'done',
          vals: computeSummary(ts)
        });
        setBusy(null);
        setPhase('filled');
      }, 1100);
    }
    // 蓝牙/图采：逐条采集第 i 次
    function captureTime(i) {
      setBusy(i);
      setTimeout(() => {
        setTimes(prev => {
          const next = prev.slice();
          next[i] = {
            status: 'filled',
            vals: fillTime(i),
            uploaded: false
          };
          if (next.every(t => t.status === 'filled') && editable) setSummary({
            status: 'done',
            vals: computeSummary(next)
          });
          return next;
        });
        setBusy(null);
      }, method === 'ble' ? 1200 : 950);
    }
    // 外部程序：从平板程序已推数据中拉取（只读查看）
    function pullExternal() {
      setBusy('all');
      setTimeout(() => {
        const ts = Array.from({
          length: N
        }, (_, i) => ({
          status: 'filled',
          vals: fillTime(i),
          uploaded: false
        }));
        setTimes(ts);
        setSummary({
          status: 'done',
          vals: computeSummary(ts)
        });
        setBusy(null);
      }, 900);
    }
    function manualTime(i) {
      setTimes(prev => {
        const next = prev.slice();
        const v = {};
        measureFields.forEach(f => {
          v[f.key] = '';
        });
        next[i] = {
          status: 'filled',
          vals: v,
          uploaded: false
        };
        return next;
      });
    }
    function setField(i, key, value) {
      if (flowLocked) return; // 流程已锁定，禁止修改
      setTimes(prev => {
        const next = prev.slice();
        next[i] = {
          ...next[i],
          vals: {
            ...next[i].vals,
            [key]: value
          },
          status: 'filled',
          uploaded: flowReturned ? false : next[i].uploaded
        };
        if (next.every(t => t.status === 'filled') && editable) setSummary({
          status: 'done',
          vals: computeSummary(next)
        });
        return next;
      });
    }
    // 拍照识别/相册：取景页内识别，完成后回填该次并关闭
    function doShoot() {
      const i = shootIdx;
      setShotPhase('recognizing');
      setTimeout(() => {
        setTimes(prev => {
          const next = prev.slice();
          next[i] = {
            status: 'filled',
            vals: fillTime(i),
            uploaded: false
          };
          if (next.every(t => t.status === 'filled') && editable) setSummary({
            status: 'done',
            vals: computeSummary(next)
          });
          return next;
        });
        setShotPhase('idle');
        setShootIdx(null);
        setActiveTime(i);
        // 拍照识别只保留一张参照图：每次识别替换上一张，避免核查时无法对应数据来源
        setAttachments(p => ({
          ...p,
          [i]: [{
            id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            kind: 'photo'
          }]
        }));
      }, 1100);
    }
    // 拍照识别·重新识别：用「上一次拍的同一张照片」重新做识别提取数据（区别于清除图片重新拍照上传）
    function reRecognize(i) {
      if (!(attachments[i] || []).length) return;
      setBusy(i);
      setTimeout(() => {
        setTimes(prev => {
          const next = prev.slice();
          next[i] = {
            ...next[i],
            status: 'filled',
            vals: fillTime(i),
            uploaded: false
          };
          if (next.every(t => t.status === 'filled') && editable) setSummary({
            status: 'done',
            vals: computeSummary(next)
          });
          return next;
        });
        setEditTimes(p => ({
          ...p,
          [i]: false
        })); // 重新识别后回到锁定态
        setBusy(null);
      }, 950);
    }
    function upload() {
      setPhase('uploading');
      setTimeout(() => {
        setTimes(prev => prev.map(t => t.status === 'filled' ? {
          ...t,
          uploaded: true
        } : t));
        setPhase('idle');
      }, 1100);
    }
    // 拍照识别/蓝牙：逐条采集完一次即可单独上传该次
    function uploadTime(i) {
      setBusy('up' + i);
      setTimeout(() => {
        setTimes(prev => prev.map((t, idx) => idx === i ? {
          ...t,
          uploaded: true
        } : t));
        setBusy(null);
      }, 800);
    }
    function reset() {
      setTimes(initTimes());
      setSummary({
        status: 'idle',
        vals: {}
      });
      setPhase('idle');
    }
    const methodHint = {
      auto: '设备直连 · 上位机算毕整批写库，点击下方一键从库取值，不可手输',
      ocr: ocrReady ? '逐条拍摄仪器读数屏自动识别，完成一次即可上传，无需等全部完成' : '该试验项识别规则未通过验证，已回退手工录入',
      ble: '蓝牙数显卡尺 · 逐条连接同步读数，也可手动输入',
      manual: '手工逐条录入数据',
      external: '电子天平由工业平板采集程序代采写库 · App 不在此采集，可手输补录或查看已采数据'
    }[method];
    const verifiedField = measureFields[measureFields.length - 1];
    function Stamp({
      state
    }) {
      const C = {
        todo: {
          label: '未检测',
          color: '#E8A93A',
          fill: 'rgba(245,196,99,0.14)'
        },
        doing: {
          label: '检测中',
          color: '#5B95E8',
          fill: 'rgba(127,176,242,0.16)'
        },
        done: {
          label: '已检测',
          color: '#4FB97E',
          fill: 'rgba(134,214,166,0.16)'
        }
      }[state];
      const cx = 110,
        cy = 110,
        R = 100;
      const stars = Array.from({
        length: 30
      }, (_, i) => {
        const a = i / 30 * Math.PI * 2 - Math.PI / 2;
        const r = R - 9;
        const x = cx + Math.cos(a) * r,
          y = cy + Math.sin(a) * r;
        return /*#__PURE__*/React.createElement("circle", {
          key: i,
          cx: x,
          cy: y,
          r: i % 2 ? 2.2 : 3.4,
          fill: C.color
        });
      });
      return /*#__PURE__*/React.createElement("div", {
        "aria-label": C.label,
        style: {
          position: 'absolute',
          top: 46,
          right: 8,
          width: 120,
          height: 120,
          zIndex: 6,
          pointerEvents: 'none',
          opacity: 0.9,
          transform: 'rotate(-15deg)'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        viewBox: "0 0 220 220",
        width: "120",
        height: "120"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: cx,
        cy: cy,
        r: R,
        fill: C.fill,
        stroke: C.color,
        strokeWidth: "6"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: cx,
        cy: cy,
        r: R - 13,
        fill: "none",
        stroke: C.color,
        strokeWidth: "2.5"
      }), stars, /*#__PURE__*/React.createElement("text", {
        x: cx,
        y: cy + 6,
        textAnchor: "middle",
        dominantBaseline: "middle",
        transform: `rotate(-8 ${cx} ${cy})`,
        fill: C.color,
        fontSize: "60",
        fontWeight: "900",
        letterSpacing: "1",
        style: {
          fontFamily: 'var(--font-sans, sans-serif)'
        }
      }, C.label)));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(AppBar, {
      title: "\u68C0\u6D4B\u4EFB\u52A1",
      onBack: onBack
    }), /*#__PURE__*/React.createElement(Stamp, {
      state: inspectState
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        paddingBottom: 0
      }
    }, /*#__PURE__*/React.createElement(FlowBanner, {
      flow: flow,
      locked: flowLocked,
      returned: flowReturned
    }), /*#__PURE__*/React.createElement(Section, {
      title: "\u57FA\u7840\u4FE1\u606F",
      icon: "info"
    }, /*#__PURE__*/React.createElement(Grid, {
      items: [['样品编号', ctx.sample.code], ['样品名称', ctx.sample.name], ['试验名称', ctx.item.name], ['试验次数', `${N} 次`]]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-tertiary,#9aa3b2)'
      }
    }, "\u8BD5\u9A8C\u6B21\u6570\u968F\u4EFB\u52A1\u4E0B\u53D1 \xB7 \u4E0D\u53EF\u4FEE\u6539"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto',
        padding: 'var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Section, {
      title: "\u8BBE\u5907\u4FE1\u606F",
      icon: "cpu",
      extra: /*#__PURE__*/React.createElement(CollectBadge, {
        method: method,
        size: "sm"
      })
    }, /*#__PURE__*/React.createElement(Grid, {
      items: [['检测设备', dev.name || '—'], ['设备编号', dev.code || '—'], ['设备型号', dev.model || '—']]
    }), isExternal && /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 'var(--fs-xs)',
        color: 'var(--collect-ble,#0a8a96)',
        display: 'flex',
        alignItems: 'center',
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M12 2v4 M12 18v4 M2 12h4 M18 12h4"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "3"
    })), "\u5916\u90E8\u7A0B\u5E8F\u91C7\u96C6\uFF08\u7535\u5B50\u5929\u5E73\uFF09\xB7 \u6570\u636E\u7531\u5DE5\u4E1A\u5E73\u677F\u4EE3\u91C7\u5199\u5E93")), /*#__PURE__*/React.createElement(Section, {
      title: /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }
      }, "\u73AF\u5883\u4FE1\u606F", /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 999,
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          lineHeight: 1.6,
          color: isGuardEnv ? 'var(--collect-ble,#0a8a96)' : 'var(--collect-auto,#1d54c4)',
          background: isGuardEnv ? 'rgba(10,138,150,0.10)' : 'rgba(29,84,196,0.10)',
          border: '1px solid ' + (isGuardEnv ? 'rgba(10,138,150,0.25)' : 'rgba(29,84,196,0.25)')
        }
      }, isGuardEnv ? /*#__PURE__*/React.createElement("svg", {
        width: "11",
        height: "11",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      })) : /*#__PURE__*/React.createElement("svg", {
        width: "11",
        height: "11",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M5 12.55a11 11 0 0 1 14.08 0 M1.42 9a16 16 0 0 1 21.16 0 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01"
      })), isGuardEnv ? '安全管家' : '独立传感器', /*#__PURE__*/React.createElement("span", {
        style: {
          width: 1,
          height: 11,
          background: 'currentColor',
          opacity: 0.3,
          margin: '0 1px'
        }
      }), isGuardEnv ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 600
        }
      }, envSrc.node), /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 400,
          opacity: 0.75,
          fontFamily: 'var(--font-mono,monospace)'
        }
      }, "(", envSrc.code, ")")) : /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 500,
          fontFamily: 'var(--font-mono,monospace)'
        }
      }, envSrc.model))),
      icon: "thermometer",
      extra: /*#__PURE__*/React.createElement("button", {
        onClick: () => setEnv({
          wd: (20 + Math.random() * 3).toFixed(1),
          sd: (28 + Math.random() * 8).toFixed(1)
        }),
        style: {
          border: 'none',
          background: 'transparent',
          color: 'var(--brand-action)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-sm)'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 3v5h-5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3 21v-5h5"
      })), "\u5237\u65B0")
    }, /*#__PURE__*/React.createElement(Grid, {
      items: [['环境室温', `${env.wd} ℃`], ['环境湿度', `${env.sd} %RH`]]
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '2px 2px -2px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M22 12h-4l-3 9L9 3l-3 9H2"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-lg)',
        fontWeight: 600
      }
    }, "\u8BD5\u9A8C\u6570\u636E"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)'
      }
    }, "\u5171 ", N, " \u6B21")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)'
      }
    }, `已完成 ${times.filter(t => t.status === 'filled').length}/${N}`)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        margin: '0 2px',
        lineHeight: 1.5
      }
    }, methodHint), (method === 'auto' || isExternal) && !allFilled && !flowLocked && /*#__PURE__*/React.createElement(Card, {
      padding: "18px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, busy === 'all' ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--brand-action)'
      }
    }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        marginTop: 10
      }
    }, isExternal ? '正在拉取平板程序已采数据…' : '正在从数据库整批取值…')) : /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        justifyContent: 'center',
        flexWrap: 'wrap'
      }
    }, method === 'auto' && /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      onClick: captureAll
    }, "\u26A1 \u4E00\u952E\u91C7\u96C6\uFF08", N, " \u6B21\uFF09"), isExternal && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      variant: "secondary",
      onClick: pullExternal
    }, "\u67E5\u770B\u5DF2\u91C7\u6570\u636E"))))), /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        minHeight: 300
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 168,
        flex: 'none',
        borderRight: '1px solid var(--divider)',
        background: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)'
      }
    }, times.map((t, i) => {
      const on = i === activeTime;
      const filled = t.status === 'filled';
      const state = t.uploaded ? 'uploaded' : filled ? 'done' : 'pending';
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        onClick: () => setActiveTime(i),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '12px 11px',
          cursor: 'pointer',
          textAlign: 'left',
          border: 'none',
          borderBottom: '1px solid var(--divider)',
          borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
          background: on ? 'var(--white)' : 'transparent'
        }
      }, /*#__PURE__*/React.createElement(TimeStatusIcon, {
        state: state
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-base)',
          fontWeight: on ? 700 : 600,
          color: on ? 'var(--brand-action)' : 'var(--text-title)',
          fontVariantNumeric: 'tabular-nums'
        }
      }, isCable && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: PHASE_C[phaseOf(i)],
          flex: 'none'
        }
      }), isCable ? perPhase > 1 ? `${phaseOf(i)}相 · 第${phaseWithin(i) + 1}次` : `${phaseOf(i)}相` : `第 ${i + 1} 次`), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: state === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : 'var(--text-tertiary,#9aa3b2)',
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap'
        }
      }, (ctx.sample.code || '').replace(/-\d+$/, '') + '-' + String(i + 1).padStart(2, '0'))));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, (() => {
      const i = activeTime;
      const t = times[i] || {
        status: 'idle',
        vals: {}
      };
      const filled = t.status === 'filled';
      const ocrField = method === 'ocr' && ocrReady;
      const locked = ocrField && !editTimes[i]; // 识别结果默认锁定置灰，点「编辑」解锁
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          flexWrap: 'wrap'
        }
      }, method === 'ocr' && ocrReady && !flowLocked && /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          setShootIdx(i);
          setShotPhase('idle');
        },
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--collect-ocr,#b06a00)',
          background: 'var(--collect-ocr-bg,#fff4e6)',
          color: 'var(--collect-ocr,#b06a00)',
          cursor: 'pointer',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "15",
        height: "15",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      })), "\u62CD\u7167\u8BC6\u522B"), method === 'ble' && !filled && !flowLocked && /*#__PURE__*/React.createElement(Button, {
        onClick: () => captureTime(i),
        disabled: busy === i
      }, "\uD83D\uDD35 \u8FDE\u63A5\u91C7\u96C6")), busy === i ? /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: 'center',
          padding: '32px 0',
          color: 'var(--brand-action)'
        }
      }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          marginTop: 10
        }
      }, method === 'ble' ? '正在连接设备…' : '正在识别读数…')) : filled ? /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }
      }, isCable && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("label", {
        style: {
          width: 110,
          flex: 'none',
          fontSize: 'var(--fs-base)',
          color: 'var(--text-body)'
        }
      }, "\u76F8\u522B"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-base)',
          fontWeight: 600,
          color: 'var(--text-title)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: PHASE_C[phaseOf(i)],
          flex: 'none'
        }
      }), phaseOf(i), "\u76F8", perPhase > 1 ? ` · 第${phaseWithin(i) + 1}次` : '')), measureFields.map(f => /*#__PURE__*/React.createElement(FieldRow, {
        key: f.key,
        label: f.label,
        unit: f.unit,
        required: true,
        value: t.vals[f.key] || '',
        readOnly: flowLocked || (ocrField ? locked : !editable),
        onChange: e => setField(i, f.key, e.target.value)
      })), method === 'auto' && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--collect-auto,#1d54c4)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      })), "\u81EA\u52A8\u91C7\u96C6\u6570\u636E\uFF0C\u4E0D\u53EF\u4FEE\u6539"), ocrField && !flowLocked && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
          padding: '8px 10px',
          borderRadius: 'var(--radius-md)',
          background: locked ? 'var(--surface-sunken)' : 'rgba(176,106,0,0.08)',
          border: '1px solid ' + (locked ? 'var(--border-default)' : 'var(--collect-ocr,#b06a00)')
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-xs)',
          lineHeight: 1.5,
          color: locked ? 'var(--text-secondary)' : 'var(--collect-ocr,#b06a00)',
          minWidth: 0
        }
      }, locked ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          flex: 'none'
        }
      }, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "11",
        width: "18",
        height: "11",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 11V7a5 5 0 0 1 10 0v4"
      })), "\u8BC6\u522B\u7ED3\u679C\u5DF2\u9501\u5B9A\uFF0C\u9632\u6B62\u8BEF\u89E6\u6539\u52A8 \xB7 \u5982\u9700\u77EB\u6B63\u8BF7\u70B9\u300C\u7F16\u8F91\u300D") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          flex: 'none'
        }
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 20h9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      })), "\u7F16\u8F91\u4E2D \xB7 \u82E5\u6539\u4E71\u4E86\u53EF\u300C\u91CD\u65B0\u8BC6\u522B\u300D\u7528\u539F\u7167\u7247\u8FD8\u539F")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 8,
          flex: 'none'
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => reRecognize(i),
        disabled: !(attachments[i] || []).length,
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 10px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--border-strong)',
          background: 'var(--white)',
          color: (attachments[i] || []).length ? 'var(--text-body)' : 'var(--text-placeholder)',
          cursor: (attachments[i] || []).length ? 'pointer' : 'not-allowed',
          fontSize: 'var(--fs-xs)',
          fontWeight: 600
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 3v5h-5"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M3 21v-5h5"
      })), "\u91CD\u65B0\u8BC6\u522B"), locked ? /*#__PURE__*/React.createElement("button", {
        onClick: () => setEditTimes(p => ({
          ...p,
          [i]: true
        })),
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 12px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--collect-ocr,#b06a00)',
          background: 'var(--collect-ocr-bg,#fff4e6)',
          color: 'var(--collect-ocr,#b06a00)',
          cursor: 'pointer',
          fontSize: 'var(--fs-xs)',
          fontWeight: 600
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 20h9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      })), "\u7F16\u8F91") : /*#__PURE__*/React.createElement("button", {
        onClick: () => setEditTimes(p => ({
          ...p,
          [i]: false
        })),
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '5px 12px',
          borderRadius: 'var(--radius-pill)',
          border: '1px solid var(--brand-action)',
          background: 'var(--brand-action)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 'var(--fs-xs)',
          fontWeight: 600
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M20 6 9 17l-5-5"
      })), "\u5B8C\u6210"))), isExternal && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)'
        }
      }, "\u53EF\u5728\u6B64\u624B\u8F93\u8865\u5F55\u6216\u77EB\u6B63"), /*#__PURE__*/React.createElement("div", {
        style: {
          paddingTop: 10,
          marginTop: 2,
          borderTop: '1px dashed var(--divider)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 8
        }
      }, method === 'ocr' && ocrReady ? '识别参照图' : '附件图片', " ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-placeholder)'
        }
      }, "\xB7 ", method === 'ocr' && ocrReady ? '仅一张 · 对应本次识别数据来源' : '随数据一起上传归档')), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10
        }
      }, (attachments[i] || []).map(a => /*#__PURE__*/React.createElement("div", {
        key: a.id,
        style: {
          position: 'relative',
          width: 76,
          height: 76,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
          background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "22",
        height: "22",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "var(--text-secondary)",
        strokeWidth: "1.6",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono,monospace)'
        }
      }, a.kind === 'photo' ? '拍照' : '上传'), !flowLocked && /*#__PURE__*/React.createElement("button", {
        onClick: () => removeAttach(i, a.id),
        style: {
          position: 'absolute',
          top: 3,
          right: 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, "\xD7"))), !flowLocked && !(method === 'ocr' && ocrReady && (attachments[i] || []).length >= 1) && /*#__PURE__*/React.createElement("button", {
        onClick: () => {
          if (method === 'ocr' && ocrReady) {
            setShootIdx(i);
            setShotPhase('idle');
          } else {
            addAttach(i, 'upload');
          }
        },
        style: {
          width: 76,
          height: 76,
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-strong)',
          background: 'var(--bg-app)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 5v14M5 12h14"
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10
        }
      }, method === 'ocr' && ocrReady ? '拍照识别' : '拍照/上传')))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          marginTop: 2,
          paddingTop: 12,
          borderTop: '1px dashed var(--divider)'
        }
      }, t.uploaded ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--status-done-fg,#1b8a5a)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      })), "\u672C\u6B21\u5DF2\u4E0A\u4F20") : flowLocked ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "11",
        width: "18",
        height: "11",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 11V7a5 5 0 0 1 10 0v4"
      })), "\u6570\u636E\u5DF2\u9501\u5B9A") : /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => uploadTime(i),
        disabled: busy === 'up' + i
      }, busy === 'up' + i ? '上传中…' : '确认并上传本次'))) : /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }
      }, isCable && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("label", {
        style: {
          width: 110,
          flex: 'none',
          fontSize: 'var(--fs-base)',
          color: 'var(--text-body)'
        }
      }, "\u76F8\u522B"), /*#__PURE__*/React.createElement("span", {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-base)',
          fontWeight: 600,
          color: 'var(--text-title)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: PHASE_C[phaseOf(i)],
          flex: 'none'
        }
      }), phaseOf(i), "\u76F8", perPhase > 1 ? ` · 第${phaseWithin(i) + 1}次` : '')), measureFields.map(f => /*#__PURE__*/React.createElement(FieldRow, {
        key: f.key,
        label: f.label,
        unit: f.unit,
        required: true,
        value: t.vals[f.key] || '',
        placeholder: "\u5F85\u91C7\u96C6",
        readOnly: flowLocked || (ocrField ? locked : !editable),
        onChange: e => setField(i, f.key, e.target.value)
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'flex-start',
          gap: 6,
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          flex: 'none',
          marginTop: 1
        }
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M12 16v-4 M12 8h.01"
      })), /*#__PURE__*/React.createElement("span", null, method === 'ocr' ? ocrReady ? '字段待采集 · 点击右上「拍照识别」拍摄读数屏自动填入' : '该试验项识别规则未通过验证 · 请在上方字段手动输入' : method === 'ble' ? '字段待采集 · 点击右上「连接采集」同步，或直接在上方手动输入' : method === 'auto' ? '字段待采集 · 等待上方「一键采集」整批回填' : isExternal ? '字段待采集 · 等待平板程序数据，或在上方手输补录' : '字段待采集 · 请在上方手动输入'))));
    })()))), summaryFields.length > 0 && /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v18h18"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m19 9-5 5-4-4-3 3"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, "\u7ED3\u8BBA")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, summaryFields.map(f => {
      const isConcl = f.key === 'jl';
      if (isConcl && isCable) {
        // 按相别分组：相同相别的数据（一次或多次）合并判定为一个结论
        const conclPhases = [...new Set(times.map((_, i) => phaseOf(i)))];
        return conclPhases.map(ph => /*#__PURE__*/React.createElement(FieldRow, {
          key: f.key + ph,
          label: `结论（${ph}相）`,
          readOnly: true,
          value: allUploaded ? '合格' : '',
          placeholder: `全部 ${N} 次结果上传后回显`,
          onChange: () => {}
        }));
      }
      return /*#__PURE__*/React.createElement(FieldRow, {
        key: f.key,
        label: f.label,
        unit: f.unit,
        readOnly: true,
        value: isConcl ? allUploaded ? summary.vals[f.key] || '合格' : '' : summary.vals[f.key] || '',
        placeholder: isConcl ? `全部 ${N} 次结果上传后回显` : `完成全部 ${N} 次后计算`,
        onChange: () => {}
      });
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        lineHeight: 1.5
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none',
        marginTop: 1
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 16v-4 M12 8h.01"
    })), /*#__PURE__*/React.createElement("span", null, isCable ? '含相别试验：相同相别的数据合并判定，每个相别回显一个结论；' : '', "\u7ED3\u8BBA\u4E0D\u5728\u672C\u7AEF\u5F55\u5165\uFF0C", N, " \u6B21\u7ED3\u679C\u5168\u90E8\u4E0A\u4F20\u540E\u7531 LIMS \u6309\u8BA1\u7B97\u4E0E\u7ED3\u679C\u5224\u5B9A\u914D\u7F6E\u81EA\u52A8\u56DE\u663E")))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 8
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 12,
        bottom: 88,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '5px 7px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(20,30,55,0.86)',
        boxShadow: 'var(--shadow-lg)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
        padding: '0 4px'
      }
    }, "\u6F14\u793A\xB7\u6D41\u7A0B"), [['normal', '正常'], ['returned', '退回'], ['locked', '锁定']].map(([k, label]) => {
      const cur = demoFlow || (flowLocked ? 'locked' : flowReturned ? 'returned' : 'normal');
      const on = cur === k;
      return /*#__PURE__*/React.createElement("button", {
        key: k,
        onClick: () => setDemoFlow(k),
        style: {
          border: 'none',
          cursor: 'pointer',
          padding: '4px 11px',
          borderRadius: 'var(--radius-pill)',
          fontSize: 11,
          fontWeight: 600,
          background: on ? 'var(--white)' : 'transparent',
          color: on ? 'var(--text-title)' : 'rgba(255,255,255,0.85)'
        }
      }, label);
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        padding: 'var(--gap-page)',
        borderTop: '1px solid var(--border-default)',
        background: 'var(--white)'
      }
    }, !flowLocked && /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      block: true,
      onClick: reset
    }, "\u91CD\u7F6E\u5168\u90E8"), /*#__PURE__*/React.createElement(Button, {
      block: true,
      disabled: flowLocked ? false : (allUploaded ? false : pendingUpload === 0) || phase === 'uploading',
      onClick: flowLocked ? onBack : allUploaded ? onDone : upload
    }, flowLocked ? '返回（数据已锁定）' : phase === 'uploading' ? '上传中…' : allUploaded ? '完成并退出' : N > 1 ? `上传已完成（${pendingUpload}/${N}）` : '上传')), shootIdx !== null && /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        background: '#0b0d10',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        color: '#fff'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setShootIdx(null);
        setShotPhase('idle');
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        border: 'none',
        background: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        fontSize: 'var(--fs-base)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "m15 18-6-6 6-6"
    })), "\u53D6\u6D88"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-lg)',
        fontWeight: 600
      }
    }, "\u62CD\u7167\u8BC6\u522B \xB7 \u7B2C ", shootIdx + 1, " \u6B21"), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 56
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        position: 'relative',
        margin: '0 16px',
        borderRadius: 'var(--radius-lg,16px)',
        overflow: 'hidden',
        background: 'repeating-linear-gradient(135deg,#1a1d22 0 14px,#16191e 14px 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, shotPhase === 'recognizing' ? /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        color: '#8fd0ff'
      }
    }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-base)',
        marginTop: 12
      }
    }, "\u6B63\u5728\u8BC6\u522B\u4EEA\u5668\u8BFB\u6570\u2026")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        inset: '18% 12%',
        border: '2px solid rgba(255,255,255,0.85)',
        borderRadius: 10,
        boxShadow: '0 0 0 100vmax rgba(0,0,0,0.28)'
      }
    }, ['-1px -1px', '-1px auto auto -1px', 'auto -1px -1px auto', 'auto auto -1px -1px'].map((p, k) => /*#__PURE__*/React.createElement("span", {
      key: k,
      style: {
        position: 'absolute',
        width: 22,
        height: 22,
        border: '3px solid var(--brand-action)',
        ...(k === 0 ? {
          top: -1,
          left: -1,
          borderRight: 'none',
          borderBottom: 'none'
        } : k === 1 ? {
          top: -1,
          right: -1,
          borderLeft: 'none',
          borderBottom: 'none'
        } : k === 2 ? {
          bottom: -1,
          left: -1,
          borderRight: 'none',
          borderTop: 'none'
        } : {
          bottom: -1,
          right: -1,
          borderLeft: 'none',
          borderTop: 'none'
        })
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'rgba(255,255,255,0.8)',
        fontSize: 'var(--fs-sm)',
        fontFamily: 'var(--font-mono,monospace)'
      }
    }, "\u5C06\u300C", dev.name || '仪器', "\u300D\u8BFB\u6570\u5C4F\u5BF9\u51C6\u53D6\u666F\u6846"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '22px 24px 30px'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: doShoot,
      disabled: shotPhase === 'recognizing',
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        background: 'transparent',
        color: '#fff',
        cursor: 'pointer',
        opacity: shotPhase === 'recognizing' ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "26",
      height: "26",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "3",
      width: "18",
      height: "18",
      rx: "2"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "9",
      cy: "9",
      r: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-sm)'
      }
    }, "\u4ECE\u76F8\u518C\u9009\u62E9")), /*#__PURE__*/React.createElement("button", {
      onClick: doShoot,
      disabled: shotPhase === 'recognizing',
      style: {
        width: 72,
        height: 72,
        borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.9)',
        background: 'var(--brand-action)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: shotPhase === 'recognizing' ? 0.4 : 1
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "30",
      height: "30",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "13",
      r: "3"
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 56
      }
    }))));
  }
  function TimeStatusIcon({
    state
  }) {
    if (state === 'uploaded') {
      return /*#__PURE__*/React.createElement("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "var(--status-done-fg,#1b8a5a)",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          flex: 'none'
        }
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      }));
    }
    // 未检测（含已录入待上传）：黄色感叹号
    return /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--status-pending,#e8a93a)",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 8v4 M12 16h.01"
    }));
  }
  function Section({
    title,
    icon,
    extra,
    children
  }) {
    const paths = {
      info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3',
      thermometer: 'M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z'
    };
    return /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: paths[icon]
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, title)), extra), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16
      }
    }, children));
  }
  function Grid({
    items
  }) {
    const [tip, setTip] = React.useState(null);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px 16px'
      }
    }, items.map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'relative',
        display: 'flex',
        gap: 8,
        fontSize: 'var(--fs-base)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        flex: 'none'
      }
    }, k), /*#__PURE__*/React.createElement("span", {
      title: v,
      onClick: e => {
        const el = e.currentTarget;
        if (el.scrollWidth > el.clientWidth + 1) setTip(t => t === i ? null : i);
      },
      style: {
        color: 'var(--text-title)',
        fontWeight: 500,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        cursor: 'pointer'
      }
    }, v), tip === i && /*#__PURE__*/React.createElement("div", {
      onClick: () => setTip(null),
      style: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        zIndex: 50,
        maxWidth: 260,
        padding: '8px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--text-title)',
        color: 'var(--white)',
        fontSize: 'var(--fs-sm)',
        lineHeight: 1.5,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
        cursor: 'pointer'
      }
    }, v))));
  }
  function PhaseSelect({
    value,
    onChange,
    readOnly
  }) {
    const [open, setOpen] = React.useState(false);
    const opts = [{
      v: '红',
      c: 'var(--danger,#e23b3b)'
    }, {
      v: '黄',
      c: 'var(--status-pending,#e8a93a)'
    }, {
      v: '绿',
      c: 'var(--status-done,#1faa54)'
    }];
    const cur = opts.find(o => o.v === value);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        width: 110,
        flex: 'none',
        fontSize: 'var(--fs-base)',
        color: 'var(--text-body)',
        display: 'flex',
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--danger)'
      }
    }, "*"), "\u76F8\u522B"), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => !readOnly && setOpen(o => !o),
      style: {
        width: '100%',
        height: 44,
        padding: '0 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid ' + (open ? 'var(--border-focus)' : 'var(--border-default)'),
        boxShadow: open ? 'var(--shadow-focus)' : 'none',
        background: readOnly ? 'var(--surface-sunken)' : 'var(--white)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: readOnly ? 'default' : 'pointer',
        font: 'var(--font-sans)',
        fontSize: 'var(--fs-base)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: cur ? 'var(--text-title)' : 'var(--text-placeholder)'
      }
    }, cur && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: cur.c,
        flex: 'none'
      }
    }), cur ? cur.v : '请选择相别'), !readOnly && /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--text-secondary)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        transition: 'transform var(--dur-fast)',
        transform: open ? 'rotate(180deg)' : 'none'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "m6 9 6 6 6-6"
    }))), open && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      onClick: () => setOpen(false),
      style: {
        position: 'fixed',
        inset: 0,
        zIndex: 29
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        zIndex: 30,
        background: 'var(--white)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }
    }, opts.map((o, k) => /*#__PURE__*/React.createElement("button", {
      key: o.v,
      onClick: () => {
        onChange(o.v);
        setOpen(false);
      },
      style: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '11px 12px',
        border: 'none',
        borderTop: k ? '1px solid var(--divider)' : 'none',
        background: value === o.v ? 'var(--surface-selected)' : 'transparent',
        cursor: 'pointer',
        fontSize: 'var(--fs-base)',
        color: 'var(--text-title)',
        fontWeight: value === o.v ? 600 : 400
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: o.c,
        flex: 'none'
      }
    }), o.v))))));
  }
  function FlowBanner({
    flow,
    locked,
    returned
  }) {
    if (!locked && !returned) return null;
    if (locked) {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          gap: 10,
          padding: '12px 14px',
          marginBottom: 14,
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-sunken)',
          border: '1px solid var(--border-strong)'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "var(--text-secondary)",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          flex: 'none',
          marginTop: 1
        }
      }, /*#__PURE__*/React.createElement("rect", {
        x: "3",
        y: "11",
        width: "18",
        height: "11",
        rx: "2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 11V7a5 5 0 0 1 10 0v4"
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          color: 'var(--text-title)'
        }
      }, "\u6570\u636E\u5DF2\u9501\u5B9A", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-xs)',
          fontWeight: 600,
          padding: '1px 8px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--gray-200,#e5e8ee)',
          color: 'var(--text-secondary)'
        }
      }, "\u5F53\u524D\u6D41\u7A0B\uFF1A", flow.node)), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          marginTop: 4,
          lineHeight: 1.55
        }
      }, "\u6D41\u7A0B\u5DF2\u6D41\u8F6C\u81F3\u300C", flow.node, "\u300D\u8282\u70B9\uFF0C\u68C0\u6D4B\u5458\u4E0D\u53EF\u4FEE\u6539\u6570\u636E\u3002\u5982\u9700\u4FEE\u6539\uFF0C\u8BF7\u8054\u7CFB\u5BA1\u6838\u4EBA\u5C06\u6D41\u7A0B\u9000\u56DE\u81F3\u300C\u8BD5\u9A8C\u68C0\u6D4B\u300D\u8282\u70B9\u3002")));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        marginBottom: 14,
        borderRadius: 'var(--radius-md)',
        background: 'rgba(232,169,58,0.10)',
        border: '1px solid var(--status-pending,#e8a93a)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--status-pending,#e8a93a)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none',
        marginTop: 1
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9 14 4 9l5-5"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M4 9h11a4 4 0 0 1 0 8h-1"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        fontWeight: 600,
        color: 'var(--status-pending-fg,#97640f)'
      }
    }, "\u5DF2\u9000\u56DE\u81F3\u300C\u8BD5\u9A8C\u68C0\u6D4B\u300D\xB7 \u53EF\u4FEE\u6539\u540E\u91CD\u65B0\u4E0A\u4F20"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-body)',
        marginTop: 4,
        lineHeight: 1.55
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, "\u9000\u56DE\u539F\u56E0\uFF1A"), flow.returnReason || '—'), (flow.by || flow.at || flow.returnedFrom) && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        marginTop: 3
      }
    }, "\u9000\u56DE\u4EBA\uFF1A", flow.by, flow.role ? '（' + flow.role + '）' : '', flow.at ? ' · ' + flow.at : '', flow.returnedFrom ? ' · 来自「' + flow.returnedFrom + '」' : '')));
  }
  function Spinner() {
    return /*#__PURE__*/React.createElement("svg", {
      width: "32",
      height: "32",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      style: {
        animation: 'lk-spin 0.9s linear infinite'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M21 12a9 9 0 1 1-6.219-8.56"
    }));
  }
  window.Collect = Collect;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Collect.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/CollectStructured.jsx
try { (() => {
/* 采集详情（L4·结构尺寸检查—导体&绝缘厚度&金属屏蔽）
   —— 一个试验项含多个「试验子项」，每个子项关联一台设备、一种采集方式。
   · 设备信息区域：在该试验项关联的多台设备间切换；切换设备＝切换子项，下方录入区按采集方式变换样式。
   · 试验数据：仅展示「测量值」；按相别（红/黄/绿）逐相录入，部分字段（如绝缘各测量点厚度）需多次测量→多个输入框。
   · 结论：按相别分组，相同相别合并判定为 1 个结论，三个相别 → 3 个结论；无相别子项仅 1 个结论。
   · 采集方式：auto=设备直连（整批写库·只读·无附件图片）；ble=蓝牙数显卡尺（逐相连接·可手输·可附图）；manual=台式测厚仪（手工录入）。 */
(function () {
  const DS = window.DesignSystem_52fd11;
  const {
    AppBar,
    FieldRow,
    Button,
    CollectBadge,
    Card,
    SegmentedSwitch
  } = DS;
  const Input = DS.Input;
  const PHASES = [{
    v: '红',
    c: 'var(--danger,#e23b3b)'
  }, {
    v: '黄',
    c: 'var(--status-pending,#e8a93a)'
  }, {
    v: '绿',
    c: 'var(--status-done,#1faa54)'
  }];

  // 测量值示例生成（read-only/示例填充用）
  const FIXED = {
    jg: '紧压绞合圆形'
  };
  const BASE = {
    gs: 8,
    zj: 8.00,
    tdhd: 10.00,
    tk1: 13,
    dg1: 14,
    tk2: 15,
    dg2: 14,
    tk3: 13,
    dg3: 14,
    tk4: 15,
    dg4: 14,
    tk5: 13,
    dg5: 14
  };
  const DEC = {
    gs: 0,
    zj: 2,
    tdhd: 2,
    tk1: 1,
    dg1: 1,
    tk2: 1,
    dg2: 1,
    tk3: 1,
    dg3: 1,
    tk4: 1,
    dg4: 1,
    tk5: 1,
    dg5: 1
  };
  function genVal(field, pi) {
    if (FIXED[field.key]) return FIXED[field.key];
    if (field.multi) return Array.from({
      length: field.multi
    }, (_, k) => (12 + k + pi * 0.2).toFixed(1));
    const b = BASE[field.key];
    if (b == null) return '';
    const jit = b * 0.01 * ((pi * 3 + field.key.length) % 5 - 2) / 2;
    return (b + jit).toFixed(DEC[field.key] ?? 2);
  }
  function CollectStructured({
    ctx,
    onBack,
    onDone
  }) {
    const subs = ctx.item.subs;
    const N = subs[0].phased ? PHASES.length : 1; // 每个子项的相别数 = 试验次数
    const subConcl = ['合格', '不合格', '合格']; // 各子项相别结论（示例，对应附件图：绝缘厚度不合格）

    const [activeSub, setActiveSub] = React.useState(0);
    const [activeDevice, setActiveDevice] = React.useState(0);
    const [activePhase, setActivePhase] = React.useState(0);
    const blank = () => subs.map(() => Array.from({
      length: N
    }, () => ({
      filled: false,
      uploaded: false,
      vals: {}
    })));
    const [cells, setCells] = React.useState(blank);
    const [busy, setBusy] = React.useState(null); // 'all' | 'c-si-pi' | 'up-si-pi'
    const [attach, setAttach] = React.useState({}); // { 'si-pi': [{id}] }
    const [env] = React.useState({
      wd: '21.0',
      sd: '30.7'
    });
    const sub = subs[activeSub];
    // 设备与试验子项解除绑定：设备决定采集方式/录入样式，子项决定展示哪些测量值字段
    const devices = [];
    subs.forEach(s => {
      if (s.device && !devices.some(d => d.code === s.device.code)) devices.push({
        ...s.device,
        method: s.method
      });
    });
    const dev = devices[activeDevice] || {};
    const method = dev.method || 'auto';
    const phased = !!sub.phased;
    const editable = method !== 'auto';
    function fillCell(si, pi) {
      const v = {};
      subs[si].fields.forEach(f => {
        v[f.key] = genVal(f, pi);
      });
      setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => b !== pi ? c : {
        ...c,
        filled: true,
        vals: v
      })));
    }
    function setField(si, pi, key, value, idx) {
      setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => {
        if (b !== pi) return c;
        let nv;
        if (idx != null) {
          const arr = Array.isArray(c.vals[key]) ? c.vals[key].slice() : [];
          arr[idx] = value;
          nv = arr;
        } else nv = value;
        return {
          ...c,
          filled: true,
          vals: {
            ...c.vals,
            [key]: nv
          }
        };
      })));
    }
    function captureAll(si) {
      setBusy('all');
      setTimeout(() => {
        const v = pi => {
          const o = {};
          subs[si].fields.forEach(f => {
            o[f.key] = genVal(f, pi);
          });
          return o;
        };
        setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => ({
          ...c,
          filled: true,
          vals: v(b)
        }))));
        setBusy(null);
      }, 1000);
    }
    function connectCell(si, pi) {
      setBusy('c-' + si + '-' + pi);
      setTimeout(() => {
        fillCell(si, pi);
        setBusy(null);
      }, 1100);
    }
    function uploadCell(si, pi) {
      setBusy('up-' + si + '-' + pi);
      setTimeout(() => {
        setCells(prev => prev.map((s, a) => a !== si ? s : s.map((c, b) => b !== pi ? c : {
          ...c,
          uploaded: true
        })));
        setBusy(null);
      }, 800);
    }
    function uploadAll() {
      setBusy('all');
      setTimeout(() => {
        setCells(prev => prev.map(s => s.map(c => c.filled ? {
          ...c,
          uploaded: true
        } : c)));
        setBusy(null);
      }, 1100);
    }
    function reset() {
      setCells(blank());
      setAttach({});
    }
    function addAttach(si, pi) {
      setAttach(p => ({
        ...p,
        [si + '-' + pi]: [...(p[si + '-' + pi] || []), {
          id: Date.now() + Math.random()
        }]
      }));
    }
    function removeAttach(si, pi, id) {
      setAttach(p => ({
        ...p,
        [si + '-' + pi]: (p[si + '-' + pi] || []).filter(a => a.id !== id)
      }));
    }
    const flat = cells.flat();
    const totalCells = flat.length;
    const uploadedCount = flat.filter(c => c.uploaded).length;
    const filledCount = flat.filter(c => c.filled).length;
    const pendingUpload = flat.filter(c => c.filled && !c.uploaded).length;
    const allUploaded = totalCells > 0 && uploadedCount === totalCells;
    const inspectState = allUploaded ? 'done' : uploadedCount > 0 ? 'doing' : 'todo';
    const methodHint = {
      auto: '设备直连 · 上位机算毕整批写库，点下方「一键采集」整批回填，不可手输',
      ble: '蓝牙数显卡尺 · 逐相连接同步读数，也可手动输入；可附识别参照图',
      manual: '台式测厚仪为单机设备 · 无通讯接口，读数由检测员手工录入'
    }[method];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)',
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement(AppBar, {
      title: "\u68C0\u6D4B\u4EFB\u52A1",
      onBack: onBack
    }), /*#__PURE__*/React.createElement(Stamp, {
      state: inspectState
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        paddingBottom: 0
      }
    }, /*#__PURE__*/React.createElement(Section, {
      title: "\u57FA\u7840\u4FE1\u606F",
      icon: "info"
    }, /*#__PURE__*/React.createElement(Grid, {
      items: [['样品编号', ctx.sample.code], ['样品名称', ctx.sample.name], ['试验名称', ctx.item.name], ['试验次数', `${N} 次`]]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-tertiary,#9aa3b2)'
      }
    }, "\u542B ", subs.length, " \u4E2A\u8BD5\u9A8C\u5B50\u9879 \xB7 \u8BD5\u9A8C\u6B21\u6570\u968F\u4EFB\u52A1\u4E0B\u53D1\uFF0C\u4E0D\u53EF\u4FEE\u6539"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto',
        padding: 'var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Section, {
      title: "\u8BBE\u5907\u4FE1\u606F",
      icon: "cpu",
      extra: /*#__PURE__*/React.createElement(CollectBadge, {
        method: method,
        size: "sm"
      })
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
        flexWrap: 'wrap'
      }
    }, devices.map((d, i) => {
      const on = i === activeDevice;
      return /*#__PURE__*/React.createElement("button", {
        key: i,
        onClick: () => setActiveDevice(i),
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 'var(--radius-pill)',
          cursor: 'pointer',
          border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
          background: on ? 'var(--surface-selected)' : 'var(--white)',
          color: on ? 'var(--brand-action)' : 'var(--text-body)',
          fontSize: 'var(--fs-sm)',
          fontWeight: on ? 600 : 400
        }
      }, /*#__PURE__*/React.createElement(CollectDot, {
        method: d.method,
        on: on
      }), d.name);
    })), /*#__PURE__*/React.createElement(Grid, {
      items: [['检测设备', dev.name || '—'], ['设备编号', dev.code || '—'], ['设备型号', dev.model || '—']]
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 10,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        lineHeight: 1.5
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M8 3H5a2 2 0 0 0-2 2v3 M21 8V5a2 2 0 0 0-2-2h-3 M3 16v3a2 2 0 0 0 2 2h3 M16 21h3a2 2 0 0 0 2-2v-3"
    })), "\u8BE5\u8BD5\u9A8C\u9879\u5173\u8054 ", devices.length, " \u53F0\u8BBE\u5907\uFF0C\u8BBE\u5907\u4E0E\u8BD5\u9A8C\u5B50\u9879\u76F8\u4E92\u72EC\u7ACB\uFF1A\u5207\u8BBE\u5907\u6539\u91C7\u96C6\u65B9\u5F0F/\u5F55\u5165\u6837\u5F0F\uFF0C\u5207\u5B50\u9879\u6539\u6D4B\u91CF\u503C\u5B57\u6BB5")), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-lg)',
        fontWeight: 600
      }
    }, "\u8BD5\u9A8C\u5B50\u9879")), /*#__PURE__*/React.createElement(SegmentedSwitch, {
      value: String(activeSub),
      onChange: v => {
        setActiveSub(+v);
        setActivePhase(0);
      },
      options: subs.map((s, i) => ({
        value: String(i),
        label: s.name
      }))
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        margin: '0 2px',
        lineHeight: 1.5
      }
    }, methodHint), method === 'auto' && cells[activeSub].some(c => !c.filled) && /*#__PURE__*/React.createElement(Card, {
      padding: "18px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center'
      }
    }, busy === 'all' ? /*#__PURE__*/React.createElement("div", {
      style: {
        color: 'var(--brand-action)'
      }
    }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        marginTop: 10
      }
    }, "\u6B63\u5728\u4ECE\u6570\u636E\u5E93\u6574\u6279\u53D6\u503C\u2026")) : /*#__PURE__*/React.createElement(Button, {
      size: "lg",
      onClick: () => captureAll(activeSub)
    }, "\u26A1 \u4E00\u952E\u91C7\u96C6\uFF08", N, " \u4E2A\u76F8\u522B\uFF09"))), /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        minHeight: 280
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 132,
        flex: 'none',
        borderRight: '1px solid var(--divider)',
        background: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        borderRadius: 'var(--radius-md) 0 0 var(--radius-md)'
      }
    }, Array.from({
      length: N
    }, (_, pi) => {
      const on = pi === activePhase;
      const c = cells[activeSub][pi];
      const state = c.uploaded ? 'uploaded' : c.filled ? 'done' : 'pending';
      const ph = PHASES[pi % 3];
      return /*#__PURE__*/React.createElement("button", {
        key: pi,
        onClick: () => setActivePhase(pi),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '13px 11px',
          cursor: 'pointer',
          textAlign: 'left',
          border: 'none',
          borderBottom: '1px solid var(--divider)',
          borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
          background: on ? 'var(--white)' : 'transparent'
        }
      }, /*#__PURE__*/React.createElement(TimeStatusIcon, {
        state: state
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 'var(--fs-base)',
          fontWeight: on ? 700 : 600,
          color: on ? 'var(--brand-action)' : 'var(--text-title)'
        }
      }, phased && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: ph.c,
          flex: 'none'
        }
      }), phased ? ph.v + '相' : '第 1 次'), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: state === 'uploaded' ? 'var(--status-done-fg,#1b8a5a)' : 'var(--text-tertiary,#9aa3b2)',
          whiteSpace: 'nowrap'
        }
      }, state === 'uploaded' ? '已上传' : c.filled ? '待上传' : '待采集')));
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, (() => {
      const pi = activePhase;
      const c = cells[activeSub][pi];
      const busyCell = busy === 'c-' + activeSub + '-' + pi;
      const akey = activeSub + '-' + pi;
      return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)'
        }
      }, "\u6D4B\u91CF\u503C", phased ? ` · ${PHASES[pi % 3].v}相` : ''), method === 'ble' && !c.filled && /*#__PURE__*/React.createElement(Button, {
        onClick: () => connectCell(activeSub, pi),
        disabled: busyCell
      }, "\uD83D\uDD35 \u8FDE\u63A5\u91C7\u96C6"), method === 'manual' && !c.filled && /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => fillCell(activeSub, pi)
      }, "\u5F55\u5165\u672C\u76F8\u8BFB\u6570")), busyCell ? /*#__PURE__*/React.createElement("div", {
        style: {
          textAlign: 'center',
          padding: '32px 0',
          color: 'var(--brand-action)'
        }
      }, /*#__PURE__*/React.createElement(Spinner, null), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          marginTop: 10
        }
      }, "\u6B63\u5728\u8FDE\u63A5\u8BBE\u5907\u2026")) : /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }
      }, sub.fields.map(f => f.multi ? /*#__PURE__*/React.createElement(MultiField, {
        key: f.key,
        field: f,
        values: c.vals[f.key],
        readOnly: !editable,
        onChange: (idx, val) => setField(activeSub, pi, f.key, val, idx)
      }) : /*#__PURE__*/React.createElement(FieldRow, {
        key: f.key,
        label: f.label,
        unit: f.unit,
        required: true,
        value: c.vals[f.key] || '',
        placeholder: c.filled ? '' : '待采集',
        readOnly: !editable,
        onChange: e => setField(activeSub, pi, f.key, e.target.value)
      })), method === 'auto' && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--collect-auto,#1d54c4)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      })), "\u8BBE\u5907\u76F4\u91C7\u6570\u636E\uFF0C\u4E0D\u53EF\u4FEE\u6539 \xB7 \u65E0\u9700\u9644\u4EF6\u56FE\u7247"), method === 'manual' && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--collect-manual,#828c9c)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "13",
        height: "13",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 20h9"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
      })), "\u53F0\u5F0F\u6D4B\u539A\u4EEA\u65E0\u901A\u8BAF\u63A5\u53E3 \xB7 \u8BFB\u6570\u624B\u5DE5\u5F55\u5165"), method === 'ble' && c.filled && /*#__PURE__*/React.createElement("div", {
        style: {
          paddingTop: 10,
          borderTop: '1px dashed var(--divider)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 8
        }
      }, "\u8BC6\u522B\u53C2\u7167\u56FE ", /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-placeholder)'
        }
      }, "\xB7 \u968F\u6570\u636E\u4E00\u8D77\u4E0A\u4F20\u5F52\u6863")), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10
        }
      }, (attach[akey] || []).map(a => /*#__PURE__*/React.createElement("div", {
        key: a.id,
        style: {
          position: 'relative',
          width: 76,
          height: 76,
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
          background: 'repeating-linear-gradient(135deg,#eef1f5 0 8px,#e6eaef 8px 16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "22",
        height: "22",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "var(--text-secondary)",
        strokeWidth: "1.6",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "13",
        r: "3"
      })), /*#__PURE__*/React.createElement("button", {
        onClick: () => removeAttach(activeSub, pi, a.id),
        style: {
          position: 'absolute',
          top: 3,
          right: 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: 'none',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 12,
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, "\xD7"))), /*#__PURE__*/React.createElement("button", {
        onClick: () => addAttach(activeSub, pi),
        style: {
          width: 76,
          height: 76,
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--border-strong)',
          background: 'var(--bg-app)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M12 5v14M5 12h14"
      })), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 10
        }
      }, "\u62CD\u7167/\u4E0A\u4F20")))), c.filled && /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          marginTop: 2,
          paddingTop: 12,
          borderTop: '1px dashed var(--divider)'
        }
      }, c.uploaded ? /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--status-done-fg,#1b8a5a)',
          display: 'flex',
          alignItems: 'center',
          gap: 5
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "12",
        r: "10"
      }), /*#__PURE__*/React.createElement("path", {
        d: "m9 12 2 2 4-4"
      })), "\u672C\u76F8\u5DF2\u4E0A\u4F20") : /*#__PURE__*/React.createElement(Button, {
        variant: "secondary",
        onClick: () => uploadCell(activeSub, pi),
        disabled: busy === 'up-' + activeSub + '-' + pi
      }, busy === 'up-' + activeSub + '-' + pi ? '上传中…' : '确认并上传本相'))));
    })()))), /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M3 3v18h18"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m19 9-5 5-4-4-3 3"
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, "\u7ED3\u8BBA"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)'
      }
    }, sub.name, " \xB7 ", phased ? `按相别分组（${N} 个）` : '单结论')), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }
    }, Array.from({
      length: phased ? N : 1
    }, (_, pi) => {
      const ph = PHASES[pi % 3];
      const c = cells[activeSub][pi];
      const ok = subConcl[activeSub] === '合格';
      const show = c && c.uploaded;
      return /*#__PURE__*/React.createElement("div", {
        key: pi,
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 14
        }
      }, /*#__PURE__*/React.createElement("label", {
        style: {
          width: 110,
          flex: 'none',
          fontSize: 'var(--fs-base)',
          color: 'var(--text-body)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }
      }, phased && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: ph.c,
          flex: 'none'
        }
      }), phased ? `结论（${ph.v}相）` : '结论'), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          height: 44,
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
          background: 'var(--surface-sunken,#f5f6f8)',
          fontSize: 'var(--fs-base)',
          color: show ? ok ? 'var(--status-done-fg,#1b8a5a)' : 'var(--danger,#e23b3b)' : 'var(--text-placeholder)',
          fontWeight: show ? 600 : 400
        }
      }, show ? subConcl[activeSub] : '本相上传后回显'));
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        lineHeight: 1.5
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "13",
      height: "13",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none',
        marginTop: 1
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 16v-4 M12 8h.01"
    })), /*#__PURE__*/React.createElement("span", null, phased ? '相同相别的测量数据（一次或多次）合并判定为一个结论；' : '', "\u7ED3\u8BBA\u4E0D\u5728\u672C\u7AEF\u5F55\u5165\uFF0C\u7531 LIMS \u6309\u8BA1\u7B97\u4E0E\u7ED3\u679C\u5224\u5B9A\u914D\u7F6E\u81EA\u52A8\u56DE\u663E")))), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 8
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12,
        padding: 'var(--gap-page)',
        borderTop: '1px solid var(--border-default)',
        background: 'var(--white)'
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      block: true,
      onClick: reset
    }, "\u91CD\u7F6E\u5168\u90E8"), /*#__PURE__*/React.createElement(Button, {
      block: true,
      disabled: allUploaded ? false : pendingUpload === 0 || busy === 'all',
      onClick: allUploaded ? onDone : uploadAll
    }, busy === 'all' ? '上传中…' : allUploaded ? '完成并退出' : `上传全部（${pendingUpload}/${totalCells}）`)));
  }

  // 多次测量字段：多个输入框（如「绝缘各测量点厚度」）
  function MultiField({
    field,
    values,
    readOnly,
    onChange
  }) {
    const arr = Array.isArray(values) ? values : [];
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        width: 110,
        flex: 'none',
        fontSize: 'var(--fs-base)',
        color: 'var(--text-body)',
        display: 'flex',
        gap: 2,
        paddingTop: 11
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--danger)'
      }
    }, "*"), /*#__PURE__*/React.createElement("span", null, field.label, field.unit ? `（${field.unit}）` : '')), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8
      }
    }, Array.from({
      length: field.multi
    }, (_, k) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        position: 'relative'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 9,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 10,
        color: 'var(--text-placeholder)',
        pointerEvents: 'none'
      }
    }, k + 1), /*#__PURE__*/React.createElement("input", {
      value: arr[k] || '',
      readOnly: readOnly,
      onChange: e => onChange(k, e.target.value),
      placeholder: "\u2014",
      style: {
        width: '100%',
        height: 40,
        padding: '0 8px 0 22px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: readOnly ? 'var(--surface-sunken,#f5f6f8)' : 'var(--white)',
        fontSize: 'var(--fs-sm)',
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-title)',
        textAlign: 'center',
        outline: 'none',
        boxSizing: 'border-box'
      }
    })))));
  }
  function CollectDot({
    method,
    on
  }) {
    const col = {
      auto: 'var(--collect-auto)',
      ble: 'var(--collect-ble)',
      manual: 'var(--collect-manual)',
      ocr: 'var(--collect-ocr)'
    }[method] || 'var(--collect-auto)';
    return /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: col,
        flex: 'none',
        opacity: on ? 1 : 0.7
      }
    });
  }
  function TimeStatusIcon({
    state
  }) {
    if (state === 'uploaded') return /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--status-done-fg,#1b8a5a)",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m9 12 2 2 4-4"
    }));
    return /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--status-pending,#e8a93a)",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 8v4 M12 16h.01"
    }));
  }
  function Section({
    title,
    icon,
    extra,
    children
  }) {
    const paths = {
      info: 'M12 16v-4 M12 8h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
      cpu: 'M4 4h16v16H4z M9 9h6v6H9z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 14h3 M1 9h3 M1 14h3'
    };
    return /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--brand-action)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: paths[icon]
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, title)), extra), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 16
      }
    }, children));
  }
  function Grid({
    items
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px 16px'
      }
    }, items.map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: 'flex',
        gap: 8,
        fontSize: 'var(--fs-base)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        flex: 'none'
      }
    }, k), /*#__PURE__*/React.createElement("span", {
      title: v,
      style: {
        color: 'var(--text-title)',
        fontWeight: 500,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums'
      }
    }, v))));
  }
  function Stamp({
    state
  }) {
    const C = {
      todo: {
        label: '未检测',
        color: '#E8A93A',
        fill: 'rgba(245,196,99,0.14)'
      },
      doing: {
        label: '检测中',
        color: '#5B95E8',
        fill: 'rgba(127,176,242,0.16)'
      },
      done: {
        label: '已检测',
        color: '#4FB97E',
        fill: 'rgba(134,214,166,0.16)'
      }
    }[state];
    const cx = 110,
      cy = 110,
      R = 100;
    const stars = Array.from({
      length: 30
    }, (_, i) => {
      const a = i / 30 * Math.PI * 2 - Math.PI / 2;
      const r = R - 9;
      return /*#__PURE__*/React.createElement("circle", {
        key: i,
        cx: cx + Math.cos(a) * r,
        cy: cy + Math.sin(a) * r,
        r: i % 2 ? 2.2 : 3.4,
        fill: C.color
      });
    });
    return /*#__PURE__*/React.createElement("div", {
      "aria-label": C.label,
      style: {
        position: 'absolute',
        top: 46,
        right: 8,
        width: 120,
        height: 120,
        zIndex: 6,
        pointerEvents: 'none',
        opacity: 0.9,
        transform: 'rotate(-15deg)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: "0 0 220 220",
      width: "120",
      height: "120"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: R,
      fill: C.fill,
      stroke: C.color,
      strokeWidth: "6"
    }), /*#__PURE__*/React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: R - 13,
      fill: "none",
      stroke: C.color,
      strokeWidth: "2.5"
    }), stars, /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy + 6,
      textAnchor: "middle",
      dominantBaseline: "middle",
      transform: `rotate(-8 ${cx} ${cy})`,
      fill: C.color,
      fontSize: "60",
      fontWeight: "900",
      letterSpacing: "1",
      style: {
        fontFamily: 'var(--font-sans, sans-serif)'
      }
    }, C.label)));
  }
  function Spinner() {
    return /*#__PURE__*/React.createElement("svg", {
      width: "32",
      height: "32",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.5",
      strokeLinecap: "round",
      style: {
        animation: 'lk-spin 0.9s linear infinite'
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M21 12a9 9 0 1 1-6.219-8.56"
    }));
  }
  window.CollectStructured = CollectStructured;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/CollectStructured.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DoneTasks.jsx
try { (() => {
/* 已检任务（首页「已检任务」入口）—— 已完成检测的委托任务列表
   方案：移动端不长期堆叠历史，默认展示「近 30 天」内本检测员完成的任务；
   可切换 近7天 / 近30天 / 近90天 / 本年；更早数据引导至 Web 端按条件查询。
   「已检任务」= 该任务下分配给本检测员的样品及试验项已全部完成检测。
   每条展示：任务编号 · 样品名称 · 委托方 · 完成时间 · 样品数/试验项数。 */
(function () {
  const {
    AppBar,
    Card
  } = window.DesignSystem_52fd11;
  const M = window.MOCK;
  const NOW = new Date('2026-06-26T18:00:00');
  function parse(s) {
    return new Date((s || '').replace(' ', 'T'));
  }
  function daysAgo(n) {
    const d = new Date(NOW);
    d.setDate(d.getDate() - n);
    return d;
  }
  const RANGES = [{
    value: '7',
    label: '近7天',
    from: () => daysAgo(7)
  }, {
    value: '30',
    label: '近30天',
    from: () => daysAgo(30)
  }, {
    value: '90',
    label: '近90天',
    from: () => daysAgo(90)
  }, {
    value: 'year',
    label: '本年',
    from: () => new Date('2026-01-01T00:00:00')
  }];
  function DoneTasks({
    onBack
  }) {
    const [range, setRange] = React.useState('30');
    const all = M.tasks.filter(t => t.status === 'done' && t.doneAt).slice().sort((a, b) => parse(b.doneAt) - parse(a.doneAt));
    const cfg = RANGES.find(r => r.value === range);
    const from = cfg.from();
    const list = all.filter(t => parse(t.doneAt) >= from);
    const earlier = all.length - list.length;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)'
      }
    }, /*#__PURE__*/React.createElement(AppBar, {
      title: "\u5DF2\u68C0\u4EFB\u52A1",
      onBack: onBack
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        paddingBottom: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 8
      }
    }, RANGES.map(r => {
      const on = r.value === range;
      return /*#__PURE__*/React.createElement("button", {
        key: r.value,
        onClick: () => setRange(r.value),
        style: {
          flex: 1,
          padding: '9px 0',
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          fontSize: 'var(--fs-sm)',
          fontWeight: on ? 600 : 400,
          border: '1px solid ' + (on ? 'var(--brand-action)' : 'var(--border-default)'),
          background: on ? 'var(--surface-selected)' : 'var(--white)',
          color: on ? 'var(--brand-action)' : 'var(--text-body)'
        }
      }, r.label);
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement("span", null, from.toISOString().slice(0, 10), " \u81F3 ", NOW.toISOString().slice(0, 10)), /*#__PURE__*/React.createElement("span", null, "\u5171 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--brand-action)',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums'
      }
    }, list.length), " \u4E2A\u5DF2\u68C0\u4EFB\u52A1"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflow: 'auto',
        padding: '0 var(--gap-page) var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-list)'
      }
    }, list.map(t => /*#__PURE__*/React.createElement(DoneCard, {
      key: t.code,
      t: t
    })), list.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: '48px 20px',
        textAlign: 'center',
        color: 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "40",
      height: "40",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--text-placeholder)",
      strokeWidth: "1.6",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("path", {
      d: "M22 11.08V12a10 10 0 1 1-5.93-9.14"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m9 11 3 3L22 4"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-base)'
      }
    }, "\u8BE5\u65F6\u95F4\u8303\u56F4\u5185\u6682\u65E0\u5DF2\u68C0\u4EFB\u52A1")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 6,
        padding: '14px 16px',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-strong)',
        background: 'var(--white)',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--text-secondary)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: {
        flex: 'none',
        marginTop: 1
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "11",
      cy: "11",
      r: "8"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m21 21-4.3-4.3"
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        lineHeight: 1.6
      }
    }, "\u79FB\u52A8\u7AEF\u4EC5\u4FDD\u7559\u8FD1\u4E00\u6BB5\u65F6\u95F4\u7684\u5DF2\u68C0\u4EFB\u52A1\u4FBF\u4E8E\u590D\u6838", earlier > 0 ? `，更早还有 ${earlier} 个任务未在「${cfg.label}」范围内` : '', "\u3002 \u66F4\u65E9\u7684\u5386\u53F2\u6570\u636E\u8BF7\u524D\u5F80 ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--brand-action)',
        fontWeight: 600
      }
    }, "Web \u7AEF\u300C\u6211\u7684\u4EFB\u52A1 \xB7 \u5DF2\u5B8C\u6210\u300D"), "\u67E5\u8BE2\u3002"))));
  }
  function DoneCard({
    t
  }) {
    return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-lg)',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums'
      }
    }, t.code), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--fs-xs)',
        fontWeight: 600,
        color: 'var(--status-done-fg,#1b8a5a)',
        background: 'var(--status-done-bg,#e6f6ee)',
        flex: 'none'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "12",
      height: "12",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2.4",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "m9 12 2 2 4-4"
    })), "\u5DF2\u68C0")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-base)',
        color: 'var(--text-title)',
        lineHeight: 1.4,
        marginBottom: 4
      }
    }, t.sampleName), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        marginBottom: 10
      }
    }, t.client), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        paddingTop: 10,
        borderTop: '1px solid var(--divider)',
        fontSize: 'var(--fs-sm)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "12",
      cy: "12",
      r: "10"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M12 6v6l4 2"
    })), "\u5B8C\u6210\u4E8E ", /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-title)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, t.doneAt)), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-secondary)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, t.sampleCount ?? '—', " \u6837\u54C1 \xB7 ", t.testCount ?? '—', " \u8BD5\u9A8C\u9879")));
  }
  window.DoneTasks = DoneTasks;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DoneTasks.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Home.jsx
try { (() => {
/* 首页（检测员）— 公司名 / 轮播 / 快捷入口 / 检测模块入口 / 个人检测统计 */
(function () {
  const {
    SectionTitle,
    Card
  } = window.DesignSystem_52fd11;
  function Home({
    onEnterInspect,
    onQuick
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-section)'
      }
    }, /*#__PURE__*/React.createElement(SectionTitle, null, "\u676D\u5DDE\u6570\u8695\u667A\u80FD\u79D1\u6280\u6709\u9650\u516C\u53F8"), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: 'var(--blue-700)',
        color: '#fff',
        padding: '16px 20px'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        right: -24,
        top: -24,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        opacity: 0.8,
        marginBottom: 4,
        letterSpacing: '0.1em'
      }
    }, "\u5B9E\u9A8C\u5BA4\u6570\u667A\u5316\u7CFB\u7EDF"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 600
      }
    }, "\u8BD5\u9A8C\u6570\u636E \xB7 \u5B9E\u65F6\u81EA\u52A8\u91C7\u96C6"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12.5,
        opacity: 0.85,
        marginTop: 4
      }
    }, "\u91C7\u96C6\u5373\u4E0A\u4F20\uFF0C\u675C\u7EDD\u4EBA\u5DE5\u6284\u5F55\u6539\u6570")), /*#__PURE__*/React.createElement(Carousel, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
      style: {
        marginBottom: 6
      }
    }, "\u5FEB\u6377\u5165\u53E3"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-xs)',
        color: 'var(--text-secondary)',
        marginBottom: 12,
        lineHeight: 1.5
      }
    }, "\u6309\u300C\u59D4\u6258\u4EFB\u52A1\u300D\u7EDF\u8BA1\uFF1A\u4EE5\u4EFB\u52A1\u4E0B\u5206\u914D\u7ED9\u672C\u68C0\u6D4B\u5458\u7684\u8BD5\u9A8C\u9879\u5B8C\u6210\u5EA6\u5212\u5206"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Quick, {
      label: "\u5F85\u68C0\u4EFB\u52A1",
      count: 6,
      tone: "pending",
      icon: "inbox",
      onClick: () => onQuick?.('pending')
    }), /*#__PURE__*/React.createElement(Quick, {
      label: "\u68C0\u6D4B\u4E2D\u4EFB\u52A1",
      count: 3,
      tone: "testing",
      icon: "loader",
      onClick: () => onQuick?.('testing')
    }), /*#__PURE__*/React.createElement(Quick, {
      label: "\u5DF2\u68C0\u4EFB\u52A1",
      count: 6,
      tone: "done",
      icon: "check",
      onClick: () => onQuick?.('done')
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
      style: {
        marginBottom: 14
      }
    }, "\u4E2A\u4EBA\u68C0\u6D4B\u7EDF\u8BA1"), /*#__PURE__*/React.createElement(StatsPanel, null)));
  }
  function Quick({
    label,
    count,
    tone,
    icon,
    onClick
  }) {
    const color = {
      pending: 'var(--status-pending)',
      testing: 'var(--status-testing-fg)',
      done: 'var(--status-done)'
    }[tone];
    const bg = {
      pending: 'var(--status-pending-bg)',
      testing: 'var(--status-testing-bg)',
      done: 'var(--status-done-bg)'
    }[tone];
    const paths = {
      inbox: 'M22 12h-6l-2 3h-4l-2-3H2 M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
      loader: 'M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4',
      check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01l-3-3'
    };
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      style: {
        flex: 1,
        border: '1px solid var(--border-default)',
        background: 'var(--white)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '16px 12px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: paths[icon]
    }))), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        fontWeight: 700,
        color,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1
      }
    }, count), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)'
      }
    }, label));
  }
  function StatsPanel() {
    const {
      SegmentedSwitch
    } = window.DesignSystem_52fd11;
    const [range, setRange] = React.useState('month'); // 默认本月
    const cfg = buildSeries(range);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 240
      }
    }, /*#__PURE__*/React.createElement(DateField, {
      text: cfg.start
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-placeholder)'
      }
    }, "\u2014"), /*#__PURE__*/React.createElement(DateField, {
      text: cfg.end
    })), /*#__PURE__*/React.createElement(SegmentedSwitch, {
      value: range,
      onChange: setRange,
      options: [{
        value: 'year',
        label: '本年'
      }, {
        value: 'quarter',
        label: '本季'
      }, {
        value: 'month',
        label: '本月'
      }]
    })), /*#__PURE__*/React.createElement(ChartCard, {
      title: "\u6837\u54C1\u68C0\u6D4B\u91CF",
      color: "var(--blue-500)",
      data: cfg.sample,
      labels: cfg.labels
    }), /*#__PURE__*/React.createElement(ChartCard, {
      title: "\u8BD5\u9A8C\u68C0\u6D4B\u91CF",
      color: "#f59e0b",
      data: cfg.test,
      labels: cfg.labels
    }));
  }
  function ChartCard({
    title,
    color,
    data,
    labels
  }) {
    return /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        fontWeight: 600
      }
    }, title), /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'relative',
        width: 20,
        height: 2,
        background: color,
        display: 'inline-block'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: 'absolute',
        left: 6,
        top: -3,
        width: 8,
        height: 8,
        borderRadius: '50%',
        border: '2px solid ' + color,
        background: '#fff'
      }
    })), "\u68C0\u6D4B\u54581\uFF08\u4EC5\u672C\u4EBA\uFF09")), /*#__PURE__*/React.createElement(LineChart, {
      data: data,
      labels: labels,
      color: color
    }));
  }
  function DateField({
    text
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        height: 36,
        padding: '0 12px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-default)',
        background: 'var(--white)',
        color: 'var(--text-body)',
        fontSize: 'var(--fs-sm)',
        fontVariantNumeric: 'tabular-nums'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "15",
      height: "15",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--text-secondary)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("rect", {
      x: "3",
      y: "4",
      width: "18",
      height: "18",
      rx: "2"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M16 2v4 M8 2v4 M3 10h18"
    })), text);
  }
  function buildSeries(range) {
    const rnd = seed => {
      let s = seed;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    };
    const gen = (seed, len, base, span) => {
      const r = rnd(seed);
      return Array.from({
        length: len
      }, () => base + Math.floor(r() * span));
    };
    if (range === 'year') {
      const sample = gen(7, 12, 40, 80),
        test = gen(17, 12, 35, 82);
      const labels = sample.map((_, i) => ({
        i,
        text: i + 1 + '月'
      })).filter((_, i) => i % 2 === 0 || i === 11);
      return {
        start: '2026-01-01',
        end: '2026-12-31',
        sample,
        test,
        labels
      };
    }
    if (range === 'quarter') {
      const sample = gen(23, 3, 60, 90),
        test = gen(31, 3, 55, 88);
      const labels = [0, 1, 2].map(i => ({
        i,
        text: i + 4 + '月'
      }));
      return {
        start: '2026-04-01',
        end: '2026-06-30',
        sample,
        test,
        labels
      };
    }
    const sample = gen(6, 30, 0, 13),
      test = gen(16, 30, 0, 12);
    const labels = [0, 5, 10, 15, 20, 25, 29].map(i => ({
      i,
      text: '06-' + String(i + 1).padStart(2, '0')
    }));
    return {
      start: '2026-06-01',
      end: '2026-06-30',
      sample,
      test,
      labels
    };
  }
  function LineChart({
    data,
    labels,
    color
  }) {
    const W = 700,
      H = 200,
      padL = 38,
      padR = 10,
      padT = 12,
      padB = 24;
    const n = data.length;
    const max = Math.max.apply(null, data.concat(1));
    const niceMax = Math.max(50, Math.ceil(max / 50) * 50);
    const plotW = W - padL - padR,
      plotH = H - padT - padB;
    const X = i => padL + (n <= 1 ? 0 : i * plotW / (n - 1));
    const Y = v => padT + plotH - v / niceMax * plotH;
    const ticks = [];
    for (let t = 0; t <= niceMax + 0.1; t += niceMax / 5) ticks.push(t);
    const dPath = data.map((v, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    return /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${W} ${H}`,
      style: {
        width: '100%',
        height: 'auto',
        display: 'block',
        overflow: 'visible'
      }
    }, ticks.map((t, k) => /*#__PURE__*/React.createElement("g", {
      key: k
    }, /*#__PURE__*/React.createElement("line", {
      x1: padL,
      y1: Y(t),
      x2: W - padR,
      y2: Y(t),
      stroke: "var(--gray-200)",
      strokeWidth: "1"
    }), /*#__PURE__*/React.createElement("text", {
      x: padL - 6,
      y: Y(t) + 4,
      textAnchor: "end",
      fontSize: "11",
      fill: "var(--text-secondary)"
    }, Math.round(t)))), /*#__PURE__*/React.createElement("path", {
      d: dPath,
      fill: "none",
      stroke: color,
      strokeWidth: "2",
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }), data.map((v, i) => /*#__PURE__*/React.createElement("circle", {
      key: i,
      cx: X(i),
      cy: Y(v),
      r: "2.4",
      fill: "#fff",
      stroke: color,
      strokeWidth: "1.5"
    })), labels.map((l, k) => /*#__PURE__*/React.createElement("text", {
      key: k,
      x: X(l.i),
      y: H - 6,
      textAnchor: "middle",
      fontSize: "11",
      fill: "var(--text-secondary)"
    }, l.text)));
  }
  function Carousel() {
    const slides = [{
      tint: 'var(--blue-600)',
      tag: '工位风采',
      title: '电缆制样工位 · 无人化流水线',
      icon: 'M2 6h20v12H2z M2 16l5-5 4 4 3-3 6 6'
    }, {
      tint: '#1f7a8c',
      tag: '安全规范',
      title: '安全第一 · 精准检测 · 公正透明',
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4'
    }, {
      tint: '#3a5a99',
      tag: '本周通知',
      title: '6 项待检 · 3 项检测中',
      icon: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0'
    }];
    const [i, setI] = React.useState(0);
    React.useEffect(() => {
      const t = setInterval(() => setI(p => (p + 1) % slides.length), 3500);
      return () => clearInterval(t);
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        width: '100%',
        aspectRatio: '690 / 340',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }
    }, slides.map((s, idx) => /*#__PURE__*/React.createElement("div", {
      key: idx,
      style: {
        position: 'absolute',
        inset: 0,
        background: s.tint,
        color: '#fff',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        opacity: idx === i ? 1 : 0,
        transition: 'opacity 0.5s var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        right: 18,
        top: 16,
        opacity: 0.22
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "104",
      height: "104",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.4",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: s.icon
    }))), /*#__PURE__*/React.createElement("span", {
      style: {
        alignSelf: 'flex-start',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 10px',
        borderRadius: 'var(--radius-pill)',
        background: 'rgba(255,255,255,0.2)',
        marginBottom: 8
      }
    }, s.tag), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 17,
        fontWeight: 600
      }
    }, s.title))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        bottom: 12,
        right: 16,
        display: 'flex',
        gap: 6
      }
    }, slides.map((_, idx) => /*#__PURE__*/React.createElement("button", {
      key: idx,
      onClick: () => setI(idx),
      style: {
        width: idx === i ? 16 : 6,
        height: 6,
        borderRadius: 3,
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        background: idx === i ? '#fff' : 'rgba(255,255,255,0.5)',
        transition: 'width 0.3s'
      }
    }))));
  }
  window.Home = Home;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Inspect.jsx
try { (() => {
/* 检测模块 — 工位上下文 + 按设备/按样品双模式 + 钻取试验项 */
(function () {
  const {
    AppBar,
    StationBar,
    SegmentedSwitch,
    SearchBar,
    DeviceCard,
    TestItemCard,
    TaskCard,
    StatusTag,
    CollectBadge,
    Card
  } = window.DesignSystem_52fd11;
  const M = window.MOCK;
  function Inspect({
    stationId,
    onBack,
    onCollect,
    onSwitchStation,
    onClearStation
  }) {
    const station = M.stations.find(s => s.id === stationId) || null;
    const [mode, setMode] = React.useState('device'); // device | sample
    const [view, setView] = React.useState('list'); // list | device | sample
    const [device, setDevice] = React.useState(null);
    const [task, setTask] = React.useState(null);
    const [taskSample, setTaskSample] = React.useState(null);
    const [nameTip, setNameTip] = React.useState(null);
    const taskRootRef = React.useRef(null);
    const [sample, setSample] = React.useState(null);
    const [q, setQ] = React.useState('');
    const [offOpen, setOffOpen] = React.useState(false);
    const devices = station ? M.devices.filter(d => d.station === station.id) : [];
    // 该工位涉及的样品（出现在某试验项绑定的设备属于本工位）
    const samples = M.samples;
    const ql = q.trim().toLowerCase();
    const match = d => !ql || d.name && d.name.toLowerCase().includes(ql) || d.code && d.code.toLowerCase().includes(ql);
    const fDevices = devices.filter(match);
    const fSamples = samples.filter(match);
    const fOff = M.offDevices.filter(match);
    function openDevice(d) {
      setDevice(d);
      setView('device');
    }
    function openTask(t) {
      setTask(t);
      const first = M.samples.filter(s => s.code.startsWith(t.code))[0];
      setTaskSample(first ? first.id : null);
      setQ('');
      setView('task');
    }
    function openSample(s) {
      setSample(s);
      setView('sample');
    }

    // 某设备涉及的委托任务（任务下属样品含该设备的试验项）
    function tasksForDevice(dev) {
      if (!dev) return [];
      return M.tasks.filter(t => M.samples.filter(s => s.code.startsWith(t.code)).some(s => s.tests.some(te => te.device === dev.id)));
    }

    // ===== 列表层 =====
    if (view === 'list') {
      return /*#__PURE__*/React.createElement("div", {
        style: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-app)'
        }
      }, /*#__PURE__*/React.createElement(AppBar, {
        title: "\u68C0\u6D4B",
        onBack: onBack
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: 'var(--gap-page)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1,
          overflow: 'auto'
        }
      }, /*#__PURE__*/React.createElement(StationBar, {
        station: station ? station.name : '未选择工位',
        onSwitch: onSwitchStation,
        onClear: station ? onClearStation : undefined
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }
      }, /*#__PURE__*/React.createElement(SegmentedSwitch, {
        value: mode,
        onChange: setMode,
        options: [{
          value: 'device',
          label: '按设备'
        }, {
          value: 'sample',
          label: '按样品'
        }]
      }), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)'
        }
      }, mode === 'device' ? `${fDevices.length} 台设备` : `${fSamples.length} 个样品`)), /*#__PURE__*/React.createElement(SearchBar, {
        value: q,
        onChange: e => setQ(e.target.value),
        placeholder: mode === 'device' ? '请输入设备名称、编号搜索' : '请输入样品编号、名称搜索'
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--collect-ble)',
          background: offOpen ? 'var(--white)' : 'var(--collect-ble-bg)',
          overflow: 'hidden'
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setOffOpen(o => !o),
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          padding: '12px 14px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          color: 'var(--collect-ble)',
          textAlign: 'left'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "20",
        height: "20",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "m7 7 10 10-5 5V2l5 5L7 17"
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-base)',
          fontWeight: 600
        }
      }, "\u975E\u5DE5\u4F4D\u8BBE\u5907/\u4FBF\u643A\u8BBE\u5907"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)'
        }
      }, "\u672A\u7ED1\u5B9A\u5DE5\u4F4D\u7684\u8BBE\u5907\uFF0C\u70B9\u51FB\u5C55\u5F00")), /*#__PURE__*/React.createElement("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          transform: offOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform var(--dur-base) var(--ease-out)'
        }
      }, /*#__PURE__*/React.createElement("path", {
        d: "m18 15-6-6-6 6"
      }))), (offOpen || ql && fOff.length > 0) && /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '4px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-list)'
        }
      }, fOff.map(d => /*#__PURE__*/React.createElement(DeviceCard, {
        key: d.id,
        name: d.name,
        code: d.code,
        model: d.model,
        area: "\u975E\u5DE5\u4F4D\u8BBE\u5907",
        method: d.method,
        itemCount: d.items.length,
        onClick: () => openDevice(d)
      })), /*#__PURE__*/React.createElement("button", {
        onClick: () => {},
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px',
          border: '1px dashed var(--collect-ble)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--collect-ble-bg)',
          color: 'var(--collect-ble)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 'var(--fs-base)'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "18",
        height: "18",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      }, /*#__PURE__*/React.createElement("path", {
        d: "M3 7V5a2 2 0 0 1 2-2h2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M17 3h2a2 2 0 0 1 2 2v2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M21 17v2a2 2 0 0 1-2 2h-2"
      }), /*#__PURE__*/React.createElement("path", {
        d: "M7 21H5a2 2 0 0 1-2-2v-2"
      }), /*#__PURE__*/React.createElement("line", {
        x1: "7",
        y1: "12",
        x2: "17",
        y2: "12"
      })), "\u626B\u7801\u8FDE\u63A5\u65B0\u8BBE\u5907"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-xs)',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.5
        }
      }, "\u8BBE\u5907\u6765\u81EA Web\u300C\u8BBE\u5907\u7BA1\u7406\u300D\u7EF4\u62A4\u7684\u975E\u5DE5\u4F4D\u8BBE\u5907\uFF1B\u626B\u7801\u8FDE\u63A5\u672A\u7EF4\u62A4\u7684\u8BBE\u5907\u540E\uFF0C\u5C06\u81EA\u52A8\u540C\u6B65\u65B0\u589E\u81F3\u6570\u91C7"))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-list)'
        }
      }, mode === 'device' ? station ? fDevices.map(d => /*#__PURE__*/React.createElement(DeviceCard, {
        key: d.id,
        name: d.name,
        code: d.code,
        model: d.model,
        area: station.name,
        method: d.method,
        itemCount: d.items.length,
        onClick: () => openDevice(d)
      })) : /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }
      }, /*#__PURE__*/React.createElement("svg", {
        width: "40",
        height: "40",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "var(--text-placeholder)",
        strokeWidth: "1.6",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          marginBottom: 12
        }
      }, /*#__PURE__*/React.createElement("path", {
        d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: "12",
        cy: "10",
        r: "3"
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-base)'
        }
      }, "\u5C1A\u672A\u9009\u62E9\u5DE5\u4F4D"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          marginTop: 4
        }
      }, "\u70B9\u51FB\u4E0A\u65B9\u300C\u5207\u6362\u300D\u9009\u62E9\u5DE5\u4F4D\uFF0C\u6216\u7528\u300C\u6309\u6837\u54C1\u300D\u68C0\u7D22")) : fSamples.map(s => /*#__PURE__*/React.createElement(Card, {
        key: s.id,
        onClick: () => openSample(s)
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 'var(--fs-lg)',
          fontWeight: 600
        }
      }, s.name), /*#__PURE__*/React.createElement(StatusTag, {
        status: s.status
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)'
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          fontVariantNumeric: 'tabular-nums'
        }
      }, s.code), /*#__PURE__*/React.createElement("span", null, s.tests.length, " \u4E2A\u8BD5\u9A8C\u9879")))))));
    }

    // ===== 设备详情：选委托任务 =====
    if (view === 'device') {
      const dtasks = tasksForDevice(device);
      return /*#__PURE__*/React.createElement("div", {
        style: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-app)'
        }
      }, /*#__PURE__*/React.createElement(AppBar, {
        title: "\u9009\u62E9\u59D4\u6258\u4EFB\u52A1",
        onBack: () => setView('list')
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: 'var(--gap-page)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          flex: 1,
          overflow: 'auto'
        }
      }, /*#__PURE__*/React.createElement(Card, {
        padding: "14px 16px"
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10
        }
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-lg)',
          fontWeight: 600
        }
      }, device.name), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          marginTop: 3,
          fontVariantNumeric: 'tabular-nums'
        }
      }, "\u7F16\u53F7 ", device.code, " \xB7 \u578B\u53F7 ", device.model)), /*#__PURE__*/React.createElement(CollectBadge, {
        method: device.method,
        size: "sm"
      }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-sm)',
          color: 'var(--text-secondary)',
          marginBottom: 8
        }
      }, "\u59D4\u6258\u4EFB\u52A1\uFF08", dtasks.length, "\uFF09"), dtasks.length ? /*#__PURE__*/React.createElement("div", {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-list)'
        }
      }, dtasks.map(t => /*#__PURE__*/React.createElement(TaskCard, {
        key: t.code,
        code: t.code,
        sampleName: t.sampleName,
        client: t.client,
        time: t.time,
        status: t.status,
        onClick: () => openTask(t)
      }))) : /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 'var(--fs-base)'
        }
      }, "\u6682\u65E0\u6D89\u53CA\u8BE5\u8BBE\u5907\u7684\u59D4\u6258\u4EFB\u52A1")))));
    }

    // ===== 委托任务详情：样品（左）+ 对应试验项（右）主从布局 =====
    if (view === 'task') {
      const tSamples = M.samples.filter(s => s.code.startsWith(task.code));
      const cur = tSamples.find(s => s.id === taskSample) || tSamples[0];
      const ql2 = q.trim().toLowerCase();
      const its = cur ? cur.tests.filter(t => !ql2 || t.name.toLowerCase().includes(ql2) || cur.code && cur.code.toLowerCase().includes(ql2)) : [];
      return /*#__PURE__*/React.createElement("div", {
        style: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-app)'
        }
      }, /*#__PURE__*/React.createElement(AppBar, {
        title: "\u8BD5\u9A8C\u68C0\u6D4B",
        onBack: () => setView('device')
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          padding: 'var(--gap-page)',
          paddingBottom: 0
        }
      }, /*#__PURE__*/React.createElement(SearchBar, {
        value: q,
        onChange: e => setQ(e.target.value),
        placeholder: "\u8BF7\u8F93\u5165\u8BD5\u6837\u7F16\u53F7\u3001\u8BD5\u9A8C\u9879\u8FDB\u884C\u641C\u7D22"
      })), /*#__PURE__*/React.createElement("div", {
        ref: taskRootRef,
        style: {
          position: 'relative',
          display: 'flex',
          flex: 1,
          minHeight: 0,
          padding: 'var(--gap-page)',
          gap: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          width: 160,
          flex: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-list)',
          overflow: 'auto'
        }
      }, tSamples.map((s, i) => {
        const on = cur && s.id === cur.id;
        return /*#__PURE__*/React.createElement("button", {
          key: s.id,
          onClick: () => {
            setTaskSample(s.id);
            setNameTip(null);
          },
          style: {
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 6,
            padding: '12px 10px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            textAlign: 'left',
            border: 'none',
            borderLeft: `3px solid ${on ? 'var(--brand-action)' : 'transparent'}`,
            background: on ? 'var(--surface-selected)' : 'var(--white)'
          }
        }, /*#__PURE__*/React.createElement("div", {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            width: '100%'
          }
        }, /*#__PURE__*/React.createElement(StatusTag, {
          status: s.status,
          size: "sm"
        }), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 'var(--fs-xs)',
            fontWeight: on ? 600 : 400,
            color: 'var(--text-title)',
            fontVariantNumeric: 'tabular-nums'
          }
        }, "\u5E8F\u53F7:", i + 1)), /*#__PURE__*/React.createElement("span", {
          style: {
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-secondary)',
            fontVariantNumeric: 'tabular-nums',
            wordBreak: 'break-all'
          }
        }, s.code), /*#__PURE__*/React.createElement("span", {
          title: s.name,
          onClick: e => {
            e.stopPropagation();
            setTaskSample(s.id);
            const btn = e.currentTarget.closest('button');
            const root = taskRootRef.current;
            let pos = null;
            if (btn && root) {
              const r = btn.getBoundingClientRect();
              const rr = root.getBoundingClientRect();
              const scale = rr.width / root.offsetWidth || 1;
              pos = {
                id: s.id,
                name: s.name,
                top: (r.top - rr.top) / scale + 6,
                left: (r.right - rr.left) / scale + 8
              };
            }
            setNameTip(p => p && p.id === s.id ? null : pos);
          },
          style: {
            fontSize: 'var(--fs-base)',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--text-title)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            cursor: 'pointer'
          }
        }, s.name));
      })), /*#__PURE__*/React.createElement("div", {
        style: {
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-list)',
          overflow: 'auto'
        }
      }, its.length ? its.map((t, i) => {
        const dev = M.devices.find(d => d.id === t.device);
        const tpl = dev ? (dev.items.find(x => x.name === t.name) || {}).tpl : undefined;
        return /*#__PURE__*/React.createElement(TestItemCard, {
          key: i,
          name: t.name,
          device: dev ? dev.name : '',
          method: t.method || dev && dev.method,
          status: t.status,
          upload: t.upload,
          onClick: () => onCollect({
            sample: cur,
            device: dev,
            item: {
              name: t.name,
              tpl,
              count: t.count,
              subs: t.subs,
              phased: t.phased
            },
            method: t.method || dev && dev.method,
            status: t.status,
            flow: t.flow
          })
        });
      }) : /*#__PURE__*/React.createElement("div", {
        style: {
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: 'var(--fs-sm)'
        }
      }, "\u65E0\u5339\u914D\u8BD5\u9A8C\u9879")), nameTip && /*#__PURE__*/React.createElement("div", {
        onClick: () => setNameTip(null),
        style: {
          position: 'absolute',
          top: nameTip.top,
          left: nameTip.left,
          zIndex: 100,
          maxWidth: 240,
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--text-title)',
          color: 'var(--white)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 400,
          lineHeight: 1.5,
          whiteSpace: 'normal',
          boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
          cursor: 'pointer'
        }
      }, nameTip.name)));
    }
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-app)'
      }
    }, /*#__PURE__*/React.createElement(AppBar, {
      title: "\u6837\u54C1\u8BD5\u9A8C\u9879",
      onBack: () => setView('list')
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        flex: 1,
        overflow: 'auto'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "14px 16px"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-lg)',
        fontWeight: 600
      }
    }, sample.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        marginTop: 3,
        fontVariantNumeric: 'tabular-nums'
      }
    }, sample.code)), /*#__PURE__*/React.createElement(StatusTag, {
      status: sample.status
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-list)'
      }
    }, sample.tests.map((t, i) => {
      const dev = M.devices.find(d => d.id === t.device);
      return /*#__PURE__*/React.createElement(TestItemCard, {
        key: i,
        name: t.name,
        device: dev ? dev.name : '',
        method: t.method,
        status: t.status,
        upload: t.upload,
        onClick: () => onCollect({
          sample,
          device: dev,
          item: {
            name: t.name,
            tpl: (dev.items.find(x => x.name === t.name) || {}).tpl,
            count: t.count,
            subs: t.subs,
            phased: t.phased
          },
          method: t.method,
          status: t.status,
          flow: t.flow
        })
      });
    }))));
  }
  window.Inspect = Inspect;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Inspect.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Login.jsx
try { (() => {
/* 登录页 — 沿用旧 app：欢迎来访 / WELCOME / 账号密码 / 登录 */
(function () {
  const {
    Button,
    Input
  } = window.DesignSystem_52fd11;
  function Login({
    onLogin
  }) {
    const [acct, setAcct] = React.useState('admin');
    const [pwd, setPwd] = React.useState('······');
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: '100%',
        background: 'var(--white)',
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'relative',
        padding: '72px 40px 48px',
        background: 'var(--blue-700)',
        color: '#fff',
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        right: -40,
        top: -40,
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        right: 40,
        bottom: -60,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)'
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 30
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "../../assets/logo-mark.png",
      alt: "",
      style: {
        width: 44,
        height: 44,
        filter: 'brightness(0) invert(1)'
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: '-0.01em'
      }
    }, "Lab Data")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 26,
        fontWeight: 600,
        marginBottom: 6
      }
    }, "\u6B22\u8FCE\u6765\u8BBF"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        letterSpacing: '0.28em',
        opacity: 0.85,
        marginBottom: 14
      }
    }, "WELCOME"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 19,
        fontWeight: 500
      }
    }, "\u5B9E\u9A8C\u5BA4\u6570\u667A\u5316\u7CFB\u7EDF")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        padding: '40px 40px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "\u8D26\u53F7"
    }, /*#__PURE__*/React.createElement(Input, {
      value: acct,
      onChange: e => setAcct(e.target.value),
      placeholder: "\u8BF7\u8F93\u5165\u8D26\u53F7",
      size: "lg",
      prefix: /*#__PURE__*/React.createElement(Ico, {
        d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 7 a4 4 0 1 0 0 0"
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "\u5BC6\u7801"
    }, /*#__PURE__*/React.createElement(Input, {
      type: "password",
      value: pwd,
      onChange: e => setPwd(e.target.value),
      placeholder: "\u8BF7\u8F93\u5165\u5BC6\u7801",
      size: "lg",
      prefix: /*#__PURE__*/React.createElement(Ico, {
        d: "M5 11 h14 v10 H5 z M8 11 V7 a4 4 0 0 1 8 0 v4"
      })
    })), /*#__PURE__*/React.createElement(Button, {
      block: true,
      size: "lg",
      style: {
        marginTop: 10
      },
      onClick: onLogin
    }, "\u767B\u5F55"), /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: 'center',
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        marginTop: 4
      }
    }, "\u676D\u5DDE\u6570\u8695\u667A\u80FD\u79D1\u6280\u6709\u9650\u516C\u53F8 \xB7 V2.0")));
  }
  function Field({
    label,
    children
  }) {
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        marginBottom: 8
      }
    }, label), children);
  }
  function Ico({
    d
  }) {
    return /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: d
    }));
  }
  window.Login = Login;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Mine.jsx
try { (() => {
/* 我的 — 用户信息 / 我的权限 / 更多操作 */
(function () {
  const {
    SectionTitle,
    Card
  } = window.DesignSystem_52fd11;
  function Mine({
    onLogout
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--gap-page)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-section)'
      }
    }, /*#__PURE__*/React.createElement(Card, {
      padding: "0",
      style: {
        overflow: 'hidden'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        background: 'var(--blue-700)',
        color: '#fff'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: '#fff',
        color: 'var(--blue-700)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
        fontWeight: 700,
        flex: 'none'
      }
    }, "\u6881"), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 20,
        fontWeight: 600
      }
    }, "\u6881\u5029"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        opacity: 0.85,
        marginTop: 4
      }
    }, "\u8D26\u53F7 lq"))), /*#__PURE__*/React.createElement(InfoRow, {
      label: "\u90E8\u95E8",
      value: "\u6570\u8695\u667A\u80FD \xB7 \u5B89\u5168\u5DE5\u5668\u5177\u68C0\u6D4B\u7EC4"
    }), /*#__PURE__*/React.createElement(InfoRow, {
      label: "\u624B\u673A\u53F7",
      value: "176 8248 4331",
      last: true
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionTitle, {
      style: {
        marginBottom: 14
      }
    }, "\u66F4\u591A\u64CD\u4F5C"), /*#__PURE__*/React.createElement(Card, {
      padding: "0"
    }, /*#__PURE__*/React.createElement(Row, {
      icon: "settings",
      label: "\u8BBE\u7F6E"
    }), /*#__PURE__*/React.createElement(Row, {
      icon: "key",
      label: "\u4FEE\u6539\u5BC6\u7801"
    }), /*#__PURE__*/React.createElement(Row, {
      icon: "bell",
      label: "\u6D88\u606F\u901A\u77E5"
    }), /*#__PURE__*/React.createElement(Row, {
      icon: "help",
      label: "\u5E2E\u52A9\u4E0E\u53CD\u9988"
    }), /*#__PURE__*/React.createElement(Row, {
      icon: "logout",
      label: "\u9000\u51FA\u767B\u5F55",
      danger: true,
      onClick: onLogout,
      last: true
    }))));
  }
  function Row({
    icon,
    label,
    danger,
    onClick,
    last
  }) {
    const paths = {
      key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
      bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.94 1.94 0 0 0 3.4 0',
      help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
      logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
      settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'
    };
    const color = danger ? 'var(--danger)' : 'var(--text-body)';
    return /*#__PURE__*/React.createElement("button", {
      onClick: onClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: '15px 16px',
        border: 'none',
        borderBottom: last ? 'none' : '1px solid var(--divider)',
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left'
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: color,
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: paths[icon]
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 'var(--fs-base)',
        color
      }
    }, label), /*#__PURE__*/React.createElement("svg", {
      width: "18",
      height: "18",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "var(--text-placeholder)",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }, /*#__PURE__*/React.createElement("path", {
      d: "m9 18 6-6-6-6"
    })));
  }
  function InfoRow({
    label,
    value,
    last
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '13px 18px',
        borderBottom: last ? 'none' : '1px solid var(--divider)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-sm)',
        color: 'var(--text-secondary)',
        flex: 'none'
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--fs-base)',
        color: 'var(--text-title)',
        fontWeight: 500,
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums'
      }
    }, value));
  }
  window.Mine = Mine;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Mine.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/mock.js
try { (() => {
/* 数蚕 Lab Data · 检测员 UI Kit 模拟数据
   工位/样品/试验项取自国网绿链泰山物资检测中心实拍工位牌 + Web 试验填报（8.7/10kV-3芯 电缆）。
   采集方式规则：导体直流电阻=拍照识别(ocr)；非金属护套&钢带铠装=蓝牙数显卡尺(ble)；
   其余电缆设备=设备直连(auto)。仅 ble 允许手输，ocr/auto 不可手输。 */
(function () {
  // 工位（物理区域）—— 取自现场工位牌
  const stations = [{
    id: 'zy',
    name: '电缆制样工位',
    deviceCount: 7,
    desc: '无人化流水线制样 · ABB 机器人'
  }, {
    id: 'sz',
    name: '水煮试验工位',
    deviceCount: 4,
    desc: '绝缘电阻 · 透水 · 镀锌层 · 温度循环'
  }, {
    id: 'ny',
    name: '耐压工位',
    deviceCount: 2,
    desc: '0-150kV 工频耐压 · 手动/自动升压'
  }, {
    id: 'ld',
    name: '雷电冲击工位',
    deviceCount: 1,
    desc: '电缆/变压器/开关 A级雷电冲击'
  }, {
    id: 'rs',
    name: '电缆燃烧工位',
    deviceCount: 5,
    desc: '炭黑 · 烟密度 · 耐火 · 成束燃烧'
  }, {
    id: 'by',
    name: '变压器工位',
    deviceCount: 1,
    desc: '配电变压器 C级综合试验'
  }];

  // 试验字段模板（采集详情录入）
  const fieldTpl = {
    dcr: [
    // 导体直流电阻（智能型数字电桥 · 拍照识别）
    {
      key: 'zx',
      label: '正向',
      unit: 'µΩ'
    }, {
      key: 'fx',
      label: '反向',
      unit: 'µΩ'
    }, {
      key: 'pj',
      label: '平均',
      unit: 'µΩ'
    }, {
      key: 'cd',
      label: '长度',
      unit: 'm'
    }, {
      key: 'wb',
      label: '温补',
      unit: 'µΩ'
    }, {
      key: 'jg',
      label: '结果',
      unit: 'Ω/km'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }],
    size: [
    // 结构尺寸/厚度（设备直连）
    {
      key: 'bcz',
      label: '标称值',
      unit: 'mm'
    }, {
      key: 'csz',
      label: '测量值',
      unit: 'mm'
    }, {
      key: 'jsz',
      label: '计算值',
      unit: 'mm'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }],
    caliper: [
    // 非金属护套&钢带铠装（蓝牙数显卡尺，可手输）
    {
      key: 'hctk',
      label: '护层厚度',
      unit: 'mm'
    }, {
      key: 'gdkd',
      label: '钢带宽度',
      unit: 'mm'
    }, {
      key: 'dckd',
      label: '搭盖宽度',
      unit: 'mm'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }],
    mech: [
    // 机械性能（设备直连）
    {
      key: 'kzqd',
      label: '抗张强度',
      unit: 'MPa'
    }, {
      key: 'dlcl',
      label: '断裂伸长率',
      unit: '%'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }],
    heatext: [
    // 热延伸（设备直连）
    {
      key: 'fhcl',
      label: '负荷伸长率',
      unit: '%'
    }, {
      key: 'lqbx',
      label: '冷却永久变形',
      unit: '%'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }],
    shrink: [
    // 收缩（设备直连）
    {
      key: 'sssl',
      label: '收缩率',
      unit: '%'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }],
    density: [
    // 密度测量（电子天平 · 外部程序代采，逐试样）
    {
      key: 'jysd',
      label: '浸渍液温度',
      unit: '℃'
    }, {
      key: 'msa',
      label: '空气中质量 m(S,A)',
      unit: 'g'
    }, {
      key: 'msil',
      label: '浸渍液中表观质量 m(S,IL)',
      unit: 'g'
    }, {
      key: 'myd',
      label: '试样密度 ρ(S)',
      unit: 'g/cm³'
    }, {
      key: 'pjz',
      label: '平均密度',
      unit: 'g/cm³'
    }, {
      key: 'jl',
      label: '结论',
      unit: ''
    }]
  };

  // 设备（含所在工位 station、采集方式 method、可做试验项 items）
  const devices = [{
    id: 'dcr',
    name: '智能型数字电桥',
    code: 'YM-WRH-100',
    model: 'QJ36-ZS',
    station: 'zy',
    method: 'ocr',
    items: [{
      name: '导体直流电阻',
      tpl: 'dcr'
    }]
  }, {
    id: 'thk',
    name: '全自动绝缘厚度测试仪',
    code: 'YM-WRH-02',
    model: 'YWD-11F',
    station: 'zy',
    method: 'auto',
    items: [{
      name: '结构尺寸检查—导体&绝缘厚度&金属屏蔽',
      tpl: 'size'
    }]
  }, {
    id: 'cal',
    name: '蓝牙数显卡尺',
    code: 'BT-CAL-01',
    model: 'IP54-150',
    station: 'zy',
    method: 'ble',
    items: [{
      name: '结构尺寸检查—非金属护套&钢带铠装',
      tpl: 'caliper'
    }]
  }, {
    id: 'mech',
    name: '电缆绝缘层机械性能试验机',
    code: 'YM-WRH-03',
    model: 'YWL-5D',
    station: 'zy',
    method: 'auto',
    items: [{
      name: '老化前绝缘的机械性能试验',
      tpl: 'mech'
    }, {
      name: '非金属护套老化前的机械性能试验',
      tpl: 'mech'
    }]
  }, {
    id: 'hext',
    name: '电缆热延伸全自动智能检测平台',
    code: 'YM-WRH-04',
    model: 'YWH-6D',
    station: 'zy',
    method: 'auto',
    items: [{
      name: 'XLPE绝缘的热延伸试验',
      tpl: 'heatext'
    }]
  }, {
    id: 'shr',
    name: '电缆热收缩试验智能检测平台',
    code: 'YM-WRH-05',
    model: 'YRSC-200I',
    station: 'zy',
    method: 'auto',
    items: [{
      name: 'XLPE绝缘的收缩试验',
      tpl: 'shrink'
    }]
  },
  // 手输设备（单机台式仪表，无通讯接口，读数靠人工录入）
  {
    id: 'tmk',
    name: '台式测厚仪',
    code: 'DF291968',
    model: '(0~12.7)mm/0.001mm',
    station: 'zy',
    method: 'manual',
    items: [{
      name: '绝缘厚度测量（手输补录）',
      tpl: 'size'
    }]
  },
  // ===== 非工位设备（来自 Web「设备管理」维护，未绑定工位 / 便携）=====
  {
    id: 'ir',
    name: '手持式红外热像仪',
    code: 'IR-808',
    model: 'FLIR-E8',
    station: null,
    method: 'ble',
    items: [{
      name: '温升检测',
      tpl: 'mech'
    }]
  }, {
    id: 'pd',
    name: '便携式局部放电检测仪',
    code: 'PD-200',
    model: 'PDS-9',
    station: null,
    method: 'ble',
    items: [{
      name: '局部放电检测',
      tpl: 'mech'
    }]
  }, {
    id: 'cal2',
    name: '蓝牙数显卡尺（便携）',
    code: 'BT-CAL-09',
    model: 'IP54-150',
    station: null,
    method: 'ble',
    items: [{
      name: '尺寸测量',
      tpl: 'caliper'
    }]
  },
  // ===== 外部程序采集设备（电子天平，平板代采写库，App 不在此采集）=====
  {
    id: 'bal',
    name: '电子天平',
    code: 'YH-04',
    model: 'HZK-FA110',
    station: null,
    method: 'external',
    items: [{
      name: '密度测量',
      tpl: 'density',
      count: 3
    }]
  }];

  // 样品 —— 8.7/10kV-3芯 电力电缆（Web 试验填报同款），含 7 个试验项
  const samples = [{
    id: 's1',
    code: 'SC2026/01001-01',
    name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    status: 'testing',
    cable: true,
    client: '杭州数蚕智能科技有限公司',
    tests: [{
      name: '导体直流电阻',
      device: 'dcr',
      method: 'ocr',
      status: 'done',
      upload: 'done',
      phased: true,
      flow: {
        node: '数据审核'
      }
    }, {
      name: '结构尺寸检查—导体&绝缘厚度&金属屏蔽',
      device: 'thk',
      method: 'auto',
      status: 'testing',
      count: 3,
      phased: true,
      subs: [{
        name: '导体',
        method: 'auto',
        phased: true,
        device: {
          name: '绝缘层机械性能智能测试系统-无人化版',
          code: 'YM-WRH-03',
          model: 'YWL-5D'
        },
        fields: [{
          key: 'jg',
          label: '导体结构'
        }, {
          key: 'gs',
          label: '导体单丝根数',
          unit: '根'
        }, {
          key: 'zj',
          label: '导体直径',
          unit: 'mm'
        }]
      }, {
        name: '绝缘厚度测量',
        method: 'manual',
        phased: true,
        device: {
          name: '台式测厚仪',
          code: 'DF291968',
          model: '(0~12.7)mm/0.001mm'
        },
        fields: [{
          key: 'hd',
          label: '绝缘各测量点厚度',
          unit: 'mm',
          multi: 6
        }]
      }, {
        name: '金属屏蔽',
        method: 'ble',
        phased: true,
        device: {
          name: '数显卡尺',
          code: 'YBKC-02',
          model: '(0~300)mm/0.01mm'
        },
        fields: [{
          key: 'tdhd',
          label: '铜带厚度',
          unit: 'mm'
        }, {
          key: 'tk1',
          label: '铜带宽度1',
          unit: 'mm'
        }, {
          key: 'dg1',
          label: '搭盖宽度1',
          unit: 'mm'
        }, {
          key: 'tk2',
          label: '铜带宽度2',
          unit: 'mm'
        }, {
          key: 'dg2',
          label: '搭盖宽度2',
          unit: 'mm'
        }, {
          key: 'tk3',
          label: '铜带宽度3',
          unit: 'mm'
        }, {
          key: 'dg3',
          label: '搭盖宽度3',
          unit: 'mm'
        }, {
          key: 'tk4',
          label: '铜带宽度4',
          unit: 'mm'
        }, {
          key: 'dg4',
          label: '搭盖宽度4',
          unit: 'mm'
        }, {
          key: 'tk5',
          label: '铜带宽度5',
          unit: 'mm'
        }, {
          key: 'dg5',
          label: '搭盖宽度5',
          unit: 'mm'
        }]
      }]
    }, {
      name: '结构尺寸检查—非金属护套&钢带铠装',
      device: 'cal',
      method: 'ble',
      status: 'testing',
      upload: 'pending',
      phased: false
    }, {
      name: '老化前绝缘的机械性能试验',
      device: 'mech',
      method: 'auto',
      status: 'pending'
    }, {
      name: '非金属护套老化前的机械性能试验',
      device: 'mech',
      method: 'auto',
      status: 'pending'
    }, {
      name: 'XLPE绝缘的热延伸试验',
      device: 'hext',
      method: 'auto',
      status: 'pending'
    }, {
      name: 'XLPE绝缘的收缩试验',
      device: 'shr',
      method: 'auto',
      status: 'pending'
    }]
  }, {
    id: 's1b',
    code: 'SC2026/01001-02',
    name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    status: 'testing',
    cable: true,
    client: '杭州数蚕智能科技有限公司',
    tests: [{
      name: '导体直流电阻',
      device: 'dcr',
      method: 'ocr',
      status: 'testing',
      phased: true
    }, {
      name: '结构尺寸检查—非金属护套&钢带铠装',
      device: 'cal',
      method: 'ble',
      status: 'pending',
      phased: false
    }, {
      name: 'XLPE绝缘的收缩试验',
      device: 'shr',
      method: 'auto',
      status: 'pending'
    }]
  }, {
    id: 's1c',
    code: 'SC2026/01001-03',
    name: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    status: 'pending',
    cable: true,
    client: '杭州数蚕智能科技有限公司',
    tests: [{
      name: '老化前绝缘的机械性能试验',
      device: 'mech',
      method: 'auto',
      status: 'pending'
    }, {
      name: '非金属护套老化前的机械性能试验',
      device: 'mech',
      method: 'auto',
      status: 'pending'
    }]
  }, {
    id: 's2',
    code: 'SC2026/01002-01',
    name: '8.7/10kV-3芯 电力电缆',
    status: 'pending',
    cable: true,
    client: '国网杭州供电公司',
    tests: [{
      name: '导体直流电阻',
      device: 'dcr',
      method: 'ocr',
      status: 'pending'
    }, {
      name: '结构尺寸检查—非金属护套&钢带铠装',
      device: 'cal',
      method: 'ble',
      status: 'pending'
    }, {
      name: 'XLPE绝缘的收缩试验',
      device: 'shr',
      method: 'auto',
      status: 'pending'
    }]
  }, {
    id: 's3',
    code: 'SC2026/00998-03',
    name: '0.6/1kV-4芯 电力电缆',
    status: 'done',
    cable: true,
    client: '国网杭州供电公司',
    tests: [{
      name: '导体直流电阻',
      device: 'dcr',
      method: 'ocr',
      status: 'done',
      upload: 'done',
      flow: {
        node: '试验检测',
        returned: true,
        returnReason: '第 2 次正向电阻读数与历史数据偏差较大，疑似拍照识别误差，请复测后重新上传',
        returnedFrom: '数据审核',
        by: '张伟',
        role: '数据审核',
        at: '06-25 14:30'
      }
    }, {
      name: '老化前绝缘的机械性能试验',
      device: 'mech',
      method: 'auto',
      status: 'done',
      upload: 'done'
    }]
  }, {
    id: 's4',
    code: 'SC2026/00990-01',
    name: '8.7/10kV-1芯 电力电缆',
    status: 'overdue',
    cable: true,
    client: '杭州数蚕智能科技有限公司',
    tests: [{
      name: 'XLPE绝缘的热延伸试验',
      device: 'hext',
      method: 'auto',
      status: 'pending'
    }]
  }, {
    id: 's5',
    code: 'SC2026/01630101',
    name: '实壁类塑料电缆导管 带承口 PVC-C',
    status: 'testing',
    cable: false,
    client: '国网杭州供电公司',
    tests: [{
      name: '密度测量',
      device: 'bal',
      method: 'external',
      status: 'pending',
      count: 3
    }]
  }];

  // 任务列表（首页快捷入口 / 统计）
  // doneAt = 该任务下分配给本检测员的试验项全部完成检测的时间（仅 done 任务有）
  const tasks = [{
    code: 'SC2026/01001',
    sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    client: '杭州数蚕智能科技有限公司',
    time: '2026-06-18 09:20:11',
    status: 'testing'
  }, {
    code: 'SC2026/01002',
    sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    client: '国网杭州供电公司',
    time: '2026-06-17 14:05:42',
    status: 'pending'
  }, {
    code: 'SC2026/00998',
    sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    client: '国网杭州供电公司',
    time: '2026-06-12 10:18:41',
    status: 'done',
    doneAt: '2026-06-24 16:02:10',
    sampleCount: 3,
    testCount: 8
  }, {
    code: 'SC2026/00990',
    sampleName: '交联聚乙烯绝缘钢带铠装聚氯乙烯护套电力电缆',
    client: '杭州数蚕智能科技有限公司',
    time: '2026-05-29 16:31:51',
    status: 'overdue'
  },
  // —— 历史已检任务（用于「已检任务」时间范围筛选演示）——
  {
    code: 'SC2026/00982',
    sampleName: '低烟无卤阻燃聚烯烃护套电力电缆',
    client: '国网杭州供电公司',
    time: '2026-06-19 08:40:00',
    status: 'done',
    doneAt: '2026-06-23 11:20:00',
    sampleCount: 2,
    testCount: 5
  }, {
    code: 'SC2026/00975',
    sampleName: '交联聚乙烯绝缘电力电缆',
    client: '杭州数蚕智能科技有限公司',
    time: '2026-06-10 09:12:00',
    status: 'done',
    doneAt: '2026-06-16 17:45:00',
    sampleCount: 4,
    testCount: 11
  }, {
    code: 'SC2026/00961',
    sampleName: '钢带铠装聚氯乙烯护套电力电缆',
    client: '国网杭州供电公司',
    time: '2026-05-28 14:00:00',
    status: 'done',
    doneAt: '2026-06-04 10:05:00',
    sampleCount: 1,
    testCount: 3
  }, {
    code: 'SC2026/00940',
    sampleName: '架空绝缘电缆',
    client: '国网杭州供电公司',
    time: '2026-05-08 10:30:00',
    status: 'done',
    doneAt: '2026-05-15 15:30:00',
    sampleCount: 2,
    testCount: 6
  }, {
    code: 'SC2026/00902',
    sampleName: '控制电缆',
    client: '杭州数蚕智能科技有限公司',
    time: '2026-03-12 09:00:00',
    status: 'done',
    doneAt: '2026-03-20 16:40:00',
    sampleCount: 3,
    testCount: 7
  }];

  // 试验项相别/次数规则（含相别 → 红/黄/绿三相，perPhase=每相次数；无相别 → count=总次数）
  const testRules = {
    '导体直流电阻': {
      phased: true,
      perPhase: 1
    },
    '结构尺寸检查—非金属护套&钢带铠装': {
      phased: false,
      count: 1
    },
    '老化前绝缘的机械性能试验': {
      phased: true,
      perPhase: 5
    },
    '非金属护套老化前的机械性能试验': {
      phased: false,
      count: 5
    },
    'XLPE绝缘的热延伸试验': {
      phased: true,
      perPhase: 2
    },
    'XLPE绝缘的收缩试验': {
      phased: true,
      perPhase: 1
    }
  };
  const methodLabel = {
    auto: '设备直连',
    ocr: '拍照识别',
    ble: '蓝牙卡尺',
    manual: '手工录入',
    external: '外部程序'
  };
  // 仅蓝牙允许手输
  const allowManualInput = method => method === 'ble';
  window.MOCK = {
    stations,
    devices,
    samples,
    tasks,
    fieldTpl,
    methodLabel,
    testRules,
    allowManualInput,
    offDevices: devices.filter(d => !d.station)
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/mock.js", error: String((e && e.message) || e) }); }

__ds_ns.Card = __ds_scope.Card;

__ds_ns.DeviceCard = __ds_scope.DeviceCard;

__ds_ns.FieldRow = __ds_scope.FieldRow;

__ds_ns.SampleListItem = __ds_scope.SampleListItem;

__ds_ns.SectionTitle = __ds_scope.SectionTitle;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.TaskCard = __ds_scope.TaskCard;

__ds_ns.TestItemCard = __ds_scope.TestItemCard;

__ds_ns.CollectBadge = __ds_scope.CollectBadge;

__ds_ns.StatusDot = __ds_scope.StatusDot;

__ds_ns.StatusTag = __ds_scope.StatusTag;

__ds_ns.UploadStatus = __ds_scope.UploadStatus;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SearchBar = __ds_scope.SearchBar;

__ds_ns.SegmentedSwitch = __ds_scope.SegmentedSwitch;

__ds_ns.AppBar = __ds_scope.AppBar;

__ds_ns.BottomTabBar = __ds_scope.BottomTabBar;

__ds_ns.StationBar = __ds_scope.StationBar;

})();
