**Gene ID:** FRMP  
**Gene Name:** Fermentate Permease  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Imports [[Fermentate]], the acidic waste other cells excrete when respiring without an electron acceptor. Somebody else's garbage, still holding usable energy.  
**Inputs:** [[Fermentate]] (extracellular)  
**Outputs:** [[Fermentate]] (intracellular)  
**Expression scaling:** [[Saturating Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Converted by [[Fluxidase (FLUX)]]; the water it is found in is acidic, so [[Acid Tolerase (ACDT)]] or [[Protopump (PPMP)]] is usually required alongside  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** The food is only ever where the conditions are worst. [[Fermentate]] accumulates in crowded anoxic water that its own producers have acidified, so a cross-feeder pays for acid tolerance to reach a fuel nobody else wants.

**It turns a dead end into a niche.** Without this gene, fermentation is purely self-poisoning: a colony acidifies its water and stalls. With it, a second lineage has a reason to sit next to the first, removing waste and being paid in energy for it.

Neither species evolved to cooperate and neither can be said to be helping. Specification §7.4 requires interaction benefits to follow material flows rather than relationship bonuses, and this is the cheapest example in the catalog to implement — two permeases and an existing enzyme.

**It is also a check on fermenters.** A habitat with established cross-feeders clears [[Fermentate]] faster, which raises the ceiling on the fermenting population that produced it. Removing the cross-feeder collapses both. That coupling is worth watching in the ecological stability tests specification §7.5 asks for.
