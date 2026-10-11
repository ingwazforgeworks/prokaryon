import { createVitals, stepVitals, type StressLevels } from "./cellVitals";
import { obituaryText, vitalsReport, type VitalsReading } from "./vitalsHud";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function reading(patch: Partial<VitalsReading> = {}): VitalsReading {
  return {
    label: "Cell 001",
    vitals: createVitals(),
    celsius: 20,
    osmotic: 1,
    atp: 1000,
    atpRate: -0.06,
    dying: null,
    ...patch,
  };
}

function hurt(levels: Partial<StressLevels>, seconds: number) {
  const vitals = createVitals();
  for (let t = 0; t < seconds; t += 0.05) stepVitals(vitals, { heat: 0, osmotic: 0, starvation: 0, ...levels }, 0.05);
  return vitals;
}

check(vitalsReport(reading()) === null, "a healthy cell in ordinary water says nothing");

const hot = vitalsReport(reading({ vitals: hurt({ heat: 1 }, 2), celsius: 108 }));
check(hot?.tone === "danger", "a cell in vent water is in danger");
check(hot?.title === "Overheating", "the danger names the heat");
check(hot?.detail.includes("108°C") === true, "the danger reports the water temperature");
check(hot?.integrity !== null && (hot?.integrity ?? 1) < 1, "the danger shows the integrity bar");

const both = vitalsReport(reading({ vitals: hurt({ heat: 0.2, starvation: 1 }, 1), atp: 0 }));
check(both?.title === "Overheating + Starving", "overlapping stressors are all named");
check(both?.hint.includes("fuel") === true, "the hint follows the stressor doing the most damage");

const warm = vitalsReport(reading({ celsius: 58 }));
check(warm?.tone === "caution" && warm.integrity === null, "warm water warns before doing harm");

const drying = vitalsReport(reading({ osmotic: -0.25 }));
check(drying?.tone === "caution" && drying.title === "Losing water", "a mild shrivel warns before doing harm");

const low = vitalsReport(reading({ atp: 40, atpRate: -0.5 }));
check(low?.tone === "caution" && low.detail.includes("empty in 1m 20s"), "a draining low pool warns with time left");
check(vitalsReport(reading({ atp: 40, atpRate: 0.5 })) === null, "a low pool that is refilling does not warn");

const mending = hurt({ osmotic: 1 }, 3);
stepVitals(mending, { heat: 0, osmotic: 0, starvation: 0 }, 0.05);
const recovering = vitalsReport(reading({ vitals: mending }));
check(recovering?.tone === "mend" && recovering.detail.includes("shriveling"), "a mending cell says what hurt it");

const dead = vitalsReport(reading({ dying: { cause: "starvation" } }));
check(dead?.tone === "dead" && dead.title === "Cell 001 died" && dead.detail === "Starved", "a death names its cause");
check(dead?.hint.startsWith("Next time: burn") === true, "a death turns the hint into a lesson");
check(vitalsReport(reading({ dying: { cause: null } }))?.detail === "Apoptosis", "a triggered death reads as apoptosis");
check(obituaryText("Cell 004", "heat") === "Cell 004 died · Overheated", "an off-screen death gets one line");

if (failed > 0) throw new Error(`${failed} vitals readout checks failed`);
console.log("vitals readout checks passed");
