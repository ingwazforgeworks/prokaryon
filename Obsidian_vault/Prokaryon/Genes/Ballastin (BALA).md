**Gene ID:** BALA  
**Gene Name:** Ballastin  
**Category:** [[Morphology]]  
**Status:** Open — depends on how the depth axis is treated, same as [[Buoyin (BUOY)]]  
**Description:** Packages available reserves into dense ballast granules. The calories stay in the cell, and the granules raise its density.  
**Inputs:** [[Granulin]] or surplus [[Glycon]], [[ATP]] to package  
**Outputs:** Dense ballast granules  
**Expression scaling:** [[Linear Expression Scaling]], limited by the reserves on hand  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Reserves to package. With an empty larder the gene has nothing to densify.  
**Default Localization:** Cytosol  
**Tradeoff:** The cell sinks whether or not deeper water is where it should be. The granules are still food, but they are committed: [[Granulin Hydrolase (GRNH)]] has to unpack them before the reserve can be spent, so a ballasted cell arrives in a famine already dense and already slow to eat its stores.  
**Design basis:** Carbohydrate ballast in cyanobacteria, where glycogen granules raise cell density and cause sinking. The locus is balA; the protein is Ballastin.

**The way back down.** [[Floatin (FLOA)]] and [[Buoyin (BUOY)]] fill the cell with gas and it rises. Ballastin is the opposing mass, built out of reserves the cell already holds rather than out of a new material. Density is the difference between the gas fraction and the ballast.

**Open — the depth axis.** Requirement V14 confines gameplay to an XY plane with background depth. Dense granules only position the cell if one gameplay axis carries depth. If it does not, cut BALA with [[Buoyin (BUOY)]] rather than reinterpreting it. See [[Surfaces and Geometry]].
