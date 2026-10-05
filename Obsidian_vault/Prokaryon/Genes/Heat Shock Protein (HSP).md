**Gene ID:** HSP  
**Gene Name:** Heat Shock Protein  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Holds proteins in their working shape as [[Temperature]] rises, and refolds those that have already come apart. Extends the range over which the cell functions without changing where it functions best.  
**Inputs:** [[ATP]]  
**Outputs:** Reduced thermal damage; widened upper temperature tolerance  
**Expression scaling:** [[Linear Expression Scaling]], driven well by a [[Thermoreceptor (THMR)]] condition  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Continuous upkeep that rises exactly when energy is hardest to come by, since heat stress also degrades the machinery producing the [[ATP]] this gene consumes. A cell deep in thermal stress pays more for protection out of a shrinking budget.  
**Design basis:** Heat-shock chaperones such as the GroEL and DnaK systems. One of the few genes in the catalog carrying its real biological name, because the real name is already clear.

**Widen, not shift.** HSP flattens the upper half of the temperature response curve; [[Membrane Saturase (MSAT)]] moves the whole curve's peak. The two are deliberately not interchangeable: a chaperone lineage survives a heatwave where it already lives, while a saturase lineage thrives in permanently warm water and dies if it cools.

**Paired with [[Cold Shock Protein (CSP)]].** Together they cover both ends of the thermal range, and expressing both continuously is the generalist's trap — double upkeep for protection that is only ever half-used. Specification §7.1 asks whether temperature adaptation is a shifted optimum, a broader tolerance, or both, and these three genes are the catalog's way of letting the player answer it per lineage rather than deciding globally. See [[Homeostasis]].
