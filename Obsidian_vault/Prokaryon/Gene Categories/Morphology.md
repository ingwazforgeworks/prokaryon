**Category:** Morphology  
**Status:** Confirmed as a content family — specification §6.4  
**Genes:** 16

Everything that changes the cell's physical form or puts apparatus on its surface. Morphology genes rarely affect a pool directly; they change how the cell meets the world, and every other category's effectiveness depends on them.

### Form is a set of trades, not an upgrade

| Gene | Gains | Gives up |
|---|---|---|
| [[Envelope Thickener (ENVT)]] | Resistance to attack and osmotic shock | Transport rate through the envelope |
| [[Shape Determinant (SHPD)]] | Surface area per volume, or streamlining | The opposite one |
| [[Crescentin (CRST)]] | A curve that sits against a surface | A heading, and any use in open water |
| [[Elongin (ELGN)]] | Surface area and a held heading | Drag, shear resistance, turning |
| [[Girthin (GRTN)]] | A sturdy, cheap wall | Uptake and a held heading |
| [[Size Regulator (SIZR)]] | Larger stores, harder to ingest | Slower diffusion, more material per division |
| [[Buoyin (BUOY)]] | Vertical position without swimming | Volume that could have held anything else |
| [[Floatin (FLOA)]] | A larger gas-filled fraction, so lower density | The same internal volume |
| [[Ballastin (BALA)]] | Dense reserves that sink the cell | Those reserves, until they are unpacked |
| [[Capsulin Synthase (CAPS)]] | A protective outer layer | Continuous material cost; slower uptake |

There is no configuration that is simply better. A thick-walled large cell is safe and slow; a thin small one is fast and fragile. Specification §6.4 asks form to interact with the rest of the genome rather than grant flat bonuses, and the transport penalty on [[Envelope Thickener (ENVT)]] is the main lever enforcing that.

### Surface apparatus

[[Adhesin (ADHN)]] is what makes [[Surfaces and Geometry]] matter. A cell that can hold position on debris, mineral, or terrain digests there with [[TransmembraneSignal]] anchoring and stops being at the mercy of [[Flow]]. It does not stick to other cells.

[[Cohesin (COHS)]] is the cooperation gene. It sticks a cell only to other cells of the same type, so a producer's neighbours stay related. [[Matrixin Synthase (MTXS)]] then gives that clump a shared matrix. Nothing in the design implements multicellularity, but cohesin plus a shared matrix produces clumps whose interiors experience different conditions than their exteriors — a [[Microniche]] the players built rather than one the world provided. A lineage that wants both a surface and a clump needs adhesin and cohesin together.

### Offensive apparatus lives here

[[Lysin Synthase (LYSS)]], [[Effector Injector (EFFI)]] and [[Bdellase (BDEL)]] are filed under Morphology because each is a secreted product or a surface machine, which is what this category collects.

This is the least comfortable placement in the taxonomy and worth restating plainly: these three genes are grouped by *what they physically are* rather than by *what they are for*. An explicit antagonism category would read better in the designer. It was folded in here to keep the seven categories the design uses, and the decision is worth revisiting if the weapon roster grows.

The three attacks remain mechanically distinct, which is what confirmed requirement V29 actually asks for:

- [[Lysin Synthase (LYSS)]] — secreted, indiscriminate, affects everything nearby including kin
- [[Effector Injector (EFFI)]] — contact-dependent, targeted, one cell at a time
- [[Bdellase (BDEL)]] — invasive predation, highest yield, needs the most machinery

### Fidelity constraint

There is no progression path from [[Flagellin (FLGN)]] to [[Effector Injector (EFFI)]], and none from [[Pilin (PILN)]] to it either. Specification §2.1 is explicit that flagellar components do not become secretion systems, and source [B6] places non-flagellar injectisomes on a separate lineage. Whatever the tech tree looks like, these must not share an edge.

### Related
[[Motility]] · [[Surfaces and Geometry]] · [[Gene Modification]] · [[Gene Catalog]]
