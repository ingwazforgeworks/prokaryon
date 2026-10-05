**Category:** Perception  
**Status:** Confirmed as a content family — specification §6.4  
**Genes:** 9

Everything that turns a condition into a signal a promoter can use. Perception genes do nothing on their own: a receptor with no [[Conditional]] promoter reading it is pure cost.

### The receptors

| Gene | Measures |
|---|---|
| [[Chemoreceptor (CHMR)]] | Concentration of a chosen soluble resource |
| [[Thermoreceptor (THMR)]] | [[Temperature]] |
| [[Protoreceptor (PRTR)]] | [[pH]] |
| [[Osmoreceptor (OSMR)]] | [[Salinity]] |
| [[Redoxin (RDXN)]] | Local redox state — see [[Redox Stratification]] |
| [[Photochrome (PCHR)]] | [[Light]] intensity in one spectral band |
| [[Photovector (PHVC)]] | Light *direction* — the sole exception |
| [[Quoron Receptor (QURR)]] | [[Quoron]], and therefore local population density |
| [[Damage Receptor (DMGR)]] | The cell's own accumulated damage |

### Nothing is known without a receptor for it

This is the category's governing rule and the design's main defence against unearned omniscience. Confirmed requirement V26 states that absent or inactive sensing machinery cannot supply a functional controller input.

A promoter conditioned on temperature in a cell with no [[Thermoreceptor (THMR)]] does not read zero and does not read false — it has no input, and falls back to declared missing-input behaviour. The [[Personal Cell Map]] must show those as different states. See [[Conditional]].

Specification §2.1 puts it sharply: a promoter is not an autonomous environmental computer. Every condition the player writes must be traceable to a gene that measures the quantity.

### Receptors report scalars

With the single exception of [[Photovector (PHVC)]], every receptor returns a magnitude and no direction. A cell knows *how much* [[Glycon]] is around, never *which way* more of it lies.

That constraint is what forces [[Taxis Regulator (TAXR)]] to work the way real chemotaxis does — comparing now against a moment ago — and it is why the constraint is a design asset rather than a limitation. Inferring a gradient from a scalar is named in §2.1 as a fidelity failure.

### Pigments gate light sensing

[[Photochrome (PCHR)]] cannot detect what it has no pigment for. Which of [[Rhodin]], [[Chlorin]], [[Carotin]] or [[Phycin]] a cell makes determines which band it can see, so spectral perception is bought through [[Metabolism]] rather than granted.

A phototroph therefore tends to sense the light it harvests, and a cell that wants to *avoid* light buys the cheapest pigment — [[Rhodin]] — purely as a sensor.

### What was folded in here

My earlier Sensing category maps onto Perception one-to-one. [[Quoron Synthase (QURS)]], which produces the signal rather than detecting it, moved to [[Regulation]] instead.

### Related
[[Regulation]] · [[Conditional]] · [[Personal Cell Map]] · [[Environment]] · [[Gene Catalog]]
