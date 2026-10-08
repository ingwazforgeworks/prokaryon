import { GENES } from "./genes";
import { AMOUNTS, PROMOTERS, TAGS, amountRange, sanitizeCassette, tagRole, type Cassette } from "./genomeState";

/**
 * The .pasta format: Prokaryon's FASTA. One entry per committed construct,
 * with the construct's name on the header line and the nucleotide sequences of
 * its parts appended together on the sequence line.
 *
 *   >Polar Flagellin | PFLG
 *   ATGGCACGT...TTGACCT
 *
 * The part order is fixed so a reader can walk it back: promoter, amount
 * (minimum then maximum for ranged promoters), coding region, destination
 * route tag, position site tag. Omitted parts contribute no bases.
 *
 * Every catalog part - each gene, promoter, amount tile, and localization tag
 * - owns one sequence. Coding regions begin with the ATG start codon and run a
 * random 10 to 50 codons; regulatory regions are shorter, 3 to 10 codons.
 * The sequences are derived deterministically from each part's id by a seeded
 * generator, so every copy of the game derives the same table with nothing
 * stored on disk, and a .pasta file saved on one machine reads on another.
 * Assignment also guarantees no two part sequences overlap as prefixes, which
 * is what lets a concatenated sequence be tokenized unambiguously.
 */

const BASES = ["A", "T", "G", "C"] as const;
/** The sixty-one sense codons; no sequence carries an in-frame stop. */
const CODONS: readonly string[] = (() => {
  const list: string[] = [];
  for (const a of BASES) for (const b of BASES) for (const c of BASES) {
    const codon = `${a}${b}${c}`;
    if (codon === "TAA" || codon === "TAG" || codon === "TGA") continue;
    list.push(codon);
  }
  return list;
})();

