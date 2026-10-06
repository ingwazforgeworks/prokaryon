import {
  beatPeriodSeconds,
  flagellinFromConstructs,
  genomeCanDriveFlagellin,
  genomeDrivesFlagellin,
  genomeHasOscillation,
  initialBeatState,
  motorExpressionLevel,
  motorFromConstructs,
  stepFlagellarBeat,
  type FlagellinConstruct,
} from "./flagellinDistribution";

let failed = 0;

function check(condition: boolean, message: string): void {
  if (condition) return;
  failed += 1;
  console.error(message);
}

const construct = (overrides: Partial<FlagellinConstruct>): FlagellinConstruct => ({
  promoterId: "CNST",
  geneId: "FLGN",
  amountId: null,
  routeId: "SecretoryPeptide",
  siteId: "PolarLocalizationSignal",
  ...overrides,
});

const polar = (amountId: string | null): number => flagellinFromConstructs([construct({ amountId })]).polar;

check(polar("HYPER") === 1, "hyperexpression maxes the site");
check(polar("MICRO") === 0.1, "microexpression keeps the trace baseline");
check(polar("LOW") === 0.3, "low expression yields 0.3");
check(polar("MED") === 0.5, "medium expression yields 0.5");
check(polar("HIGH") === 0.7, "high expression yields 0.7");
check(polar("OVER") === 0.85, "overexpression yields 0.85");
check(polar(null) === 0.1, "an untagged construct expresses the trace baseline");
check(polar("OFF") === 0, "the no-expression tile stays silent");
check(polar("MISSING") === 0.1, "an unknown amount falls back to the trace baseline");
check(flagellinFromConstructs([construct({ amountId: "MED" }), construct({ amountId: "MED" })]).polar === 1, "stacking clamps at the site maximum");
check(flagellinFromConstructs([construct({ amountId: "HYPER", routeId: null })]).polar === 0, "flagellin without a destination route builds nothing");
check(flagellinFromConstructs([construct({ amountId: "HYPER", routeId: "TransmembraneSignal" })]).polar === 0, "transmembrane flagellin is not secreted and builds nothing");
check(flagellinFromConstructs([construct({ amountId: "HYPER", routeId: "SURF" })]).polar === 0, "surface-anchored flagellin builds nothing");
check(flagellinFromConstructs([construct({ amountId: "HYPER", promoterId: "COND" })]).polar === 0, "unexpressed promoters produce no flagellin");
check(!genomeDrivesFlagellin(flagellinFromConstructs([construct({ geneId: "GFP", amountId: "HYPER" })])), "other genes produce no flagellin");

const spread = flagellinFromConstructs([construct({ amountId: "HYPER", siteId: null })]);
check(spread.polar === 0.25 && spread.antipolar === 0.25 && spread.lateral === 0.25 && spread.antilateral === 0.25, "an unpositioned construct spreads a quarter per site");

// Oscillatory promoter: trough at t=0, crest at the half period, trough again
// at the full period, forever.
const oscillating = (timeSeconds: number, overrides: Partial<FlagellinConstruct> = {}): number =>
  flagellinFromConstructs(
    [construct({ promoterId: "OSCL", amountMinId: "MICRO", amountMaxId: "HYPER", ...overrides })],
    timeSeconds,
  ).polar;
check(oscillating(0) === 0.1, "the oscillatory trough equals the minimum tile");
check(oscillating(2) === 1, "the oscillatory crest arrives at the half period");
check(oscillating(4) === 0.1, "a full period returns to the trough");
check(oscillating(8) === 0.1, "the cycle repeats every period");
check(oscillating(2, { amountMinId: "HYPER", amountMaxId: "MICRO" }) === 1, "a swapped min/max pair is clamped into order");
check(oscillating(0, { amountMinId: "OFF", amountMaxId: "HYPER" }) === 0, "an oscillatory no-expression trough bottoms out at zero");
check(oscillating(2, { amountMinId: "OFF", amountMaxId: "HYPER" }) === 1, "an oscillatory range rises from zero to its maximum");
check(flagellinFromConstructs([construct({ promoterId: "OSCL" })], 0).polar === 0, "an oscillatory construct with no tiles bottoms out at zero");
check(Math.abs(flagellinFromConstructs([construct({ promoterId: "OSCL" })], 1).polar - 0.05) < 1e-9, "an oscillatory construct with no tiles swings up to the trace baseline");

