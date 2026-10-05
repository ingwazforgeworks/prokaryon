**Gene ID:** AQUP  
**Gene Name:** Aquaporin  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** A gated water channel. Lets the cell move water across its membrane far faster than passive leakage allows, and close the channel to slow an unwanted flux. Immediate response, no storage.  
**Inputs:** Membrane tension state; negligible energy  
**Outputs:** Controlled water flux  
**Expression scaling:** [[Threshold Scaling]] — gating, not throughput  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Most useful with [[Osmoreceptor (OSMR)]] supplying the gating condition  
**Default Localization:** Cell membrane  
**Tradeoff:** Fast and shallow. Aquaporin buys the cell seconds, not a steady state: it can survive a shock in a salinity boundary but cannot live on the far side of one without [[Osmolyn Synthase (OSMS)]]. A stuck-open channel makes a sudden change worse rather than better.  
**Design basis:** Aquaporin water channels and mechanosensitive release.

**Why two osmotic genes exist.** Specification §7.1 asks whether osmotic adaptation is reversible or specialised, and the honest answer is that the two timescales need different machinery. Aquaporin handles the transient; [[Osmolyn Synthase (OSMS)]] handles the sustained condition. A dispersing lineage crossing between [[Salinity]] zones needs both, and that double cost is what makes those boundaries matter for [[Microniche]] separation.
