**Promoter Name:** Conditional Promoter  
**Type:** Promoter  
**Status:** Confirmed as a mechanic — requirements V04 and V24; language choice open under decision D11  
**Description:** Drives its downstream genes when a condition over receptor inputs is satisfied. The main instrument of play: the player is not choosing what the cell does, but when it decides to do it.

**Inputs:** One or more receptor signals — see [[Perception]]  
**Parameters:** Threshold per input, combining logic, response gain, hysteresis width, expression strength  
**Downstream genes:** One or many  
**Tags:** May carry an [[Operator Tag]], exposing it to [[Repressor (REPX)]] and [[Activator (ACTX)]]

### Conditions need real sources

A condition may only reference a quantity some receptor in the genome actually measures. Confirmed requirement V26 states that absent or inactive sensing machinery cannot supply a functional controller input.

So a threshold written against [[Temperature]] in a cell with no [[Thermoreceptor (THMR)]] does not evaluate false — it fails to evaluate, and falls back to the declared missing-input behaviour. Those are different outcomes and the [[Personal Cell Map]] must distinguish them, or the player will read a broken genome as a working one.

### Hysteresis is not a nicety

A bare threshold makes cells flicker when a field hovers near it, spending resources on expression that is immediately reversed. Specification §5.4 names hysteresis and adaptation as the tools, and two gene pairs make the need concrete:

- [[Granulin Synthase (GRNS)]] and [[Granulin Hydrolase (GRNH)]] expressed together form a futile cycle, burning [[ATP]] to convert [[Glycon]] into [[Glycon]]
- [[Oxidex Reductase (OXDR)]] and [[Sulfex Reductase (SLFR)]] switching repeatedly in transitional water cost capacity for no gain in yield

### Shared promoters and coupling

Requirement V24 confirms one promoter may drive several downstream genes, at one editing cost with linked settings. A single low-nutrient threshold can raise [[Glycon Hydrolase (GLYH)]], [[Flagellar Motor Protein (FLGM)]] and [[Granulin Hydrolase (GRNH)]] together — a coordinated starvation response assembled from parts never designed for each other.

Coupling is cheaper than independence and sometimes wrong: those three genes also want different strengths, and a shared promoter cannot give them different ones.

### A promoter is not an environmental computer

Specification §2.1 is explicit that a promoter integrates signals it is given; it does not survey the world. Every input must arrive through a receptor, and no condition may reference a quantity the cell has no machinery to measure. This is the single most likely place for the design to drift into unearned omniscience.

### Open — decision D11

The regulatory language is not selected. Specification §5.2 compares curated promoter cards, parameterized thresholds, a logic network with memory, and sequence-level construction; they differ enormously in onboarding, debugging and server-validation cost.

This note assumes parameterized thresholds with tag-based regulators, which the backlog treats as confirmed compound logic. §5.2 also warns explicitly against implementing arbitrary player scripts on the server as a shortcut to gene complexity.

### Related
[[Constitutive]] · [[Operator Tag]] · [[Expression]] · [[Regulation]] · [[Perception]]
