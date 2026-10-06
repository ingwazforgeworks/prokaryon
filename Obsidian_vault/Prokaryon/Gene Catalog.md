# Gene Catalog

The complete proposed gene roster: **92 entries**, organised into seven categories — [[Metabolism]], [[Homeostasis]], [[Morphology]], [[Motility]], [[Perception]], [[Regulation]] and [[Reproduction]]. Derived from the content families in specification §6.4 and the environmental fields in §7.1, so that every environmental field has at least one gene that responds to it and every gene has a reason to exist in the ecology.

Status legend: **C** confirmed · **P** proposed · **O** open decision inside the entry.

Localization tags are not genes and are catalogued separately in [[Gene Modification]]. Promoters are not genes either — see [[Constitutive]] and [[Conditional]].

## How the catalog was chosen

Three rules kept the roster from becoming a shapeless list.

1. **Every environmental field needs a gene that cares about it.** Specification §7.1 warns that an extra scalar with no distinct adaptation adds tuning work without depth. [[Temperature]], [[Light]], [[pH]], [[Salinity]], [[Flow]], nutrients, electron acceptors, signals, and [[Surfaces and Geometry]] each have dedicated entries.
2. **Every gene must create a cost or vulnerability, not just an ability.** Specification §1.3 asks whether each adaptation solves a problem while opening a weakness. The **Tradeoff** field on each note names that weakness, and an entry without one is a balance bug.
3. **Chains, not single wins.** Phototrophy, carbon fixation, motility, and gene transfer are each split into components that compose, matching the typed progression edges of §6.3 and the examples in §21.4. Capturing light is not the same as making biomass; possessing a filament is not the same as swimming somewhere useful.

A fourth rule was added while reconciling this catalog against the resource economy: **every soluble resource gets a transport gene, and insoluble stocks get none.** The reasoning and the full table are in [[Naming Conventions]].

---

# [[Metabolism]] — 35 genes

## Uptake

| ID | Gene | Moves | Notes | S |
|---|---|---|---|---|
| GLYP | [[Glycon Permease (GLYP)]] | [[Glycon]] | Starter uptake route | C |
| LIPP | [[Lipron Permease (LIPP)]] | [[Lipron]] | | P |
| NITP | [[Nitrox Permease (NITP)]] | [[Nitrox]] | Fuel and nitrogen source | P |
| SLFP | [[Sulfex Permease (SLFP)]] | [[Sulfex]] | Dark-niche fuel | P |
| FERP | [[Ferron Permease (FERP)]] | [[Ferron]] | Surface-associated fuel | P |
| CBXP | [[Carbex Permease (CBXP)]] | [[Carbex]] | Gateway to carbon fixation | P |
| OXDP | [[Oxidex Permease (OXDP)]] | [[Oxidex]] | Marginal; cut it if it cannot beat free diffusion | O |
| FRMP | [[Fermentate Permease (FRMP)]] | [[Fermentate]] | Eats another lineage's waste | P |
| SIDP | [[Siderin Permease (SIDP)]] | [[Siderin]] + its [[Ferron]] | Recovers the chelator | P |

## Extracellular digestion

Each of these can be tagged with [[SecretoryPeptide]] or [[TransmembraneSignal]], and that choice matters more than the gene.

| ID | Gene | Releases | Notes | S |
|---|---|---|---|---|
| GLYH | [[Glycon Hydrolase (GLYH)]] | [[Glycon]] from [[Carbohydron]] | | C |
| LIPH | [[Lipron Hydrolase (LIPH)]] | [[Lipron]] from [[Cerumen]] | | P |
| AZOH | [[Azoite Hydrolase (AZOH)]] | [[Nitrox]] from [[Azoite]] | | P |
| THNL | [[Thionite Lyase (THNL)]] | [[Sulfex]] from [[Thionite]] | Needs surface contact | P |
| FCTR | [[Ferracite Reductase (FCTR)]] | [[Ferron]] from [[Ferracite]] | Needs surface contact | P |

## Energy conversion

| ID | Gene | Reaction | Notes | S |
|---|---|---|---|---|
| FLUX | [[Fluxidase (FLUX)]] | Any intracellular fuel → [[Fluxin]] | Shared catabolic step | C |
| ATPS | [[ATP Synthase (ATPS)]] | [[Fluxin]] → [[ATP]] (+[[Fermentate]]) | Starter gene; baseline yield is low | C |
| OXDR | [[Oxidex Reductase (OXDR)]] | Raises ATP yield; consumes [[Oxidex]] | Best yield, needs oxidant | P |
| SLFR | [[Sulfex Reductase (SLFR)]] | Raises ATP yield; consumes [[Sulfex]] | Anoxic niches | P |
| RDCD | [[Reducin Dehydrogenase (RDCD)]] | [[Fluxin]] → [[Reducin]] | Reducing power for biosynthesis | P |

