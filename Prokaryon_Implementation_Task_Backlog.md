# Prokaryon — Implementation Task Backlog

**Version:** 1.0  
**Prepared:** September 29, 2026 (America/Chicago)  
**Basis:** *Prokaryon — Game Specification and Development Checklist*, version 0.7, dated September 29, 2026; current source document read for this breakdown.  
**Owner:** Pierce Jamieson  
**Status:** Planning only. All work remains unchecked; no game implementation or performance result is claimed.

This is a separate execution companion to the main design document. The specification remains authoritative for game rules, scope and alternatives. This backlog decomposes its 118 implementation tickets into small, reviewable tasks while retaining the original parent IDs. Update design decisions in the specification and record their implementation consequences here; do not maintain two competing descriptions of the game.

Unity/C# is the recommended implementation baseline given the engine discussion and your experience. The exact editor, packages, rendering pipeline, networking stack and final engine decision remain explicit selection work. Python is available for tooling and analysis. Development hosting remains local; production infrastructure and subscription integration are later tasks.

## Start here

Your first deliverable is a clean, version-controlled Unity candidate project with a reproducible simulation harness. Complete the short foundation decisions only as needed for the next task; do not spend weeks answering the whole decision register.

1. Work through **S0-01.01–S0-01.04**: extract the one-page charter and identify the immediately required prototype choices.
2. Complete **S0-02.01–S0-02.05**: pin the Unity candidate and make empty graphical/headless builds run.
3. Complete **S0-03.01–S0-03.04**: commit, back up and verify a clean build.
4. Complete **S0-04, S0-05 and S0-06**: seeded fixed-step clock, state/command boundaries, pause/step/reset and diagnostics.
5. Review **G0** through **S0-07**, then build **S1-01–S1-07**: placeholder cells, fields, metabolism, division and death.
6. Continue through the rest of Stage 1 to prove the full genetic loop. A growing swarm alone is not the first-playable completion criterion.

**First visible success:** a small population that consumes an accounted resource, grows, divides and dies, with an inspector that explains why. **First gameplay success:** the player can buy and commit delayed genetic edits, observe local consequences and make another informed adjustment.

## How to execute these tasks

- A leaf task has an ID such as `S1-15.05`, an action and a **Done when** condition. Its parent retains the source specification's dependency and acceptance contract.
- **Within a parent, execute rows in order by default.** The first row requires the parent's listed prerequisites plus its stage entry gate. Later rows also depend on the preceding row. Independent implementation work may be reordered once the dependency is demonstrated; record any added cross-parent dependency.
- A parent dependency means all its required leaf tasks and parent acceptance evidence are complete. A gate dependency means that stage's required parents have passed and its review has accepted the evidence. R01–R08 are policy bundles, not code tasks.
- Use **D** for a design/decision task, **I** for implementation/content, **V** for verification, **E** for an experiment/playtest/measurement, and **O** for an operational action. A D task records a choice; it does not grant the assistant permission to invent a permanent game rule.
- Aim for a leaf task that can be completed and inspected in one focused sitting. A useful sizing target is roughly **30 minutes to 3 hours**, not an effort estimate or promise. If actual work exceeds a sitting or contains independent outcomes, split it into `.a`, `.b`, etc. Keep the original ID as their parent.
- Later tasks involving an unknown catalog or platform matrix are **expandable work packets**. Instantiate the content and scenario templates below as soon as that inventory is chosen. The 580-task count is not the final amount of work or a release estimate.
- Tick a box only with evidence: commit/build or decision record, exact reproduction steps, result and important limitation. Record focused time to learn your actual throughput.
- A conditional branch is complete only after its implemented evidence **or** an explicit not-applicable decision. Do not mark it implemented because it was skipped. Optional active-offline populations, approximation, chat, controller support and additional HGT routes are not silently added to scope.
- Use narrow verification: invariant/transaction checks for authority work, reference fixtures for numerical rules, manual review for ordinary UI/content changes, and profiles for performance claims. Do not create tests merely to mirror implementation details.
- Operational tasks describe future work. Purchases, external messages, publication and destructive production actions receive appropriate authorization when the concrete result is ready. This document itself does not perform or authorize them.

### Constraints every coding task inherits

Cells remain on XY; there are no direct movement or attack commands. Genes are functional modules. Purchased edits apply species-wide after a mandatory delay and can mature concurrently within a limit. Local receptor inputs, expression, regulator abundance, physiology and assembly remain cell-specific. Promoters support compound conditions and shared downstream genes; transcription factors recognize matching promoter/operator tags. Division earns mutation points; gene capacity, construction/editing and unlocks cost points. Gene slots, editing slots and expression capacity are separate. Both tradeoff and permanent upgrades exist. The loop is continuous optimization in an open-ended sandbox.

The first paid release still requires the agreed **vast persistent multiplayer world**. Local prototypes and a polished small habitat are development milestones. Active offline cells are optional under the amended logout direction; retained-population attrition and similar-environment return require explicit policy. The planned commercial direction remains $5/month. Do not add cloud setup or billing to the first prototype.

## Stage index and gates

