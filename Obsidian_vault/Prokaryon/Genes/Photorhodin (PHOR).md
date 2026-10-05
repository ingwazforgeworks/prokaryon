**Gene ID:** PHOR  
**Gene Name:** Photorhodin  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** A light-driven pump built from one protein and one cheap pigment. Absorbs [[Light]] and produces [[Fluxin]] directly, with no antenna complex, no reaction centre, and no reducing power. The cheapest way to get energy out of light and the most limited.  
**Inputs:** [[Light]]  
**Outputs:** [[Fluxin]]  
**Expression scaling:** [[Saturating Scaling]] — capped by local light intensity  
**Genetic Prerequisites:** [[Rhodin Synthase (RHDS)]] — the pump is an apoprotein and does nothing without its pigment  
**Other Prerequisites:** Adequate [[Light]]  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** Supplies energy and nothing else. No [[Reducin]] and no carbon, so a cell living on Photorhodin alone accumulates [[ATP]] it cannot spend on growth and starves with a full energy pool.  
**Design basis:** Rhodopsin-based phototrophy, source [B7]. Specification §2.1 warns against presenting sensory rhodopsins and reaction centres as one settled lineage, so this gene shares no progression edge with [[Reaction Center (RXNC)]] and is not a step toward it.

**Its actual use is supplementary.** Photorhodin is most valuable to a heterotroph in lit water: food covers carbon and nitrogen while light covers part of the energy bill, freeing more of the imported fuel for [[Biomass]]. As a primary strategy it is a trap, and that trap is intentional — it teaches the distinction specification §2.4 requires between capturing energy and making biomass.
