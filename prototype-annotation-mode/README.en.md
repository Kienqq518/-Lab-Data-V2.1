[中文 README](./README.md)

# 🪄 Prototype Annotation Mode (原型交互式批注模式) · Universal Skill / Prompt

> **Bring your AI prototype to life: turn requirement context buried in chat history into a visual, interactive PRD.**

## 💡 Introduction

In the PM × AI Agent workflow, we often iterate through conversation to produce an interactive HTML prototype. Yet **the valuable business logic, edge cases, and interaction rules hidden in chat often stay in the transcript—disconnected from the final visual prototype.**

`prototype-annotation-mode` exists to fix that.

It assumes you already have an AI-generated interactive HTML prototype. Hand this spec to your AI assistant, and it will **extract effective requirements and interaction logic from prior conversation**, then—without breaking your existing UI patterns—inject a global **Annotation Mode** toggle into the prototype.

Once annotation mode is on, the prototype becomes a **living, interactive product spec**.

## ✨ Core Features

- 🧩 **Seamless, non-invasive integration**
  Enhances an existing HTML prototype in place. Reuses your current UI styles and design system (CSS/Tailwind). The visual structure stays intact; side rails appear only when the toggle is on, using compressed main-view margins.
- 🧠 **Contextual logic extraction**
  The AI reviews prior conversation, filters noise, and structures real product requirements into annotations—so PMs don’t have to manually rewrite specs.
- 🗂️ **Standardized three-section cards**
  Every annotated region follows a clear PM-oriented breakdown:
  - 📍 **Business logic** — Why does this exist? What’s the core value?
  - 👁️ **Display rules** — Initial, empty, edge, and error states; layout and copy.
  - 🖱️ **Interaction** — Clicks, swipes, hovers, navigation, feedback.
- 🔗 **Bi-directional hover linkage**
  Hover a side-rail card → the matching UI region highlights (or gets a focus mask). Hover a UI region → the matching card highlights.
- 🎚️ **Global toggle**
  Off: a clean, realistic prototype for user testing. On: left/right rails expand with logic for engineering and QA review.

---

## 🖼️ Demo

Add a screenshot or GIF under `assets/`, then uncomment in this README:

```markdown
![Demo](./assets/demo.gif)
```

> Suggested recording: toggle off → toggle on → hover card ↔ UI → open overlay to verify annotation isolation.

---

## 📦 Usage

This repo is a **cross-platform AI agent instruction spec** (prompt + implementation reference). It is **not** an npm package.

It is **not tied to any IDE or model**—**Cursor, Claude Code, Windsurf, GitHub Copilot Chat, ChatGPT, Tongyi Lingma**, and any assistant that can read a long prompt can use it. Give the spec to your AI and it will inject annotation mode into your existing prototype.

### Option 1: Paste the prompt (universal · recommended)

Open [`prototype-annotation-mode.md`](./prototype-annotation-mode.md), copy the full text into your AI chat, and add:

> “Strictly follow this spec to implement annotation mode on my HTML/React prototype, and extract requirement logic from our prior conversation.”

Works everywhere. **No install required.**

### Option 2: Install as a Cursor Skill

```bash
git clone https://github.com/Kienqq518/prototype-annotation-mode.git
mkdir -p ~/.cursor/skills
cp -R prototype-annotation-mode/skills/prototype-annotation-mode ~/.cursor/skills/
```

Expected layout:

```
~/.cursor/skills/prototype-annotation-mode/
├── SKILL.md
└── reference.md
```

Restart Cursor, then say:

> “Use the **prototype-annotation-mode** skill to add annotation mode to my HTML/React prototype.”

**Team sharing:** copy into `.cursor/skills/` and commit. Or use `/create-skill` in Cursor and paste `SKILL.md` as the skill body.

### Option 3: Install as a Claude Code Skill

```bash
git clone https://github.com/Kienqq518/prototype-annotation-mode.git
mkdir -p ~/.claude/skills
cp -R prototype-annotation-mode/skills/prototype-annotation-mode ~/.claude/skills/
```

Or, if configured:

```bash
npx skills add Kienqq518/prototype-annotation-mode
```

### Option 4: Add to project rule files

Put the full or summarized `prototype-annotation-mode.md` in one of:

