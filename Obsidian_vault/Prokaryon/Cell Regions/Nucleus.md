**Region Name:** Nucleus  
**Status:** Proposed — **and in conflict with the current specification. See the note at the bottom before building on this.**  
**Available from:** The eukaryotic transition only  
**Bounded by:** [[Nuclear Membrane]]

A compartment holding the genome, separated from the [[Cytosol]] by a membrane. Its presence changes one thing mechanically, and that one thing is large: **expression and metabolism stop sharing a room.**

### What the compartment actually changes

**Regulators must be sent there.** In a prokaryote a regulator meets its [[Operator Tag]] immediately, because both are loose in the same volume. With a nucleus, a regulator produced in the [[Cytosol]] only reaches the genome if it carries a [[NuclearLocalizationSignal]] — so regulation acquires a transport step the player can see and edit.

**Sensing gets slower and steadier.** A signal now crosses a membrane before it changes expression. That lag makes fast oscillation harder and sustained programmes easier, which is a real behavioural difference rather than a stat change. Confirmed requirement V30 puts regulators in the genome as expressed products; the nucleus makes *where* they are expressed matter too.

**Localization becomes a three-way choice.** [[Cytosol]], [[Plasma Membrane]], nucleus. Every regulator in the genome now has a destination decision attached to it, which is a meaningful expansion of [[Gene Modification]] rather than a new resource or a new number.

### What it does not change

A nucleus does not by itself grant larger genomes, faster growth, or better metabolism. Those would be progression rewards dressed as biology. The compartment's honest effect is on *regulation and timing*, and if the transition needs to feel like an upgrade, the upgrade should come from what the new regulatory control enables — not from the nucleus paying a dividend.

### Open questions

**What triggers the transition.** Endosymbiosis, genome size, a research threshold, or a player choice — undecided, and it determines whether this is an ecological event or a tech-tree node.

**Whether prokaryotes remain viable afterward.** If the nucleus is strictly better, every lineage takes it and the prokaryotic game is discarded halfway through. The transition needs a real cost — slower response, higher upkeep, a larger cell that diffuses worse — for the two forms to coexist.

**Whether it is per-species or world-wide.** Decisive for multiplayer, and unresolved.

---

> **Specification conflict.** Development specification decision **B02** and §2.2 place the eukaryotic transition **outside current scope**, on the grounds that it "would introduce substantially different mechanics and is a separate scope decision." This note exists because the design intent has changed to include it.
>
> That intent is not yet reflected in the specification, so **the specification and this vault currently disagree.** B02 and §2.2 should be revised to record the decision before any implementation work references this content. Flagged rather than silently contradicted, per §1.2's rule on conflicting sources.

### Related
[[Nuclear Membrane]] · [[NuclearLocalizationSignal]] · [[Cytosol]] · [[Regulation]] · [[Expression]]
