**Field type:** Scalar, regional baseline plus local sources  
**Status:** Confirmed — requirement V09  
**Sensed by:** [[Thermoreceptor (THMR)]]  
**Adapted to by:** [[Heat Shock Protein (HSP)]], [[Cold Shock Protein (CSP)]], [[Membrane Saturase (MSAT)]], [[Membrane Desaturase (MDES)]]

Sets how fast everything happens and how quickly proteins and membranes fall apart. Temperature changes slowly and varies little across the distance a cell can travel, so it acts on lineages rather than on individuals.

## Gameplay role

| Effect | Consequence |
|---|---|
| Scales reaction rates | Warm water grows faster and starves faster |
| Stresses proteins above the optimum | Damage accumulates; [[Repairase (REPR)]] competes with growth |
| Stalls synthesis below the optimum | No death, but no [[Division]] and therefore no mutation points |

The asymmetry is deliberate: heat kills, cold wins by attrition. Specification §4.4 requires death to report a causal history, and a cold-stalled population is the case where nothing kills the cell and the lineage still loses.

## Two kinds of adaptation, two cost shapes

Specification §7.1 asks whether adaptation is a shifted optimum, broader tolerance, or both. The catalog offers both and lets each lineage answer separately:

| Gene | Effect | Paid |
|---|---|---|
| [[Heat Shock Protein (HSP)]] | Widens the upper range | Continuously, while stressed |
| [[Cold Shock Protein (CSP)]] | Widens the lower range | Continuously, while cold |
| [[Membrane Saturase (MSAT)]] | Moves the optimum upward | Once in material, permanently in lost range |
| [[Membrane Desaturase (MDES)]] | Moves the optimum downward | Once in material, permanently in lost range |

A shift specialist beats a widener inside its range and dies outside it, which is the specialist-versus-generalist test specification §1.3 asks the game to pass.

**The two shift genes are not mirror images.** [[Membrane Saturase (MSAT)]] costs [[Reducin]] and [[Membrane Desaturase (MDES)]] does not, so heat adaptation competes with [[Glycon Synthase (GLYS)]] for reducing power while cold adaptation competes only for carbon. Warm water is therefore harder to specialise into than cold water, which gives the two ends of the temperature range genuinely different economics rather than a reflected one.

## Open questions

- Is there a diurnal or seasonal cycle, or only spatial variation? Specification §7.4 and decision D18 leave world time undecided, and a cycling field would make [[Memory Latch (MEML)]] far more valuable.
- Do cells or dense colonies change local temperature? Currently no — unlike [[pH]], which players can engineer through [[Protopump (PPMP)]].

### Related
[[Homeostasis]] · [[Microniche]] · [[Flow]]
