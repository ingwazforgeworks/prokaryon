**Gene ID:** FLGM  
**Gene Name:** Flagellar Motor Protein  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** The rotary motor and stator complex that spins a flagellum, converting [[ATP]] directly into thrust. Motion is a continuous expense.  
**Inputs:** [[ATP]], an assembled filament  
**Outputs:** Thrust along the filament's axis  
**Expression scaling:** [[Saturating Scaling]] — additional motors give diminishing speed  
**Genetic Prerequisites:** [[Flagellin (FLGN)]]  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane, co-located with the filament  
**Tradeoff:** The heaviest continuous [[ATP]] drain available to a cell, drawing on the pool that growth and maintenance also need. A swimming cell in poor water burns its way to starvation faster than a stationary one.  
**Design basis:** The flagellar stator complex, source [B5]. Specification §2.1 is explicit that ATP synthase does not become a flagellar motor: component homology among export ATPases is not a whole-machine lineage, so FLGM has no evolutionary progression edge from [[ATP Synthase (ATPS)]].

**Diminishing returns are deliberate.** Specification §4.3 requires that more appendages not mean proportionally more speed. Drag, crowding and interference cap useful motor count well below what expression capacity would allow, so speed is not a resource the player can simply buy more of.

**Movement without direction.** With FLGM and no [[Taxis Regulator (TAXR)]] the cell swims persistently and is pushed around by [[Flow]]. Thrust is not navigation.
