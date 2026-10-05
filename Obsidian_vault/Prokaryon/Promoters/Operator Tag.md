**Type:** Recognition label  
**Category:** [[Regulation]]  
**Status:** Confirmed as a mechanic — the backlog treats tag targeting as settled  
**Description:** A label attached to a promoter, which regulator proteins recognise and bind. Tags carry no behaviour of their own: they are the addressing scheme that lets one regulator act on promoters scattered across the genome.

**Attached to:** [[Constitutive|constitutive promoter]], [[Conditional|conditional promoter]]  
**Recognised by:** [[Repressor (REPX)]], [[Activator (ACTX)]], [[Memory Latch (MEML)]]

## What tags are for

Without tags, a regulator would need an explicit list of targets and the player would edit that list every time the genome changed. With tags, the player labels promoters by intent — *stress*, *scarcity*, *crowded* — and a regulator addresses the label. Adding a gene to an existing programme becomes a matter of tagging its promoter, with no change to the regulator at all.

This is the indirection that makes [[Regulation]] composable. It is also what lets a gene acquired through [[Horizontal Gene Transfer]] join an existing regulatory programme: if its promoter carries a tag the recipient's regulators already recognise, the transferred gene is governed from the moment it arrives. Backlog task S5-08 covers that transferred-tagged-regulator scenario specifically.

## Design constraints

| Constraint | Reason |
|---|---|
| Matching must be exact, not graded | Backlog bundle R04 notes exact tags are simpler; graded compatibility adds tuning burden |
| The tag namespace must be bounded | Unbounded player-defined tags become an unvalidatable server input |
| Tag-match lookup needs an index | Backlog task S1-08 requires a tag-match index; scanning every promoter per cell per step will not scale |

## Failure modes the interface must explain

- A regulator whose tag matches nothing. The protein is expressed, costs capacity, and does nothing.
- A promoter tagged for a regulator the genome does not contain. Harmless but misleading.
- A promoter carrying tags for both a repressor and an activator. The resolution rule must be declared and visible, not emergent from evaluation order.

Specification §5.5 requires an explanation of why a gene is inactive. Tag mismatch is the most likely cause a player will hit and the hardest to see, so the [[Personal Cell Map]] has to name it directly.
