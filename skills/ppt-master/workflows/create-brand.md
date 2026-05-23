# Create Brand Workflow

**When to use**: User asks to "set up brand" / "建立品牌" / "做品牌规范", provides brand assets (logo / brand site / branded PPTX / brand PDF), or wants to extract a brand from existing materials.

## Prerequisites

- User provides brand assets in some form.

## Steps

1. Read `references/template-designer.md` for brand creation rules.
2. Extract color palette, typography, logo, and voice from materials.
3. Create brand directory under `templates/brands/<brand-id>/`.
4. Create brand configuration file (`brand.json`) with:
   - Color palette
   - Font specifications
   - Logo SVG
   - Voice and tone guidelines
5. Update `templates/brands/brands_index.json`.
6. Apply the brand to a project by specifying the brand directory path at SKILL.md Step 3.

## Rule

- Bare brand names never trigger. The user must supply the brand directory path explicitly.
