**Gene ID:** PRTR  
**Gene Name:** Protoreceptor  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Reports internal [[pH]] as a scalar regulatory input. Measures the cell's own interior, which is the quantity that actually threatens it, rather than the water outside.  
**Inputs:** Internal acidity  
**Outputs:** A scalar regulatory signal  
**Expression scaling:** [[Linear Expression Scaling]] over the tolerated range  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** Reads the symptom after it has arrived. A cell only learns the water has turned acidic once its own interior has started to follow, so regulation driven by this receptor is always reactive — and in a rapidly acidifying [[Microniche]] it may be too late to matter.  
**Design basis:** Cytoplasmic pH sensing by acid-responsive regulators.

**Its customers** are [[Protopump (PPMP)]] and [[Acid Tolerase (ACDT)]]. Both are expensive to run continuously and both are needed only sometimes, which makes them a natural shared-promoter pair under requirement V24.

**Measurement caution.** Specification §2.4 requires that pH be treated logarithmically and never averaged as though it were a concentration. This receptor reports a position on that scale, and anything reading it must not do arithmetic on the value as if it were a resource quantity.
