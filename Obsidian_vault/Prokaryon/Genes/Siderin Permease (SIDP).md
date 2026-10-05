**Gene ID:** SIDP  
**Gene Name:** Siderin Permease  
**Category:** [[Metabolism]]  
**Status:** Proposed  
**Description:** Recovers loaded [[Siderin]] from the water — the chelator plus the [[Ferron]] it has captured — and brings both inside. The retrieval half of the chelation strategy.  
**Inputs:** [[Siderin]] carrying [[Ferron]] (extracellular), [[ATP]]  
**Outputs:** [[Ferron]] (intracellular) and recycled [[Siderin]]  
**Expression scaling:** [[Saturating Scaling]]  
**Genetic Prerequisites:** None  
**Other Prerequisites:** Requires somebody to be producing [[Siderin]] — not necessarily the same lineage  
**Default Localization:** [[Plasma Membrane]]  
**Tradeoff:** Active recovery costs [[ATP]], and the cell competes for loaded chelator against every other cell carrying this gene — including the one that paid to make it.

**It sharpens the public-goods problem rather than solving it.** Adding a retrieval gene means [[Siderin Synthase (SIDS)]] no longer leaks value to anyone with a plain [[Ferron Permease (FERP)]]; a competitor must now also buy SIDP. That raises the cost of cheating from zero to one gene, which is exactly the kind of partial defence specification §7.4 describes — spatial assortment and uptake specificity shift the balance without ever making cooperation safe.

**The cheat is still viable, and should be.** One gene is cheap, and a cell carrying SIDP without SIDS gets iron for a fraction of the producer's cost. See [[Siderin]] for the comparison against the contact-based route through [[Ferracite Reductase (FCTR)]].

**Recycling matters.** Because the chelator returns with its cargo, a producer that also expresses SIDP loses far less material per unit of [[Ferron]] gained — so the pairing SIDS plus SIDP is meaningfully stronger than SIDS alone, and gives the producer a real advantage over the free-rider for the first time.
