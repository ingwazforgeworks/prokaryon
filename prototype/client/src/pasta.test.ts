import { GENES } from "./genes";
import { AMOUNTS, PROMOTERS, TAGS, type Cassette } from "./genomeState";
import { cassetteSequence, elementSequence, genomeToPasta, parsePasta } from "./pasta";
import { ownedSpecies, speciesFileStem } from "./species";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

// --- Sequence assignment -----------------------------------------------------

const allIds = [...GENES.map((gene) => gene.id), ...PROMOTERS.map((promoter) => promoter.id), ...AMOUNTS.map((amount) => amount.id), ...TAGS.map((tag) => tag.id)];
for (const id of allIds) {
  check(elementSequence(id).length > 0, `${id} has no sequence`);
}
const sequences = allIds.map((id) => elementSequence(id));
const unique = new Set(sequences);
check(unique.size === sequences.length, "every part sequence is unique");
for (let a = 0; a < sequences.length; a += 1) {
  for (let b = a + 1; b < sequences.length; b += 1) {
    const left = sequences[a];
    const right = sequences[b];
    check(!left.startsWith(right) && !right.startsWith(left), `no sequence is a prefix of another (${left.slice(0, 9)}… vs ${right.slice(0, 9)}…)`);
  }
}

for (const gene of GENES) {
  const sequence = elementSequence(gene.id);
  check(sequence.startsWith("ATG"), `${gene.id} starts with the ATG start codon`);
  check(sequence.length % 3 === 0, `${gene.id} is a whole number of codons`);
  check(sequence.length >= 30 && sequence.length <= 150, `${gene.id} is 10 to 50 codons (${sequence.length / 3})`);
  for (let index = 0; index < sequence.length; index += 3) {
    const codon = sequence.slice(index, index + 3);
    check(codon !== "TAA" && codon !== "TAG" && codon !== "TGA", `${gene.id} carries no stop codon`);
  }
}

for (const id of [...PROMOTERS.map((promoter) => promoter.id), ...AMOUNTS.map((amount) => amount.id), ...TAGS.map((tag) => tag.id)]) {
  const sequence = elementSequence(id);
  check(sequence.length % 3 === 0 && sequence.length >= 9 && sequence.length <= 30, `${id} is a short regulatory region of 3 to 10 codons`);
}

// --- Round-trip ---------------------------------------------------------------

