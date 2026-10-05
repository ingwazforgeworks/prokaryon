**Gene ID:** LYSR  
**Gene Name:** Lysin Resistase  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Binds and neutralises [[Lysin]] before it can damage the envelope. Specific to diffusible toxin and useless against anything else.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Reduced [[Lysin]] damage  
**Expression scaling:** [[Saturating Scaling]] — resistance approaches but never reaches immunity  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane  
**Tradeoff:** Permanent upkeep against an intermittent threat. The cell pays whether or not any toxin producer is nearby, and gains nothing against [[Effector Injector (EFFI)]] or [[Bdellase (BDEL)]].  
**Design basis:** Bacteriocin immunity proteins.

**Required by its own attacker.** Because [[Lysin]] harms kin, a producer lineage must carry this gene too. That coupling is deliberate: it makes aggression a two-gene commitment rather than a cheap opening move, and it means a toxin colony that loses resistance expression poisons itself.

**No general armour.** Each defence in [[Morphology]] answers exactly one attack route, and a cell cannot buy safety — only a guess about what it will meet. [[Envelope Defensin (DEFN)]] blocks injection and nothing else; [[Envelope Thickener (ENVT)]] slows toxin and predators together but taxes every permease in the genome. Requirement V29 asks for hostile mechanisms with observable counterplay, and keeping the counters narrow is what makes the guess matter.