## Phototrophy

Two branches sharing no progression edge, per specification §2.1. See [[Phototrophy]].

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| RHDS | [[Rhodin Synthase (RHDS)]] | Builds [[Rhodin]] | Cheapest pigment; also the cheapest sensor | P |
| PHOR | [[Photorhodin (PHOR)]] | [[Light]] → [[Fluxin]] | Cheap, low yield, no carbon. Needs RHDS | P |
| CHLS | [[Chlorin Synthase (CHLS)]] | Builds [[Chlorin]] antenna | Nitrogen-hungry; prerequisite for RXNC | P |
| RXNC | [[Reaction Center (RXNC)]] | [[Light]] → [[Fluxin]] + [[Reducin]] | High yield, high cost, photodamage | P |
| CRTS | [[Carotin Synthase (CRTS)]] | Builds [[Carotin]] | Accessory antenna and safety valve | P |
| PHYS | [[Phycin Synthase (PHYS)]] | Builds [[Phycin]] | Harvests light other phototrophs discarded | P |

## Light emission

The cell produces [[Light]] rather than absorbing it. Pigments colour the body; these four add a glow. Each emits one band, and only a pigment covering that band can harvest or sense it. See [[Phototrophy]].

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| RFP | [[Red Fluorescent Protein (RFP)]] | Emits red [[Light]] | Cheapest glow; [[Chlorin]] can take it | P |
| GFP | [[Green Fluorescent Protein (GFP)]] | Emits green [[Light]] | Blends into a Chlorin shadow; [[Phycin]] can take it | P |
| YFP | [[Yellow Fluorescent Protein (YFP)]] | Emits yellow [[Light]] | [[Rhodin]] reads it, and Rhodin is the cheapest sensor | P |
| BFP | [[Blue Fluorescent Protein (BFP)]] | Emits blue [[Light]] | Dearest glow; [[Chlorin]] and [[Carotin]] both read it | P |

## Biosynthesis and storage

| ID | Gene | Reaction | Notes | S |
|---|---|---|---|---|
| GLYS | [[Glycon Synthase (GLYS)]] | [[Carbex]] + [[Reducin]] + [[ATP]] → [[Glycon]] | Completes autotrophy | O |
| NITA | [[Nitrox Assimilase (NITA)]] | [[Nitrox]] → nitrogen for [[Biomass]] | Nitrogen limitation | P |
| ANAB | [[Anabolase (ANAB)]] | Carbon + nitrogen + [[ATP]] → [[Biomass]] | Growth and division rate | P |
| GRNS | [[Granulin Synthase (GRNS)]] | Stores [[Glycon]] as [[Granulin]] | Conversion loss both ways | P |
| GRNH | [[Granulin Hydrolase (GRNH)]] | Recovers stored [[Granulin]] | Futile cycle risk with GRNS | P |
| SIDS | [[Siderin Synthase (SIDS)]] | Secretes [[Siderin]] chelator | Classic public good | P |

---

# [[Homeostasis]] — 13 genes

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| PPMP | [[Protopump (PPMP)]] | Defends internal pH | Acidifies the neighbourhood | P |
| ACDT | [[Acid Tolerase (ACDT)]] | Widens pH tolerance | Slower growth everywhere | P |
| OSMS | [[Osmolyn Synthase (OSMS)]] | Builds [[Osmolyn]] | Expensive in carbon | P |
| AQUP | [[Aquaporin (AQUP)]] | Fast water flux control | Fast response, poor buffering | P |
| HSP | [[Heat Shock Protein (HSP)]] | Protects proteins from heat | Widens; constant upkeep | P |
| CSP | [[Cold Shock Protein (CSP)]] | Sustains synthesis in cold | Buys throughput, not survival | P |
| MSAT | [[Membrane Saturase (MSAT)]] | Shifts the optimum warmer | Costs [[Reducin]]; slows all transport | P |
| MDES | [[Membrane Desaturase (MDES)]] | Shifts the optimum colder | Leakier envelope | P |
| OXDT | [[Oxidex Detoxase (OXDT)]] | Neutralizes oxidative damage | Required to exploit high [[Oxidex]] | P |
| PHPR | [[Photoprotectin (PHPR)]] | Limits photodamage | Wastes captured light. Needs CRTS | P |
| REPR | [[Repairase (REPR)]] | Repairs accumulated damage | Competes with growth for [[ATP]] | P |
| LYSR | [[Lysin Resistase (LYSR)]] | Resists [[Lysin]] | Permanent upkeep | P |
| DEFN | [[Envelope Defensin (DEFN)]] | Blocks injected effectors | Specific, not general armour | P |

