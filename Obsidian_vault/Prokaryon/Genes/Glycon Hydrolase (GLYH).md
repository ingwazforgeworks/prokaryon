**Gene ID:** GLYH  
**Gene Name:** Glycon Hydrolase  
**Category:** [[Metabolism]]  
**Status:** Confirmed  
**Description:** Breaks down insoluble carbohydrate-like material in environmental deposits and biological debris, releasing dissolved [[Glycon]]. Nearby cells can compete for the liberated nutrient.  
**Inputs:** [[Carbohydron]]
**Outputs:** [[Glycon]]
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None
**Other Prerequisites:** Useless without [[Glycon Permease (GLYP)]] to recover the product  
**Default Localization:** [[Extracellular]] with [[SecretoryPeptide]], or [[Plasma Membrane]] with [[TransmembraneSignal]]  
**Tradeoff:** The producer pays and the neighbourhood eats. Every unit of [[Glycon]] released is available to any cell with a permease, so a hydrolase lineage subsidises its own competitors. That is the central public-goods problem in the game, and the tag choice above is the only lever against it — see [[SecretoryPeptide]].