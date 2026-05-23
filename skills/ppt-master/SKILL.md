---
name: ppt-master
description: >
  AI-driven presentation generation system. Converts source documents
  (PDF/DOCX/URL/Markdown) into natively editable PPTX through multi-role
  collaboration. Use when user asks to "create PPT", "make presentation",
  "生成PPT", "做PPT", "制作演示文稿", or mentions "ppt-master".
---

# PPT Master Skill (Hanako)

> AI-driven multi-format SVG content generation system. Converts source documents into natively editable PPTX through multi-role collaboration.

**Core Pipeline**: `Source Document → Create Project → [Template] → Strategist → [Image_Generator] → Executor → Quality Check → Post-processing → Export`

> [!CAUTION]
> ## 🚨 Global Execution Discipline (MANDATORY)
>
> 1. **SERIAL EXECUTION** — Steps MUST be executed in order.
> 2. **BLOCKING = HARD STOP** — Steps marked ⛔ BLOCKING require a full stop; wait for explicit user response.
> 3. **NO CROSS-PHASE BUNDLING** — Do not skip ahead or prepare content for later steps.
> 4. **GATE BEFORE ENTRY** — Verify each Step's prerequisites (🚧 GATE).
> 5. **NO SPECULATIVE EXECUTION** — Writing SVG code during Strategist phase is FORBIDDEN.
> 6. **SVG MUST BE HAND-WRITTEN** — Every SVG page is authored by the main agent directly. No script-generated batch SVG production.
> 7. **SEQUENTIAL PAGE GENERATION** — SVG pages MUST be generated sequentially one by one.
> 8. **SPEC_LOCK RE-READ PER PAGE** — Before each SVG page, re-read `spec_lock.md` for colors/fonts/icons/images.

> [!IMPORTANT]
> ## Language & Communication Rule
> - Response language: match the user's input and source materials.
> - Template format: `design_spec.md` MUST follow the original English template structure.

## Plugin Tools

This skill is bundled as a Hanako plugin. The following tools are available:

| Tool | Description |
|------|-------------|
| `ppt-master_convert-source` | Convert PDF/DOCX/XLSX/PPTX/URL to Markdown |
| `ppt-master_manage-project` | Init/import-sources/validate/list projects |
| `ppt-master_image-generation` | Analyze images, generate AI images, render prompts |
| `ppt-master_post-process` | Split notes, finalize SVG, export PPTX, quality check, update spec |
| `ppt-master_live-preview` | Start/stop/status live SVG preview server |

## Convention: `${SKILL_DIR}`

`${SKILL_DIR}` refers to the plugin's `skills/ppt-master/` directory.
When running Python scripts, the tool functions handle path resolution automatically.
When reading reference files, resolve them relative to `${SKILL_DIR}`.

## Main Pipeline Scripts

| Script | Purpose |
|--------|---------|
| `${SKILL_DIR}/scripts/source_to_md/pdf_to_md.py` | PDF to Markdown |
| `${SKILL_DIR}/scripts/source_to_md/doc_to_md.py` | Documents to Markdown |
| `${SKILL_DIR}/scripts/source_to_md/excel_to_md.py` | Excel to Markdown |
| `${SKILL_DIR}/scripts/source_to_md/ppt_to_md.py` | PowerPoint to Markdown |
| `${SKILL_DIR}/scripts/source_to_md/web_to_md.py` | Web page to Markdown |
| `${SKILL_DIR}/scripts/project_manager.py` | Project init / validate / manage |
| `${SKILL_DIR}/scripts/analyze_images.py` | Image analysis |
| `${SKILL_DIR}/scripts/image_gen.py` | AI image generation (multi-provider) |
| `${SKILL_DIR}/scripts/svg_quality_checker.py` | SVG quality check |
| `${SKILL_DIR}/scripts/total_md_split.py` | Speaker notes splitting |
| `${SKILL_DIR}/scripts/finalize_svg.py` | SVG post-processing |
| `${SKILL_DIR}/scripts/svg_to_pptx.py` | Export to PPTX |
| `${SKILL_DIR}/scripts/update_spec.py` | Propagate spec_lock changes across SVGs |

