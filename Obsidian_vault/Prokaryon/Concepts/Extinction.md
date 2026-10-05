**Concept:** How a continuation ends  
**Status:** Open — decisions D05, D06 and D27 unresolved

Requirement V06 confirms that a cell's death transfers play to a survivor, and requirement V07 confirms that population extinction ends the current continuation. What counts as the population, and what survives the ending, are both undecided.

## The boundary question — D06

| Boundary | Consequence |
|---|---|
| All owned cells in one habitat | Easy to explain and to compute |
| Across linked regions | Matches dispersal; harder to track |
| Across the whole service | Severe stakes; difficult offline accounting |

## Do dormant cells count?

Specification §3.1 decision D06 asks this directly, and [[Sporulase (SPOR)]] cannot be balanced until it is answered. If dormant cells are alive, dormancy is a safety net and extinction accounting must track sleeping populations across regions and restarts. If they are not, a run can end while cells still exist — which is harsh but simple, and makes [[Sporulase (SPOR)]] a gamble rather than insurance.

## Dormancy is not logging out

These will be confused with each other unless both are written down:

| | [[Sporulase (SPOR)]] dormancy | Player absence |
|---|---|---|
| Chosen by | The cell's genes and promoter conditions | The player closing the game |
| Governed by | Specification §4.4 | Decision D27, backlog S2-09 and S5-09 |
| While inactive | Occupies space, tolerates stress, earns nothing | Subject to retained-population attrition |

The backlog notes that active offline cells are optional under the amended logout direction, and that retained-population attrition and similar-environment return both require explicit policy. Requirements V19 and V20 own that lifecycle.

## What remains afterwards — D05

| Option | Advantage | Disadvantage |
|---|---|---|
| Nothing in the run | Real stakes | Repetition risk |
| Blueprints and knowledge | Learning persists | Weaker sense of loss |
| Permanent unlocks | Clear progression | Veteran advantage; grind risk |

This interacts with [[Mutation Points]] decision D14 on whether points belong to a cell, strain, species, run or account. An account-scoped currency makes extinction much less meaningful than a run-scoped one.

## Choosing the next focal cell — D09

Requirement V06 requires continuation not to depend on one privileged cell. Specification §3.1 offers automatic selection of the nearest healthy survivor, a manual list or map, or automatic with override. Specification §4.4 adds a constraint that applies regardless: changing the focal cell must have no physiological effect unless explicitly designed, and specification §3.2 forbids camera or focus changes from improving a cell's simulation fidelity in a way that changes its competitive success.

### Related
[[Species]] · [[Division]] · [[Reproduction]] · [[Mutation Points]]
