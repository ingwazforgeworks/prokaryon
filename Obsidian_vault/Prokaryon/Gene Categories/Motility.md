**Category:** Motility  
**Status:** Confirmed as a content family — specification §6.4  
**Genes:** 9

Everything that moves the cell. The category most constrained by confirmed requirement V02: **the player never steers a cell.**

### Flagella and pili

| Gene | Role |
|---|---|
| [[Flagellin (FLGN)]] | Builds the filament. Needs [[PolarLocalizationSignal]] to produce thrust rather than cancellation |
| [[Flagellar Motor Protein (FLGM)]] | Turns the filament, burning [[Fluxin]] |
| [[Taxis Regulator (TAXR)]] | Decides when to keep swimming and when to turn |
| [[Pilin (PILN)]] | Surface-bound movement and contact, not swimming |

A cell with the first two and not the third swims in a straight line until it hits something. That is a real strategy in [[Flow]] and a bad one in a patchy world.

### Cilia

A second machine, not an upgrade of the flagellum. Flagella spin on [[Fluxin]]. Cilia bend on [[ATP]], and a stimulus reverses the stroke by letting calcium into the cilium.

| Gene | Role |
|---|---|
| [[Cilium Assemblase (CILA)]] | Builds and maintains cilia. Coverage appears gradually |
| [[Ciliary Motor (CILM)]] | Beats them. Sets the maximum strength and rate, and the [[ATP]] that beat costs |
| [[Ciliary Polarizer (CILP)]] | Sets the resting power stroke: forward thrust, rotation, or local fluid pumping |
| [[Ciliary Reversal Channel (CILR)]] | Admits calcium when a receptor excites it, and reverses the stroke |
| [[Ciliary Calcium Pump (CILC)]] | Clears that calcium. Stronger clearance, shorter reversals |

[[Cilium Assemblase (CILA)]] and [[Ciliary Motor (CILM)]] with no polarizer spend [[ATP]] on strokes that cancel. [[Ciliary Polarizer (CILP)]] commits the resting stroke. [[Ciliary Reversal Channel (CILR)]] and [[Ciliary Calcium Pump (CILC)]] set whether a stimulus flips it and how long the flip lasts. The player sets the readiness and the recovery. The receptor decides the moment.

There is no progression edge from [[Flagellin (FLGN)]] or [[Flagellar Motor Protein (FLGM)]]. Placement of a cilium stays a [[PolarLocalizationSignal]] on CILA. CILP orients the stroke; it does not choose the site.

### Movement is sensing plus a rule

Because the player cannot steer, movement toward anything is a consequence of [[Perception]] and [[Regulation]], not of motility genes. [[Taxis Regulator (TAXR)]] implements the actual mechanism bacteria use — source [B8]: compare the present concentration to the recent past, and if it is improving, turn less often. Ciliary reversal is the other rule, and it still needs a receptor: [[Ciliary Reversal Channel (CILR)]] flips the stroke only when something excitatory arrives.

That is a temporal rule with no directional information in it, and it produces movement up a gradient anyway. It is the single best demonstration in the design that V02's constraint costs nothing in expressiveness.

### The one directional exception

[[Photovector (PHVC)]] is the only gene that supplies a direction rather than a scalar, justified by source [B2]: cyanobacteria genuinely focus light through the cell body and detect where it lands. It is deliberately the exception and must stay that way — a scalar [[Light]] intensity does not contain a vector, and specification §2.1 names inferring one as a fidelity failure.

Directional response also needs polar receptor placement to work at all. See [[PolarLocalizationSignal]].

### Fidelity constraint

[[ATP Synthase (ATPS)]] and [[Flagellar Motor Protein (FLGM)]] share no progression edge. Sources [B4] and [B5] describe two independently evolved rotary machines, and specification §2.1 states directly that an ATP synthase does not become a flagellar motor. They both use [[Fluxin]]; that is a shared input, not a shared ancestry.

### Why movement is usually the wrong answer

Swimming is expensive and the cell cannot see where it is going. In most water, staying put with [[Adhesin (ADHN)]] and better uptake beats searching. Motility earns its cost in patchy environments and in strong [[Flow]], and nowhere else — which is the intended shape rather than an underpowered category.

### Related
[[Perception]] · [[Morphology]] · [[Flow]] · [[Microniche]] · [[Gene Catalog]]
