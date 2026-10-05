**Concept:** The diagnostic view of one cell  
**Status:** Confirmed — requirement V25

The interface that explains why a cell is doing what it is doing. Referenced throughout this wiki because almost every gene has a failure mode that is invisible without it.

## What it must distinguish

Requirement V25 requires abundance and localization, and target, actual and pending states, to be correctly separated. Specification §5.5 adds that the interface must explain why a gene is inactive or a structure has not appeared.

| Shown | Why it is not obvious |
|---|---|
| Installed genes | A maturing edit is not yet installed |
| Target expression | What the promoter is asking for |
| Actual expression | What resources and [[Expression Capacity]] allowed |
| Assembled machinery | Protein exists but the structure may not |
| Localization | Where it ended up, in a visible reference frame |
| Regulator abundance | [[Repressor (REPX)]] suppression is gradual, not Boolean |
| Receptor readings | And whether the receptor exists at all |
| Pending edits | What is maturing and when it lands |

## The failure modes it has to name

Each of these looks like a bug to a player who cannot see the cause:

- **Missing receptor.** A promoter condition referencing a quantity no receptor measures does not evaluate false — it fails to evaluate. Requirement V26 depends on this being visible; see [[Perception]].
- **Tag mismatch.** A [[Repressor (REPX)]] whose [[Operator Tag]] matches nothing is expressed, costs capacity, and does nothing.
- **Missing prerequisite.** [[Reaction Center (RXNC)]] without [[Chlorin]] produces nothing.
- **Unreachable store.** A starving cell with full [[Granulin]] and too little [[ATP]] to run [[Granulin Hydrolase (GRNH)]] dies with a full larder.
- **Capacity starvation.** Target expression far above actual, because everything is competing.
- **Acquired but not expressed.** A transferred gene present and doing nothing — specification §8.3 requires this distinction to be explained.
- **Not dividing.** [[Repairase (REPR)]] consuming the resources [[Anabolase (ANAB)]] needs produces a stable population earning no [[Mutation Points]]. This looks like success and is a slow loss.

## Causal history, not a final number

Specification §4.4 requires death causes to report their causal history rather than merely a final damage value, and backlog task S1-19 requires a short causal history plus before-and-after comparison for a committed edit. [[Damage Receptor (DMGR)]] is deliberately unspecific about what is hurting the cell — the *cell* does not know. The player should.

## The knowledge boundary — D08

Specification §3.1 has not chosen between full overlays, sensor-limited information, and basic diagnostics with optional sensing. This matters for more than interface polish: full overlays make the player near-omniscient while their cells are not, which is a gap the [[Perception]] category relies on but which could also make [[Chemoreceptor (CHMR)]] feel pointless if handled carelessly.

### Related
[[Expression]] · [[Perception]] · [[Regulation]] · [[Localization]]
