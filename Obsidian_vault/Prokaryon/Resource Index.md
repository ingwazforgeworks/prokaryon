# Resource Index

**32 named resources.** Specification §4.2 warns against simulating every metabolite, so each entry here must either limit a decision or create an interaction between species. Anything that does neither should be deleted rather than balanced.

See [[Naming Conventions]] for the suffix scheme and [[Metabolic Map]] for how these connect.

## Cell-internal pools

| Resource | Role | Produced by | Consumed by |
|---|---|---|---|
| [[ATP]] | Immediately usable energy | [[ATP Synthase (ATPS)]] | Every active process |
| [[Fluxin]] | Energy intermediate and ion-motive-force proxy | [[Fluxidase (FLUX)]], [[Photorhodin (PHOR)]], [[Reaction Center (RXNC)]] | [[ATP Synthase (ATPS)]], [[Reducin Dehydrogenase (RDCD)]], [[Flagellar Motor Protein (FLGM)]] |
| [[Reducin]] | Reducing power for biosynthesis | [[Reducin Dehydrogenase (RDCD)]], [[Reaction Center (RXNC)]] | [[Glycon Synthase (GLYS)]] |
| [[Biomass]] | Structural material; gates growth and division | [[Anabolase (ANAB)]] | Growth, division, maintenance losses |
| [[Osmolyn]] | Compatible solute balancing internal water | [[Osmolyn Synthase (OSMS)]] | Osmotic defence |

## Soluble fuels

Each is an electron donor a cell can import and burn. Together they define which niches are habitable.

| Resource | Character | Liberated from |
|---|---|---|
| [[Glycon]] | Abundant general-purpose fuel | [[Carbohydron]] |
| [[Lipron]] | Energy-dense, concentrated in debris | [[Cerumen]] |
| [[Nitrox]] | Fuel and the only nitrogen source | [[Azoite]] |
| [[Sulfex]] | Dark-niche chemical fuel | [[Thionite]] |
| [[Ferron]] | Surface-bound mineral fuel | [[Ferracite]] |

## Insoluble stocks

Cannot be imported. A cell must pay for an extracellular enzyme first, and the product is exposed to neighbours. This is where public-goods exploitation lives.

[[Carbohydron]] · [[Cerumen]] · [[Azoite]] · [[Thionite]] · [[Ferracite]]

Taxonomy notes: [[Soluble Resource]] · [[Insoluble Resource]]

## Electron acceptors

Respiration needs somewhere to put electrons. Acceptor availability, not fuel availability, is what makes depth and enclosure matter. See [[Redox Stratification]].

| Resource | Yield | Where | Product |
|---|---|---|---|
| [[Oxidex]] | Highest | Open, lit, flowing water | Oxidative damage |
| [[Sulfex]] | Moderate | Anoxic sediment and caves | None — the Sulfex is simply consumed |
| none | Lowest | Anywhere | [[Fermentate]] |

[[Sulfex]] appears twice in this index, once as a fuel and once as an acceptor, because it is a single pool with no oxidation state. That is a declared abstraction and its consequences — including the loss of sulfur cross-feeding — are set out on [[Sulfex]].

## Carbon and light

| Resource | Role |
|---|---|
| [[Carbex]] | Dissolved inorganic carbon; the input to fixation |
| [[Light]] | Energy input; directional, attenuated, and damaging in excess |

## Secreted and shared molecules

Every entry here is visible to other species. That exposure is the point.

| Resource | Made by | Effect on others |
|---|---|---|
| [[Quoron]] | [[Quoron Synthase (QURS)]] | Density signal; also reveals you |
| [[Siderin]] | [[Siderin Synthase (SIDS)]] | Frees [[Ferron]] for anyone nearby |
| [[Matrixin]] | [[Matrixin Synthase (MTXS)]] | Shelter that squatters can occupy |
| [[Capsulin]] | [[Capsulin Synthase (CAPS)]] | Private; protects only the producer |
| [[Lysin]] | [[Lysin Synthase (LYSS)]] | Damages susceptible cells indiscriminately |
| [[Fermentate]] | [[ATP Synthase (ATPS)]] at low yield | Acidifies the niche; edible cross-feed |
| [[Ectodin]] | Cell lysis and death | Gene pool for [[Competence Uptake (COMP)]] |

## Storage and structural polymers

| Resource | Role |
|---|---|
| [[Granulin]] | Insoluble internal store of [[Glycon]] |

## Pigments

Four pigments, four absorption bands. They are prerequisites for both harvesting light and *sensing* it, so a cell can only see the bands it can eat. See [[Phototrophy]] and [[Photochrome (PCHR)]].

| Pigment | Band | Made by | Enables |
|---|---|---|---|
| [[Rhodin]] | Mid-spectrum | [[Rhodin Synthase (RHDS)]] | [[Photorhodin (PHOR)]] |
| [[Chlorin]] | Red and blue | [[Chlorin Synthase (CHLS)]] | [[Reaction Center (RXNC)]] |
| [[Carotin]] | Blue-violet | [[Carotin Synthase (CRTS)]] | [[Photoprotectin (PHPR)]] |
| [[Phycin]] | Green and orange | [[Phycin Synthase (PHYS)]] | Accessory antenna for filtered light |

## Conservation rule

Specification §7.5 requires that environmental inputs, biomass, waste, and losses can be traced, and §4.4 forbids net matter creation from corpses. Two consequences bind every note in this index:

1. No gene may output a resource it does not consume an input for. The exceptions are [[Light]] as an external input and the environmental sources of the insoluble stocks.
2. Death returns a cell's [[Biomass]] to [[Cerumen]] and [[Carbohydron]], and its genome to [[Ectodin]], at a loss. Recycling must never be more profitable than growth.
