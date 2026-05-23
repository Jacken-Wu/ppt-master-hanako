# PPT Master — Hanako Plugin

> AI generates natively editable PPTX from any document — real PowerPoint shapes (DrawingML), not images.

Converts source documents (PDF / DOCX / URL / Markdown) into natively editable PPTX through a multi-role AI collaboration pipeline.

## Architecture

```
Source → Convert → Strategist (Design Spec) → Image Gen → Executor (SVG) → Post-process → PPTX
```

This is a **Hanako adaptation** of the [ppt-master](https://github.com/hugohe3/ppt-master) Claude Code plugin by Hugo He. The core Python scripts, SVG templates, and reference documents are preserved from the original; the orchestration layer is rewritten for Hanako's plugin system.

## Structure

```
ppt-master-hanako/
├── manifest.json           # Plugin identity & capabilities
├── index.js                # Plugin lifecycle & bus handlers
├── tools/                  # Agent-callable tools
│   ├── convert-source.js   # PDF/DOCX/XLSX/PPTX/URL → Markdown
│   ├── manage-project.js   # Project init, import, validate, list
│   ├── image-generation.js # AI image analysis & generation
│   ├── post-process.js     # Split, finalize, export, quality check
│   └── live-preview.js     # SVG live preview server
├── routes/                 # HTTP routes (iframe UI)
│   ├── preview.js          # Slide preview card
│   └── project-card.js     # Project status card
├── skills/ppt-master/      # AI workflow definition
│   ├── SKILL.md            # Main workflow (10 steps)
│   ├── workflows/          # 8 standalone workflows
│   ├── references/         # Role definitions & tech specs
│   ├── scripts/            # Python execution scripts
│   ├── templates/          # Layouts, brands, charts, icons
│   └── requirements.txt    # Python dependencies
└── projects/               # Generated project workspace
```

## Installation

1. Copy `ppt-master-hanako/` to your Hanako plugins directory (e.g. `${HANA_HOME}/plugins/` or `plugins-dev/`)
2. Install Python dependencies: `pip install -r skills/ppt-master/requirements.txt`
3. Enable the plugin in Hanako Settings > Plugins

## Usage

The agent will automatically use the `ppt-master` skill when you ask to create a presentation. The skill guides a 10-step pipeline:

1. **Source Processing** — Convert your document to Markdown
2. **Project Creation** — Initialize a project workspace
3. **Template** — Apply layout/brand/chart templates (optional)
4. **Strategist** — Eight confirmations on design direction
5. **Design Specification** — Generate `spec_lock.md` and `design_spec.md`
6. **Image Generation** — AI images based on the spec
7. **Executor** — Generate SVG pages one by one
8. **Quality Check** — Validate SVGs
9. **Post-processing** — Split notes, finalize SVGs, export PPTX
10. **Delivery** — Present the output PPTX

## Tools

| Tool | Action | Description |
|------|--------|-------------|
| `ppt-master_convert-source` | convert | Convert PDF/DOCX/XLSX/PPTX/URL to Markdown |
| `ppt-master_manage-project` | manage | Init/import-sources/validate/list projects |
| `ppt-master_image-generation` | generate | Analyze images or generate AI images |
| `ppt-master_post-process` | process | Split notes, finalize SVG, export PPTX, quality check |
| `ppt-master_live-preview` | preview | Start/stop/status live SVG preview server |

## Routes

| Route | Purpose |
|-------|---------|
| `/preview?project=<name>` | Iframe slide preview card |
| `/project-card?project=<name>` | Project pipeline status card |

## Credits

Original ppt-master by [Hugo He](https://github.com/hugohe3). MIT License.
Hanako adaptation by Hanako plugin system.