const oscillatingMotor = (timeSeconds: number): number =>
  motorFromConstructs(
    [construct({ geneId: "FLGM", routeId: "TransmembraneSignal", promoterId: "OSCL", amountMinId: "MICRO", amountMaxId: "HYPER" })],
    timeSeconds,
  ).polar;
check(oscillatingMotor(0) === 0.1 && oscillatingMotor(2) === 1 && oscillatingMotor(4) === 0.1, "an oscillatory motor pulses over its range");

const motor = (overrides: Partial<FlagellinConstruct>): ReturnType<typeof motorFromConstructs> =>
  motorFromConstructs([construct({ geneId: "FLGM", routeId: "TransmembraneSignal", ...overrides })]);

check(motor({}).polar === 0.1, "a transmembrane motor at the polar site expresses there");
check(motor({ siteId: "AntiPolarLocalizationSignal" }).antipolar === 0.1, "the motor follows its position tag");
const motorSpread = motor({ siteId: null, amountId: "HYPER" });
check(
  motorSpread.polar === 0.25 && motorSpread.antipolar === 0.25 && motorSpread.lateral === 0.25 && motorSpread.antilateral === 0.25,
  "an unpositioned motor spreads a quarter per site",
);
check(motor({ amountId: "HYPER" }).polar === 1, "hyperexpressed motor maxes its site");
check(motorFromConstructs([construct({ geneId: "FLGM", routeId: "TransmembraneSignal", amountId: "MED" }), construct({ geneId: "FLGM", routeId: "TransmembraneSignal", amountId: "MED" })]).polar === 1, "stacking motors clamps at the site maximum");
check(motor({ routeId: "CYTO" }).polar === 0, "a cytosolic motor spins nothing");
check(motor({ routeId: "SecretoryPeptide" }).polar === 0, "a secreted motor spins nothing");
check(motor({ routeId: "SURF" }).polar === 0, "a surface-anchored motor spins nothing");
check(motor({ routeId: null }).polar === 0, "a motor with no route spins nothing");
check(motor({ promoterId: "COND" }).polar === 0, "unexpressed promoters produce no motor");
check(motor({ siteId: "LATR" }).lateral === 0.1 && motor({ siteId: "LATR" }).polar === 0, "a lateral motor stays on its side");
const bipole = motor({ siteId: "BIPO", amountId: "HYPER" });
check(bipole.polar === 0.5 && bipole.antipolar === 0.5, "a bipolar motor splits across both poles");
check(motorFromConstructs([construct({ amountId: "HYPER" })]).polar === 0, "flagellin constructs produce no motor");

check(genomeCanDriveFlagellin([construct({ amountId: "HYPER" })]), "a secreted flagellin construct can drive flagella");
check(genomeCanDriveFlagellin([construct({ promoterId: "OSCL" })]), "an oscillatory flagellin resting at its trough still owns the flagella");
check(!genomeCanDriveFlagellin([construct({ amountId: "HYPER", routeId: "TransmembraneSignal" })]), "transmembrane flagellin cannot drive flagella");
check(!genomeCanDriveFlagellin([construct({ geneId: "FLGM", routeId: "TransmembraneSignal", amountId: "HYPER" })]), "motor constructs alone do not take over the flagellin sliders");
check(!genomeCanDriveFlagellin([construct({ amountId: "HYPER", promoterId: "COND" })]), "unexpressed flagellin cannot drive flagella");

check(genomeHasOscillation([construct({ promoterId: "OSCL" })]), "oscillation detection keys on the promoter");
check(!genomeHasOscillation([construct({})]), "constant promoters do not oscillate");

