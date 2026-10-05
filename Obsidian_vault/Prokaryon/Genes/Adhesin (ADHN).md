**Gene ID:** ADHN  
**Gene Name:** Adhesin  
**Category:** [[Morphology]]  
**Status:** Proposed  
**Description:** Surface proteins that make the cell stick to debris, minerals, and terrain. Once attached, the cell stops being carried by [[Flow]] and stays where it is. It does not bind other cells.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Attachment to debris, minerals, and terrain  
**Expression scaling:** [[Linear Expression Scaling]]; attachment strength follows abundance  
**Genetic Prerequisites:** None  
**Other Prerequisites:** A solid surface within reach — debris, mineral, or terrain  
**Default Localization:** Cell membrane, outward-facing  
**Tradeoff:** Attachment is not selective among surfaces and not easily reversed. An adhesive cell sticks to barren mineral and poor terrain as readily as a rich deposit, and cannot leave a depleted patch without expressing less — a genome edit with its mandatory delay. It does not clump with other cells. That is [[Cohesin (COHS)]].  
**Design basis:** Surface adhesins such as FimH. Cell-cell aggregation is a different gene.

**Staying somewhere is a genetic problem.** Requirement V02 forbids the player from moving a cell, so remaining in a good [[Microniche]] has to be solved by physiology. Adhesin is the cheapest solution, and it is what makes surface metabolism viable at all: [[Ferracite Reductase (FCTR)]], [[Thionite Lyase (THNL)]] and any hydrolase anchored with [[TransmembraneSignal]] all require sustained contact they cannot produce themselves.

**It does not hold a colony together.** Sticking to other cells of the same type is [[Cohesin (COHS)]]. A lineage that wants a surface and a clump needs both genes. Adhesin alone anchors a cell to the world and leaves its neighbours to whoever drifts past.
