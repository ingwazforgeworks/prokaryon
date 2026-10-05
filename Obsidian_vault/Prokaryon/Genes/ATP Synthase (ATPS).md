**Gene ID:** ATPS
**Gene Name:** ATP Synthase
**Category:** [[Metabolism]]
**Status:** Confirmed — starter gene
**Description:** Converts [[Fluxin]] into [[ATP]], supplying the energy needed to maintain the cell, express genes, grow, and perform other cellular functions.
**Inputs**: [[Fluxin]]
**Outputs:** [[ATP]], plus [[Fermentate]] when no terminal reductase is active
**Expression scaling:** [[Linear Expression Scaling]]
**Genetic Prerequisites:** None
**Other Prerequisites:** None
**Default Localization:** Cytosol
**Tradeoff:** Competes with [[Reducin Dehydrogenase (RDCD)]] and [[Flagellar Motor Protein (FLGM)]] for the same [[Fluxin]] pool.
**Design basis:** Rotary ATP synthase. Specification §2.1 is explicit that this does not become a flagellar motor — component homology among export ATPases is not a whole-machine lineage — so there is no progression edge from here to [[Flagellar Motor Protein (FLGM)]].

## Yield depends on the terminal module

ATP per unit of [[Fluxin]] is not fixed. The baseline, with no terminal reductase expressed, is the lowest in the game and excretes [[Fermentate]] — the declared fermentative mode.

| Terminal module | Acceptor | Relative yield | Byproduct |
|---|---|---|---|
| none | — | Lowest | [[Fermentate]] |
| [[Sulfex Reductase (SLFR)]] | [[Sulfex]] | Moderate | [[Sulfex]] |
| [[Oxidex Reductase (OXDR)]] | [[Oxidex]] | Highest | Oxidative damage |

This keeps the gene viable in the starter genome — backlog task S1-05 requires a starter that works without prerequisites — while making respiration a meaningful later investment rather than a replacement. See [[Metabolic Map]].

**Declared simplification:** [[Fluxin]] merges an energy-carrying intermediate with ion motive force. Specification §2.4 requires combining these to be stated rather than assumed.
