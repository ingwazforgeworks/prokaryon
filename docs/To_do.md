# Prokaryon — To do

What has to land before the sandbox feels like a game you can finish, fail, and come back to.
The loop that already plays — swimming, the genome editor, ferron and sulfex respiration,
expression upkeep, starvation / heat / shrivel death, division, and sister cells — stays.
Items below are the gaps around that loop.

## Feel of a run

- [ ] **Save and load a cell.** The menu's Load Cell still says there are no saved cells. A save needs position, stores, vitals, genome, unlocks, and the species name. The species name is rolled again on every boot, and the debug cell snapshot is a separate local store from the genome.
- [ ] **One goal and a first minute of direction.** A single banner (reach a depth, hold a population, survive a day/night) and a short first-run hint: move, probe the water, open the genome and add a construct. No quest log.
- [ ] **The deep column has something in it.** The floor is dark and bare next to the surface. Deposits, vents, and something alive or edible down there, so depth is a place rather than a fade to black.

## Metabolism the catalog already promises

Fluxin and Refluxin are one carrier pool. A reductase burns fuel and recharges Refluxin into Fluxin. ATP synthase spends Fluxin, returns two ATP, and leaves Refluxin. Fluxin Synthase sets the size of that pool. The slower of the reductase and the synthase sets the ATP rate.

- [x] **Run the chain.** Permease fills a fuel pool. Ferron Reductase, Sulfex Reductase, Ferrosulfex Reductase, and Nitroxidex Reductase recharge the carrier. ATP synthase, tagged TransmembraneSignal, turns Fluxin into ATP. An empty ATP pool stalls the motors and, if upkeep keeps going unmet, kills the cell.
- [ ] **Acceptors change the yield.** Oxidex Reductase (and the anoxic alternatives Lipron Reductase and Carbex Reductase) should multiply what ATP synthase gets from Fluxin. Nitroxidex Reductase already spends imported oxidex as one half of a paired charge. The yield multiplier itself is still unwired.
- [ ] **Nitrox is for growth.** Nitroxidex Reductase can burn Nitrox with Oxidex to recharge the carrier. Assimilating Nitrox should also be what lets Anabolase build the cell, so a cell can spend it on energy and still be unable to divide.
- [ ] **Growth spends stores.** Anabolase currently enlarges the cell from expression level and time. Division should wait on accumulated biomass, and that biomass should cost carbon, nitrogen, and ATP.
- [ ] **Thrust spends ATP.** Cassette upkeep is a flat drain. Flagella and cilia should cost more while they are actually pushing, so sprinting starves you faster than drifting. Motors already stop at an empty pool.
- [ ] **A reserve.** Granulin granules are drawn and do not store anything. Granulin Synthase / Hydrolase should bank surplus glycon and pay it back during a lean stretch, at a loss.

## Stress the water already has

Heat above 62°C, a deep osmotic shrivel, and unmet ATP upkeep already wear integrity down to death. The other fields are on screen and do not touch the cell.

- [ ] **Cold.** The column settles near 4°C away from the sun and the vents. Lethal cold should exist, with a gene that resists it, the way heat already does.
- [ ] **Pressure.** The pressure field and the baroreceptor are in the game. Depth should crush an unprotected cell, and the receptor should be able to tell a construct about it.
- [ ] **Water that actually moves.** Aquaporin opens or closes, and osmoprotectin limits shrivel, but the gene record still says the water flux itself is not simulated. Turgor in thin water and shrivel in rich water should change on a rate the channel controls, and the body should show it.
- [ ] **Damage you can see.** Integrity loss should tear or blister the membrane, not only pale and tint the cytoplasm.

## The rest of the genome doing work

- [ ] **The other receptors.** Only the Osmolyn Receptor publishes a signal a conditional promoter can read. Temperature, pressure, ATP, the fuels, light, and reflux need the same path, or the receptor icons are a menu of switches that do nothing.
- [ ] **Prices that are not all 1.** Purchasable genes cost 1 mutation point, and upkeep is a small table on the promoter and the amount, not on the gene. A motor, a reductase, and a pigment should not be the same purchase and the same drain.
- [ ] **Pili that do a job.** They draw, and secreted pilin ejects. Adhesion or conjugation is the missing half, so a pilus is a tool rather than a coat.
- [ ] **Neighbors matter once.** Sister cells copy the genome and live their own stores. One shared effect — a public secretion, conjugation, or competition for a plume — makes the population a reason to divide.

## Performance

Not a rewrite. These are the places a hitch will come from if the frame rate drops. Measure before changing the look of the water.

- [ ] **Nutrient grid.** Dissolved nutrients are a 240×1000 field (one world unit per cell, four channels) over the whole column. Diffusion is limited to dirty rows, and a wide plume still walks a lot of cells on the half-second step. Coarsen open water, or step that field off the frame that draws the cell.
- [ ] **Flagella and cilia on the CPU.** Each filament is rebuilt into a ribbon every frame, including title-screen swimmers (up to a few hundred). Bodies are already one instanced draw. Drop filament detail for cells that are small on screen, and cap the title swarm.
- [ ] **Full-frame redraw.** The world framebuffer is cleared and redrawn every frame, then presented. A static background layer (rock, far decorations) can stay in its own target and composite, so a calm moment is not a full scene rebuild.
- [ ] **Probe text.** With the environment probe held open, every frame rewrites its DOM rows. Write only when a displayed value changes.

## Deliberately not next

The external simulation socket, multiplayer, and filling out every catalog gene with its own module. New genes should go through the fuel / Fluxin / ATP chain above, not another one-off burner.
