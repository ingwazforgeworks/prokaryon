import { applySnapshot, getGenome, loadGenomeState, persistGenome, resetGenomeState, type GenomeSnapshot } from "./genomeState";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

// Node has no localStorage; this shim stands in for the browser store.
const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => void store.clear(),
  key: () => null,
  length: 0,
} as Storage;

const draft: GenomeSnapshot["draft"] = {
  name: "Untitled construct",
  code: "",
  promoterId: null,
  amountId: null,
  amountMinId: null,
  amountMaxId: null,
  geneId: null,
  routeId: null,
  siteId: null,
};
const cassette = {
  uid: "cassette-a",
  name: "Anabolase A",
  code: "ANA",
  promoterId: "CNST",
  amountId: "MED",
  amountMinId: null,
  amountMaxId: null,
  geneId: "ANAB",
  routeId: "CYTO",
  siteId: null,
};
const withGenome = (genome: typeof cassette[]): GenomeSnapshot => ({ v: 1, draft, genome });

const originalFetch = globalThis.fetch;
const statusResponse = (status: number, body?: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response);

// A static host with no save API: node's fetch cannot even express a relative
// URL, so the POST throws and the save must fall back to localStorage.
applySnapshot(withGenome([cassette]));
check(await persistGenome(), "a host with no save API still saves");
check(store.size === 1, "the fallback wrote a snapshot to localStorage");
resetGenomeState();
await loadGenomeState();
check(getGenome().length === 1 && getGenome()[0].uid === cassette.uid, "the saved local genome reloads on boot");

// The SPA rewrite answers the POST with the index page as a 200: it saved
// nothing, so it must not count as a save either.
resetGenomeState();
store.clear();
globalThis.fetch = (async () => statusResponse(200)) as typeof fetch;
applySnapshot(withGenome([cassette]));
check(await persistGenome(), "an SPA rewrite answering 200 still saves");
check(store.size === 1, "a rewritten 200 did not pose as the save API");

// The real API answers 204 with no body; that host owns the file and the
// localStorage copy stays untouched.
resetGenomeState();
store.clear();
globalThis.fetch = (async () => statusResponse(204)) as typeof fetch;
applySnapshot(withGenome([cassette]));
check(await persistGenome(), "the save API's 204 answers saved");
check(store.size === 0, "a 204 host never touches the localStorage copy");

// Without a local copy the checked-in JSON loads as before; with one, the
// local snapshot is newer than anything the static file can hold.
resetGenomeState();
store.clear();
const fetched = { ...cassette, uid: "cassette-b", geneId: "CYCL" };
globalThis.fetch = (async () => statusResponse(200, withGenome([fetched]))) as typeof fetch;
await loadGenomeState();
check(getGenome().length === 1 && getGenome()[0].uid === "cassette-b", "without a local copy the checked-in JSON loads");
applySnapshot(withGenome([cassette]));
await persistGenome();
resetGenomeState();
await loadGenomeState();
check(getGenome().length === 1 && getGenome()[0].uid === "cassette-a", "the local snapshot outranks the fetched JSON");

// A corrupted local entry is ignored rather than trusted.
resetGenomeState();
store.clear();
store.set("prokaryon:genome-state", "{not json");
await loadGenomeState();
check(getGenome().length === 1 && getGenome()[0].uid === "cassette-b", "a corrupted local entry falls back to the JSON");

globalThis.fetch = originalFetch;

if (failed > 0) throw new Error(`${failed} checks failed`);
console.log("genome persistence checks passed");