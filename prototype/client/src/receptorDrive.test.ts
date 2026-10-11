import { expressedAmount, type FlagellinConstruct } from "./flagellinDistribution";
import { conditionalMultiplier, publishReceptorSignals, responseGain } from "./receptorDrive";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(`FAIL ${message}`);
}

const conditional = (overrides: Partial<FlagellinConstruct> = {}): FlagellinConstruct => ({
  promoterId: "COND",
  geneId: "FLGN",
  amountId: "HYPER",
  routeId: "SecretoryPeptide",
  siteId: null,
  receptorId: "OSMR",
  responseId: "ACTV",
  threshold: null,
  ...overrides,
});

check(responseGain("ACTV", null, null) === 0, "a missing receptor drives nothing");
check(responseGain("INHB", null, null) === 0, "inhibition does not turn a gene on when the receptor is absent");
check(responseGain("ACTV", 0, null) === 0, "any activity stays off when nothing is detected");
check(responseGain("ACTV", 0.2, null) === 1, "any activity switches fully on");
check(responseGain("PROP", 0.4, null) === 0.4, "proportional drive matches saturation");
check(Math.abs(responseGain("INVP", 0.25, null) - 0.75) < 1e-9, "inverse drive is one minus saturation");
check(responseGain("INVP", null, null) === 0, "inverse drive stays off when the receptor is absent");
check(responseGain("GATE", 0.49, 0.5) === 0 && responseGain("GATE", 0.5, 0.5) === 1, "threshold waits for the mark");
check(responseGain("GATE", 1, null) === 0, "a threshold with no mark stays off");
check(responseGain("INHB", 0, null) === 1 && responseGain("INHB", 0.01, null) === 0, "inhibit runs only while the receptor is quiet");
check(Math.abs(responseGain("FADE", 0.25, null) - 0.75) < 1e-9, "repress fades as saturation rises");
check(responseGain("BELO", 0.5, 0.5) === 1 && responseGain("BELO", 0.51, 0.5) === 0, "below-level stays on up to the mark");
check(responseGain("NOPE", 1, null) === 0, "an unknown response drives nothing");

publishReceptorSignals({ osmolynSaturation: null });
check(expressedAmount(conditional()) === 0, "a conditional gene is off until the receptor reports");
check(conditionalMultiplier(conditional({ responseId: "INHB" })) === 0, "inhibit stays off without a reading");

publishReceptorSignals({ osmolynSaturation: 0 });
check(expressedAmount(conditional()) === 0, "any activity produces nothing in undetectable water");
check(expressedAmount(conditional({ responseId: "INHB", amountId: "MED" })) === 0.5, "inhibit expresses its amount while the receptor is quiet");
check(expressedAmount(conditional({ responseId: "FADE", amountId: "HYPER" })) === 1, "repress is fully on at zero saturation");
check(expressedAmount(conditional({ responseId: "INVP", amountId: "HYPER" })) === 1, "inverse expression is full when the receptor detects nothing");

publishReceptorSignals({ osmolynSaturation: 1 });
check(expressedAmount(conditional({ responseId: "PROP" })) === 1, "proportional reaches the full amount at saturation");
check(expressedAmount(conditional({ responseId: "INVP" })) === 0, "inverse expression is silent at full saturation");
check(expressedAmount(conditional({ responseId: "INHB" })) === 0, "inhibit shuts the gene off at any saturation");
check(expressedAmount(conditional({ responseId: "FADE" })) === 0, "repress is silent at full saturation");
check(expressedAmount(conditional({ responseId: "GATE", threshold: 0.75 })) === 1, "threshold is on once saturation clears the mark");
check(expressedAmount(conditional({ responseId: "BELO", threshold: 0.5 })) === 0, "below-level is off above its mark");
check(expressedAmount(conditional({ receptorId: null })) === 0, "a conditional gene with no receptor produces nothing");

publishReceptorSignals({ osmolynSaturation: 0.5 });
check(Math.abs(expressedAmount(conditional({ responseId: "PROP", amountId: "HYPER" })) - 0.5) < 1e-9, "half saturation yields half of a hyperexpressed amount");
check(Math.abs(expressedAmount(conditional({ responseId: "INVP", amountId: "HYPER" })) - 0.5) < 1e-9, "half saturation yields half of an inversely proportional amount");

publishReceptorSignals({ osmolynSaturation: null });

if (failed > 0) throw new Error(`${failed} receptor drive checks failed`);
console.log("receptor drive checks passed");
