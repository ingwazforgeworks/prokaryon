**Gene ID:** ACDT  
**Gene Name:** Acid Tolerase  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Reconfigures the cell's proteins and envelope to function across a wider range of [[pH]] instead of defending one narrow optimum. The cell stops caring about pH rather than controlling it.  
**Inputs:** [[Biomass]] and [[ATP]] to build the tolerant variants  
**Outputs:** A flattened acidity response curve  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol and cell membrane  
**Tradeoff:** Tolerant machinery is less efficient machinery. The cell grows more slowly everywhere, including in perfectly neutral water, so a tolerase lineage is permanently outcompeted in the comfortable middle of the habitat.  
**Design basis:** Acid-adapted enzyme and membrane variants.

**The widen option.** Specification §7.1 asks whether adaptation is a shifted optimum, broader tolerance, or both. ACDT is the broad-tolerance answer and [[Protopump (PPMP)]] is the active-defence answer, and they fail in opposite ways:

| | ACDT | [[Protopump (PPMP)]] |
|---|---|---|
| Cost shape | One-off build, permanent growth penalty | Continuous energy drain |
| In neutral water | Still paying | Free — it switches off |
| In extreme acid | Survives, slowly | Survives until [[Fluxin]] runs short |
| Changes the environment | No | Yes, acidifies it |

A tolerase cell can live in a [[Fermentate]]-soaked niche that an exporter cell cannot afford to defend, which is how a slow generalist earns a place against a faster specialist — the outcome specification §1.3 wants to be possible.
