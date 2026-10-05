**Gene ID:** FLOA  
**Gene Name:** Floatin  
**Category:** [[Morphology]]  
**Status:** Open — depends on how the depth axis is treated, same as [[Buoyin (BUOY)]]  
**Description:** Builds gas vesicles and raises the gas-filled fraction of the cell's volume. The more of the interior is gas, the lower the cell's density.  
**Inputs:** [[Biomass]], [[ATP]] to build  
**Outputs:** A higher gas-filled fraction of cell volume  
**Expression scaling:** [[Linear Expression Scaling]] over a bounded range — the fraction follows abundance, up to the volume the cell has  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Gas occupies space [[Granulin]] or [[Biomass]] could have used, and the cell rises whether or not shallower water is where it should be. There is no steering. Coming back down takes [[Ballastin (BALA)]], or expressing less, which takes a genome edit and its mandatory delay.  
**Design basis:** Cyanobacterial gas-vesicle proteins. The locus is floA; the protein is Floatin.

**One vesicle budget.** [[Buoyin (BUOY)]] is the same organ, described as passive drift. FLOA states it as a fraction of cell volume so [[Ballastin (BALA)]] can oppose it. Expressing both BUOY and FLOA fills that one budget once.

**It fights ballast.** Gas fraction and ballast density subtract. A cell expressing both spends on vesicles and on packaging, and its density moves toward neither extreme.

**Open — the depth axis.** Requirement V14 confines gameplay to an XY plane with background depth. A gas fraction only positions the cell if one gameplay axis carries depth. If it does not, cut FLOA with [[Buoyin (BUOY)]] rather than reinterpreting it. See [[Surfaces and Geometry]].
