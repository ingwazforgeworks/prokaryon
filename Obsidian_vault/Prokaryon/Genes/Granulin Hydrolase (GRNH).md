**Gene ID:** GRNH  
**Gene Name:** Granulin Hydrolase  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Depolymerises stored [[Granulin]] back into usable intracellular [[Glycon]]. The withdrawal half of the storage system, and useless without a store to draw on.  
**Inputs:** [[Granulin]] (intracellular), [[ATP]]  
**Outputs:** [[Glycon]] (intracellular)  
**Expression scaling:** [[Linear Expression Scaling]], driven well by a [[Chemoreceptor (CHMR)]] condition on scarce food  
**Genetic Prerequisites:** [[Granulin Synthase (GRNS)]]  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Recovery is lossy and costs [[ATP]] at precisely the moment the cell has least of it. A starving cell must spend energy to release energy, so a store can become unreachable if the cell falls too far.  
**Design basis:** Storage granule mobilisation.

**The trap worth keeping.** Needing energy to access an energy reserve is not a bug to smooth over. It gives famine a threshold rather than a slope: a cell that starts withdrawing early survives, and one that runs its [[ATP]] down before switching over dies with a full larder. Requirement V25's [[Personal Cell Map]] must show both the store and the inability to reach it, or the death looks arbitrary.

**Regulation is the whole gene.** GRNH and [[Granulin Synthase (GRNS)]] must never be strongly expressed at once — that is a futile cycle burning [[ATP]] to convert [[Glycon]] into [[Glycon]]. Building a promoter pair that switches cleanly between them, with hysteresis so the cell does not oscillate at the threshold, is the intended lesson. Specification §5.4 names hysteresis as the tool for exactly this.