**When running these scripts, use the `ppt-master_post-process` tool** rather than constructing shell commands directly.

## Reference Files

| Reference | Path | Purpose |
|-----------|------|---------|
| Strategist role | `${SKILL_DIR}/references/strategist.md` | Strategist workflow and rules |
| Executor base | `${SKILL_DIR}/references/executor-base.md` | Executor SVG generation rules |
| Shared standards | `${SKILL_DIR}/references/shared-standards.md` | SVG/PPT technical constraints |
| Canvas formats | `${SKILL_DIR}/references/canvas-formats.md` | Canvas format options |
| Image generator | `${SKILL_DIR}/references/image-generator.md` | AI image generation rules |
| Template designer | `${SKILL_DIR}/references/template-designer.md` | Template creation rules |

## Template Index

| Index | Path | Purpose |
|-------|------|---------|
| Layout templates | `${SKILL_DIR}/templates/layouts/layouts_index.json` | Available page layout templates |
| Brand presets | `${SKILL_DIR}/templates/brands/brands_index.json` | Brand identity presets |
| Visualization templates | `${SKILL_DIR}/templates/charts/charts_index.json` | Visualization SVG templates |
| Icon library | `${SKILL_DIR}/templates/icons/` | See `${SKILL_DIR}/templates/icons/README.md` |

## Standalone Workflows

| Workflow | Path | When to Use |
|----------|------|-------------|
| `topic-research` | `workflows/topic-research.md` | User provides only a topic, no source files |
| `resume-execute` | `workflows/resume-execute.md` | Resume Phase B in a fresh chat after Phase A completed |
| `verify-charts` | `workflows/verify-charts.md` | Deck contains data charts (calibrate coordinates) |
| `customize-animations` | `workflows/customize-animations.md` | User wants object-level animation tuning |
| `live-preview` | `workflows/live-preview.md` | User mentions "preview" or wants to see SVG |
| `generate-audio` | `workflows/generate-audio.md` | Recorded narration / video export |
| `create-template` | `workflows/create-template.md` | Standalone layout template creation |
| `create-brand` | `workflows/create-brand.md` | Brand identity setup from assets |

---

## Workflow

### Step 1: Source Content Processing

🚧 **GATE**: User has provided source material (PDF / DOCX / EPUB / URL / Markdown / text description / conversation content).

> **No source content?** Run the `topic-research` workflow first, then return here.

When the user provides non-Markdown content, convert using `ppt-master_convert-source`:

| Type | Source |
|------|--------|
| PDF | type=`pdf`, source=`<file_path>` |
| DOCX/Word | type=`doc`, source=`<file_path>` |
| XLSX/XLSM | type=`excel`, source=`<file_path>` |
| PPTX | type=`ppt`, source=`<file_path>` |
| URL | type=`web`, source=`<URL>` |
| Markdown | type=`markdown`, source=`<file_path>` |

✅ After conversion, you have Markdown content ready for Strategist analysis.

⛔ **BLOCKING**: Present the extracted content to the user. Confirm the user wants to proceed before continuing.

---

### Step 2: Create Project

🚧 **GATE**: Source content is confirmed. You have Markdown text ready.

Create a new project using `ppt-master_manage-project`:

```
action: "init"
projectName: <project_name>     # short English name, e.g. "my_presentation"
format: "ppt169"                # ppt169 (16:9) or ppt43 (4:3)
```

The project is created in the plugin's projects directory. Note the project path.

Optional: Copy the converted source Markdown into the project's `sources.md`.

---

### Step 3: [Optional] Apply Template

🚧 **GATE**: Project is created.

If the user provided a layout template, brand, or chart template path, load its references.

Browse available templates:
- Layout templates: read `templates/layouts/layouts_index.json`
- Brand presets: read `templates/brands/brands_index.json`
- Chart templates: read `templates/charts/charts_index.json`

Read the corresponding template files and incorporate them into the design specification.

---

### Step 4: Strategist — Eight Confirmations (⛔ BLOCKING)

