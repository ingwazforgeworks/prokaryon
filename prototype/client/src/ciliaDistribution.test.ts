import {
  CILIATION_MAX,
  cilinFromConstructs,
  ciliumMotorDrive,
  ciliumMotorFromConstructs,
  genomeCanDriveCilia,
} from "./ciliaDistribution";
import type { FlagellinConstruct } from "./flagellinDistribution";
import type { FlagellinBySite } from "./flagellinDistribution";
import { stepSwim, type SwimBody, type SwimState } from "./swim";

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
    geneId: "CILN",
    amountId: "HYPER",
    amountMinId: null,
    amountMaxId: null,
    routeId: "SecretoryPeptide",
    siteId: null,
    ...overrides,
  };
}

function motorConstruct(overrides: ConstructOverrides = {}): FlagellinConstruct {
  return construct({ geneId: "CILM", routeId: "TransmembraneSignal", ...overrides });
}

// Cilin coat: density and hair length both follow the expression level.
check(CILIATION_MAX === 48, "the coat tops out at the slider's ceiling");
check(cilinFromConstructs([]).ciliation === 0 && cilinFromConstructs([]).length === 0, "no constructs grow no coat");
const full = cilinFromConstructs([construct()]);
check(full.ciliation === 48 && full.length === 1, "a hyperexpressed cilin grows the full coat at full length");
const micro = cilinFromConstructs([construct({ amountId: "MICRO" })]);
check(micro.ciliation === Math.round(CILIATION_MAX * 0.1) && micro.length === 0.1, "microexpression grows a sparse coat of short hairs");
check(cilinFromConstructs([construct({ routeId: "TransmembraneSignal" })]).ciliation === 0, "cilin left in the membrane bristles nothing");
check(cilinFromConstructs([construct({ routeId: null })]).ciliation === 0, "untagged cilin stays inside and bristles nothing");
check(cilinFromConstructs([construct({ promoterId: "GRAD" })]).ciliation === 0, "unsimulated promoters grow no coat yet");
check(cilinFromConstructs([construct({ geneId: "FLGN" })]).ciliation === 0, "flagellin constructs do not grow a coat");
const swing = { promoterId: "OSCL", amountId: null, amountMinId: "MICRO", amountMaxId: "HYPER" } satisfies ConstructOverrides;
check(cilinFromConstructs([construct(swing)], 0).length === 0.1, "an oscillatory cilin rests at its minimum at t=0");
check(cilinFromConstructs([construct(swing)], 2).length === 1, "an oscillatory cilin peaks at its maximum at the half period");
check(genomeCanDriveCilia([construct(swing)]), "a troughing oscillatory cilin still holds genome ownership");
check(!genomeCanDriveCilia([construct({ promoterId: "GRAD" })]), "an unsimulated promoter never claims ownership");
check(!genomeCanDriveCilia([construct({ geneId: "CILM" })]), "motor constructs alone do not claim the coat");

// Motor distribution: transmembrane copies only, position tags concentrate them.
const spread = ciliumMotorFromConstructs([motorConstruct()]);
check(spread.polar === 0.25 && spread.antipolar === 0.25 && spread.lateral === 0.25 && spread.antilateral === 0.25, "an untagged motor spreads evenly across the sites");
const polar = ciliumMotorFromConstructs([motorConstruct({ siteId: "PolarLocalizationSignal" })]);
check(polar.polar === 1 && polar.lateral === 0, "a polar-tagged motor concentrates on the polar site");
const bipolar = ciliumMotorFromConstructs([motorConstruct({ siteId: "BIPO" })]);
check(bipolar.polar === 0.5 && bipolar.antipolar === 0.5 && bipolar.lateral === 0, "a bipolar motor splits across the poles");
check(ciliumMotorFromConstructs([motorConstruct({ routeId: "SecretoryPeptide" })]).polar === 0, "a secreted motor is outside the membrane and rows nothing");
check(ciliumMotorFromConstructs([motorConstruct({ promoterId: "GRAD" })]).polar === 0, "unsimulated promoters produce no motor yet");

