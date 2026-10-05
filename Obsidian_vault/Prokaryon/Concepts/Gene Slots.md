**Concept:** How many genes a genome can hold  
**Status:** Confirmed as a mechanic — paid gene capacity is treated as settled in the backlog

A genome is not unlimited. Slots are bought with [[Mutation Points]], and the count is what turns the [[Gene Catalog]] from a shopping list into a set of mutually exclusive strategies.

## Why a cap matters more than costs

If slots were free and only genes cost points, a long-running lineage would eventually hold everything and specialisation would disappear. Specification §6.5 decision D16 asks whether advanced technology is universally stronger or primarily more specialised, and a slot cap is what makes the second answer possible: a veteran player has *better* genes, not *all* genes.

Every strategy table in [[Metabolic Map]] depends on this. The aerobic specialist and the sediment chemotroph are distinct lineages only because no genome can comfortably carry both [[Oxidex Reductase (OXDR)]] with [[Oxidex Detoxase (OXDT)]] and [[Sulfex Reductase (SLFR)]] with [[Sulfex Permease (SLFP)]] alongside everything else they need.

## Distinct from the other two budgets

| Budget | Limits | Scope |
|---|---|---|
| Gene slots | Genes held in the genome | Species-wide |
| Editing slots | Edits maturing concurrently | Species-wide |
| [[Expression Capacity]] | Protein present at once | Per cell, per moment |

Slots decide what the lineage *is*; capacity decides what a given cell is *doing*. The backlog is explicit that these are separate accounting categories, and merging them would remove a decision each.

## Open decisions

- **Per-gene or per-construct accounting?** Backlog bundle R05 notes this changes how valuable it is to couple genes under one promoter. If a shared-promoter construct costs one slot regardless of how many genes it drives, coupling becomes strongly incentivised and requirement V24 gets a second purpose.
- **Deletion and reuse.** Backlog task S2-08 requires testing slot deletion and reuse as an economy exploit. If freeing a slot refunds points, a player can cycle genes to farm; if it refunds nothing, a beginner's mistake is permanent.
- **Do transferred genes consume slots?** Specification §8.3 asks whether progression prerequisites still apply to transferred content. If acquired genes are slot-free, [[Horizontal Gene Transfer]] becomes the dominant acquisition route; if they consume slots, [[Plasmid Maintainer (PLSM)]] needs its own accounting.

### Related
[[Mutation Points]] · [[Expression Capacity]] · [[Species]]
