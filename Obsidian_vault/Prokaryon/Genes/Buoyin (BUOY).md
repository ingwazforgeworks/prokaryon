**Gene ID:** BUOY  
**Gene Name:** Buoyin  
**Category:** [[Morphology]]  
**Status:** Open — depends on how the depth axis is treated  
**Description:** Builds hollow protein compartments that lower the cell's density. The cell drifts along the depth axis with no motor, no steering and no energy cost once the vesicles are made.  
**Inputs:** [[Biomass]], [[ATP]] to build  
**Outputs:** Buoyancy — sustained passive drift toward shallower water  
**Expression scaling:** [[Linear Expression Scaling]]; buoyancy is proportional to vesicle volume  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Occupies internal volume that [[Granulin]] or [[Biomass]] could use, and offers no control at all. A buoyant cell rises whether or not the surface is where it should be, and cannot come back down except by expressing less — which takes a genome edit and its mandatory delay.  
**Design basis:** Cyanobacterial gas vesicles and buoyancy regulation.

**The purest expression of requirement V02.** There is no command and no response to conditions: the cell simply floats because of what it is. That makes BUOY the cheapest way to reach [[Light]] and the least forgiving, and it is deliberately in the catalog as a counterexample to the assumption that positioning requires motility.

**Gas fraction and ballast.** [[Floatin (FLOA)]] is these same vesicles, stated as a fraction of cell volume. [[Ballastin (BALA)]] packages reserves into dense granules and is the way back down. BUOY and FLOA share one vesicle budget.

**Open — the depth axis.** Requirement V14 confines gameplay to an XY plane with background depth, so buoyancy has to act along one of the two gameplay axes for this gene to mean anything. Whether the Y axis carries depth semantics is unresolved; if it does not, BUOY should be cut rather than reinterpreted. See [[Surfaces and Geometry]].
