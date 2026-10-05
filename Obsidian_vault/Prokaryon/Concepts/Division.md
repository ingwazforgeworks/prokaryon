**Concept:** Reproduction, inheritance, and the event that pays  
**Status:** Confirmed — requirement V08 makes division the source of [[Mutation Points]]

The most consequential event in the simulation. Division continues the lineage, splits everything the parent had, and generates the currency the entire progression depends on.

## Prerequisites

Specification §4.4 requires these to be specified rather than assumed: biomass, energy, limiting nutrients, size, and any timing constraint. In this vault's content model a cell divides when [[Anabolase (ANAB)]] has accumulated enough [[Biomass]] to reach the threshold set by [[Size Regulator (SIZR)]], which requires both a carbon source and nitrogen from [[Nitrox Assimilase (NITA)]]. [[Cyclin (CYCL)]] can pull that commitment forward while it is expressed, at the cost of smaller daughters.

That two-nutrient requirement is deliberate. It means abundant energy does not automatically become population growth, and a lineage can be well fed and unable to reproduce.

## What daughters inherit

Specification §4.4 requires each of these to be defined:

| Inherited | Question |
|---|---|
| Genome version | Which revision, if an edit is maturing? |
| Expression state | Split, or does each daughter start from the parent's level? |
| Damage | Divided, or does one daughter take more? |
| Stored resources | [[Granulin]] and pools split how? |
| Polarity | Which daughter keeps which pole? See [[Localization]] |
| Plasmids | [[Plasmid Maintainer (PLSM)]] cargo is lost at some rate |

## The conservation trap

Specification §4.2 warns against accidentally duplicating proteins, biomass, stored nutrients or mutation points during division, save and load, or retry. The protein case is subtle: growth dilution and splitting molecule counts are different representations, and one must be chosen with the conversion specified.

## The payment must be idempotent

Specification §4.4 requires the event that grants [[Mutation Points]] to be processed idempotently, and backlog task S1-07 requires unique birth and death events. This is not a robustness nicety — a division event that can be replayed through retry, reconnection or server recovery is a currency printer, and backlog task S2-08 requires rapid division-and-death cycling to be tested as an exploit.

## Placement

Specification §4.4 requires daughter placement and collision resolution in a crowded niche to be defined. In a dense biofilm this decides whether a colony expands outward, stalls, or pushes cells into worse conditions — which makes it an ecological rule, not a physics detail. See [[Microniche]] on capacity and overcrowding.

### Related
[[Mutation Points]] · [[Biomass]] · [[Extinction]] · [[Species]]
