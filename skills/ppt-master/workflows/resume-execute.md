# Resume Execute Workflow (Phase B)

**When to use**: User opens a fresh chat and says "继续生成 projects/<x>" or similar. This workflow enters Phase B (SVG generation + export) without re-running Phase A.

## Prerequisites

- Project exists with `spec_lock.md`, `design_spec.md`, and optionally `images/`.
- Phase A (Steps 1-5) was completed in a previous session.

## Steps

1. **Validate project**: Run `ppt-master_manage-project` with `action: "validate"` and the project path.
2. **Read spec_lock.md**: Read the file to understand the design spec. This is the single source of truth.
3. **Read references**: Read `references/executor-base.md` and the appropriate executor style reference.
4. **Image Generation** (if needed): Check if `<project>/images/image_prompts.json` exists. If images haven't been generated, run the image generation step.
5. **SVG Generation**: Execute Step 7 from SKILL.md (sequential SVG generation).
6. **Quality Check**: Run Step 8-9 from SKILL.md.
7. **Delivery**: Point to the output PPTX.

## Important

- Do NOT re-run Strategist or Design Spec phases.
- The `spec_lock.md` is the contract — all colors/fonts/images come from it.
- If the user wants to modify the design, they must update spec_lock.md first.
