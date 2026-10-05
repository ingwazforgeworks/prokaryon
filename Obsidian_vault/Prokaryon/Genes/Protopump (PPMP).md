**Gene ID:** PPMP  
**Gene Name:** Protopump  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Pumps acid out of the cell to hold the interior near its optimum, regardless of how acidic the surrounding water becomes. Defends the cell and acidifies its neighbourhood in the same action.  
**Inputs:** [[Fluxin]]  
**Outputs:** Stabilised internal [[pH]]; raised external acidity  
**Expression scaling:** [[Linear Expression Scaling]], driven well by a [[Protoreceptor (PRTR)]] condition  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane  
**Tradeoff:** A continuous energy drain that scales with how bad the outside has become, and it never stops — the cell is bailing, not fixing. In a [[Fermentate]]-saturated niche the cost rises as fast as the colony grows.  
**Design basis:** Proton-translocating ATPases and acid-resistance systems.

**The niche-engineering gene.** Specification §7.1 asks whether cells can materially change their own niche, and PPMP is the answer that says yes. A dense colony expressing it builds a low-pH zone around itself that excludes competitors lacking [[Acid Tolerase (ACDT)]] — a habitat modification produced by players rather than authored by the designer.

It is also a trap: the colony must keep paying forever, and if expression drops the environment it created kills it. Specification §1.3 asks that each adaptation create a cost or vulnerability, and here the vulnerability is dependence on its own success.
