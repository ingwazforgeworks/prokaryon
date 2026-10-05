**Modification Name:** Secretory Peptide  
**Type:** [[Gene Modification]] — localization  
**Status:** Proposed  
**Destination:** [[Extracellular]] — the protein is released into the water  
**Applies to:** Hydrolases, [[Lysin Synthase (LYSS)]], [[Siderin Synthase (SIDS)]], [[Matrixin Synthase (MTXS)]]

A short tag that sends a protein out of the cell entirely. The protein works at range and never comes back.

### The trade against [[TransmembraneSignal]]

This is the central decision for every hydrolase in the genome, and it is the same decision each time:

| | Secreted | Anchored |
|---|---|---|
| Reach | Works on substrate the cell never touches | Only substrate against the envelope |
| Products | Diffuse away; neighbours eat them | Released next to the importer |
| Recovery | Lost — the enzyme is gone | Retained for the cell's lifetime |
| Best when | Substrate is dispersed, competitors are distant | Substrate is a surface, competitors are close |

Secretion is the aggressive option: more total digestion, a large share of it feeding somebody else.

### Why this replaced a gene

The [[Gene Catalog]] originally carried an *Ectoenzyme Retainer* — a gene whose only effect was to keep hydrolases attached. As a modification the same choice is clearer and cheaper: the player tags the specific enzyme they want anchored instead of buying a gene that anchors all of them.

It also fixes a modelling error. A retainer gene implies retention is an extra capability bolted on, when in reality a secreted enzyme and an anchored one differ only in a peptide at one end. Specification §2.1 asks that mechanisms not quietly acquire capabilities they should not have, and this is the cleaner reading.

### The public-goods problem lives here

Every secreted enzyme is a public good, and the free-rider is a cell with the matching permease and no hydrolase at all. That is why no separate cheat gene is needed — see the exclusions table in the [[Gene Catalog]].

The defences are spatial rather than biochemical: digest at a surface where products are concentrated, or keep the enzyme anchored and accept a smaller meal. [[Matrixin]] adds a third option by making departure slow.

### Related
[[TransmembraneSignal]] · [[Extracellular]] · [[Glycon Hydrolase (GLYH)]] · [[Lipron Hydrolase (LIPH)]]