---

# [[Morphology]] — 16 genes

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| ENVT | [[Envelope Thickener (ENVT)]] | Resists toxins and predation | Slows all uptake | P |
| CAPS | [[Capsulin Synthase (CAPS)]] | Secretes a [[Capsulin]] capsule | Heavy carbon cost | P |
| SHPD | [[Shape Determinant (SHPD)]] | Rod, sphere, or filament | Drag against surface area | O |
| CRST | [[Crescentin (CRST)]] | Bends the long axis into a crescent | Needs a long axis; same flag as SHPD | P |
| ELGN | [[Elongin (ELGN)]] | Raises the length-to-width ratio | Fights GRTN; same flag as SHPD | P |
| GRTN | [[Girthin (GRTN)]] | Lowers the length-to-width ratio | Fights ELGN; same flag as SHPD | P |
| SIZR | [[Size Regulator (SIZR)]] | Sets cell volume | Stores against diffusion | O |
| BUOY | [[Buoyin (BUOY)]] | Passive drift along the depth axis | No steering involved | O |
| FLOA | [[Floatin (FLOA)]] | Raises the gas-filled fraction of cell volume | Same vesicles as BUOY; opposed by BALA | O |
| BALA | [[Ballastin (BALA)]] | Packages reserves into dense ballast | Sinks the cell; needs reserves | O |
| ADHN | [[Adhesin (ADHN)]] | Sticks to debris, minerals, and terrain | Does not bind cells | P |
| COHS | [[Cohesin (COHS)]] | Sticks to other cells of the same type | Ignores surfaces and other species | P |
| MTXS | [[Matrixin Synthase (MTXS)]] | Secretes [[Matrixin]] biofilm | Shared shelter, exploitable | P |
| LYSS | [[Lysin Synthase (LYSS)]] | Secretes diffusible [[Lysin]] | Indiscriminate, dose-dependent | P |
| EFFI | [[Effector Injector (EFFI)]] | Contact-dependent attack | Requires sustained contact | O |
| BDEL | [[Bdellase (BDEL)]] | Attaches to and digests prey | Needs prey availability | P |

The last three are weapons, filed here because each is a secreted product or surface machine. That placement is the least comfortable decision in the taxonomy and is argued in [[Morphology]].

---

# [[Motility]] — 9 genes

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| FLGN | [[Flagellin (FLGN)]] | Builds filament subunits | Filament alone does not swim | P |
| FLGM | [[Flagellar Motor Protein (FLGM)]] | Converts [[ATP]] into thrust | Requires FLGN | P |
| TAXR | [[Taxis Regulator (TAXR)]] | Biases turning from receptor input | Requires a receptor and FLGM | P |
| PILN | [[Pilin (PILN)]] | Surface attachment and crawling | Slow but flow-resistant | P |
| CILA | [[Cilium Assemblase (CILA)]] | Builds and maintains cilia | Coverage appears gradually | P |
| CILM | [[Ciliary Motor (CILM)]] | ATP-dependent beat strength and rate | Requires CILA | P |
| CILP | [[Ciliary Polarizer (CILP)]] | Resting power-stroke orientation | Thrust, rotation, or local pumping | P |
| CILR | [[Ciliary Reversal Channel (CILR)]] | Excitatory signal reverses the stroke | Needs a receptor; readiness is twitchiness | P |
| CILC | [[Ciliary Calcium Pump (CILC)]] | Clears the reversal signal | Stronger pump, shorter reversal | P |

Flagellar placement is not a gene. It is the [[PolarLocalizationSignal]] tag on FLGN, and without it the filaments cancel each other out. Ciliary placement is the same tag on CILA. [[Ciliary Polarizer (CILP)]] sets the stroke direction of cilia already sited; it is not the positioner gene this catalog declined to add.

---

# [[Perception]] — 9 genes

Receptors build nothing. They exist so a promoter condition has a legitimate source, satisfying requirement V26: absent or inactive sensing machinery cannot supply a functional controller input.