const samples: Cassette[] = [
  { uid: "a1", name: "Ferron Reductase", code: "FRRN", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "FERR", routeId: "CYTO", siteId: null },
  { uid: "a2", name: "Polar Flagellin", code: "PFLG", promoterId: "CNST", amountId: "LOW", amountMinId: null, amountMaxId: null, geneId: "FLGN", routeId: "SecretoryPeptide", siteId: "PolarLocalizationSignal" },
  { uid: "a3", name: "Silent Backup", code: "BKP", promoterId: "CNST", amountId: "OFF", amountMinId: null, amountMaxId: null, geneId: "ANAB", routeId: "CYTO", siteId: null },
  { uid: "a4", name: "Sweeping Flagellar Motor", code: "SFMT", promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HIGH", geneId: "FLGM", routeId: "TransmembraneSignal", siteId: null },
  { uid: "a5", name: "Untagged Fluorescence", code: "GLOW", promoterId: "GRAD", amountId: null, amountMinId: "LOW", amountMaxId: "HYPER", geneId: "GFP", routeId: "CYTO", siteId: null },
  { uid: "a6", name: "Polar Chemoreceptor", code: "CHMR", promoterId: "THRS", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "CHMR", routeId: null, siteId: "BIPO" },
  { uid: "a7", name: "Default Amount Construct", code: "DFLT", promoterId: "CNST", amountId: null, amountMinId: null, amountMaxId: null, geneId: "ATPS", routeId: "TransmembraneSignal", siteId: null },
];

const text = genomeToPasta(samples);
const roundTripped = parsePasta(text);
check(roundTripped.errors.length === 0, `round-trip reads every entry (${roundTripped.errors.join("; ")})`);
check(roundTripped.cassettes.length === samples.length, `round-trip keeps every construct (${roundTripped.cassettes.length}/${samples.length})`);
for (let index = 0; index < samples.length; index += 1) {
  const before = samples[index];
  const after = roundTripped.cassettes[index];
  const same = after !== undefined && before.name === after.name && before.code === after.code && before.promoterId === after.promoterId && before.amountId === after.amountId && before.amountMinId === after.amountMinId && before.amountMaxId === after.amountMaxId && before.geneId === after.geneId && before.routeId === after.routeId && before.siteId === after.siteId;
  check(same, `round-trip preserves ${before.name} (uid is expected to change)`);
  if (after !== undefined) check(after.uid !== before.uid, `round-trip issues a fresh uid for ${before.name}`);
}

// FASTA-style wrapped lines and lowercase bases must read the same.
const wrapped = genomeToPasta(samples.slice(0, 2))
  .split("\n")
  .map((line) => (line.startsWith(">") || line === "" ? line : line.toLowerCase().replace(/(.{10})/g, "$1\n")))
  .join("\n");
const wrappedParsed = parsePasta(wrapped);
check(wrappedParsed.errors.length === 0 && wrappedParsed.cassettes.length === 2 && wrappedParsed.cassettes[0].geneId === "FERR" && wrappedParsed.cassettes[1].geneId === "FLGN", "wrapped lowercase lines parse identically");

// A header without a code falls back to the coding region's gene id.
const handWritten = `>Hand Made Protein\n${cassetteSequence({ uid: "h1", name: "Hand Made Protein", code: "XXXX", promoterId: "CNST", amountId: "MED", amountMinId: null, amountMaxId: null, geneId: "ATPS", routeId: null, siteId: null })}\n`;
const handParsed = parsePasta(handWritten);
check(handParsed.errors.length === 0 && handParsed.cassettes[0]?.name === "Hand Made Protein" && handParsed.cassettes[0]?.code === "ATPS", "a header without a code keeps the name and falls back to the gene id");

// --- Reading a bad file -------------------------------------------------------

check(parsePasta("").cassettes.length === 0 && parsePasta("").errors.length === 0, "empty text yields no constructs and no errors");

const noPromoter = parsePasta(">Broken\nATATTA\n");
check(noPromoter.cassettes.length === 0 && noPromoter.errors.length === 1 && noPromoter.errors[0].includes("promoter"), "an entry without a promoter sequence reports it");

const trailing = parsePasta(`>Trailing Junk\n${cassetteSequence(samples[0])}AAA\n`);
check(trailing.cassettes.length === 0 && trailing.errors.length === 1 && trailing.errors[0].includes("attribute"), "trailing unknown bases report an error");

const orphan = parsePasta("ATGGCATTA\n>Named\nATGGCA\n");
check(orphan.cassettes.length === 0 && orphan.errors.length === 2 && orphan.errors[0].includes("before the first gene header"), "bases before any header are reported once");

const mixed = parsePasta(`>Good One\n${cassetteSequence(samples[0])}\n>Bad One\nGGGGGG\n`);
check(mixed.cassettes.length === 1 && mixed.errors.length === 1 && mixed.cassettes[0]?.geneId === "FERR" && mixed.cassettes[0]?.name === "Good One", "a file with one good and one bad entry loads the good one and reports the bad one");

const geneFirst = parsePasta(`>Gene First\n${elementSequence("ATPS")}\n`);
check(geneFirst.cassettes.length === 0 && geneFirst.errors.length === 1, "a bare coding region without a promoter is rejected");

// --- Export filename -----------------------------------------------------------

check(/^[A-Z][a-z]+ [a-z]+$/.test(ownedSpecies), `the species name reads Genus epithet (${ownedSpecies})`);
check(/^[a-z]+_[a-z]+\.pasta$/.test(`${speciesFileStem()}.pasta`), `the export filename is the lowercased species joined by an underscore (${speciesFileStem()}.pasta)`);
check(`${speciesFileStem()}.pasta` === `${ownedSpecies.toLowerCase().replace(/\s+/g, "_")}.pasta`, "the filename derives from the same species the plate shows");

if (failed > 0) {
  throw new Error(`${failed} pasta check${failed === 1 ? "" : "s"} failed`);
}
console.log("pasta checks passed");