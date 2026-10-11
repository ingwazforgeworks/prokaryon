import { entryMeter, expressionEntryId, clearExpressionHistory } from "./expressionData";
import { recordCellExpression } from "./expressionTelemetry";
import { applySnapshot, getDraft, resetGenomeState } from "./genomeState";
import { publishReceptorSignals } from "./receptorDrive";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

function near(actual: number | null, expected: number, message: string): void {
  check(actual !== null && Math.abs(actual - expected) < 1e-6, `${message} (got ${actual}, expected ${expected})`);
}

resetGenomeState();
clearExpressionHistory();
applySnapshot({
  v: 1,
  draft: getDraft(),
  genome: [
    {
      uid: "steady",
      name: "Steady Flagellin",
      code: "SFLG",
      promoterId: "CNST",
      amountId: "MED",
      amountMinId: null,
      amountMaxId: null,
      geneId: "FLGN",
      routeId: "SecretoryPeptide",
      siteId: null,
    },
    {
      uid: "swing",
      name: "Swinging Flagellin",
      code: "WFLG",
      promoterId: "OSCL",
      amountId: null,
      amountMinId: "OFF",
      amountMaxId: "HYPER",
      geneId: "FLGN",
      routeId: "SecretoryPeptide",
      siteId: null,
    },
    {
      uid: "guarded",
      name: "Guarded Flagellin",
      code: "GFLG",
      promoterId: "COND",
      amountId: "MED",
      amountMinId: null,
      amountMaxId: null,
      geneId: "FLGN",
      routeId: "SecretoryPeptide",
      siteId: null,
      receptorId: "OSMR",
      responseId: "PROP",
      threshold: null,
    },
  ],
});

const cellId = 7;
const steady = expressionEntryId(cellId, "FLGN", 0);
const swing = expressionEntryId(cellId, "FLGN", 1);
const guarded = expressionEntryId(cellId, "FLGN", 2);

publishReceptorSignals({ osmolynSaturation: 0 });
recordCellExpression(cellId, 0);
near(entryMeter("live", cellId, steady, 0), 0.5, "a medium constitutive gene holds half expression");
near(entryMeter("live", cellId, swing, 0), 0, "an oscillatory gene rests at its minimum");
near(entryMeter("live", cellId, guarded, 0), 0, "a proportional gene is quiet when the receptor is quiet");

publishReceptorSignals({ osmolynSaturation: 1 });
recordCellExpression(cellId, 2);
near(entryMeter("live", cellId, steady, 2), 0.5, "the constitutive gene stays at half expression");
near(entryMeter("live", cellId, swing, 2), 1, "an oscillatory gene reaches its maximum two seconds later");
near(entryMeter("live", cellId, guarded, 2), 0.5, "a proportional gene rises to its amount when the receptor is saturated");
near(entryMeter("live", cellId, guarded, 0), 0, "the earlier sample keeps the quiet reading");

if (failed > 0) throw new Error(`${failed} expression telemetry checks failed`);
console.log("expression telemetry checks passed");
