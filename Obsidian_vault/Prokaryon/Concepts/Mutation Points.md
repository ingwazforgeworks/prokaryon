**Concept:** The currency earned by reproducing and spent on genetic change  
**Status:** Confirmed that division earns points — requirement V08. Everything else is open.

Specification §6.1 is blunt about the risk: a simple rule where every division earns points creates a positive feedback loop. More cells make more divisions, which buy more advantages, which make more cells. It can also reward repeated births and deaths, tiny fast-dividing cells, safe farming habitats, alternate-account feeding, and high turnover without any ecological success.

This is the balance problem most likely to break the game, and it is recorded here because several gene notes depend on how it lands.

## Reward formulations

| Formulation | Advantage | Disadvantage |
|---|---|---|
| Fixed points per division | Direct, intuitive, auditable | Strong compounding; selects for division speed |
| Diminishing as population or recent rewards grow | Limits runaway accumulation | Feels like punishment for success; needs transparent accounting |
| Weighted by physiological or ecological condition | Rewards meaningful success | Complex, manipulable, hard for players to predict |
| Fixed reward, escalating research costs | Preserves simple birth feedback | Creates grind, or merely delays domination |

A pure net-population-growth reward would change the stated premise and is only an option if the owner revisits requirement V08.

## Three costs that must stay separate

Specification §6.2 distinguishes them, and conflating any two creates a hole:

1. **Discovery or unlock** — access to a possible adaptation.
2. **Editing or installation** — committing a changed genome.
3. **Physiological** — maintaining and expressing the adaptation in living cells.

Buying a gene once must not make its expression free forever. Charging at every layer makes experimentation punitive. Decision D13 selects which costs use points and which use cellular resources.

## Why this blocks gene content

[[Size Regulator (SIZR)]] cannot exist until the reward formulation is chosen. If division pays a flat amount per event, minimising cell size is strictly optimal and no physiological penalty offsets unbounded compounding income. Specification §6.1 names small fast-dividing cells as a specific exploit and backlog task S2-08 requires that scenario to be tested, along with rapid division and death, duplicate purchase, and slot deletion and reuse.

[[Sporulase (SPOR)]] is affected from the other direction: a dormant cell never divides and therefore earns nothing, which is its real cost.

## Other open decisions

- **D14 — ownership.** Are points held by a cell, strain, species, habitat run, or account? This changes transfer, extinction, offline play and multiplayer fairness.
- **D15 — reversibility.** Can players refund, respec, duplicate blueprints, or recover an earlier genome? Free respec supports exploration and enables instant counter-builds; irreversible purchases create stakes and can trap a beginner.

### Related
[[Division]] · [[Gene Slots]] · [[Extinction]] · [[Species]]
