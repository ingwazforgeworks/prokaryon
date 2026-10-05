**Field type:** Buffered acidity proxy — **not** a chemistry model  
**Status:** Confirmed — requirement V09  
**Sensed by:** [[Protoreceptor (PRTR)]] (internal acidity)  
**Adapted to by:** [[Protopump (PPMP)]], [[Acid Tolerase (ACDT)]]  
**Altered by:** [[Fermentate]] accumulation, [[Protopump (PPMP)]], [[Carbex]] from respiration

How acidic the water is. The one environmental field that players routinely change on purpose, which makes it the clearest demonstration that this is an ecology rather than a set of terrain modifiers.

## Measurement discipline

Specification §2.4 states the rule plainly: pH is logarithmic, and must not be mixed or averaged as though it were a concentration in a chemistry model. Two consequences bind the implementation:

1. The field is a **buffered acidity proxy**, declared as an abstraction rather than presented as real carbonate chemistry. Specification §7.1 explicitly offers this as the lightweight option.
2. Nothing reading [[Protoreceptor (PRTR)]] may do arithmetic on the value as if it were a resource quantity. Diffusion, advection and averaging all need a representation that is linear in the underlying quantity, not in the reported scale.

Getting this wrong produces a system that looks like it works and is quietly incoherent, which is why it is recorded here rather than left to the field implementation.

## Players make their own acid

| Source | Mechanism | Intent |
|---|---|---|
| [[Fermentate]] | Waste from low-yield [[ATP Synthase (ATPS)]] | Accidental self-poisoning |
| [[Protopump (PPMP)]] | Acid pumped out to defend the interior | Deliberate niche engineering |
| Respiration | [[Carbex]] released by any growing cell | Ambient, density-dependent |

A dense colony expressing [[Protopump (PPMP)]] builds a low-pH zone that excludes competitors lacking [[Acid Tolerase (ACDT)]]. Specification §7.1 asks whether cells can materially change their own niche, and this is the answer — a habitat modification produced by players, not authored.

It is also a trap. The colony must keep paying forever, and the environment it created kills it if expression drops.

## The defend-versus-tolerate choice

[[Protopump (PPMP)]] holds the interior steady at continuous energy cost and switches off in neutral water. [[Acid Tolerase (ACDT)]] stops caring about pH at the price of slower growth everywhere, including where pH is fine. The comparison table is in [[Acid Tolerase (ACDT)]].

### Related
[[Homeostasis]] · [[Microniche]] · [[Fermentate]]
