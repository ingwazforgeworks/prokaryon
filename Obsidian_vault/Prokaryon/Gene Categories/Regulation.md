**Category:** Regulation  
**Status:** Confirmed as a content family — specification §6.4; the regulatory language itself is open under decision D11  
**Genes:** 4, plus the promoters — [[Constitutive]] and [[Conditional]]

Everything that controls *when* other genes are expressed. This is where the game is actually played: confirmed requirement V04 makes genes and promoters the unit of design, and V02 removes every other lever the player might have had.

### The genes

| Gene | Role |
|---|---|
| [[Repressor (REPX)]] | Suppresses promoters carrying a matching [[Operator Tag]] |
| [[Activator (ACTX)]] | Boosts promoters carrying a matching tag |
| [[Memory Latch (MEML)]] | Holds a state after the condition that set it has passed |
| [[Quoron Synthase (QURS)]] | Emits [[Quoron]], letting a population regulate on its own density |

Confirmed requirement V30 puts regulators in the genome as expressed products, not as free settings. A repressor costs a gene slot, costs [[Expression Capacity]], and can itself be regulated — so regulation is recursive and pays for itself at every level.

### Promoters are the instrument

Two kinds:

- [[Constitutive]] — fixed strength, always on, no inputs
- [[Conditional]] — driven when a condition over receptor signals is met

Requirement V24 allows one promoter to drive several genes at a single editing cost with linked settings. That makes coupling cheaper than independence, which is a genuine trade rather than a convenience: a shared starvation promoter coordinates three responses but cannot give them different strengths.

### Memory is what makes behaviour look deliberate

A cell that responds only to the present flickers. [[Memory Latch (MEML)]] and the hysteresis parameters on [[Conditional]] let a lineage commit to a course — finish building a spore, complete a division, stay dormant through a brief thaw — and that commitment is what reads as intent to an observer.

It is also the main defence against futile cycles. [[Granulin Synthase (GRNS)]] and [[Granulin Hydrolase (GRNH)]] running simultaneously burn [[ATP]] to convert [[Glycon]] into [[Glycon]], and only regulation prevents it.

### Regulation cannot exceed perception

Every condition needs a receptor behind it. The whole of [[Perception]] is the input surface for this category, and a sophisticated regulatory design on a genome with two receptors is sophistication about nothing.

### Open — decision D11

The regulatory language is unselected. Specification §5.2 weighs curated promoter cards, parameterized thresholds, a logic network with memory, and sequence-level construction; they differ sharply in onboarding, debuggability and server validation cost.

This vault assumes parameterized thresholds with tag-based regulators. §5.2 also warns against implementing arbitrary player scripts server-side as a shortcut to gene complexity — the most tempting and most dangerous option on the list.

### Related
[[Perception]] · [[Conditional]] · [[Constitutive]] · [[Operator Tag]] · [[Expression Capacity]]
