**Gene ID:** PLSM  
**Gene Name:** Plasmid Maintainer  
**Category:** [[Reproduction]]  
**Status:** Open — depends on decision D21  
**Description:** Replicates and retains acquired genetic cassettes as separate elements alongside the cell's own genome. Without it, transferred material is expressed briefly and then lost.  
**Inputs:** [[Biomass]], [[ATP]] per carried cassette  
**Outputs:** Persistent local expression of acquired genes  
**Expression scaling:** [[Linear Expression Scaling]] in the number of cassettes carried  
**Genetic Prerequisites:** [[Conjugation Apparatus (CONJ)]] or [[Competence Uptake (COMP)]]  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Every carried cassette is permanent overhead, and plasmids are still lost at [[Division]] at some rate. A cell hoarding acquired genes pays for all of them continuously and may hand none of them to a given daughter.  
**Design basis:** Plasmid replication and partitioning systems.

**Possession is not phenotype.** Specification §8.3 requires the game to explain the difference between acquired DNA and a functional expressed phenotype, and this gene is where that distinction becomes mechanical. An acquired gene needs a promoter, expression capacity, its own prerequisites, and a carrier — and the [[Personal Cell Map]] must say which of those is missing when a transferred gene does nothing.

**It defines the scope of transfer.** Decision D21 chooses between unlocking knowledge, integrating immediately, and plasmid state. This gene only exists under the third option, which is the one that makes transferred genes a burden as well as a gift: local to the recipient rather than species-wide, lossy across generations, and reversible by simply ceasing to pay.

If D21 selects species-wide knowledge unlock instead, PLSM is cut and [[Horizontal Gene Transfer]] loses its cost model. That is why the decision blocks content production rather than merely tuning it.
