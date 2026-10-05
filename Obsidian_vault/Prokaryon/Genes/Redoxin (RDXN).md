**Gene ID:** RDXN  
**Gene Name:** Redoxin  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Reports which electron acceptors are locally available by sensing the redox state of the cell's own electron carriers. Distinguishes rich [[Oxidex]] water from anoxic [[Sulfex]] water from water with neither.  
**Inputs:** Redox state of intracellular electron carriers  
**Outputs:** A scalar regulatory signal spanning oxidising to reducing conditions  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** One scalar for two different acceptors. The receptor cannot report [[Oxidex]] and [[Sulfex]] independently, so a cell switching respiratory modes is inferring rather than measuring, and gets it wrong in transitional water where both are marginal.  
**Default customers:** [[Oxidex Reductase (OXDR)]], [[Sulfex Reductase (SLFR)]], [[Oxidex Detoxase (OXDT)]]  
**Design basis:** Redox-responsive two-component regulators such as ArcA/ArcB-style systems.

**The most valuable receptor in the game.** Expressing the wrong terminal reductase wastes capacity and gains nothing, and a cell drifting between [[Redox Stratification]] zones cannot afford to express both permanently. RDXN is what turns that geography into a decision, and it is the clearest example of specification §5.4's requirement that conditional expression have a reason to beat constitutive overexpression.
