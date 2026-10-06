**Gene ID:** CILM  
**Gene Name:** Ciliary Motor  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Bends assembled cilia by spending [[ATP]] on each beat. Expression sets the maximum beat strength and rate, and the ATP demand rises with the beat the cell actually produces.  
**Inputs:** [[ATP]], assembled cilia  
**Outputs:** Beat strength and rate, up to the maximum set by expression  
**Expression scaling:** [[Saturating Scaling]] — further motor protein raises the ceiling with diminishing speed  
**Genetic Prerequisites:** [[Cilium Assemblase (CILA)]]  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane, co-located with the cilium  
**Tradeoff:** A continuous [[ATP]] drain that competes with growth and maintenance. Beating with no [[Ciliary Polarizer (CILP)]] spends that ATP on strokes that cancel. Specification §4.3 caps useful speed below what expression would buy, so more motor is not more velocity.  
**Design basis:** Axonemal dynein. [[Flagellar Motor Protein (FLGM)]] spends [[ATP]] to spin a flagellum; CILM spends [[ATP]] to bend a cilium. Shared motion, no shared ancestry, and no progression edge from [[ATP Synthase (ATPS)]].

**Movement without direction.** With CILM and no [[Ciliary Polarizer (CILP)]] the strokes interfere. With a polarizer and no [[Ciliary Reversal Channel (CILR)]] the cell holds whatever resting stroke it built, and nothing it senses can change that stroke.
