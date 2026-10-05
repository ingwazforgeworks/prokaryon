**Gene ID:** LIPH  
**Gene Name:** Lipron Hydrolase  
**Category:** [[Metabolism]]  
**Status:** Confirmed  
**Description:** Breaks down biological debris outside the cell, releasing accessible [[Lipron]]. The liberated nutrient can be absorbed by the producer or scavenged by nearby cells.  
**Inputs:** [[Lipron]] (within biological debris)  
**Outputs:** [[Lipron]] (dissolved extracellularly; available for uptake)  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None
**Other Prerequisites:** Useless without [[Lipron Permease (LIPP)]] to recover the product  
**Default Localization:** [[Extracellular]] with [[SecretoryPeptide]], or [[Plasma Membrane]] with [[TransmembraneSignal]]  
**Tradeoff:** Debris is a surface, not a cloud, so the products appear in a small volume that neighbours can reach as easily as the producer. Anchoring the enzyme with [[TransmembraneSignal]] keeps more of the yield but requires the cell to stay in contact — which means [[Adhesin (ADHN)]] and a commitment to not moving.