**Gene ID:** PCHR  
**Gene Name:** Photochrome  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** A pigment-bound light receptor. Reports how bright it is in one spectral band, and nothing about where the light comes from.  
**Inputs:** [[Light]] in whichever band the cell's pigment absorbs  
**Outputs:** A scalar regulatory signal  
**Expression scaling:** [[Saturating Scaling]]  
**Genetic Prerequisites:** **At least one pigment synthase** — [[Rhodin Synthase (RHDS)]], [[Chlorin Synthase (CHLS)]], [[Carotin Synthase (CRTS)]] or [[Phycin Synthase (PHYS)]]  
**Other Prerequisites:** None  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** Cheap and genuinely limited. Intensity alone cannot distinguish deep shade from a passing occlusion, and a cell regulating on it will chase transients unless its promoter uses hysteresis.  
**Design basis:** Sensory rhodopsins and phytochrome-family photoreceptors, both of which are apoproteins that see nothing until a pigment is bound.

### A photochrome sees only what its pigment absorbs

This is the gene's defining property. The receptor protein is colourblind on its own; the pigment supplies the spectral sensitivity:

| Pigment present | Band the cell can sense |
|---|---|
| [[Rhodin]] | Mid-spectrum, green-yellow |
| [[Chlorin]] | Red and blue |
| [[Carotin]] | Blue-violet |
| [[Phycin]] | Green and orange |

A cell with several pigments senses several bands, and a cell with none is blind no matter how much PCHR it expresses. Emitted light follows the same limit: a [[Red Fluorescent Protein (RFP)]] glow is invisible to a cell whose pigments do not cover red, and likewise for [[Green Fluorescent Protein (GFP)]], [[Yellow Fluorescent Protein (YFP)]] and [[Blue Fluorescent Protein (BFP)]]. That makes light perception something bought through [[Metabolism]] rather than granted by a receptor, and it is the only place in [[Perception]] where a receptor has a material prerequisite.

**The consequence worth noticing:** a phototroph tends to sense exactly the light it harvests, because it already owns the pigment. A heterotroph that wants to *avoid* light buys [[Rhodin Synthase (RHDS)]] purely as a sensor and never builds a reaction centre — the cheapest sighted genome in the game.

### It is a scalar, deliberately

Specification §2.1 is explicit that sensing a scalar light intensity does not supply a directional vector, and this gene is where that limit is enforced. Direction requires [[Photovector (PHVC)]], which has its own evidence in source [B2] and its own machinery requirement.

### Its main customers

[[Photoprotectin (PHPR)]], which must know when light is excessive, and [[Chlorin Synthase (CHLS)]], which should not build antenna in the dark. Both are cases where specification §5.4's requirement — that conditional expression beat constitutive overexpression — is satisfied by a single cheap receptor.

It is also the only available proxy for [[UV]], which has no receptor of its own.
