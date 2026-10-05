**Gene ID:** TAXR  
**Gene Name:** Taxis Regulator  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Couples a receptor reading to motor behaviour. Compares what a receptor reports now against what it reported moments ago, and biases the cell's turning rate accordingly: keep going when conditions improve, tumble when they worsen.  
**Inputs:** A receptor signal — [[Chemoreceptor (CHMR)]], [[Photochrome (PCHR)]], [[Thermoreceptor (THMR)]] or another; [[ATP]]  
**Outputs:** A turn-probability bias applied to [[Flagellar Motor Protein (FLGM)]]  
**Expression scaling:** [[Threshold Scaling]], with tunable response gain  
**Genetic Prerequisites:** [[Flagellar Motor Protein (FLGM)]] and at least one receptor  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Gradient climbing is slow, noisy and easily defeated. High gain makes the cell twitchy and wasteful; low gain makes it miss gradients entirely. It also cannot find anything that is not signalled — a rich patch with no detectable solute is invisible.  
**Design basis:** Biased run-and-tumble driven by temporal comparison of scalar measurements, source [B8]. Specification §4.3 notes that temporal comparison is cheaper than a spatial sensor array and produces genuinely different navigation, and that a freely supplied perfect gradient would make sensing genes cosmetic.

**This is the gene that makes indirect control feel intentional.** The player never picks a destination; they choose what the cell finds attractive and how strongly it responds. Specification §21.4 lists sensor plus signal-processing plus existing motor as a functional composition, and TAXR is the middle term — which is why it requires both of the others and does nothing alone.
