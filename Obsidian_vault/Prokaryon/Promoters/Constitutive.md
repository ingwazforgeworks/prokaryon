**Promoter Name:** Constitutive Promoter  
**Type:** Promoter  
**Status:** Confirmed — the starter promoter  
**Description:** Drives its downstream genes at a fixed strength, permanently. No conditions, no receptors, no delay.

**Inputs:** None  
**Parameters:** Expression strength, within the bounds set by [[Expression Capacity]]  
**Downstream genes:** One or many, per confirmed requirement V24

### Why it is the starter

Something has to drive expression before the player has bought any sensing genes, and a promoter with no inputs is the only option that works in a genome with no receptors. Backlog task S1-05 requires a viable starter genome; this is the promoter in it.

### When it is correct

For anything the cell always needs, a constitutive promoter is not a beginner's tool but the right answer. [[ATP Synthase (ATPS)]], [[Fluxidase (FLUX)]] and [[Anabolase (ANAB)]] have no condition under which the cell benefits from switching them off, so regulating them wastes a receptor and adds a failure mode.

### When it is wrong

For anything expensive and situational. [[Photoprotectin (PHPR)]] is the clearest case: expressed constitutively it throws away harvest in dim water, and absent it causes damage in bright water.

Specification §5.4 requires that condition-dependent expression have a reason to beat constitutive overexpression. Each gene note's **Tradeoff** field is where that reason is recorded, and a gene whose tradeoff does not give one has no business carrying a [[Conditional]] promoter.

### Cost

[[Expression Capacity]] is finite and shared. A constitutive promoter holds its share whether or not the gene is useful right now — which is the entire argument for conditional regulation.

### Related
[[Conditional]] · [[Operator Tag]] · [[Expression]] · [[Regulation]]
