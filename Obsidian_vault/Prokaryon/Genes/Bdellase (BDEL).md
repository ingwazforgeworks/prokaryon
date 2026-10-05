**Gene ID:** BDEL  
**Gene Name:** Bdellase  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Attaches to another cell, breaches its envelope, and digests its contents in place. The only gene in the catalog that treats another player's cell as a food source rather than as competition.  
**Inputs:** [[ATP]]; sustained contact with a viable prey cell  
**Outputs:** The prey's [[Biomass]] and stores, transferred to the predator at a loss  
**Expression scaling:** [[Threshold Scaling]] — a discrete capability with a handling time per prey  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Sustained contact; defeated by [[Capsulin]] and [[Envelope Thickener (ENVT)]]  
**Default Localization:** Cell membrane, polar  
**Tradeoff:** Requires prey density the predator does not control. Handling time means a predator can only process one cell at a time, so a predator lineage starves in sparse water and cannot switch to eating dissolved nutrients without buying permeases it skipped.  
**Design basis:** Predatory bacteria such as *Bdellovibrio*, which attach to and consume other cells. Labelled as inspired rather than modelled: this is a stylised single-module abstraction of a complex lifecycle.

**Predation without a command.** Requirement V02 forbids attack orders, so a predator is not a cell that hunts — it is a cell that is *good at encountering*. That makes predation a composition of unrelated genes: [[Taxis Regulator (TAXR)]] to drift toward prey signals, and BDEL to attach and convert the encounter into food. [[Adhesin (ADHN)]] does not help, because it grips debris, minerals, and terrain, not cells. [[Cohesin (COHS)]] grips only the predator's own type, so it clumps the hunters together rather than holding prey. Specification §3.2 requires that no player action secretly applies force, and nothing here does.

**It hunts by listening.** [[Quoron]] is the cheapest way to find a colony, so a predator with [[Quoron Receptor (QURR)]] locates prey by the prey's own coordination signal. See [[Quoron]] on why that exposure is intentional.

**It prefers the well-fed.** A prey cell loaded with [[Granulin]] is worth more than a starving one, which means investing in famine survival directly subsidises predators — the one case in the catalog where a defensive investment makes its owner a better target.
