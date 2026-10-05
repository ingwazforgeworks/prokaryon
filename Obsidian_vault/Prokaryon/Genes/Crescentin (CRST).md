**Gene ID:** CRST  
**Gene Name:** Crescentin  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Bends the cell's long axis into a crescent. The curve changes how the body meets a surface and how it moves through water, without changing how much cell there is.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Curvature of the long axis, applied at [[Division]]  
**Expression scaling:** [[Linear Expression Scaling]] over a bounded range — a tighter curve with more protein, up to a physical limit  
**Genetic Prerequisites:** None  
**Other Prerequisites:** A long axis to bend. On a sphere the filament has nothing to curve.  
**Default Localization:** Cytosol, acting on the envelope  
**Tradeoff:** A crescent holds a heading worse than a straight rod and packs its interior less efficiently. The bend is paid for in material, and it only earns that cost where the inner curve can sit against a surface or in shear. In open water it is drag with no return.  
**Design basis:** Crescentin (CreS), the intermediate filament that bends *Caulobacter* into a vibrioid.

**It bends a body plan; it does not choose one.** [[Shape Determinant (SHPD)]] picks sphere, rod, or filament. Crescentin curves whatever long axis that class, or [[Elongin (ELGN)]], has already provided. It does not add volume — that remains [[Size Regulator (SIZR)]].

**Same caution as shape.** Specification §4.4 has not settled whether shape is evolvable. Prototype CRST behind the same flag as [[Shape Determinant (SHPD)]], and do not produce it as launch content until [[Flow]] and surface contact are measurable.