| Stage | Parent tickets | Leaf tasks | Entry | Exit |
|---|---|---:|---|---|
| [0 — Foundation](#stage-0) | S0-01–S0-07 | 33 | Specification available; no implementation assumed | G0 |
| [1 — Complete local genetic loop](#stage-1) | S1-01–S1-22 | 129 | G0 | G1 |
| [2 — Economy, persistence and early service feasibility](#stage-2) | S2-01–S2-12 | 57 | G1; instrumentation may start earlier | G2 |
| [3 — Environment and interacting species](#stage-3) | S3-01–S3-14 | 63 | G2 | G3 |
| [4 — Visual and interface production](#stage-4) | S4-01–S4-08 | 36 | G1; use Stage 3 scene inputs when available | G4 |
| [5 — Integrated local multiplayer](#stage-5) | S5-01–S5-12 | 65 | G2 and G3; final art is not needed for backend work | G5 |
| [6 — Playable vertical slice](#stage-6) | S6-01–S6-06 | 24 | G3, G4 and G5 | G6 |
| [7 — Persistent world and capacity certification](#stage-7) | S7-01–S7-12 | 62 | G6; early regional feasibility comes from Stage 2 | G7 |
| [8 — Launch content and feature-complete alpha](#stage-8) | S8-01–S8-07 | 33 | G6; freeze limits at G7 before completion | G8 |
| [9 — External beta, commerce and store preparation](#stage-9) | S9-01–S9-08 | 39 | G7 and G8 | G9 |
| [10 — Steam release](#stage-10) | S10-01–S10-06 | 23 | G9 | G10 |
| [11 — Maintenance and future decisions](#stage-11) | S11-01–S11-04 | 16 | Released game | G11 |

**Total: 118 parent tickets; 580 leaf tasks.** Gate reviews and content expansion are included as work, not treated as free overhead.

The source roadmap’s Stage 3 range ends at S3-12, but its detailed backlog includes S3-13 and S3-14. This companion uses all 14 ecology tickets. Gates apply even where an individual source dependency omits the stage gate. Stage 4 is an independent branch after G1; a solo developer can alternate work streams without assuming additional staff.

## Decisions to resolve when they become necessary

The following register schedules decisions; alternatives are concise reminders of the main specification. A temporary experimental setting must be labeled provisional and kept in tuning data. Mandatory features and owner-confirmed choices remain fixed.

| Bundle / source decisions | Choice to record | Alternatives and main tradeoff | First blocking work |
|---|---|---|---|
| R01; D33–D36 | Engine/version, platforms, content authoring and determinism | Unity candidate uses existing expertise; another engine needs a demonstrated reason. Same-build reproducibility is cheaper than cross-platform bit identity. Files are diffable; custom authoring UI costs more to build. | S0-02; S0-04; refine at S2-03 |
| B02–B03 | Biological scope and fidelity | Bacteria only narrows incompatible machinery; including archaea widens content and exceptions. Mechanistic plausibility needs less calibration than quantitative physiology. | S1-05; commit before S8-02 |
| R02; D42–D43 | Starter, reserves, energy/material abstraction and initial points | A fixed viable starter simplifies onboarding; alternatives/custom starts add identity and balancing work. Initial points enable intervention sooner; zero requires reliable first division. | S1-05 |
| R03; D12 | Geometry, taxis, reference frames and assembly | Circle/capsule proxies simplify contacts. Body-fixed placement is legible; cue-relative placement requires directional sensing and remodeling rules. Temporal taxis and continuous heading differ in behavior and cost. | S1-03; S1-10–S1-11 |
| R04; D59–D61, D68–D71 | Logic, shared outputs, tags, repression and feedback | Exact tags and fixed output ratios are simpler; graded compatibility and weights add tuning. Feed-forward logic is easier to debug; stateful feedback enables dynamics and needs bounded stable updates. | S1-08–S1-09 |
| R05; D13–D16, D66–D67 | Point ownership, costs, slot accounting and upgrades | Species-run versus account scope changes persistence and advantage. Per-gene slot accounting versus per-construct accounting changes coupling value. Bounds/refunds affect recovery; both upgrade classes remain required. | S1-12; upgrades S2-07 |
| R06; D03, D63–D65 | Delay, concurrency, pending edits and conflicts | Fixed delay is predictable; magnitude-based delay is more strategic. Queueing increases planning and steering risk. Rejecting overlap is simpler; explicit rebasing preserves more work but adds complexity. | S1-14–S1-15 |
| R08; D01, D07–D09, D11, D62 | Editor, player knowledge and local map | Nested blocks simplify layout; node graphs expose topology with more UI work. Full overlays help diagnosis; sensor-limited knowledge adds uncertainty. Main readouts must identify rate versus abundance. | S1-13; S1-18 |
| R07; D05–D06, D10 | Extinction, strains and retained progress | Run loss strengthens stakes; retained unlocks aid continuity but advantage veterans. Multiple strains add specialization and management. Stored-cell survival changes the extinction boundary. | S2-01 |
| D17–D18, D26, D37, D44, D58 | World structure, time, population limits and host authority | One process simplifies ownership; connected regions bound work but require flux/handoff. Ecological limits are systemic but uncertain; hard limits need fairness/division policy. Decide downtime time behavior explicitly. | S2-04; final envelope S7-01–S7-02 |
| D27, D46–D57 | Logout, stored state, attrition, matching and return | Withdrawal bounds absent-owner work; optional active absence adds ecology/operating cost. Count versus fractional attrition has different small-population behavior. Strict matching may delay return; fallback needs disclosure. | S2-09; finalize S5-09 |
| D19–D25, D45 | HGT, hostile cargo, inheritance and species merge | Conjugation offers contact-mediated transfer; transformation needs an extracellular pool; transduction adds virus scope. Local cassettes preserve encounter effects; species-wide acquisition spreads advantages faster. | S3-11; finalize S5-07 |
| D28–D29 | Interaction permissions and social features | Ecological-only contact has less moderation/UI work. Chat/trade/groups add coordination and support obligations. Hostility remains required; acceptance/defense rules define exposure. | S3-09–S3-11; S8-06 |
| D30–D32 | Art, camera and asset production | Sprites ease planar readability; dimensional models reuse shapes and animation but add shader/occlusion work. Compare moving scenes and incremental authoring effort. | S4-01–S4-08 |
| D38–D41 | Operating budget, release route and commercial access | Paid Early Access brings earlier support duties and still needs the confirmed world scope. Verify subscription integration and lapse rules. Local hosting and planned $5/month remain the starting directions. | S7-10; S9-05–S9-06 |

**Decision record:** ID/date; owner-approved or provisional; options compared; chosen rule; reason/evidence; affected tickets; tuning values/units; migration consequences; reconsideration trigger.

When a decision affects the next task, prepare a concrete recommendation with the relevant alternatives. Ask only for unresolved product choices that materially change the implementation. Do not reopen confirmed compound logic, tag targeting, paid capacity, parallel maturation, mixed upgrades or sandbox progression.

## Detailed execution checklist

Each parent below quotes the source work package and completion contract. Leaf tasks are the new decomposition. The source’s A-series scenarios are reproduced later for cross-checking; additional verification leaves make their implementation cases concrete.

<a id="stage-0"></a>

## Stage 0 — Foundation

**Entry:** Specification available; no implementation assumed.  
**G0:** Client and headless harness run one versioned, seeded scenario; current prototype assumptions and next work are explicit.

<a id="s0-01"></a>

### S0-01 — One-page charter containing C01–C17, prototype scope, open R01–R08 and first gate

**Depends on:** None; stage entry applies.  
**Parent done when:** Confirmed requirements match the conversation; no unanswered numerical choice is labeled confirmed.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-01.01 | D | Copy confirmed product constraints into a one-page project charter | C01–C17 and V01–V30 are referenced without changing their status. |
| [ ] | S0-01.02 | D | List the first-playable capabilities and explicit exclusions | The list matches specification §14.2 and retains the paid-release world commitment. |
| [ ] | S0-01.03 | D | Create the prototype policy register | R01–R08 each have an owner, unresolved fields, and the first dependent ticket. |
| [ ] | S0-01.04 | D | Record development capacity and initial tool/asset budget | Focused hours/week and spending constraints are stated or explicitly unknown; no release date is inferred. |

<a id="s0-02"></a>

### S0-02 — Pin candidate engine/packages; create client and headless build configurations

**Depends on:** [S0-01](#s0-01); stage entry applies.  
**Parent done when:** Both run outside the editor; machine/build versions recorded; R01 recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-02.01 | D | Record the provisional Unity/C# choice and platform targets | Engine, rendering candidate, client OS and local server target are explicit; final art choice remains open. |
| [ ] | S0-02.02 | I | Create the empty project and pin its editor/package versions | A second installation can identify the exact required versions from tracked files. |
| [ ] | S0-02.03 | I | Create the minimal client startup scene | A standalone build opens and displays its build identifier. |
| [ ] | S0-02.04 | I | Create the headless startup entry point and build configuration | The process starts without a graphical session and exits with a useful status. |
| [ ] | S0-02.05 | V | Build and run both targets outside the editor | Launch commands, version identifiers and results are recorded. |

<a id="s0-03"></a>

### S0-03 — Version control, source backup, clean build instructions and minimal build verification

**Depends on:** [S0-02](#s0-02); stage entry applies.  
**Parent done when:** Restore/clean checkout builds and opens the starting scene without undocumented local files.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-03.01 | I | Initialize Git with engine-appropriate tracked files and exclusions | Source, settings and package locks are tracked; generated caches and credentials are excluded. |
| [ ] | S0-03.02 | I | Configure source backup and make the first baseline commit | The project can be recovered from the selected backup location. |
| [ ] | S0-03.03 | I | Write clean-checkout setup and build instructions | Required modules, commands and expected outputs are documented. |
| [ ] | S0-03.04 | V | Build from a separate clean checkout | Both entry points run without relying on untracked local files. |

<a id="s0-04"></a>

### S0-04 — Seeded scenario runner with fixed simulation clock and configurable parameters

**Depends on:** [S0-02](#s0-02); stage entry applies.  
**Parent done when:** Same build/seed/input reproduces the declared state metrics; time step and RNG state are explicit.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-04.01 | D | Define simulation-time and reproducibility policy | Tick duration, catch-up limit and same-build reproducibility scope are explicit. |
| [ ] | S0-04.02 | I | Implement the fixed-step simulation clock | Advancing one tick increments logical time by the configured amount independent of rendering. |
| [ ] | S0-04.03 | I | Add an explicitly seeded random-number source | Reset restores its initial state and simulation systems use the injected generator. |
| [ ] | S0-04.04 | I | Define a versioned scenario fixture | Seed, parameters, units and initial state load from one identified fixture. |
| [ ] | S0-04.05 | I | Add a headless run-for-N-ticks command | It emits a compact final-state summary and exits without manual input. |
| [ ] | S0-04.06 | V | Repeat a fixture with different render rates | Declared simulation metrics match within the chosen reproducibility tolerance. |

<a id="s0-05"></a>

### S0-05 — Stable IDs and versioned content/state/command interfaces from Section 15.3

**Depends on:** [S0-04](#s0-04); stage entry applies.  
**Parent done when:** Invalid IDs/schema versions fail clearly; presentation cannot mutate authoritative state directly.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-05.01 | I | Define stable IDs for species, cells, constructs, content and events | Display names can change without breaking references. |
| [ ] | S0-05.02 | I | Define immutable genome and versioned content contracts | A genome revision references known content and cannot change under existing readers. |
| [ ] | S0-05.03 | I | Define cell-state and diagnostic-snapshot contracts | Position, resources and local phenotype belong to simulation state, not scene objects. |
| [ ] | S0-05.04 | I | Define command request/result contracts | Request ID, target, expected revision and structured failure are representable. |
| [ ] | S0-05.05 | I | Add schema and reference validation | Unknown IDs, unsupported versions and non-finite numeric values fail with identified fields. |
| [ ] | S0-05.06 | V | Enforce the presentation boundary | A client view receives snapshots and submits commands without writable access to authoritative state. |

<a id="s0-06"></a>

### S0-06 — Basic step/pause debug controls, subsystem timing, resource ledger and scenario reset

**Depends on:** [S0-04](#s0-04)–[S0-05](#s0-05); stage entry applies.  
**Parent done when:** Capture one reproducible diagnostic report; debug pause is unavailable as a shared-world player command.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-06.01 | I | Add developer pause and single-step controls | One step advances exactly one logical tick while rendering remains responsive. |
| [ ] | S0-06.02 | I | Add scenario reset | Initial state, clock and random state are restored together. |
| [ ] | S0-06.03 | I | Add subsystem timing and entity counters | One diagnostic capture identifies tick duration and workload. |
| [ ] | S0-06.04 | I | Add a source/sink resource ledger interface | Systems can attribute each resource delta to a named cause. |
| [ ] | S0-06.05 | V | Run a reproducible diagnostic capture | Build, scenario, seed and sample interval accompany the output; player commands cannot pause a shared world. |

<a id="s0-07"></a>

### S0-07 — Review G0 and approve a temporary prototype decision sheet

**Depends on:** [S0-03](#s0-03)–[S0-06](#s0-06); stage entry applies.  
**Parent done when:** Build, run instructions, selected R policies and next ticket exist; outstanding assumptions are visible.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S0-07.01 | V | Run the client and headless G0 smoke fixture | Both consume the same versioned scenario and expose its clock/state. |
| [ ] | S0-07.02 | D | Review the prototype decision sheet | Only policies needed for the next work are chosen; later unanswered R fields have explicit deadlines. |
| [ ] | S0-07.03 | D | Record the G0 result and next dependency-ready task | Failures have small follow-up tickets; passing evidence points to a commit and reproduction steps. |

<a id="stage-1"></a>

## Stage 1 — Complete local genetic loop

**Entry:** G0.  
**G1:** The paid, delayed genetic loop works end to end with compound conditions, tag-based repression, parallel maturation and a live local map. New players can cause and explain outcomes; routine correction deadlocks are resolved.

<a id="s1-01"></a>

### S1-01 — Species and cell registries with stable ownership, parent references and genome revisions

**Depends on:** G0; stage entry applies.  
**Parent done when:** Spawn/remove cells without ID reuse errors or ownership loss.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-01.01 | I | Implement the species registry | Each species has a stable owner, display name and current genome reference. |
| [ ] | S1-01.02 | I | Implement the cell registry | Spawned cells carry species, parent, position, orientation and local resource state. |
| [ ] | S1-01.03 | I | Implement queued cell creation/removal | Iteration cannot skip a surviving cell or update a removed cell twice. |
| [ ] | S1-01.04 | V | Spawn, remove and respawn a small population | IDs are not accidentally reused and parent/species references remain valid. |

<a id="s1-02"></a>

### S1-02 — Placeholder XY world view, camera, selection and focal-cell highlight

**Depends on:** [S1-01](#s1-01); stage entry applies.  
**Parent done when:** Camera/selection never changes simulation; visual depth does not change hit/contact rules.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-02.01 | I | Render placeholder cells from simulation snapshots | Visible positions follow authoritative XY positions. |
| [ ] | S1-02.02 | I | Add pan and zoom controls | Camera changes only presentation state. |
| [ ] | S1-02.03 | I | Add cell picking and focal highlighting | Selection resolves the intended stable cell ID in overlapping scenes. |
| [ ] | S1-02.04 | V | Compare observed and unobserved fixture runs | Camera motion, zoom and selection leave simulation metrics unchanged. |

<a id="s1-03"></a>

### S1-03 — Geometry proxy, boundary/collision queries and inspectable body orientation

**Depends on:** [S1-01](#s1-01); stage entry applies.  
**Parent done when:** Cells remain on the plane and cannot cross solid geometry; R03 proxy recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-03.01 | D | Record geometry, orientation and contact conventions in R03 | Proxy shape, body axes, units and solid-boundary behavior are explicit. |
| [ ] | S1-03.02 | I | Implement cell geometry queries and world-boundary constraints | Test cells remain on XY and cannot pass through declared solid boundaries. |
| [ ] | S1-03.03 | I | Add local neighbor lookup | Nearby candidates match a brute-force reference on a small fixture. |
| [ ] | S1-03.04 | I | Resolve overlapping proxies under the selected rule | Separation is bounded and does not introduce unintended motion through walls. |
| [ ] | S1-03.05 | I | Draw developer body-axis and contact overlays | Displayed orientation and collision shapes match simulation data. |

<a id="s1-04"></a>

### S1-04 — Small grid/field fixture with a food source, light contrast and explicit source/sink accounting

**Depends on:** [S1-03](#s1-03); stage entry applies.  
**Parent done when:** Values and units inspectable; wall/region conditions declared; reset recreates the same habitat.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-04.01 | I | Define field channels, units and sampling coordinates | Nutrient and light readings can be inspected at known XY positions. |
| [ ] | S1-04.02 | I | Create the small authored field fixture | Food source, light contrast and a sheltered pocket reset reproducibly. |
| [ ] | S1-04.03 | I | Implement declared nutrient sources and sinks | A no-cell run has the expected ledger change. |
| [ ] | S1-04.04 | D | Record boundary and sampling policies | Outside-grid values and wall behavior have unambiguous outcomes. |
| [ ] | S1-04.05 | V | Verify sampled values and resource totals | Known positions and source intervals match the fixture specification. |

<a id="s1-05"></a>

### S1-05 — Functional gene definitions and viable starter, including ATP synthase and declared energy input

**Depends on:** [S0-05](#s0-05), [S1-04](#s1-04); stage entry applies.  
**Parent done when:** Each function has costs, limits and a visible effect; starter energy is not created from nothing; R02 recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-05.01 | D | Specify the starter resource model and initial reserves in R02 | ATP supply inputs, biomass inputs, starter population and initial points are explicit. |
| [ ] | S1-05.02 | I | Define the minimum functional-gene schema | IDs, dependencies, bounds, costs and effects validate as data. |
| [ ] | S1-05.03 | I | Implement the starter ATP-synthase function | Its activity depends on expressed functional abundance and the declared energy input. |
| [ ] | S1-05.04 | I | Define uptake, receptor, motility and repressor fixture modules | Each names its intended effect and required runtime system; unsupported effects fail validation. |
| [ ] | S1-05.05 | I | Assemble a versioned starter genome fixture | It includes ATP synthase and enough declared support to test viability. |
| [ ] | S1-05.06 | V | Suppress ATP synthesis or remove its input | Energy availability changes for the documented reason; no implicit replenishment occurs. |

<a id="s1-06"></a>

### S1-06 — Uptake, energy expenditure, maintenance, growth and joint resource allocation

**Depends on:** [S1-05](#s1-05); stage entry applies.  
**Parent done when:** A cell grows with adequate resources and fails predictably without them; no double spending or negative pools.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-06.01 | D | Choose resource-allocation ordering and protein amount/concentration convention | Shared expenditures and growth dilution have one documented interpretation. |
| [ ] | S1-06.02 | I | Implement bounded nutrient uptake | Combined uptake cannot exceed the nutrient available to competing cells. |
| [ ] | S1-06.03 | I | Implement substrate-dependent energy production | Inputs and outputs are attributed to the resource ledger. |
| [ ] | S1-06.04 | I | Implement maintenance expenditure | Upkeep consumes available resources under the chosen allocation policy. |
| [ ] | S1-06.05 | I | Implement biomass assimilation and size change | Growth requires the declared material and energy inputs. |
| [ ] | S1-06.06 | I | Allocate limited resources across simultaneous demands | Expression, movement and upkeep cannot independently spend the same pool. |
| [ ] | S1-06.07 | V | Run fed, limited and starved single-cell fixtures | Growth and failure follow the recorded balances; pools remain finite and nonnegative. |

<a id="s1-07"></a>

### S1-07 — Division, daughter placement/inheritance, mortality and unique birth/death events

**Depends on:** [S1-06](#s1-06); stage entry applies.  
**Parent done when:** Matter/state split under chosen rules; obstructed division does not award a fictitious birth; A01 lifecycle basics pass.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-07.01 | D | Specify division prerequisites and daughter inheritance | Resource split, abundance/dilution, damage, polarity and genome inheritance are explicit. |
| [ ] | S1-07.02 | I | Evaluate division readiness | A cell becomes eligible only when all selected prerequisites hold. |
| [ ] | S1-07.03 | I | Find valid daughter placement | A crowded or blocked placement returns a defined failure without a fictitious birth. |
| [ ] | S1-07.04 | I | Commit division atomically | Parent/daughter state and resource totals match the inheritance policy. |
| [ ] | S1-07.05 | I | Implement damage, mortality and lysis outputs | Death has a cause and declared resource disposition. |
| [ ] | S1-07.06 | I | Emit uniquely identified birth and death events | Reprocessing an event cannot create another daughter or corpse. |
| [ ] | S1-07.07 | V | Exercise growth, crowded division and final-cell death | Lifecycle accounting and A01 prototype behavior are reproducible. |

<a id="s1-08"></a>

### S1-08 — Bounded compound-condition representation, receptor input routing and tag-match index

**Depends on:** [S1-04](#s1-04)–[S1-05](#s1-05); stage entry applies.  
**Parent done when:** AND/OR/NOT grouping tested; missing inputs explicit; matching/nonmatching tags distinguished; R04 recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-08.01 | D | Record compound-input semantics and limits in R04 | AND/OR/NOT grouping, unavailable inputs, tag compatibility and maximum expression size are explicit. |
| [ ] | S1-08.02 | I | Define and validate bounded condition trees | Malformed trees, excessive depth and unknown inputs are rejected. |
| [ ] | S1-08.03 | I | Route environmental inputs through expressed receptors | Missing or nonfunctional receptors yield the declared unavailable-input state. |
| [ ] | S1-08.04 | I | Evaluate grouped compound conditions | A small truth-table fixture covers grouping, negation and missing inputs. |
| [ ] | S1-08.05 | I | Build the promoter/operator tag index | Matching, nonmatching and shared tags resolve by functional identity rather than display name. |
| [ ] | S1-08.06 | V | Reject pathological controller inputs | Evaluation work is bounded; player data never becomes executable server code. |

<a id="s1-09"></a>

### S1-09 — Promoter target, constrained synthesis, abundance/turnover and transcription-factor repression

**Depends on:** [S1-06](#s1-06), [S1-08](#s1-08); stage entry applies.  
**Parent done when:** Tagged repressor affects compatible targets; shared promoter drives multiple genes; A21/A23/A26 basic cases pass.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-09.01 | D | Specify synthesis, turnover and regulator-combination rules | Basal output, repression precedence, shared outputs and feedback support are explicit. |
| [ ] | S1-09.02 | I | Compute promoter target output from sensed inputs | Constitutive and conditional fixtures produce their declared demand. |
| [ ] | S1-09.03 | I | Distribute a shared promoter's output across downstream genes | Selected coupling/weights apply without forcing identical final abundance. |
| [ ] | S1-09.04 | I | Integrate constrained product synthesis and turnover | Resource-limited output, degradation and growth dilution remain distinguishable. |
| [ ] | S1-09.05 | I | Implement expressed tag-targeted repression | Repressor abundance affects compatible promoters; unrelated tags remain unaffected. |
| [ ] | S1-09.06 | I | Implement the selected feedback policy | Supported feedback advances stored state across ticks; unsupported cycles fail validation. |
| [ ] | S1-09.07 | V | Run A21, A23 and A26 local fixtures | Shared expression, receptor loss and repression/recovery match the documented kinetics. |

<a id="s1-10"></a>

### S1-10 — Localization/assembly representation and fixed versus cue-relative test fixture

**Depends on:** [S1-03](#s1-03), [S1-09](#s1-09); stage entry applies.  
**Parent done when:** Rotate, divide and change illumination; displayed placements follow the documented frame and kinetics.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-10.01 | D | Select prototype localization and assembly rules in R03 | Body-fixed versus cue-relative placement and directional-sensor requirements are explicit. |
| [ ] | S1-10.02 | I | Store per-product localization in the selected coordinate frame | Location remains meaningful when the cell rotates. |
| [ ] | S1-10.03 | I | Convert local placement into world coordinates | Developer markers agree with the cell orientation and geometry. |
| [ ] | S1-10.04 | I | Model assembly and disassembly under the selected timing rule | Existing structures do not vanish merely because new synthesis stops unless explicitly modeled. |
| [ ] | S1-10.05 | I | Apply growth/division localization inheritance | Daughter locations follow the documented polarity rule. |
| [ ] | S1-10.06 | V | Rotate cells and change or remove illumination | Placement follows the selected frame and available sensing machinery, without direct player steering. |

<a id="s1-11"></a>

### S1-11 — Autonomous motility response with energetic cost and no player steering command

**Depends on:** [S1-08](#s1-08)–[S1-10](#s1-10); stage entry applies.  
**Parent done when:** Genetic differences alter travel/retention; assembled machinery drives behavior; A04 passes for prototype mechanics.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-11.01 | D | Specify the prototype autonomous controller | Taxis/memory rule, propulsion, torque, drag and energy cost are documented. |
| [ ] | S1-11.02 | I | Convert functional motility machinery into propulsion | Unassembled or unavailable machinery contributes no unsupported force. |
| [ ] | S1-11.03 | I | Couple sensed inputs to the selected motor response | Genetically distinct fixtures show the expected directional or temporal response. |
| [ ] | S1-11.04 | I | Integrate XY motion and flow with collision handling | Movement respects boundaries and spends the declared energy. |
| [ ] | S1-11.05 | V | Compare motile and nonmotile cells in the same fixture | Travel differences follow genes and resources; the command interface exposes no movement destination. |

<a id="s1-12"></a>

### S1-12 — Species-run prototype point ledger, paid gene capacity, unlocks and charge validation

**Depends on:** [S1-05](#s1-05), [S1-07](#s1-07); stage entry applies.  
**Parent done when:** Birth rewards once; capacity/access/edit purposes distinct; insufficient funds cannot partially purchase; R05 recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-12.01 | D | Record R05 ownership, slots and purchase rules | Gene capacity, edit concurrency and physiological capacity are distinct; shared-promoter slot accounting is explicit. |
| [ ] | S1-12.02 | I | Create the mutation-point ledger | Balance changes reference a unique event or purchase ID and an owner scope. |
| [ ] | S1-12.03 | I | Award points for committed eligible division events | Duplicate event delivery leaves the balance unchanged. |
| [ ] | S1-12.04 | I | Implement paid gene-capacity expansion | Capacity increases once and the correct price is charged atomically. |
| [ ] | S1-12.05 | I | Implement content unlock eligibility and purchase | Unlocking grants access without silently installing a construct. |
| [ ] | S1-12.06 | I | Implement creation/edit cost quotations | Gene changes and promoter changes expose all applicable charges. |
| [ ] | S1-12.07 | V | Attempt insufficient-fund and repeated purchases | No partial capacity, unlock or balance changes occur. |

<a id="s1-13"></a>

### S1-13 — Gene-editor draft UI: choose module, promoter, condition inputs and downstream genes

**Depends on:** [S1-08](#s1-08), [S1-12](#s1-12); stage entry applies.  
**Parent done when:** Draft a single-gene and shared-promoter construct; editable/locked fields and total cost are visible.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-13.01 | D | Record the first editor layout and draft behavior in R08 | Species design, local phenotype and uncommitted changes have distinct roles. |
| [ ] | S1-13.02 | I | Open a species-scoped draft from the current genome | Editing the draft cannot modify the live genome. |
| [ ] | S1-13.03 | I | Add a module picker with locked/unlocked states | Ineligible choices explain their prerequisites. |
| [ ] | S1-13.04 | I | Add promoter strength and condition-input controls | Invalid values receive field-level feedback. |
| [ ] | S1-13.05 | I | Add a promoter response preview over a selected input range | The preview uses the same regulatory semantics as runtime and is labeled as hypothetical rather than current abundance. |
| [ ] | S1-13.06 | I | Add downstream gene controls for supported shared promoters | Single-gene and multi-gene constructs can be authored. |
| [ ] | S1-13.07 | I | Show draft diff, occupied slots and total cost | The player can identify exactly what would change before submission. |
| [ ] | S1-13.08 | I | Add undo/redo for uncommitted draft operations | Reverting a draft action restores its prior valid state without sending an authoritative edit. |
| [ ] | S1-13.09 | V | Discard or switch focal cells while drafting | Discard leaves live state unchanged; a focal switch does not lose or retarget the species draft. |

<a id="s1-14"></a>

### S1-14 — Validate/commit command with base revision, touched fields, charge and activation eligibility

**Depends on:** [S1-09](#s1-09), [S1-12](#s1-12)–[S1-13](#s1-13); stage entry applies.  
**Parent done when:** Preview has no physiological effect; committed edit cannot affect phenotype early; invalid/retried commands charge correctly.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-14.01 | D | Record the commit/charge point and minimum delay policy in R06 | The authoritative eligibility timestamp and rejection/refund cases are explicit. |
| [ ] | S1-14.02 | I | Convert an editor diff into a bounded patch command | Request ID, base revision and touched fields accompany the proposed changes. |
| [ ] | S1-14.03 | I | Validate ownership, content, dependencies, capacity and funds | Each rejected field or operation has a specific reason. |
| [ ] | S1-14.04 | I | Atomically record the accepted edit and charge/reservation | A failed commit leaves both genome and ledger unchanged. |
| [ ] | S1-14.05 | I | Return the original outcome for a repeated request ID | Repeated submission cannot charge or schedule twice. |
| [ ] | S1-14.06 | V | Compare draft, accepted-pending and eligible states | Neither preview nor an accepted edit changes authoritative phenotype before its delay. |

<a id="s1-15"></a>

### S1-15 — Parallel maturation scheduler with cap, cancellation and conflicting-edit policy

**Depends on:** [S1-14](#s1-14); stage entry applies.  
**Parent done when:** Two compatible edits mature concurrently; above-limit and overlapping edits have explicit outcomes; R06 and A20 basics recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-15.01 | D | Choose concurrency scope, cap and excess-work behavior in R06 | Parallel work is supported and queue versus rejection behavior is explicit. |
| [ ] | S1-15.02 | I | Schedule independent edit maturation timestamps | Two permitted edits can become due in the same tick. |
| [ ] | S1-15.03 | I | Enforce the cap at authoritative acceptance | Multiple submission paths cannot overfill editing capacity. |
| [ ] | S1-15.04 | I | Implement the selected cancellation/replacement policy | Timer, charge and slot effects match the policy and are recorded. |
| [ ] | S1-15.05 | I | Compose disjoint due patches against the current revision | One completed edit cannot overwrite another with an old genome snapshot. |
| [ ] | S1-15.06 | I | Resolve overlapping edits and invalidated dependencies | Chosen rejection/rebase/refund outcomes are explicit and leave a valid genome. |
| [ ] | S1-15.07 | V | Run simultaneous, over-cap and opposing-edit fixtures | A20 has no early effects, duplicate charges or lost accepted changes. |

<a id="s1-16"></a>

### S1-16 — Species-wide adoption across different local environments and cells born during maturation

**Depends on:** [S1-07](#s1-07), [S1-15](#s1-15); stage entry applies.  
**Parent done when:** All eligible members adopt correctly; local abundance/resources are preserved under selected transition; A02 passes.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-16.01 | I | Publish immutable species genome revisions at activation | All eligible cells can resolve the same activated design. |
| [ ] | S1-16.02 | I | Transition local phenotype under the selected adoption rule | Resources, damage and existing products are preserved or transformed explicitly, never reset incidentally. |
| [ ] | S1-16.03 | I | Handle births during pending and active revisions | Newborns neither skip nor double-apply the purchased edit. |
| [ ] | S1-16.04 | I | Display local adoption versus species revision state | Any permitted transition lag is distinguishable from missing propagation. |
| [ ] | S1-16.05 | V | Run a species split across light and nutrient conditions | A02 shows common DNA scope with different local expression and a single economic charge. |

<a id="s1-17"></a>

### S1-17 — Compound condition/tag editing, target preview and pending-edit UI

**Depends on:** [S1-13](#s1-13)–[S1-16](#s1-16); stage entry applies.  
**Parent done when:** Show all local matching targets, active timers, shared settings and conflicts; natural regulation does not masquerade as a player edit.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-17.01 | I | Add explicit AND/OR/NOT grouping controls | The displayed expression evaluates identically to the submitted tree. |
| [ ] | S1-17.02 | I | Add operator and regulator-recognition tag editing | Display-name changes cannot silently alter functional targeting. |
| [ ] | S1-17.03 | I | Preview all matching constructs | Shared and absent targets are visible before submission. |
| [ ] | S1-17.04 | I | Add a localization preview with a visible body/signal reference frame | The draft placement matches the chosen localization rule without changing assembled live structures. |
| [ ] | S1-17.05 | I | Display active timers, occupied edit slots and queued work | Pending operations map to authoritative request IDs and outcomes. |
| [ ] | S1-17.06 | I | Display conflict and shared-promoter consequences | Affected genes and blocked dependencies are identified without silently rewriting the draft. |
| [ ] | S1-17.07 | V | Author and observe the light–repressor–motility example | Autonomous repression is shown separately from paid edit maturation. |

<a id="s1-18"></a>

### S1-18 — Live personal cell map: actual abundance, localization, target output and inhibition cause

**Depends on:** [S1-09](#s1-09)–[S1-10](#s1-10), [S1-16](#s1-16); stage entry applies.  
**Parent done when:** UI values trace to the current selected cell and sample; pending versus active state visible; A22 basics pass.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-18.01 | I | Publish bounded diagnostic samples with cell/revision/time IDs | Readouts identify the authoritative state they represent. |
| [ ] | S1-18.02 | I | Draw the cell outline, body axes and localized product markers | Markers match simulation coordinates through rotation and growth. |
| [ ] | S1-18.03 | I | Show promoter target, actual synthesis and abundance separately | Resource-limited expression cannot appear as achieved target abundance. |
| [ ] | S1-18.04 | I | Show receptor availability, inhibition and assembly status | Missing sensing, repression and incomplete assembly have different explanations. |
| [ ] | S1-18.05 | I | Show the resource and expression-capacity allocation summary | Requested versus fulfilled synthesis and competing costs explain which function is limiting growth. |
| [ ] | S1-18.06 | I | Link products to their source constructs and edit controls | Navigation preserves the selected species and construct identity. |
| [ ] | S1-18.07 | V | Compare map values with known fixture state and switch focal cells | A22 detects stale samples and never combines two cells' diagnostics. |

<a id="s1-19"></a>

### S1-19 — Short causal history and before/after comparison for a committed edit

**Depends on:** [S1-14](#s1-14), [S1-18](#s1-18); stage entry applies.  
**Parent done when:** Explain receptor → promoter/regulator → product → function → resource/growth outcome without a raw debug log.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-19.01 | I | Define a bounded causal-history record | Events include source construct, local conditions, relevant costs and simulation time. |
| [ ] | S1-19.02 | I | Capture an edit baseline and post-activation samples | Before/after comparisons identify the same quantities and units. |
| [ ] | S1-19.03 | I | Build a receptor-to-outcome explanation view | A selected expression change can be traced through regulation, product and resource consequences. |
| [ ] | S1-19.04 | V | Explain one successful and one harmful edit using only player diagnostics | Causes are visible without opening a developer log or exposing prohibited information. |

<a id="s1-20"></a>

### S1-20 — Complete local play screen and survivor focus switching

**Depends on:** [S1-02](#s1-02), [S1-11](#s1-11), [S1-17](#s1-17), [S1-19](#s1-19); stage entry applies.  
**Parent done when:** Start, observe, divide, purchase, edit, wait, inspect and adjust; focal death does not discard species-level drafts.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-20.01 | I | Assemble the population view, editor and personal map into one play screen | Observation remains usable while a species draft is open. |
| [ ] | S1-20.02 | I | Add selected environmental overlays with information-policy filtering | Gradients, sources and hazards are interpretable without granting cells absent receptors or players forbidden knowledge. |
| [ ] | S1-20.03 | I | Implement the provisional survivor-selection rule | Focal death selects an eligible live cell without altering its physiology. |
| [ ] | S1-20.04 | I | Display population state and local extinction | The fixture ends only when its declared eligible population is gone. |
| [ ] | S1-20.05 | V | Run start → divide → purchase → edit → mature → inspect → adjust | The complete loop works with placeholder visuals and no developer state injection. |
| [ ] | S1-20.06 | V | Kill the focal cell during a pending edit and draft | Species-level work survives the focus transition correctly. |

<a id="s1-21"></a>

### S1-21 — First pacing/recovery experiment across low/high food and cheap/expensive temporary edit settings

**Depends on:** [S1-20](#s1-20); stage entry applies.  
**Parent done when:** Measure useful-action gaps; identify/correct routine no-income/no-correction traps without inventing a new reward source.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-21.01 | E | Define a small food, price and delay experiment matrix | Conditions and useful-action metrics are chosen before comparing results. |
| [ ] | S1-21.02 | E | Record low-income play sessions | Time without a useful affordable correction is measured, including the reason for each interval. |
| [ ] | S1-21.03 | E | Record abundant-resource and long-delay sessions | The loop offers meaningful diagnosis/design rather than mandatory repetitive clicking. |
| [ ] | S1-21.04 | D | Select one targeted pacing adjustment from the evidence | Changes preserve division rewards, paid edits and mandatory maturation delay. |
| [ ] | S1-21.05 | V | Repeat the failing scenario after the adjustment | The specific recovery trap improves without introducing free-resource or steering bypasses. |

<a id="s1-22"></a>

### S1-22 — External formative playtest, G1 evidence and one prioritized revision list

**Depends on:** [S1-21](#s1-21); stage entry applies.  
**Parent done when:** G1 reviewed against predictions, explanations and useful-action availability; record failures rather than adding content reflexively.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S1-22.01 | E | Prepare a short formative playtest script and capture sheet | Predictions, useful edits, explanations and stopping reasons are recorded consistently. |
| [ ] | S1-22.02 | E | Run the agreed small external cohort | Participants attempt the loop with only the intended introductory guidance. |
| [ ] | S1-22.03 | E | Classify observed failures | Misunderstanding, idle time, recovery deadlock and interface friction are separated. |
| [ ] | S1-22.04 | D | Record G1 evidence and one prioritized repair set | The next work addresses demonstrated failures; the gate does not pass on promised future features. |

<a id="stage-2"></a>

## Stage 2 — Economy, persistence and early service feasibility

**Entry:** G1; instrumentation may start earlier.  
**G2:** Local economy, loss, save/load, two-client authority and two-region spikes pass without duplication or lost accepted edits.

<a id="s2-01"></a>

### S2-01 — Extinction/restart policy and implementation for the local run

**Depends on:** G1; stage entry applies.  
**Parent done when:** R07 recorded; distinguish biological continuation, species identity, blueprints, unlocks and upgrade persistence.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-01.01 | D | Select extinction boundary and R07 retention rules | Species identity, currency, blueprints, unlocks and upgrades each have explicit post-loss behavior. |
| [ ] | S2-01.02 | I | Implement extinction detection for the local population scope | Dead, absent and eligible surviving states are not conflated. |
| [ ] | S2-01.03 | I | Implement restart from the selected retained state | Only approved progress and resources carry forward. |
| [ ] | S2-01.04 | V | Exercise final-cell loss and repeated restart | No unintended point, resource or progression duplication occurs. |

<a id="s2-02"></a>

### S2-02 — Versioned world save/load including pending edits, regulator state, ledgers and RNG state

**Depends on:** [S2-01](#s2-01); stage entry applies.  
**Parent done when:** Reload during maturation/low resources preserves consequences and timing; old-format failure is explicit.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-02.01 | I | Define the snapshot manifest and format version | Time, RNG, content, cells, fields, genomes, ledger and pending work are included. |
| [ ] | S2-02.02 | I | Serialize a consistent simulation boundary | A snapshot does not mix state from different ticks. |
| [ ] | S2-02.03 | I | Restore registries and local physiology | Identity, resource totals and regulator state survive reload. |
| [ ] | S2-02.04 | I | Restore pending edits and authoritative timing | Reload neither activates edits early nor restarts their full delay accidentally. |
| [ ] | S2-02.05 | I | Reject incomplete or unsupported saves safely | The last valid state is retained and the error identifies incompatibility. |
| [ ] | S2-02.06 | V | Compare uninterrupted and save/reload fixture runs | Declared metrics and transaction outcomes match within tolerance. |

<a id="s2-03"></a>

### S2-03 — Local headless host and two clients using the same command handler

**Depends on:** [S1-16](#s1-16), [S2-02](#s2-02); stage entry applies.  
**Parent done when:** Clients cannot mint points or assert births; retry/stale/invalid commands produce authoritative responses.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-03.01 | I | Add a minimal local transport adapter around the command handler | The host reuses existing validation and simulation logic. |
| [ ] | S2-03.02 | I | Connect two development clients with separate session identities | Each receives its own species association. |
| [ ] | S2-03.03 | I | Send commands and authoritative acknowledgments across transport | Clients display host outcomes rather than assuming acceptance. |
| [ ] | S2-03.04 | I | Reject client-asserted rewards, births and foreign-species edits | Identity is derived from the session, not trusted request fields. |
| [ ] | S2-03.05 | V | Retry, reorder and stale-submit an edit from the clients | One authoritative result and charge remain. |

<a id="s2-04"></a>

### S2-04 — Two logical regions in one process with cell handoff and field-boundary fixture

**Depends on:** [S1-04](#s1-04), [S2-03](#s2-03); stage entry applies.  
**Parent done when:** Unique cell ownership; no nutrient creation or boundary refuge; compare against no-boundary reference.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-04.01 | I | Divide the fixture into two logical regions | Every cell has one owner region and an inspectable boundary. |
| [ ] | S2-04.02 | I | Implement same-process cell handoff | Crossing moves authority without duplicating cell identity or physiology. |
| [ ] | S2-04.03 | I | Exchange selected field-boundary flux | Nutrient accounting matches the declared boundary conditions. |
| [ ] | S2-04.04 | I | Preserve neighbor/contact queries across the boundary | The boundary does not create an attack or collision refuge. |
| [ ] | S2-04.05 | V | Compare partitioned and unpartitioned fixtures | A12 early metrics expose any boundary-induced difference. |

<a id="s2-05"></a>

### S2-05 — Cross-region species edit and crash/reload transaction fixture

**Depends on:** [S2-04](#s2-04); stage entry applies.  
**Parent done when:** Birth, edit completion and crossing cannot skip or double-apply changes; A12 early evidence.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-05.01 | I | Propagate species revision activation to both logical regions | Cells on either side observe the chosen activation rule. |
| [ ] | S2-05.02 | V | Mature an edit while a cell divides and crosses the boundary | No newborn or migrant misses or repeats adoption. |
| [ ] | S2-05.03 | I | Add fault injection at revision/handoff commit boundaries | A controlled failure can reproduce each intermediate state. |
| [ ] | S2-05.04 | V | Reload each interrupted fixture | Exactly one cell authority and one accepted edit outcome remain. |

<a id="s2-06"></a>

### S2-06 — Small typed tech graph with unlock validation and unsupported-cycle detection

**Depends on:** [S1-12](#s1-12); stage entry applies.  
**Parent done when:** Gameplay prerequisite graph works; biological relation labels remain distinct; regulator feedback is not rejected as an unlock cycle.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-06.01 | D | Select a small progression example and acquisition rules | Prerequisite, homology/shared machinery and gameplay edges are typed separately. |
| [ ] | S2-06.02 | I | Implement graph definition and dependency validation | Missing IDs and impossible unlock cycles are reported. |
| [ ] | S2-06.03 | I | Add the minimal tech-graph view | Locked entries explain prerequisites and unlock costs. |
| [ ] | S2-06.04 | I | Route unlock requests through the existing ledger | Unlock and construct installation remain separate transactions. |
| [ ] | S2-06.05 | V | Verify graph labels against the fidelity ledger | Biological claims are sourced or marked as game abstractions; regulator feedback is not confused with progression cycles. |

<a id="s2-07"></a>

### S2-07 — One tradeoff upgrade and one permanent improvement, including save/load and cost preview

**Depends on:** [S2-02](#s2-02), [S2-06](#s2-06); stage entry applies.  
**Parent done when:** Both confirmed classes work; performance-per-unit and expression level remain distinct; limits/persistence policy explicit.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-07.01 | D | Specify one tradeoff and one permanent upgrade | Parameter bounds, stacking, ownership, reversibility and extinction retention are explicit. |
| [ ] | S2-07.02 | I | Implement per-unit functional parameter upgrades | Increased efficiency is separate from increased expression level. |
| [ ] | S2-07.03 | I | Add price and phenotype-difference previews | Any metabolic penalty is visible; the permanent upgrade has no invented hidden tradeoff. |
| [ ] | S2-07.04 | I | Persist the chosen upgrade identity and scope | Reload retains exactly the purchased improvement. |
| [ ] | S2-07.05 | V | Exercise repeated purchase, cap and restart cases | Both upgrade classes follow the selected economy and persistence policy. |

<a id="s2-08"></a>

### S2-08 — Economy exploit scenarios: rapid division/death, small cells, duplicate purchase, slot deletion/reuse

**Depends on:** [S2-06](#s2-06)–[S2-07](#s2-07); stage entry applies.  
**Parent done when:** Compare points/time and points/resource; no transaction duplication; gameplay exploits become balance decisions with evidence.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-08.01 | V | Replay duplicate reward, capacity and unlock transactions | Each accepted economic operation affects state once. |
| [ ] | S2-08.02 | E | Compare rapid division/death and ordinary growth | Points per time and per limiting resource reveal farming incentives. |
| [ ] | S2-08.03 | E | Compare size variants if size editing is supported | Reward efficiency and resource accounting are reported; otherwise the branch is explicitly not applicable. |
| [ ] | S2-08.04 | V | Delete, silence and recreate shared-promoter genes | Slot reuse and charges match R05 without recovering extra capacity. |
| [ ] | S2-08.05 | D | Record balance exploits separately from transaction defects | Each identified exploit has a selected fix or an explicit design decision. |

<a id="s2-09"></a>

### S2-09 — Local withdrawal/archive and reduced-return fixture using selected temporary C03/C04 rules

**Depends on:** [S2-02](#s2-02), [S2-05](#s2-05); stage entry applies.  
**Parent done when:** Remainder and matching rules visible; one-cell/no-match cases explicit; archive and active population cannot both own the same cells.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-09.01 | D | Select temporary logout/storage, attrition and return rules | One-cell, no-match, reserve preservation and stored-revision cases are explicitly resolved. |
| [ ] | S2-09.02 | I | Capture the selected habitat signature and population archive | Identity, count, versions and relevant physiology remain reconstructible. |
| [ ] | S2-09.03 | I | Commit withdrawal and world-resource export | Archived cells no longer occupy, consume, secrete, divide or earn stored rewards. |
| [ ] | S2-09.04 | I | Find eligible return sites using the selected similarity rule | Geometry, capacity and declared environmental tolerances are checked. |
| [ ] | S2-09.05 | I | Commit reduced return and consume the archive once | Failed placement does not repeat attrition or create an active duplicate. |
| [ ] | S2-09.06 | V | Save/reload and repeat withdrawal/return requests | Active-or-stored ownership, resource flux and pending edits remain consistent. |

<a id="s2-10"></a>

### S2-10 — Representative local benchmark ladder with gene diversity, crowding and pending-edit bursts

**Depends on:** [S2-05](#s2-05), [S2-08](#s2-08); stage entry applies.  
**Parent done when:** Record CPU/memory/subsystem costs on named hardware; no population capacity claim from an empty loop.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-10.01 | E | Define the benchmark ladder and measurement metadata | Hardware, build, content, seeds, workload and observation duration are recorded. |
| [ ] | S2-10.02 | I | Generate crowded and diverse-genome workloads | Gene evaluation, contacts and fields are exercised rather than an empty cell loop. |
| [ ] | S2-10.03 | I | Generate synchronized birth/edit bursts | Instrumentation captures their peak cost and queue behavior. |
| [ ] | S2-10.04 | E | Run headless and graphical measurements separately | Tick percentiles, frame cost, memory and allocations are attributable. |
| [ ] | S2-10.05 | D | Identify the measured limiting subsystem | The next optimization has a concrete target and preserved reference fixture. |

<a id="s2-11"></a>

### S2-11 — Targeted optimization of the measured bottleneck, preserving the reference behavior

**Depends on:** [S2-10](#s2-10); stage entry applies.  
**Parent done when:** Before/after profile and outcome comparison; introduce Jobs/Burst/data changes only where useful.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-11.01 | E | Profile the selected bottleneck in a release-equivalent build | The expensive code path and workload are identified. |
| [ ] | S2-11.02 | I | Implement one justified optimization | Data layout, batching, spatial queries or Jobs/Burst is chosen for measured need. |
| [ ] | S2-11.03 | V | Compare behavior with the reference implementation | Resource, event and ecological outcomes remain within declared tolerances. |
| [ ] | S2-11.04 | E | Repeat the same benchmark | Improvement and regression costs are measured; unhelpful complexity is reverted. |

<a id="s2-12"></a>

### S2-12 — G2 review: economy, restart, save/load, two-client and boundary evidence

**Depends on:** [S2-01](#s2-01)–[S2-11](#s2-11); stage entry applies.  
**Parent done when:** Record architecture risks, failed fixtures and next scope; do not mistake small-scale success for vast-world certification.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S2-12.01 | V | Assemble G2 transaction, persistence and authority evidence | Required local economy and service-spike scenarios have reproducible results. |
| [ ] | S2-12.02 | D | Review unresolved structural decisions | Region, storage and genome ownership risks have owners and next experiments. |
| [ ] | S2-12.03 | D | Record pass or a small repair sequence | Small-scale success is not described as certified release capacity. |

<a id="stage-3"></a>

## Stage 3 — Environment and interacting species

**Entry:** G2.  
**G3:** Resource flows explain niche-dependent success, beneficial interactions and all confirmed hostile mechanism families. Conservation and causal diagnostics work.

<a id="s3-01"></a>

### S3-01 — General field transport interfaces with diffusion/advection/decay and conservative uptake

**Depends on:** G2; stage entry applies.  
**Parent done when:** Source/sink budgets and solver-specific stability/convergence checks pass for the selected scheme.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-01.01 | D | Specify field units, transport scheme and boundary rules | Diffusion/advection stability constraints and acceptable conservation error are stated. |
| [ ] | S3-01.02 | I | Implement diffusion for one reference channel | A known profile evolves according to the selected reference solution. |
| [ ] | S3-01.03 | I | Implement advection and decay | Flow transports material and decay removes the declared amount. |
| [ ] | S3-01.04 | I | Batch secretion and competitive uptake | Multiple cells cannot consume the same available material. |
| [ ] | S3-01.05 | V | Halve timestep and refine grid on reference fixtures | Convergence and conservation are measured; clipping does not conceal an unstable solver. |

<a id="s3-02"></a>

### S3-02 — Flow, occlusion, surfaces and microcave transport/retention fixture

**Depends on:** [S3-01](#s3-01); stage entry applies.  
**Parent done when:** Cave differs mechanistically from open water; autonomous cells can enter/remain/leave through implemented behaviors.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-02.01 | I | Implement the selected current field and wall handling | Flow and transport respect the habitat geometry. |
| [ ] | S3-02.02 | I | Add light occlusion to the cave fixture | Shadowed samples differ for an explainable geometric reason. |
| [ ] | S3-02.03 | I | Implement selected attachment/detachment behavior | Surface occupancy, cost and release follow genetic functionality. |
| [ ] | S3-02.04 | I | Author open-flow and microcave niche contracts | Source/sink, entry, retention and failure conditions are explicit. |
| [ ] | S3-02.05 | V | Observe autonomous entry, residence and exit | Genetic strategies can exploit the niche without destination clicks. |

<a id="s3-03"></a>

### S3-03 — Temperature field and associated physiological response/adaptation

**Depends on:** [S3-01](#s3-01); stage entry applies.  
**Parent done when:** Changed temperature changes a stated growth/stress cost; tolerance tradeoff and diagnostic cause visible.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-03.01 | D | Select temperature-response and adaptation parameters | Growth optimum, stress range and associated costs are recorded. |
| [ ] | S3-03.02 | I | Add the temperature field and receptor input | Regulation receives temperature only through the selected sensing machinery. |
| [ ] | S3-03.03 | I | Apply direct temperature effects and selected protection | Environmental harm can occur without a receptor; sensing is required for the regulated response. |
| [ ] | S3-03.04 | V | Compare baseline and adapted cells across temperatures | Growth/stress differences and protection costs are visible in diagnostics. |

<a id="s3-04"></a>

### S3-04 — Salinity field, sensing and selected osmotic-stress abstraction

**Depends on:** [S3-01](#s3-01), [S1-08](#s1-08); stage entry applies.  
**Parent done when:** Missing sensor does not supply measurements; tolerance/upkeep affects survival as specified.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-04.01 | D | Specify the salinity/osmotic-stress abstraction | Field units, tolerance response and homeostasis cost are explicit. |
| [ ] | S3-04.02 | I | Add salinity field sampling and receptor routing | Missing sensors do not supply controller inputs. |
| [ ] | S3-04.03 | I | Implement osmotic stress and selected protection | Direct physiological exposure and sensed regulatory response remain separate. |
| [ ] | S3-04.04 | V | Run low, tolerated and high-salinity fixtures | Survival and upkeep follow the chosen model and have an identifiable cause. |

<a id="s3-05"></a>

### S3-05 — pH/acidity representation, sensing and homeostasis response

**Depends on:** [S3-01](#s3-01), [S1-08](#s1-08); stage entry applies.  
**Parent done when:** Model labels units/abstraction correctly; mixing and stress behavior match the chosen representation.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-05.01 | D | Choose buffered acidity proxy or restricted chemistry | The label, units, mixing rule and simplifications are recorded. |
| [ ] | S3-05.02 | I | Implement acidity transport/mixing under that representation | A concentration model never averages pH values directly as concentrations. |
| [ ] | S3-05.03 | I | Add sensing and homeostatic response | Receptor gating, protection and energy demand are separately observable. |
| [ ] | S3-05.04 | V | Mix contrasting regions and compare adapted cells | Field values and physiological outcomes follow the selected abstraction. |

<a id="s3-06"></a>

### S3-06 — Light-linked sensing/energy fixture with carbon/resource requirements kept explicit

**Depends on:** [S3-02](#s3-02), [S1-05](#s1-05); stage entry applies.  
**Parent done when:** Light influences chosen functions; energy capture alone cannot create unlimited biomass.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-06.01 | D | Specify the selected light-energy pathway and material requirements | Energy capture, carbon supply and any reducing-equivalent abstraction are distinct. |
| [ ] | S3-06.02 | I | Connect functional light machinery to energy production | Output depends on local illumination and machinery abundance. |
| [ ] | S3-06.03 | I | Apply selected exposure costs or limitations | Shading and supported photodamage/maintenance effects have declared rules. |
| [ ] | S3-06.04 | V | Compare light/dark and carbon-present/absent fixtures | Capturing light alone cannot create unlimited biomass. |

<a id="s3-07"></a>

### S3-07 — Species signals and secretion channels with bounded identities/ranges

**Depends on:** [S3-01](#s3-01), [S1-08](#s1-08); stage entry applies.  
**Parent done when:** Signal source, transport, decay and receptor specificity visible; no unbounded field allocation per player tag.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-07.01 | D | Define the bounded signal/chemical catalog and receptor specificity | Player tags cannot allocate unlimited independent environmental grids. |
| [ ] | S3-07.02 | I | Implement secretion with material/energy cost | Emitted quantities enter the field ledger and leave the declared cell pools. |
| [ ] | S3-07.03 | I | Route transported signals to compatible receptors | Nonmatching receptors do not receive equivalent sensing for free. |
| [ ] | S3-07.04 | I | Add signal-source, concentration and decay diagnostics | Producer and recipient can explain exposure under the information policy. |
| [ ] | S3-07.05 | V | Change flow and receptor specificity in a signal fixture | Response follows transport, compatibility and functional receptor abundance. |

<a id="s3-08"></a>

### S3-08 — Resource-mediated mutualism, commensal benefit and public-goods exploitation scenarios

**Depends on:** [S3-02](#s3-02), [S3-07](#s3-07); stage entry applies.  
**Parent done when:** Costs and flows explain relationships; changing mixing/retention changes outcomes across multiple seeds.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-08.01 | I | Author a reciprocal-resource mutualism fixture | Each partner's benefit follows a measurable material flow. |
| [ ] | S3-08.02 | I | Author a byproduct-beneficiary fixture | The beneficiary gains without an unconditional relationship modifier. |
| [ ] | S3-08.03 | I | Add an exploiter to a public-goods fixture | Production cost and access to the shared benefit remain explicit. |
| [ ] | S3-08.04 | E | Compare low and high mixing across several seeds | A07 records resource use and relative outcomes, including failed cooperation. |

<a id="s3-09"></a>

### S3-09 — Predation capture/digestion and nutrient transfer

**Depends on:** [S3-02](#s3-02), [S1-07](#s1-07); stage entry applies.  
**Parent done when:** Eligibility/counterplay defined; transferred matter follows costs/losses; contact failure is explained.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-09.01 | D | Specify prey eligibility, capture, digestion and counterplay | The biological abstraction and resource-transfer losses are recorded. |
| [ ] | S3-09.02 | I | Implement autonomous contact/capture progression | Failed eligibility or broken contact produces an explicit outcome. |
| [ ] | S3-09.03 | I | Implement killing/digestion and resource transfer | Available prey matter is transferred once with the declared losses. |
| [ ] | S3-09.04 | I | Add the selected escape or surface-defense behavior | Defense changes a measurable part of the capture mechanism. |
| [ ] | S3-09.05 | V | Interrupt attacks and contest the same prey | Multiple predators cannot duplicate the prey's resources or death event. |

<a id="s3-10"></a>

### S3-10 — Toxic secretions, dose-response, tolerance and selected defense

**Depends on:** [S3-07](#s3-07); stage entry applies.  
**Parent done when:** Local accumulation and exposure explain harm; producer tolerance and newcomer failure modes tested.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-10.01 | D | Specify toxin concentration, exposure response and defenses | Producer tolerance, saturation and recovery are explicit. |
| [ ] | S3-10.02 | I | Couple toxin secretion to transport and cost | The field retains the existing accounting and channel limits. |
| [ ] | S3-10.03 | I | Accumulate exposure and apply physiological effects | Damage or inhibition follows local dose under the chosen model. |
| [ ] | S3-10.04 | I | Implement one selected resistance/detoxification response | Its protection and cost are visible. |
| [ ] | S3-10.05 | V | Test accumulation, self-exposure and newcomer entry | Harm is explainable and extreme concentrations remain numerically bounded. |

<a id="s3-11"></a>

### S3-11 — Local injection interaction and payload-state model for effectors or genetic cargo

**Depends on:** [S3-07](#s3-07), [S1-09](#s1-09); stage entry applies.  
**Parent done when:** Delivery eligibility/contact/cost explicit; tag-compatible cargo cannot act before entry/functional expression rules allow it.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-11.01 | D | Specify delivery, payload scope and acquisition/merge policy | Effector action and genetic cargo are distinct; local infection does not imply global rewriting. |
| [ ] | S3-11.02 | I | Implement injection eligibility and contact duration | Compatible apparatus and target conditions are required. |
| [ ] | S3-11.03 | I | Apply a non-genetic payload and its recovery rule | Entry, effect, cost and removal have observable states. |
| [ ] | S3-11.04 | I | Represent local genetic cargo with validated expression prerequisites | A transferred regulator cannot act before entry and functional expression. |
| [ ] | S3-11.05 | I | Add selected entry/payload defense | Resistance affects the declared mechanism rather than silently blocking all hostility. |
| [ ] | S3-11.06 | V | Interrupt injection during death, division and edit activation | Payload scope and event ordering have one documented outcome. |

<a id="s3-12"></a>

### S3-12 — Competing ecological strategies and disturbance/recovery fixtures

**Depends on:** [S3-03](#s3-03)–[S3-11](#s3-11); stage entry applies.  
**Parent done when:** No single ranking is assumed; record invasion, extinction, occupancy and resource use across seeded contexts.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-12.01 | E | Define strategy/context scenarios and seed sets | Motile, attached, tolerant and interacting designs face contrasting niches. |
| [ ] | S3-12.02 | E | Measure occupancy, invasion, division and extinction | Results include variation rather than only a favorable run. |
| [ ] | S3-12.03 | E | Run resource depletion and disturbance recovery | Collapse or recovery is attributable to the modeled flows. |
| [ ] | S3-12.04 | E | Compare observed and unobserved equivalent populations | A14 shows no competitive advantage from camera attention. |
| [ ] | S3-12.05 | D | Identify dominant strategies and redundant mechanisms | Follow-up changes target a measured ecological issue. |

<a id="s3-13"></a>

### S3-13 — Content/fidelity notes and causal UI coverage for each new field/interaction

**Depends on:** [S3-12](#s3-12); stage entry applies.  
**Parent done when:** Each capability has meaningful cost, observable state, scientific abstraction and test scenario.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-13.01 | I | Complete fidelity records for each implemented field and interaction | Mechanism, simplification and source/confidence are named. |
| [ ] | S3-13.02 | I | Add missing local-map and death-history explanations | Each new stressor/attack can be distinguished from starvation. |
| [ ] | S3-13.03 | I | Add authorable costs, bounds and scenario references to content | New modules require no hidden per-instance defaults. |
| [ ] | S3-13.04 | V | Audit each implemented ecological capability end to end | Data, function, cost, diagnosis and validation all exist. |

<a id="s3-14"></a>

### S3-14 — G3 review and decide which ecological mechanisms are ready for the slice

**Depends on:** [S3-13](#s3-13); stage entry applies.  
**Parent done when:** Explain robust interactions and known collapse modes; prune redundant implementation without silently dropping confirmed requirements.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S3-14.01 | E | Assemble G3 evidence for beneficial and hostile interactions | Mutualism/commensalism, predation, toxins and injection have reproducible demonstrations. |
| [ ] | S3-14.02 | D | Select the slice's ecological vocabulary | Omitted optional mechanisms are explicit; confirmed requirements are retained or require an owner scope decision. |
| [ ] | S3-14.03 | D | Record collapse risks and the next repair or integration task | G3 passes only with explained accounting and context-dependent outcomes. |

<a id="stage-4"></a>

## Stage 4 — Visual and interface production

**Entry:** G1; use Stage 3 scene inputs when available.  
**G4:** The owner-selected style is attractive and readable in motion, density and overlays, with measured production effort and performance.

<a id="s4-01"></a>

### S4-01 — Visual reference breakdown and equivalent moving-scene brief

**Depends on:** G1; stage entry applies.  
**Parent done when:** Palette, geometry, pixel treatment, depth, camera and readability variables separated; reference is not an engine mandate.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-01.01 | D | Break the visual reference into controllable variables | Geometry, texture resolution, render resolution, palette, dithering, depth and lighting are specified separately. |
| [ ] | S4-01.02 | D | Select two plausible pipelines to compare | Unity URP/3D is a candidate, not an automatically approved art direction. |
| [ ] | S4-01.03 | I | Define a shared moving-scene brief | Both candidates use equivalent cells, cave, light, camera actions, density and overlays. |
| [ ] | S4-01.04 | D | Choose comparison hardware and viewing conditions | Readability, frame time and asset-authoring effort have recorded evaluation criteria. |

<a id="s4-02"></a>

### S4-02 — First candidate rendering pipeline with cells, appendages, cave and light

**Depends on:** [S4-01](#s4-01); stage entry applies.  
**Parent done when:** Normal movement/zoom/rotation and a crowded scene captured on named hardware.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-02.01 | I | Assemble candidate A's cells and habitat | Shared silhouettes and cave/light geometry are represented. |
| [ ] | S4-02.02 | I | Add its material, pixel treatment and depth cues | The candidate's intended style is visible at normal gameplay scale. |
| [ ] | S4-02.03 | I | Animate appendage, division and death samples | Motion and state changes can be compared with the alternative. |
| [ ] | S4-02.04 | E | Capture sparse and crowded motion sequences | Pan, zoom, rotation, overlays and CPU/GPU measurements accompany the capture. |

<a id="s4-03"></a>

### S4-03 — Strongest alternative pipeline using the same content/actions

**Depends on:** [S4-01](#s4-01); stage entry applies.  
**Parent done when:** Comparable captures and asset-authoring time; no conclusion from unmatched still images.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-03.01 | I | Assemble candidate B from the same scene brief | Content and viewing scale are comparable to candidate A. |
| [ ] | S4-03.02 | I | Add the alternative material/depth treatment | Differences isolate the pipeline rather than unrelated art quality. |
| [ ] | S4-03.03 | I | Implement the same animation samples | Appendage, division and death have equivalent meaning. |
| [ ] | S4-03.04 | E | Capture the same sequences and author one extra cell feature | Visual comparison and incremental production time are available for both candidates. |

<a id="s4-04"></a>

### S4-04 — Camera, foreground/background depth and selection readability comparison

**Depends on:** [S4-02](#s4-02)–[S4-03](#s4-03); stage entry applies.  
**Parent done when:** XY contacts remain legible; depth of field/occlusion do not conceal required gameplay information.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-04.01 | E | Compare candidate camera projections in motion | Contact, wall clearance and XY placement remain understandable. |
| [ ] | S4-04.02 | E | Test thin appendages, overlap and pixel shimmer | Problem cases are recorded at intended zoom/resolution. |
| [ ] | S4-04.03 | E | Test blur, fog and foreground/background separation | Optional depth effects do not hide required state or suggest accessible Z movement. |
| [ ] | S4-04.04 | I | Refine selection outlines and depth cues | The selected cell remains identifiable in crowded cave entrances. |
| [ ] | S4-04.05 | D | Record the preferred camera/pipeline candidate and remaining evidence | Final selection waits for the production/readability checks in G4. |

<a id="s4-05"></a>

### S4-05 — Species silhouettes, expression/assembly/death/division visual states

**Depends on:** [S4-04](#s4-04); stage entry applies.  
**Parent done when:** State changes understandable without giving every molecule a separately rendered object.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-05.01 | I | Define reusable species silhouette parameters | Species can differ visibly without bespoke models for every genome. |
| [ ] | S4-05.02 | I | Add product abundance and assembly-state visual rules | Visuals distinguish functional apparatus from pending synthesis. |
| [ ] | S4-05.03 | I | Implement division and lysis transitions | Animation follows authoritative events without inventing extra lifecycle changes. |
| [ ] | S4-05.04 | I | Add appendage placement and orientation rendering | Visible structures match the local-map reference frame. |
| [ ] | S4-05.05 | V | Review each visual state at ordinary and crowded density | Critical differences remain readable without rendering individual molecules. |

<a id="s4-06"></a>

### S4-06 — Gene editor/cell map visual pass, scalable text, non-color encoding and input navigation

**Depends on:** [S4-05](#s4-05), [S1-20](#s1-20); stage entry applies.  
**Parent done when:** Complex conditions and shared targets remain inspectable at supported resolution candidates.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-06.01 | I | Apply a consistent visual hierarchy to editor and cell map | Cost, delay, live state and draft state are easy to distinguish. |
| [ ] | S4-06.02 | I | Add scalable text and responsive panel sizing | Long gene names and nested conditions remain usable at candidate minimum resolution. |
| [ ] | S4-06.03 | I | Add non-color state/species/hazard encodings | Icons, patterns or labels preserve distinctions without color alone. |
| [ ] | S4-06.04 | I | Implement keyboard focus and selected navigation controls | Main editor actions are reachable and focus is visible. |
| [ ] | S4-06.05 | V | Edit a complex shared-tag circuit while observing a crowded scene | Important diagnostics stay readable and controls do not obstruct necessary observation. |

<a id="s4-07"></a>

### S4-07 — Minimal ambient/event audio and options, with population-level event aggregation

**Depends on:** [S4-06](#s4-06); stage entry applies.  
**Parent done when:** Important cues have visual equivalents; crowd size does not create uncontrolled audio spam.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-07.01 | I | Add a minimal ambient and interface/event sound set | Important events have distinguishable cues with documented asset provenance. |
| [ ] | S4-07.02 | I | Aggregate and rate-limit population sounds | Many simultaneous births or deaths do not create uncontrolled audio spam. |
| [ ] | S4-07.03 | I | Add independent volume controls | Music, ambience, interface and events can be adjusted and retained. |
| [ ] | S4-07.04 | I | Add visual equivalents and motion/blur options | Critical information survives muted audio and reduced visual effects. |
| [ ] | S4-07.05 | V | Run the crowded event fixture with accessibility settings | The game remains understandable and the audio budget stays bounded. |

<a id="s4-08"></a>

### S4-08 — G4 selection, art bible, asset provenance and repeatable authoring recipe

**Depends on:** [S4-02](#s4-02)–[S4-07](#s4-07); stage entry applies.  
**Parent done when:** Owner selects pipeline; incremental module art cost and frame-time evidence support the choice.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S4-08.01 | D | Review G4 and record the owner's pipeline/camera selection | Choice is backed by motion, readability, performance and authoring evidence. |
| [ ] | S4-08.02 | I | Write the compact art bible | Palette, silhouettes, materials, appendage thickness, icons, effects and background contrast have examples. |
| [ ] | S4-08.03 | I | Document the asset-production recipe and license ledger | A new module can follow a repeatable workflow with attributable sources. |
| [ ] | S4-08.04 | V | Produce one additional feature using only that recipe | Authoring time and integration steps support solo production feasibility. |

<a id="stage-5"></a>

## Stage 5 — Integrated local multiplayer

**Entry:** G2 and G3; final art is not needed for backend work.  
**G5:** Multiple players interact, edit, transfer genes and depart/return under network faults without unauthorized changes, duplication or developer repair.

<a id="s5-01"></a>

### S5-01 — Session identity/admission and server-owned player/species mapping

**Depends on:** G2–G3; stage entry applies.  
**Parent done when:** Distinct clients own distinct named species; spoofed ownership rejected; prototype and production identities separated.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-01.01 | D | Define session identity, admission and trusted-server boundaries | Prototype identities and eventual production authentication are explicitly distinguished. |
| [ ] | S5-01.02 | I | Bind each connection to a server-owned player identity | Claimed payload ownership cannot impersonate another session. |
| [ ] | S5-01.03 | I | Associate persistent named species with their owner | Reconnect resolves the existing species rather than creating a duplicate. |
| [ ] | S5-01.04 | I | Validate names, protocol versions and admission limits | Invalid names or incompatible clients receive structured responses. |
| [ ] | S5-01.05 | V | Attempt foreign edits and concurrent identity reuse | Ownership and the selected session policy hold across both clients. |

<a id="s5-02"></a>

### S5-02 — Authoritative replication baseline and state/event protocol versions

**Depends on:** [S5-01](#s5-01); stage entry applies.  
**Parent done when:** Late join gets a consistent snapshot plus subsequent changes; events are not lost between baseline and live stream.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-02.01 | I | Define versioned snapshot, delta and durable-event envelopes | Sequence/time and entity/revision references are explicit. |
| [ ] | S5-02.02 | I | Produce a consistent late-join baseline | Snapshot state and subsequent changes share a gap-free handoff boundary. |
| [ ] | S5-02.03 | I | Apply state updates in the client replica | Removed cells, revisions and out-of-order data resolve correctly. |
| [ ] | S5-02.04 | I | Interpolate graphical movement from authoritative samples | Rendering smoothness never changes server physiology or contact outcomes. |
| [ ] | S5-02.05 | I | Implement resynchronization after a detected gap | The client can request a fresh baseline without duplicating durable events. |
| [ ] | S5-02.06 | V | Join during births and edit activation | Both clients converge on the same authoritative state. |

<a id="s5-03"></a>

### S5-03 — Nearby relevance and remote owned-population summaries

**Depends on:** [S5-02](#s5-02); stage entry applies.  
**Parent done when:** Bandwidth measured; offscreen ecology unchanged; camera does not bypass chosen information rules.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-03.01 | D | Specify relevance and information-disclosure rules | Nearby detail and remote owned-population summaries have explicit limits. |
| [ ] | S5-03.02 | I | Filter detailed replication by relevance | Unneeded cells do not consume the full-detail update budget. |
| [ ] | S5-03.03 | I | Produce remote owned-population summaries | Summary age and region availability remain distinguishable from extinction. |
| [ ] | S5-03.04 | I | Rebuild subscriptions on camera/focal changes | Switching views cannot reveal information forbidden by the chosen policy. |
| [ ] | S5-03.05 | E | Measure bandwidth while changing view and density | Client payload costs are reported separately from simulation work. |

<a id="s5-04"></a>

### S5-04 — Reliable edit/slot/unlock transactions across real transport

**Depends on:** [S5-02](#s5-02); stage entry applies.  
**Parent done when:** Parallel maturation, charges and conflicts match local behavior despite retransmit/reconnect.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-04.01 | I | Carry request IDs and original results across reconnect | Retried edit, slot and unlock commands cannot charge twice. |
| [ ] | S5-04.02 | I | Persist authoritative pending-operation outcomes | An acknowledged operation remains recoverable after connection loss. |
| [ ] | S5-04.03 | I | Publish maturation, cancellation and conflict events | Client timers/status converge to the host's result. |
| [ ] | S5-04.04 | V | Submit simultaneous spending and over-cap edits from two clients | Funds and editing slots remain authoritative. |
| [ ] | S5-04.05 | V | Drop acknowledgments and resend accepted requests | The same economic/genome outcome is returned without duplicate effects. |

<a id="s5-05"></a>

### S5-05 — Networked cell map and causal histories with bounded sample rates

**Depends on:** [S5-03](#s5-03)–[S5-04](#s5-04); stage entry applies.  
**Parent done when:** Correct cell/revision, explicit staleness, responsive drafts; diagnostics do not flood all clients.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-05.01 | I | Add a bounded selected-cell diagnostic subscription | The server streams authorized local detail only for the requested scope. |
| [ ] | S5-05.02 | I | Attach sample time, cell ID and genome revision to map data | Stale or mismatched samples are identifiable. |
| [ ] | S5-05.03 | I | Transmit bounded causal-history updates | Repeated requests do not create unbounded server work or client memory. |
| [ ] | S5-05.04 | I | Show pending acknowledgment and stale-sample states | Local drafts remain responsive without pretending to be authoritative. |
| [ ] | S5-05.05 | V | Switch focal cells under latency and packet loss | Map values never merge samples from different cells or revisions. |

<a id="s5-06"></a>

### S5-06 — Networked beneficial, predatory, toxic and injection interactions

**Depends on:** [S5-03](#s5-03), [S3-08](#s3-08)–[S3-11](#s3-11); stage entry applies.  
**Parent done when:** Clients agree on contacts/exposure/outcomes; exploit attempts cannot claim remote attacks.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-06.01 | I | Replicate resource-mediated benefits and relevant consequences | Both clients observe the same authoritative interaction outcomes. |
| [ ] | S5-06.02 | I | Replicate capture, prey death and digestion events | Resource transfer and lifecycle are not recomputed independently by clients. |
| [ ] | S5-06.03 | I | Replicate toxin exposure and injection state | Player diagnostics explain authoritative cause and counterplay. |
| [ ] | S5-06.04 | V | Attempt remote attacks or client-invented contact | The host rejects interactions unsupported by simulation geometry and machinery. |
| [ ] | S5-06.05 | V | Observe each hostile family from both clients | Outcomes, attribution and resulting resources agree. |

<a id="s5-07"></a>

### S5-07 — One selected HGT route, payload validation and species/local-cassette merge policy

**Depends on:** [S5-04](#s5-04), [S5-06](#s5-06); stage entry applies.  
**Parent done when:** Accepted/rejected/interrupted transfers work; a local infection does not silently rewrite the species; A08 passes.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-07.01 | D | Select one HGT route and payload granularity | Consent/acceptance, compatibility, costs, inheritance and progression access are explicit. |
| [ ] | S5-07.02 | D | Specify reconciliation with whole-species edits | Acquired local DNA, species backbone and unlock knowledge have distinct behavior. |
| [ ] | S5-07.03 | I | Validate payload content, size, dependencies and regulatory complexity | Unsupported or executable payloads cannot enter the simulation. |
| [ ] | S5-07.04 | I | Implement eligibility, duration and interruption for the route | Contact/entry requirements and costs match the chosen mechanism. |
| [ ] | S5-07.05 | I | Commit acquisition and donor/recipient attribution once | Unique transfer ID identifies the resulting genetic state. |
| [ ] | S5-07.06 | I | Explain acquired DNA versus expressed functionality | The recipient can inspect burden, prerequisites, local scope and removal options. |
| [ ] | S5-07.07 | V | Run accepted, rejected, interrupted and repeated transfers | A08 preserves ownership, cost and inheritance without duplicating cargo. |

<a id="s5-08"></a>

### S5-08 — Transferred tagged-regulator scenario and duplicate/incompatible payload handling

**Depends on:** [S5-07](#s5-07); stage entry applies.  
**Parent done when:** Recipient-compatible tags behave correctly; shared targets/defenses/costs visible; no arbitrary executable payload.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-08.01 | I | Build a donor/recipient tagged-regulator fixture | Recipient matching, nonmatching and shared targets are known beforehand. |
| [ ] | S5-08.02 | V | Transfer the regulator and observe expression-dependent action | Matching tags alone do not bypass entry or expression requirements. |
| [ ] | S5-08.03 | V | Transfer duplicate and incompatible cassettes | Insertion, rejection or replacement follows the selected policy and capacity rules. |
| [ ] | S5-08.04 | V | Delete/rename targets and mature a simultaneous operator edit | Functional tags and conflict handling remain consistent. |
| [ ] | S5-08.05 | E | Cycle transfers between cooperating alternate identities | Costs, progression access and burden reveal exploit or homogenization risks. |

<a id="s5-09"></a>

### S5-09 — Selected logout/disconnect policy, archival ownership and return transaction

**Depends on:** [S5-04](#s5-04), [S2-09](#s2-09); stage entry applies.  
**Parent done when:** Exactly one active-or-stored outcome after failures; no repeated attrition; active offline branch tested only if retained.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-09.01 | D | Finalize disconnect, withdrawal and return policy for multiplayer | Grace period, eligibility, attrition point, active-absence branch and no-match behavior are explicit. |
| [ ] | S5-09.02 | I | Drive archival transactions from authoritative session/lifecycle events | Connection loss follows the selected rule rather than client-reported state. |
| [ ] | S5-09.03 | I | Reserve and activate a qualifying return location | Two clients cannot consume one archive or duplicate a return reservation. |
| [ ] | S5-09.04 | I | Reconcile stored genomes and pending edits on return | Local cargo, upgrade and species-revision rules are preserved. |
| [ ] | S5-09.05 | I | Display active, withdrawal-pending, stored and returning states | Players can distinguish departure from death and see applicable loss. |
| [ ] | S5-09.06 | V | Restart at every archive/return transaction boundary | Exactly one valid population state remains and attrition is applied once. |
| [ ] | S5-09.07 | V | Verify the selected absent-owner behavior | Active-offline rewards are tested only if that branch is retained; withdrawn cells do no ecological work. |

<a id="s5-10"></a>

### S5-10 — Network-fault and simultaneous-action test set

**Depends on:** [S5-05](#s5-05)–[S5-09](#s5-09); stage entry applies.  
**Parent done when:** Packet delay/loss, restart, edit+birth+HGT+withdrawal races have documented outcomes; no duplication/lost accepted edits.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-10.01 | I | Add reproducible delay/loss/disconnect profiles to the test harness | Network faults can be applied without changing game rules. |
| [ ] | S5-10.02 | V | Run birth + edit maturation + HGT in the same logical interval | Event ordering and charges match the declared contract. |
| [ ] | S5-10.03 | V | Run attack + withdrawal + reconnect at each transaction boundary | No duplicated population, resource refund or hidden escape policy appears. |
| [ ] | S5-10.04 | V | Run focal death while diagnostic and edit acknowledgments arrive | UI identity and species-scoped drafts remain correct. |
| [ ] | S5-10.05 | V | Queue repeated opposing localization edits | Record whether the chosen delay/assembly policy still permits steering-like control. |
| [ ] | S5-10.06 | V | Reject malformed, oversized and high-rate requests | Validation work is bounded and legitimate simulation remains responsive. |

<a id="s5-11"></a>

### S5-11 — Minimal operator controls, structured errors, admission limits and version display

**Depends on:** [S5-10](#s5-10); stage entry applies.  
**Parent done when:** Operator can identify/reproduce failure and safely stop/restart host; destructive debug powers not exposed to players.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-11.01 | I | Add operator-only population, tick, memory and version diagnostics | Operators can identify the affected build, world and workload. |
| [ ] | S5-11.02 | I | Add structured transaction/error lookup by request ID | A failed player operation can be traced without exposing secrets. |
| [ ] | S5-11.03 | I | Add safe admission stop and graceful shutdown | Accepted durable work resolves under the chosen shutdown policy. |
| [ ] | S5-11.04 | I | Protect and audit administrative mutations | Ordinary sessions cannot invoke operator powers. |
| [ ] | S5-11.05 | V | Diagnose and recover one injected failure using the tools | The host can restart into consistent state without manual database repair. |

<a id="s5-12"></a>

### S5-12 — G5 multi-user session review

**Depends on:** [S5-01](#s5-01)–[S5-11](#s5-11); stage entry applies.  
**Parent done when:** Meaningful interspecies interaction and live editing work without developer repair.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S5-12.01 | E | Run a multi-user local session with distinct species | Participants edit, divide and create meaningful ecological interactions. |
| [ ] | S5-12.02 | E | Include HGT, departure and return in the session | These work through normal controls under the selected rules. |
| [ ] | S5-12.03 | V | Collect fault-suite and session evidence for G5 | Accepted genetic/economic changes remain consistent without developer rescue. |
| [ ] | S5-12.04 | D | Record the gate result and focused fixes | Unresolved authority or duplication failures block wider testing. |

<a id="stage-6"></a>

## Stage 6 — Playable vertical slice

**Entry:** G3, G4 and G5.  
**G6:** An unfamiliar player can understand, optimize, interact, lose cells and return through a coherent session. The current game provides value without promised future additions.

<a id="s6-01"></a>

### S6-01 — Guided first run covering observation, cost, delay, compound regulation and the map

**Depends on:** G3–G5; stage entry applies.  
**Parent done when:** New player reaches an informed first edit; no assumption of microbiology expertise.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S6-01.01 | I | Create the first observation and survival tutorial step | A newcomer can locate their cell and identify a limiting condition. |
| [ ] | S6-01.02 | I | Introduce a priced edit and its delay | The tutorial distinguishes draft, committed change and actual expression. |
| [ ] | S6-01.03 | I | Introduce compound logic and tagged repression | The player predicts one target response before seeing the result. |
| [ ] | S6-01.04 | I | Teach map diagnosis and survivor switching | The player can explain inhibition and continue after focal death. |
| [ ] | S6-01.05 | V | Run the tutorial without microbiology-specific coaching | Misleading terminology and missing explanations are recorded for repair. |

<a id="s6-02"></a>

### S6-02 — Cohesive multi-niche session with another species and HGT opportunity

**Depends on:** [S6-01](#s6-01); stage entry applies.  
**Parent done when:** Player can diagnose and adapt through genes; encounters do not depend on manual steering.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S6-02.01 | I | Connect the slice's selected niches into a coherent session | Autonomous movement can create relevant exposures and encounters. |
| [ ] | S6-02.02 | I | Seed another species and a feasible HGT opportunity | Transfer is attainable without direct steering or developer placement during play. |
| [ ] | S6-02.03 | I | Provide encounter and niche diagnostics under the knowledge policy | Players can form a testable adaptation hypothesis. |
| [ ] | S6-02.04 | V | Complete the session using only genetic/lifecycle controls | Local adaptations and interspecies outcomes remain explainable. |

<a id="s6-03"></a>

### S6-03 — Loss, survivor continuation, extinction, departure and return UX

**Depends on:** [S6-02](#s6-02); stage entry applies.  
**Parent done when:** Clear distinctions among dead, stored, disconnected and living cells; no hidden progress deletion.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S6-03.01 | I | Present cell death and survivor continuation clearly | Loss of one cell does not imply loss of the species. |
| [ ] | S6-03.02 | I | Present extinction and retained progression | Restart consequences match R07 and supported archive behavior. |
| [ ] | S6-03.03 | I | Present departure and reduced return choices/status | Expected count, similarity criteria and failure cases are visible. |
| [ ] | S6-03.04 | V | Exercise each lifecycle state during a live edit | No hidden progress deletion or draft loss occurs. |

<a id="s6-04"></a>

### S6-04 — Representative visuals/audio/settings and continuous-loop pacing pass

**Depends on:** [S6-03](#s6-03); stage entry applies.  
**Parent done when:** Editor and world remain usable together; useful-action gaps and routine recovery traps addressed.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S6-04.01 | I | Integrate selected art, audio and accessibility settings into the slice | Prototype-only visual conventions no longer contradict gameplay state. |
| [ ] | S6-04.02 | E | Measure useful-action gaps during normal and stressed play | Low income, long delays and information gaps are separately identified. |
| [ ] | S6-04.03 | I | Apply the highest-priority pacing/interface correction | The change addresses observed friction while preserving confirmed economic rules. |
| [ ] | S6-04.04 | V | Replay the affected end-to-end scenarios | Editor, map and world remain usable together through the complete session. |

<a id="s6-05"></a>

### S6-05 — External sessions and honest gameplay capture

**Depends on:** [S6-04](#s6-04); stage entry applies.  
**Parent done when:** Observe repeated hypotheses/edits/outcomes and stated reasons for stopping; footage demonstrates actual agency.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S6-05.01 | E | Run external slice sessions across biology and systems-game familiarity | Predictions, decisions, misunderstandings and stopping reasons are recorded. |
| [ ] | S6-05.02 | E | Check self-directed experimentation | Players choose and evaluate goals without a required campaign win condition. |
| [ ] | S6-05.03 | I | Capture representative gameplay showing edit → behavior → consequence | Footage uses real current behavior and readable UI. |
| [ ] | S6-05.04 | D | Rank observed experience failures | Priorities reflect repeated evidence rather than requests for an ever-larger catalog. |

<a id="s6-06"></a>

### S6-06 — G6 review and freeze the slice's functional baseline

**Depends on:** [S6-05](#s6-05); stage entry applies.  
**Parent done when:** Identify one prioritized fix set or proceed; no expansion justified solely by promised future appeal.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S6-06.01 | V | Assemble G6 evidence and remaining limitations | Agency, continuous optimization, interaction and lifecycle are demonstrated. |
| [ ] | S6-06.02 | D | Decide whether to repair or freeze the slice baseline | New content waits if the current loop does not work. |
| [ ] | S6-06.03 | I | Tag the accepted code/content/build baseline | Later changes can be compared against this playable reference. |

<a id="stage-7"></a>

## Stage 7 — Persistent world and capacity certification

**Entry:** G6; early regional feasibility comes from Stage 2.  
**G7:** The accepted vast persistent-world envelope is supported by capacity, recovery, ecology and operational evidence. A small habitat does not qualify.

<a id="s7-01"></a>

### S7-01 — Quantified launch envelope: geography, players, cells, density, genomes, channels, latency, recovery

**Depends on:** G6, [S2-10](#s2-10); stage entry applies.  
**Parent done when:** Owner accepts meaning of “vast”; each public promise has a measurement and named test hardware.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-01.01 | D | Define the geography and continuity promise | World extent, connectedness, transitions and encounter expectations quantify “vast.” |
| [ ] | S7-01.02 | D | Define player/cell/genome/field workload limits | Total, per-region, visible and replicated populations are separate targets. |
| [ ] | S7-01.03 | D | Define client/server hardware and latency budgets | Frame/tick percentiles and operating headroom refer to named test configurations. |
| [ ] | S7-01.04 | D | Define recovery and long-lived-world targets | Acceptable progress loss, restore duration and tested world age are explicit. |
| [ ] | S7-01.05 | D | Obtain owner acceptance of the launch envelope | Every advertised scale promise has a measurable criterion; unknown capacity is not presented as proven. |

<a id="s7-02"></a>

### S7-02 — World-region topology and workload distribution decision

**Depends on:** [S7-01](#s7-01), [S2-04](#s2-04)–[S2-05](#s2-05); stage entry applies.  
**Parent done when:** Compare one-process versus selected partitioning; justify multi-process work with capacity/topology evidence.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-02.01 | E | Compare measured workload with the single-process envelope | The limiting workload and achievable headroom are documented. |
| [ ] | S7-02.02 | D | Select regional topology and geographic transitions | The choice satisfies the accepted world experience and boundary evidence. |
| [ ] | S7-02.03 | D | Choose fixed ownership or justified repartitioning | Hotspot behavior and failure isolation are explicit. |
| [ ] | S7-02.04 | D | Record process layout and handoff/flux contracts | Multiple services or machines are added only for a demonstrated need. |

<a id="s7-03"></a>

### S7-03 — Production regional ownership/handoff, including required boundary flux/contact behavior

**Depends on:** [S7-02](#s7-02); stage entry applies.  
**Parent done when:** A12 passes at selected topology; single-process implementation acceptable only if it meets the envelope.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-03.01 | I | Implement production region ownership records | At a logical time each live cell has exactly one authoritative owner. |
| [ ] | S7-03.02 | I | Implement resumable handoff and reject obsolete ownership | Failed migration cannot reactivate an old authoritative copy. |
| [ ] | S7-03.03 | I | Preserve required boundary contacts and field flux | Region edges do not become refuges or nutrient sources. |
| [ ] | S7-03.04 | I | Coordinate species revision adoption across regions | Chosen activation behavior remains explicit during delayed/unavailable regions. |
| [ ] | S7-03.05 | V | Compare boundary and no-boundary reference scenarios | A12 passes within accepted ecological tolerances. |
| [ ] | S7-03.06 | V | Exercise hotspot migration and handoff interruption | Cells, rewards and local genetic cargo remain uniquely owned. |

<a id="s7-04"></a>

### S7-04 — Durable world/species/ledger/archive persistence and recovery boundaries

**Depends on:** [S7-03](#s7-03), [S5-09](#s5-09); stage entry applies.  
**Parent done when:** Chosen backend persists one consistent economy/world outcome; acceptable lost progress and restore time declared.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-04.01 | D | Select the durable backend and atomicity/recovery boundaries | World, species, ledger and archive consistency requirements determine the choice. |
| [ ] | S7-04.02 | I | Persist species revisions, content references and progression | Ownership and accepted purchases survive process loss. |
| [ ] | S7-04.03 | I | Persist cells, fields and required regulatory state | Recovery restores ecological consequences rather than only visual placement. |
| [ ] | S7-04.04 | I | Persist accepted pending commands and transaction outcomes | Retry after restart returns the original durable result. |
| [ ] | S7-04.05 | I | Persist archive, return and regional authority state | Stored and live copies cannot both acquire authority. |
| [ ] | S7-04.06 | V | Kill the host at representative commit boundaries | Measured data loss and restart behavior meet the selected recovery policy. |

<a id="s7-05"></a>

### S7-05 — Content/save migrations for existing genomes, tags, upgrades and archives

**Depends on:** [S7-04](#s7-04); stage entry applies.  
**Parent done when:** Removed or changed content follows an explicit policy; migrations tested on retained old-version fixtures.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-05.01 | D | Specify treatment of changed or removed genes and tags | Existing players receive an explicit migration/refund/compatibility outcome. |
| [ ] | S7-05.02 | I | Retain representative old-version save and archive fixtures | Fixtures include upgrades, shared constructs, feedback state and pending edits. |
| [ ] | S7-05.03 | I | Implement versioned migration steps | Each supported old version reaches the new valid schema without skipping dependencies. |
| [ ] | S7-05.04 | I | Validate migrated content and physiology references | Removed IDs and invalid regulatory graphs cannot survive silently. |
| [ ] | S7-05.05 | V | Migrate and restore the fixture set | A15 preserves required identity, value and lifecycle state. |

<a id="s7-06"></a>

### S7-06 — Quiet-world, absent-player and withdrawal/return-surge simulation

**Depends on:** [S7-04](#s7-04); stage entry applies.  
**Parent done when:** Population/environment continuity matches C03 policy; no artificial competitive gain from being unwatched.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-06.01 | E | Simulate a quiet or nearly empty world | Ecological activity and player opportunity match the selected background-population policy. |
| [ ] | S7-06.02 | V | Verify absence under the selected C03 branch | Withdrawal halts that population's activity; active absence continues only when supported. |
| [ ] | S7-06.03 | E | Remove a major mutualistic population | Dependents experience the actual modeled consequence rather than an unexplained freeze. |
| [ ] | S7-06.04 | E | Queue many returns into similar habitat | Site capacity, fairness and no-match responses follow declared rules. |
| [ ] | S7-06.05 | V | Compare watched and unwatched population outcomes | Detail/relevance changes do not alter survival or rewards. |

<a id="s7-07"></a>

### S7-07 — Worst-case capacity suite and overload behavior

**Depends on:** [S7-03](#s7-03)–[S7-06](#s7-06); stage entry applies.  
**Parent done when:** Crowded caves, unique genomes, compound circuits, joins and edit bursts fit accepted percentiles/headroom or trigger declared admission behavior.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-07.01 | I | Parameterize the launch workload generators | Density, genome diversity, channels and player activity can vary independently. |
| [ ] | S7-07.02 | D | Select the population/carrying-capacity policy and division-at-limit semantics | Limits, newcomer fairness, consumed resources and reward eligibility are explicit under D44. |
| [ ] | S7-07.03 | I | Implement the selected population-limit behavior | Rejected or deferred offspring cannot create a fictitious birth reward or accidentally consume/refund resources twice. |
| [ ] | S7-07.04 | E | Benchmark crowded caves and synchronized lifecycle events | Tick percentiles and resource accounting include contact/birth spikes. |
| [ ] | S7-07.05 | E | Benchmark worst permitted compound circuits and tag fan-out | Controller limits bound evaluation and validation costs. |
| [ ] | S7-07.06 | E | Benchmark join/reconnect, edit bursts and diagnostic subscriptions | Snapshot and event traffic stay within declared budgets. |
| [ ] | S7-07.07 | I | Implement selected overload/admission behavior | The server responds predictably rather than silently skipping ecological work. |
| [ ] | S7-07.08 | V | Run the accepted maximum plus headroom workload | Queue growth, memory, latency and bandwidth pass or identify a concrete blocker. |

<a id="s7-08"></a>

### S7-08 — Conditional simulation approximation experiment if individual reference misses targets

**Depends on:** [S7-07](#s7-07); stage entry applies.  
**Parent done when:** Compare distributions, rare lineages, HGT and extinction against reference; mark not applicable if unnecessary.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-08.01 | D | Decide whether approximation is necessary | If individual simulation meets targets, record not applicable and skip remaining subtasks. |
| [ ] | S7-08.02 | E | Select one proposed approximation and reference scenario set | Rare lineages, thresholds, contacts and HGT are represented. |
| [ ] | S7-08.03 | I | Implement the bounded experimental representation and transitions | Resources, identity and genotype distinctions survive entry/exit. |
| [ ] | S7-08.04 | E | Compare distributions and competitive outcomes across seeds | Extinction, niche occupancy and transfer rates are assessed, not only total biomass. |
| [ ] | S7-08.05 | D | Accept, revise or reject the approximation | It enters production only with declared fidelity limits and measured performance benefit. |

<a id="s7-09"></a>

### S7-09 — Backup/restore, interrupted handoff and regional outage drills

**Depends on:** [S7-04](#s7-04)–[S7-08](#s7-08); stage entry applies.  
**Parent done when:** Restore into another process; one authority per cell/archive; measured recovery meets the envelope.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-09.01 | I | Automate backup generation and retention for the chosen backend | Backup identity includes schema/content and required transaction state. |
| [ ] | S7-09.02 | V | Restore into a fresh process/environment | Recovery uses backed-up data rather than the original live process. |
| [ ] | S7-09.03 | V | Interrupt a handoff and regional update | One authoritative copy remains; an unavailable region is not treated as extinct. |
| [ ] | S7-09.04 | V | Crash during archive consumption and species-edit propagation | No double return, duplicate charge or missing accepted revision occurs. |
| [ ] | S7-09.05 | E | Measure recovery duration and lost progress | Both satisfy the declared launch envelope or block certification. |

<a id="s7-10"></a>

### S7-10 — Production hosting/runbook/cost model based on measured workload

**Depends on:** [S7-07](#s7-07), [S7-09](#s7-09); stage entry applies.  
**Parent done when:** Quote actual candidate resources and support time; local-host prototype results are not assumed identical to rented hardware.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-10.01 | E | Obtain current resource and bandwidth quotes for the measured workload | Provider assumptions and utilization are explicit; DAU alone is not a capacity model. |
| [ ] | S7-10.02 | E | Run a representative workload on the candidate production hardware | Local benchmark results are not assumed to transfer unchanged. |
| [ ] | S7-10.03 | D | Record the operating budget and funded runway | Compute, egress, backups and support time fit the selected business direction. |
| [ ] | S7-10.04 | I | Write startup, monitoring, backup, shutdown and recovery runbooks | A single operator can follow them from a clean state. |
| [ ] | S7-10.05 | V | Rehearse the runbook on the intended deployment layout | Commands and recovery steps work without undocumented knowledge. |

<a id="s7-11"></a>

### S7-11 — Long-run automated and supervised soak with growth/decline cycles

**Depends on:** [S7-10](#s7-10); stage entry applies.  
**Parent done when:** Memory, queues, database/history growth and ecological outcomes remain bounded over declared world-age tests.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-11.01 | D | Define soak duration, workload cycles and pass thresholds | These cover intended world age risks without claiming a short test proves indefinite stability. |
| [ ] | S7-11.02 | I | Schedule growth, decline, absence and reconnect phases in the harness | The soak exercises changing state and transaction volume. |
| [ ] | S7-11.03 | E | Run the automated soak and retain trend data | Memory, queue lengths, database size and histories have inspectable growth rates. |
| [ ] | S7-11.04 | E | Observe ecological outcomes at checkpoints | Persistent collapse, takeover or frozen populations are distinguishable from technical stability. |
| [ ] | S7-11.05 | I | Repair the highest-impact leak or unbounded accumulation if found | Repeat only the affected soak coverage before continuing certification. |

<a id="s7-12"></a>

### S7-12 — G7 certification report and launch limits

**Depends on:** [S7-11](#s7-11); stage entry applies.  
**Parent done when:** Vast-world promise, recovery and recurring operation supported; unresolved failures block paid release under C01.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S7-12.01 | V | Assemble scale, recovery, ecology and operating-cost results | Each accepted launch-envelope field links to actual evidence. |
| [ ] | S7-12.02 | D | Set enforced launch limits from measured capacity | Advertising, admission and controller limits agree. |
| [ ] | S7-12.03 | D | Record G7 pass or explicit blocked requirements | A small working habitat cannot satisfy the vast persistent-world commitment. |

<a id="stage-8"></a>

## Stage 8 — Launch content and feature-complete alpha

**Entry:** G6; freeze limits at G7 before completion.  
**G8:** Every approved launch capability has data, behavior, presentation and evidence; the client/server/content alpha builds reproducibly.

<a id="s8-01"></a>

### S8-01 — Owner-approved launch inventory mapping V01–V30 to content and systems

**Depends on:** G6; final limits from G7; stage entry applies.  
**Parent done when:** Counts and scope explicit; every deferred confirmed feature requires an owner scope revision.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-01.01 | D | Define the finite launch gene, promoter, regulator and upgrade inventory | Every entry has an owner-approved purpose and required content work. |
| [ ] | S8-01.02 | D | Define launch habitats, interactions and optional features | Candidate content families are not automatically all launch commitments. |
| [ ] | S8-01.03 | V | Map V01–V30 to implemented or planned launch evidence | A confirmed requirement can be deferred only through an explicit scope revision. |
| [ ] | S8-01.04 | D | Freeze the inventory against G7 limits | Content volume and complexity fit the certified envelope before production completion. |

<a id="s8-02"></a>

### S8-02 — Gene/promoter/regulator/upgrade content production using one authoring checklist

**Depends on:** [S8-01](#s8-01), [S4-08](#s4-08); stage entry applies.  
**Parent done when:** Each entry has data, costs, visuals, diagnosis, prerequisites, scientific note and scenario; no catalog-only completion.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-02.01 | I | Create one content ticket per approved gene/module using template CT-G | Every entry has its own stable task identity and dependencies. |
| [ ] | S8-02.02 | I | Author and validate module data for each entry | Function, costs, prerequisites, bounds, tags, localization and upgrades are explicit. |
| [ ] | S8-02.03 | I | Integrate each entry's phenotype and selected visual/audio cues | Catalog presence alone does not count as implementation. |
| [ ] | S8-02.04 | I | Add diagnostic, progression and fidelity text for each entry | Players can explain the effect and distinguish biological relationships from gameplay prerequisites. |
| [ ] | S8-02.05 | V | Run each entry's success, failure and interaction fixture | Behavior, authority, save/load and performance are covered where affected. |
| [ ] | S8-02.06 | V | Measure authoring effort and complete the entry checklist | Remaining catalog estimates use actual throughput, not raw entry counts. |

<a id="s8-03"></a>

### S8-03 — Habitat templates, generation validation and selected background species

**Depends on:** [S8-01](#s8-01), [S3-14](#s3-14); stage entry applies.  
**Parent done when:** Viable starts and meaningful niches across seeds; empty and mature worlds support entry.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-03.01 | I | Create one content ticket per approved habitat using template CT-H | Source/sink, geometry, favored strategies and viability criteria are explicit. |
| [ ] | S8-03.02 | I | Implement selected habitat generation/arrangement rules | Template constraints prevent invalid geometry and unsupported field combinations. |
| [ ] | S8-03.03 | I | Validate spawn viability across the agreed seed set | Each accepted start supports a meaningful first intervention. |
| [ ] | S8-03.04 | I | Add approved background species using the selected rule set | Their behavior and economic treatment are explicit; omit only if the feature is not selected. |
| [ ] | S8-03.05 | E | Compare nearly empty and mature generated worlds | Niche access, encounter opportunities and newcomer establishment are measured. |

<a id="s8-04"></a>

### S8-04 — Expanded progression and balance regression

**Depends on:** [S8-02](#s8-02)–[S8-03](#s8-03); stage entry applies.  
**Parent done when:** Permanent upgrades, tradeoffs, tag diversity and rewards tested for dominance/homogenization and recovery traps.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-04.01 | I | Expand the typed progression graph with approved content | All nodes are reachable under their declared acquisition routes. |
| [ ] | S8-04.02 | V | Check tag diversity, shared targets and upgraded parameter bounds | The catalog cannot bypass controller or capacity limits. |
| [ ] | S8-04.03 | E | Compare permanent upgrades, tradeoffs and specialist strategies | Veteran advantage and universal dominant designs are measured across niches. |
| [ ] | S8-04.04 | E | Re-run reward farming and stressed recovery scenarios | New content does not reintroduce no-income correction traps or cheap reward loops. |
| [ ] | S8-04.05 | D | Prioritize a bounded balance patch from the evidence | Preserve confirmed upgrade classes and record changes affecting existing genomes. |

<a id="s8-05"></a>

### S8-05 — Remaining accessibility, input, language structure and supported-platform packaging

**Depends on:** [S8-04](#s8-04); stage entry applies.  
**Parent done when:** Every intended launch claim has a verified build/UI behavior; unsupported claims removed.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-05.01 | D | Finalize supported OS, languages, input and accessibility claims | Optional controller/Deck support is either selected with tests or explicitly unclaimed. |
| [ ] | S8-05.02 | I | Complete rebinding, text scaling and selected navigation support | Advertised controls work throughout editor, map and lifecycle screens. |
| [ ] | S8-05.03 | I | Externalize and review supported UI strings | Longer text and scientific names fit the approved layouts. |
| [ ] | S8-05.04 | I | Package each selected platform build | Correct assets, dependencies and launch settings are included. |
| [ ] | S8-05.05 | V | Run the supported-resolution/input/platform matrix | Each store claim has a working build and evidence. |

<a id="s8-06"></a>

### S8-06 — Species naming/reporting/moderation and selected social features

**Depends on:** [S8-01](#s8-01), [S5-11](#s5-11); stage entry applies.  
**Parent done when:** Player identity survives moderation operations; reports actionable; optional chat/trading only if accepted.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-06.01 | I | Enforce species-name rules and stable identity | Rename does not change ownership or functional tag IDs. |
| [ ] | S8-06.02 | I | Add the selected report/block workflow | Reports contain actionable species/session references and respect the supported social scope. |
| [ ] | S8-06.03 | I | Implement operator rename/ban actions with audit history | Moderation does not corrupt progression or population ownership. |
| [ ] | S8-06.04 | I | Add only explicitly accepted optional social features | Chat, trade or group features get their own scope and moderation tasks if selected. |
| [ ] | S8-06.05 | V | Exercise naming abuse and moderation recovery | The operator can resolve a case without direct database repair. |

<a id="s8-07"></a>

### S8-07 — G8 feature-complete alpha and requirement evidence audit

**Depends on:** G7, [S8-02](#s8-02)–[S8-06](#s8-06); stage entry applies.  
**Parent done when:** All V requirements implemented or explicitly revised; reproducible client/server/content build.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S8-07.01 | V | Audit all launch entries and V01–V30 evidence | Missing central gameplay, art or lifecycle work is identified as incomplete. |
| [ ] | S8-07.02 | V | Build client/server/content from the tagged source | The feature-complete alpha is reproducible. |
| [ ] | S8-07.03 | D | Record G8 result and the beta blocker list | Confirmed features are implemented or explicitly revised, not silently deferred. |

<a id="stage-9"></a>

## Stage 9 — External beta, commerce and store preparation

**Entry:** G7 and G8.  
**G9:** Representative users, devices and networks pass; subscription access, store promises and support match the release candidate.

<a id="s9-01"></a>

### S9-01 — Controlled external test distribution with separate test state

**Depends on:** G7–G8; stage entry applies.  
**Parent done when:** Joining, reset expectations, crash reports and capacity limits clear; no test minting into production economy.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-01.01 | D | Select the controlled test distribution route and cohort limits | Access, reset expectations and server capacity are documented. |
| [ ] | S9-01.02 | I | Configure isolated test accounts, worlds and progression | Test rewards cannot enter the trusted production economy. |
| [ ] | S9-01.03 | I | Package joining instructions and crash-report capture | Testers can install, connect and supply useful diagnostics. |
| [ ] | S9-01.04 | V | Complete a fresh tester install and join | Distribution works without the development environment or private operator steps. |

<a id="s9-02"></a>

### S9-02 — Real-device/network onboarding and continuous-play evaluation

**Depends on:** [S9-01](#s9-01); stage entry applies.  
**Parent done when:** Target players explain costs, delays, tags and local expression; abandonment causes recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-02.01 | E | Run onboarding on representative devices and network profiles | Failures include hardware/network context and reproduction steps. |
| [ ] | S9-02.02 | E | Test understanding of cost, delay, shared tags and local phenotype | Predictions and explanations are recorded rather than inferred from playtime. |
| [ ] | S9-02.03 | E | Measure continuous-play decision gaps and abandonment | Metrics have explicit denominators and do not confuse waiting with engagement. |
| [ ] | S9-02.04 | D | Rank the highest-impact usability/performance findings | Each becomes a small repair ticket with an observable target. |

<a id="s9-03"></a>

### S9-03 — Mature-world newcomer and long-absence return trials

**Depends on:** [S9-01](#s9-01); stage entry applies.  
**Parent done when:** Established upgrades/hostility do not make entry routinely futile; archive return remains understandable.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-03.01 | E | Introduce new species into mature worlds | First intervention, survival opportunity and hostile exposure are measured. |
| [ ] | S9-03.02 | E | Return stored populations after short and long absences | Count reduction, matching and unavailable-habitat behavior remain understandable. |
| [ ] | S9-03.03 | E | Repeat return after an approved content/world change | Migration and fallback policies preserve the declared player expectations. |
| [ ] | S9-03.04 | D | Record required balance or lifecycle fixes | Established upgrades and absence do not make entry routinely futile under accepted targets. |

<a id="s9-04"></a>

### S9-04 — Release blocker triage, focused fixes and regression

**Depends on:** [S9-02](#s9-02)–[S9-03](#s9-03); stage entry applies.  
**Parent done when:** No reproducible data corruption, unauthorized edits, duplicate rewards or major supported-hardware failure.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-04.01 | I | Classify release defects by reproducibility and impact | Corruption, unauthorized changes, duplication and inability to join are blockers. |
| [ ] | S9-04.02 | I | Create one repair ticket per blocker with reproduction steps | Each identifies expected behavior and the smallest affected system. |
| [ ] | S9-04.03 | I | Implement prioritized repairs | Changes do not add unrelated launch scope. |
| [ ] | S9-04.04 | V | Re-run affected scenarios and one end-to-end session | The specific defect is resolved without losing the integrated loop. |
| [ ] | S9-04.05 | D | Freeze the remaining known-issues list | Deferred issues have justified severity and accurate player-facing limitations. |

<a id="s9-05"></a>

### S9-05 — Current Steam onboarding/release-route requirements and accurate store assets

**Depends on:** [S6-05](#s6-05), [S9-04](#s9-04); stage entry applies.  
**Parent done when:** Section 18 rechecked; screenshots/trailer match actual gameplay; first paid scope satisfies C01.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-05.01 | D | Recheck title availability, publishing identity and release route | Naming concerns and Early Access versus 1.0 obligations are resolved before branding commitments. |
| [ ] | S9-05.02 | D | Recheck current Steam onboarding, fees and waiting/review requirements | Current official rules and dashboard dates replace old estimates in the source specification. |
| [ ] | S9-05.03 | O | Complete applicable publisher, bank/tax and app onboarding | Required records and platform status are complete before submission. |
| [ ] | S9-05.04 | V | Audit dependency, art, audio and font licenses/attributions | Distribution rights and required notices are recorded, including generated/commissioned asset provenance. |
| [ ] | S9-05.05 | I | Prepare accurate store description, screenshots and gameplay trailer | Genetic agency, persistence and actual multiplayer scope are represented. |
| [ ] | S9-05.06 | I | Produce capsule/library assets and fill supported-feature fields | Platforms, languages, input and system requirements match verified builds. |
| [ ] | S9-05.07 | I | Complete applicable surveys and privacy/commercial disclosures | AI-content and other platform questions reflect the actual product; selected data handling is documented. |
| [ ] | S9-05.08 | O | Submit the store presence and start required visibility periods | Review corrections and date constraints are tracked; publication is separately authorized when executed. |

<a id="s9-06"></a>

### S9-06 — Subscription entitlement/lapse policy and selected platform integration

**Depends on:** [S9-05](#s9-05); stage entry applies.  
**Parent done when:** Test purchase, renewal, grace/cancellation/lapse and reconnect; access decisions server-owned; no assumption that $5 sales equal net revenue.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-06.01 | D | Verify the selected Steam-compatible subscription implementation | The planned $5/month direction has a supported billing/access route before integration. |
| [ ] | S9-06.02 | D | Specify purchase, renewal, cancellation, grace and lapse behavior | Population storage, pending edits and return access have explicit outcomes. |
| [ ] | S9-06.03 | I | Implement server-owned entitlement validation | Client claims cannot grant paid access. |
| [ ] | S9-06.04 | I | Handle repeat, delayed and reordered entitlement updates | Access state converges without duplicate benefits or accidental permanent denial. |
| [ ] | S9-06.05 | I | Add subscription/access status and recovery UI | Players understand lapse, service failure and restoration states. |
| [ ] | S9-06.06 | V | Exercise purchase, renewal, cancellation, expiry and reconnect in test mode | Each event produces the selected access and population lifecycle result. |

<a id="s9-07"></a>

### S9-07 — Deployment/update/rollback rehearsal, support and outage messaging

**Depends on:** [S9-04](#s9-04), [S9-06](#s9-06); stage entry applies.  
**Parent done when:** Client/server/content versions handled; database rollback constraints understood; reports reach a sustainable workflow.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-07.01 | I | Define deployment artifacts and compatibility checks | Client, server, content and save versions are identifiable and accepted combinations are explicit. |
| [ ] | S9-07.02 | I | Implement update/admission/maintenance behavior | Incompatible clients and full/unavailable servers receive actionable responses. |
| [ ] | S9-07.03 | V | Rehearse deployment and rollback on test state | Database migration compatibility and irreversible boundaries are known. |
| [ ] | S9-07.04 | I | Prepare support, incident and outage communication templates | Reports reach a sustainable workflow with useful diagnostic fields. |
| [ ] | S9-07.05 | V | Rehearse a service outage from detection to recovery | A single operator can restore service and account for accepted transactions. |

<a id="s9-08"></a>

### S9-08 — G9 release-candidate decision

**Depends on:** [S9-02](#s9-02)–[S9-07](#s9-07); stage entry applies.  
**Parent done when:** Test evidence, store promises, commercial access and support match the product being sold.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S9-08.01 | V | Assemble beta, commerce, recovery and store evidence | Actual tested behavior matches what will be sold. |
| [ ] | S9-08.02 | D | Review open blockers and operating obligations | Unsupported promises or unmanageable support load prevent release candidacy. |
| [ ] | S9-08.03 | D | Record G9 and identify the frozen candidate | The candidate references exact code, content and build artifacts. |

<a id="stage-10"></a>

## Stage 10 — Steam release

**Entry:** G9.  
**G10:** The approved candidate is released, a live smoke session passes and launch monitoring is active. All hard blockers were resolved before publication.

<a id="s10-01"></a>

### S10-01 — Frozen candidate, clean install/update and supported-platform checks

**Depends on:** G9; stage entry applies.  
**Parent done when:** Signed/versioned build artifacts reproducible; settings/save permissions and migration work outside development environment.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S10-01.01 | I | Produce versioned release client/server artifacts from the frozen candidate | Build provenance and selected signing requirements are satisfied. |
| [ ] | S10-01.02 | V | Test clean install and launch on each advertised OS | Redistributables, permissions and first-run settings work outside development machines. |
| [ ] | S10-01.03 | V | Test update from the oldest supported player version | Settings and supported save/content migrations retain declared state. |
| [ ] | S10-01.04 | V | Check uninstall and local-save/settings behavior | Player data handling matches documented policy. |

<a id="s10-02"></a>

### S10-02 — Required store/build approvals and release timing

**Depends on:** [S10-01](#s10-01), [S9-05](#s9-05); stage entry applies.  
**Parent done when:** Current dashboard requirements complete; corrections resolved without relying on obsolete dates in this document.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S10-02.01 | O | Configure and verify Steam depots, packages, branches and launch options | The intended audience receives the correct client/server artifacts. |
| [ ] | S10-02.02 | O | Submit the required build/store reviews | Current checklists and required disclosures are complete. |
| [ ] | S10-02.03 | I | Resolve review corrections on the frozen candidate branch | Corrections are tracked and the approved artifact remains identifiable. |
| [ ] | S10-02.04 | D | Confirm release timing against actual dashboard status | Required waiting/visibility periods and approvals have completed. |

<a id="s10-03"></a>

### S10-03 — Production capacity, entitlement, backup and restoration readiness

**Depends on:** [S10-01](#s10-01), [S9-06](#s9-06)–[S9-07](#s9-07); stage entry applies.  
**Parent done when:** Selected infrastructure deployed; actual restore succeeds; admission limits equal tested envelope.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S10-03.01 | O | Deploy the selected production layout and isolate test state | Admission and workload limits equal the certified envelope. |
| [ ] | S10-03.02 | V | Verify production entitlement and version compatibility | Eligible clients can join and invalid/incompatible access is handled correctly. |
| [ ] | S10-03.03 | V | Take a backup and perform an actual restore rehearsal | Recoverable state includes genomes, ledger, archives and pending work. |
| [ ] | S10-03.04 | V | Verify alerts, safe shutdown and rollback readiness | Operators can respond to the selected failure scenarios. |

<a id="s10-04"></a>

### S10-04 — Final 30-requirement, known-issues and support audit

**Depends on:** [S10-02](#s10-02)–[S10-03](#s10-03); stage entry applies.  
**Parent done when:** No hard blocker hidden as future content; support availability and rollback owner recorded.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S10-04.01 | V | Audit all 30 requirements against the candidate | Evidence distinguishes prototype demonstrations from release obligations. |
| [ ] | S10-04.02 | V | Compare every advertised feature with the approved build | No planned future capability is sold as currently available. |
| [ ] | S10-04.03 | D | Finalize known issues, support availability and incident responsibility | The solo operator's launch coverage and escalation limits are explicit. |
| [ ] | S10-04.04 | D | Record hard-blocker status | Corruption, duplication, unauthorized changes, major access failures and unmet core promises block launch. |

<a id="s10-05"></a>

### S10-05 — Owner go/no-go and Steam release operation

**Depends on:** [S10-04](#s10-04); stage entry applies.  
**Parent done when:** Release explicitly approved; live client can join, edit, divide and preserve correct progress.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S10-05.01 | D | Present the concrete release candidate and readiness report for owner go/no-go | Exact builds, known issues, limits and rollback plan are reviewable. |
| [ ] | S10-05.02 | O | Perform the separately approved Steam release operation | The approved build and store configuration become available to the intended audience. |
| [ ] | S10-05.03 | V | Run a live-player smoke session | Join, edit, mature, divide and reconnect preserve the expected progression. |

<a id="s10-06"></a>

### S10-06 — Launch observation and targeted incident response

**Depends on:** [S10-05](#s10-05); stage entry applies.  
**Parent done when:** Monitor actual tick/queue/error/access behavior; repair critical incidents before new feature work.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S10-06.01 | O | Observe access, tick, queue, crash and transaction dashboards | Actual launch workload is compared with certified limits. |
| [ ] | S10-06.02 | O | Triage incidents by player impact and integrity risk | Data-loss and economy defects take priority over new features. |
| [ ] | S10-06.03 | I | Apply the smallest justified emergency fix or rollback | Change, migration implications and affected users are recorded. |
| [ ] | S10-06.04 | V | Verify the affected flow and communicate status when authorized | Recovery is confirmed before incident closure. |

<a id="stage-11"></a>

## Stage 11 — Maintenance and future decisions

**Entry:** Released game.  
**G11:** Each maintenance cycle resolves its selected issue or decision with evidence and preserves a sustainable service; this is recurring work, not a permanently closed milestone.

<a id="s11-01"></a>

### S11-01 — Prioritized incident and exploit handling

**Depends on:** Released game; stage entry applies.  
**Parent done when:** Reproducible severe issues get fixes, regression fixtures and player communication.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S11-01.01 | O | Review incoming incidents and exploit reports on the selected cadence | Each actionable report has severity, affected version and reproduction evidence. |
| [ ] | S11-01.02 | I | Reproduce the highest-priority issue in isolated state | Production accounts/worlds are not used as uncontrolled debugging fixtures. |
| [ ] | S11-01.03 | I | Patch the issue and add a meaningful regression fixture | The specific failure cannot silently recur in the supported path. |
| [ ] | S11-01.04 | O | Release the verified fix and provide authorized communication | Players receive accurate impact and recovery information. |

<a id="s11-02"></a>

### S11-02 — Versioned balance/content updates with migrations and rollback planning

**Depends on:** [S11-01](#s11-01); stage entry applies.  
**Parent done when:** Existing genomes, upgrades, tags and archives follow disclosed rules; trusted economy stays coherent.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S11-02.01 | D | Specify the balance/content update and existing-player consequences | Upgrades, archives and removed content have an explicit migration policy. |
| [ ] | S11-02.02 | I | Implement the bounded update in a versioned branch | Scope is tied to measured gameplay or maintenance needs. |
| [ ] | S11-02.03 | V | Run affected ecology, economy and old-save migration fixtures | The update preserves authority and declared retained value. |
| [ ] | S11-02.04 | O | Deploy with a tested recovery plan | Client/server compatibility and rollback constraints are known. |

<a id="s11-03"></a>

### S11-03 — Periodic cost, maintenance-time and capacity review

**Depends on:** Released game; stage entry applies.  
**Parent done when:** Actual workload and operating burden inform expansion; no fixed content cadence assumed.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S11-03.01 | E | Review actual compute, egress, storage and support time | Operating cost is based on measured service usage. |
| [ ] | S11-03.02 | E | Review utilization, player concurrency and ecological health | Growth pressure is separated from temporary spikes and content complaints. |
| [ ] | S11-03.03 | D | Choose one justified capacity, pricing-policy or maintenance action | Financial/product changes require the appropriate owner decision. |
| [ ] | S11-03.04 | V | Confirm the action's effect in the next review | Extra infrastructure or recurring work earns its ongoing cost. |

<a id="s11-04"></a>

### S11-04 — Expansion/end-of-service/community-hosting decision review

**Depends on:** [S11-03](#s11-03); stage entry applies.  
**Parent done when:** New commitments fit demand and capacity; continuity options match sale promises.

| Done | Task ID | Type | Action | Done when |
|---|---|---|---|---|
| [ ] | S11-04.01 | D | Evaluate one expansion against demand and maintenance capacity | New promises include implementation, migration, moderation and operating effort. |
| [ ] | S11-04.02 | D | Review official-service continuity and community-hosting options | Options respect prior sales/access promises and trusted-economy boundaries. |
| [ ] | S11-04.03 | I | Prepare the selected expansion or continuity plan | Export, migration, compatibility and player-facing limitations are concrete. |
| [ ] | S11-04.04 | O | Execute only the owner-approved change and communication | End-of-service or commercial changes receive explicit approval at execution time. |

## Reusable expansion templates

These templates are not additional implemented tasks and are not counted in the 580 leaves. Copy them into the owning work package once its inventory is known; replace placeholders with stable IDs. A catalog of 20 genes requires 20 explicit content checklists. Apply the same rule to habitats, supported platforms, significant defects and optional social features.

### CT-G — One gene, promoter, regulator or upgrade entry

**Instance ID:** `CT-G-<content-id>`  
**Parent:** S8-02, or the earlier ticket introducing the first example  
**Prerequisites:** Selected effect system, schema, cost policy and launch inventory entry

| Done | Suffix | Task | Done when |
|---|---|---|---|
| [ ] | .01 | Define the player purpose and module boundary | One observable capability and its biological abstraction are explicit. |
| [ ] | .02 | Author stable ID, dependencies and progression edges | The catalog validates; scientific and gameplay relationships remain distinct. |
| [ ] | .03 | Author regulation, receptor inputs and operator/recognition tags | Inputs are bounded, missing-input behavior explicit and targets inspectable. |
| [ ] | .04 | Author creation/unlock/edit and physiological costs | Currency, capacity and resource costs are distinct and preview correctly. |
| [ ] | .05 | Implement or bind the functional effect | The module changes the intended physiological/behavioral outcome. |
| [ ] | .06 | Define supported localization, assembly and upgrade parameters | Bounds, kinetics, tradeoffs/permanent improvement and inheritance are explicit. |
| [ ] | .07 | Add icon, selected visual/audio cues and local-map explanation | The player can find the source construct and diagnose inactive/limited states. |
| [ ] | .08 | Run a success and a limiting/failure scenario | Costs and prerequisites matter; no hidden unlimited input is introduced. |
| [ ] | .09 | Verify affected authority, transfer and save/load paths | The new entry behaves correctly in relevant persistence/network cases; irrelevant branches are marked N/A. |
| [ ] | .10 | Check representative performance and content provenance | Complexity stays within limits; sources/licenses and evidence are recorded. |

### CT-H — One habitat template

**Instance ID:** `CT-H-<habitat-id>`  
**Parent:** S8-03, or the earlier niche fixture ticket

| Done | Suffix | Task | Done when |
|---|---|---|---|
| [ ] | .01 | Define niche signature and strategic purpose | Favored/disadvantaged strategies and visual cues are explicit. |
| [ ] | .02 | Author geometry and transport boundaries | Entry, retention and exit work through autonomous behavior. |
| [ ] | .03 | Author resources, light, stressors and flow | Sources, sinks and compatible units have an inspectable ledger. |
| [ ] | .04 | Define viable starts and carrying/admission limits | The first intervention is attainable under accepted spawn rules. |
| [ ] | .05 | Configure stored-population matching and fallback metadata | Similarity is testable and distinct from guaranteed ecological safety. |
| [ ] | .06 | Add selected background/interacting species | Their costs and resource flows obey the declared simulation rules. |
| [ ] | .07 | Test normal, crowded, depleted and return-surge conditions | Geometry, transport, survival and placement produce explained outcomes. |
| [ ] | .08 | Validate the agreed procedural seed set and production cost | Invalid seeds fail authoring checks; content fits performance and authoring budgets. |

### CT-S — One acceptance or fault scenario

**Instance ID:** `CT-S-<A-ID>-<case>`  
**Parent:** The first implementing/verification ticket for that scenario

| Done | Suffix | Task | Done when |
|---|---|---|---|
| [ ] | .01 | State one correctness question | Expected behavior and tolerance follow an approved or provisional rule. |
| [ ] | .02 | Build the smallest fixture | Build/content versions, seed, initial state and workload are recorded. |
| [ ] | .03 | Execute the target action or fault | Trigger time and reproduction steps are deterministic enough to debug. |
| [ ] | .04 | Capture the consequential state | Relevant resources, identities, revisions, events and timing are available. |
| [ ] | .05 | Compare with the reference/contract | Pass or failure includes evidence and a concrete limitation. |
| [ ] | .06 | Create a bounded repair and rerun only affected coverage | A failure is fixed or explicitly blocks the parent/gate. |

### CT-F — One discovered defect

Create `CT-F-<number>` with the failing build/scenario, expected versus actual outcome, severity and affected parent. Split into **reproduce → identify violated rule → implement bounded fix → verify affected behavior**. Changes to game rules require a decision record; do not conceal a design change inside a bug fix.

## Acceptance scenario register

These are the source document’s 26 scenarios. Each is first proved locally where possible, then revisited for networking, persistence or scale only when that adds a concrete risk. A09 is conditional on retaining active absence; otherwise document the withdrawn-population behavior under A10/A11. Scenario thresholds remain provisional until agreed for the relevant gate.

| Test ID | Scenario | Pass evidence | First stage |
|---|---|---|---|
| A01 | Start with several cells; kill the focal cell, then the final eligible survivor | Focus transfers without changing cell physiology; extinction occurs only at the declared boundary | 1–2 |
| A02 | Apply one species edit with members in contrasting light/nutrient conditions | Same edit scope and charge; different expression where promoter inputs differ; visible adoption timing | 1–2 |
| A03 | Compare constitutive and conditional expression in stable versus switching environments | Costs and lag explain outcomes; conditional regulation is not free and not universally optimal by construction | 1–3 |
| A04 | Rotate a cell, move illumination, divide it, then remove the signal | Localization follows the declared frame/assembly rules without direct steering | 1–3 |
| A05 | Divide while reward messages retry and a crash occurs | Each actual eligible birth event grants its defined reward once; blocked divisions do not mint points | 2, 5 |
| A06 | Compare a motile generalist and attached specialist across open flow and cave conditions | Niche-dependent performance is measured across seeds and explainable from costs/transport | 3 |
| A07 | Place secretor/beneficiary/exploiter strains together, then change mixing | Resource flows explain benefit or exploitation; no hidden relationship bonus is necessary | 3 |
| A08 | Attempt accepted, rejected, interrupted, and duplicate HGT with two players | Payload, costs, attribution, compatibility, and inheritance match the chosen contract | 5 |
| A09 | Leave an active species unattended; return after a declared interval | Ecology continued; reward policy, causal history, and survival status are correct | 2, 5–7 |
| A10 | Store and return from each supported habitat and population-size boundary | No world activity while stored; declared reduction and match policy hold; no-match behavior is legible | 2, 5–7 |
| A11 | Retry store/return during crash, attack, HGT, and species edit | One authoritative population outcome; no repeat attrition or reward/resource duplication | 5–7 |
| A12 | Run the same ecology across a regional boundary and without that boundary | Resource, encounter, and survival differences remain within declared tolerance; handoff authority is unique | Early spike, 7 |
| A13 | Fill a cave with mixed genomes during simultaneous division, editing, and reconnect | Tick/frame percentiles, queues, memory, and bandwidth remain within accepted worst-case budgets | 5–7 |
| A14 | Switch cameras between equivalent observed/unobserved populations | Camera visibility does not change simulated survival or rewards | 3, 7 |
| A15 | Restore an older supported world/archive into a new content version | Compatible state migrates correctly; removed/conflicting content has a disclosed policy | 7–10 |
| A16 | New player joins a mature world, and separately an almost-empty world | Both support a viable first intervention and meaningful ecological activity | 6–9 |
| A17 | Minimum-spec client plays a crowded beauty scene with overlays and zoom | Readable phenotype/selection/contacts at accepted frame-time budgets; optional blur does not hide critical state | 4, 9 |
| A18 | A tester completes the shipped start–edit–divide–interact–store–return loop | Understands agency, consequences, and persistence without developer rescue; errors are recoverable as specified | 6–10 |
| A19 | Continuous optimization with long/short edit delays and scarce/abundant points | Record intervals without useful actions; player can identify reasons for successive edits and interpret results | 1, 6 |
| A20 | Run concurrent edits up to and beyond the limit; replace, cancel, reconnect, and trigger simultaneous completion | Multiple edits can mature together; limit holds across clients; no early effects, lost updates, or duplicate charge; no-steering intent tested | 1–2, 5 |
| A21 | One promoter drives two modules with different location/output properties | Shared activation and chosen output coupling hold; separate actual abundance and costs remain inspectable | 1–2 |
| A22 | Compare displayed local map with authoritative state across expression, assembly, and focal switching | No confusion of target with abundance; samples are current or visibly stale; markers use correct reference frame | 1, 4–6 |
| A23 | Remove, suppress, or alter sensitivity of a receptor supplying a promoter | Cellular response changes only according to the declared sensing mechanism; diagnostic overlays do not grant a hidden sensor | 1–3 |
| A24 | Buy capacity, unlock, create, edit function, and edit promoter through retries and insufficient funds | Gene slots and edit slots remain distinct; costs/eligibility correct; failed operations do not partially commit; both tradeoff and permanent improvements persist as specified | 2, 5 |
| A25 | Predation, accumulated secretions, and hostile injection in contrasting niches | Cause, resource flow, payload scope, and defenses are observable; local gene infection follows explicit species-merge policy | 3, 5–8 |
| A26 | Compound conditions and tagged repressor; compare matching, nonmatching, shared, and transferred targets | Tag recognition and declared response hold; no target selection by construct ID; missing sensors handled; inhibition/recovery explained; supported feedback survives save/load | 1–3, 5 |

## Requirement coverage

This retains all 30 source requirements and their owning parent tickets. Each linked parent now has executable leaves above. This matrix is a coverage map, not evidence that the requirement is complete. Use the source specification for the full requirement wording and the candidate build for proof.

| Requirement | First proof | Owning parent tickets | Release evidence | Complete |
|---|---|---|---|---|
| V01 — focal cell and starting population | 1 | [S1-01](#s1-01), [S1-02](#s1-02), [S1-20](#s1-20) | A01/A18; readable relationship between focal cell and surviving population | [ ] |
| V02 — no direct steering | 1 | [S1-10](#s1-10), [S1-11](#s1-11), [S5-10](#s5-10) | A04; inspect every player command, including return placement exceptions | [ ] |
| V03 — gene-mediated agency | 1 | [S1-20](#s1-20), [S1-22](#s1-22), [S6-05](#s6-05) | A02/A03/A18; unfamiliar players intentionally change outcomes | [ ] |
| V04 — genes and promoters | 1 | [S1-08](#s1-08), [S1-09](#s1-09), [S1-13](#s1-13), [S1-17](#s1-17) | A03; constitutive and conditional strategies with real costs and feedback | [ ] |
| V05 — spatial targeting | 1 | [S1-10](#s1-10), [S4-05](#s4-05) | A04; orientation, assembly, growth, and division have consistent rules | [ ] |
| V06 — survivor continuation | 1–2 | [S1-20](#s1-20), [S6-03](#s6-03) | A01; automatic/manual selection follows the chosen rule | [ ] |
| V07 — extinction | 2 | [S2-01](#s2-01), [S5-09](#s5-09), [S7-09](#s7-09) | A01/A11; active, stored, migrating, and temporarily unreachable cells handled | [ ] |
| V08 — division rewards | 1–2 | [S1-07](#s1-07), [S1-12](#s1-12), [S2-08](#s2-08), [S5-04](#s5-04) | A05/A09; event uniqueness and selected offline accrual policy | [ ] |
| V09 — environmental diversity | 3 | [S3-01](#s3-01)–[S3-07](#s3-07), [S3-13](#s3-13) | A03/A06; temperature, light, pH, salinity, flow, and microniches each affect a meaningful decision | [ ] |
| V10 — interspecies ecology | 3 | [S3-08](#s3-08)–[S3-12](#s3-12), [S5-06](#s5-06) | A07/A08; beneficial, commensal, and exploitative/antagonistic relationships arise from declared mechanisms | [ ] |
| V11 — owned named species | 1, 5 | [S1-01](#s1-01), [S5-01](#s5-01), [S8-06](#s8-06) | Stable identity through edits, transfer, storage, reconnection, and moderation | [ ] |
| V12 — interplayer gene transfer | 5 | [S5-07](#s5-07), [S5-08](#s5-08) | A08/A11; a real transfer has an observable genetic/phenotypic consequence under chosen acquisition rules | [ ] |
| V13 — evolutionary progression | 2–3 | [S2-06](#s2-06), [S8-02](#s8-02), [S8-04](#s8-04) | Valid graph; every relationship typed; no invented history presented as settled biology | [ ] |
| V14 — XY gameplay plane | 1, 4 | [S1-02](#s1-02), [S1-03](#s1-03), [S4-04](#s4-04) | Contacts, collision, movement, selection, and visual depth agree | [ ] |
| V15 — beautiful dimensional presentation | 4 | [S4-01](#s4-01)–[S4-08](#s4-08), [S6-04](#s6-04) | A17/A18; moving crowds and diagnostics remain attractive and legible | [ ] |
| V16 — vast persistent multiplayer | Early spike, 5, 7 | [S2-03](#s2-03)–[S2-05](#s2-05), [S7-01](#s7-01)–[S7-12](#s7-12) | A09–A16; quantified scale contract and recovery/operating-cost evidence | [ ] |
| V17 — solo-developed Steam release | 0, 9–10 | [S0-03](#s0-03), [S9-05](#s9-05)–[S9-08](#s9-08), [S10-01](#s10-01)–[S10-06](#s10-06) | Sustainable workload; accepted launch checklist; reproducible distributable builds | [ ] |
| V18 — whole-species edits | 1–2 | [S1-15](#s1-15), [S1-16](#s1-16), [S2-05](#s2-05), [S5-04](#s5-04) | A02/A11/A12; cross-region, newborn, transferred, and stored-member adoption rules | [ ] |
| V19 — selected departure lifecycle | 2, 5 | [S2-09](#s2-09), [S5-09](#s5-09), [S7-06](#s7-06) | A10/A11/A18; selected withdrawal/return policy works; A09 if active absence retained | [ ] |
| V20 — reduced return into similar conditions | 2, 5–7 | [S2-09](#s2-09), [S5-09](#s5-09), [S9-03](#s9-03) | A10/A11/A16; attrition, matching, capacity, one-cell boundary, and no-match behavior | [ ] |
| V21 — continuous optimization | 1, 6 | [S1-21](#s1-21), [S1-22](#s1-22), [S6-04](#s6-04), [S9-02](#s9-02) | A19; useful actions during pending edits and low division income | [ ] |
| V22 — mandatory edit delay | 1, 5 | [S1-14](#s1-14)–[S1-16](#s1-16), [S5-04](#s5-04), [S5-10](#s5-10) | A20; no early effects, stale/queued changes handled, steering-like sequences tested | [ ] |
| V23 — functional gene modules | 1–3 | [S1-05](#s1-05), [S2-07](#s2-07), [S8-02](#s8-02) | Starter ATP-synthase expression has an observable function/cost; module abstractions documented | [ ] |
| V24 — shared-promoter constructs | 1–2 | [S1-08](#s1-08), [S1-09](#s1-09), [S1-13](#s1-13), [S1-17](#s1-17) | A21; one-to-many activation, linked settings, actual output, and edit costs visible | [ ] |
| V25 — personal cell map | 1, 4–6 | [S1-18](#s1-18), [S1-19](#s1-19), [S4-06](#s4-06), [S5-05](#s5-05) | A22; abundance/localization and target/actual/pending states correctly distinguished | [ ] |
| V26 — receptor-gated sensing | 1–3 | [S1-08](#s1-08), [S1-09](#s1-09), [S3-03](#s3-03)–[S3-07](#s3-07) | A23; absent or inactive sensing machinery cannot supply a functional controller input | [ ] |
| V27 — mutation spending purposes | 1–2, 5 | [S1-12](#s1-12)–[S1-15](#s1-15), [S2-06](#s2-06)–[S2-08](#s2-08), [S5-04](#s5-04) | A24; each selected operation charges once, obeys eligibility, and fits continuous pacing | [ ] |
| V28 — sandbox progression | 1, 6–9 | [S1-22](#s1-22), [S6-05](#s6-05), [S9-02](#s9-02) | Self-directed goals and repeated experiments; no mandatory win condition | [ ] |
| V29 — multiple hostile mechanisms | 3, 5–8 | [S3-09](#s3-09)–[S3-11](#s3-11), [S5-06](#s5-06)–[S5-08](#s5-08) | A25; predation, secretions, and injection have observable costs and counterplay | [ ] |
| V30 — expressed regulators | 1–3, 5 | [S1-08](#s1-08), [S1-09](#s1-09), [S1-17](#s1-17), [S5-08](#s5-08) | A26; regulator-dependent repression is distinct from direct Boolean logic and visible in local diagnostics | [ ] |

## Session handoff and completion record

Use one active leaf task at a time. Planning, code generation and a successful compile alone do not satisfy its completion criterion.

```text
Task ID / current status:
Source parent and relevant specification sections:
Approved or provisional policies used:
Files/interfaces allowed to change:
Smallest observable outcome:
Implementation constraints:
Verification command or exact interaction steps:
Expected result:
Actual result / commit / build / evidence path:
Focused time spent:
Remaining limitation or split child IDs:
Next dependency-ready task:
```

Suggested coding-assistant handoff:

```text
Implement only <leaf ID> from the Prokaryon task backlog.
Read <relevant existing code> and <spec sections/policy records> first.
Preserve confirmed gameplay rules and the simulation/presentation boundary.
If a necessary product rule is unresolved, identify it and propose a bounded
prototype choice; do not silently make it permanent.
The task is done when: <copy the leaf completion criterion>.
Run only the checks needed for this behavior and any required project gates.
Report changed files, assumptions, reproduction steps, result and limitations.
Do not implement the next feature as part of this task.
```

### Gate review record

```text
Gate / date / candidate commit and content version:
Required parent tasks and any conditional N/A decisions:
Acceptance fixtures and actual results:
Hardware / seeds / network profile / participant count where relevant:
Unresolved defects and product decisions:
Decision: pass / repair / explicitly revise scope:
Owner-approved scope changes, if any:
Next smallest work item:
```

### Scheduling rule

Record actual focused effort for the first completed tasks and first repeated content entries. Estimate the next milestone from those observations, including debugging, integration and external-test time. Do not multiply 580 by an assumed average to announce a release date. The most uncertain work—fun, ecology, production art cost and vast-world performance—has explicit experiments and gates because it can require redesign.

### Change control for this companion

Keep `Sx-yy` parent identities aligned with specification §15. Add leaf suffixes as needed; do not renumber completed work. When a design decision changes, record affected leaves, fixtures and migrations. If the main specification gains or removes a requirement, update the coverage table and relevant parent tasks here. Mark source-version drift explicitly before resuming an old plan.

**Next task:** S0-01.01. The first game-code milestone remains G0, followed by the complete local genetic loop at G1.
