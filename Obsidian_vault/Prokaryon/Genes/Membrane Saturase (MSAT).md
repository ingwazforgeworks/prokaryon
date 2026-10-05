**Gene ID:** MSAT  
**Gene Name:** Membrane Saturase  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Removes double bonds from membrane lipids, lowering fluidity. Keeps the envelope from becoming dangerously loose as [[Temperature]] rises, and shifts the cell's optimum upward into the heat.  
**Inputs:** [[Lipron]] or [[Glycon]] (carbon), [[ATP]], [[Reducin]]  
**Outputs:** Decreased membrane fluidity; a warmer optimum  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** A rigid membrane transports poorly. Saturated lipids slow every permease in the genome, so a heat-adapted cell eats worse than its cold-adapted cousin even when food is identical — and in cold water the envelope stiffens until transport effectively stops.  
**Design basis:** Lipid saturation and homeoviscous adaptation.

**Shift, not widen.** Like [[Membrane Desaturase (MDES)]], MSAT moves the optimum instead of flattening the curve, and it beats a [[Heat Shock Protein (HSP)]] generalist inside its range for the same reason: one-off material cost against continuous upkeep. See [[Temperature]].

**The pair is the interesting part.** Splitting fluidity control into two opposed genes means membrane temperature adaptation is a *balance* the player tunes rather than a single slider, and it makes the cold and warm ends of the world mechanically different rather than mirror images — MSAT costs [[Reducin]] and MDES does not, so heat adaptation competes with [[Glycon Synthase (GLYS)]] in a way cold adaptation never does.
