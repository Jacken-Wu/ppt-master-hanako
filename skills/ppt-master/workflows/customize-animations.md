# Customize Animations Workflow

**When to use**: User explicitly asks to change animation order, effect, timing, or a specific object's reveal behavior.

## Prerequisites

- SVGs generated. Post-processing not yet run (or will be re-run).

## Steps

1. Read `references/animations.md` for animation capabilities and constraints.
2. Scaffold animation configuration:
   ```
   ppt-master_post-process action: "animate-scaffold" projectPath: "<project_path>"
   ```
3. The scaffold creates `<project>/animations.json`. Edit this file to set:
   - Per-object animation effects (fade, slide, zoom, etc.)
   - Timing and delays
   - Animation order
4. Validate animation configuration:
   ```
   ppt-master_post-process action: "animate-validate" projectPath: "<project_path>"
   ```
5. Re-run post-processing:
   - `action: "split"`
   - `action: "finalize"`
   - `action: "export"`

## Notes

- Do NOT create `animations.json` unless customization was explicitly requested.
- Default export already includes global slide-level animations.
