import {
  ATP_PER_FLUXIN,
  CARRIER_BASE,
  CARRIER_PER_FLUX_EXPRESSION,
  SYNTHASE_FLUXIN_PER_SECOND,
  atpSynthaseExpressionLevel,
  carrierPoolTarget,
  fluxinSynthaseExpressionLevel,
  reconcileCarrier,
  stepAtpSynthase,
} from "./atpSynthase";
import type { FlagellinConstruct } from "./flagellinDistribution";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

type ConstructOverrides = Partial<FlagellinConstruct>;

function construct(overrides: ConstructOverrides = {}): FlagellinConstruct {
  return {
    promoterId: "CNST",
    geneId: "ATPS",
    amountId: "HYPER",
    amountMinId: null,
    amountMaxId: null,
    routeId: "TransmembraneSignal",
    siteId: null,
    ...overrides,
  };
}

check(SYNTHASE_FLUXIN_PER_SECOND === 15, "full expression spends fifteen fluxin per second");
check(ATP_PER_FLUXIN === 2, "every spent fluxin returns two ATP");
check(CARRIER_BASE === 40, "a cell with no fluxin synthase still holds a small carrier pool");
check(CARRIER_PER_FLUX_EXPRESSION === 160, "full fluxin synthase adds a hundred and sixty carrier");

check(atpSynthaseExpressionLevel([], "ATPS") === 0, "no constructs express no ATP synthase");
check(atpSynthaseExpressionLevel([construct()], "ATPS") === 1, "a hyperexpressed transmembrane synthase reads full");
check(atpSynthaseExpressionLevel([construct({ routeId: null })], "ATPS") === 0, "an untagged ATP synthase is not in the membrane");
check(atpSynthaseExpressionLevel([construct({ routeId: "CYTO" })], "ATPS") === 0, "a cytosolic ATP synthase does not spend fluxin");
check(atpSynthaseExpressionLevel([construct({ amountId: "MED" })], "ATPS") === 0.5, "medium expression scales the synthase");
check(atpSynthaseExpressionLevel([construct({ geneId: "FERR" })], "ATPS") === 0, "a reductase construct is not ATP synthase");

check(fluxinSynthaseExpressionLevel([construct({ geneId: "FLUX", routeId: "CYTO" })], "FLUX") === 1, "a cytosolic fluxin synthase reads full");
check(fluxinSynthaseExpressionLevel([construct({ geneId: "FLUX", routeId: null })], "FLUX") === 1, "an untagged fluxin synthase is cytosolic and counts");
check(fluxinSynthaseExpressionLevel([construct({ geneId: "FLUX", routeId: "TransmembraneSignal" })], "FLUX") === 0, "a membrane-routed fluxin synthase does not size the pool");
check(fluxinSynthaseExpressionLevel([construct()], "FLUX") === 0, "ATP synthase constructs do not size the carrier pool");

check(carrierPoolTarget(0) === CARRIER_BASE, "no fluxin synthase leaves the base pool");
check(carrierPoolTarget(0.5) === CARRIER_BASE + CARRIER_PER_FLUX_EXPRESSION * 0.5, "medium fluxin synthase adds half the extra pool");
check(carrierPoolTarget(1) === CARRIER_BASE + CARRIER_PER_FLUX_EXPRESSION, "full fluxin synthase adds the whole extra pool");
check(carrierPoolTarget(4) === CARRIER_BASE + CARRIER_PER_FLUX_EXPRESSION, "expression above full does not grow the pool further");

const born = reconcileCarrier(0, 0, CARRIER_BASE, 1);
check(born.fluxin === 0 && born.refluxin === CARRIER_BASE, "new carrier arrives spent, as refluxin");
const grown = reconcileCarrier(10, 30, 120, 1);
check(grown.fluxin === 10 && grown.refluxin === 110, "growing the pool adds refluxin and leaves the charge alone");
const shed = reconcileCarrier(30, 20, 40, 1);
check(shed.fluxin === 30 && shed.refluxin === 10, "shrinking the pool sheds refluxin first");
const shedCharge = reconcileCarrier(30, 0, 20, 1);
check(shedCharge.fluxin === 20 && shedCharge.refluxin === 0, "a charged pool sheds fluxin once the refluxin is gone");
const held = reconcileCarrier(15, 25, 40, 1);
check(held.fluxinRate === 0 && held.refluxinRate === 0, "a pool already on target writes a flat rate");

const spent = stepAtpSynthase(100, 0, 1000, 0, 1000, 1, 1);
check(spent.fluxin === 85 && spent.refluxin === 15 && spent.atp === 30, "full expression spends fifteen fluxin and returns two ATP each");
check(spent.fluxin + spent.refluxin === 100, "the synthase conserves the carrier");
check(stepAtpSynthase(100, 0, 1000, 0, 1000, 0.1, 1).atp === 3, "microexpression spends a tenth as much");
const headroom = stepAtpSynthase(100, 0, 1000, 996, 1000, 1, 1);
check(headroom.atp === 1000 && headroom.fluxin === 98 && headroom.refluxin === 2, "a nearly full ATP pool throttles the spend to its headroom");
check(stepAtpSynthase(100, 0, 1000, 1000, 1000, 1, 1).fluxin === 100, "a full ATP pool leaves the fluxin charged");
check(stepAtpSynthase(0, 40, 1000, 0, 1000, 1, 1).atpRate === 0, "no fluxin means no ATP");
check(stepAtpSynthase(40, 990, 1000, 0, 1000, 1, 1).fluxin === 30 && stepAtpSynthase(40, 990, 1000, 0, 1000, 1, 1).refluxin === 1000, "refluxin room caps the spend");
check(stepAtpSynthase(40, 0, 0, 0, 1000, 1, 1).atp === 0, "a zero-capacity refluxin pool spends nothing");
check(stepAtpSynthase(40, 0, 1000, 0, 1000, 0, 1).atpRate === 0, "no synthase means no spend");
check(stepAtpSynthase(40, 0, 1000, 0, 1000, 1, 0).atpRate === 0, "a zero step leaves the pools alone");

if (failed > 0) throw new Error(`${failed} ATP synthase checks failed`);
console.log("ATP synthase checks passed");
