/**
 * The player's organism name for this session, drawn once at boot so the
 * species plate, save files, and exports all agree on one identity.
 */
const GENUS_STEMS = ["halo", "thermo", "thio", "nitro", "aqua", "geo", "rhodo", "ferro", "photo", "pseudo", "cyano", "alkali", "baro", "cryo", "acido", "methano", "desulfo"];
const GENUS_ENDINGS = ["monas", "bacter", "coccus", "vibrio", "bacillus", "plasma", "spira"];
const SPECIES_EPITHETS = ["marinus", "thermalis", "profundus", "halophilus", "aquaticus", "pelagicus", "abyssalis", "sulfureus", "venticola", "salinus", "littoralis", "phototrophus"];

function randomSpeciesName(): string {
  const pick = (list: readonly string[]): string => list[Math.floor(Math.random() * list.length)] ?? list[0] ?? "";
  const genus = `${pick(GENUS_STEMS)}${pick(GENUS_ENDINGS)}`;
  return `${genus.charAt(0).toUpperCase()}${genus.slice(1)} ${pick(SPECIES_EPITHETS)}`;
}

export const ownedSpecies = randomSpeciesName();

/** The species name as a lowercase file stem: Halomonas marinus → halomonas_marinus. */
export function speciesFileStem(): string {
  return ownedSpecies.toLowerCase().replace(/\s+/g, "_");
}