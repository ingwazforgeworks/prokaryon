**Gene ID:** CHMR  
**Gene Name:** Chemoreceptor  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Detects the concentration of one tagged solute and makes that reading available as a regulatory input. Reports a single number about the here and now, together with how it compares to the recent past.  
**Inputs:** The concentration of its configured target solute  
**Outputs:** A scalar regulatory signal available to promoters and to [[Taxis Regulator (TAXR)]]  
**Expression scaling:** [[Saturating Scaling]] — high concentrations stop being distinguishable  
**Genetic Prerequisites:** None  
**Other Prerequisites:** The target solute must be configured; one receptor reads one tag  
**Default Localization:** Cell membrane  
**Tradeoff:** One receptor, one solute. A cell that wants to track several resources pays for several receptors and several expression slots, and saturation means it cannot tell a good patch from an excellent one.  
**Design basis:** Methyl-accepting chemotaxis proteins and temporal sensing, source [B8].

**It is not a map.** The receptor supplies a scalar the cell compares against its own recent history. It does not hand over a gradient vector or a direction. Specification §4.3 warns that a freely supplied perfect gradient makes sensing genes cosmetic, so the noise, sampling interval, detection range and saturation of this gene are all real parameters rather than flavour text.

**Sensing is the price of regulation.** Requirement V26 means a promoter condition referencing [[Glycon]] is inert in a cell with no chemoreceptor tagged to it. Conditional behaviour costs two genes: the thing that acts and the thing that notices.