/** FNV-1a: a small, stable string hash. */
function hashText(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic small-range PRNG so sequence derivation needs no storage. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

type ElementKind = "gene" | "promoter" | "amount" | "route" | "site";

type ElementEntry = {
  id: string;
  kind: ElementKind;
  sequence: string;
};

function catalogElements(): { id: string; kind: ElementKind }[] {
  const list: { id: string; kind: ElementKind }[] = GENES.map((gene) => ({ id: gene.id, kind: "gene" as const }));
  list.push(...PROMOTERS.map((promoter) => ({ id: promoter.id, kind: "promoter" as const })));
  list.push(...AMOUNTS.map((amount) => ({ id: amount.id, kind: "amount" as const })));
  list.push(...TAGS.map((tag) => ({ id: tag.id, kind: tagRole(tag.id) ?? "site" })));
  return list;
}

function generateSequence(id: string, coding: boolean, salt: number): string {
  const random = mulberry32(hashText(`${id}:${salt}`));
  const total = coding ? 10 + Math.floor(random() * 41) : 3 + Math.floor(random() * 8);
  const codons: string[] = coding ? ["ATG"] : [];
  while (codons.length < total) codons.push(CODONS[Math.floor(random() * CODONS.length)]);
  return codons.join("");
}

const ELEMENTS: readonly ElementEntry[] = (() => {
  const assigned: ElementEntry[] = [];
  for (const { id, kind } of catalogElements()) {
    let salt = 0;
    for (;;) {
      const sequence = generateSequence(id, kind === "gene", salt);
      salt += 1;
      // Reject any sequence that prefixes, or is prefixed by, one already
      // assigned. That keeps every position in a concatenated sequence
      // attributable to exactly one part.
      const conflicts = assigned.some((entry) => entry.sequence.startsWith(sequence) || sequence.startsWith(entry.sequence));
      if (!conflicts) {
        assigned.push({ id, kind, sequence });
        break;
      }
    }
  }
  return assigned;
})();

/** The nucleotide sequence assigned to a catalog part, or "" for unknown ids. */
export function elementSequence(id: string): string {
  return ELEMENTS.find((entry) => entry.id === id)?.sequence ?? "";
}

/** The longest catalog part of the wanted kinds whose sequence sits at position. */
function matchAt(sequence: string, position: number, kinds: readonly ElementKind[]): ElementEntry | null {
  let best: ElementEntry | null = null;
  for (const entry of ELEMENTS) {
    if (!kinds.includes(entry.kind)) continue;
    if (!sequence.startsWith(entry.sequence, position)) continue;
    if (best === null || entry.sequence.length > best.sequence.length) best = entry;
  }
  return best;
}

/** All the parts of one construct, concatenated in .pasta order. */
export function cassetteSequence(cassette: Cassette): string {
  const parts: string[] = [elementSequence(cassette.promoterId)];
  if (amountRange(cassette.promoterId)) {
    if (cassette.amountMinId) parts.push(elementSequence(cassette.amountMinId));
    if (cassette.amountMaxId) parts.push(elementSequence(cassette.amountMaxId));
  } else if (cassette.amountId) {
    parts.push(elementSequence(cassette.amountId));
  }
  parts.push(elementSequence(cassette.geneId));
  if (cassette.routeId) parts.push(elementSequence(cassette.routeId));
  if (cassette.siteId) parts.push(elementSequence(cassette.siteId));
  return parts.join("");
}

/** Serializes a genome as .pasta text, one entry per construct. */
export function genomeToPasta(cassettes: readonly Cassette[]): string {
  const lines: string[] = [];
  for (const cassette of cassettes) {
    lines.push(`>${cassette.name} | ${cassette.code}`);
    lines.push(cassetteSequence(cassette));
  }
  return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}

export type PastaParseResult = {
  cassettes: Cassette[];
  errors: string[];
};

function parseEntry(header: string, sequence: string): { cassette: Cassette } | { error: string } {
  const label = header.length > 0 ? header : "Unnamed gene";
  const divider = header.indexOf("|");
  const name = (divider >= 0 ? header.slice(0, divider) : header).trim();
  const code = divider >= 0 ? header.slice(divider + 1).trim() : "";
  if (sequence.length === 0) return { error: `"${label}" has no sequence.` };
  let position = 0;
  const promoter = matchAt(sequence, position, ["promoter"]);
  if (!promoter) return { error: `"${label}" does not begin with a known promoter.` };
  position += promoter.sequence.length;
  const ranged = amountRange(promoter.id);
  const amounts: string[] = [];
  while (amounts.length < (ranged ? 2 : 1)) {
    const amount = matchAt(sequence, position, ["amount"]);
    if (!amount) break;
    amounts.push(amount.id);
    position += amount.sequence.length;
  }
  const coding = matchAt(sequence, position, ["gene"]);
  if (!coding) return { error: `"${label}" has no coding region the catalog recognizes.` };
  position += coding.sequence.length;
  let routeId: string | null = null;
  let siteId: string | null = null;
  const route = matchAt(sequence, position, ["route"]);
  if (route) {
    routeId = route.id;
    position += route.sequence.length;
  }
  const site = matchAt(sequence, position, ["site"]);
  if (site) {
    siteId = site.id;
    position += site.sequence.length;
  }
  if (position !== sequence.length) return { error: `"${label}" carries bases the reader cannot attribute to any catalog part.` };
  const cassette = sanitizeCassette({
    name,
    code,
    promoterId: promoter.id,
    amountId: ranged ? null : amounts[0] ?? null,
    amountMinId: ranged ? amounts[0] ?? null : null,
    amountMaxId: ranged ? amounts[1] ?? null : null,
    geneId: coding.id,
    routeId,
    siteId,
  });
  if (!cassette) return { error: `"${label}" does not describe a construct the catalog recognizes.` };
  return { cassette };
}

/** Reads .pasta text back into constructs. Invalid entries are skipped and reported. */
export function parsePasta(text: string): PastaParseResult {
  const cassettes: Cassette[] = [];
  const errors: string[] = [];
  let header: string | null = null;
  let chunks: string[] = [];
  let warnedOrphan = false;
  const flush = (): void => {
    if (header === null) return;
    const parsed = parseEntry(header, chunks.join(""));
    if ("cassette" in parsed) cassettes.push(parsed.cassette);
    else errors.push(parsed.error);
    header = null;
    chunks = [];
  };
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith(";")) continue;
    if (line.startsWith(">")) {
      flush();
      header = line.slice(1).trim();
      continue;
    }
    if (header === null) {
      if (!warnedOrphan) {
        warnedOrphan = true;
        errors.push("Sequence bases appear before the first gene header.");
      }
      continue;
    }
    chunks.push(line.toUpperCase().replace(/[^A-Z]/g, ""));
  }
  flush();
  return { cassettes, errors };
}