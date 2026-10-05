**Resource Name:** Sulfex  
**Type:** [[Soluble Resource]] — **both** electron donor and electron acceptor  
**Status:** Proposed — carries a declared abstraction; see below  
**Description:** Dissolved inorganic sulfur. A single pool standing in for the whole sulfur cycle, usable either as a chemical fuel or as a place to dump electrons depending on which gene the cell expresses.  
**Source:** Environmental seeps; released from [[Thionite]] by [[Thionite Lyase (THNL)]]; carried by [[Flow]]  
**Uses:** Imported by [[Sulfex Permease (SLFP)]] and burned for [[Fluxin]] via [[Fluxidase (FLUX)]]; or used as the terminal electron acceptor by [[Sulfex Reductase (SLFR)]]  
**Strategic role:** Sulfex makes dark water habitable, so it is the resource that stops lit water from being the only geography worth holding.

### The declared abstraction

Real sulfur chemistry has oxidation states: sulfate accepts electrons, sulfide donates them, and they are different molecules. **This design does not track that.** One pool, and the direction of use is determined by the gene, not by the resource.

Specification §2.4 requires simplifications of this kind to be declared rather than assumed, so it is declared here: **Sulfex has no oxidation state.** A cell reducing it and a cell oxidising it are both drawing from the same number.

### What the abstraction costs

The sulfur cross-feeding loop. If oxidation state were tracked, reducers would excrete fuel that oxidisers consume, and the two lineages would depend on each other. With one pool they cannot: both are consumers of the same quantity.

So the relationship between sulfur reducers and sulfur oxidisers is **competition, not mutualism.** Two different metabolisms drawing on one contested pool, each viable in different water, neither feeding the other.

That is a genuine loss, and it is acceptable because the cross-feeding requirement in specification §7.4 is already met elsewhere and better: [[Fermentate]] is produced as waste by one strategy and consumed as fuel by another through [[Fermentate Permease (FRMP)]], with no abstraction needed and no oxidation state to track.

### If the loop is wanted back

It needs two resources, and the version this note replaced had them. The decision to compress was deliberate — one resource, one permease, one reductase, and a competitive relationship that is easier to read than a mutualistic one. Reversing it means reintroducing a second sulfur pool and its own permease, and should only be done if the cross-feeding is worth two extra content entries.

### Related
[[Thionite]] · [[Oxidex]] · [[Fermentate]] · [[Redox Stratification]] · [[Sulfex Reductase (SLFR)]] · [[Sulfex Permease (SLFP)]]
