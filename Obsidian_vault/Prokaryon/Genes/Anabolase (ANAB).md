**Gene ID:** ANAB  
**Gene Name:** Anabolase  
**Category:** [[Metabolism]]  
**Status:** Proposed — starter gene candidate  
**Description:** Assembles [[Biomass]] from carbon, nitrogen and energy. The gene that converts a well-fed cell into a larger cell, and therefore the gene that gates [[Division]] and the mutation-point income that follows from it.  
**Inputs:** [[Glycon]] or [[Lipron]] (intracellular), assimilated nitrogen from [[Nitrox Assimilase (NITA)]], [[ATP]]  
**Outputs:** [[Biomass]]  
**Expression scaling:** [[Linear Expression Scaling]], limited jointly by whichever input is scarcest  
**Genetic Prerequisites:** None  
**Other Prerequisites:** A carbon source and a nitrogen source must both be present  
**Default Localization:** Cytosol  
**Tradeoff:** Growth is not free and not optional. High expression consumes the same [[ATP]] that maintenance, motility and defence need, and specification §4.2 forbids those systems from independently spending the same pool — so a fast-growing cell is a fragile one.  
**Design basis:** Aggregate anabolism, deliberately collapsed into one module rather than a biosynthetic network. Specification §2.2 permits a functional module standing for many genes provided the abstraction is labelled, and this is the largest such collapse in the catalog.

**Why it is in the starter genome.** Backlog task S1-05 requires a starter that can reach a first division, and S1-06 requires growth to consume declared material inputs. Without ANAB the starter has an energy economy and no way to turn it into a second cell.
