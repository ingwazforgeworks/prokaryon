**Gene ID:** GLYS  
**Gene Name:** Glycon Synthase  
**Category:** [[Metabolism]]  
**Status:** Open — precursors now defined, storage role still unsettled  
**Description:** Fixes inorganic carbon into usable organic fuel. Combines concentrated [[Carbex]] with [[Reducin]] and [[ATP]] to build [[Glycon]] inside the cell, completing the autotrophic route.  
**Inputs:** [[Carbex]] (intracellular), [[Reducin]], [[ATP]]  
**Outputs:** [[Glycon]] (intracellular)  
**Expression scaling:** [[Linear Expression Scaling]], limited jointly by whichever input is scarcest  
**Genetic Prerequisites:** [[Carbex Permease (CBXP)]], and a [[Reducin]] source — [[Reducin Dehydrogenase (RDCD)]] or [[Reaction Center (RXNC)]]  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** The most expensive way to obtain [[Glycon]] in the game. It buys freedom from scarcity at the price of a permanently worse energy budget, since every unit of [[Reducin]] is a unit of [[Fluxin]] that never became [[ATP]].  
**Design basis:** Carbon fixation requiring energy and reducing equivalents together, the composition specification §21.4 lists as energy supply plus reducing power plus fixation machinery.

## What changed

This note previously recorded its precursors, energy cost, and storage role as undefined. The precursors and energy cost are now defined as above, chosen so that autotrophy satisfies specification §2.4: capturing light or chemical energy is not equivalent to making biomass, and fixation needs an electron supply as well as [[ATP]].

**Still open — the storage question.** Whether GLYS also serves as a storage or resource-exchange route is unresolved. [[Granulin Synthase (GRNS)]] now owns internal storage, which suggests GLYS should be purely a fixation gene. If it keeps a storage role as well, the two overlap and one should be cut.

## The end of the longest chain

Full autotrophy requires four genes working together: [[Chlorin Synthase (CHLS)]], [[Reaction Center (RXNC)]], [[Carbex Permease (CBXP)]] and this one. That is deliberately the longest dependency chain in the [[Gene Catalog]] — see [[Metabolic Map]].
