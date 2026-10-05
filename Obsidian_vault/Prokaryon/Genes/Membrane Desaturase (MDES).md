**Gene ID:** MDES  
**Gene Name:** Membrane Desaturase  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Introduces double bonds into membrane lipids, raising fluidity. Keeps the envelope workably fluid as [[Temperature]] falls, and shifts the cell's optimum downward into the cold.  
**Inputs:** [[Lipron]] or [[Glycon]] (carbon), [[ATP]]  
**Outputs:** Increased membrane fluidity; a colder optimum  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** A fluid membrane leaks. Desaturated lipids hold solutes in less well, so a cold-adapted cell loses more of what it imports and is more vulnerable to [[Lysin]] — and in warm water an over-fluid envelope fails outright.  
**Design basis:** Lipid desaturases and homeoviscous adaptation.

**Shift, not widen.** MDES moves the optimum rather than flattening the curve. Inside its new range it beats a [[Cold Shock Protein (CSP)]] generalist outright, because it pays a one-off material cost instead of continuous upkeep; outside it, it simply fails. See [[Temperature]] for the three cost shapes.

**Paired with [[Membrane Saturase (MSAT)]].** The two genes push the membrane in opposite directions, and a cell expressing both strongly is spending twice to stay where it started. Whether they should be allowed to oppose each other, or be mutually repressing through an [[Operator Tag]], is a regulation design choice worth testing — a futile cycle here is the same failure as [[Granulin Synthase (GRNS)]] running against [[Granulin Hydrolase (GRNH)]].
