**Gene ID:** SPOR  
**Gene Name:** Sporulase  
**Category:** [[Reproduction]]  
**Status:** Open — interacts with the extinction boundary  
**Description:** Converts the cell into a dormant, highly resistant state. No growth, no division, minimal upkeep, broad stress tolerance, and no response to opportunity until it wakes.  
**Inputs:** [[Biomass]], [[ATP]] to enter dormancy; near-zero upkeep while dormant  
**Outputs:** A dormant cell  
**Expression scaling:** [[Threshold Scaling]] — dormancy is a state, not a level  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Entering and leaving both take time and cost material  
**Default Localization:** Whole cell  
**Tradeoff:** Dormancy is not free survival. It costs material to enter and to leave, it forfeits every opportunity that arrives in the meantime, and a dormant cell earns no mutation points because it never divides. A lineage that sleeps through a famine wakes into a habitat that others have already claimed.  
**Design basis:** Sporulation and dormancy in stress-resistant states, collapsed into one module.

**Open — does a dormant cell count as alive?** Specification §3.1 decision D06 asks this directly and §4.4 leaves dormancy support undecided. The two answers produce different games, and the gene cannot be balanced until one is chosen:

| If dormant cells count | If they do not |
|---|---|
| A safety net: a player can wait out a catastrophe | A gamble: a run can end while cells still exist |
| Extinction accounting must track dormant populations across regions and restarts | Simpler accounting, much harsher failure |
| Encourages sleeping through every crisis | Requires always keeping something awake |

**Do not confuse it with logging out.** Dormancy is a physiological state the player's genes chose; player absence is a service lifecycle governed by decision D27 and backlog tasks S2-09 and S5-09. They will be mistaken for each other unless both are written down — [[Extinction]] records where each boundary sits.

**Waking is the hard part.** A dormant cell has minimal sensing, so what triggers revival is a genuine design problem rather than a parameter. If dormancy is exited on a [[Damage Receptor (DMGR)]] reading alone, cells will wake into the same conditions that put them under.
