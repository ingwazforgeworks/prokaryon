/**
 * Checked-in JSON is the store when the dev server answers 204.
 * A static host (a 404, or an SPA rewrite that returns the page as a 200)
 * keeps the same document in localStorage instead. A local copy is newer
 * than the static file, so load prefers it.
 */

export async function saveAuthoring(url: string, key: string, body: unknown): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.status === 204) return true;
  } catch {
    // No reachable API: same fallback as a non-204 answer.
  }
  try {
    localStorage.setItem(key, JSON.stringify(body));
    return true;
  } catch {
    return false;
  }
}

/** Parsed local document, or null when the key is missing or unreadable. */
export function readAuthoring(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
