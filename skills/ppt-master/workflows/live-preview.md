# Live Preview Workflow

**When to use**: Any time the user mentions "live preview", "preview", "看效果", or wants to click/select a slide element.

## Starting Preview

During generation (SKILL.md Step 7), the preview server auto-starts. After that, or for re-entry:

```yaml
tool: ppt-master_live-preview
params:
  action: "start"
  projectPath: "<project_path>"
  port: 8765
```

The server opens a browser-based SVG viewer at `http://localhost:8765`.

## Viewing in Chat

To show slides inline, the agent can reference the preview route:
```
Route: /preview?project=<project_name>
```

This renders SVG thumbnails as an embedded iframe card.

## Applying Annotations

The live preview server supports element-level annotations. After the user makes annotations:
1. Read the annotation files from `<project>/annotations/` or from the server output.
2. Apply edits to the SVG files.
3. Re-run the post-processing pipeline if needed.

## Stopping Preview

```yaml
tool: ppt-master_live-preview
params:
  action: "stop"
  projectPath: "<project_path>"
```