🚧 **GATE**: Project exists. Source content is ready. Template applied (if any).

**Role**: Act as the **Strategist**. Read `references/strategist.md` first.

The Strategist must produce eight confirmations with the user before writing any design specification:

1. **Purpose & Audience** — Confirm the core message
2. **Slide Structure** — Outline slide by slide
3. **Content per Slide** — Key points for each slide
4. **Visual Style** — Color palette, font choices, image style
5. **Data Visualization** — Charts, diagrams, tables
6. **Tone & Rhythm** — Formal vs casual, dense vs breathing
7. **Special Effects** — Animations, transitions, media
8. **Slide Count Review** — Final number of slides

⛔ **BLOCKING**: After presenting the eight confirmations, you MUST stop and wait for the user to respond to each confirmation. Do NOT proceed until the user has confirmed.

---

### Step 5: Strategist — Design Specification

🚧 **GATE**: User has confirmed all eight points.

Now produce two files in the project directory:

1. `design_spec.md` — Full design specification. Read `templates/design_spec_reference.md` for structure.
2. `spec_lock.md` — Machine-readable spec lock. Read `templates/spec_lock_reference.md` for format. This file is the single source of truth for colors, fonts, icon references, and layout grid.

After writing both files, present the spec to the user.

⛔ **BLOCKING**: Wait for user confirmation of the specification before proceeding.

---

### Step 6: Image Generation (Optional)

🚧 **GATE**: `spec_lock.md` exists. The design calls for generated images.

**Role**: Act as the **Image Generator**. Read `references/image-generator.md` first.

1. Generate image prompts based on `spec_lock.md` content
2. Create `<project>/images/` directory with `image_prompts.json` manifest
3. Call `ppt-master_image-generation` with `action: "generate"` and `manifestPath`
4. Analyze generated images with `action: "analyze"` and `projectPath`

---

### Step 7: Executor — SVG Generation

🚧 **GATE**: `spec_lock.md` exists and is confirmed. Images are generated (if applicable).

**Role**: Act as the **Executor**. Read `references/executor-base.md` and the relevant executor reference for the visual style (e.g., `executor-general.md`, `executor-consultant.md`).

Also read `references/shared-standards.md` and `references/canvas-formats.md` for technical constraints.

**Rules** (from Global Execution Discipline above):
- SVG pages MUST be written sequentially, one page at a time
- Before each page, `read_file <project_path>/spec_lock.md` for colors/fonts/icons/images
- Each page references `page_rhythm`, `page_layouts`, `page_charts` from spec_lock
- SVG MUST be hand-written, not script-generated

After generating SVGs into `<project>/svg/`, run:
- `ppt-master_live-preview` with `action: "start"` — so the user can preview results

---

### Step 8: Quality Check

🚧 **GATE**: All SVG pages generated. Preview server running.

Run quality checker:
```
ppt-master_post-process action: "quality-check" projectPath: "<project_path>"
```

Review the quality report. Fix any issues flagged.

If SVGs look correct, stop the preview server:
```
ppt-master_live-preview action: "stop" projectPath: "<project_path>"
```

---

### Step 9: Post-processing Pipeline

🚧 **GATE**: SVGs pass quality check. Preview confirmed.

Run these actions of `ppt-master_post-process` in order:

1. `action: "split"` — Split speaker notes from SVG files
2. `action: "finalize"` — Finalize SVG files (embed images, apply effects)
3. `action: "export"` — Export to PPTX (Runs `svg_to_pptx.py`)

Each must succeed before moving to the next.

---

### Step 10: Delivery

🚧 **GATE**: `output.pptx` exists in project directory.

Confirm the output PPTX path with the user.

For the live preview route, point them to the project card:
```
ppt-master_live-preview action: "status"
```

To view project status in chat, the agent can reference route `/project-card?project=<project_name>`.

---

## Phase B Resumption

When the user opens a fresh chat and says "继续生成 projects/<x>", run the `resume-execute.md` workflow to enter Phase B (SVG generation + export) without repeating Phase A.
