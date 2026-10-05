**Gene ID:** FLGN  
**Gene Name:** Flagellin  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Produces the filament subunits that make up a flagellum and exports them into a growing helical filament. Builds the propeller; does not turn it.  
**Inputs:** [[Biomass]], [[ATP]]  
**Outputs:** Assembled filament length  
**Expression scaling:** [[Linear Expression Scaling]], with an assembly delay before the filament is functional  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Determined by [[PolarLocalizationSignal]] if present; otherwise a single fixed pole  
**Tradeoff:** A filament with no motor adds drag and costs material while providing no thrust whatsoever. It is the clearest case in the catalog of a gene that is worse than nothing until its partner exists.  
**Design basis:** Flagellin as a filament protein. Specification §2.1 warns specifically against treating flagellin as a precursor to secretion systems, so this gene has no progression edge to [[Effector Injector (EFFI)]] — the relationship between flagellar and non-flagellar export machinery concerns multi-component systems, per source [B6], not this subunit.

Assembly takes time and filaments turn over, which is what prevents rapid re-expression from becoming a steering input. See [[Motility]] on the steering loophole.
