**Gene ID:** SIDS  
**Gene Name:** Siderin Synthase  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Secretes [[Siderin]], a chelator that binds mineral iron and carries it into solution. Frees [[Ferron]] from [[Ferracite]] at a distance, without the cell needing to touch the mineral.  
**Inputs:** [[Glycon]] or [[Lipron]] (carbon), [[ATP]]  
**Outputs:** [[Siderin]] (extracellular), which releases [[Ferron]] into shared water  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Requires [[Ferracite]] within diffusion range and [[Ferron Permease (FERP)]] to benefit  
**Default Localization:** Extracellular  
**Tradeoff:** The producer pays in carbon and energy; the product is a dissolved nutrient anybody can absorb. A neighbour carrying only the permease eats exactly as well and pays nothing.  
**Design basis:** Siderophore secretion and iron chelation.

**The least ambiguous public good in the catalog.** Specification §7.4 lists secreted enzymes benefiting non-producers as the mechanism behind public-goods exploitation, and this gene is the cleanest instance: no digestion step, no contact requirement, just an expensive molecule released into water that anyone can drink from.

**Range bought with leakage.** [[Ferracite Reductase (FCTR)]] extracts the same resource by contact and keeps it close. The two genes are a matched pair — same fuel, opposite exposure — and choosing between them is choosing between mobility and defensibility. The comparison table is in [[Siderin]].

Cooperation survives here only through spatial assortment: [[Cohesin (COHS)]] keeping cells of the same type adjacent, so a producer's neighbours are mostly other producers.
