**Gene ID:** REPR  
**Gene Name:** Repairase  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Clears accumulated damage of any origin — thermal, oxidative, acid, toxin. The general-purpose undo, effective against everything and efficient against nothing.  
**Inputs:** [[ATP]], [[Biomass]]  
**Outputs:** Reduced accumulated damage  
**Expression scaling:** [[Linear Expression Scaling]], driven well by a [[Damage Receptor (DMGR)]] condition  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Competes directly with [[Anabolase (ANAB)]] for the same [[ATP]] and [[Biomass]]. A cell repairing is a cell not growing, and specification §4.2 forbids both systems from independently spending the same pool — so sustained damage means sustained failure to divide, even if the cell never dies.  
**Design basis:** Protein turnover, proteolysis of damaged components, and DNA repair, collapsed into one aggregate module.

**Repair is worse than prevention, and should be.** [[Oxidex Detoxase (OXDT)]], [[Photoprotectin (PHPR)]] and [[Lysin Resistase (LYSR)]] each stop one specific kind of damage cheaply. Repairase handles all of them expensively. A cell facing one known threat should buy the specific gene; a cell facing an unpredictable habitat buys this one and grows slowly.

**The quiet death.** Specification §4.4 requires that death report its causal history rather than a final damage value. The most common failure mode this gene creates is not death at all — it is a population that survives indefinitely without dividing, earning no mutation points. The [[Personal Cell Map]] must make that visible, because it looks like stability and is actually a slow loss.
