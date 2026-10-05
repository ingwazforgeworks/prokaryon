**Gene ID:** EFFI  
**Gene Name:** Effector Injector  
**Category:** [[Morphology]]  
**Status:** Open — payload model unresolved  
**Description:** A contact-dependent apparatus that delivers a protein payload directly into an adjacent cell. Precise, expensive, and dependent on sustained contact the player cannot command.  
**Inputs:** [[Biomass]], [[ATP]]; sustained contact with a target cell  
**Outputs:** Payload delivered into one adjacent cell  
**Expression scaling:** [[Threshold Scaling]] — a discrete apparatus with a delivery cooldown  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Contact must persist long enough to complete delivery. [[Cohesin (COHS)]] makes that more likely when the neighbour is the same type. [[Adhesin (ADHN)]] does not, because it never binds a cell.  
**Default Localization:** Cell membrane  
**Tradeoff:** Enormous overhead for one target at a time. A toxin cloud from [[Lysin Synthase (LYSS)]] harms everything nearby for the same energy; this harms one cell, precisely, if the encounter lasts. In sparse water it never fires.  
**Design basis:** Contact-dependent protein delivery by injectisome-like machinery.

**Naming discipline.** Specification §2.1 is explicit that type III secretion injectisomes deliver proteins while DNA transfer commonly uses type IV machinery, and that "flagellin becomes secretion systems" misrepresents a multi-component history. Three consequences are enforced here:

- EFFI and [[Conjugation Apparatus (CONJ)]] are separate genes with separate machinery, not two modes of one apparatus.
- EFFI has no progression edge from [[Flagellin (FLGN)]]. The documented relationship, per source [B6], is between flagellar export apparatus and non-flagellar secretion systems, and it is an inference about multi-component systems rather than a filament upgrade.
- Any progression edge that is drawn must be typed as a shared-component or stated-inference relationship, never as "A evolved into B."

**Open — what does it deliver?** Backlog task S3-11 treats the injection interaction and its payload state as one model covering both effectors and genetic cargo. That is an architectural convenience, not a design decision: whether a single apparatus can carry a damaging effector and a gene cassette is bound up with decisions D20 and D23 in [[Horizontal Gene Transfer]], and this gene cannot be produced as content until they land.
