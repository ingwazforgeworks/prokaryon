import { isGeneUnlocked, loadUnlocks, resetUnlocks, unlockAllGenes } from "./geneUnlocks";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

const store = new Map<string, string>();
globalThis.localStorage = {
  getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => void store.clear(),
  key: () => null,
  length: 0,
} as Storage;

const originalFetch = globalThis.fetch;
const statusResponse = (status: number, body?: unknown): Response =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body } as unknown as Response);

globalThis.fetch = (async () => {
  throw new Error("no api");
}) as typeof fetch;

store.set("prokaryon:tech-unlocks", JSON.stringify({ v: 1, unlocked: ["FLGN"] }));
await loadUnlocks();
check(isGeneUnlocked("FLGN"), "a local unlock snapshot loads when the save API is missing");
check(store.size === 1, "loading a local snapshot does not rewrite it");

await resetUnlocks();
store.clear();
globalThis.fetch = (async () => statusResponse(204)) as typeof fetch;
await unlockAllGenes();
check(isGeneUnlocked("FLGN"), "unlock all still grants the gene");
check(store.size === 0, "a 204 host keeps unlocks in the file, not localStorage");

globalThis.fetch = (async () => {
  throw new Error("no api");
}) as typeof fetch;
await resetUnlocks();
check(store.size === 1, "a host with no save API writes the unlock snapshot locally");
check(!isGeneUnlocked("FLGN"), "reset clears the in-memory unlocks");

store.clear();
globalThis.fetch = (async () => statusResponse(200, { v: 1, unlocked: ["OSMR"] })) as typeof fetch;
await loadUnlocks();
check(isGeneUnlocked("OSMR"), "without a local copy the checked-in unlock file loads");

store.set("prokaryon:tech-unlocks", JSON.stringify({ v: 1, unlocked: ["AQUP"] }));
await loadUnlocks();
check(isGeneUnlocked("AQUP") && !isGeneUnlocked("OSMR"), "the local unlock snapshot outranks the fetched file");

store.set("prokaryon:tech-unlocks", "{not json");
await loadUnlocks();
check(isGeneUnlocked("OSMR"), "a corrupted local unlock entry falls back to the file");

globalThis.fetch = originalFetch;

if (failed > 0) throw new Error(`${failed} checks failed`);
console.log("unlock persistence checks passed");
