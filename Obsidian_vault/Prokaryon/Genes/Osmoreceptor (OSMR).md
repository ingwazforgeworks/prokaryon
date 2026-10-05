**Gene ID:** OSMR  
**Gene Name:** Osmoreceptor  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Detects mechanical strain in the envelope caused by water moving in or out, and reports it as a scalar. The cell senses the consequence of osmotic imbalance rather than [[Salinity]] itself.  
**Inputs:** Membrane tension resulting from the internal-external water potential difference  
**Outputs:** A scalar regulatory signal  
**Expression scaling:** [[Threshold Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane  
**Tradeoff:** It reports strain, not cause. High tension means trouble but does not distinguish salty water from a leaking envelope from osmotic overshoot by the cell's own [[Osmolyn]] production, so a cell can enter a feedback loop where its correction triggers the receptor that drove the correction.  
**Design basis:** Mechanosensitive channels and turgor sensing.

**Sensing the effect is a design choice, not a shortcut.** Specification §2.3 requires deliberate simplifications to be recorded with their consequence. Here the consequence is the feedback loop above, and it is intentionally left in: it gives [[Memory Latch (MEML)]] and promoter hysteresis something real to solve.
