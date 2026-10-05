**Gene ID:** GLYP  
**Gene Name:** Glycon Permease  
**Category:** [[Metabolism]]  
**Status:** Confirmed  
**Description**: Transports extracellular [[Glycon]] across the cell membrane, making it available for intracellular metabolism.
**Inputs:** [[Glycon]] (extracellular)  
**Outputs:** [[Glycon]] (intracellular)  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None
**Other Prerequisites:** None  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** It only finds what is already dissolved. A cell relying on ambient [[Glycon]] is competing with every other cell for the same diffusing pool and has no way to create more, so GLYP alone works in rich water and starves in depleted water. Adding [[Glycon Hydrolase (GLYH)]] is what turns it from scavenging into production.