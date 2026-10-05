**Gene ID:** OXDP  
**Gene Name:** Oxidex Permease  
**Category:** [[Metabolism]]  
**Status:** Open — see the design concern below  
**Description:** A channel that increases the rate at which [[Oxidex]] enters the cell, raising the ceiling on aerobic respiration in water where the oxidant is scarce.  
**Inputs:** [[Oxidex]] (extracellular)  
**Outputs:** [[Oxidex]] (intracellular, at a higher rate than passive entry)  
**Expression scaling:** [[Saturating Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Pointless without [[Oxidex Reductase (OXDR)]]; dangerous without [[Oxidex Detoxase (OXDT)]]  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** It imports a hazard. More [[Oxidex]] inside the cell means more oxidative damage regardless of whether the cell can use it, so this gene makes [[Oxidex Detoxase (OXDT)]] mandatory rather than merely advisable.

**Design concern — this was previously excluded on purpose.** [[Oxidex]] is a small abundant oxidant that should diffuse across a membrane freely, so a transporter for it risks being a false cost: a gene the player must buy for something that would happen anyway.

It is included here to satisfy the rule that every soluble resource has a transport gene. To make it earn its place rather than tax the player, it should raise the *rate ceiling* in oxidant-poor water rather than gate access at all:

| Local Oxidex | Without OXDP | With OXDP |
|---|---|---|
| Abundant, open water | Passive entry already saturates [[Oxidex Reductase (OXDR)]] | No benefit — do not buy it |
| Marginal, sheltered water | Respiration limited by entry rate | Meaningfully higher yield |
| Absent | Nothing to import | Nothing to import |

Read that way, the gene is a specialist tool for the transition zone described in [[Redox Stratification]] rather than a toll on aerobic life. If it cannot be made to work that way in testing, cut it and return [[Oxidex]] to free diffusion.
