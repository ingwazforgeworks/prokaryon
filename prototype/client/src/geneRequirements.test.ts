import type { TechEdge } from "./techTree";

// Node has no Audio; the ui cue bank only needs the constructor shape and a
// playable stub before techTree's import chain runs.
class AudioStub {
  volume = 1;
  preload = "auto";
  currentTime = 0;
  play(): Promise<void> {
    return Promise.resolve();
  }
}
(globalThis as { Audio?: unknown }).Audio = AudioStub;

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

const { resetUnlocks, unlockGene } = await import("./geneUnlocks");
const { setMutationPoints } = await import("./resources");
const { missingGeneRequirements } = await import("./techTree");

resetUnlocks();
setMutationPoints(40);

const edges: TechEdge[] = [
  { from: "FLGN", to: "CILN", kind: "required" },
  { from: "FLGN", to: "CILM", kind: "required" },
  { from: "FLGN", to: "PILN", kind: "required" },
  { from: "LUBR", to: "ADHN", kind: "required" },
];

check(missingGeneRequirements("CILN", edges).join() === "Requires Flagellin", "a locked flagellin gates cilin");
check(missingGeneRequirements("CILM", edges).join() === "Requires Flagellin", "a locked flagellin gates the ciliary motor protein");
check(missingGeneRequirements("PILN", edges).join() === "Requires Flagellin", "a locked flagellin gates pilin");
check(unlockGene("FLGN"), "flagellin unlocks for the motility gate");
check(missingGeneRequirements("CILN", edges).length === 0, "cilin only needs flagellin unlocked");
check(missingGeneRequirements("CILM", edges).length === 0 && missingGeneRequirements("PILN", edges).length === 0, "the motor and pilin follow the same gate");
check(missingGeneRequirements("ADHN", edges).join() === "Requires Lubricin", "adhesin still gates on lubricin being unlocked");
check(unlockGene("LUBR") && missingGeneRequirements("ADHN", edges).length === 0, "unlocking lubricin clears the adhesin gate");

// The shipped tech layout carries the same requirement edges.
const nodeFs = "node:fs";
const fs = (await import(nodeFs)) as { readFileSync(path: string, encoding: "utf8"): string };
type SavedEdge = { from: string; to: string; kind: string };
type SavedNode = { id?: string; geneId?: string; category?: string; x?: number; w?: number; groupKey?: string };
const saved = JSON.parse(fs.readFileSync("public/tech-layout.json", "utf8")) as { functional?: { edges?: SavedEdge[]; nodes?: SavedNode[] } };
const savedEdges: TechEdge[] = (saved.functional?.edges ?? []).flatMap((edge) =>
  edge.kind === "required" || edge.kind === "unlocks" ? [{ from: edge.from, to: edge.to, kind: edge.kind }] : [],
);
check(savedEdges.some((edge) => edge.from === "FLGN" && edge.to === "CILN" && edge.kind === "required"), "the saved tree gates cilin behind flagellin");
check(savedEdges.some((edge) => edge.from === "FLGN" && edge.to === "CILM" && edge.kind === "required"), "the saved tree gates the ciliary motor protein behind flagellin");
check(savedEdges.some((edge) => edge.from === "FLGN" && edge.to === "PILN" && edge.kind === "required"), "the saved tree gates pilin behind flagellin");
check(missingGeneRequirements("CILN", savedEdges).length === 0, "the shipped tree clears the cilin gate once flagellin is unlocked");
check(!missingGeneRequirements("CILN", savedEdges).some((problem) => problem.includes("in the genome")), "no requirement asks for flagellin in the genome");

// The cell shape board ships two lineages: elongin → crescentin → crystallin
// and girthin → taperin → isoprene synthase, with the two entry genes free of
// prerequisites so mutation points alone open the chain.
const savedNodes = saved.functional?.nodes ?? [];
for (const id of ["ELGN", "CRST", "CRYS", "GRTN", "TPRN", "ISPR"]) {
  const node = savedNodes.find((entry) => entry.id === id || entry.geneId === id);
  check(node !== undefined, `the saved tree places ${id} on the functional board`);
  check(node?.category === "Cell Shape", `${id} sits in the cell shape category`);
}
for (const [from, to] of [
  ["ELGN", "CRST"],
  ["CRST", "CRYS"],
  ["GRTN", "TPRN"],
  ["TPRN", "ISPR"],
] as const) {
  check(savedEdges.some((edge) => edge.from === from && edge.to === to && edge.kind === "required"), `the saved tree gates ${to} behind ${from}`);
}

