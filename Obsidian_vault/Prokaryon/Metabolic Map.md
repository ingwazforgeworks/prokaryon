# Metabolic Map

How every resource reaches [[ATP]] and [[Biomass]]. The shape is a funnel: many environmental inputs converge on [[Fluxin]], which splits into energy and reducing power, which recombine into biomass.

## The funnel

```text
INSOLUBLE STOCKS          SOLUBLE FUELS            INTRACELLULAR
Carbohydron  --GLYH-->    Glycon      --GLYP-->    Glycon  --+
Cerumen      --LIPH-->    Lipron      --LIPP-->    Lipron  --+
Azoite       --AZOH-->    Nitrox      --NITP-->    Nitrox  --+--FLUX--> Fluxin
Thionite     --THNL-->    Sulfex      --SLFP-->    Sulfex  --+
Ferracite    --FCTR-->    Ferron      --FERP-->    Ferron  --+

Light + Rhodin   --PHOR--------------------------------------> Fluxin
Light + Chlorin  --RXNC--------------------------------------> Fluxin + Reducin

                          Fermentate  --FRMP-->    Fermentate --+
                          Siderin+Ferron --SIDP--> Ferron
```

The two rows at the bottom are other cells' output. [[Fermentate]] is waste from a fermenter and [[Siderin]] is a chelator somebody paid to secrete, so a genome built around those two permeases eats nothing the world produced on its own.

## Splitting Fluxin

```text
Fluxin --ATPS--> ATP        yield set by the active terminal module
Fluxin --RDCD--> Reducin    reducing power for biosynthesis
```

Motility is an [[ATP]] expense, not a Fluxin one: [[Flagellar Motor Protein (FLGM)]] and [[Ciliary Motor (CILM)]] draw from the ATP pool that [[ATP Synthase (ATPS)]] fills, so movement competes with growth and maintenance rather than with [[Reducin]] production.

The yield of [[ATP Synthase (ATPS)]] is not fixed. It depends on which terminal module is expressed and whether that module's acceptor is locally available:

| Terminal module | Acceptor | Relative ATP yield | Byproduct |
|---|---|---|---|
| none | — | Lowest | [[Fermentate]], which acidifies the water and feeds cross-feeders |
| [[Sulfex Reductase (SLFR)]] | [[Sulfex]] | Moderate | None tracked — [[Sulfex]] is simply consumed |
| [[Oxidex Reductase (OXDR)]] | [[Oxidex]] | Highest | Oxidative damage |

This is the single most important economic lever in the game. A cell in open water with [[Oxidex Reductase (OXDR)]] and [[Oxidex Detoxase (OXDT)]] extracts several times more ATP from the same food than a cell fermenting in a cave — and pays for two genes, an acceptor dependency, and exposure to be there. See [[Redox Stratification]].

**Declared simplification:** [[Fluxin]] merges an energy-carrying intermediate with ion motive force. Specification §2.4 requires that combining these be stated rather than assumed, and this note is that statement.

## Building biomass

Carbon and nitrogen must both arrive, and the energy that powers assembly is separate from the reducing power that builds bonds.

```text
Glycon or Lipron  --+
Nitrox --NITA-----> +--ANAB--> Biomass --> growth --> Division
ATP  --------------+
```

Autotrophy is the alternative entry point, and it is a chain rather than a single gene. Specification §21.4 lists this composition explicitly: energy supply plus reducing power plus fixation machinery.

```text
Carbex --CBXP--> Carbex(in) --+
Reducin ---------------------+--GLYS--> Glycon --> ANAB --> Biomass
ATP -------------------------+
```

A phototroph with [[Photorhodin (PHOR)]] alone makes [[ATP]] and starves, because rhodopsin-style pumping supplies no [[Reducin]] and no carbon. Reaching autotrophy requires [[Chlorin Synthase (CHLS)]], [[Reaction Center (RXNC)]], [[Carbex Permease (CBXP)]], and [[Glycon Synthase (GLYS)]] together. That is the intended late-game investment, and it is deliberately the longest dependency chain in the [[Gene Catalog]].

## Storage and recycling

```text
Glycon --GRNS--> Granulin --GRNH--> Glycon      lossy in both directions
Biomass --death--> Cerumen + Carbohydron        lossy
genome --death--> Ectodin --COMP--> genes       lossy
```

## Where the strategies are

The map produces distinct viable lineages rather than one optimum, which is the requirement in specification §6.5 decision D16 that advanced technology be more specialized rather than simply stronger.

| Strategy                | Core genes                            | Wins where                               | Loses where             |
| ----------------------- | ------------------------------------- | ---------------------------------------- | ----------------------- |
| Sugar grazer            | GLYP, FLUX, ATPS                      | Ambient [[Glycon]] is available          | Depleted open water     |
| Debris scavenger        | LIPH, LIPP + [[TransmembraneSignal]]  | Dead cells accumulate                    | Clean, sparse water     |
| Aerobic specialist      | OXDR, OXDT                            | Flowing, lit, open water                 | Caves and sediment      |
| Sediment chemotroph     | SLFP, SLFR                            | Dark anoxic niches                       | Oxidized surfaces       |
| Surface miner           | ADHN, FCTR, FERP                      | Mineral surfaces                         | Open water              |
| Surface phototroph      | CHLS, RXNC, CBXP, GLYS, CRTS          | Bright water with [[Carbex]]             | Shade and crowding      |
| Shade phototroph        | PHYS, RXNC, CBXP, GLYS                | Beneath an established phototroph canopy | Open, unfiltered light  |
| Light-subsidised grazer | GLYP, RHDS, PHOR                      | Lit water with some food                 | Darkness                |
| Cross-feeder            | FRMP, FLUX, ACDT                      | Beside a crowded fermenting colony       | Clean water             |
| Cheat                   | A permease with no matching hydrolase | Beside enzyme producers                  | Alone                   |
| Predator                | BDEL, TAXR                            | Dense prey populations                   | Sparse or armoured prey |

Eleven viable lineages, and no row beats every other row. Three of them — shade phototroph, cross-feeder and cheat — cannot exist unless another player's population is already there, which is the ecological interdependence specification §7.4 asks the emergence gate to demonstrate.
