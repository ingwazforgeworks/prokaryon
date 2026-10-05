**Gene ID:** SHPD  
**Gene Name:** Shape Determinant  
**Category:** [[Morphology]]  
**Status:** Open — specification §4.4 has not settled whether shape is evolvable  
**Description:** Sets the cell's body plan: compact sphere, elongated rod, or extended filament. Changes surface area, drag, collision behaviour and how the cell sits against a surface, all at once.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Body plan class, applied at [[Division]]  
**Expression scaling:** [[Threshold Scaling]] — a discrete class, not a continuous morphology  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol, acting on the envelope  
**Tradeoff:** Every shape is worse at something. There is no configuration that is compact, high-surface and low-drag together, and changing class takes effect only at division — so the cell that pays for the edit is not the cell that benefits.  
**Design basis:** Cytoskeletal shape determinants such as MreB-dependent elongation.

### Candidate body plans

| Shape | Surface per volume | Drag | Behaviour |
|---|---|---|---|
| Sphere | Lowest | Lowest | Cheap to build, poor uptake, tumbles freely |
| Rod | Moderate | Moderate | Holds a heading; the baseline |
| Filament | Highest | Highest | Best uptake, resists being swept away, hard to move |

**Continuous modifiers.** The class is not the whole of shape. [[Crescentin (CRST)]] bends the long axis, [[Elongin (ELGN)]] lengthens it, and [[Girthin (GRTN)]] thickens it. None of them changes volume, and all four share the open question below.

**Why it is Open.** Shape touches transport, motility, collision and predation simultaneously, so its balance cannot be evaluated until those systems exist. Specification §4.4 leaves both shape and size evolvability undecided and asks what limits their benefits. Prototype SHPD behind a flag and do not produce it as launch content until [[Flow]] and predation are measurable — the same caution applies to [[Size Regulator (SIZR)]].
