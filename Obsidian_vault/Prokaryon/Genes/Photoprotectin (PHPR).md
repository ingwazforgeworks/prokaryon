**Gene ID:** PHPR  
**Gene Name:** Photoprotectin  
**Category:** [[Homeostasis]]  
**Status:** Proposed  
**Description:** Dissipates captured light energy that the cell cannot safely use, converting a damaging excess into harmless heat. Protection bought by throwing away exactly the resource the cell went to the light to collect.  
**Inputs:** Excess captured [[Light]] energy  
**Outputs:** Reduced photodamage; no usable product  
**Expression scaling:** [[Threshold Scaling]] — best driven by a [[Photochrome (PCHR)]] condition rather than expressed constitutively  
**Genetic Prerequisites:** [[Carotin Synthase (CRTS)]] — the quenching pigment is what does the work  
**Other Prerequisites:** Only useful alongside [[Chlorin Synthase (CHLS)]] or in very bright water  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** Wastes harvest. Constitutive expression throws away energy in dim water, and absence causes damage in bright water, so this gene is where conditional regulation stops being optional.  
**Design basis:** Non-photochemical quenching and carotenoid photoprotection.

**It cannot work without [[Carotin]].** The protein organises the pigment; the pigment absorbs and discards the energy. That dependency is what makes [[Carotin Synthase (CRTS)]] worth buying for a cell that already has [[Chlorin]] — the accessory pigment is also the safety equipment.

**Why it is a good teaching gene.** Specification §5.4 asks that condition-dependent expression have a reason to beat constitutive overexpression, and PHPR is the clearest case in the catalog: both extremes of constant expression are worse than a threshold tied to a real receptor reading. A player who solves Photoprotectin has understood the [[Regulation]] system.