const { GENES } = await import("./genes");
const { geneUnlockCost } = await import("./geneUnlocks");
const SHAPE_COST: Record<string, number> = { ELGN: 2, GRTN: 2, CRST: 3, TPRN: 3, CRYS: 5, ISPR: 5 };
for (const id of ["ELGN", "CRST", "CRYS", "GRTN", "TPRN", "ISPR"]) {
  const gene = GENES.find((entry) => entry.id === id);
  check(gene?.category === "Cell Shape", `${id} is a cell shape gene record`);
  check(geneUnlockCost(id) === SHAPE_COST[id], `${id} costs ${SHAPE_COST[id]} mutation points`);
}
const SENSE_COST: Record<string, number> = {
  OSMR: 3,
  FERS: 3,
  SLFS: 3,
  THMR: 5,
  BARR: 5,
  THGR: 5,
  OXDS: 8,
  NITS: 8,
  CBXS: 8,
  LIPS: 8,
  FLXR: 8,
  ATPR: 8,
  RFLR: 8,
  OSMP: 3,
  AQUP: 3,
  CSP: 3,
  HSP: 3,
};
for (const [id, category] of [
  ["OSMR", "Perception"],
  ["ATPR", "Perception"],
  ["BARR", "Perception"],
  ["CBXS", "Perception"],
  ["FERS", "Perception"],
  ["FLXR", "Perception"],
  ["LIPS", "Perception"],
  ["NITS", "Perception"],
  ["OXDS", "Perception"],
  ["RFLR", "Perception"],
  ["SLFS", "Perception"],
  ["THMR", "Perception"],
  ["THGR", "Perception"],
  ["OSMP", "Homeostasis"],
  ["AQUP", "Homeostasis"],
  ["CSP", "Homeostasis"],
  ["HSP", "Homeostasis"],
] as const) {
  const gene = GENES.find((entry) => entry.id === id);
  const node = savedNodes.find((entry) => entry.id === id || entry.geneId === id);
  check(gene?.category === category, `${id} is a ${category.toLowerCase()} gene record`);
  check(geneUnlockCost(id) === SENSE_COST[id], `${id} costs ${SENSE_COST[id]} mutation points`);
  check(node !== undefined && node.category === category, `${id} sits on the ${category.toLowerCase()} board`);
  if (id === "OSMR" || id === "SLFS" || id === "FERS" || category !== "Perception") check(!savedEdges.some((edge) => edge.to === id), `${id} is an entry node`);
}

// Perception climbs in rows. The starter row is the water the cell already
// lives in. Each later row stays locked until every receptor above it is unlocked.
const perceptionTiers = [
  ["OSMR", "SLFS", "FERS"],
  ["THMR", "BARR", "THGR"],
  ["OXDS", "NITS", "CBXS", "LIPS"],
  ["FLXR", "ATPR", "RFLR"],
] as const;
for (let tier = 1; tier < perceptionTiers.length; tier += 1) {
  const parents = perceptionTiers[tier - 1];
  for (const id of perceptionTiers[tier]) {
    const required = savedEdges.filter((edge) => edge.to === id && edge.kind === "required").map((edge) => edge.from).sort();
    check(required.join() === [...parents].sort().join(), `${id} requires the previous perception tier`);
    check(missingGeneRequirements(id, savedEdges).length === parents.length, `${id} names every locked parent`);
  }
}
check(missingGeneRequirements("OSMR", savedEdges).length === 0, "the osmolyn receptor is an entry node");
check(missingGeneRequirements("SLFS", savedEdges).length === 0 && missingGeneRequirements("FERS", savedEdges).length === 0, "sulfex and ferron receptors are entry nodes");
check(
  missingGeneRequirements("THMR", savedEdges).sort().join("|") === "Requires Ferron Receptor|Requires Osmolyn Receptor|Requires Sulfex Receptor",
  "temperature waits on the starter receptors",
);

