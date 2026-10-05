**Gene ID:** PHVC  
**Gene Name:** Photovector  
**Category:** [[Perception]]  
**Status:** Open — the only directional sense in the catalog  
**Description:** Focuses incoming light through the cell body so that intensity differs measurably across the envelope, letting the cell infer which direction light arrives from. Supplies a direction, not just a brightness.  
**Inputs:** [[Light]] intensity across the cell surface  
**Outputs:** A direction vector usable as a reference frame by [[PolarLocalizationSignal]], and as a regulatory input  
**Expression scaling:** [[Threshold Scaling]] — works or does not, depending on whether the intensity difference clears sensor noise  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Requires reasonably bright, reasonably directional light; fails in diffuse or dim conditions  
**Default Localization:** Cell membrane, distributed around the envelope  
**Tradeoff:** Fragile. Shade, turbidity, crowding and scattered light all degrade the reading, and when it fails every gene depending on it falls back to body-fixed behaviour. A lineage that has built its body plan around a light vector loses its shape when the light goes soft.  
**Design basis:** Micro-optic light-direction sensing in cyanobacteria, source [B2].

**A deliberate exception.** Every other receptor in [[Perception]] reports a scalar. Specification §2.1 warns that cells do not generally get directional vectors from scalar sensing, so this gene is justified by one specific documented mechanism rather than by convenience — and its limitations are modelled precisely so that it is not a free omniscience upgrade.

**It enables requirement V05.** "Orientation relative to light" needs a light direction to orient against. PHVC is that term; [[PolarLocalizationSignal]] is the machinery that uses it; [[Localization]] describes how the two combine and what happens when the cue is lost.
