**Gene ID:** QURR  
**Gene Name:** Quoron Receptor  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Detects [[Quoron]] concentration and reports it as a scalar. Because Quoron is emitted continuously by every cell expressing [[Quoron Synthase (QURS)]], its concentration is a proxy for how crowded the neighbourhood is.  
**Inputs:** [[Quoron]] concentration  
**Outputs:** A scalar regulatory signal  
**Expression scaling:** [[Saturating Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Requires somebody nearby to be emitting; reports nothing in a habitat where no lineage has bought [[Quoron Synthase (QURS)]]  
**Default Localization:** Cell membrane  
**Tradeoff:** It cannot tell whose cells are nearby. A dense competitor colony and a dense colony of kin produce the same reading, so a cell regulating on density alone may cooperate with its rivals or defend against its own.  
**Design basis:** Quorum sensing through diffusible autoinducers.

**What density unlocks.** A crowd changes which decisions are correct, and this receptor is how the cell knows it is in one. [[Matrixin Synthase (MTXS)]] is only worth its cost when enough neighbours are also building; [[Lysin Synthase (LYSS)]] is only survivable when the colony is large enough to absorb its own toxin. Both are collective decisions taken by individual cells, which is the kind of emergence specification §7.4 is asking for.

**It listens to other species too.** A predator with QURR finds prey colonies by their own signalling. See [[Quoron]] on why that exposure is intentional.
