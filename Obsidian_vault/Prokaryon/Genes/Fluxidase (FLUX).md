**Gene ID:** FLUX
**Gene Name:** Fluxidase  
**Category:** [[Metabolism]]  
**Status:** Confirmed  
**Description**: Extracts energy from intracellular [[Glycon]], [[Lipron]], [[Nitrox]], [[Sulfex]], or [[Ferron]], converting these fuels into [[Fluxin]] for ATP production with [[ATP Synthase (ATPS)]]
**Inputs:** [[Glycon]], [[Lipron]], [[Nitrox]], [[Sulfex]], or [[Ferron]] (intracellular; alternative substrates)  
**Outputs:** [[Fluxin]] 
**Expression scaling:** [[Linear Expression Scaling]] 
**Genetic Prerequisites:** None
**Other Prerequisites:** Requires some fuel to already be inside the cell  
**Default Localization:** [[Cytosol]]  
**Tradeoff:** It burns whatever is available, including material the cell needs for something else. [[Nitrox]] consumed here is [[Nitrox]] unavailable to [[Nitrox Assimilase (NITA)]], so a cell short of energy will quietly spend its nitrogen supply staying alive and then be unable to grow. The shared catabolic step is also a shared bottleneck: every fuel route competes for the same enzyme.