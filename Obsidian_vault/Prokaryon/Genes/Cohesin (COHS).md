**Gene ID:** COHS  
**Gene Name:** Cohesin  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Surface proteins that make the cell stick to other cells of the same type. A cell expressing it clumps with its own [[Species]] and ignores debris, minerals, terrain, and every other species.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Attachment to neighbouring cells of the same species  
**Expression scaling:** [[Linear Expression Scaling]]; attachment strength follows abundance  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Another cell of the same species close enough to touch  
**Default Localization:** Cell membrane, outward-facing  
**Tradeoff:** Clumping is not easily reversed, and it only recognises the same type. A cohesive lineage holds together in open water, which keeps a producer's neighbours related, but it cannot anchor to a deposit and it cannot grip a predator, a prey cell, or a competitor of another species. Leaving the clump means expressing less — a genome edit with its mandatory delay.  
**Design basis:** Homophilic autoaggregation proteins such as antigen 43, which bind the same protein on a neighbouring cell and ignore cells that lack it. The name is the game's. Real cohesin holds sister chromatids, or binds cellulosome dockerins, and neither of those is modelled here.

**It is the cooperation gene.** Specification §7.4 names spatial assortment as a lever determining whether cooperation survives exploitation. Cohesin is that lever: when cells stick only to their own type, a producer's neighbours are mostly other producers, and paying for a public good like [[Siderin]] stops subsidising strangers. Without it, every secreted resource in [[Morphology]] feeds whoever drifts past.

**It is not attachment to the world.** [[Adhesin (ADHN)]] holds a cell on debris, mineral, and terrain and does nothing to other cells. A lineage that wants both a surface and a clump needs both genes. Cohesin in open water makes a drifting aggregate; adhesin on a surface makes a cell that stays put, alone.
