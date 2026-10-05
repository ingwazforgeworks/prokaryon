**Gene ID:** CSP  
**Gene Name:** Cold Shock Protein  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Keeps the cell's synthesis machinery working as [[Temperature]] falls, preventing the molecular stalling that otherwise brings expression to a halt in cold water. Extends the lower end of the habitable range.  
**Inputs:** [[ATP]]  
**Outputs:** Maintained expression and growth rate at low temperature  
**Expression scaling:** [[Linear Expression Scaling]], driven well by a [[Thermoreceptor (THMR)]] condition  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Cold does not damage the cell so much as slow it, so this gene buys throughput rather than survival. A cold lineage that skips it does not die — it simply stops dividing, earns no mutation points, and loses its habitat to anything that did buy it.  
**Design basis:** Cold-shock proteins acting as nucleic-acid chaperones to sustain translation at low temperature.

**A different kind of failure from heat.** [[Heat Shock Protein (HSP)]] prevents damage; CSP prevents stalling. That asymmetry is worth preserving because it gives the two ends of the temperature field genuinely different consequences: heat kills, cold merely wins by attrition. Specification §4.4 requires death causes to report a causal history, and a cold-stalled population is the case where nothing kills the cell and the lineage still loses.

**The generalist's trap.** Expressing HSP and CSP together costs double upkeep for protection that is only ever half-used, and still loses to a [[Membrane Saturase (MSAT)]] specialist inside that specialist's range. See [[Homeostasis]] for the shift-versus-widen comparison.
