**Gene ID:** ELGN  
**Gene Name:** Elongin  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Stretches the cell along its long axis, raising the aspect ratio. The same volume becomes longer and narrower, so surface area rises and the cell holds a heading more firmly.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Higher length-to-width ratio, applied at [[Division]]  
**Expression scaling:** [[Linear Expression Scaling]] over a bounded range  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol, acting on the envelope  
**Tradeoff:** Length is paid for in envelope and in drag. A longer cell takes more wall to build, shears more easily, and turns more slowly. It also fights [[Girthin (GRTN)]]: expressing both spends on two cytoskeletons, and the aspect ratio moves toward neither.  
**Design basis:** Cytoskeletal elongation along the long axis — the continuous counterpart of the rod and filament classes on [[Shape Determinant (SHPD)]].

**Ratio, not size.** Elongin does not make a larger cell and does not change the division threshold. Volume stays with [[Size Regulator (SIZR)]]; the discrete class stays with [[Shape Determinant (SHPD)]]. Elongin only redistributes the body the cell already has. [[Crescentin (CRST)]] can then bend that longer axis.

**Same caution as shape.** Specification §4.4 has not settled whether shape is evolvable. Prototype ELGN behind the same flag as [[Shape Determinant (SHPD)]].
