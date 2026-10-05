**Concept:** Where on the cell a capability sits  
**Status:** Open — decisions R03 and D12 unresolved; carries requirement V05

Requirement V05 confirms that the player controls spatial expression and placement, including orientation relative to light. Nothing about how is settled.

## Placement is machinery, not a promoter setting

Specification §2.1 is explicit: spatial targeting generally needs localization, polarity, trafficking or assembly machinery beyond the promoter itself, and a promoter is not an autonomous environmental computer. This vault therefore separates the two — a [[Conditional|conditional promoter]] decides how much, and a [[Gene Modification]] tag decides where — rather than bundling them into one cassette.

Bundling remains a legitimate alternative that specification §2.1 offers, and it would be cheaper to build. It was rejected here because it teaches the player something false.

## Two independent choices

Specification §5.3 notes that spatial granularity and targeting logic are separate and combinable:

| Granularity | Advantage | Cost |
|---|---|---|
| Discrete slots — pole, both poles, lateral, distributed | Legible, cheap, stable inheritance | Coarse; supports only selected body plans |
| Continuous membrane coordinates | Fine morphological identity | Harder validation, rendering, assembly, orientation |

| Targeting logic | Advantage | Cost |
|---|---|---|
| Body-fixed | Predictable through rotation and division | Cannot respond to the world |
| Cue-relative | Achieves the light-relative behaviour V05 names | Needs sensing, memory, response time, turnover, a reference frame |

This vault assumes discrete slots with optional cue-relative placement through [[Photovector (PHVC)]], because slots inherit cleanly and a light vector is the only directional cue with supporting evidence — source [B2].

## The questions that must be answered

Specification §5.3 decision D12 leaves all of these open, and each one produces visible nonsense if left undefined:

- Is placement fixed at construction, inherited as polarity, or continuously remodelled?
- What happens as the cell rotates? Does a body-fixed pole track the body, and a cue-relative slot track the cue?
- What happens at [[Division]]? Which daughter inherits which pole?
- What happens as the cell grows and the geometry changes?
- What happens when the light signal is lost — hold the last placement, or revert?
- What happens when two cues conflict?

## The steering loophole

Specification §3.2 warns that a repeated instantaneous "move the flagellum to this side" edit would function as manual steering in disguise, which would break requirement V02. Reorienting a cilium's power stroke through [[Ciliary Polarizer (CILP)]] is the same loophole. Three defences, none of which is optional:

1. The mandatory edit delay of requirement V22 — an edit cannot help with an immediate problem.
2. Assembly time and turnover — repositioning a filament tagged with [[PolarLocalizationSignal]] is slow and lossy, not instant.
3. Species-wide application under requirement V18 — an edit affects every cell, so it cannot be a per-cell manoeuvre.

### Related
[[Motility]] · [[PolarLocalizationSignal]] · [[Photovector (PHVC)]] · [[Expression]]
