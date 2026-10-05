**Concept:** How a gene in the genome becomes a working capability  
**Status:** Confirmed as a mechanic — requirements V04, V23, V25

Three distinct things are easy to confuse, and specification §5.5 requires the interface to keep them apart:

| Layer | What it is | Changes when |
|---|---|---|
| Installed DNA | The gene exists in the genome | The player commits an edit, after the mandatory delay |
| Expressed protein | An abundance that accumulates and decays | Continuously, driven by a promoter |
| Assembled machinery | A functional structure in place | After synthesis, plus assembly time and localization |

A cell can hold a gene, express no protein, and have no capability. It can express plenty of protein and still have no capability if assembly or [[Localization]] has not completed. Specification §5.5 requires an explanation of why a gene is inactive or a structure has not appeared, and the [[Personal Cell Map]] is where that lands.

## The model

Specification §5.4 offers a lightweight approximation, stated there as a gameplay model rather than a chosen formula:

```text
regulatory target = bounded function(sensor state, promoter parameters, regulators)
actual synthesis  = target constrained by available resources and expression capacity
phenotype strength = function(abundance, assembly state, localization, environment)
```

Three properties follow, and each is a design commitment rather than an implementation detail:

- **Target is not actual.** A promoter asks for a level; resources and [[Expression Capacity]] decide what the cell gets. The gap is the most common reason a gene underperforms, and requirement V25 requires both numbers to be visible.
- **Abundance decays and dilutes.** Protein is lost to turnover and diluted by growth, so expression is a flow, not a switch. Specification §4.2 warns that density-based protein state dilutes differently from splitting molecule counts at [[Division]] — one representation must be chosen and the conversion specified.
- **Response has a delay.** Specification §5.4 requires the model's response delay to be separate from the interface's refresh rate.

## Why regulation beats brute force

Expression capacity is finite and shared, so investing in transport, motility, defence, repair or transfer displaces something else. Specification §5.4 makes this the central allocation problem, and specification §5.4 also requires that condition-dependent expression have a reason to beat constitutive overexpression. Each gene note's **Tradeoff** field records that reason; [[Photoprotectin (PHPR)]] is the clearest case.

### Related
[[Regulation]] · [[Expression Capacity]] · [[Localization]] · [[Perception]]
