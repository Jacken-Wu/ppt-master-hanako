# Generate Audio Workflow (Narration)

**When to use**: After post-processing, if the user wants recorded narration / voiceover / video export.

## Prerequisites

- Post-processing pipeline complete.
- Speaker notes exist in the project.

## Steps

1. Read speaker notes from the split markdown files.
2. Run the audio generation tool (requires `edge-tts`):
   ```bash
   python3 ${SKILL_DIR}/scripts/notes_to_audio.py <project_path>
   ```
3. Audio files are generated per slide in `<project>/audio/`.
4. Run the PPTX re-export with narration embedded:
   ```bash
   python3 ${SKILL_DIR}/scripts/svg_to_pptx.py <project_path> --with-audio
   ```

## Requirements

- `edge-tts` Python package must be installed.
- On Windows, edge-tts works out of the box. On macOS/Linux, no special setup needed.
