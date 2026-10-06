# Prokaryon — Design Wiki

Working reference for the in-world content of **Prokaryon**. The authoritative rules documents are `docs/Prokaryon_Development_Specification.md` and `docs/Prokaryon_Implementation_Task_Backlog.md`, outside this vault. This wiki holds the *content layer*: the named genes, resources, environmental fields, and concepts the player actually sees.

Where the specification and this wiki disagree, the specification wins. Record design changes there and reflect the consequence here.

## Status labels

Every note carries a **Status** field using the specification's vocabulary:

- **Confirmed** — explicitly required by the brief or already built.
- **Proposed** — a candidate entry for evaluation. Most of this wiki is Proposed.
- **Open** — the entry exists but a decision inside it is unresolved.

A Proposed gene is not a launch commitment. Specification §6.4 treats the content families as a catalog to draw from, and every family must earn its place in the actual ecology before it is produced.

## Start here

- [[Gene Catalog]] — the complete proposed gene roster with IDs, categories, and dependencies.
- [[Resource Index]] — every named resource, its type, and its producers and consumers.
- [[Naming Conventions]] — how gene names, gene IDs, and resource names are formed.
- [[Metabolic Map]] — how resources flow from the environment into ATP and biomass.

## Gene categories

Seven categories, covering all 92 genes. The spec families in §6.4 do not map one-to-one onto these; the right-hand column records how they were folded together.

| Category | Genes | Purpose | Spec families folded in |
|---|---|---|---|
| [[Metabolism]] | 35 | Uptake, digestion, energy conversion, biosynthesis, storage, pigments, emitted light | Nutrient acquisition, energy metabolism, carbon assimilation, light biology |
| [[Homeostasis]] | 13 | Thermal, pH, osmotic and oxidative tolerance; resistance to attack | Homeostasis, antagonism defences |
| [[Morphology]] | 16 | Envelope, shape, size, surface structures, secreted weapons | Cell architecture, social behaviour, antagonism |
| [[Motility]] | 9 | Filaments, motors, taxis, surface crawling, cilia | Motility |
| [[Perception]] | 9 | Receptors that gate regulatory inputs | Regulatory support for all families |
| [[Regulation]] | 4 | Transcription factors, memory, population signalling | Gene designer, social signalling |
| [[Reproduction]] | 6 | Gene transfer, plasmid carriage, dormancy, division timing | Gene exchange, persistence |

## Environment

[[Environment]] — [[Temperature]] · [[Light]] · [[pH]] · [[Salinity]] · [[Flow]] · [[Surfaces and Geometry]] · [[Redox Stratification]] · [[Microniche]] · [[UV]]

## Core concepts

[[Expression]] · [[Localization]] · [[Mutation Points]] · [[Gene Slots]] · [[Expression Capacity]] · [[Species]] · [[Division]] · [[Extinction]] · [[Horizontal Gene Transfer]] · [[Personal Cell Map]] · [[Gene Modification]] · [[Phototrophy]]

## Content schema

Field vocabularies used by every gene note.

**Expression scaling:** [[Linear Expression Scaling]] · [[Saturating Scaling]] · [[Threshold Scaling]] · [[Cooperative Scaling]] · [[Diminishing Returns Scaling]] · [[Stepwise Scaling]]

**Promoters:** [[Constitutive]] · [[Conditional]] · [[Operator Tag]]

**Localization:** [[Cytosol]] · [[Plasma Membrane]] · [[Extracellular]] · [[Nucleus]] · [[Nuclear Membrane]]

**Gene modifications:** [[SecretoryPeptide]] · [[TransmembraneSignal]] · [[PolarLocalizationSignal]] · [[NuclearLocalizationSignal]]

## Unresolved conflicts with the specification

Two places where this vault and the authoritative documents disagree. Both need a specification revision rather than a vault edit.

| Conflict | Where |
|---|---|
| A eukaryotic transition is being designed, but decision B02 and §2.2 place it outside scope | [[Nucleus]] |
| [[UV]] is treated as an environmental field, but requirement V09 does not list it and §7.1 does not describe it | [[UV]] |
