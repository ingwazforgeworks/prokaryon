/**
 * Runtime catalog: the name, category, and description the game shows.
 * Destination rules live in geneLocalization.ts. Mutation-point prices live
 * in geneUnlocks.ts. public/gene-data.json is the Gene Maker's authoring
 * file and is not read by the simulation.
 */
export type GeneRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
};

export const GENES: GeneRecord[] = [
  {
    "id": "ATPS",
    "name": "ATP Synthase",
    "category": "Metabolism",
    "description": "Sits in the membrane and spends Fluxin to make ATP, two ATP for each Fluxin. The spent carrier comes back as Refluxin. The part has to be tagged TransmembraneSignal."
  },
  {
    "id": "ANAB",
    "name": "Anabolase",
    "category": "Reproduction",
    "description": "Grows the cell while it is expressed."
  },
  {
    "id": "AZOH",
    "name": "Azoite Hydrolase",
    "category": "Metabolism",
    "description": "Digests compacted nitrogen-rich residue in sediment, releasing dissolved Nitrox. Because Nitrox is the only nitrogen source in the game, this gene unlocks growth rather than merely energy — for its producer and for everything nearby."
  },
  {
    "id": "BFP",
    "name": "Blue Fluorescent Protein",
    "category": "Pigmentation",
    "description": "Emits blue light from chemical energy. The glow is the cell's own, and it is independent of the body colour its pigments give it."
  },
  {
    "id": "CBXP",
    "name": "Carbex Permease",
    "category": "Metabolism",
    "description": "Concentrates dissolved inorganic carbon inside the cell. Carbex is abundant almost everywhere but too dilute to fix at a useful rate, so this transporter exists to raise the internal concentration rather than to gain access to something unavailable."
  },
  {
    "id": "CBXR",
    "name": "Carbex Reductase",
    "category": "Metabolism",
    "description": "A terminal respiratory module for carbon-rich anoxic water. Passes electrons to dissolved Carbex instead of Oxidex, giving a moderate ATP yield in places the better acceptor never reaches."
  },
  {
    "id": "CRTS",
    "name": "Carotin Synthase",
    "category": "Pigmentation",
    "description": "Builds Carotin, the pigment that harvests blue light and safely discards energy the cell cannot use. Both an antenna and a safety valve."
  },
  {
    "id": "CRYP",
    "name": "Cryptochrome Synthase",
    "category": "Pigmentation",
    "description": "Builds Cryptochrome, the deep blue body pigment. Neither an antenna nor a chelator: the one pigment whose only job is colour, and the darkest shade a cell can wear."
  },
  {
    "id": "CHLS",
    "name": "Chlorin Synthase",
    "category": "Pigmentation",
    "description": "Builds Chlorin, the primary light-harvesting pigment. The only pigment efficient enough to drive a reaction centre hard enough to produce Reducin, and therefore a hard prerequisite for autotrophy."
  },
  {
    "id": "FRMP",
    "name": "Fermentate Permease",
    "category": "Metabolism",
    "description": "Imports Fermentate, the acidic waste other cells excrete when respiring without an electron acceptor. Somebody else's garbage, still holding usable energy."
  },
  {
    "id": "FCTR",
    "name": "Ferracite Reductase",
    "category": "Metabolism",
    "description": "Reduces mineral iron in place at the point of contact, freeing Ferron directly against the cell's own membrane. The slow, anchored, defensible route to mineral iron."
  },
  {
    "id": "FERR",
    "name": "Ferron Reductase",
    "category": "Metabolism",
    "description": "Burns stored Ferron to recharge Refluxin into Fluxin. ATP synthase spends that Fluxin and returns the carrier as Refluxin."
  },
  {
    "id": "FSXR",
    "name": "Ferrosulfex Reductase",
    "category": "Metabolism",
    "description": "Burns stored Ferron and Sulfex together and recharges three Refluxin into Fluxin for each pair of fuel units. Once ATP synthase spends that Fluxin, the meal yields more ATP than burning the two fuels apart."
  },
  {
    "id": "FERP",
    "name": "Ferron Permease",
    "category": "Metabolism",
    "description": "Allows Ferron to be imported into the cell."
  },
  {
    "id": "FLUX",
    "name": "Fluxin Synthase",
    "category": "Metabolism",
    "description": "Sets the size of the cell's Fluxin pool. A larger pool carries the cell through lulls in fuel or expression. New carrier arrives as Refluxin, and a reductase has to recharge it before ATP synthase can spend it."
  },
  {
    "id": "GLYH",
    "name": "Glycon Hydrolase",
    "category": "Metabolism",
    "description": "Breaks down insoluble carbohydrate-like material in environmental deposits and biological debris, releasing dissolved Glycon. Nearby cells can compete for the liberated nutrient."
  },
  {
    "id": "GLYP",
    "name": "Glycon Permease",
    "category": "Metabolism",
    "description": "Transports extracellular Glycon across the cell membrane, making it available for intracellular metabolism."
  },
  {
    "id": "GLYS",
    "name": "Glycon Synthase",
    "category": "Metabolism",
    "description": "Fixes inorganic carbon into usable organic fuel. Combines concentrated Carbex with Reducin and ATP to build Glycon inside the cell, completing the autotrophic route."
  },
  {
    "id": "GRNH",
    "name": "Granulin Hydrolase",
    "category": "Metabolism",
    "description": "Depolymerises stored Granulin back into usable intracellular Glycon. The withdrawal half of the storage system, and useless without a store to draw on."
  },
  {
    "id": "GRNS",
    "name": "Granulin Synthase",
    "category": "Metabolism",
    "description": "Polymerises surplus intracellular Glycon into insoluble Granulin granules. Converts food the cell cannot use now into food it can reach later, at a loss."
  },
  {
    "id": "GFP",
    "name": "Green Fluorescent Protein",
    "category": "Pigmentation",
    "description": "Emits green light from chemical energy. The glow is the cell's own, and it is independent of the body colour its pigments give it."
  },
  {
    "id": "LIPH",
    "name": "Lipron Hydrolase",
    "category": "Metabolism",
    "description": "Breaks down biological debris outside the cell, releasing accessible Lipron. The liberated nutrient can be absorbed by the producer or scavenged by nearby cells."
  },
  {
    "id": "LIPR",
    "name": "Lipron Reductase",
    "category": "Metabolism",
    "description": "A terminal respiratory module for lipid-rich anoxic water. Passes electrons to dissolved Lipron instead of Oxidex, giving a moderate ATP yield in places the better acceptor never reaches."
  },
  {
    "id": "LIPP",
    "name": "Lipron Permease",
    "category": "Metabolism",
    "description": "Transports Lipron into the cell for metabolism."
  },
  {
    "id": "NITA",
    "name": "Nitrox Assimilase",
    "category": "Metabolism",
    "description": "Incorporates nitrogen from Nitrox into a form Anabolase (ANAB) can build with. Without it a cell can burn Nitrox for energy but cannot use it to grow, which is the distinction this gene exists to create."
  },
  {
    "id": "NITP",
    "name": "Nitrox Permease",
    "category": "Metabolism",
    "description": "Allows Nitrox to be imported into the cell."
  },
  {
    "id": "NITR",
    "name": "Nitrox Reductase",
    "category": "Metabolism",
    "description": "A terminal respiratory module for nitrogen-bearing anoxic water. Passes electrons to dissolved Nitrox instead of Oxidex, giving a moderate ATP yield in places the better acceptor never reaches."
  },
  {
    "id": "NXDR",
    "name": "Nitroxidex Reductase",
    "category": "Metabolism",
    "description": "Burns stored Nitrox and Oxidex together and recharges three Refluxin into Fluxin for each pair of fuel units. Once ATP synthase spends that Fluxin, the meal yields more ATP than a single-fuel charge."
  },
  {
    "id": "OXDP",
    "name": "Oxidex Permease",
    "category": "Metabolism",
    "description": "Allows Oxidex to be imported into the cell."
  },
  {
    "id": "OXDR",
    "name": "Oxidex Reductase",
    "category": "Metabolism",
    "description": "A terminal respiratory module. Passes spent electrons to Oxidex, which multiplies the ATP that ATP Synthase (ATPS) extracts from each unit of Fluxin and suppresses Fermentate excretion. The single largest economic upgrade in the game."
  },
  {
    "id": "PHOR",
    "name": "Photorhodin",
    "category": "Pigmentation",
    "description": "A light-driven pump built from one protein and one cheap pigment. Absorbs Light and produces Fluxin directly, with no antenna complex, no reaction centre, and no reducing power. The cheapest way to get energy out of light and the most limited."
  },
  {
    "id": "PHYS",
    "name": "Phycin Synthase",
    "category": "Pigmentation",
    "description": "Builds Phycin, a large accessory antenna that harvests the green and orange light Chlorin leaves behind. The specialist pigment for living in somebody else's shadow."
  },
  {
    "id": "RXNC",
    "name": "Reaction Center",
    "category": "Pigmentation",
    "description": "A photochemical complex that converts harvested light energy into both Fluxin and Reducin. The only route in the catalog that supplies energy and reducing power together, and therefore the only route to full autotrophy."
  },
  {
    "id": "RFP",
    "name": "Red Fluorescent Protein",
    "category": "Pigmentation",
    "description": "Emits red light from chemical energy. The glow is the cell's own, and it is independent of the body colour its pigments give it."
  },
  {
    "id": "RDCD",
    "name": "Reducin Dehydrogenase",
    "category": "Metabolism",
    "description": "Diverts the energy intermediate into reducing power. Converts Fluxin into Reducin, the electron supply that biosynthesis needs and that ATP cannot substitute for."
  },
  {
    "id": "RHDS",
    "name": "Rhodin Synthase",
    "category": "Pigmentation",
    "description": "Builds Rhodin, the cheapest pigment in the game. One small molecule that can either drive a light pump directly or give a Photochrome (PCHR) receptor its mid-spectrum sensitivity."
  },
  {
    "id": "SIDP",
    "name": "Siderin Permease",
    "category": "Metabolism",
    "description": "Recovers loaded Siderin from the water — the chelator plus the Ferron it has captured — and brings both inside. The retrieval half of the chelation strategy."
  },
  {
    "id": "SIDS",
    "name": "Siderin Synthase",
    "category": "Pigmentation",
    "description": "Secretes Siderin, a chelator that binds mineral iron and carries it into solution. Frees Ferron from Ferracite at a distance, without the cell needing to touch the mineral."
  },
  {
    "id": "SLFP",
    "name": "Sulfex Permease",
    "category": "Metabolism",
    "description": "Allows Sulfex to be imported into the cell."
  },
  {
    "id": "SLFR",
    "name": "Sulfex Reductase",
    "category": "Metabolism",
    "description": "Burns stored Sulfex to recharge Refluxin into Fluxin, on the same terms as Ferron Reductase."
  },
  {
    "id": "THNL",
    "name": "Thionite Lyase",
    "category": "Metabolism",
    "description": "Dissolves sulfide mineral crust on contact, releasing Sulfex. Works only against material the cell is physically touching, so it is useless to a drifting cell however strongly it is expressed."
  },
  {
    "id": "YFP",
    "name": "Yellow Fluorescent Protein",
    "category": "Pigmentation",
    "description": "Emits yellow light from chemical energy. The glow is the cell's own, and it is independent of the body colour its pigments give it."
  },
  {
    "id": "ACDT",
    "name": "Acid Tolerase",
    "category": "Homeostasis",
    "description": "Reconfigures the cell's proteins and envelope to function across a wider range of pH instead of defending one narrow optimum. The cell stops caring about pH rather than controlling it."
  },
  {
    "id": "AQUP",
    "name": "Aquaporin",
    "category": "Homeostasis",
    "description": "Lets water cross the membrane much faster."
  },
  {
    "id": "CSP",
    "name": "Cold Shock Protein",
    "category": "Homeostasis",
    "description": "Keeps the cell's synthesis machinery working as Temperature falls, preventing the molecular stalling that otherwise brings expression to a halt in cold water. Extends the lower end of the habitable range."
  },
  {
    "id": "DEFN",
    "name": "Envelope Defensin",
    "category": "Homeostasis",
    "description": "Surface proteins that disrupt contact-dependent attack machinery, preventing an Effector Injector (EFFI) from completing delivery. Defends against being injected and against nothing else."
  },
  {
    "id": "HSP",
    "name": "Heat Shock Protein",
    "category": "Homeostasis",
    "description": "Holds proteins in their working shape as Temperature rises, and refolds those that have already come apart. Extends the range over which the cell functions without changing where it functions best."
  },
  {
    "id": "LYSR",
    "name": "Lysin Resistase",
    "category": "Homeostasis",
    "description": "Binds and neutralises Lysin before it can damage the envelope. Specific to diffusible toxin and useless against anything else."
  },
  {
    "id": "MDES",
    "name": "Membrane Desaturase",
    "category": "Homeostasis",
    "description": "Introduces double bonds into membrane lipids, raising fluidity. Keeps the envelope workably fluid as Temperature falls, and shifts the cell's optimum downward into the cold."
  },
  {
    "id": "MSAT",
    "name": "Membrane Saturase",
    "category": "Homeostasis",
    "description": "Removes double bonds from membrane lipids, lowering fluidity. Keeps the envelope from becoming dangerously loose as Temperature rises, and shifts the cell's optimum upward into the heat."
  },
  {
    "id": "OSMP",
    "name": "Osmoprotectin Synthase",
    "category": "Homeostasis",
    "description": "Shields the cell from osmolyn stress."
  },
  {
    "id": "OSMS",
    "name": "Osmolyn Synthase",
    "category": "Homeostasis",
    "description": "Builds Osmolyn, the internal solute that matches the cell's water potential to the water outside it. The standard defence against Salinity, and the reason salinity acts as a growth tax rather than a wall."
  },
  {
    "id": "OXDT",
    "name": "Oxidex Detoxase",
    "category": "Homeostasis",
    "description": "Neutralises the reactive byproducts of Oxidex before they damage the cell. The gene that makes oxygen-rich water survivable rather than merely profitable."
  },
  {
    "id": "PHPR",
    "name": "Photoprotectin",
    "category": "Homeostasis",
    "description": "Dissipates captured light energy that the cell cannot safely use, converting a damaging excess into harmless heat. Protection bought by throwing away exactly the resource the cell went to the light to collect."
  },
  {
    "id": "PPMP",
    "name": "Protopump",
    "category": "Homeostasis",
    "description": "Pumps acid out of the cell to hold the interior near its optimum, regardless of how acidic the surrounding water becomes. Defends the cell and acidifies its neighbourhood in the same action."
  },
  {
    "id": "REPR",
    "name": "Repairase",
    "category": "Homeostasis",
    "description": "Clears accumulated damage of any origin — thermal, oxidative, acid, toxin. The general-purpose undo, effective against everything and efficient against nothing."
  },
  {
    "id": "ADHN",
    "name": "Adhesin",
    "category": "Cell Shape",
    "description": "Surface proteins that make the cell stick to debris, minerals, and terrain. Once attached, the cell stops being carried by Flow and stays where it is. It does not bind other cells."
  },
  {
    "id": "COHS",
    "name": "Cohesin",
    "category": "Cell Shape",
    "description": "Surface proteins that make the cell stick to other cells of the same type. The clump holds in open water, and the protein ignores debris, minerals, terrain, and every other type of cell."
  },
  {
    "id": "LUBR",
    "name": "Lubricin",
    "category": "Cell Shape",
    "description": "Lets the cell slide along surfaces."
  },
  {
    "id": "BALA",
    "name": "Ballastin",
    "category": "Motility",
    "description": "Makes the cell sink through the water."
  },
  {
    "id": "BDEL",
    "name": "Bdellase",
    "category": "Cell Shape",
    "description": "Attaches to another cell, breaches its envelope, and digests its contents in place. The only gene in the catalog that treats another player's cell as a food source rather than as competition."
  },
  {
    "id": "BUOY",
    "name": "Buoyin",
    "category": "Motility",
    "description": "Makes the cell rise through the water."
  },
  {
    "id": "CAPS",
    "name": "Capsulin Synthase",
    "category": "Cell Shape",
    "description": "Lays down a Capsulin polymer layer on the cell's own surface. Protection that travels with the cell and shelters nobody else."
  },
  {
    "id": "CRST",
    "name": "Crescentin",
    "category": "Cell Shape",
    "description": "Bends the cell into a crescent."
  },
  {
    "id": "CRYS",
    "name": "Crystallin",
    "category": "Cell Shape",
    "description": "Coats the cell in crystal."
  },
  {
    "id": "EFFI",
    "name": "Effector Injector",
    "category": "Cell Shape",
    "description": "A contact-dependent apparatus that delivers a protein payload directly into an adjacent cell. Precise, expensive, and dependent on sustained contact the player cannot command."
  },
  {
    "id": "ELGN",
    "name": "Elongin",
    "category": "Cell Shape",
    "description": "Stretches the cell longer and narrower."
  },
  {
    "id": "ENVT",
    "name": "Envelope Thickener",
    "category": "Cell Shape",
    "description": "Reinforces the cell envelope, making it harder for toxins to enter and harder for predators to breach. Armour built out of the same material the cell would otherwise grow with."
  },
  {
    "id": "FLOA",
    "name": "Floatin",
    "category": "Motility",
    "description": "Builds gas vesicles and raises the gas-filled fraction of the cell's volume. The more of the interior is gas, the lower the cell's density."
  },
  {
    "id": "GRTN",
    "name": "Girthin",
    "category": "Cell Shape",
    "description": "Makes the cell shorter and wider."
  },
  {
    "id": "ISPR",
    "name": "Isoprene Synthase",
    "category": "Cell Shape",
    "description": "Coats the cell in isoprene."
  },
  {
    "id": "LYSS",
    "name": "Lysin Synthase",
    "category": "Cell Shape",
    "description": "Secretes Lysin, an envelope-damaging agent that diffuses through the surrounding water. Harms every susceptible cell in range without distinguishing targets, including the producer's own kin."
  },
  {
    "id": "MTXS",
    "name": "Matrixin Synthase",
    "category": "Cell Shape",
    "description": "Secretes Matrixin, the polymer that accumulates into a biofilm. Unlike other secretions it does not drift away, so a group expressing it builds a persistent structure with measurably different transport properties from the water around it."
  },
  {
    "id": "SHPD",
    "name": "Shape Determinant",
    "category": "Cell Shape",
    "description": "Sets the cell's body plan: compact sphere, elongated rod, or extended filament. Changes surface area, drag, collision behaviour and how the cell sits against a surface, all at once."
  },
  {
    "id": "SIZR",
    "name": "Size Regulator",
    "category": "Cell Shape",
    "description": "Sets the Biomass threshold at which the cell commits to Division. Small cells divide often and cheaply; large cells divide rarely and carry more reserves."
  },
  {
    "id": "TPRN",
    "name": "Taperin",
    "category": "Cell Shape",
    "description": "Narrows the cell where the protein gathers."
  },
  {
    "id": "FLGM",
    "name": "Flagellar Motor Protein",
    "category": "Motility",
    "description": "Spins a flagellum to push the cell."
  },
  {
    "id": "FLGN",
    "name": "Flagellin",
    "category": "Motility",
    "description": "Builds a flagellum on the cell."
  },
  {
    "id": "PILN",
    "name": "Pilin",
    "category": "Motility",
    "description": "Builds pili that grip a surface or shove the cell."
  },
  {
    "id": "CILN",
    "name": "Cilin",
    "category": "Motility",
    "description": "Builds rows of cilia on the cell."
  },
  {
    "id": "CILM",
    "name": "Ciliary Motor Protein",
    "category": "Motility",
    "description": "Beats cilia to row the cell."
  },
  {
    "id": "TAXR",
    "name": "Taxis Regulator",
    "category": "Motility",
    "description": "Couples a receptor reading to motor behaviour. Compares what a receptor reports now against what it reported moments ago, and biases the cell's turning rate accordingly: keep going when conditions improve, tumble when they worsen."
  },
  {
    "id": "CHMR",
    "name": "Chemoreceptor",
    "category": "Perception",
    "description": "Detects the concentration of one tagged solute and makes that reading available as a regulatory input. Reports a single number about the here and now, together with how it compares to the recent past."
  },
  {
    "id": "DMGR",
    "name": "Damage Receptor",
    "category": "Perception",
    "description": "Reports accumulated internal damage and misfolded protein load as a scalar. The cell's general alarm: it detects that something is going wrong without identifying what."
  },
  {
    "id": "OSMR",
    "name": "Osmolyn Receptor",
    "category": "Perception",
    "description": "Reports how much osmolyn is in the water touching the cell."
  },
  {
    "id": "PCHR",
    "name": "Photochrome",
    "category": "Pigmentation",
    "description": "A pigment-bound light receptor. Reports how bright it is in one spectral band, and nothing about where the light comes from."
  },
  {
    "id": "PHVC",
    "name": "Photovector",
    "category": "Pigmentation",
    "description": "Focuses incoming light through the cell body so that intensity differs measurably across the envelope, letting the cell infer which direction light arrives from. Supplies a direction, not just a brightness."
  },
  {
    "id": "PRTR",
    "name": "Protoreceptor",
    "category": "Perception",
    "description": "Reports internal pH as a scalar regulatory input. Measures the cell's own interior, which is the quantity that actually threatens it, rather than the water outside."
  },
  {
    "id": "QURR",
    "name": "Quoron Receptor",
    "category": "Perception",
    "description": "Detects Quoron concentration and reports it as a scalar. Because Quoron is emitted continuously by every cell expressing Quoron Synthase (QURS), its concentration is a proxy for how crowded the neighbourhood is."
  },
  {
    "id": "RDXN",
    "name": "Redoxin",
    "category": "Perception",
    "description": "Reports which electron acceptors are locally available by sensing the redox state of the cell's own electron carriers. Distinguishes rich Oxidex water from anoxic Sulfex water from water with neither."
  },
  {
    "id": "THMR",
    "name": "Thermoreceptor",
    "category": "Perception",
    "description": "Reports local Temperature as a scalar regulatory input, by way of a protein whose folding state shifts with heat."
  },
  {
    "id": "ATPR",
    "name": "ATP Receptor",
    "category": "Perception",
    "description": "Reports the cell's ATP reserve as a scalar regulatory input."
  },
  {
    "id": "BARR",
    "name": "Baroreceptor",
    "category": "Perception",
    "description": "Reports the hydrostatic pressure around the cell as a scalar regulatory input."
  },
  {
    "id": "CBXS",
    "name": "Carbex Receptor",
    "category": "Perception",
    "description": "Reports the Carbex concentration in the water touching the cell."
  },
  {
    "id": "FERS",
    "name": "Ferron Receptor",
    "category": "Perception",
    "description": "Reports the Ferron concentration in the water touching the cell."
  },
  {
    "id": "FLXR",
    "name": "Fluxin Receptor",
    "category": "Perception",
    "description": "Reports the cell's Fluxin reserve as a scalar regulatory input."
  },
  {
    "id": "LIPS",
    "name": "Lipron Receptor",
    "category": "Perception",
    "description": "Reports the Lipron concentration in the water touching the cell."
  },
  {
    "id": "NITS",
    "name": "Nitrox Receptor",
    "category": "Perception",
    "description": "Reports the Nitrox concentration in the water touching the cell."
  },
  {
    "id": "OXDS",
    "name": "Oxidex Receptor",
    "category": "Perception",
    "description": "Reports the Oxidex concentration in the water touching the cell."
  },
  {
    "id": "RFLR",
    "name": "Refluxin Receptor",
    "category": "Perception",
    "description": "Reports Refluxin as a scalar regulatory input."
  },
  {
    "id": "SLFS",
    "name": "Sulfex Receptor",
    "category": "Perception",
    "description": "Reports the Sulfex concentration in the water touching the cell."
  },
  {
    "id": "THGR",
    "name": "Thigmoreceptor",
    "category": "Perception",
    "description": "Reports physical contact against the cell envelope as a scalar regulatory input."
  },
  {
    "id": "ACTX",
    "name": "Activator",
    "category": "Regulation",
    "description": "An expressed protein that binds promoters carrying a matching Operator Tag and raises their output above what their own condition would produce. The positive counterpart to Repressor (REPX)."
  },
  {
    "id": "MEML",
    "name": "Memory Latch",
    "category": "Regulation",
    "description": "A pair of mutually repressing regulators that settle into one of two stable states. Once a cue pushes the latch over, it stays there after the cue disappears — the cell remembers that something happened."
  },
  {
    "id": "QURS",
    "name": "Quoron Synthase",
    "category": "Regulation",
    "description": "Emits Quoron continuously and cheaply. The molecule does nothing chemically; its only function is that its accumulated concentration reports how many emitters are nearby."
  },
  {
    "id": "REPX",
    "name": "Repressor",
    "category": "Regulation",
    "description": "An expressed protein that binds promoters carrying a matching Operator Tag and suppresses their output. The player's tool for turning one gene's activity into another gene's off switch."
  },
  {
    "id": "COMP",
    "name": "Competence Uptake",
    "category": "Reproduction",
    "description": "Takes up Ectodin, the genetic fragments released when cells die, and attempts to incorporate what it finds. Opportunistic scavenging of the local gene pool rather than a deliberate exchange."
  },
  {
    "id": "CONJ",
    "name": "Conjugation Apparatus",
    "category": "Reproduction",
    "description": "Contact-mediated machinery that copies a genetic payload from one living cell into another. The deliberate route for moving genes between species and between players."
  },
  {
    "id": "CYCL",
    "name": "Cyclin",
    "category": "Reproduction",
    "description": "Divides the cell once it has grown to division size."
  },
  {
    "id": "PLSM",
    "name": "Plasmid Maintainer",
    "category": "Reproduction",
    "description": "Replicates and retains acquired genetic cassettes as separate elements alongside the cell's own genome. Without it, transferred material is expressed briefly and then lost."
  },
  {
    "id": "RSTD",
    "name": "Restriction Defense",
    "category": "Reproduction",
    "description": "Recognises and destroys foreign genetic material entering the cell. Blocks unwanted genes, hostile cargo, and gifts, without distinguishing between them."
  },
  {
    "id": "SPOR",
    "name": "Sporulase",
    "category": "Reproduction",
    "description": "Converts the cell into a dormant, highly resistant state. No growth, no division, minimal upkeep, broad stress tolerance, and no response to opportunity until it wakes."
  }
];
