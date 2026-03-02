# Pit Wall Prediction Types (MVP)

## Prediction Catalog
| Type | Prompt Example | Resolve Rule |
|---|---|---|
| `CAUTION_WINDOW` | Caution in next 10 laps? | True if yellow/Safety Car event occurs in window |
| `PIT_WINDOW` | Will Driver X pit before lap N? | True if target logs pit stop before lap threshold |
| `UNDERCUT` | Will Driver Y gain net position post-pit? | True if next 3 laps show position gain after pit |
| `RESTART_LEADER` | Who leads after restart? | True if selected driver leads at first green timing line |
| `FASTEST_STOP` | Fastest pit stop this segment? | True if selected team has minimal stop time |
| `PIT_GAINER` | Most pit-cycle positions gained? | True if selected driver gains most during segment |

## Timing Rules
- Predictions lock once the relevant race window begins.
- No edits after lock.
- Resolution publishes immediately when criteria can be evaluated.
