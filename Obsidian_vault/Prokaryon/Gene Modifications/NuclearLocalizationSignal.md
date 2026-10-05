**Modification Name:** Nuclear Localization Signal  
**Type:** [[Gene Modification]] — localization  
**Status:** Proposed — eukaryotic only; depends on the scope conflict recorded in [[Nucleus]]  
**Destination:** [[Nucleus]], through the [[Nuclear Membrane]]  
**Applies to:** Regulators, and anything else that must reach the genome

A tag that gets a protein past the [[Nuclear Membrane]]. Without it, a protein made in the [[Cytosol]] stays there permanently.

### Why it is the most consequential modification

The other tags change where a protein *works*. This one changes whether a protein works at all. A regulator that cannot reach the genome has no effect, so in a eukaryotic cell this tag is not an optimisation — it is the difference between a functioning regulatory gene and a dead one.

That makes it the clearest teaching mechanism in the eukaryotic half of the design. A player who forgets the tag sees their regulation do nothing, and the [[Personal Cell Map]] shows them exactly why: the protein is in the wrong compartment. Confirmed requirement V25 asks the cell map to make internal state legible, and a mislocalised regulator is the best case for it.

### The cost is time

Crossing a membrane takes longer than diffusing across a shared volume, so a nuclear regulator responds more slowly than the prokaryotic equivalent. That is the eukaryotic trade in miniature: better organisation, worse reflexes. A cell that needs to react fast to [[Temperature]] or [[Oxidex]] is arguably worse off with a nucleus, which is one of the few mechanisms keeping the prokaryotic form competitive after the transition.

### Open questions

**Whether it should be automatic.** Auto-tagging every regulator removes the failure mode and with it the lesson. Leaving it manual risks tedium once a genome has many regulators. A reasonable middle: the designer warns about an untagged regulator without fixing it.

**Whether partial tagging is allowed.** A regulator split between compartments is real biology and a plausible mechanic, but it adds a continuous dial to a system that is currently a clean binary. Not recommended for a first pass.

### Related
[[Nucleus]] · [[Nuclear Membrane]] · [[Gene Modification]] · [[Regulation]] · [[Operator Tag]]
