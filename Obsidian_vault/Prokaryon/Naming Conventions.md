# Naming Conventions

Rules for naming content so that a player can guess what an unfamiliar entry does.

## Gene note titles

`<Subject> <Function> (<ID>)` — for example [[Glycon Permease (GLYP)]], [[Azoite Hydrolase (AZOH)]].

Genes whose function needs no subject drop it: [[Fluxidase (FLUX)]], [[Anabolase (ANAB)]], [[Repairase (REPR)]].

Some genes are named for the protein rather than the reaction, because that is how the real thing is named and it reads better: [[Flagellin (FLGN)]], [[Pilin (PILN)]], [[Buoyin (BUOY)]], [[Floatin (FLOA)]], [[Ballastin (BALA)]], [[Redoxin (RDXN)]], [[Photochrome (PCHR)]], [[Protopump (PPMP)]]. These carry no function word and need none — the name is the thing.

## Gene modification titles

[[Gene Modification]] tags use unspaced compound names to distinguish them from genes at a glance: [[SecretoryPeptide]], [[TransmembraneSignal]], [[PolarLocalizationSignal]], [[NuclearLocalizationSignal]]. A name with no parenthesised ID is never a gene.

## Function words

| Word | Meaning in Prokaryon |
|---|---|
| Permease | Moves a specific soluble resource across the cell membrane |
| Hydrolase | Digests an insoluble organic stock outside the cell |
| Lyase | Dissolves an insoluble mineral stock outside the cell |
| Reductase | Transfers electrons to an acceptor, or liberates a reduced mineral |
| Dehydrogenase | Produces [[Reducin]] from an energy intermediate |
| Synthase | Builds a molecule inside the cell or secretes what it builds |
| Assemblase | Builds and maintains a surface organelle at its localization sites |
| Assimilase | Incorporates a nutrient into [[Biomass]] |
| Receptor | Supplies a sensed value as a regulatory input; builds nothing |
| Regulator | Couples a sensed value to a downstream response |
| Tolerase | Widens tolerance to a stressor rather than removing it |
| Detoxase | Neutralizes a damaging chemical species |

## Gene IDs

Four uppercase letters, occasionally five when four collide. Derived from the name, not from the category. IDs are stable once published: rename the display name freely, never the ID.

Because IDs appear in save data and content files, treat them as the primary key. See specification §11.3 and backlog task S0-05.

Four genes keep the three-letter names of the proteins, because that is what they are called: [[Red Fluorescent Protein (RFP)]], [[Green Fluorescent Protein (GFP)]], [[Yellow Fluorescent Protein (YFP)]], [[Blue Fluorescent Protein (BFP)]]. The short ID is the published key.

## Resource names

Suffixes are a soft convention, not a law. Exceptions exist where a real term reads better ([[ATP]], [[Cerumen]], [[Lysin]], [[Biomass]]).

| Suffix | Class | Examples |
|---|---|---|
| `-on` | Diffusible organic molecule cells make or eat | [[Glycon]], [[Lipron]], [[Ferron]], [[Quoron]] |
| `-ex` / `-ox` | Dissolved inorganic species from the environment | [[Sulfex]], [[Nitrox]], [[Carbex]], [[Oxidex]] |
| `-in` | Cell-internal intermediate or cell-made polymer | [[Fluxin]], [[Reducin]], [[Matrixin]], [[Capsulin]], [[Siderin]], [[Granulin]], [[Osmolyn]] |
| `-ite` / `-ate` / `-cite` | Insoluble stock requiring extracellular attack | [[Azoite]], [[Thionite]], [[Ferracite]], [[Carbohydron]] |

Pigments are cell-made and cell-internal, so they all take `-in`: [[Rhodin]], [[Chlorin]], [[Carotin]], [[Phycin]].

Each soluble fuel has an insoluble counterpart it can be liberated from. That pairing is the backbone of the extracellular-digestion economy, including its public-goods problem.

| Soluble fuel | Insoluble stock | Liberating gene |
|---|---|---|
| [[Glycon]] | [[Carbohydron]] | [[Glycon Hydrolase (GLYH)]] |
| [[Lipron]] | [[Cerumen]] | [[Lipron Hydrolase (LIPH)]] |
| [[Nitrox]] | [[Azoite]] | [[Azoite Hydrolase (AZOH)]] |
| [[Sulfex]] | [[Thionite]] | [[Thionite Lyase (THNL)]] |
| [[Ferron]] | [[Ferracite]] | [[Ferracite Reductase (FCTR)]], [[Siderin Synthase (SIDS)]] |

## Every soluble resource gets a transport gene

A soluble resource with no way in is a dead entry in the [[Resource Index]]. The rule is: **if it dissolves, something can carry it across the membrane.** Insoluble stocks are exempt — they are attacked where they lie, by a hydrolase, lyase or reductase, and the *product* of that attack is what gets transported.

| Soluble resource | Transport gene |
|---|---|
| [[Glycon]] | [[Glycon Permease (GLYP)]] |
| [[Lipron]] | [[Lipron Permease (LIPP)]] |
| [[Nitrox]] | [[Nitrox Permease (NITP)]] |
| [[Sulfex]] | [[Sulfex Permease (SLFP)]] |
| [[Ferron]] | [[Ferron Permease (FERP)]] |
| [[Carbex]] | [[Carbex Permease (CBXP)]] |
| [[Oxidex]] | [[Oxidex Permease (OXDP)]] — marginal; see the note on that gene |
| [[Fermentate]] | [[Fermentate Permease (FRMP)]] |
| [[Siderin]] | [[Siderin Permease (SIDP)]] |
| [[Quoron]] | None — it is detected by [[Quoron Receptor (QURR)]], never imported |
| [[Lysin]] | None — it acts on the envelope from outside |
| [[Ectodin]] | None — taken up by [[Competence Uptake (COMP)]], which is not a permease |

The last three are deliberate: a signal, a weapon and a gene fragment are not food, and giving them permeases would imply they can be metabolised.

### Azoite has no permease, and should not

[[Azoite]] is an **insoluble** nitrogen-rich sediment stock. It cannot cross a membrane at any cost, so an "Azoite Permease" is not a gene that could exist under the physical rules the design has already set.

The function that request was reaching for is already in the catalog, split across two genes: [[Azoite Hydrolase (AZOH)]] attacks the stock outside the cell and releases soluble [[Nitrox]], and [[Nitrox Permease (NITP)]] brings that in. Adding a third gene between them would model nothing.

Recorded here rather than resolved silently, because the alternative reading — that [[Azoite]] should be reclassified as soluble — is a real option with large consequences. It would remove the main reason [[Adhesin (ADHN)]] and surface-anchored digestion exist, so the recommendation is to keep Azoite insoluble.

## Wording discipline

Specification §2.1 and §2.3 require that an abstraction is never taught as a literal biological fact. Each gene note's **Design basis** field states the real mechanism it is inspired by, and where the game deliberately diverges. Invented names are a feature: they signal that Prokaryon models a plausible system rather than claiming to reproduce a specific organism.