// Net drive: sites add as vectors, opposing sites cancel, mixed sites steer between.
const drive = (motor: FlagellinBySite) => ciliumMotorDrive(motor);
check(drive(polar).x === 0 && drive(polar).y === 1 && drive(polar).strength === 1, "a polar motor rows the cell toward the lateral flank");
check(drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "LATR" })])).x === -1, "a lateral motor rows the cell toward the antipolar pole");
check(drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "ANTL" })])).x === 1, "an antilateral motor rows the cell toward the polar pole");
check(drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "AntiPolarLocalizationSignal" })])).y === -1, "an antipolar motor rows the cell toward the antilateral flank");
check(drive(bipolar).strength === 0, "motors on opposing poles cancel to a standstill");
check(drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "BILT" })])).strength === 0, "motors on opposing flanks cancel to a standstill");
check(drive(spread).strength === 0, "a motor spread over all four sites rows nowhere");
const mixed = ciliumMotorFromConstructs([
  motorConstruct({ siteId: "PolarLocalizationSignal", amountId: "MED" }),
  motorConstruct({ siteId: "LATR", amountId: "MED" }),
]);
const mixedDrive = drive(mixed);
check(Math.abs(mixedDrive.x - (-Math.SQRT1_2)) < 1e-9 && Math.abs(mixedDrive.y - Math.SQRT1_2) < 1e-9, "mixed motors steer between the named directions");
check(Math.abs(mixedDrive.strength - Math.SQRT1_2) < 1e-9, "mixed motors row more gently than a full single-site motor");
const opposed = drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "LATR" }), motorConstruct({ siteId: "ANTL", amountId: "MED" })]));
check(opposed.x === -1 && opposed.strength === 0.5, "a weaker opposing motor leaves the dominant direction at partial strength");
check(drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "LATR" }), motorConstruct({ siteId: "LATR", amountId: "MED" })])).x === -1, "stacked same-site motors add and clamp");

// Swim: the motor's drive replaces the switch, and a standstill motor leaves the coat idle.
function body(overrides: Partial<SwimBody> = {}): SwimBody {
  return {
    length: 2,
    width: 1,
    bend: 0,
    angle: 0,
    antipolar: 0,
    polar: 0,
    lateral: 0,
    antilateral: 0,
    undulation: 0,
    ciliation: 24,
    ciliaLength: 1,
    ciliaSpeed: 1,
    ciliaSway: 1,
    ciliaOrder: 1,
    ciliaSwitch: "lateral",
    ciliaReverse: false,
    ...overrides,
  };
}
const still: SwimState = { vx: 0, vy: 0, omega: 0, thrusting: false, driveX: 0, driveY: 0 };
function settle(testBody: SwimBody): SwimState {
  let state = still;
  for (let step = 0; step < 120; step += 1) state = stepSwim(state, testBody, 0.05);
  return state;
}
const polarSwim = settle(body({ ciliaMotor: drive(polar) }));
check(polarSwim.vy > 0.05 && Math.abs(polarSwim.vx) < 0.01, "a polar motor pushes the cell toward the lateral flank");
const lateralSwim = settle(body({ ciliaMotor: drive(ciliumMotorFromConstructs([motorConstruct({ siteId: "LATR" })])) }));
check(lateralSwim.vx < -0.05 && Math.abs(lateralSwim.vy) < 0.01, "a lateral motor pushes the cell toward the antipolar pole");
const switchSwim = settle(body({ ciliaSwitch: "polar" }));
check(Math.abs(polarSwim.vy - switchSwim.vy) < 1e-6, "a polar motor matches the polar switch's push");
const reversedSwim = settle(body({ ciliaMotor: drive(polar), ciliaReverse: true }));
check(reversedSwim.vy < -0.05, "reversal turns the motor's stroke around");
const idleSwim = settle(body({ ciliaMotor: drive(bipolar) }));
check(Math.abs(idleSwim.vx) < 1e-6 && Math.abs(idleSwim.vy) < 1e-6, "a standstill motor leaves the coat idle");
const gentleSwim = settle(body({ ciliaMotor: { x: 0, y: 1, strength: 0.1 } }));
check(gentleSwim.vy > 0 && gentleSwim.vy < polarSwim.vy * 0.6, "motor strength scales the push");

if (failed > 0) throw new Error(`${failed} cilia distribution checks failed`);
console.log("cilia distribution checks passed");