**Gene ID:** REPX  
**Gene Name:** Repressor  
**Category:** [[Regulation]]  
**Status:** Confirmed — requirement V30  
**Description:** An expressed protein that binds promoters carrying a matching [[Operator Tag]] and suppresses their output. The player's tool for turning one gene's activity into another gene's off switch.  
**Inputs:** [[Biomass]], [[ATP]]; driven by whatever promoter the player attaches to it  
**Outputs:** Suppression of every promoter carrying its target tag  
**Expression scaling:** [[Linear Expression Scaling]]; suppression strength follows repressor abundance  
**Genetic Prerequisites:** None  
**Other Prerequisites:** At least one promoter must carry the matching tag, or the protein does nothing  
**Default Localization:** Cytosol  
**Tradeoff:** It is a protein, so it costs capacity, accumulates slowly and decays slowly. A repressor cannot switch anything off quickly, and it keeps suppressing for a while after its own promoter has gone quiet.  
**Design basis:** Transcriptional repressors binding operator sequences.

**Abundance, not logic.** Requirement V30 insists that regulator-dependent repression be distinct from direct Boolean logic. A repressed gene is not flipped off — it is outcompeted by a growing pool of repressor, and the lag between cue and effect is the mechanic rather than a limitation. The [[Personal Cell Map]] must therefore show repressor abundance as a real quantity and name it as the reason a gene is producing less than its target.

**What it enables.** Indirection. A single repressor driven by one condition can silence several unrelated genes across the genome by tag, which is how a player builds a coordinated response — a starvation programme, a stress programme — out of parts that were never designed together. See [[Operator Tag]] and [[Activator (ACTX)]].
