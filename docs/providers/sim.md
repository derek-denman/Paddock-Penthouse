# SIM Provider Notes

SIM mode is deterministic and always available for local dev, CI, and demos.

## Core Requirements
- Emit normalized events on a timeline.
- Produce reproducible output with optional seed value.
- Drive the same scoring pipeline as live providers.
- Remain automatic fallback path when `LIVE_WITH_SIM_FALLBACK` cannot use an upstream live provider.
