**Status:** Proposed — the mechanism is new to the vault and the specification does not yet describe it

A **gene modification** is a short tag the player attaches to a gene in the designer that changes *where the protein ends up* without changing what it does. Modifications are not genes and do not occupy [[Gene Slots]]; they are properties of a gene already in the genome.

### Why the mechanism exists

Without modifications, every destination needs its own gene, and the catalog fills with near-duplicates: a secreted hydrolase and a retained hydrolase, a polar flagellum and a scattered one. Three entries were cut from the [[Gene Catalog]] for exactly this reason and re-expressed as modifications instead.

The player is also making a more honest decision this way. Choosing between [[SecretoryPeptide]] and [[TransmembraneSignal]] on one hydrolase is a single legible trade; buying one of two similarly-named genes is a shopping problem.

### The available modifications

| Modification | Sends the protein to | Typical subject |
|---|---|---|
| [[SecretoryPeptide]] | [[Extracellular]], released | Hydrolases, [[Lysin]], [[Siderin]] |
| [[TransmembraneSignal]] | [[Plasma Membrane]], anchored | Hydrolases, receptors |
| [[PolarLocalizationSignal]] | One end of the cell | [[Flagellin (FLGN)]], [[Cilium Assemblase (CILA)]], [[Adhesin (ADHN)]], [[Cohesin (COHS)]], receptors |
| [[NuclearLocalizationSignal]] | [[Nucleus]] — eukaryotic only | Regulators |

### What modifications must not become

A modification changes destination, not function. It cannot raise a yield, add a substrate, or convert one protein into another — those are gene changes and belong in the [[Gene Catalog]].

Specification §2.1 warns against letting one capability quietly acquire another's, and localization tags are a natural place for that to happen: a tag that makes an enzyme faster as well as better-placed is a stat bonus wearing a biological costume.

### Open questions

**Cost.** Modifications are currently free, which cannot be right — a free polar tag is strictly better than no tag for [[Flagellin (FLGN)]]. Candidates: a small [[Expression Capacity]] charge, an editing-slot charge under decision D12, or a material cost. Unresolved.

**Mutability.** If modifications can be gained or lost by mutation, a lineage can lose its flagellar positioning without losing its flagellum — a legible and interesting failure. If they cannot, they are purely a design-time choice. This bears on [[Mutation Points]] and is unresolved.

**Transfer.** Whether a tag travels with its gene through [[Horizontal Gene Transfer]] affects decisions D19–D25. Travelling together is simpler and probably right.

### Related
[[Localization]] · [[Personal Cell Map]] · [[Gene Catalog]] · [[Cytosol]] · [[Plasma Membrane]]