// Beat clock: the motor fires in discrete pulses whose cycle length scales
// with the expression level — microexpression every 1.6 seconds,
// hyperexpression every 16 — and the pulse span is redrawn each cycle so the
// bursts land stochastically.
check(beatPeriodSeconds(0.1) === 1.6, "microexpression sets a 1.6 second beat cycle");
check(beatPeriodSeconds(1) === 16, "hyperexpression sets a 16 second beat cycle");
check(beatPeriodSeconds(0.5) === 8, "the beat cycle scales linearly with expression");

const silent = stepFlagellarBeat(initialBeatState(), 0, 0.2);
check(silent.envelope === 0 && silent.state.cycle === 0, "no motor protein, no beat");

const countCycles = (level: number, steps: number, dt = 0.2): number => {
  let state = initialBeatState();
  let wraps = 0;
  for (let i = 0; i < steps; i += 1) {
    const stepped = stepFlagellarBeat(state, level, dt);
    if (stepped.state.cycle !== state.cycle) wraps += 1;
    state = stepped.state;
  }
  return wraps;
};
check(countCycles(0.1, 15) === 1, "a microexpressed motor wraps one cycle in 3 seconds");
check(countCycles(0.1, 79) === 9, "microexpression keeps the 1.6 second cadence");
check(countCycles(1, 79) === 0, "a hyperexpressed motor has not finished a beat after 15.8 seconds");
check(countCycles(1, 81) === 1, "a hyperexpressed motor wraps its cycle at 16 seconds");

let beatState = initialBeatState();
let beatPeak = 0;
let beatRests = 0;
let beatCycle = 0;
let whipSteps = 0;
const whipLengths: number[] = [];
for (let i = 0; i < 3200; i += 1) {
  const stepped = stepFlagellarBeat(beatState, 1, 0.005);
  if (stepped.envelope > beatPeak) beatPeak = stepped.envelope;
  if (stepped.envelope === 0) beatRests += 1;
  if (stepped.state.cycle !== beatCycle) {
    whipLengths.push(whipSteps);
    beatCycle = stepped.state.cycle;
    whipSteps = 0;
  }
  if (stepped.envelope > 0) whipSteps += 1;
  beatState = stepped.state;
}
whipLengths.push(whipSteps);
check(beatPeak > 0.9, "each beat cycle lands a full-strength whip");
check(beatRests > 0, "the motor rests in the gap between beats");
check(new Set(whipLengths).size > 1, "pulse spans are redrawn per cycle, so beat timing is stochastic");

const motorLevel = (overrides: Partial<FlagellinConstruct>, timeSeconds = 0): number =>
  motorExpressionLevel([construct({ geneId: "FLGM", routeId: "TransmembraneSignal", ...overrides })], timeSeconds);
check(motorLevel({ amountId: "HYPER" }) === 1, "a hyperexpressed motor reports full expression");
check(motorLevel({ amountId: "MICRO" }) === 0.1, "a microexpressed motor reports trace expression");
check(
  motorExpressionLevel([
    construct({ geneId: "FLGM", routeId: "TransmembraneSignal", amountId: "MED" }),
    construct({ geneId: "FLGM", routeId: "TransmembraneSignal", amountId: "MED" }),
  ]) === 1,
  "stacked motor constructs saturate the expression level",
);
check(motorLevel({ routeId: "CYTO", amountId: "HYPER" }) === 0, "a motor outside the membrane expresses nothing beatable");
check(
  motorLevel({ promoterId: "OSCL", amountMinId: "MICRO", amountMaxId: "HYPER" }, 2) === 1 &&
    motorLevel({ promoterId: "OSCL", amountMinId: "MICRO", amountMaxId: "HYPER" }, 0) === 0.1,
  "an oscillatory motor swings the beat cycle between the 1.6 and 16 second ends",
);

if (failed > 0) throw new Error(`${failed} flagellin distribution checks failed`);
console.log("flagellin distribution checks passed");