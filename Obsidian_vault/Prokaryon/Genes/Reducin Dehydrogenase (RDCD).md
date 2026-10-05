**Gene ID:** RDCD  
**Gene Name:** Reducin Dehydrogenase  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Diverts the energy intermediate into reducing power. Converts [[Fluxin]] into [[Reducin]], the electron supply that biosynthesis needs and that [[ATP]] cannot substitute for.  
**Inputs:** [[Fluxin]] (intracellular)  
**Outputs:** [[Reducin]]  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Competes directly with [[ATP Synthase (ATPS)]] for the same [[Fluxin]] pool. Every unit of reducing power is a unit of energy the cell does not get, so an autotroph is permanently poorer in [[ATP]] than a heterotroph burning identical fuel.  
**Design basis:** Reverse electron transport and NAD(P)H generation. Exists because specification §2.4 requires carbon fixation to need reducing equivalents separately from energy, and this is the gene that makes that cost visible in the [[Personal Cell Map]].