| Tool | Common rule file |
|------|------------------|
| Cursor | `.cursorrules` or `.cursor/rules/*.md` |
| Windsurf | `.windsurfrules` |
| General | `AGENTS.md` / `CLAUDE.md` |

You can also `@prototype-annotation-mode.md` at the start of a chat if your tool supports file context.

### Typical workflow

1. Iterate with AI to build an interactive HTML/React prototype (this spec **augments**; it does not replace prototype generation).
2. Invoke this spec so the AI inventories pages and UI regions from chat context.
3. AI implements `AnnotationProvider`, `AnnotatedWrapper`, side rails, and a config registry.
4. Fill each anchor with three fields: `requirementLogic` / `displayRule` / `interactionLogic`.
5. Verify: toggle, bi-directional hover, overlay isolation, copy matches UI behavior.

See [`example/ExamplePage.tsx`](./example/ExamplePage.tsx) for a skeletal code layout.

---

## 📁 Repository layout

```
prototype-annotation-mode/
├── README.md                          # Chinese README
├── README.en.md                       # This file
├── LICENSE                            # MIT
├── prototype-annotation-mode.md       # Copy-paste prompt (synced with SKILL.md)
├── assets/                            # Demo screenshots / GIFs
├── example/
│   └── ExamplePage.tsx                # Pseudocode skeleton
└── skills/
    └── prototype-annotation-mode/
        ├── SKILL.md                   # Agent skill entry (Cursor, Claude Code, etc.)
        └── reference.md               # Implementation reference
```

---

## 📜 The prompt / skill source

The canonical prompt lives in:

- [`prototype-annotation-mode.md`](./prototype-annotation-mode.md) — single-file copy-paste version
- [`skills/prototype-annotation-mode/SKILL.md`](./skills/prototype-annotation-mode/SKILL.md) — agent skill entry with YAML frontmatter
- [`skills/prototype-annotation-mode/reference.md`](./skills/prototype-annotation-mode/reference.md) — directory layout, `pageKey` naming, rail positioning

The spec body is **bilingual (Chinese + English identifiers)** so it works across teams and tools. Key structural guarantees:

| Mechanism | Requirement |
|-----------|-------------|
| Layout | Centered device frame; left/right annotation rails when toggle is on |
| Cards | Fixed three fields per anchor: `requirementLogic`, `displayRule`, `interactionLogic` |
| Interaction | Bi-directional hover between UI anchors and side-rail cards |
| Overlay | Only register anchors inside `.overlay-screen`; block underlying page annotations |
| Data | `pageKey → Record<anchorId, AnnotationSpec>` registry |

<details>
<summary><strong>Expand: SKILL.md frontmatter & summary</strong></summary>

```yaml
---
name: prototype-annotation-mode
description: Generic spec and codegen template for mobile prototype annotation mode—toggle,
  centered device frame, side annotation rails, hover-linked highlight cards with
  requirementLogic/displayRule/interactionLogic. Use when building or documenting
  interactive prototypes, adding review annotations, or when the user mentions 批注模式,
  annotation mode, AnnotatedWrapper, or three-section spec cards.
---
```

**When to use**

- Building or refactoring interactive mobile prototypes that need a review overlay mode
- User asks for annotations, “annotation mode”, or three-section spec cards
- UI regions need pixel-anchored spec cards with hover linkage
- Debugging: annotations missing, hover broken, overlay leaking underlying annotations

**Minimal modules to implement**

| Module | Role |
|--------|------|
| `AnnotationProvider` | Global toggle, active anchor id, anchor registry, overlay isolation |
| `AnnotationToggle` | Annotation mode switch |
| `AnnotationSideRails` | Left/right rails + card positioning |
| `AnnotatedWrapper` | Wrap UI regions: dashed border + hover registration |
| `AnnotationCard` | Render title + three sections |
| `annotationRegistry` | `pageKey → Record<anchorId, AnnotationSpec>` |

For the full prompt text, open [`prototype-annotation-mode.md`](./prototype-annotation-mode.md).

</details>

---

## 🤝 Contributing & feedback

Open an [Issue](https://github.com/Kienqq518/prototype-annotation-mode/issues) with suggestions or share how you use annotation mode in your projects.

## 📄 License

[MIT](LICENSE) © [Kienqq518](https://github.com/Kienqq518)
