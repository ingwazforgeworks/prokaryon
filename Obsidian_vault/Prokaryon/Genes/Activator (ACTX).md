**Gene ID:** ACTX  
**Gene Name:** Activator  
**Category:** [[Regulation]]  
**Status:** Proposed  
**Description:** An expressed protein that binds promoters carrying a matching [[Operator Tag]] and raises their output above what their own condition would produce. The positive counterpart to [[Repressor (REPX)]].  
**Inputs:** [[Biomass]], [[ATP]]; driven by whatever promoter the player attaches to it  
**Outputs:** Amplification of every promoter carrying its target tag  
**Expression scaling:** [[Saturating Scaling]] — amplification has a ceiling  
**Genetic Prerequisites:** None  
**Other Prerequisites:** At least one promoter must carry the matching tag  
**Default Localization:** Cytosol  
**Tradeoff:** Amplifying expression does not amplify the resources expression needs. An activator can push a gene's target output past what the cell can actually synthesise, at which point it is spending capacity to raise a number that no longer moves. It also cannot exceed [[Expression Capacity]].  
**Design basis:** Transcriptional activators binding upstream operator sequences.

**Cascades and their cost.** An activator driven by a condition, tagged to promoters that drive further regulators, lets a player build a response that grows over time rather than switching. That is expressive and it is where instability lives: specification §5.4 recommends hysteresis or adaptation to prevent flicker around thresholds, and an activator feeding a promoter that drives the activator is a positive feedback loop the simulation must bound.

Backlog decision bundle R04 covers exactly this — feed-forward logic is easier to debug, stateful feedback enables dynamics and requires bounded stable updates. Until that is settled, treat activator cascades as prototype content. See [[Memory Latch (MEML)]].
