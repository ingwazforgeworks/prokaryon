**Gene ID:** GRTN  
**Gene Name:** Girthin  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Thickens the cell across its short axis, lowering the aspect ratio. The same volume becomes shorter and wider, so there is less surface per volume and a shorter lever arm for shear to break.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Lower length-to-width ratio, applied at [[Division]]  
**Expression scaling:** [[Linear Expression Scaling]] over a bounded range  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol, acting on the envelope  
**Tradeoff:** Thickness spends surface. Uptake falls because there is less wall per volume, and the core sits farther from the membrane, so internal diffusion slows. A thick cell is sturdy and cheaper to wall, and it gives up the heading and the uptake a long cell had. Expressing it with [[Elongin (ELGN)]] pays for both and approaches the baseline ratio.  
**Design basis:** Width control of the sacculus — the continuous counterpart of the compact end of [[Shape Determinant (SHPD)]].

**Ratio, not size.** Girthin does not make a larger cell and does not change the division threshold. Volume stays with [[Size Regulator (SIZR)]]; the discrete class stays with [[Shape Determinant (SHPD)]]. A thicker cell is a worse substrate for [[Crescentin (CRST)]], which needs length to bend.

**Same caution as shape.** Specification §4.4 has not settled whether shape is evolvable. Prototype GRTN behind the same flag as [[Shape Determinant (SHPD)]].
