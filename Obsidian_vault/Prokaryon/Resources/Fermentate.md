**Resource Name:** Fermentate  
**Type:** [[Soluble Resource]] — metabolic waste and cross-feed  
**Status:** Proposed  
**Description:** Acidic partially-oxidised waste, excreted whenever a cell extracts energy without an electron acceptor. It still holds usable energy, which is why it is waste to its producer and food to somebody else.  
**Source:** Excreted by [[ATP Synthase (ATPS)]] operating at baseline yield, with neither [[Oxidex Reductase (OXDR)]] nor [[Sulfex Reductase (SLFR)]] active.  
**Uses:** Importable and burnable via [[Fluxidase (FLUX)]] by lineages that can tolerate the acidity. Lowers local [[pH]] as it accumulates.

**Self-poisoning.** A dense fermenting colony acidifies the water it lives in, and keeps fermenting because acidity is not why it lacks an acceptor. Left alone it reaches a limit set by its own waste rather than by its food supply — the clearest case in the game of a population creating its own failure condition. [[Protopump (PPMP)]] and [[Acid Tolerase (ACDT)]] exist to raise that ceiling at a cost.

**Cross-feeding.** Because Fermentate retains energy, a second lineage can specialise in eating it. That pairing is a mutualism nobody designed: the fermenter needs its waste removed and the scavenger needs it produced. Specification §7.4 requires interaction benefits to follow material flows, and this is the cheapest example to implement.

### Related
[[pH]] · [[Sulfex]] · [[Oxidex]] · [[Microniche]]
