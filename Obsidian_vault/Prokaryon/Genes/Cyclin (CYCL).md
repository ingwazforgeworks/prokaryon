**Gene ID:** CYCL  
**Gene Name:** Cyclin  
**Category:** [[Reproduction]]  
**Status:** Open — changes division rate, so it waits on the same reward decision as [[Size Regulator (SIZR)]]  
**Description:** Pushes the cell to divide while it is expressed. The commitment happens earlier than the size threshold would allow, and it happens only for as long as the gene is on.  
**Inputs:** [[ATP]], and the [[Biomass]] the division spends  
**Outputs:** An earlier [[Division]], scaled by expression  
**Expression scaling:** [[Linear Expression Scaling]] — stronger expression pulls the commitment further forward, down to a viability floor  
**Genetic Prerequisites:** None  
**Other Prerequisites:** The cell must still hold enough [[Biomass]] to produce two viable daughters. Cyclin cannot divide an empty cell.  
**Default Localization:** Cytosol  
**Tradeoff:** Early daughters are smaller. They carry less reserve, tolerate a bad patch worse, and the division itself spends [[ATP]] the parent needed for maintenance. Left on, the lineage divides itself into cells too small to grow back.  
**Design basis:** Cyclins, which advance the cell cycle when present, collapsed into one module that stimulates [[Division]] rather than setting its size.

**It does not set the target.** [[Size Regulator (SIZR)]] chooses how large a cell means to be. Cyclin spends that plan early. A [[Conditional]] promoter makes the stimulation a response — divide when a cue is present — and a [[Constitutive]] one makes it a standing drain.

**The same economic hazard as size.** Division is the source of [[Mutation Points]] under requirement V08. If the reward is flat per event, a lineage that expresses Cyclin and dies cheaply prints currency, which is the exploit specification §6.1 and backlog task S2-08 already name for small fast-dividing cells. This entry stays Open until that reward formulation is settled. See [[Size Regulator (SIZR)]] and [[Mutation Points]].
