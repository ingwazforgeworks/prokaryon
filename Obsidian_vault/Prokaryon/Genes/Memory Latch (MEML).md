**Gene ID:** MEML  
**Gene Name:** Memory Latch  
**Category:** [[Regulation]]  
**Status:** Open — depends on decision bundle R04  
**Description:** A pair of mutually repressing regulators that settle into one of two stable states. Once a cue pushes the latch over, it stays there after the cue disappears — the cell remembers that something happened.  
**Inputs:** [[Biomass]], [[ATP]]; a triggering condition and a resetting condition  
**Outputs:** A persistent regulatory state usable by any tagged promoter  
**Expression scaling:** [[Threshold Scaling]] — bistable by construction  
**Genetic Prerequisites:** [[Repressor (REPX)]]  
**Other Prerequisites:** Distinct set and reset conditions must both be configured  
**Default Localization:** Cytosol  
**Tradeoff:** Memory is a commitment. A latched cell keeps behaving as though the trigger condition holds long after it has passed, and a badly configured latch with no reachable reset condition is permanent — inherited by every descendant until the player edits the genome.  
**Design basis:** Bistable genetic toggle switches built from mutual repression.

**What it solves.** Every other regulator in [[Regulation]] is reactive, which makes cells flicker at threshold boundaries and forget crises the moment they ease. A latch lets a lineage commit: enter dormancy through [[Sporulase (SPOR)]] and stay there, or begin the [[Phototrophy]] build-out and finish it rather than abandoning it in the first patch of shade.

**Why it is Open.** Specification §5.2 rates memory as part of the most expressive and most difficult regulatory option, with harder onboarding, debugging, execution limits and multiplayer validation. Backlog bundle R04 has to choose between feed-forward-only logic and bounded stateful feedback first. If feed-forward is selected, this gene is cut rather than simplified.

**Implementation caution.** A bistable pair is a feedback loop evaluated every simulation step, across every cell, on the server. It needs a bounded stable update rule and a deterministic resolution order before it can exist at all — see backlog tasks S1-08 and S1-09.
