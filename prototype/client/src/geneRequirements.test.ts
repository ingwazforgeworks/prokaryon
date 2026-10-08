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
setMutationPoints(10);

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
type SavedNode = { id?: string; geneId?: string; category?: string };
const saved = JSON.parse(fs.readFileSync("public/tech-layout.json", "utf8")) as { functional?: { edges?: SavedEdge[]; nodes?: SavedNode[] } };
const savedEdges: TechEdge[] = (saved.functional?.edges ?? []).flatMap((edge) =>
  edge.kind === "required" || edge.kind === "unlocks" ? [{ from: edge.from, to: edge.to, kind: edge.kind }] : [],
);
check(savedEdges.some((edge) => edge.from === "FLGN" && edge.to === "CILN" && edge.kind === "required"), "the saved tree gates cilin behind flagellin");
check(savedEdges.some((edge) => edge.from === "FLGN" && edge.to === "CILM" && edge.kind === "required"), "the saved tree gates the ciliary motor protein behind flagellin");
check(savedEdges.some((edge) => edge.from === "FLGN" && edge.to === "PILN" && edge.kind === "required"), "the saved tree gates pilin behind flagellin");
check(missingGeneRequirements("CILN", savedEdges).length === 0, "the shipped tree clears the cilin gate once flagellin is unlocked");
check(!missingGeneRequirements("CILN", savedEdges).some((problem) => problem.includes("in the genome")), "no requirement asks for flagellin in the genome");

// The morphology board ships two lineages: elongin → crescentin → crystallin
// and girthin → taperin → isoprene synthase, with the two entry genes free of
// prerequisites so mutation points alone open the chain.
const savedNodes = saved.functional?.nodes ?? [];
for (const id of ["ELGN", "CRST", "CRYS", "GRTN", "TPRN", "ISPR"]) {
  const node = savedNodes.find((entry) => entry.id === id || entry.geneId === id);
  check(node !== undefined, `the saved tree places ${id} on the functional board`);
  check(node?.category === "Morphology", `${id} sits in the morphology category`);
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
for (const id of ["ELGN", "CRST", "CRYS", "GRTN", "TPRN", "ISPR"]) {
  const gene = GENES.find((entry) => entry.id === id);
  check(gene?.category === "Morphology", `${id} is a morphology gene record`);
  check(geneUnlockCost(id) === 1, `${id} costs one mutation point`);
}
for (const [id, category] of [
  ["OSMR", "Perception"],
  ["OSMP", "Homeostasis"],
  ["AQUP", "Homeostasis"],
] as const) {
  const gene = GENES.find((entry) => entry.id === id);
  const node = savedNodes.find((entry) => entry.id === id || entry.geneId === id);
  check(gene?.category === category, `${id} is a ${category.toLowerCase()} gene record`);
  check(geneUnlockCost(id) === 1, `${id} costs one mutation point`);
  check(node !== undefined && node.category === category, `${id} sits on the ${category.toLowerCase()} board`);
  check(!savedEdges.some((edge) => edge.to === id), `${id} is an entry node`);
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

if (failed > 0) {
  throw new Error(`${failed} gene requirement checks failed`);
}
console.log("gene requirement checks passed");