// The four purchasable permeases sit on the metabolism board below their
// matching reductases, gated by the same ATPS and Fluxin Synthase line as
// every other metabolism node. Both parents are default genes, so the gate
// is satisfied from the start.
for (const id of ["OXDP", "NITP", "LIPP", "CBXP"]) {
  const gene = GENES.find((entry) => entry.id === id);
  const node = savedNodes.find((entry) => entry.id === id || entry.geneId === id);
  check(gene?.category === "Metabolism", `${id} is a metabolism gene record`);
  check(geneUnlockCost(id) === 3, `${id} costs three mutation points`);
  check(node !== undefined && node.category === "Metabolism", `${id} sits on the metabolism board`);
  check(savedEdges.some((edge) => edge.from === "ATPS" && edge.to === id && edge.kind === "required"), `${id} is gated by ATP synthase`);
  check(savedEdges.some((edge) => edge.from === "FLUX" && edge.to === id && edge.kind === "required"), `${id} is gated by fluxin synthase`);
  check(missingGeneRequirements(id, savedEdges).length === 0, `${id} has no unmet requirements while ATPS and FLUX are default`);
  check(unlockGene(id), `${id} unlocks`);
}

// Parent-child centering: children center on their parents rather than
// drifting right. Cross-board edges are exempt because boards move
// independently. A sibling group sharing one parent set centers on the
// parents' midpoint; a group spanning two boards (the ATPS/FLUX fan across
// Import/Export and Respiration) centers its span instead.
{
  const nodeOf = new Map(savedNodes.map((node) => [node.id ?? node.geneId ?? "", node]));
  const center = (id: string): number => {
    const node = nodeOf.get(id);
    return (node?.x ?? 0) + (node?.w ?? 56) / 2;
  };
  const boardOf = (id: string): string => nodeOf.get(id)?.groupKey ?? "";
  const sameBoardEdges = savedEdges.filter((edge) => boardOf(edge.from) !== "" && boardOf(edge.from) === boardOf(edge.to));
  const parentsOfGene = new Map<string, string[]>();
  for (const edge of sameBoardEdges) {
    const list = parentsOfGene.get(edge.to) ?? [];
    list.push(edge.from);
    parentsOfGene.set(edge.to, list);
  }
  const centeringGroups = new Map<string, { parents: string[]; children: string[] }>();
  for (const edge of sameBoardEdges) {
    const parents = (parentsOfGene.get(edge.to) ?? []).sort();
    const key = parents.join("|");
    const group = centeringGroups.get(key) ?? { parents, children: [] };
    if (!group.children.includes(edge.to)) group.children.push(edge.to);
    centeringGroups.set(key, group);
  }
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1;
  for (const { parents, children } of centeringGroups.values()) {
    const parentMean = parents.reduce((sum, id) => sum + center(id), 0) / parents.length;
    const boards = new Set(children.map((id) => boardOf(id)));
    if (boards.size > 1) {
      const left = Math.min(...children.map((id) => nodeOf.get(id)?.x ?? 0));
      const right = Math.max(...children.map((id) => (nodeOf.get(id)?.x ?? 0) + (nodeOf.get(id)?.w ?? 56)));
      check(near((left + right) / 2, parentMean), `the ${children.length}-node fan of ${parents.join(" + ")} centers its span on the parents`);
    } else {
      const childMean = children.reduce((sum, id) => sum + center(id), 0) / children.length;
      check(near(childMean, parentMean), `${children.join(", ")} center on ${parents.join(" + ")}`);
    }
  }
}

resetUnlocks();
setMutationPoints(20);
check(missingGeneRequirements("ELGN", savedEdges).length === 0, "elongin is an entry node with no prerequisite");
check(missingGeneRequirements("GRTN", savedEdges).length === 0, "girthin is an entry node with no prerequisite");
check(missingGeneRequirements("CRST", savedEdges).join() === "Requires Elongin", "crescentin gates on elongin");
check(missingGeneRequirements("CRYS", savedEdges).join() === "Requires Crescentin", "crystallin gates on crescentin");
check(missingGeneRequirements("TPRN", savedEdges).join() === "Requires Girthin", "taperin gates on girthin");
check(missingGeneRequirements("ISPR", savedEdges).join() === "Requires Taperin", "isoprene synthase gates on taperin");
check(unlockGene("ELGN") && unlockGene("CRST") && unlockGene("CRYS"), "the elongin lineage unlocks in sequence");
check(unlockGene("GRTN") && unlockGene("TPRN") && unlockGene("ISPR"), "the girthin lineage unlocks in sequence");
check(missingGeneRequirements("CRYS", savedEdges).length === 0, "the whole elongin chain is open once bought");
check(missingGeneRequirements("ISPR", savedEdges).length === 0, "the whole girthin chain is open once bought");

