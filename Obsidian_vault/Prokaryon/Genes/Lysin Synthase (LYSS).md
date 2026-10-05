**Gene ID:** LYSS  
**Gene Name:** Lysin Synthase  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Secretes [[Lysin]], an envelope-damaging agent that diffuses through the surrounding water. Harms every susceptible cell in range without distinguishing targets, including the producer's own kin.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** [[Lysin]] (extracellular)  
**Expression scaling:** [[Linear Expression Scaling]], driven well by a [[Quoron Receptor (QURR)]] density condition  
**Genetic Prerequisites:** None  
**Other Prerequisites:** A viable toxin strategy effectively requires [[Lysin Resistase (LYSR)]] as well  
**Default Localization:** Extracellular  
**Tradeoff:** Costs two genes before it gains anything, poisons the producer's own colony without the resistance gene, and is worthless in any neighbourhood where a competitor already carries resistance.  
**Design basis:** Bacteriocin and antimicrobial secretion.

**Dose, not damage.** Lysin is a field rather than a targeted ability, so effect follows concentration and exposure time — backlog task S3-10 treats dose-response and tolerance as the model. A thin cloud is a growth penalty and a thick one is lethal, and a motile cell can swim out of it. There is no attack command and no click; requirement V02 forbids both.

**It feeds the neighbours.** Killing cells releases [[Cerumen]], [[Carbohydron]] and [[Ectodin]]. A toxin lineage without strong uptake genes does the killing while other species eat the corpses, which makes aggression a poor standalone strategy and a strong complement to scavenging.

**Why the two-gene cost is the point.** Specification §7.4 requires that range, specificity, cost, and resistant competitors all matter. Paying twice before gaining anything is how "cost" is enforced, and a single resistant rival nearby is how "resistant competitors" is enforced — the whole investment becomes dead weight without a refund.
