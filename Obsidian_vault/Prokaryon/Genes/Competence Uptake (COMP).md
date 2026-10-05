**Gene ID:** COMP  
**Gene Name:** Competence Uptake  
**Category:** [[Reproduction]]  
**Status:** Open — depends on decisions D22–D25  
**Description:** Takes up [[Ectodin]], the genetic fragments released when cells die, and attempts to incorporate what it finds. Opportunistic scavenging of the local gene pool rather than a deliberate exchange.  
**Inputs:** [[Ectodin]] (extracellular), [[ATP]]  
**Outputs:** Acquired genetic material, subject to the selected acquisition and compatibility rules  
**Expression scaling:** [[Linear Expression Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Requires recent local death; blocked by [[Restriction Defense (RSTD)]]  
**Default Localization:** Cell membrane  
**Tradeoff:** No control over what arrives. The cell cannot choose its donor, verify the payload, or decline a fragment it has already absorbed, and [[Ectodin]] degrades quickly — so a competent cell must live where things are dying to gain anything at all.  
**Design basis:** Natural transformation and DNA uptake competence systems.

**Genuinely different from conjugation.** [[Conjugation Apparatus (CONJ)]] is a deliberate transfer between two living cells with an identifiable donor. Competence is anonymous, untraceable, and requires nothing from the donor except that it died nearby — which makes the two routes distinct mechanics rather than reskins of each other, as specification §8.1 sets out.

**It conflicts with ownership.** Specification §8.1 notes that transformation makes provenance harder and lets genes spread without deliberate trade, which cuts against requirement V11's promise of stable species identity and attribution. §8.3 also requires preserving social attribution without implying a player owns a real biological gene — hard to do when the gene arrived from an anonymous corpse.

**Anti-abuse concern.** A player who kills their own cells to seed [[Ectodin]] and absorbs it with a second species they own has a gene-laundering route with no donor to audit. Specification §8.3 requires exchange loops between alternate accounts to be tested; this route needs that scrutiny without the transaction record conjugation provides. See [[Ectodin]].
