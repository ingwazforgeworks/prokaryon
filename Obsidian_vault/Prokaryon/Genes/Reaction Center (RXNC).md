**Gene ID:** RXNC  
**Gene Name:** Reaction Center  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** A photochemical complex that converts harvested light energy into both [[Fluxin]] and [[Reducin]]. The only route in the catalog that supplies energy and reducing power together, and therefore the only route to full autotrophy.  
**Inputs:** [[Light]] via [[Chlorin]]  
**Outputs:** [[Fluxin]], [[Reducin]]  
**Expression scaling:** [[Saturating Scaling]] — limited by [[Chlorin]] abundance and local light  
**Genetic Prerequisites:** [[Chlorin Synthase (CHLS)]]  
**Other Prerequisites:** Adequate [[Light]]; [[Photoprotectin (PHPR)]] strongly advised at high intensity  
**Default Localization:** Cell membrane  
**Tradeoff:** Expensive to build, expensive to maintain, and it generates photodamage in proportion to how well it is working. It also commits the lineage to lit water, which is the most contested and most exposed geography in the world.  
**Design basis:** Chlorophyll-based reaction centres and electron-transfer chains. Specification §2.1 requires that this and rhodopsin phototrophy not be presented as one linear lineage, so RXNC has no progression edge from [[Photorhodin (PHOR)]].

**The end of the longest chain.** Autotrophy needs four genes working together — [[Chlorin Synthase (CHLS)]], RXNC, [[Carbex Permease (CBXP)]] and [[Glycon Synthase (GLYS)]] — and specification §21.4 states the reason plainly: energy supply plus reducing power plus fixation machinery is a functional composition, not a single unlock. See [[Metabolic Map]].
