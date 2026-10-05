**Gene ID:** DMGR  
**Gene Name:** Damage Receptor  
**Category:** [[Perception]]  
**Status:** Proposed  
**Description:** Reports accumulated internal damage and misfolded protein load as a scalar. The cell's general alarm: it detects that something is going wrong without identifying what.  
**Inputs:** Internal damage and stress state  
**Outputs:** A scalar regulatory signal  
**Expression scaling:** [[Threshold Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** None  
**Default Localization:** Cytosol  
**Tradeoff:** No diagnosis, only severity. Heat, [[Lysin]], oxidative damage from [[Oxidex]], acid stress and starvation all raise the same number, so a cell regulating on it responds to every crisis the same way. That is cheap and often wrong.  
**Default customers:** [[Repairase (REPR)]], [[Sporulase (SPOR)]], [[Envelope Thickener (ENVT)]]  
**Design basis:** Heat-shock and general stress response regulons.

**Deliberately unspecific.** A receptor that reported the cause of damage would let one gene substitute for the whole [[Perception]] category. Keeping it blunt means a cell that wants a targeted response must buy the specific receptor, and DMGR remains what it should be: the last-resort trigger for repair and dormancy.

**It is also the honest diagnostic.** Specification §4.4 requires that death report its causal history rather than a final damage value. DMGR is what the *cell* knows; the [[Personal Cell Map]] is what the *player* can know, and the gap between them is intentional.
