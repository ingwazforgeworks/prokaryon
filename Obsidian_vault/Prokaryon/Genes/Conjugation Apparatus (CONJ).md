**Gene ID:** CONJ  
**Gene Name:** Conjugation Apparatus  
**Category:** [[Reproduction]]  
**Status:** Open — carries requirement V12 with most rules unresolved  
**Description:** Contact-mediated machinery that copies a genetic payload from one living cell into another. The deliberate route for moving genes between species and between players.  
**Inputs:** [[Biomass]], [[ATP]]; sustained contact with an eligible recipient  
**Outputs:** A genetic payload delivered into the recipient  
**Expression scaling:** [[Threshold Scaling]] — a discrete apparatus with a transfer duration and cooldown  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Sustained contact. [[Cohesin (COHS)]] makes that far more likely between cells of the same type; [[Adhesin (ADHN)]] does not hold cells together. Recipient eligibility under whatever consent rule is selected  
**Default Localization:** Cell membrane  
**Tradeoff:** Slow, contact-dependent and impossible to aim. The player cannot steer a cell to a donor, so transfer happens where populations already mingle — which means the encounters that matter most are the ones the player prepared for rather than arranged.  
**Design basis:** Conjugative DNA transfer through type IV secretion machinery, source [B3].

**Naming discipline.** Specification §8.1 prefers *horizontal gene transfer* as the general term and notes that conjugation can fulfil the intended exchange fantasy without claiming to be sexual reproduction. It is also separate machinery from the protein-delivering [[Effector Injector (EFFI)]] — §2.1 is explicit that injectisomes and DNA-transfer systems should not be conflated.

**Why this gene is Open rather than Proposed.** Seven decisions in specification §8.2 govern its behaviour, and they affect the entire multiplayer design rather than this note alone: consent (D19), payload (D20), acquisition result (D21), compatibility (D22), harmful cargo (D23), inheritance (D24), and species identity afterwards (D25). The table is in [[Horizontal Gene Transfer]].

**Transaction requirements.** Specification §8.3 requires eligibility checks, contact duration and interruption rules, recorded donor and recipient and payload version, and — critically — that retries, reconnection and server recovery cannot duplicate a payload or a reward. Backlog tasks S5-07 and S5-08 own that work, including alternate-account exchange loops. See [[Horizontal Gene Transfer]].
