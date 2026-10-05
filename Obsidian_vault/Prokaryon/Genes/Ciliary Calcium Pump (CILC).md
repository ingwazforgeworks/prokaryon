**Gene ID:** CILC  
**Gene Name:** Ciliary Calcium Pump  
**Category:** [[Motility]]  
**Status:** Proposed  
**Description:** Clears the calcium that [[Ciliary Reversal Channel (CILR)]] let into the cilium. Clearance rate sets how long the reversed stroke lasts. Stronger expression, shorter reversals.  
**Inputs:** [[ATP]], intraciliary calcium  
**Outputs:** Return to the resting stroke set by [[Ciliary Polarizer (CILP)]]  
**Expression scaling:** [[Linear Expression Scaling]] — clearance rate follows pump abundance  
**Genetic Prerequisites:** [[Ciliary Reversal Channel (CILR)]]  
**Other Prerequisites:** None  
**Default Localization:** Ciliary membrane  
**Tradeoff:** Too fast and the reversal ends before the cell has turned away from what excited it. Too slow and the reversed stroke continues, so the cell swims backward or pumps the wrong way until the calcium finally falls. The pump spends [[ATP]] for as long as that calcium is up.  
**Design basis:** The calcium pumps that end a ciliary reversal by restoring the resting calcium of the cilium.

**Duration is the difference.** [[Ciliary Reversal Channel (CILR)]] decides how readily a stimulus starts a reversal. CILC decides how soon the resting stroke comes back. A cell with a channel and no pump reverses and stays reversed.
