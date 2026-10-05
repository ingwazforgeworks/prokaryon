**Gene ID:** CILR  
**Gene Name:** Ciliary Reversal Channel  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Opens in the cilium when an excitatory signal arrives and lets calcium in. While that calcium stays high, the power stroke reverses. More channel means a weaker stimulus is enough to flip the stroke.  
**Inputs:** An excitatory signal from a receptor  
**Outputs:** Intraciliary calcium, and a reversed power stroke for as long as that calcium stays high  
**Expression scaling:** [[Linear Expression Scaling]] — readiness follows channel abundance  
**Genetic Prerequisites:** [[Ciliary Motor (CILM)]]  
**Other Prerequisites:** At least one receptor to supply the excitatory signal. The channel senses nothing itself  
**Default Localization:** Ciliary membrane  
**Tradeoff:** Readiness is twitchiness. High expression reverses on noise, and the cell never holds the course [[Ciliary Polarizer (CILP)]] set. The calcium is a local signal inside the cilium, not a nutrient pool, and the reversed stroke continues until [[Ciliary Calcium Pump (CILC)]] clears it.  
**Design basis:** The voltage-gated calcium channels of the ciliary membrane that trigger the avoiding reaction in ciliates.

**Not taxis, and not a command.** [[Taxis Regulator (TAXR)]] biases a flagellar turn from a temporal comparison. CILR flips a ciliary stroke when a receptor excites it. Neither one accepts a destination from the player. A cell with no receptor cannot reverse, however much CILR it expresses — requirement V26.
