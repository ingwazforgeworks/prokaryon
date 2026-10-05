**Concept:** Moving genes between species and between players  
**Status:** Confirmed as a mechanic — requirement V12 — with the rules unresolved

The general term for every route by which a cell acquires genetic material it did not inherit. Specification §8.1 prefers it over narrower language, and notes that conjugation can fulfil the intended exchange fantasy without claiming to be identical to sexual reproduction.

## Supported routes

| Route | Gene | Character |
|---|---|---|
| Conjugation | [[Conjugation Apparatus (CONJ)]] | Deliberate, contact-mediated, identifiable donor |
| Transformation | [[Competence Uptake (COMP)]] | Opportunistic, anonymous, scavenges [[Ectodin]] |
| Transduction | — | Excluded; specification §8.1 rates phage systems as substantial extra scope |

Receiving is a separate problem: [[Plasmid Maintainer (PLSM)]] carries acquired cassettes at a cost, and [[Restriction Defense (RSTD)]] rejects incoming DNA indiscriminately.

## Possession is not phenotype

Specification §8.3 requires the game to explain the difference between acquired DNA and a functional expressed phenotype. An arriving gene still needs a promoter, [[Expression Capacity]], its own prerequisites, and a carrier — so a transfer can succeed completely and change nothing observable. The [[Personal Cell Map]] must say which of those is missing.

The [[Operator Tag]] system is what makes acquisition sometimes work immediately: if a transferred gene's promoter carries a tag the recipient already regulates, it joins an existing programme on arrival. Backlog task S5-08 covers that scenario.

## Transaction requirements

Specification §8.3 requires all of these, and backlog tasks S5-07 and S5-08 own them:

- Verify physical eligibility, ownership, consent rules, and compatible machinery.
- Define contact duration, interruption, cost, success conditions, and cooldown.
- Validate payload size, dependencies, expression costs, and regulatory complexity.
- Record donor, recipient, payload version, event ID, time, and resulting genome state.
- Make retries, reconnection, and server recovery unable to duplicate rewards or payloads.
- Define duplicate genes, incompatible cassettes, insertion limits, rejection, and removal.
- Test exchange loops between alternate accounts and repeated donor-recipient cycling.

The fifth and seventh points are the ones that will actually be attacked. A transfer that can be replayed is a gene duplicator, and two accounts cycling payloads is the cheapest exploit in the design.

## The seven open decisions

Specification §8.2 states that these affect the entire multiplayer design, not just this mechanic. The full table is in [[Horizontal Gene Transfer]]: consent (D19), payload (D20), acquisition result (D21), compatibility (D22), harmful cargo (D23), inheritance (D24), and species identity afterwards (D25).

Decision D24 is the one that changes pacing most: whether an acquired gene reaches the recipient alone, its descendants, the strain, or the entire species catalog determines how fast innovations spread through a world.

## Progression consequences

Specification §6.5 lists acquiring modules through other species as a progression route with real hazards: collusion, transfer markets, veteran gatekeeping, and dilution of personal identity. Specification §8.3 also asks whether progression prerequisites still apply to transferred content — if they do not, [[Horizontal Gene Transfer]] becomes a bypass around the entire [[Gene Catalog]] dependency structure.

### Related
[[Horizontal Gene Transfer]] · [[Species]] · [[Ectodin]] · [[Gene Slots]]
