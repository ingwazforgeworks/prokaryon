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
    "description": "Converts Fluxin into ATP, supplying the energy needed to maintain the cell, express genes, grow, and perform other cellular functions."
  },
  {
    "id": "ANAB",
    "name": "Anabolase",
    "category": "Metabolism",
    "description": "Assembles Biomass from carbon, nitrogen and energy. The gene that converts a well-fed cell into a larger cell, and therefore the gene that gates Division and the mutation-point income that follows from it."
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
    "category": "Morphology",
    "description": "Emits blue light from chemical energy. The glow is the cell's own, and it is independent of the body colour its pigments give it."
  },
  {
    "id": "CBXP",
    "name": "Carbex Permease",
    "category": "Metabolism",
    "description": "Concentrates dissolved inorganic carbon inside the cell. Carbex is abundant almost everywhere but too dilute to fix at a useful rate, so this transporter exists to raise the internal concentration rather than to gain access to something unavailable."
  },
  {
    "id": "CRTS",
    "name": "Carotin Synthase",
    "category": "Metabolism",
    "description": "Builds Carotin, the pigment that harvests blue light and safely discards energy the cell cannot use. Both an antenna and a safety valve."
  },
  {
    "id": "CHLS",
    "name": "Chlorin Synthase",
    "category": "Metabolism",
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
    "description": "A terminal respiratory module for iron-bearing anoxic water. Passes electrons to dissolved Ferron instead of Oxidex, giving a moderate ATP yield in places the better acceptor never reaches. Unlike Ferracite Reductase (FCTR), it never needs to touch the solid mineral."
  },
  {
    "id": "FERP",
    "name": "Ferron Permease",
    "category": "Metabolism",
    "description": "Transports Ferron into the cell for metabolism."
  },
  {
    "id": "FLUX",
    "name": "Fluxin Synthase",
    "category": "Metabolism",
    "description": "Extracts energy from intracellular Glycon, Lipron, Nitrox, Sulfex, or Ferron, converting these fuels into Fluxin for ATP production with ATP Synthase (ATPS)"
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
    "category": "Morphology",
    "description": "Emits green light from chemical energy. The glow is the cell's own, and it is independent of the body colour its pigments give it."
  },
  {
    "id": "LIPH",
    "name": "Lipron Hydrolase",
    "category": "Metabolism",
    "description": "Breaks down biological debris outside the cell, releasing accessible Lipron. The liberated nutrient can be absorbed by the producer or scavenged by nearby cells."
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
    "description": "Transports Nitrox into the cell"
  },
  {
    "id": "OXDP",
    "name": "Oxidex Permease",
    "category": "Metabolism",
    "description": "A channel that increases the rate at which Oxidex enters the cell, raising the ceiling on aerobic respiration in water where the oxidant is scarce."
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
    "category": "Metabolism",
    "description": "A light-driven pump built from one protein and one cheap pigment. Absorbs Light and produces Fluxin directly, with no antenna complex, no reaction centre, and no reducing power. The cheapest way to get energy out of light and the most limited."
  },
  {
    "id": "PHYS",
    "name": "Phycin Synthase",
    "category": "Metabolism",
    "description": "Builds Phycin, a large accessory antenna that harvests the green and orange light Chlorin leaves behind. The specialist pigment for living in somebody else's shadow."
  },
  {
    "id": "RXNC",
    "name": "Reaction Center",
    "category": "Metabolism",
    "description": "A photochemical complex that converts harvested light energy into both Fluxin and Reducin. The only route in the catalog that supplies energy and reducing power together, and therefore the only route to full autotrophy."
  },
  {
    "id": "RFP",
    "name": "Red Fluorescent Protein",
    "category": "Morphology",
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
    "category": "Metabolism",
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
    "category": "Homeostasis",
    "description": "Secretes Siderin, a chelator that binds mineral iron and carries it into solution. Frees Ferron from Ferracite at a distance, without the cell needing to touch the mineral."
  },
  {
    "id": "SLFP",
    "name": "Sulfex Permease",
    "category": "Metabolism",
    "description": "Transports Sulfex into the cell."
  },
  {
    "id": "SLFR",
    "name": "Sulfex Reductase",
    "category": "Metabolism",
    "description": "A terminal respiratory module for anoxic water. Passes electrons to Sulfex instead of Oxidex, giving a moderate ATP yield in places the better acceptor never reaches."
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
    "category": "Morphology",
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
    "description": "A gated water channel. Lets the cell move water across its membrane far faster than passive leakage allows, and close the channel to slow an unwanted flux. Immediate response, no storage."
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
    "category": "Morphology",
    "description": "Surface proteins that make the cell stick to debris, minerals, and terrain. Once attached, the cell stops being carried by Flow and stays where it is. It does not bind other cells."
  },
  {
    "id": "COHS",
    "name": "Cohesin",
    "category": "Morphology",
    "description": "Surface proteins that make the cell stick to other cells of the same type. The clump holds in open water, and the protein ignores debris, minerals, terrain, and every other type of cell."
  },
  {
    "id": "LUBR",
    "name": "Lubricin",
    "category": "Morphology",
    "description": "Coats the envelope in a slick film that sheds drag and keeps debris from catching. The cell slides past surfaces — and they slide off it — instead of sticking."
  },
  {
    "id": "BALA",
    "name": "Ballastin",
    "category": "Motility",
    "description": "Packages available reserves into dense ballast granules. The calories stay in the cell, and the granules raise its density."
  },
  {
    "id": "BDEL",
    "name": "Bdellase",
    "category": "Morphology",
    "description": "Attaches to another cell, breaches its envelope, and digests its contents in place. The only gene in the catalog that treats another player's cell as a food source rather than as competition."
  },
  {
    "id": "BUOY",
    "name": "Buoyin",
    "category": "Motility",
    "description": "Builds hollow protein compartments that lower the cell's density. The cell drifts along the depth axis with no motor, no steering and no energy cost once the vesicles are made."
  },
  {
    "id": "CAPS",
    "name": "Capsulin Synthase",
    "category": "Morphology",
    "description": "Lays down a Capsulin polymer layer on the cell's own surface. Protection that travels with the cell and shelters nobody else."
  },
  {
    "id": "CRST",
    "name": "Crescentin",
    "category": "Morphology",
    "description": "Bends the cell's long axis into a crescent. The curve changes how the body meets a surface and how it moves through water, without changing how much cell there is."
  },
  {
    "id": "EFFI",
    "name": "Effector Injector",
    "category": "Morphology",
    "description": "A contact-dependent apparatus that delivers a protein payload directly into an adjacent cell. Precise, expensive, and dependent on sustained contact the player cannot command."
  },
  {
    "id": "ELGN",
    "name": "Elongin",
    "category": "Morphology",
    "description": "Stretches the cell along its long axis, raising the aspect ratio. The same volume becomes longer and narrower, so surface area rises and the cell holds a heading more firmly."
  },
  {
    "id": "ENVT",
    "name": "Envelope Thickener",
    "category": "Morphology",
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
    "category": "Morphology",
    "description": "Thickens the cell across its short axis, lowering the aspect ratio. The same volume becomes shorter and wider, so there is less surface per volume and a shorter lever arm for shear to break."
  },
  {
    "id": "LYSS",
    "name": "Lysin Synthase",
    "category": "Morphology",
    "description": "Secretes Lysin, an envelope-damaging agent that diffuses through the surrounding water. Harms every susceptible cell in range without distinguishing targets, including the producer's own kin."
  },
  {
    "id": "MTXS",
    "name": "Matrixin Synthase",
    "category": "Morphology",
    "description": "Secretes Matrixin, the polymer that accumulates into a biofilm. Unlike other secretions it does not drift away, so a group expressing it builds a persistent structure with measurably different transport properties from the water around it."
  },
  {
    "id": "SHPD",
    "name": "Shape Determinant",
    "category": "Morphology",
    "description": "Sets the cell's body plan: compact sphere, elongated rod, or extended filament. Changes surface area, drag, collision behaviour and how the cell sits against a surface, all at once."
  },
  {
    "id": "SIZR",
    "name": "Size Regulator",
    "category": "Morphology",
    "description": "Sets the Biomass threshold at which the cell commits to Division. Small cells divide often and cheaply; large cells divide rarely and carry more reserves."
  },
  {
    "id": "FLGM",
    "name": "Flagellar Motor Protein",
    "category": "Motility",
    "description": "The rotary motor and stator complex that spins a flagellum, converting ATP directly into thrust. Motion is a continuous expense."
  },
  {
    "id": "FLGN",
    "name": "Flagellin",
    "category": "Motility",
    "description": "Produces the filament subunits that make up a flagellum and exports them into a growing helical filament. Builds the propeller; does not turn it."
  },
  {
    "id": "PILN",
    "name": "Pilin",
    "category": "Motility",
    "description": "Builds retractable surface filaments that grip a substrate and pull. The cell crawls rather than swims: slow, short-ranged, and unbothered by current."
  },
  {
    "id": "CILN",
    "name": "Cilin",
    "category": "Motility",
    "description": "Produces the filament subunits that make up each cilium and exports them into dense, bristling rows across the surface. Builds the oars; does not stroke them."
  },
  {
    "id": "CILM",
    "name": "Ciliary Motor Protein",
    "category": "Motility",
    "description": "The motor complex anchored beneath each row of cilia that flicks them in a coordinated beating stroke. Only cilia sharing its position tag beat, and a row of filaments with no matching motor only drifts."
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
    "name": "Osmoreceptor",
    "category": "Perception",
    "description": "Detects mechanical strain in the envelope caused by water moving in or out, and reports it as a scalar. The cell senses the consequence of osmotic imbalance rather than Salinity itself."
  },
  {
    "id": "PCHR",
    "name": "Photochrome",
    "category": "Perception",
    "description": "A pigment-bound light receptor. Reports how bright it is in one spectral band, and nothing about where the light comes from."
  },
  {
    "id": "PHVC",
    "name": "Photovector",
    "category": "Perception",
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
    "description": "Pushes the cell to divide while it is expressed. The commitment happens earlier than the size threshold would allow, and it happens only for as long as the gene is on."
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
