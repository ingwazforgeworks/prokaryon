**Status:** Confirmed as a set of fields — requirement V09 and specification §7.1  
**Index of:** the world a cell has to live in

The environment is a set of scalar fields varying across space, plus the geometry that holds them. Nothing here responds to the player directly; cells respond to it, and populations change it.

### The fields

| Field | Confirmed | Sensed by |
|---|---|---|
| [[Temperature]] | V09 | [[Thermoreceptor (THMR)]] |
| [[Light]] | V09 | [[Photochrome (PCHR)]], [[Photovector (PHVC)]] |
| [[pH]] | V09 | [[Protoreceptor (PRTR)]] |
| [[Salinity]] | V09 | [[Osmoreceptor (OSMR)]] |
| [[Flow]] | V09 — "currents" | Nothing. Cells experience it, never measure it |
| [[Microniche]] | V09 | Nothing directly — it is a consequence of the others |
| [[Redox Stratification]] | Implied by §7.1 | [[Redoxin (RDXN)]] |
| [[Surfaces and Geometry]] | Implied by §7.1 | Nothing directly |
| [[UV]] | **No** — proposed addition | Nothing; only [[Damage Receptor (DMGR)]] after the fact |

### Every field needs a gene that cares about it

This is the first of the three rules governing the [[Gene Catalog]], and it is what keeps the environment from being scenery. A field that no gene reads and no gene answers is a number the player can ignore.

Three fields deliberately have no receptor — [[Flow]], [[Surfaces and Geometry]] and [[UV]]. Cells are subject to them without perceiving them, which forces the player to reason from proxies rather than read a value. That is a feature and should not be quietly fixed by adding receptors.

### The environment is partly built by its inhabitants

The most consequential conditions in a mature world are not the ones the simulation set:

- Fermenting populations acidify their own water, changing [[pH]] for everyone in it
- [[Chlorin]] phototrophs strip red and blue light, leaving a filtered spectrum below — see [[Phototrophy]]
- Aerobic respiration draws down [[Oxidex]], deepening [[Redox Stratification]]
- [[Cohesin (COHS)]] and [[Matrixin Synthase (MTXS)]] aggregates create interiors with conditions of their own. [[Adhesin (ADHN)]] holds a cell on a surface and does not build those aggregates by itself

Specification §7.4's emergence gate asks for exactly this: outcomes that follow from ordinary rules rather than from rules written to produce them.

### Physical consistency

Specification §2.4 sets two constraints that are easy to violate in implementation:

**[[pH]] is logarithmic** and must never be averaged as though it were a concentration. Mixing two parcels of water does not average their pH values.

**Carbon fixation needs reducing equivalents separately from energy.** [[Reducin]] and [[ATP]] are not interchangeable, and any place the design lets one substitute for the other must declare it.

### Related
[[Resource Index]] · [[Metabolic Map]] · [[Homeostasis]] · [[Perception]] · [[Prokaryon]]