// The pigmentation board carries every pigment and light-harvesting gene, with
// the simple pigments as entry nodes and the advanced complexes gated behind
// the pigments they are built from.
const PIGMENTATION_GENES = ["RHDS", "CRYP", "CRTS", "SIDS", "CHLS", "PHYS", "PHOR", "RXNC", "GFP", "YFP", "BFP", "RFP", "PCHR", "PHVC"] as const;
const PIGMENT_COST: Record<string, number> = {
  RHDS: 2,
  CRYP: 2,
  CRTS: 2,
  SIDS: 2,
  GFP: 2,
  YFP: 2,
  BFP: 2,
  RFP: 2,
  CHLS: 8,
  PHYS: 8,
  PHOR: 8,
  RXNC: 8,
  PCHR: 8,
  PHVC: 8,
};
for (const id of PIGMENTATION_GENES) {
  const gene = GENES.find((entry) => entry.id === id);
  const node = savedNodes.find((entry) => entry.id === id || entry.geneId === id);
  check(gene?.category === "Pigmentation", `${id} is a pigmentation gene record`);
  check(geneUnlockCost(id) === PIGMENT_COST[id], `${id} costs ${PIGMENT_COST[id]} mutation points`);
  check(node !== undefined && node.category === "Pigmentation", `${id} sits on the pigmentation board`);
}
for (const id of ["RHDS", "CRYP", "CRTS", "SIDS", "GFP"] as const) {
  check(!savedEdges.some((edge) => edge.to === id), `${id} is an entry node`);
}
for (const [from, to] of [
  ["RHDS", "PHOR"],
  ["RHDS", "PCHR"],
  ["PCHR", "PHVC"],
  ["CRTS", "CHLS"],
  ["CHLS", "PHYS"],
  ["CHLS", "RXNC"],
  ["GFP", "YFP"],
  ["GFP", "BFP"],
  ["GFP", "RFP"],
] as const) {
  check(savedEdges.some((edge) => edge.from === from && edge.to === to && edge.kind === "required"), `the saved tree gates ${to} behind ${from}`);
}

resetUnlocks();
setMutationPoints(30);
check(missingGeneRequirements("PHOR", savedEdges).join() === "Requires Rhodin Synthase", "photorhodin gates on rhodin synthase");
check(missingGeneRequirements("PCHR", savedEdges).join() === "Requires Rhodin Synthase", "photochrome gates on rhodin synthase");
check(missingGeneRequirements("PHVC", savedEdges).join() === "Requires Photochrome", "photovector gates on photochrome");
check(missingGeneRequirements("CHLS", savedEdges).join() === "Requires Carotin Synthase", "chlorin synthase gates on carotin synthase");
check(missingGeneRequirements("PHYS", savedEdges).join() === "Requires Chlorin Synthase", "phycin synthase gates on chlorin synthase");
check(missingGeneRequirements("RXNC", savedEdges).join() === "Requires Chlorin Synthase", "reaction center gates on chlorin synthase");
check(missingGeneRequirements("RFP", savedEdges).join() === "Requires Green Fluorescent Protein", "red fluorescent protein gates on the green original");
check(unlockGene("RHDS") && unlockGene("CRTS") && unlockGene("GFP"), "the pigment entry nodes unlock");
check(missingGeneRequirements("PHOR", savedEdges).length === 0 && missingGeneRequirements("PCHR", savedEdges).length === 0, "rhodin unlocks the pump and the receptor");
check(unlockGene("CHLS") && unlockGene("PCHR"), "the second pigment tier unlocks in sequence");
check(missingGeneRequirements("PHYS", savedEdges).length === 0 && missingGeneRequirements("RXNC", savedEdges).length === 0, "chlorin opens the antenna and the reaction center");
check(missingGeneRequirements("PHVC", savedEdges).length === 0, "photochrome opens the photovector");
check(unlockGene("YFP") && unlockGene("BFP") && unlockGene("RFP"), "the fluorescent variants unlock behind the green original");

if (failed > 0) {
  throw new Error(`${failed} gene requirement checks failed`);
}
console.log("gene requirement checks passed");