**Gene ID:** CHLS  
**Gene Name:** Chlorin Synthase  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Builds [[Chlorin]], the primary light-harvesting pigment. The only pigment efficient enough to drive a reaction centre hard enough to produce [[Reducin]], and therefore a hard prerequisite for autotrophy.  
**Inputs:** [[Glycon]] (carbon), [[Nitrox]] (nitrogen-rich ring structure), [[ATP]]  
**Outputs:** [[Chlorin]]  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** [[Nitrox Permease (NITP)]]  
**Other Prerequisites:** Requires [[Reaction Center (RXNC)]] to be useful for energy  
**Default Localization:** [[Cytosol]] and [[Plasma Membrane]]  
**Tradeoff:** The nitrogen cost is the real one. Chlorin competes directly with [[Anabolase (ANAB)]] for [[Nitrox]], so a phototroph in nitrogen-poor water cannot afford much antenna — and antenna is the thing that decides how much light it captures.  
**Design basis:** Chlorophyll biosynthesis. Specification §21.4 lists pigment synthesis plus reaction-centre machinery as a functional prerequisite, and this gene is the pigment half.

**Too much antenna is a liability.** Chlorin captures more energy than the reaction centre can process whenever light is strong, and the excess becomes damage. A high-Chlorin cell in full [[Light]] needs [[Carotin]] and [[Photoprotectin (PHPR)]], which means the efficient pigment drags two more genes in behind it.

**It shades its own descendants.** A dense Chlorin population strips red and blue from the water below, leaving light that only [[Phycin]] or [[Rhodin]] lineages can use. The pigment that wins the surface creates the niche that undercuts it at depth — see [[Chlorin]].
