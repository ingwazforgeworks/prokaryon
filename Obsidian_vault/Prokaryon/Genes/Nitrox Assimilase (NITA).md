**Gene ID:** NITA  
**Gene Name:** Nitrox Assimilase  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Incorporates nitrogen from [[Nitrox]] into a form [[Anabolase (ANAB)]] can build with. Without it a cell can burn Nitrox for energy but cannot use it to grow, which is the distinction this gene exists to create.  
**Inputs:** [[Nitrox]] (intracellular), [[ATP]], [[Reducin]]  
**Outputs:** Assimilated nitrogen for [[Biomass]]  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** [[Nitrox Permease (NITP)]]  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Sets up the only unavoidable internal conflict in the catalog. Nitrox spent on growth is Nitrox not burned for energy, and in a nitrogen-poor habitat the cell must choose between being fed and being able to divide.  
**Design basis:** Ammonium assimilation. Nitrogen limitation is the mechanism that stops energy abundance from automatically becoming population growth, which specification §4.2 requires by keeping the energy and biomass balances separate.
