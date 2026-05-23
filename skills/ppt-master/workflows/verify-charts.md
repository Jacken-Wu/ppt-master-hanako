# Verify Charts Workflow

**When to use**: Between SVG generation and post-processing, if the deck contains data charts.

## Prerequisites

- All SVG pages are generated in `<project>/svg/`.
- Some pages have chart SVG elements.

## Steps

1. Read `spec_lock.md` for the `page_charts` section to understand chart types per page.
2. For each chart SVG, verify:
   - Data values correctly rendered (labels, numbers, scales).
   - Chart element positions match the layout grid.
   - Colors match the spec_lock palette.
3. Use `ppt-master_post-process` with `action: "quality-check"` to validate.
4. Fix any coordinate or rendering issues directly in the SVG files.
5. Re-run `ppt-master_post-process` `action: "quality-check"` to confirm fixes.
