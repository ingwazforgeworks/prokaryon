**Concept:** The finite budget that makes every gene compete  
**Status:** Confirmed as a mechanic — the backlog treats expression capacity as a distinct accounting category

A cell can only make so much protein. Capacity is the ceiling on total expression across the whole genome, and it is what stops "express everything at maximum" from being the answer to every problem.

## Three separate budgets

The backlog is explicit that gene slots, editing slots and expression capacity are distinct. Conflating them removes a decision each:

| Budget | Limits | Paid with |
|---|---|---|
| [[Gene Slots]] | How many genes the genome holds | [[Mutation Points]] |
| Editing slots | How many edits can mature at once | [[Mutation Points]] |
| Expression capacity | How much protein exists at one time | Cellular resources, per cell |

Capacity is the only one of the three that is physiological and per-cell. A species-wide edit changes what every cell *can* do; capacity decides what each cell actually does in its own local conditions — which is how one genome produces different behaviour in a cave and in open water.

## What it forces

Specification §5.4 makes allocation the central tension: investing in transport, motility, defence, repair or transfer must displace something else. Concretely, this is why several genes in the catalog are not simply stacked:

- [[Heat Shock Protein (HSP)]] and [[Cold Shock Protein (CSP)]] together cost double for half-used protection.
- [[Envelope Thickener (ENVT)]] and [[Capsulin Synthase (CAPS)]] have additive costs and overlapping benefits.
- A [[Repressor (REPX)]] or [[Activator (ACTX)]] consumes capacity to regulate other genes, so regulation is not free either.

## Interaction with resource limitation

Capacity and resources are separate ceilings and both bind. Specification §4.2 requires resource limitation to be handled jointly — a cell cannot spend the same energy pool on several systems independently — and requires an allocation policy: proportional scaling, explicit priorities, or a small optimization model.

That choice has consequences the catalog depends on. Proportional scaling is cheap but can shut down critical maintenance, which would make [[Repairase (REPR)]] fail exactly when it is needed. Priorities are legible but create threshold exploits. Neither is selected; backlog task S1-06 owns the decision.

### Related
[[Expression]] · [[Gene Slots]] · [[Mutation Points]]
