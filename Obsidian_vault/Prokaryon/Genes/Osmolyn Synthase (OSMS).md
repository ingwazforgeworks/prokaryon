**Gene ID:** OSMS  
**Gene Name:** Osmolyn Synthase  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Builds [[Osmolyn]], the internal solute that matches the cell's water potential to the water outside it. The standard defence against [[Salinity]], and the reason salinity acts as a growth tax rather than a wall.  
**Inputs:** [[Glycon]] or [[Lipron]] (carbon), [[ATP]]  
**Outputs:** [[Osmolyn]]  
**Expression scaling:** [[Linear Expression Scaling]], driven well by an [[Osmoreceptor (OSMR)]] condition  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Spends carbon on molecules that will never become [[Biomass]]. In saline water a meaningful share of everything the cell eats is diverted into staying the right size, so a salt specialist grows slowly even when well fed.  
**Design basis:** Compatible solute accumulation.

**Slow by design.** Building Osmolyn takes time, so it defends against a sustained gradient and not a sudden one. [[Aquaporin (AQUP)]] is the fast counterpart that buffers nothing. A cell crossing between salinity zones needs both and pays twice, which is what makes a salinity boundary a real barrier to dispersal rather than a decorative field.

**Open.** Specification §7.1 asks whether osmotic adaptation is reversible expression or long-term specialisation. This gene assumes reversible, which keeps the promoter decision meaningful. The alternative would move the content into [[Morphology]] and remove that decision entirely — see [[Osmolyn]].
