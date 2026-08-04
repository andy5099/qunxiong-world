# Jotem Animation Mapping

The source `Jotem.aseprite` was parsed directly. No animation names were inferred from appearance alone.

| Runtime action | Source export | Frames | FPS | Loop | Evidence |
|---|---|---:|---:|---|---|
| idle | row-00 | 6 | 10 | yes | `idle 1 old`, source frames 0–5 |
| walk | row-01 | 8 | 10 | yes | `walk swordback`, source frames 12–19 |
| skill / item use | row-06 | 10 | 10 | no | `Item`, source frames 42–51 |
| attack | row-07 | 10 | 10 | no | `atk`, source frames 52–61 |
| hurt | row-08 | 5 | 10 | no | `hurt`, source frames 62–66 |
| death | row-09 → row-10 → row-11 | 12 + 12 + 6 | 10 | no | `Death`, source frames 67–96 |
| jump | row-04 | 3 | 10 | no | `jump`, source frames 34–36 |
| fall | row-05 | 5 | 10 | no | `Fall`, source frames 37–41 |

`Idle swordback` is an alternate six-frame source tag that the supplied row exports intentionally omit. It is not mapped or fabricated.
