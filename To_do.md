# Prokaryon — Prioritized To Do

Guiding rule: every task must end in something the player can *feel* (and we can verify in a
headless browser). Breadth waits until the loop is closed. Current state: motility, rendering,
environment fields, genome editor, and FLGN expression work end-to-end; everything below is
what stands between the current sandbox and a playable game.

## P0 — Survival spine (the game must be able to end)

- [ ] **ATP maintenance drain + death.** Basal ATP consumption each tick (new `metabolism.ts`
  tick in `main.ts`); more drain for more flagella/movement. At 0 ATP the cell dies (fade out,
  then respawn or take over a sister cell — decide during implementation). *Done when: an idle
  cell with no energy genes visibly starves and dies; `updateResource()` finally has a caller.*
- [ ] **One complete energy chain from the environment.** Ambient Sulfex (already simulated and
  depth-distributed) + Sulfex permease gene → intracellular Sulfex → FLUX → Fluxin → ATPS → ATP.
  Reuse the flagellin pattern: CNST promoter + expressed gene → effect. *Done when: cell near a
  sulfex plume with the permease construct survives, and one without it starves.*
- [ ] **Movement costs ATP.** Flagellar thrust drains ATP per tick so motility is a budget, not
  a free right. *Done when: sprinting everywhere kills you faster than drifting.*

## P1 — Adaptation loop (genome editing must be the answer)

- [ ] **Division gated on Biomass via ANAB.** Division consumes accumulated biomass instead of
  the size slider threshold; ANAB produces biomass from carbon + nitrogen + ATP. *Done when: a
  starved cell cannot divide and a well-fed one can.*
- [ ] **MP earned on division.** `finishDivision()` grants mutation points; debug +/- buttons
  demoted to dev-only. *Done when: the only way to afford FLGN on a fresh save is to divide.*
- [ ] **Wire 2–3 more genes to real effects** (one at a time, flagellin-style): next candidates
  are the permease from P0, a storage gene (GRNS/GRNH) for buffering starvation, and pigment
  genes replacing the debug pigment sliders.
- [ ] **Expression monitor live data.** Drive `publishExpressionSample()` from the real
  simulated rates so the Expression dock shows truth, not preview curves.

## P2 — Direction (once surviving and adapting work)

- [ ] **One objective.** A single banner goal (e.g. "reach population 8" or "survive 5 minutes")
  with success feedback. No quest system.
- [ ] **Minimal onboarding.** 3-step overlay after New Cell: move, probe the environment
  (V), open the genome editor (G) and add a construct. Delete placeholder inspect copy.
- [ ] **Save/load cell.** Persist position, morphology, resource snapshot; wire the stubbed
  "Load Cell" menu button. New Cell should reset genome/unlocks for a real run.

## P3 — Depth (post-MVP, in rough order of leverage)

- [ ] Tech-tree costs + prerequisites for the core metabolism genes (edge data already exists).
- [ ] Depth ecology: oxidex (surface) vs sulfex (depth) determine which metabolism works where.
- [ ] Temperature stress: lethal hot/cold zones using the existing temperature field.
- [ ] Conditional/graded/oscillating promoters + chemoreceptor inputs (COND, GRAD, OSCL, THRS).
- [ ] Pili function (adhesion/conjugation) — currently visual only.
- [ ] Currents/advection in the fluid field (original backlog item).
- [ ] Multiplayer/external sim session integration (currently optional, unused by gameplay).

## Deliberately deferred

More gene breadth (87-gene catalog), art polish, audio, multiplayer infrastructure, and
balancing passes — until the P0/P1 spine proves out. Building content on top of a loop that
can't end is the classic trap.