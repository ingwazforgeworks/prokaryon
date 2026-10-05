**Gene ID:** CILP  
**Gene Name:** Ciliary Polarizer  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Sets the resting direction of the power stroke on the cilia it marks. How those strokes sit relative to each other decides what a patch does to the water.  
**Inputs:** [[ATP]] to establish and hold the orientation  
**Outputs:** A resting power-stroke orientation on each marked patch  
**Expression scaling:** [[Threshold Scaling]] — a patch has an orientation, not a quantity of one  
**Genetic Prerequisites:** [[Cilium Assemblase (CILA)]]  
**Other Prerequisites:** The orientation does no work until [[Ciliary Motor (CILM)]] is beating  
**Default Localization:** Cell membrane, co-located with the cilia whose stroke it sets  
**Tradeoff:** The resting stroke is a commitment made in advance. Aligned patches thrust and cannot hover. A circumferential arrangement rotates the cell without taking it anywhere. A surface arrangement pumps fluid along the membrane and barely translates. Reorienting is slow, so this gene cannot be used as a steering wheel.  
**Design basis:** Basal-body and rootlet orientation of the ciliary power stroke. This is stroke direction, not the placement of the cilium — placement remains [[PolarLocalizationSignal]].

| Arrangement | What the patch does |
|---|---|
| Strokes aligned | Forward thrust |
| Strokes around the long axis | Rotation |
| Strokes along the surface, opposed across the body | Local fluid pumping |

**The same three defences as the flagellum.** Requirement V02 forbids steering. An edit that reorients a power stroke is species-wide, waits out the mandatory edit delay, and only finishes as the cilia turn over. See [[Localization]].
