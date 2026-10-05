**Gene ID:** CILA  
**Gene Name:** Cilium Assemblase  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Builds and maintains cilia at its localization sites. Coverage follows expression, and new cilia appear gradually rather than all at once.  
**Inputs:** [[Biomass]], [[ATP]] to build and to maintain  
**Outputs:** Ciliary coverage at the sites where it is localized  
**Expression scaling:** [[Linear Expression Scaling]], with an assembly delay before a new cilium can beat  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cell membrane. [[PolarLocalizationSignal]] gathers them at one end; without it they are distributed over the surface  
**Tradeoff:** Cilia with no motor are drag, occupied membrane, and a standing maintenance cost. The cell pays for coverage before any of it beats, and membrane given to cilia is membrane taken from permeases.  
**Design basis:** Intraflagellar transport and ciliary assembly, collapsed into one module. This is not a flagellum: there is no progression edge from [[Flagellin (FLGN)]].

Assembly time and turnover are what keep a change in coverage from acting as a steering input. See [[Motility]] and the steering loophole in [[Localization]].
