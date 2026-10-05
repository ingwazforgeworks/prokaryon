**Gene ID:** ENVT  
**Gene Name:** Envelope Thickener  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Reinforces the cell envelope, making it harder for toxins to enter and harder for predators to breach. Armour built out of the same material the cell would otherwise grow with.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Reduced [[Lysin]] uptake; resistance to [[Bdellase (BDEL)]] attachment  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane  
**Tradeoff:** A thicker envelope slows everything crossing it, including food. Every permease in the genome becomes less effective, so armour is paid for twice: once in material and continuously in reduced uptake.  
**Design basis:** Cell-wall thickening and envelope remodelling.

**The permeability axis.** ENVT sits at one end of the clearest tradeoff in the catalog, with a thin-envelope cell carrying many permeases at the other:

| | Thin envelope | baseline | ENVT |
|---|---|---|---|
| Uptake | Fast through every permease | Permease-limited | Slowed across the board |
| [[Lysin]] exposure | High | Moderate | Low |
| Predation | Vulnerable | Vulnerable | Resistant |

No cell can be a fast eater and a hard target. That single constraint does more to separate strategies than any tuning pass will.

**It stacks badly with [[Capsulin]].** Both interpose material between the cell and the water, and their uptake penalties add while their protection overlaps — so expressing both is usually a worse deal than expressing one well.
