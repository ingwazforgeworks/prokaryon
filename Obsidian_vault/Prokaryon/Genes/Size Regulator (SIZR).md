**Gene ID:** SIZR  
**Gene Name:** Size Regulator  
**Category:** [[Morphology]]  
**Status:** Open — specification §4.4 has not settled whether size is evolvable  
**Description:** Sets the [[Biomass]] threshold at which the cell commits to [[Division]]. Small cells divide often and cheaply; large cells divide rarely and carry more reserves.  
**Inputs:** None directly; alters the division threshold  
**Outputs:** Target size at division  
**Expression scaling:** [[Linear Expression Scaling]] over a bounded range  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Small cells have more surface per volume and therefore better uptake, but less room for [[Granulin]] stores and less tolerance of a bad patch. Large cells survive famine and are easier for [[Bdellase (BDEL)]] to find and worth more to eat.  
**Design basis:** Division size control and the surface-to-volume constraint.

[[Cyclin (CYCL)]] is the other gene that changes how often division happens. It does not move the size target; it commits early while expressed, and it is Open for the same reason.

**The most dangerous lever in the catalog.** Division is the source of mutation points under requirement V08, so anything that changes division rate changes the economy directly. Specification §6.1 names small fast-dividing cells as a specific farming exploit, and backlog task S2-08 requires that scenario to be tested explicitly.

That is why this entry stays Open. It is not a balance problem to be tuned later: if division reward is flat per event, SIZR minimised is strictly optimal and no amount of physiological penalty will offset an unbounded compounding income. The reward formulation in [[Mutation Points]] has to be settled before this gene can exist at all.

The same caution applies to [[Shape Determinant (SHPD)]] for different reasons — see [[Morphology]].
