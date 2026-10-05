**Gene ID:** SLFR  
**Gene Name:** Sulfex Reductase  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** A terminal respiratory module for anoxic water. Passes electrons to [[Sulfex]] instead of [[Oxidex]], giving a moderate [[ATP]] yield in places the better acceptor never reaches.  
**Inputs:** [[Sulfex]] (extracellular), electrons from [[Fluxin]] oxidation  
**Outputs:** Moderately raised ATP yield per [[Fluxin]]; the [[Sulfex]] consumed leaves the pool  
**Expression scaling:** [[Saturating Scaling]]  
**Genetic Prerequisites:** [[ATP Synthase (ATPS)]]  
**Other Prerequisites:** Local [[Sulfex]]; suppressed where [[Oxidex]] is high  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** Strictly worse than [[Oxidex Reductase (OXDR)]] wherever both work, so it is only ever the right purchase for a lineage committing to the dark. It also consumes the same pool that sulfur-oxidising cells eat, so it competes with them rather than feeding them.  
**Design basis:** Dissimilatory sulfate reduction.

**It makes the dark worth living in.** Without a second terminal acceptor, anoxic water supports only fermentation, and [[Redox Stratification]] collapses into "lit and good" versus "dark and bad." SLFR is what gives the lower layer a real metabolism and therefore a real population.

**Competition, not cross-feeding.** This gene and [[Sulfex Permease (SLFP)]] draw on the same pool from opposite directions — one dumping electrons into sulfur, the other pulling electrons out of it — and because [[Sulfex]] carries no oxidation state in this design, neither produces what the other needs. The two sulfur strategies contest one resource.

That is a deliberate consequence of compressing the sulfur cycle into a single pool, explained in full on [[Sulfex]]. The cross-feeding relationship it gives up is supplied instead by [[Fermentate]] and [[Fermentate Permease (FRMP)]].

**The switching problem.** A cell drifting through the transition zone wants SLFR below and [[Oxidex Reductase (OXDR)]] above, and expressing both permanently wastes capacity. [[Redoxin (RDXN)]] is the receptor that makes the choice possible, and it reports one scalar for two acceptors — so in water where both are marginal the cell is guessing. See [[Conditional]] on why hysteresis matters here.