| ID | Gene | Senses | Notes | S |
|---|---|---|---|---|
| CHMR | [[Chemoreceptor (CHMR)]] | A tagged solute | Temporal comparison, not a map | P |
| PCHR | [[Photochrome (PCHR)]] | [[Light]] in one band | Scalar only. Needs a pigment | P |
| PHVC | [[Photovector (PHVC)]] | [[Light]] direction | The sole directional exception | O |
| THMR | [[Thermoreceptor (THMR)]] | [[Temperature]] | | P |
| OSMR | [[Osmoreceptor (OSMR)]] | [[Salinity]] | | P |
| PRTR | [[Protoreceptor (PRTR)]] | [[pH]] | | P |
| RDXN | [[Redoxin (RDXN)]] | [[Oxidex]] / [[Sulfex]] availability | One scalar for two acceptors | P |
| QURR | [[Quoron Receptor (QURR)]] | [[Quoron]] density | Population-density proxy | P |
| DMGR | [[Damage Receptor (DMGR)]] | Internal damage and stress | The only route to [[UV]] awareness | P |

---

# [[Regulation]] — 4 genes

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| REPX | [[Repressor (REPX)]] | Silences tag-matched promoters | Carries requirement V30 | C |
| ACTX | [[Activator (ACTX)]] | Boosts tag-matched promoters | | P |
| MEML | [[Memory Latch (MEML)]] | Holds a state after the cue ends | Feedback stability risk | O |
| QURS | [[Quoron Synthase (QURS)]] | Emits [[Quoron]] signal | Also informs competitors | P |

---

# [[Reproduction]] — 6 genes

| ID | Gene | Function | Notes | S |
|---|---|---|---|---|
| CONJ | [[Conjugation Apparatus (CONJ)]] | Contact-mediated transfer | Carries requirement V12 | O |
| COMP | [[Competence Uptake (COMP)]] | Takes up [[Ectodin]] from water | Uncontrolled provenance | O |
| PLSM | [[Plasmid Maintainer (PLSM)]] | Carries acquired cassettes | Upkeep; can be lost | O |
| RSTD | [[Restriction Defense (RSTD)]] | Rejects incoming DNA | Also blocks wanted gifts | P |
| SPOR | [[Sporulase (SPOR)]] | Enters dormancy | Affects the extinction boundary | O |
| CYCL | [[Cyclin (CYCL)]] | Stimulates division while expressed | Early daughters are smaller | O |

---

## Starter genome

A viable starter needs an energy route, a material route, and nothing else. Backlog task S1-05 requires that starter energy is not created from nothing.

| Gene | Why it is in the starter |
|---|---|
| [[Glycon Permease (GLYP)]] | The declared material and energy input |
| [[Fluxidase (FLUX)]] | Converts that input into [[Fluxin]] |
| [[ATP Synthase (ATPS)]] | Converts [[Fluxin]] into usable [[ATP]] |
| [[Anabolase (ANAB)]] | Turns nutrients into [[Biomass]] so the cell can divide |
| [[Constitutive|constitutive promoter]] | Something must drive expression before regulation is unlocked |

**Open:** decision D42 has not selected between one fixed starter, several archetypes, and a bounded custom starter. The list above is the fixed-starter candidate. [[Nitrox Assimilase (NITA)]] belongs here too if nitrogen limitation is enabled at Stage 1 rather than Stage 3.

## Deliberately excluded

Recording rejections prevents re-litigating them.

| Not included | Reason |
|---|---|
| A nonspecific porin | Free-riding does not need its own gene — a cell carrying a permease but no matching hydrolase already eats its neighbours' digestion products for free |
| An Azoite permease | [[Azoite]] is insoluble and cannot cross a membrane. [[Azoite Hydrolase (AZOH)]] plus [[Nitrox Permease (NITP)]] already does the job; see [[Naming Conventions]] |
| A flagellar positioner gene | Replaced by the [[PolarLocalizationSignal]] tag. Placement is a property of how the filament is built, not a separate organ |
| An ectoenzyme retainer gene | Replaced by the [[TransmembraneSignal]] tag, which is the same choice expressed per enzyme rather than per genome |
| A membrane fluidase gene | Split into [[Membrane Saturase (MSAT)]] and [[Membrane Desaturase (MDES)]], so warm and cold adaptation have different economics |
| A single generic pigment | Split into four pigments with distinct absorption bands, which is what creates spectral competition. See [[Phototrophy]] |
| A second sulfur resource | Compressed into one [[Sulfex]] pool. This gives up sulfur cross-feeding, which [[Fermentate]] now supplies instead |
| Separate high-affinity transporter genes | Affinity belongs to the upgrade system in backlog S2-07, not to duplicate catalog entries |
| Phage and transduction genes | Specification §8.1 rates transduction as a substantial extra subsystem; excluded until a gate justifies it |
| Per-nucleotide promoter design | Specification §5.2 rejects sequence-level construction as biologically unreliable at this fidelity |

**No longer excluded:** a eukaryotic transition. It was cut under decision B02 and §2.2 and is now being built — see [[Nucleus]], which records the resulting specification conflict.
