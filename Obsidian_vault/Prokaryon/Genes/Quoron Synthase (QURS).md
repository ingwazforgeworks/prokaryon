**Gene ID:** QURS  
**Gene Name:** Quoron Synthase  
**Category:** [[Regulation]]  
**Status:** Proposed  
**Description:** Emits [[Quoron]] continuously and cheaply. The molecule does nothing chemically; its only function is that its accumulated concentration reports how many emitters are nearby.  
**Inputs:** Trace carbon and [[ATP]]  
**Outputs:** [[Quoron]] (extracellular)  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Pointless without [[Quoron Receptor (QURR)]] somewhere in the population  
**Default Localization:** Cell membrane  
**Tradeoff:** Broadcasting. The signal is readable by every species, so a colony coordinating itself is also advertising its location and size to [[Bdellase (BDEL)]] predators and to competitors deciding where to invest.  
**Design basis:** Autoinducer synthases in quorum-sensing systems.

**Cheap to emit, valuable to hear.** The cost is deliberately near-trivial, because the interesting decision is not whether to signal — it is what to do with the reading. See [[Quoron Receptor (QURR)]].

**Open — how many channels?** Specification §7.1 asks how many independent signal molecules may exist simultaneously, and backlog task S3-07 requires bounded signal identities and ranges. Quoron is currently one shared channel, which means lineages cannot distinguish their own density from a competitor's. Per-species identities would enable private coordination and multiply the field layers the simulation carries — a real cost against a real gain, unresolved.
