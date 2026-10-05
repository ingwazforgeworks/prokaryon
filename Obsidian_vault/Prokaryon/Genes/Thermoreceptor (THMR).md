**Gene ID:** THMR  
**Gene Name:** Thermoreceptor  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Reports local [[Temperature]] as a scalar regulatory input, by way of a protein whose folding state shifts with heat.  
**Inputs:** [[Temperature]]  
**Outputs:** A scalar regulatory signal  
**Expression scaling:** [[Linear Expression Scaling]] across the habitable range, saturating beyond it  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Temperature fields change slowly and vary little across a cell's reachable neighbourhood, so this receptor is usually informative about *when* rather than *where*. A cell cannot swim away from a warming habitat faster than the habitat warms.  
**Design basis:** Thermosensing through temperature-dependent protein and RNA conformation.

**Its customers** are [[Heat Shock Protein (HSP)]], [[Cold Shock Protein (CSP)]] and [[Membrane Saturase (MSAT)]], all of which are wasteful outside the conditions they protect against. Because heat stress arrives gradually, a threshold on this receptor with hysteresis is the intended pattern — see [[Conditional|conditional promoter]].
