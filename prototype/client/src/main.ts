import { buoyancyExpressionLevel, buoyancyVelocity, genomeCanDriveBuoyancy, stepBuoyancyVelocity } from "./buoyancy";
import { bootFinish, bootMark } from "./boot";
import { initCodex } from "./codex";
import { initDock, onEnvironmentVisible } from "./dock";
import { createEnvironmentProbe } from "./environmentProbe";
import { createInspect, playerCellTarget } from "./inspect";
import { initGenomeEditor } from "./genomeEditor";
import { initExpression, syncExpressionCell } from "./expression";
import { initGenomeViewer } from "./genomeViewer";
import { clearGenome, getGenome, loadGenomeState, persistGenome, subscribeGenome } from "./genomeState";
import {
  flagellinFromConstructs,
  genomeCanDriveFlagellin,
  initialBeatState,
  motorExpressionLevel,
  motorFromConstructs,
  stepFlagellarBeat,
  type FlagellarBeatState,
  type FlagellinBySite,
} from "./flagellinDistribution";
import { loadUnlocks, unlockAllGenes } from "./geneUnlocks";
import { capsuleGap, capsulesOverlap, type Capsule } from "./cellCollision";
import { permeaseExpressionLevel, stepPermeaseUptake } from "./permeaseUptake";
import { reductaseExpressionLevel, stepReductase } from "./reductase";
import { anabolaseExpressionLevel, cyclinExpressionLevel, cyclinTriggersDivision, stepAnabolaseGrowth } from "./reproduction";
import {
  CILIATION_MAX,
  cilinFromConstructs,
  ciliumMotorDrive,
  ciliumMotorFromConstructs,
  genomeCanDriveCilia,
  type CiliumMotorDrive,
} from "./ciliaDistribution";
import { genomeCanDriveLubricin, lubricinExpressionLevel } from "./lubricin";
import {
  cytosolicMorphologyLevel,
  genomeCanDriveCytosolicMorphology,
  genomeCanDriveSecretedMorphology,
  genomeCanDriveTaperin,
  secretedMorphologyLevel,
  taperinCellTaper,
} from "./morphologyDistribution";
import { PILIN_LENGTH_VARIANCE, genomeCanDrivePilin, pilinFromConstructs, pilinSecretedFromConstructs, type PilinCoat } from "./pilinDistribution";
import { loadCellState, saveCellState } from "./debugCellState";
import { initTechTree } from "./techTree";
import { initPlayer } from "./player";
import { initResourceBar } from "./resourceBar";
import { cellResources, mutationPointCount, onResources, setMutationPoints, setPopulation, updateResource } from "./resources";
import { initTitleScreen, titleScreenOpen } from "./menu";
import { initSettings } from "./settingsPanel";
import { bindButtonSounds, playCue } from "./uiSound";
import { LightDebug } from "./debug";
import { columnAttenuation, formatTimeOfDay, SUN_HOUR_SECONDS, sunCycle } from "./light";
import { copyFluor, copyPigment, emptyFluor, emptyPigment, fluorEmission, pigmentTint, type FluorLevels, type PigmentLevels } from "./pigment";
import { CellRenderer, INTERIOR_BASE_COLOR, ISOPRENOID_SHADE, type FieldOverlay } from "./renderer";
import { SimulationSession } from "./session";
import { filamentsForFlagellin } from "./flagellum";
import { acceptedVelocity, collisionSpin, flagellarPulseLabel, independentPulseState, independentSwitchState, randomPulseScale, RELEASE_RECOIL, retainSwimVelocity, stepBeatSwitch, stepFlagellarPulse, stepFlagellarSwitch, stepSwim, stepTumble, type FlagellarPulseState, type FlagellarSwitchState, type SwimState } from "./swim";
import { TAPER_ALL, TAPER_ANTILATERAL, TAPER_ANTIPOLAR, TAPER_LATERAL, TAPER_POLAR, capsuleArea, cellSeparation, ciliaPlacements, curvedHalfExtents, divisionAxisOffset, flagellarBodyLength, maxPiliOnSite, orientedCapsule, piliPlacements, pilusVolumeSamples, vibrioHalfAngle, type BodyShape, type FlagellumSite, type PilusSite, type PosedBody } from "./shape";
import { adhesinPull, terrainSlideKeep } from "./terrain";
import { texelIdAt } from "./texels";
import type { CellSnapshot, CellTaper, CiliaSwitch, CiliumSnapshot, FlagellumSnapshot, PilusFragmentSnapshot, PilusSnapshot, ViewSnapshot } from "./types";
import { initialPilusEjection, pilusFragmentAlpha, stepPilusEjection, type PilusEmitter, type PilusEjectionState } from "./pilusEjection";

const canvas = document.querySelector<HTMLCanvasElement>("#view");
if (!canvas) throw new Error("missing canvas");
bootMark("scripts", 1);

const MOVE_SPEED = 5.5;
const SHIFT_BOOST = 10;
const TURN_SPEED = 1.8;
const BODY_WIDTH = 0.75;
const PIXELS_PER_UNIT = 32;

const SIZE_MIN = 0.5;
const SIZE_MAX = 3;
const PILI_MAX = 32;
const DIVISION_MIN_SCALE = SIZE_MIN * 2;
const DIVISION_SECONDS = 2.5;
/** Cilia and pili thin out before fission and return on the daughters. */
const CILIA_FADE_SECONDS = 0.65;
const PILI_FADE_SECONDS = 0.65;
/** Newborns produce no flagellar or ciliary thrust, so they neither ram the parent nor inherit its swim phase. */
const MOTILITY_REST_SECONDS = 5;
const ELONGATION_MAX_RATIO = 5;
// Debug spawn sits near the seafloor so testing does not start at the surface.
const pose = { x: 0, y: -450, angle: 0, length: BODY_WIDTH * 2 };
let elongation = 0.25;
let girth = 0;
let crescent = 0;
let buoyin = 0;
let ballastin = 0;
// Actual vertical drift velocity. It accelerates toward the buoyancy target
// under hydrodynamic drag instead of tracking it instantly, so oscillating
// buoyin and ballastin levels swing the cell smoothly rather than flipping
// its direction every frame.
let buoyancyDriftVelocity = 0;
let lubricin = 0;
let adhesin = 0;
let antipolarFlagellin = 0;
let polarFlagellin = 0;
let lateralFlagellin = 0;
let antilateralFlagellin = 0;
let ciliation = 0;
let ciliaLength = 1;
let ciliaSpeed = 1;
let ciliaSway = 1;
let ciliaOrder = 1;
let ciliaSwitch: CiliaSwitch = "lateral";
let ciliaReverse = false;
let piliCount = 0;
let piliLength = 0.55;
let piliVariance = 0;
let pilusSite: PilusSite = "polar";
// Transmembrane pili stand as spikes on the membrane. Secreted pili shed
// fragments from the emergence regions instead, and the recoil pushes the
// cell. The sandbox mode buttons pick between the two until the genome
// expresses pilin; then each construct's route decides — transmembrane
// constructs stand spikes on their regions and secreted constructs eject
// from theirs, and the two can run at once.
let pilusMode: "transmembrane" | "secreted" = "transmembrane";
let pilusEjection: PilusEjectionState = initialPilusEjection();
let genomeDrivesPilinState = false;
let genomePilinCoats: PilinCoat[] = [];
let genomeSecretedPilinCoats: PilinCoat[] = [];
let taperMask = 0;
let taperPolarDegree = 1;
let taperAntipolarDegree = 1;
let taperLateralDegree = 1;
let taperAntilateralDegree = 1;
let undulation = 1;
/** Per-site beat strength from expressed motor protein, when the genome drives flagellin. */
let undulationBySite: FlagellinBySite | null = null;
let pulse = 1;
let flagellarPulse: FlagellarPulseState = { swimming: true, elapsed: 0, pulse: 1 };
let flagellarSwitch: FlagellarSwitchState = { clockwise: true, nextClockwise: true, tumbleSign: 1, tumbleOmega: 0 };
let ccwSwitching = true;
let wasdEnabled = false;
const swim: SwimState = { vx: 0, vy: 0, omega: 0, thrusting: true, driveX: 0, driveY: 0 };
let cellScale = 1;
let nextCellId = 2;
let applyAll = false;
let pigment: PigmentLevels = emptyPigment();
let fluor: FluorLevels = emptyFluor();
let controlledId = 1;
let controlledSeed = 1;
let controlledPulseScale = 1;
let controlledMotilityRest = 0;
let controlledCiliaPresence = 1;
let controlledCiliaFade: PresenceFade | null = null;
let controlledPiliPresence = 1;
let controlledPiliFade: PresenceFade | null = null;
const lineage: number[] = [1];
type PresenceFade = { from: number; to: number; startedAt: number; seconds: number };
type BodyPose = { x: number; y: number; angle: number; length: number };
type CellForm = { scale: number; elongation: number; girth: number; crescent: number; taper: CellTaper };
type DivisionState = { startedAt: number; placeOffset: number; furrowAxis: number; scale: number };
type MembraneLook = { px: number; style: number; color: [number, number, number] };
type SimulatedCell = {
  id: number;
  seed: number;
  form: CellForm;
  membrane: MembraneLook;
  pigment: PigmentLevels;
  fluor: FluorLevels;
  pose: BodyPose;
  swim: SwimState;
  pulse: FlagellarPulseState;
  /** Stretches this cell's swim and rest intervals. 1 matches the pulse slider. */
  pulseScale: number;
  flagellar: FlagellarSwitchState;
  /** Seconds of motility still held after this cell was born. */
  motilityRest: number;
  ciliaPresence: number;
  ciliaFade: PresenceFade | null;
  piliPresence: number;
  piliFade: PresenceFade | null;
  division: DivisionState | null;
};
/** Motility sliders. The controlled cell reads the live globals. A menu swimmer keeps its own. */
type CellDrive = {
  buoyin: number;
  ballastin: number;
  lubricin: number;
  adhesin: number;
  antipolar: number;
  polar: number;
  lateral: number;
  antilateral: number;
  ciliation: number;
  ciliaLength: number;
  ciliaSpeed: number;
  ciliaSway: number;
  ciliaOrder: number;
  ciliaSwitch: CiliaSwitch;
  ciliaReverse: boolean;
  /** Net ciliary push from expressed motor protein. Null leaves the switch in charge. */
  ciliaMotor: CiliumMotorDrive | null;
  piliCount: number;
  piliLength: number;
  piliVariance: number;
  pilusSite: PilusSite;
  /** Per-region needles from expressed pilin. Null leaves the sandbox pili controls in charge. */
  piliCoats: readonly PilinCoat[] | null;
  undulation: number;
  undulationBySite: FlagellinBySite | null;
  pulse: number;
  ccw: boolean;
};
type MenuSwimmer = {
  id: number;
  seed: number;
  form: CellForm;
  membrane: MembraneLook;
  pigment: PigmentLevels;
  fluor: FluorLevels;
  drive: CellDrive;
  pose: BodyPose;
  swim: SwimState;
  pulse: FlagellarPulseState;
  pulseScale: number;
  flagellar: FlagellarSwitchState;
};
const siblings: SimulatedCell[] = [];
let division: DivisionState | null = null;
const held = new Set<string>();

const positionQuery = document.querySelector<HTMLElement>("#position");
if (!positionQuery) throw new Error("missing position readout");
const positionReadout = positionQuery;

const renderer = new CellRenderer(canvas);
bootMark("shaders", 1);
renderer.setCellScale(cellScale);
const inspect = createInspect(canvas, renderer);
let environmentOn = false;
const environmentProbe = createEnvironmentProbe((clientX, clientY) => {
  if (titleScreenOpen()) return null;
  const world = renderer.worldAt(clientX, clientY);
  if (!world) return null;
  return renderer.probeEnvironment(world[0], world[1]);
});
const debug = new LightDebug();
const timeDec = document.querySelector<HTMLButtonElement>("#time-dec");
const timeInc = document.querySelector<HTMLButtonElement>("#time-inc");
const timeReadout = document.querySelector<HTMLElement>("#time-value");
if (!timeDec || !timeInc || !timeReadout) throw new Error("missing time of day controls");
const timeLabel = timeReadout;
/** Added to the sun clock. One step is one hour of the day. */
let sunShiftSeconds = 0;
let shownTime = timeLabel.textContent ?? "";
timeDec.addEventListener("click", () => {
  sunShiftSeconds -= SUN_HOUR_SECONDS;
});
timeInc.addEventListener("click", () => {
  sunShiftSeconds += SUN_HOUR_SECONDS;
});
const environmentTab = document.querySelector<HTMLButtonElement>("#debug-tab-environment");
const cellTab = document.querySelector<HTMLButtonElement>("#debug-tab-cell");
const geneticsTab = document.querySelector<HTMLButtonElement>("#debug-tab-genetics");
const motilityTab = document.querySelector<HTMLButtonElement>("#debug-tab-motility");
const morphologyTab = document.querySelector<HTMLButtonElement>("#debug-tab-morphology");
const pigmentTab = document.querySelector<HTMLButtonElement>("#debug-tab-pigment");
const environmentPanel = document.querySelector<HTMLElement>("#debug-environment");
const cellPanel = document.querySelector<HTMLElement>("#debug-cell");
const geneticsPanel = document.querySelector<HTMLElement>("#debug-genetics");
const mutationPointsDec = document.querySelector<HTMLButtonElement>("#mutation-points-dec");
const mutationPointsInc = document.querySelector<HTMLButtonElement>("#mutation-points-inc");
const mutationPointsReadout = document.querySelector<HTMLElement>("#mutation-points-value");
if (!mutationPointsDec || !mutationPointsInc || !mutationPointsReadout) throw new Error("missing mutation point controls");
const paintMutationPoints = (): void => {
  mutationPointsReadout.textContent = String(mutationPointCount());
};
paintMutationPoints();
onResources(paintMutationPoints);
mutationPointsDec.addEventListener("click", () => setMutationPoints(mutationPointCount() - 1));
mutationPointsInc.addEventListener("click", () => setMutationPoints(mutationPointCount() + 1));
const unlockAllGenesButton = document.querySelector<HTMLButtonElement>("#unlock-all-genes");
if (!unlockAllGenesButton) throw new Error("missing unlock all genes");
unlockAllGenesButton.addEventListener("click", () => {
  unlockAllGenes();
});
const deleteAllGenes = document.querySelector<HTMLButtonElement>("#delete-all-genes");
if (!deleteAllGenes) throw new Error("missing delete all genes");
deleteAllGenes.addEventListener("click", () => {
  clearGenome();
  void persistGenome();
});
const saveCellStateButton = document.querySelector<HTMLButtonElement>("#save-cell-state");
const loadCellStateButton = document.querySelector<HTMLButtonElement>("#load-cell-state");
const cellStateStatus = document.querySelector<HTMLElement>("#cell-state-status");
if (!saveCellStateButton || !loadCellStateButton) throw new Error("missing cell state buttons");
const setCellStateStatus = (text: string): void => {
  if (cellStateStatus) cellStateStatus.textContent = text;
};
saveCellStateButton.addEventListener("click", () => {
  const ok = saveCellState();
  playCue(ok ? "success" : "alarm");
  setCellStateStatus(ok ? "Cell state saved" : "Save failed");
});
loadCellStateButton.addEventListener("click", () => {
  const ok = loadCellState();
  playCue(ok ? "success" : "alarm");
  setCellStateStatus(ok ? "Cell state loaded" : "No saved cell state");
});
const motilityPanel = document.querySelector<HTMLElement>("#debug-motility");
const morphologyPanel = document.querySelector<HTMLElement>("#debug-morphology");
const pigmentPanel = document.querySelector<HTMLElement>("#debug-pigment");
const carotinSlider = document.querySelector<HTMLInputElement>("#cell-carotin");
const carotinReadout = document.querySelector<HTMLElement>("#cell-carotin-value");
const rhodinSlider = document.querySelector<HTMLInputElement>("#cell-rhodin");
const rhodinReadout = document.querySelector<HTMLElement>("#cell-rhodin-value");
const siderinSlider = document.querySelector<HTMLInputElement>("#cell-siderin");
const siderinReadout = document.querySelector<HTMLElement>("#cell-siderin-value");
const cryptochromeSlider = document.querySelector<HTMLInputElement>("#cell-cryptochrome");
const cryptochromeReadout = document.querySelector<HTMLElement>("#cell-cryptochrome-value");
const gfpSlider = document.querySelector<HTMLInputElement>("#cell-gfp");
const gfpReadout = document.querySelector<HTMLElement>("#cell-gfp-value");
const yfpSlider = document.querySelector<HTMLInputElement>("#cell-yfp");
const yfpReadout = document.querySelector<HTMLElement>("#cell-yfp-value");
const bfpSlider = document.querySelector<HTMLInputElement>("#cell-bfp");
const bfpReadout = document.querySelector<HTMLElement>("#cell-bfp-value");
const rfpSlider = document.querySelector<HTMLInputElement>("#cell-rfp");
const rfpReadout = document.querySelector<HTMLElement>("#cell-rfp-value");
const elongationSlider = document.querySelector<HTMLInputElement>("#cell-elongation");
const elongationReadout = document.querySelector<HTMLElement>("#cell-elongation-value");
const girthSlider = document.querySelector<HTMLInputElement>("#cell-girth");
const girthReadout = document.querySelector<HTMLElement>("#cell-girth-value");
const crescentSlider = document.querySelector<HTMLInputElement>("#cell-crescent");
const crescentReadout = document.querySelector<HTMLElement>("#cell-crescent-value");
const taperPolarButton = document.querySelector<HTMLButtonElement>("#taper-polar");
const taperAntipolarButton = document.querySelector<HTMLButtonElement>("#taper-antipolar");
const taperLateralButton = document.querySelector<HTMLButtonElement>("#taper-lateral");
const taperAntilateralButton = document.querySelector<HTMLButtonElement>("#taper-antilateral");
const taperAllButton = document.querySelector<HTMLButtonElement>("#taper-all");
const taperPolarSlider = document.querySelector<HTMLInputElement>("#taper-degree-polar");
const taperPolarReadout = document.querySelector<HTMLElement>("#taper-degree-polar-value");
const taperAntipolarSlider = document.querySelector<HTMLInputElement>("#taper-degree-antipolar");
const taperAntipolarReadout = document.querySelector<HTMLElement>("#taper-degree-antipolar-value");
const taperLateralSlider = document.querySelector<HTMLInputElement>("#taper-degree-lateral");
const taperLateralReadout = document.querySelector<HTMLElement>("#taper-degree-lateral-value");
const taperAntilateralSlider = document.querySelector<HTMLInputElement>("#taper-degree-antilateral");
const taperAntilateralReadout = document.querySelector<HTMLElement>("#taper-degree-antilateral-value");
const buoyinSlider = document.querySelector<HTMLInputElement>("#cell-buoyin");
const buoyinReadout = document.querySelector<HTMLElement>("#cell-buoyin-value");
const ballastinSlider = document.querySelector<HTMLInputElement>("#cell-ballastin");
const ballastinReadout = document.querySelector<HTMLElement>("#cell-ballastin-value");
const lubricinSlider = document.querySelector<HTMLInputElement>("#cell-lubricin");
const lubricinReadout = document.querySelector<HTMLElement>("#cell-lubricin-value");
const adhesinSlider = document.querySelector<HTMLInputElement>("#cell-adhesin");
const adhesinReadout = document.querySelector<HTMLElement>("#cell-adhesin-value");
const antipolarSlider = document.querySelector<HTMLInputElement>("#cell-flagellin-antipolar");
const antipolarReadout = document.querySelector<HTMLElement>("#cell-flagellin-antipolar-value");
const polarSlider = document.querySelector<HTMLInputElement>("#cell-flagellin-polar");
const polarReadout = document.querySelector<HTMLElement>("#cell-flagellin-polar-value");
const lateralSlider = document.querySelector<HTMLInputElement>("#cell-flagellin-lateral");
const lateralReadout = document.querySelector<HTMLElement>("#cell-flagellin-lateral-value");
const antilateralSlider = document.querySelector<HTMLInputElement>("#cell-flagellin-antilateral");
const antilateralReadout = document.querySelector<HTMLElement>("#cell-flagellin-antilateral-value");
const ciliationSlider = document.querySelector<HTMLInputElement>("#cell-ciliation");
const ciliationReadout = document.querySelector<HTMLElement>("#cell-ciliation-value");
const ciliaLengthSlider = document.querySelector<HTMLInputElement>("#cell-cilia-length");
const ciliaLengthReadout = document.querySelector<HTMLElement>("#cell-cilia-length-value");
const ciliaSpeedSlider = document.querySelector<HTMLInputElement>("#cell-cilia-speed");
const ciliaSpeedReadout = document.querySelector<HTMLElement>("#cell-cilia-speed-value");
const ciliaSwaySlider = document.querySelector<HTMLInputElement>("#cell-cilia-sway");
const ciliaSwayReadout = document.querySelector<HTMLElement>("#cell-cilia-sway-value");
const ciliaOrderSlider = document.querySelector<HTMLInputElement>("#cell-cilia-order");
const ciliaOrderReadout = document.querySelector<HTMLElement>("#cell-cilia-order-value");
const ciliaSwitchLateral = document.querySelector<HTMLButtonElement>("#cilia-switch-lateral");
const ciliaSwitchAntilateral = document.querySelector<HTMLButtonElement>("#cilia-switch-antilateral");
const ciliaSwitchPolar = document.querySelector<HTMLButtonElement>("#cilia-switch-polar");
const ciliaSwitchAntipolar = document.querySelector<HTMLButtonElement>("#cilia-switch-antipolar");
const ciliaReverseButton = document.querySelector<HTMLButtonElement>("#cell-cilia-reverse");
const piliSlider = document.querySelector<HTMLInputElement>("#cell-pili");
const piliReadout = document.querySelector<HTMLElement>("#cell-pili-value");
const piliLengthSlider = document.querySelector<HTMLInputElement>("#cell-pili-length");
const piliLengthReadout = document.querySelector<HTMLElement>("#cell-pili-length-value");
const piliVarianceSlider = document.querySelector<HTMLInputElement>("#cell-pili-variance");
const piliVarianceReadout = document.querySelector<HTMLElement>("#cell-pili-variance-value");
const piliPolarButton = document.querySelector<HTMLButtonElement>("#pili-polar");
const piliAntipolarButton = document.querySelector<HTMLButtonElement>("#pili-antipolar");
const piliLateralButton = document.querySelector<HTMLButtonElement>("#pili-lateral");
const piliAntilateralButton = document.querySelector<HTMLButtonElement>("#pili-antilateral");
const piliAllButton = document.querySelector<HTMLButtonElement>("#pili-all");
const piliModeTransmembraneButton = document.querySelector<HTMLButtonElement>("#pili-mode-transmembrane");
const piliModeSecretedButton = document.querySelector<HTMLButtonElement>("#pili-mode-secreted");
const undulationSlider = document.querySelector<HTMLInputElement>("#cell-undulation");
const undulationReadout = document.querySelector<HTMLElement>("#cell-undulation-value");
const pulseSlider = document.querySelector<HTMLInputElement>("#cell-pulse");
const pulseReadout = document.querySelector<HTMLElement>("#cell-pulse-value");
const ccwButton = document.querySelector<HTMLButtonElement>("#cell-ccw");
const sizeSlider = document.querySelector<HTMLInputElement>("#cell-size");
const sizeReadout = document.querySelector<HTMLElement>("#cell-size-value");
const membranePlain = document.querySelector<HTMLButtonElement>("#membrane-plain");
const membraneWall = document.querySelector<HTMLButtonElement>("#membrane-wall");
const membraneIsoprenoid = document.querySelector<HTMLButtonElement>("#membrane-isoprenoid");
const membraneCrystal = document.querySelector<HTMLButtonElement>("#membrane-crystal");
const membranePxSlider = document.querySelector<HTMLInputElement>("#cell-membrane-px");
const membranePxReadout = document.querySelector<HTMLElement>("#cell-membrane-px-value");
const membraneColorInput = document.querySelector<HTMLInputElement>("#cell-membrane-color");
const wasdButton = document.querySelector<HTMLButtonElement>("#cell-wasd");
const divideButton = document.querySelector<HTMLButtonElement>("#cell-divide");
const applyAllButton = document.querySelector<HTMLButtonElement>("#cell-apply-all");
const speciesPlate = document.querySelector<HTMLElement>("#species-plate");
const speciesName = document.querySelector<HTMLElement>("#species-name");
const speciesPrev = document.querySelector<HTMLButtonElement>("#species-prev");
const speciesNext = document.querySelector<HTMLButtonElement>("#species-next");
const speciesCount = document.querySelector<HTMLElement>("#species-count");
const clearButton = document.querySelector<HTMLButtonElement>("#cell-clear");
const divideNote = document.querySelector<HTMLElement>("#cell-divide-note");
const paintButton = document.querySelector<HTMLButtonElement>("#terrain-paint");
const ventButton = document.querySelector<HTMLButtonElement>("#terrain-vent");
const lightButton = document.querySelector<HTMLButtonElement>("#terrain-light");
const bubbleButton = document.querySelector<HTMLButtonElement>("#terrain-bubble");
const heatButton = document.querySelector<HTMLButtonElement>("#terrain-heat");
const heatSizeReadout = document.querySelector<HTMLElement>("#heat-size");
const heatDec = document.querySelector<HTMLButtonElement>("#heat-dec");
const heatInc = document.querySelector<HTMLButtonElement>("#heat-inc");
const zoomFreeButton = document.querySelector<HTMLButtonElement>("#zoom-free");
const texelButton = document.querySelector<HTMLButtonElement>("#texel-grid");
const temperatureButton = document.querySelector<HTMLButtonElement>("#temperature-overlay");
const oxidexButton = document.querySelector<HTMLButtonElement>("#oxidex-overlay");
const sulfexButton = document.querySelector<HTMLButtonElement>("#sulfex-overlay");
const pressureButton = document.querySelector<HTMLButtonElement>("#pressure-overlay");
const depositButton = document.querySelector<HTMLButtonElement>("#terrain-deposit");
const decorButton = document.querySelector<HTMLButtonElement>("#terrain-decor");
const eraseButton = document.querySelector<HTMLButtonElement>("#terrain-erase");
const saveButton = document.querySelector<HTMLButtonElement>("#terrain-save");
const terrainStatus = document.querySelector<HTMLElement>("#terrain-status");
const decorType = document.querySelector<HTMLSelectElement>("#decor-type");
const depositType = document.querySelector<HTMLSelectElement>("#deposit-type");
const decorRandom = document.querySelector<HTMLButtonElement>("#decor-random");
const decorLayerButtons = {
  back: document.querySelector<HTMLButtonElement>("#decor-back"),
  mid: document.querySelector<HTMLButtonElement>("#decor-mid"),
  fore: document.querySelector<HTMLButtonElement>("#decor-fore"),
};
const depositFacingButtons = {
  right: document.querySelector<HTMLButtonElement>("#deposit-right"),
  up: document.querySelector<HTMLButtonElement>("#deposit-up"),
  left: document.querySelector<HTMLButtonElement>("#deposit-left"),
  bottom: document.querySelector<HTMLButtonElement>("#deposit-bottom"),
};
if (
  !environmentTab ||
  !cellTab ||
  !geneticsTab ||
  !motilityTab ||
  !morphologyTab ||
  !pigmentTab ||
  !environmentPanel ||
  !cellPanel ||
  !geneticsPanel ||
  !motilityPanel ||
  !morphologyPanel ||
  !pigmentPanel ||
  !carotinSlider ||
  !carotinReadout ||
  !rhodinSlider ||
  !rhodinReadout ||
  !siderinSlider ||
  !siderinReadout ||
  !cryptochromeSlider ||
  !cryptochromeReadout ||
  !gfpSlider ||
  !gfpReadout ||
  !yfpSlider ||
  !yfpReadout ||
  !bfpSlider ||
  !bfpReadout ||
  !rfpSlider ||
  !rfpReadout ||
  !elongationSlider ||
  !elongationReadout ||
  !girthSlider ||
  !girthReadout ||
  !crescentSlider ||
  !crescentReadout ||
  !taperPolarButton ||
  !taperAntipolarButton ||
  !taperLateralButton ||
  !taperAntilateralButton ||
  !taperAllButton ||
  !taperPolarSlider ||
  !taperPolarReadout ||
  !taperAntipolarSlider ||
  !taperAntipolarReadout ||
  !taperLateralSlider ||
  !taperLateralReadout ||
  !taperAntilateralSlider ||
  !taperAntilateralReadout ||
  !buoyinSlider ||
  !buoyinReadout ||
  !ballastinSlider ||
  !ballastinReadout ||
  !lubricinSlider ||
  !lubricinReadout ||
  !adhesinSlider ||
  !adhesinReadout ||
  !antipolarSlider ||
  !antipolarReadout ||
  !polarSlider ||
  !polarReadout ||
  !lateralSlider ||
  !lateralReadout ||
  !antilateralSlider ||
  !antilateralReadout ||
  !ciliationSlider ||
  !ciliationReadout ||
  !ciliaLengthSlider ||
  !ciliaLengthReadout ||
  !ciliaSpeedSlider ||
  !ciliaSpeedReadout ||
  !ciliaSwaySlider ||
  !ciliaSwayReadout ||
  !ciliaOrderSlider ||
  !ciliaOrderReadout ||
  !ciliaSwitchLateral ||
  !ciliaSwitchAntilateral ||
  !ciliaSwitchPolar ||
  !ciliaSwitchAntipolar ||
  !ciliaReverseButton ||
  !undulationSlider ||
  !undulationReadout ||
  !pulseSlider ||
  !pulseReadout ||
  !ccwButton ||
  !sizeSlider ||
  !sizeReadout ||
  !membranePlain ||
  !membraneWall ||
  !membraneIsoprenoid ||
  !membraneCrystal ||
  !membranePxSlider ||
  !membranePxReadout ||
  !membraneColorInput ||
  !wasdButton ||
  !divideButton ||
  !applyAllButton ||
  !speciesPlate ||
  !speciesName ||
  !speciesPrev ||
  !speciesNext ||
  !speciesCount ||
  !clearButton ||
  !divideNote ||
  !paintButton ||
  !ventButton ||
  !lightButton ||
  !bubbleButton ||
  !heatButton ||
  !heatSizeReadout ||
  !heatDec ||
  !heatInc ||
  !zoomFreeButton ||
  !texelButton ||
  !temperatureButton ||
  !oxidexButton ||
  !sulfexButton ||
  !pressureButton ||
  !depositButton ||
  !decorButton ||
  !eraseButton ||
  !saveButton ||
  !terrainStatus ||
  !decorType ||
  !depositType ||
  !decorRandom ||
  !decorLayerButtons.back ||
  !decorLayerButtons.mid ||
  !decorLayerButtons.fore ||
  !depositFacingButtons.right ||
  !depositFacingButtons.up ||
  !depositFacingButtons.left ||
  !depositFacingButtons.bottom
) {
  throw new Error("missing terrain edit controls");
}
if (
  !piliSlider ||
  !piliReadout ||
  !piliLengthSlider ||
  !piliLengthReadout ||
  !piliVarianceSlider ||
  !piliVarianceReadout ||
  !piliPolarButton ||
  !piliAntipolarButton ||
  !piliLateralButton ||
  !piliAntilateralButton ||
  !piliAllButton ||
  !piliModeTransmembraneButton ||
  !piliModeSecretedButton
) {
  throw new Error("missing pili controls");
}
let editMode: "paint" | "erase" | "vent" | "light" | "bubble" | "heat" | "decor" | "deposit" | null = null;
let depositFacing: "right" | "up" | "left" | "bottom" = "right";
const HEAT_SIZE_MIN = 0.5;
const HEAT_SIZE_MAX = 3;
const HEAT_SIZE_STEP = 0.25;
let heatSize = 1;
let decorLayer: "back" | "mid" | "fore" = "mid";
let decorRandomOn = false;
let decorDragging = false;
let strokeDecorName: string | null = null;
let lastMidName: string | null = null;
const decorationList = decorType;
const depositList = depositType;
let editing = false;

const editButtons = [
  ["paint", paintButton],
  ["vent", ventButton],
  ["light", lightButton],
  ["bubble", bubbleButton],
  ["heat", heatButton],
  ["deposit", depositButton],
  ["decor", decorButton],
  ["erase", eraseButton],
] as const;

const setEditMode = (next: "paint" | "erase" | "vent" | "light" | "bubble" | "heat" | "decor" | "deposit"): void => {
  editMode = editMode === next ? null : next;
  for (const [mode, button] of editButtons) {
    const on = editMode === mode;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  inspect.setEnabled(editMode === null);
  setCanvasCursor(hoverCursor());
  if (!editMode) {
    editing = false;
    renderer.endTerrainStroke();
  }
};

const showDebugTab = (tab: "environment" | "cell" | "genetics" | null): void => {
  environmentPanel.hidden = tab !== "environment";
  cellPanel.hidden = tab !== "cell";
  geneticsPanel.hidden = tab !== "genetics";
  environmentTab.classList.toggle("active", tab === "environment");
  environmentTab.setAttribute("aria-pressed", String(tab === "environment"));
  cellTab.classList.toggle("active", tab === "cell");
  cellTab.setAttribute("aria-pressed", String(tab === "cell"));
  geneticsTab.classList.toggle("active", tab === "genetics");
  geneticsTab.setAttribute("aria-pressed", String(tab === "genetics"));
};

const debugPanel = document.querySelector<HTMLElement>("#debug");
if (debugPanel) bindButtonSounds(debugPanel);

environmentTab.addEventListener("click", () => {
  showDebugTab(environmentPanel.hidden ? "environment" : null);
});
cellTab.addEventListener("click", () => {
  showDebugTab(cellPanel.hidden ? "cell" : null);
});
geneticsTab.addEventListener("click", () => {
  showDebugTab(geneticsPanel.hidden ? "genetics" : null);
});

const showCellSubtab = (tab: "motility" | "morphology" | "pigment"): void => {
  motilityPanel.hidden = tab !== "motility";
  morphologyPanel.hidden = tab !== "morphology";
  pigmentPanel.hidden = tab !== "pigment";
  motilityTab.classList.toggle("active", tab === "motility");
  motilityTab.setAttribute("aria-pressed", String(tab === "motility"));
  morphologyTab.classList.toggle("active", tab === "morphology");
  morphologyTab.setAttribute("aria-pressed", String(tab === "morphology"));
  pigmentTab.classList.toggle("active", tab === "pigment");
  pigmentTab.setAttribute("aria-pressed", String(tab === "pigment"));
};

motilityTab.addEventListener("click", () => showCellSubtab("motility"));
morphologyTab.addEventListener("click", () => showCellSubtab("morphology"));
pigmentTab.addEventListener("click", () => showCellSubtab("pigment"));

const pigmentControls = {
  carotin: { input: carotinSlider, readout: carotinReadout },
  rhodin: { input: rhodinSlider, readout: rhodinReadout },
  siderin: { input: siderinSlider, readout: siderinReadout },
  cryptochrome: { input: cryptochromeSlider, readout: cryptochromeReadout },
} as const;

const fluorControls = {
  gfp: { input: gfpSlider, readout: gfpReadout },
  yfp: { input: yfpSlider, readout: yfpReadout },
  bfp: { input: bfpSlider, readout: bfpReadout },
  rfp: { input: rfpSlider, readout: rfpReadout },
} as const;

function syncPigmentControls(): void {
  for (const key of Object.keys(pigmentControls) as Array<keyof typeof pigmentControls>) {
    const row = pigmentControls[key];
    row.input.value = String(pigment[key]);
    row.readout.textContent = pigment[key].toFixed(2);
  }
  for (const key of Object.keys(fluorControls) as Array<keyof typeof fluorControls>) {
    const row = fluorControls[key];
    row.input.value = String(fluor[key]);
    row.readout.textContent = fluor[key].toFixed(2);
  }
}

for (const key of Object.keys(pigmentControls) as Array<keyof typeof pigmentControls>) {
  pigmentControls[key].input.addEventListener("input", () => {
    pigment[key] = clamp(Number(pigmentControls[key].input.value), 0, 1);
    pigmentControls[key].readout.textContent = pigment[key].toFixed(2);
    pushMorphology();
  });
}

for (const key of Object.keys(fluorControls) as Array<keyof typeof fluorControls>) {
  fluorControls[key].input.addEventListener("input", () => {
    fluor[key] = clamp(Number(fluorControls[key].input.value), 0, 1);
    fluorControls[key].readout.textContent = fluor[key].toFixed(2);
    pushMorphology();
  });
}

function cellDimensions(
  scale: number,
  elong: number,
  thick: number,
  curve: number,
): { length: number; width: number; bend: number } {
  const rawLength = BODY_WIDTH * (1 + (ELONGATION_MAX_RATIO - 1) * elong);
  const rawWidth = BODY_WIDTH * (1 + (ELONGATION_MAX_RATIO - 1) * thick);
  const targetArea = Math.PI * (BODY_WIDTH * scale * 0.5) ** 2;
  const fit = Math.sqrt(targetArea / capsuleArea(rawLength, rawWidth));
  return {
    length: rawLength * fit,
    width: rawWidth * fit,
    bend: vibrioHalfAngle(curve, elong),
  };
}

function cellWidth(): number {
  return cellDimensions(cellScale, elongation, girth, crescent).width;
}

function cellLength(): number {
  return cellDimensions(cellScale, elongation, girth, crescent).length;
}

function cellBend(): number {
  return cellDimensions(cellScale, elongation, girth, crescent).bend;
}

function currentTaper(): CellTaper {
  return {
    mask: taperMask,
    polar: taperPolarDegree,
    antipolar: taperAntipolarDegree,
    lateral: taperLateralDegree,
    antilateral: taperAntilateralDegree,
  };
}

const playerTaperScratch: CellTaper = { mask: 0, polar: 0, antipolar: 0, lateral: 0, antilateral: 0 };
const playerFormScratch: CellForm = { scale: 1, elongation: 1, girth: 1, crescent: 0, taper: playerTaperScratch };

/** Live sliders, reused by the swim step. Callers that keep the form must copy it. */
function fillPlayerForm(): CellForm {
  playerFormScratch.scale = cellScale;
  playerFormScratch.elongation = elongation;
  playerFormScratch.girth = girth;
  playerFormScratch.crescent = crescent;
  playerTaperScratch.mask = taperMask;
  playerTaperScratch.polar = taperPolarDegree;
  playerTaperScratch.antipolar = taperAntipolarDegree;
  playerTaperScratch.lateral = taperLateralDegree;
  playerTaperScratch.antilateral = taperAntilateralDegree;
  return playerFormScratch;
}

function playerForm(): CellForm {
  const live = fillPlayerForm();
  const taper = live.taper;
  return {
    scale: live.scale,
    elongation: live.elongation,
    girth: live.girth,
    crescent: live.crescent,
    taper: {
      mask: taper.mask,
      polar: taper.polar,
      antipolar: taper.antipolar,
      lateral: taper.lateral,
      antilateral: taper.antilateral,
    },
  };
}

const ciliaCache = new Map<string, CiliumSnapshot[]>();
const piliCache = new Map<string, PilusSnapshot[]>();
type FlagellaEntry = {
  flagAntipolar: number;
  flagPolar: number;
  flagLateral: number;
  flagAntilateral: number;
  scale: number;
  elongation: number;
  girth: number;
  crescent: number;
  mask: number;
  taperPolar: number;
  taperAntipolar: number;
  taperLateral: number;
  taperAntilateral: number;
  filaments: FlagellumSnapshot[];
};
const flagellaCache = new Map<number, FlagellaEntry>();

function formKey(form: CellForm): string {
  const taper = form.taper;
  return `${form.scale}|${form.elongation}|${form.girth}|${form.crescent}|${taper.mask}|${taper.polar}|${taper.antipolar}|${taper.lateral}|${taper.antilateral}`;
}

const FLAGELLIN_SITE_KEY: Record<FlagellumSite, number> = {
  antipolar: 0,
  polar: 10,
  lateral: 20,
  antilateral: 30,
};

function formSame(
  form: CellForm,
  scale: number,
  elongation: number,
  girth: number,
  crescent: number,
  mask: number,
  polar: number,
  antipolar: number,
  lateral: number,
  antilateral: number,
): boolean {
  const taper = form.taper;
  return (
    form.scale === scale &&
    form.elongation === elongation &&
    form.girth === girth &&
    form.crescent === crescent &&
    taper.mask === mask &&
    taper.polar === polar &&
    taper.antipolar === antipolar &&
    taper.lateral === lateral &&
    taper.antilateral === antilateral
  );
}

function flagellaFor(
  cellId: number,
  form: CellForm = playerForm(),
  antipolar = antipolarFlagellin,
  polar = polarFlagellin,
  lateral = lateralFlagellin,
  antilateral = antilateralFlagellin,
): FlagellumSnapshot[] {
  const cached = flagellaCache.get(cellId);
  if (
    cached &&
    cached.flagAntipolar === antipolar &&
    cached.flagPolar === polar &&
    cached.flagLateral === lateral &&
    cached.flagAntilateral === antilateral &&
    formSame(
      form,
      cached.scale,
      cached.elongation,
      cached.girth,
      cached.crescent,
      cached.mask,
      cached.taperPolar,
      cached.taperAntipolar,
      cached.taperLateral,
      cached.taperAntilateral,
    )
  ) {
    return cached.filaments;
  }
  const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  const reach = flagellarBodyLength(body.length, body.width);
  const built: FlagellumSnapshot[] = [];
  const add = (amount: number, site: FlagellumSite): void => {
    const pole = site === "antipolar" || site === "antilateral" ? -1 : 1;
    for (const filament of filamentsForFlagellin(amount, reach)) {
      built.push({
        id: cellId * 100 + FLAGELLIN_SITE_KEY[site] + filament.slot,
        pole,
        site,
        mount: filament.mount,
        length: filament.length,
        assembly: 1,
      });
    }
  };
  add(antipolar, "antipolar");
  add(polar, "polar");
  add(lateral, "lateral");
  add(antilateral, "antilateral");
  const taper = form.taper;
  flagellaCache.set(cellId, {
    flagAntipolar: antipolar,
    flagPolar: polar,
    flagLateral: lateral,
    flagAntilateral: antilateral,
    scale: form.scale,
    elongation: form.elongation,
    girth: form.girth,
    crescent: form.crescent,
    mask: taper.mask,
    taperPolar: taper.polar,
    taperAntipolar: taper.antipolar,
    taperLateral: taper.lateral,
    taperAntilateral: taper.antilateral,
    filaments: built,
  });
  return built;
}

function ciliaPresent(): boolean {
  return ciliation >= 1 && ciliaLength > 0.02;
}

function piliPresent(): boolean {
  return piliCount >= 1 && piliLength > 0.02;
}

function shedSeconds(present: boolean, presence: number, fadeSeconds: number): number {
  return present && presence > 0.02 ? fadeSeconds * Math.min(1, presence) : 0;
}

function commitDivision(
  form: CellForm,
  cilia: number,
  pili: number,
): { division: DivisionState; ciliaFade: PresenceFade | null; piliFade: PresenceFade | null } {
  const now = performance.now();
  const ciliaShed = shedSeconds(ciliaPresent(), cilia, CILIA_FADE_SECONDS);
  const piliShed = shedSeconds(piliPresent(), pili, PILI_FADE_SECONDS);
  const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  const [halfX, halfY] = curvedHalfExtents(orientedCapsule(body.length, body.width), body.bend);
  const axis = divisionAxisOffset(halfX, halfY);
  const randomAxis = Math.random() * Math.PI;
  return {
    ciliaFade: ciliaShed > 0 ? { from: cilia, to: 0, startedAt: now, seconds: ciliaShed } : null,
    piliFade: piliShed > 0 ? { from: pili, to: 0, startedAt: now, seconds: piliShed } : null,
    division: {
      startedAt: now + Math.max(ciliaShed, piliShed) * 1000,
      placeOffset: axis ?? randomAxis,
      furrowAxis: axis === null ? randomAxis : 0,
      scale: form.scale,
    },
  };
}

function regrowCilia(now: number): { presence: number; fade: PresenceFade | null } {
  if (!ciliaPresent()) return { presence: 1, fade: null };
  return { presence: 0, fade: { from: 0, to: 1, startedAt: now, seconds: CILIA_FADE_SECONDS } };
}

function regrowPili(now: number): { presence: number; fade: PresenceFade | null } {
  if (!piliPresent()) return { presence: 1, fade: null };
  return { presence: 0, fade: { from: 0, to: 1, startedAt: now, seconds: PILI_FADE_SECONDS } };
}

function stepPresenceFade(fade: PresenceFade | null, current: number, now: number): { presence: number; fade: PresenceFade | null } {
  if (!fade) return { presence: current, fade: null };
  const t = smoothstep(0, 1, (now - fade.startedAt) / Math.max(fade.seconds * 1000, 1e-3));
  const presence = fade.from + (fade.to - fade.from) * t;
  if (now - fade.startedAt >= fade.seconds * 1000) return { presence: fade.to, fade: null };
  return { presence, fade };
}

function stepSurfaceFades(now: number): void {
  const controlledCilia = stepPresenceFade(controlledCiliaFade, controlledCiliaPresence, now);
  controlledCiliaPresence = controlledCilia.presence;
  controlledCiliaFade = controlledCilia.fade;
  const controlledPili = stepPresenceFade(controlledPiliFade, controlledPiliPresence, now);
  controlledPiliPresence = controlledPili.presence;
  controlledPiliFade = controlledPili.fade;
  for (const cell of siblings) {
    const cilia = stepPresenceFade(cell.ciliaFade, cell.ciliaPresence, now);
    cell.ciliaPresence = cilia.presence;
    cell.ciliaFade = cilia.fade;
    const pili = stepPresenceFade(cell.piliFade, cell.piliPresence, now);
    cell.piliPresence = pili.presence;
    cell.piliFade = pili.fade;
  }
}

type CiliaRecent = {
  count: number;
  length: number;
  crystal: boolean;
  scale: number;
  elongation: number;
  girth: number;
  crescent: number;
  mask: number;
  polar: number;
  antipolar: number;
  lateral: number;
  antilateral: number;
  placed: CiliumSnapshot[];
};
const ciliaRecent: CiliaRecent[] = [];

function ciliaFor(
  form: CellForm = playerForm(),
  crystal = membraneStyle === 3,
  count = ciliation,
  length = ciliaLength,
): CiliumSnapshot[] {
  for (let index = ciliaRecent.length - 1; index >= 0; index -= 1) {
    const recent = ciliaRecent[index];
    if (
      recent.count === count &&
      recent.length === length &&
      recent.crystal === crystal &&
      formSame(form, recent.scale, recent.elongation, recent.girth, recent.crescent, recent.mask, recent.polar, recent.antipolar, recent.lateral, recent.antilateral)
    ) {
      return recent.placed;
    }
  }
  const key = `${count}|${length}|${formKey(form)}|${crystal ? 1 : 0}`;
  let placed = ciliaCache.get(key);
  if (!placed) {
    if (ciliaCache.size > 48) ciliaCache.clear();
    const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
    placed = ciliaPlacements(count, length, body.length, body.width, body.bend, crystal, form.taper);
    ciliaCache.set(key, placed);
  }
  const taper = form.taper;
  ciliaRecent.push({
    count,
    length,
    crystal,
    scale: form.scale,
    elongation: form.elongation,
    girth: form.girth,
    crescent: form.crescent,
    mask: taper.mask,
    polar: taper.polar,
    antipolar: taper.antipolar,
    lateral: taper.lateral,
    antilateral: taper.antilateral,
    placed,
  });
  if (ciliaRecent.length > 4) ciliaRecent.shift();
  return placed;
}

type PiliRecent = {
  count: number;
  length: number;
  variance: number;
  site: PilusSite;
  crystal: boolean;
  scale: number;
  elongation: number;
  girth: number;
  crescent: number;
  mask: number;
  polar: number;
  antipolar: number;
  lateral: number;
  antilateral: number;
  placed: PilusSnapshot[];
};
const piliRecent: PiliRecent[] = [];

function placePilinCoats(form: CellForm, crystal: boolean, coats: readonly PilinCoat[]): PilusSnapshot[] {
  const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  const placed: PilusSnapshot[] = [];
  for (const coat of coats) {
    const count = Math.min(coat.count, maxPiliOnSite(PILI_MAX, coat.site));
    placed.push(
      ...piliPlacements(count, coat.length, PILIN_LENGTH_VARIANCE, coat.site, body.length, body.width, body.bend, crystal, form.taper),
    );
  }
  return placed;
}

function piliFor(
  form: CellForm = playerForm(),
  crystal = membraneStyle === 3,
  count = piliCount,
  length = piliLength,
  variance = piliVariance,
  site: PilusSite = pilusSite,
  coats?: readonly PilinCoat[] | null,
): PilusSnapshot[] {
  // Omitted coats follow the genome when pilin owns the cell. An explicit null
  // keeps the sandbox count and site, which is what menu swimmers pass.
  const resolved = coats === undefined ? (genomeDrivesPilinState ? genomePilinCoats : null) : coats;
  if (resolved) {
    const key = `coat|${resolved.map((coat) => `${coat.site}:${coat.count}:${coat.length}`).join(",")}|${formKey(form)}|${crystal ? 1 : 0}`;
    let placed = piliCache.get(key);
    if (!placed) {
      if (piliCache.size > 48) piliCache.clear();
      placed = placePilinCoats(form, crystal, resolved);
      piliCache.set(key, placed);
    }
    return placed;
  }
  for (let index = piliRecent.length - 1; index >= 0; index -= 1) {
    const recent = piliRecent[index];
    if (
      recent.count === count &&
      recent.length === length &&
      recent.variance === variance &&
      recent.site === site &&
      recent.crystal === crystal &&
      formSame(form, recent.scale, recent.elongation, recent.girth, recent.crescent, recent.mask, recent.polar, recent.antipolar, recent.lateral, recent.antilateral)
    ) {
      return recent.placed;
    }
  }
  const key = `${count}|${length}|${variance}|${site}|${formKey(form)}|${crystal ? 1 : 0}`;
  let placed = piliCache.get(key);
  if (!placed) {
    if (piliCache.size > 48) piliCache.clear();
    const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
    const placedCount = Math.min(count, maxPiliOnSite(PILI_MAX, site));
    placed = piliPlacements(placedCount, length, variance, site, body.length, body.width, body.bend, crystal, form.taper);
    piliCache.set(key, placed);
  }
  const taper = form.taper;
  piliRecent.push({
    count,
    length,
    variance,
    site,
    crystal,
    scale: form.scale,
    elongation: form.elongation,
    girth: form.girth,
    crescent: form.crescent,
    mask: taper.mask,
    polar: taper.polar,
    antipolar: taper.antipolar,
    lateral: taper.lateral,
    antilateral: taper.antilateral,
    placed,
  });
  if (piliRecent.length > 4) piliRecent.shift();
  return placed;
}

function pilusProbes(
  form: CellForm = playerForm(),
  crystal = membraneStyle === 3,
  count = piliCount,
  length = piliLength,
  variance = piliVariance,
  site: PilusSite = pilusSite,
  coats?: readonly PilinCoat[] | null,
): Array<[number, number]> {
  return pilusVolumeSamples(piliFor(form, crystal, count, length, variance, site, coats));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutBack(t: number): number {
  const overshoot = 2.5;
  const u = clamp(t, 0, 1) - 1;
  return 1 + (overshoot + 1) * u * u * u + overshoot * u * u;
}

function daughterOffset(length: number, width: number, bend: number, placeOffset: number): number {
  const [halfX, halfY] = curvedHalfExtents(orientedCapsule(length, width), bend);
  const halfAlong = Math.abs(Math.cos(placeOffset)) >= Math.abs(Math.sin(placeOffset)) ? halfX : halfY;
  return halfAlong * 0.5 + 1 / 32;
}

const setShapeEnabled = (enabled: boolean): void => {
  elongationSlider.disabled = !enabled;
  girthSlider.disabled = !enabled;
  crescentSlider.disabled = !enabled;
  sizeSlider.disabled = !enabled;
  for (const button of [taperPolarButton, taperAntipolarButton, taperLateralButton, taperAntilateralButton, taperAllButton]) {
    button.disabled = !enabled;
  }
  for (const slider of [taperPolarSlider, taperAntipolarSlider, taperLateralSlider, taperAntilateralSlider]) {
    slider.disabled = !enabled;
  }
};

function cellCanDivide(scale: number, dividing: boolean): boolean {
  return !dividing && scale >= DIVISION_MIN_SCALE - 1e-4;
}

const refreshDivideControls = (): void => {
  const playerDividing = division !== null;
  const anyDividing = playerDividing || siblings.some((cell) => cell.division !== null);
  const playerReady = cellCanDivide(cellScale, playerDividing);
  const siblingReady = applyAll && siblings.some((cell) => cellCanDivide(cell.form.scale, cell.division !== null));
  divideButton.disabled = !playerReady && !siblingReady;
  clearButton.disabled = siblings.length === 0;
  if (anyDividing) {
    divideNote.hidden = false;
    divideNote.textContent = "Dividing";
  } else if (!playerReady && !siblingReady) {
    divideNote.hidden = false;
    divideNote.textContent = "Too small to divide";
  } else {
    divideNote.hidden = true;
    divideNote.textContent = "";
  }
};

function pushMorphology(): void {
  if (!applyAll) return;
  const look = currentMembrane();
  const levels = copyPigment(pigment);
  const glow = copyFluor(fluor);
  for (const cell of siblings) {
    if (cell.division) continue;
    cell.form = { ...playerForm() };
    cell.membrane = look;
    cell.pigment = levels;
    cell.fluor = glow;
    cell.pose.length = cellDimensions(cell.form.scale, cell.form.elongation, cell.form.girth, cell.form.crescent).length;
  }
}

elongationSlider.addEventListener("input", () => {
  elongation = clamp(Number(elongationSlider.value), 0, 1);
  pose.length = cellLength();
  elongationReadout.textContent = elongation.toFixed(2);
  pushMorphology();
});

girthSlider.addEventListener("input", () => {
  girth = clamp(Number(girthSlider.value), 0, 1);
  girthReadout.textContent = girth.toFixed(2);
  pushMorphology();
});

crescentSlider.addEventListener("input", () => {
  crescent = clamp(Number(crescentSlider.value), 0, 1);
  crescentReadout.textContent = crescent.toFixed(2);
  pushMorphology();
});

const taperButtons = [
  ["polar", TAPER_POLAR, taperPolarButton],
  ["antipolar", TAPER_ANTIPOLAR, taperAntipolarButton],
  ["lateral", TAPER_LATERAL, taperLateralButton],
  ["antilateral", TAPER_ANTILATERAL, taperAntilateralButton],
] as const;

const syncTaperButtons = (): void => {
  const all = taperMask === TAPER_ALL;
  for (const [, bit, button] of taperButtons) {
    const on = !all && (taperMask & bit) !== 0;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  taperAllButton.classList.toggle("active", all);
  taperAllButton.setAttribute("aria-pressed", String(all));
};

function selectTaperSide(bit: number): void {
  if (taperMask === TAPER_ALL) taperMask = bit;
  else if ((taperMask & bit) !== 0) taperMask &= ~bit;
  else taperMask |= bit;
  syncTaperButtons();
  pushMorphology();
}

for (const [, bit, button] of taperButtons) {
  button.addEventListener("click", () => selectTaperSide(bit));
}

taperAllButton.addEventListener("click", () => {
  taperMask = taperMask === TAPER_ALL ? 0 : TAPER_ALL;
  syncTaperButtons();
  pushMorphology();
});
syncTaperButtons();

const taperDegreeRows = [
  [taperPolarSlider, taperPolarReadout, (value: number) => { taperPolarDegree = value; }],
  [taperAntipolarSlider, taperAntipolarReadout, (value: number) => { taperAntipolarDegree = value; }],
  [taperLateralSlider, taperLateralReadout, (value: number) => { taperLateralDegree = value; }],
  [taperAntilateralSlider, taperAntilateralReadout, (value: number) => { taperAntilateralDegree = value; }],
] as const;

function syncTaperDegrees(): void {
  const values = [taperPolarDegree, taperAntipolarDegree, taperLateralDegree, taperAntilateralDegree];
  taperDegreeRows.forEach(([slider, readout], index) => {
    const value = values[index] ?? 1;
    slider.value = String(value);
    readout.textContent = value.toFixed(2);
  });
}

for (const [slider, readout, apply] of taperDegreeRows) {
  slider.addEventListener("input", () => {
    const value = clamp(Number(slider.value), 0, 1);
    apply(value);
    readout.textContent = value.toFixed(2);
    pushMorphology();
  });
}
syncTaperDegrees();

buoyinSlider.addEventListener("input", () => {
  buoyin = clamp(Number(buoyinSlider.value), 0, 1);
  buoyinReadout.textContent = buoyin.toFixed(2);
});

ballastinSlider.addEventListener("input", () => {
  ballastin = clamp(Number(ballastinSlider.value), 0, 1);
  ballastinReadout.textContent = ballastin.toFixed(2);
});

lubricinSlider.addEventListener("input", () => {
  lubricin = clamp(Number(lubricinSlider.value), 0, 1);
  lubricinReadout.textContent = lubricin.toFixed(2);
  renderer.setTerrainSlide(terrainSlideKeep(lubricin));
});
renderer.setTerrainSlide(terrainSlideKeep(lubricin));

adhesinSlider.addEventListener("input", () => {
  adhesin = clamp(Number(adhesinSlider.value), 0, 1);
  adhesinReadout.textContent = adhesin.toFixed(2);
});

antipolarSlider.addEventListener("input", () => {
  antipolarFlagellin = clamp(Number(antipolarSlider.value), 0, 1);
  antipolarReadout.textContent = antipolarFlagellin.toFixed(2);
});

polarSlider.addEventListener("input", () => {
  polarFlagellin = clamp(Number(polarSlider.value), 0, 1);
  polarReadout.textContent = polarFlagellin.toFixed(2);
});

lateralSlider.addEventListener("input", () => {
  lateralFlagellin = clamp(Number(lateralSlider.value), 0, 1);
  lateralReadout.textContent = lateralFlagellin.toFixed(2);
});

antilateralSlider.addEventListener("input", () => {
  antilateralFlagellin = clamp(Number(antilateralSlider.value), 0, 1);
  antilateralReadout.textContent = antilateralFlagellin.toFixed(2);
});

// Genome flagellin: expressed constructs replace the debug sliders, which are
// zeroed and disabled while the genome is driving flagella.
const flagellinControls: [HTMLInputElement, HTMLElement][] = [
  [antipolarSlider, antipolarReadout],
  [polarSlider, polarReadout],
  [lateralSlider, lateralReadout],
  [antilateralSlider, antilateralReadout],
];
let flagellarBeat: FlagellarBeatState = initialBeatState();
// Whether the genome-driven motor is mid-whip this frame. The switch reads
// whip edges as burst edges, so beats alternate clockwise runs with real
// counterclockwise tumbles instead of chaining runs.
let genomeBeatWhipping = false;
let flagellarWhipping = true;
const applyGenomeExpression = (timeSeconds: number, dtSeconds: number): void => {
  const constructs = getGenome();
  const totals = flagellinFromConstructs(constructs, timeSeconds);
  antipolarFlagellin = totals.antipolar;
  polarFlagellin = totals.polar;
  lateralFlagellin = totals.lateral;
  antilateralFlagellin = totals.antilateral;
  // The genome owns undulation too: a flagellum only beats where motor protein
  // is co-expressed, so a genome with no motor drives nothing but flopping.
  // The motor fires in beats no matter how constant the expression is, and the
  // beat cycle stretches with the expression level, so an always-on construct
  // still moves the cell in stochastic bursts.
  const motor = motorFromConstructs(constructs, timeSeconds);
  const beat = stepFlagellarBeat(flagellarBeat, motorExpressionLevel(constructs, timeSeconds), dtSeconds);
  flagellarBeat = beat.state;
  undulationBySite = {
    antipolar: motor.antipolar * beat.envelope,
    polar: motor.polar * beat.envelope,
    lateral: motor.lateral * beat.envelope,
    antilateral: motor.antilateral * beat.envelope,
  };
  undulation = Math.max(
    undulationBySite.antipolar,
    undulationBySite.polar,
    undulationBySite.lateral,
    undulationBySite.antilateral,
  );
  genomeBeatWhipping = undulation > 0.02;
};
// Genome respiration: a transmembrane Ferron Permease (FERP) or Sulfex
// Permease (SLFP) imports dissolved fuel, and the matching transmembrane
// reductase (FERR or SLFR) burns the intracellular pool for a modest ATP
// yield. Import tracks the permease expression level, the local
// concentration, and the room left in the pool; the burn tracks the reductase
// expression level and stops at an empty fuel pool or a full ATP pool, so
// fuel is never wasted. The fuel readout reports the net rate and the ATP
// readout the combined production of both reductases.
const FUEL_GENES = [
  { permeaseGeneId: "FERP", reductaseGeneId: "FERR", resourceId: "ferron", kind: "ferron" },
  { permeaseGeneId: "SLFP", reductaseGeneId: "SLFR", resourceId: "sulfex", kind: "sulfex" },
] as const;
const applyGenomeRespiration = (timeSeconds: number, x: number, y: number, dt: number): void => {
  const atp = cellResources().find((resource) => resource.id === "atp");
  if (!atp) return;
  const constructs = getGenome();
  let atpAmount = atp.amount;
  let atpRate = 0;
  for (const fuel of FUEL_GENES) {
    const held = cellResources().find((resource) => resource.id === fuel.resourceId);
    if (!held) continue;
    const imported = stepPermeaseUptake(
      held.amount,
      held.capacity,
      permeaseExpressionLevel(constructs, fuel.permeaseGeneId, timeSeconds),
      renderer.nutrientRead(fuel.kind, x, y),
      dt,
    );
    const burned = stepReductase(
      imported.amount,
      atpAmount,
      atp.capacity,
      reductaseExpressionLevel(constructs, fuel.reductaseGeneId, timeSeconds),
      dt,
    );
    updateResource(fuel.resourceId, { amount: burned.fuel, rate: imported.rate - burned.fuelRate });
    atpAmount = burned.atp;
    atpRate += burned.atpRate;
    if (imported.depletion > 0) renderer.nutrientTake(fuel.kind, x, y, imported.depletion);
  }
  updateResource("atp", { amount: atpAmount, rate: atpRate });
};

// Genome reproduction: expressed Anabolase grows the controlled cell toward
// the size cap — the doubling time tracks the expression level — and expressed
// Cyclin commits the cell to division once it has reached the minimum division
// size (1.0, twice the 0.5 floor, so both halved daughters stay legal). Growth
// pauses mid-division, and without Cyclin the cell simply grows past 1.0 until
// the player divides by hand.
const applyGenomeReproduction = (timeSeconds: number, dt: number): void => {
  const constructs = getGenome();
  const dividing = division !== null;
  if (!dividing) {
    const grown = stepAnabolaseGrowth(cellScale, anabolaseExpressionLevel(constructs, timeSeconds), dt, SIZE_MAX);
    if (grown !== cellScale) {
      cellScale = grown;
      renderer.setCellScale(cellScale);
      pose.length = cellLength();
      sizeSlider.value = String(cellScale);
      sizeReadout.textContent = `${cellScale.toFixed(2)}×`;
      refreshDivideControls();
    }
  }
  if (cyclinTriggersDivision(cyclinExpressionLevel(constructs, timeSeconds), cellScale, dividing, DIVISION_MIN_SCALE)) {
    const committed = commitDivision(playerForm(), controlledCiliaPresence, controlledPiliPresence);
    division = committed.division;
    if (committed.ciliaFade) controlledCiliaFade = committed.ciliaFade;
    if (committed.piliFade) controlledPiliFade = committed.piliFade;
    setShapeEnabled(false);
    refreshDivideControls();
  }
};
let genomeDrivesFlagellinState = false;
const syncGenomeFlagellin = (): void => {
  const constructs = getGenome();
  // Potential-based check: an oscillatory construct resting at its trough must
  // not hand the flagella back to the sandbox sliders for a moment.
  if (genomeCanDriveFlagellin(constructs)) {
    genomeDrivesFlagellinState = true;
    applyGenomeExpression(performance.now() / 1000, 0);
    for (const [slider, readout] of flagellinControls) {
      slider.value = "0";
      slider.disabled = true;
      slider.title = "Driven by expressed flagellin in the genome";
      readout.textContent = "0.00";
    }
    undulationSlider.value = "0";
    undulationSlider.disabled = true;
    undulationSlider.title = "Driven by expressed flagellar motor protein in the genome";
    undulationReadout.textContent = "0.00×";
    return;
  }
  genomeDrivesFlagellinState = false;
  for (const [slider] of flagellinControls) {
    slider.disabled = false;
    slider.title = "";
  }
  antipolarFlagellin = clamp(Number(antipolarSlider.value), 0, 1);
  polarFlagellin = clamp(Number(polarSlider.value), 0, 1);
  lateralFlagellin = clamp(Number(lateralSlider.value), 0, 1);
  antilateralFlagellin = clamp(Number(antilateralSlider.value), 0, 1);
  undulationBySite = null;
  undulationSlider.disabled = false;
  undulationSlider.title = "";
  undulation = clamp(Number(undulationSlider.value), 0, 2);
  undulationReadout.textContent = `${undulation.toFixed(2)}×`;
};
subscribeGenome(syncGenomeFlagellin);
syncGenomeFlagellin();

// Genome buoyancy: expressed Buoyin and Ballastin replace the debug sliders,
// which are zeroed and disabled while the genome is driving vertical drift.
let genomeDrivesBuoyancyState = false;
const applyGenomeBuoyancy = (timeSeconds: number): void => {
  const constructs = getGenome();
  buoyin = buoyancyExpressionLevel(constructs, "BUOY", timeSeconds);
  ballastin = buoyancyExpressionLevel(constructs, "BALA", timeSeconds);
};
const syncGenomeBuoyancy = (): void => {
  // Potential-based check: an oscillatory construct resting at its trough must
  // not hand buoyancy back to the sandbox sliders for a moment.
  if (genomeCanDriveBuoyancy(getGenome())) {
    genomeDrivesBuoyancyState = true;
    applyGenomeBuoyancy(performance.now() / 1000);
    for (const [slider, readout] of [
      [buoyinSlider, buoyinReadout],
      [ballastinSlider, ballastinReadout],
    ] as [HTMLInputElement, HTMLElement][]) {
      slider.value = "0";
      slider.disabled = true;
      slider.title = "Driven by expressed buoyancy protein in the genome";
      readout.textContent = "0.00";
    }
    return;
  }
  genomeDrivesBuoyancyState = false;
  buoyinSlider.disabled = false;
  buoyinSlider.title = "";
  ballastinSlider.disabled = false;
  ballastinSlider.title = "";
  buoyin = clamp(Number(buoyinSlider.value), 0, 1);
  ballastin = clamp(Number(ballastinSlider.value), 0, 1);
  buoyinReadout.textContent = buoyin.toFixed(2);
  ballastinReadout.textContent = ballastin.toFixed(2);
};
subscribeGenome(syncGenomeBuoyancy);
syncGenomeBuoyancy();

// Genome cilia: expressed Cilin bristles the coat — density and hair length
// both follow the expression level — and the Ciliary Motor Protein rows the
// coat toward wherever its position tag sits. The sandbox sliders are zeroed
// and disabled while the genome is driving the coat.
let genomeDrivesCiliaState = false;
let genomeCiliaMotor: CiliumMotorDrive = { x: 0, y: 0, strength: 0 };
const applyGenomeCilia = (timeSeconds: number): void => {
  const constructs = getGenome();
  const coat = cilinFromConstructs(constructs, timeSeconds);
  ciliation = coat.ciliation;
  ciliaLength = coat.length;
  genomeCiliaMotor = ciliumMotorDrive(ciliumMotorFromConstructs(constructs, timeSeconds));
  // The drawn stroke follows the motor's dominant axis, so the coat visibly
  // rows the way it is being pushed. The reverse button still flips it. A
  // direction-less spread (an untagged motor) keeps the resting switch pattern.
  if (genomeCiliaMotor.strength > 0.02 && (genomeCiliaMotor.x !== 0 || genomeCiliaMotor.y !== 0)) {
    const { x, y } = genomeCiliaMotor;
    ciliaSwitch = Math.abs(x) >= Math.abs(y) ? (x < 0 ? "lateral" : "antilateral") : (y > 0 ? "polar" : "antipolar");
  }
};
// A genome coat with no expressed motor holds still: the cilia grow, but
// nothing rows them, so the renderer draws the hairs without a beat.
const ciliaCoatStill = (): boolean => genomeDrivesCiliaState && !(genomeCiliaMotor.strength > 0.02);
// A non-positional motor flaps the coat without a wave: orderedness reads as
// zero, so the drawn cilia whip at random phases exactly like a sandbox coat
// at zero order, and the swim layer pushes nowhere.
const ciliaCoatOrder = (): boolean =>
  genomeDrivesCiliaState &&
  genomeCiliaMotor.strength > 0.02 &&
  genomeCiliaMotor.x === 0 &&
  genomeCiliaMotor.y === 0;
const syncGenomeCilia = (): void => {
  // Potential-based check: an oscillatory construct resting at its trough must
  // not hand the coat back to the sandbox sliders for a moment.
  if (genomeCanDriveCilia(getGenome())) {
    genomeDrivesCiliaState = true;
    applyGenomeCilia(performance.now() / 1000);
    ciliationSlider.value = "0";
    ciliationSlider.disabled = true;
    ciliationSlider.title = "Driven by expressed cilin in the genome";
    ciliationReadout.textContent = "0";
    ciliaLengthSlider.value = "0";
    ciliaLengthSlider.disabled = true;
    ciliaLengthSlider.title = "Driven by expressed cilin in the genome";
    ciliaLengthReadout.textContent = "0.00";
    for (const button of [ciliaSwitchLateral, ciliaSwitchAntilateral, ciliaSwitchPolar, ciliaSwitchAntipolar]) {
      button.disabled = true;
      button.title = "Driven by expressed ciliary motor protein in the genome";
    }
    return;
  }
  genomeDrivesCiliaState = false;
  genomeCiliaMotor = { x: 0, y: 0, strength: 0 };
  ciliationSlider.disabled = false;
  ciliationSlider.title = "";
  ciliaLengthSlider.disabled = false;
  ciliaLengthSlider.title = "";
  for (const button of [ciliaSwitchLateral, ciliaSwitchAntilateral, ciliaSwitchPolar, ciliaSwitchAntipolar]) {
    button.disabled = false;
    button.title = "";
  }
  ciliation = clamp(Math.round(Number(ciliationSlider.value)), 0, CILIATION_MAX);
  ciliationReadout.textContent = String(ciliation);
  ciliaLength = clamp(Number(ciliaLengthSlider.value), 0, 1);
  ciliaLengthReadout.textContent = ciliaLength.toFixed(2);
};
subscribeGenome(syncGenomeCilia);
syncGenomeCilia();

// Genome lubricin: secreted Lubricin replaces the debug slider. The expression
// level is the lubricity, so a thin film keeps a little along-wall motion and
// a full coat keeps all of it. The slider is zeroed and disabled while the
// genome owns the coat.
let genomeDrivesLubricinState = false;
const applyGenomeLubricin = (timeSeconds: number): void => {
  lubricin = lubricinExpressionLevel(getGenome(), timeSeconds);
  renderer.setTerrainSlide(terrainSlideKeep(lubricin));
};
const syncGenomeLubricin = (): void => {
  // Potential-based check: an oscillatory construct resting at its trough must
  // not hand lubricity back to the sandbox slider for a moment.
  if (genomeCanDriveLubricin(getGenome())) {
    genomeDrivesLubricinState = true;
    applyGenomeLubricin(performance.now() / 1000);
    lubricinSlider.value = "0";
    lubricinSlider.disabled = true;
    lubricinSlider.title = "Driven by expressed lubricin in the genome";
    lubricinReadout.textContent = "0.00";
    return;
  }
  genomeDrivesLubricinState = false;
  lubricinSlider.disabled = false;
  lubricinSlider.title = "";
  lubricin = clamp(Number(lubricinSlider.value), 0, 1);
  lubricinReadout.textContent = lubricin.toFixed(2);
  renderer.setTerrainSlide(terrainSlideKeep(lubricin));
};
subscribeGenome(syncGenomeLubricin);
syncGenomeLubricin();

ciliationSlider.addEventListener("input", () => {
  ciliation = clamp(Math.round(Number(ciliationSlider.value)), 0, CILIATION_MAX);
  ciliationReadout.textContent = String(ciliation);
});

ciliaLengthSlider.addEventListener("input", () => {
  ciliaLength = clamp(Number(ciliaLengthSlider.value), 0, 1);
  ciliaLengthReadout.textContent = ciliaLength.toFixed(2);
});

ciliaSpeedSlider.addEventListener("input", () => {
  ciliaSpeed = clamp(Number(ciliaSpeedSlider.value), 0, 2);
  ciliaSpeedReadout.textContent = `${ciliaSpeed.toFixed(2)}×`;
});

ciliaSwaySlider.addEventListener("input", () => {
  ciliaSway = clamp(Number(ciliaSwaySlider.value), 0, 1);
  ciliaSwayReadout.textContent = ciliaSway.toFixed(2);
});

ciliaOrderSlider.addEventListener("input", () => {
  ciliaOrder = clamp(Number(ciliaOrderSlider.value), 0, 1);
  ciliaOrderReadout.textContent = ciliaOrderLabel(ciliaOrder);
});

const ciliaSwitchButtons = [
  ["lateral", ciliaSwitchLateral],
  ["antilateral", ciliaSwitchAntilateral],
  ["polar", ciliaSwitchPolar],
  ["antipolar", ciliaSwitchAntipolar],
] as const;

function showCiliaSwitch(site: CiliaSwitch): void {
  ciliaSwitch = site;
  for (const [id, button] of ciliaSwitchButtons) {
    const on = id === site;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
}

for (const [id, button] of ciliaSwitchButtons) {
  button.addEventListener("click", () => showCiliaSwitch(id));
}

ciliaReverseButton.addEventListener("click", () => {
  ciliaReverse = !ciliaReverse;
  ciliaReverseButton.classList.toggle("active", ciliaReverse);
  ciliaReverseButton.setAttribute("aria-pressed", String(ciliaReverse));
});

const pilusSiteButtons = [
  ["polar", piliPolarButton],
  ["antipolar", piliAntipolarButton],
  ["lateral", piliLateralButton],
  ["antilateral", piliAntilateralButton],
  ["all", piliAllButton],
] as const;

const pilusModeButtons = [
  ["transmembrane", piliModeTransmembraneButton],
  ["secreted", piliModeSecretedButton],
] as const;

function piliCeiling(): number {
  return maxPiliOnSite(PILI_MAX, pilusSite);
}

function syncPiliLimit(): void {
  if (!piliSlider || !piliReadout) return;
  const ceiling = piliCeiling();
  piliSlider.max = String(ceiling);
  piliCount = clamp(piliCount, 0, ceiling);
  piliSlider.value = String(piliCount);
  piliReadout.textContent = String(piliCount);
}

function showPilusSite(site: PilusSite): void {
  pilusSite = site;
  for (const [id, button] of pilusSiteButtons) {
    const on = id === site;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  syncPiliLimit();
}

piliSlider.addEventListener("input", () => {
  piliCount = clamp(Math.round(Number(piliSlider.value)), 0, piliCeiling());
  piliReadout.textContent = String(piliCount);
});

piliLengthSlider.addEventListener("input", () => {
  piliLength = clamp(Number(piliLengthSlider.value), 0, 1);
  piliLengthReadout.textContent = piliLength.toFixed(2);
});

piliVarianceSlider.addEventListener("input", () => {
  piliVariance = clamp(Number(piliVarianceSlider.value), 0, 1);
  piliVarianceReadout.textContent = piliVariance.toFixed(2);
});

for (const [id, button] of pilusSiteButtons) {
  button.addEventListener("click", () => showPilusSite(id));
}
syncPiliLimit();

/**
 * Whether the membrane pili stand as spikes. Once the genome expresses pilin,
 * each construct's route decides: transmembrane constructs stand spikes and
 * secreted constructs eject, so the spikes show exactly while a transmembrane
 * coat is expressed. The sandbox mode buttons only decide until then.
 */
function membranePili(): boolean {
  if (genomeDrivesPilinState) return genomePilinCoats.length > 0;
  return pilusMode === "transmembrane";
}

function showPilusMode(mode: "transmembrane" | "secreted"): void {
  pilusMode = mode;
  // Fragments in flight belong to the mode that fired them; switching drops them.
  pilusEjection = initialPilusEjection();
  for (const [id, button] of pilusModeButtons) {
    const on = id === mode;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
}

piliModeTransmembraneButton.addEventListener("click", () => showPilusMode("transmembrane"));
piliModeSecretedButton.addEventListener("click", () => showPilusMode("secreted"));
showPilusMode("transmembrane");

// Genome pilin: expressed Pilin replaces the debug pili controls. Transmembrane
// constructs stand spikes; secreted constructs eject fragments, with the fire
// rate and fragment size following the expression level. Length variance stays
// at full, and the position tag chooses the regions. The controls are zeroed
// and disabled while the genome owns the gene.
const applyGenomePilin = (timeSeconds: number): void => {
  genomePilinCoats = pilinFromConstructs(getGenome(), timeSeconds);
  genomeSecretedPilinCoats = pilinSecretedFromConstructs(getGenome(), timeSeconds);
};
const syncGenomePilin = (): void => {
  // Potential-based check: an oscillatory construct resting at its trough must
  // not hand the pili back to the sandbox controls for a moment.
  if (genomeCanDrivePilin(getGenome())) {
    genomeDrivesPilinState = true;
    applyGenomePilin(performance.now() / 1000);
    piliSlider.value = "0";
    piliSlider.disabled = true;
    piliSlider.title = "Driven by expressed pilin in the genome";
    piliReadout.textContent = "0";
    piliLengthSlider.value = "0";
    piliLengthSlider.disabled = true;
    piliLengthSlider.title = "Driven by expressed pilin in the genome";
    piliLengthReadout.textContent = "0.00";
    piliVarianceSlider.value = "0";
    piliVarianceSlider.disabled = true;
    piliVarianceSlider.title = "Driven by expressed pilin in the genome";
    piliVarianceReadout.textContent = "0.00";
    for (const [, button] of pilusSiteButtons) {
      button.disabled = true;
      button.title = "Driven by expressed pilin in the genome";
    }
    for (const [, button] of pilusModeButtons) {
      button.disabled = true;
      button.title = "Driven by expressed pilin in the genome";
    }
    return;
  }
  genomeDrivesPilinState = false;
  genomePilinCoats = [];
  genomeSecretedPilinCoats = [];
  piliSlider.disabled = false;
  piliSlider.title = "";
  piliLengthSlider.disabled = false;
  piliLengthSlider.title = "";
  piliVarianceSlider.disabled = false;
  piliVarianceSlider.title = "";
  for (const [, button] of pilusSiteButtons) {
    button.disabled = false;
    button.title = "";
  }
  for (const [, button] of pilusModeButtons) {
    button.disabled = false;
    button.title = "";
  }
  piliLength = clamp(Number(piliLengthSlider.value), 0, 1);
  piliLengthReadout.textContent = piliLength.toFixed(2);
  piliVariance = clamp(Number(piliVarianceSlider.value), 0, 1);
  piliVarianceReadout.textContent = piliVariance.toFixed(2);
  const selected = pilusSiteButtons.find(([, button]) => button.classList.contains("active"));
  showPilusSite(selected?.[0] ?? pilusSite);
};
subscribeGenome(syncGenomePilin);
syncGenomePilin();

undulationSlider.addEventListener("input", () => {
  undulation = clamp(Number(undulationSlider.value), 0, 2);
  undulationReadout.textContent = `${undulation.toFixed(2)}×`;
});

pulseSlider.addEventListener("input", () => {
  pulse = clamp(Number(pulseSlider.value), 0, 1);
  pulseReadout.textContent = flagellarPulseLabel(pulse);
});

ccwButton.addEventListener("click", () => {
  ccwSwitching = !ccwSwitching;
  if (ccwSwitching && flagellarPulse.swimming) flagellarSwitch.nextClockwise = false;
  ccwButton.classList.toggle("active", ccwSwitching);
  ccwButton.setAttribute("aria-pressed", String(ccwSwitching));
});
ccwButton.classList.add("active");
ccwButton.setAttribute("aria-pressed", "true");

wasdButton.addEventListener("click", () => {
  wasdEnabled = !wasdEnabled;
  wasdButton.classList.toggle("active", wasdEnabled);
  wasdButton.setAttribute("aria-pressed", String(wasdEnabled));
});

sizeSlider.addEventListener("input", () => {
  cellScale = clamp(Number(sizeSlider.value), SIZE_MIN, SIZE_MAX);
  renderer.setCellScale(cellScale);
  pose.length = cellLength();
  sizeReadout.textContent = `${cellScale.toFixed(2)}×`;
  pushMorphology();
  refreshDivideControls();
});

// Genome membrane structure: set by syncGenomeMorphology below. Declared here
// because applyMembrane keeps the thickness slider disabled while the genome
// owns the membrane.
let genomeDrivesMembraneState = false;

const MEMBRANE_PX_DEFAULT = 1;
const MEMBRANE_PX_MAX = 6;

let membranePx = MEMBRANE_PX_DEFAULT;
let membraneStyle = 0;
const membraneButtons = [
  [0, membranePlain],
  [1, membraneWall],
  [2, membraneIsoprenoid],
  [3, membraneCrystal],
] as const;

const MEMBRANE_COLOR_BLACK = "#000000";
const ISOPRENOID_STYLE = 2;

function isoprenoidDefaultColor(): [number, number, number] {
  return [
    INTERIOR_BASE_COLOR[0] * ISOPRENOID_SHADE,
    INTERIOR_BASE_COLOR[1] * ISOPRENOID_SHADE,
    INTERIOR_BASE_COLOR[2] * ISOPRENOID_SHADE,
  ];
}

function styleDefaultHex(style: number): string {
  return style === ISOPRENOID_STYLE ? colorHex(isoprenoidDefaultColor()) : MEMBRANE_COLOR_BLACK;
}

function membraneColor(): [number, number, number] {
  const hex = (membraneColorInput?.value ?? MEMBRANE_COLOR_BLACK).toLowerCase();
  if (membraneStyle === ISOPRENOID_STYLE && hex === styleDefaultHex(ISOPRENOID_STYLE)) {
    return isoprenoidDefaultColor();
  }
  const value = Number.parseInt(hex.slice(1), 16);
  if (!Number.isFinite(value)) return [0, 0, 0];
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function appliedMembranePx(): number {
  return membraneStyle === 0 ? MEMBRANE_PX_DEFAULT : membranePx;
}

const applyMembrane = (broadcast = true): void => {
  const plain = membraneStyle === 0;
  const shown = appliedMembranePx();
  membranePxSlider.disabled = plain || genomeDrivesMembraneState;
  membranePxSlider.max = String(plain ? MEMBRANE_PX_DEFAULT : MEMBRANE_PX_MAX);
  membranePxSlider.value = String(shown);
  membranePxReadout.textContent = `${shown} px`;
  renderer.setMembrane(shown, membraneStyle, membraneColor());
  if (broadcast) pushMorphology();
};

function showMembraneStyle(style: number): void {
  if (!membraneColorInput) return;
  const current = (membraneColorInput.value || MEMBRANE_COLOR_BLACK).toLowerCase();
  const inherited = current === styleDefaultHex(membraneStyle);
  membraneStyle = style;
  if (inherited) membraneColorInput.value = styleDefaultHex(style);
  for (const [id, button] of membraneButtons) {
    const on = id === style;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  applyMembrane();
}

for (const [id, button] of membraneButtons) {
  button.addEventListener("click", () => showMembraneStyle(id));
}

membranePxSlider.addEventListener("input", () => {
  membranePx = clamp(Math.round(Number(membranePxSlider.value)), MEMBRANE_PX_DEFAULT, MEMBRANE_PX_MAX);
  applyMembrane();
});

membraneColorInput.addEventListener("input", () => applyMembrane());
applyMembrane();

// Genome morphology: expressed shape genes replace the debug controls, which
// are zeroed and disabled while the genome is driving the cell's form.
// Elongin, Girthin and Crescentin are cytosolic dials for the elongation,
// girth and crescent sliders. Taperin adds a positional taper: its position
// tag picks the pinched end and its expression level is the pinch depth.
// Crystallin and Isoprene Synthase take over the membrane structure — any
// expression installs the layer (crystal wins when both are secreted at
// once) and the expression level sets the layer's thickness.
let genomeDrivesElonginState = false;
let genomeDrivesGirthinState = false;
let genomeDrivesCrescentinState = false;
let genomeDrivesTaperinState = false;
let genomeDrivesMorphologyState = false;

function membranePxForLevel(level: number): number {
  return clamp(
    Math.floor(MEMBRANE_PX_DEFAULT + level * (MEMBRANE_PX_MAX - MEMBRANE_PX_DEFAULT)),
    MEMBRANE_PX_DEFAULT,
    MEMBRANE_PX_MAX,
  );
}

const applyGenomeMorphology = (timeSeconds: number): void => {
  const constructs = getGenome();
  if (genomeDrivesElonginState) {
    elongation = cytosolicMorphologyLevel(constructs, "ELGN", timeSeconds);
    pose.length = cellLength();
  }
  if (genomeDrivesGirthinState) girth = cytosolicMorphologyLevel(constructs, "GRTN", timeSeconds);
  if (genomeDrivesCrescentinState) crescent = cytosolicMorphologyLevel(constructs, "CRST", timeSeconds);
  if (genomeDrivesTaperinState) {
    const taper = taperinCellTaper(constructs, timeSeconds);
    taperMask = taper.mask;
    taperPolarDegree = taper.polar;
    taperAntipolarDegree = taper.antipolar;
    taperLateralDegree = taper.lateral;
    taperAntilateralDegree = taper.antilateral;
  }
  if (genomeDrivesMembraneState) {
    const crystallin = secretedMorphologyLevel(constructs, "CRYS", timeSeconds);
    const isoprene = secretedMorphologyLevel(constructs, "ISPR", timeSeconds);
    if (crystallin > 0) {
      membraneStyle = 3;
      membranePx = membranePxForLevel(crystallin);
    } else if (isoprene > 0) {
      membraneStyle = ISOPRENOID_STYLE;
      membranePx = membranePxForLevel(isoprene);
    } else {
      membraneStyle = 0;
      membranePx = MEMBRANE_PX_DEFAULT;
    }
    renderer.setMembrane(appliedMembranePx(), membraneStyle, membraneColor());
  }
  pushMorphology();
};

const syncGenomeMorphology = (): void => {
  // Potential-based checks: an oscillatory construct resting at its trough
  // must not hand the shape back to the sandbox controls for a moment.
  const constructs = getGenome();
  genomeDrivesElonginState = genomeCanDriveCytosolicMorphology(constructs, "ELGN");
  genomeDrivesGirthinState = genomeCanDriveCytosolicMorphology(constructs, "GRTN");
  genomeDrivesCrescentinState = genomeCanDriveCytosolicMorphology(constructs, "CRST");
  genomeDrivesTaperinState = genomeCanDriveTaperin(constructs);
  genomeDrivesMembraneState =
    genomeCanDriveSecretedMorphology(constructs, "CRYS") ||
    genomeCanDriveSecretedMorphology(constructs, "ISPR");
  genomeDrivesMorphologyState =
    genomeDrivesElonginState ||
    genomeDrivesGirthinState ||
    genomeDrivesCrescentinState ||
    genomeDrivesTaperinState ||
    genomeDrivesMembraneState;

  for (const [slider, readout, driving] of [
    [elongationSlider, elongationReadout, genomeDrivesElonginState],
    [girthSlider, girthReadout, genomeDrivesGirthinState],
    [crescentSlider, crescentReadout, genomeDrivesCrescentinState],
  ] as [HTMLInputElement, HTMLElement, boolean][]) {
    if (driving) {
      slider.value = "0";
      slider.disabled = true;
      slider.title = "Driven by expressed shape protein in the genome";
      readout.textContent = "0.00";
    } else {
      slider.disabled = false;
      slider.title = "";
    }
  }
  if (!genomeDrivesElonginState) {
    elongation = clamp(Number(elongationSlider.value), 0, 1);
    elongationReadout.textContent = elongation.toFixed(2);
    pose.length = cellLength();
  }
  if (!genomeDrivesGirthinState) {
    girth = clamp(Number(girthSlider.value), 0, 1);
    girthReadout.textContent = girth.toFixed(2);
  }
  if (!genomeDrivesCrescentinState) {
    crescent = clamp(Number(crescentSlider.value), 0, 1);
    crescentReadout.textContent = crescent.toFixed(2);
  }

  // Taperin keeps the user's sandbox taper configuration on the buttons and
  // degree sliders, which only go disabled while the genome owns the taper.
  for (const button of [taperPolarButton, taperAntipolarButton, taperLateralButton, taperAntilateralButton, taperAllButton]) {
    button.disabled = genomeDrivesTaperinState;
    button.title = genomeDrivesTaperinState ? "Driven by expressed taperin in the genome" : "";
  }
  for (const [slider, readout] of [
    [taperPolarSlider, taperPolarReadout],
    [taperAntipolarSlider, taperAntipolarReadout],
    [taperLateralSlider, taperLateralReadout],
    [taperAntilateralSlider, taperAntilateralReadout],
  ] as [HTMLInputElement, HTMLElement][]) {
    slider.disabled = genomeDrivesTaperinState;
    slider.title = genomeDrivesTaperinState ? "Driven by expressed taperin in the genome" : "";
  }
  if (!genomeDrivesTaperinState) {
    const allOn = taperAllButton.classList.contains("active");
    taperMask = allOn
      ? TAPER_ALL
      : taperButtons.reduce((mask, [, bit, button]) => (button.classList.contains("active") ? mask | bit : mask), 0);
    taperPolarDegree = clamp(Number(taperPolarSlider.value), 0, 1);
    taperAntipolarDegree = clamp(Number(taperAntipolarSlider.value), 0, 1);
    taperLateralDegree = clamp(Number(taperLateralSlider.value), 0, 1);
    taperAntilateralDegree = clamp(Number(taperAntilateralSlider.value), 0, 1);
    syncTaperButtons();
    syncTaperDegrees();
  }

  // The membrane style buttons and thickness slider hand the layer to the
  // genome while either structure protein is secreted; the colour input stays
  // live either way. The buttons keep the user's selection, so removing the
  // constructs restores it.
  for (const [, button] of membraneButtons) {
    button.disabled = genomeDrivesMembraneState;
    button.title = genomeDrivesMembraneState ? "Driven by expressed membrane structure protein in the genome" : "";
  }
  membranePxSlider.disabled = genomeDrivesMembraneState;
  membranePxSlider.title = genomeDrivesMembraneState ? "Driven by expressed membrane structure protein in the genome" : "";
  if (!genomeDrivesMembraneState) {
    membraneStyle = membraneButtons.find(([, button]) => button.classList.contains("active"))?.[0] ?? 0;
    membranePx = clamp(Math.round(Number(membranePxSlider.value)), MEMBRANE_PX_DEFAULT, MEMBRANE_PX_MAX);
    applyMembrane();
  }

  if (genomeDrivesMorphologyState) applyGenomeMorphology(performance.now() / 1000);
};
subscribeGenome(syncGenomeMorphology);
syncGenomeMorphology();

clearButton.addEventListener("click", () => {
  siblings.length = 0;
  flagellaCache.clear();
  lineage.length = 0;
  lineage.push(controlledId);
  refreshDivideControls();
  refreshSpecies();
});

const GENUS_STEMS = ["halo", "thermo", "thio", "nitro", "aqua", "geo", "rhodo", "ferro", "photo", "pseudo", "cyano", "alkali", "baro", "cryo", "acido", "methano", "desulfo"];
const GENUS_ENDINGS = ["monas", "bacter", "coccus", "vibrio", "bacillus", "plasma", "spira"];
const SPECIES_EPITHETS = ["marinus", "thermalis", "profundus", "halophilus", "aquaticus", "pelagicus", "abyssalis", "sulfureus", "venticola", "salinus", "littoralis", "phototrophus"];

function randomSpeciesName(): string {
  const pick = (list: readonly string[]): string => list[Math.floor(Math.random() * list.length)] ?? list[0] ?? "";
  const genus = `${pick(GENUS_STEMS)}${pick(GENUS_ENDINGS)}`;
  return `${genus.charAt(0).toUpperCase()}${genus.slice(1)} ${pick(SPECIES_EPITHETS)}`;
}

const ownedSpecies = randomSpeciesName();
speciesName.textContent = ownedSpecies;
speciesName.title = ownedSpecies;

speciesPrev.addEventListener("click", () => focusSpecies(-1));
speciesNext.addEventListener("click", () => focusSpecies(1));
for (const button of [speciesPrev, speciesNext]) {
  button.addEventListener("pointerenter", () => {
    if (!button.disabled) playCue("hover");
  });
  button.addEventListener("click", () => playCue("step"));
}

applyAllButton.addEventListener("click", () => {
  applyAll = !applyAll;
  applyAllButton.classList.toggle("active", applyAll);
  applyAllButton.setAttribute("aria-pressed", String(applyAll));
  refreshDivideControls();
});

divideButton.addEventListener("click", () => {
  let started = false;
  if (cellCanDivide(cellScale, division !== null)) {
    const committed = commitDivision(playerForm(), controlledCiliaPresence, controlledPiliPresence);
    division = committed.division;
    if (committed.ciliaFade) controlledCiliaFade = committed.ciliaFade;
    if (committed.piliFade) controlledPiliFade = committed.piliFade;
    setShapeEnabled(false);
    started = true;
  }
  if (applyAll) {
    for (const cell of siblings) {
      if (!cellCanDivide(cell.form.scale, cell.division !== null)) continue;
      const committed = commitDivision(cell.form, cell.ciliaPresence, cell.piliPresence);
      cell.division = committed.division;
      if (committed.ciliaFade) cell.ciliaFade = committed.ciliaFade;
      if (committed.piliFade) cell.piliFade = committed.piliFade;
      started = true;
    }
  }
  if (started) refreshDivideControls();
});

refreshDivideControls();

zoomFreeButton.addEventListener("click", () => {
  const on = zoomFreeButton.getAttribute("aria-pressed") !== "true";
  zoomFreeButton.classList.toggle("active", on);
  zoomFreeButton.setAttribute("aria-pressed", String(on));
  renderer.setZoomUnrestricted(on);
});

texelButton.addEventListener("click", () => {
  const on = texelButton.getAttribute("aria-pressed") !== "true";
  texelButton.classList.toggle("active", on);
  texelButton.setAttribute("aria-pressed", String(on));
  renderer.setTexelGrid(on);
});
const overlayButtons: Record<FieldOverlay, HTMLButtonElement> = {
  temperature: temperatureButton,
  oxidex: oxidexButton,
  sulfex: sulfexButton,
  pressure: pressureButton,
};
function setFieldOverlay(next: FieldOverlay | null): void {
  for (const [name, button] of Object.entries(overlayButtons)) {
    const on = name === next;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  renderer.setFieldOverlay(next);
}
for (const [name, button] of Object.entries(overlayButtons) as Array<[FieldOverlay, HTMLButtonElement]>) {
  button.addEventListener("click", () => {
    const on = button.getAttribute("aria-pressed") === "true";
    setFieldOverlay(on ? null : name);
  });
}

paintButton.addEventListener("click", () => setEditMode("paint"));
ventButton.addEventListener("click", () => setEditMode("vent"));
lightButton.addEventListener("click", () => setEditMode("light"));
bubbleButton.addEventListener("click", () => setEditMode("bubble"));
heatButton.addEventListener("click", () => setEditMode("heat"));
const setHeatSize = (next: number): void => {
  const steps = Math.round(next / HEAT_SIZE_STEP);
  heatSize = Math.min(HEAT_SIZE_MAX, Math.max(HEAT_SIZE_MIN, steps * HEAT_SIZE_STEP));
  heatSizeReadout.textContent = `${heatSize.toFixed(2)}×`;
  if (editMode !== "heat") setEditMode("heat");
};
heatDec.addEventListener("click", () => setHeatSize(heatSize - HEAT_SIZE_STEP));
heatInc.addEventListener("click", () => setHeatSize(heatSize + HEAT_SIZE_STEP));
depositButton.addEventListener("click", () => setEditMode("deposit"));
decorButton.addEventListener("click", () => setEditMode("decor"));
eraseButton.addEventListener("click", () => setEditMode("erase"));
function showDecorLayer(layer: "back" | "mid" | "fore"): void {
  decorLayer = layer;
  for (const [name, button] of Object.entries(decorLayerButtons)) {
    const on = name === layer;
    button?.classList.toggle("active", on);
    button?.setAttribute("aria-pressed", String(on));
  }
}

function setDecorLayer(layer: "back" | "mid" | "fore"): void {
  showDecorLayer(layer);
  if (editMode !== "decor") setEditMode("decor");
}

decorLayerButtons.back.addEventListener("click", () => setDecorLayer("back"));
decorLayerButtons.mid.addEventListener("click", () => setDecorLayer("mid"));
decorLayerButtons.fore.addEventListener("click", () => setDecorLayer("fore"));
showDecorLayer("mid");
function showDepositFacing(facing: "right" | "up" | "left" | "bottom"): void {
  depositFacing = facing;
  for (const [name, button] of Object.entries(depositFacingButtons)) {
    const on = name === facing;
    button?.classList.toggle("active", on);
    button?.setAttribute("aria-pressed", String(on));
  }
}
function setDepositFacing(facing: "right" | "up" | "left" | "bottom"): void {
  showDepositFacing(facing);
  if (editMode !== "deposit") setEditMode("deposit");
}
depositFacingButtons.right.addEventListener("click", () => setDepositFacing("right"));
depositFacingButtons.up.addEventListener("click", () => setDepositFacing("up"));
depositFacingButtons.left.addEventListener("click", () => setDepositFacing("left"));
depositFacingButtons.bottom.addEventListener("click", () => setDepositFacing("bottom"));
depositList.addEventListener("change", () => {
  if (editMode !== "deposit") setEditMode("deposit");
});
showDepositFacing("right");
decorRandom.addEventListener("click", () => {
  decorRandomOn = !decorRandomOn;
  decorRandom.classList.toggle("active", decorRandomOn);
  decorRandom.setAttribute("aria-pressed", String(decorRandomOn));
});

function rollDecorName(except?: string | null): string | null {
  const label = decorLayer === "back" ? "Background" : decorLayer === "mid" ? "Midground" : "Foreground";
  const group = Array.from(decorationList.querySelectorAll("optgroup")).find((section) => section.label === label);
  const options = group ? Array.from(group.querySelectorAll("option")) : [];
  if (options.length === 0) return null;
  const pool = except && options.length > 1 ? options.filter((option) => option.value !== except) : options;
  return pool[Math.floor(Math.random() * pool.length)].value;
}

function decorPaintName(): string {
  if (decorLayer === "mid" && decorDragging) return rollDecorName(lastMidName) ?? decorationList.value;
  return strokeDecorName ?? decorationList.value;
}
saveButton.addEventListener("click", () => {
  terrainStatus.textContent = "Saving…";
  void renderer.saveTerrain().then((result) => {
    terrainStatus.textContent =
      result === "saved" ? "Saved" : result === "loading" ? "Terrain is still loading" : "Save failed";
    playCue(result === "saved" ? "confirm" : result === "loading" ? "deny" : "alarm");
  });
});

function editAt(clientX: number, clientY: number): void {
  if (!editMode) return;
  const world = renderer.worldAt(clientX, clientY);
  if (!world) return;
  if (editMode === "paint") renderer.paintTerrain(world[0], world[1]);
  else if (editMode === "vent") renderer.paintVent(world[0], world[1]);
  else if (editMode === "light") renderer.placeLight(world[0], world[1]);
  else if (editMode === "bubble") renderer.placeBubble(world[0], world[1]);
  else if (editMode === "heat") renderer.placeHeat(world[0], world[1], heatSize);
  else if (editMode === "deposit") renderer.paintDeposit(world[0], world[1], depositList.value, depositFacing);
  else if (editMode === "decor") {
    const name = decorPaintName();
    if (renderer.paintDecoration(world[0], world[1], decorLayer, name) && decorLayer === "mid") lastMidName = name;
  }
  else renderer.eraseTerrain(world[0], world[1]);
}

canvas.addEventListener("pointerdown", (event) => {
  if (!editMode || event.button !== 0) return;
  editing = true;
  canvas.setPointerCapture(event.pointerId);
  decorDragging = false;
  lastMidName = null;
  strokeDecorName = editMode === "decor" && decorRandomOn ? rollDecorName() : null;
  editAt(event.clientX, event.clientY);
  decorDragging = true;
});
canvas.addEventListener("pointermove", (event) => {
  if (!editing || editMode === "light" || editMode === "bubble" || editMode === "heat") return;
  editAt(event.clientX, event.clientY);
});
const endEdit = (): void => {
  if (!editing) return;
  editing = false;
  decorDragging = false;
  strokeDecorName = null;
  lastMidName = null;
  renderer.endTerrainStroke();
};
canvas.addEventListener("pointerup", endEdit);
canvas.addEventListener("pointercancel", endEdit);
canvas.addEventListener("pointermove", (event) => {
  inspect.pointer(event.clientX, event.clientY);
  environmentProbe.pointer(event.clientX, event.clientY);
  if (!editMode) setCanvasCursor(hoverCursor());
});
canvas.addEventListener("pointerleave", () => {
  inspect.pointerLeave();
  environmentProbe.pointerLeave();
  if (!editMode) setCanvasCursor(hoverCursor());
});
canvas.addEventListener("pointerdown", (event) => {
  if (editMode || event.button !== 0) return;
  inspect.press(event.clientX, event.clientY);
});
const session = new SimulationSession((status) => {
  document.title = status === "live" ? "Prokaryon cell lab" : `Prokaryon cell lab — ${status}`;
});

initDock();
onEnvironmentVisible((visible) => {
  environmentOn = visible;
  renderer.setNutrientsVisible(visible);
  environmentProbe.setEnabled(visible);
  if (!editMode) setCanvasCursor(hoverCursor());
});
initGenomeViewer();
initExpression();
initGenomeEditor();
void loadGenomeState();
void loadUnlocks();
initTechTree();
initCodex();
initPlayer();
initSettings();
initTitleScreen();
setPopulation(lineage.length);
initResourceBar();
renderer.resize();
window.addEventListener("resize", () => renderer.resize());
window.addEventListener("keydown", (event) => setKey(event, true));
window.addEventListener("keyup", (event) => setKey(event, false));
window.addEventListener("focusin", (event) => {
  if (isTypingTarget(event.target)) held.clear();
});
window.addEventListener("blur", () => held.clear());
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    renderer.zoomBy(event.deltaY, event.deltaMode);
  },
  { passive: false },
);
session.start();

let decorFilled = false;
function fillDecorTypes(): void {
  if (decorFilled) return;
  const types = renderer.decorationTypes();
  if (types.length === 0) return;
  const groups = [
    ["fore", "Foreground"],
    ["mid", "Midground"],
    ["back", "Background"],
  ] as const;
  for (const [group, label] of groups) {
    const section = document.createElement("optgroup");
    section.label = label;
    for (const type of types) {
      if (type.group !== group) continue;
      const option = document.createElement("option");
      option.value = type.name;
      option.textContent = type.label;
      section.append(option);
    }
    if (section.childElementCount > 0) decorationList.append(section);
  }
  decorFilled = true;
}

let last = performance.now();
let sunOrigin: number | null = null;

function sunElapsed(now: number): number {
  if (sunOrigin === null) sunOrigin = now;
  return (now - sunOrigin) / 1000 + sunShiftSeconds;
}
let booted = false;
let worldReadyAt: number | null = null;
let showingTitle = true;
/** Vents and bubble sources sit on the floor around this depth. */
const TITLE_FLOOR = -496.5;
const TITLE_X0 = -78;
const TITLE_SPAN = 168;
const TITLE_PAN_SECONDS = 340;
const MENU_TYPE_COUNT = 8;
const MENU_COPIES_MIN = 2;
const MENU_COPIES_MAX = 16;
const titleStill = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const menuSwimmers: MenuSwimmer[] = [];

function titleGlance(now: number, pixelsPerUnit: number): [number, number] {
  const [, halfY] = renderer.viewExtent(pixelsPerUnit);
  const y = TITLE_FLOOR + halfY * 0.42;
  if (titleStill) return [8, y];
  const along = 0.5 - 0.5 * Math.cos((now / 1000) * ((Math.PI * 2) / TITLE_PAN_SECONDS));
  return [TITLE_X0 + along * TITLE_SPAN, y];
}

type MenuBand = { x0: number; x1: number; y0: number; y1: number };

/** The water the title camera actually sweeps, plus a little room at the sides. */
function menuBand(pixelsPerUnit: number): MenuBand {
  const [halfX, halfY] = renderer.viewExtent(pixelsPerUnit);
  const y = TITLE_FLOOR + halfY * 0.42;
  const padX = Math.min(6, halfX * 0.45);
  const padY = Math.min(0.9, halfY * 0.14);
  return {
    x0: TITLE_X0 - padX,
    x1: TITLE_X0 + TITLE_SPAN + padX,
    y0: Math.max(TITLE_FLOOR + 0.35, y - halfY + padY),
    y1: y + halfY - padY,
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spanPick(rng: () => number, min: number, max: number): number {
  return min + (max - min) * rng();
}

function pickOne<T>(rng: () => number, values: readonly T[]): T {
  const index = Math.min(values.length - 1, Math.floor(rng() * values.length));
  return values[index] ?? values[0];
}

const MENU_CILIA_SWITCHES = ["lateral", "antilateral", "polar", "antipolar"] as const;
const MENU_PILUS_SITES = ["polar", "antipolar", "lateral", "antilateral", "all"] as const;
const MENU_FLAGELLAR_SITES = ["polar", "antipolar", "lateral", "antilateral"] as const;

/** Two different flagellar sites. The other two stay bare. */
function twoFlagellarSites(rng: () => number): Array<(typeof MENU_FLAGELLAR_SITES)[number]> {
  const sites = [...MENU_FLAGELLAR_SITES];
  const first = sites.splice(Math.floor(rng() * sites.length), 1)[0];
  const second = sites[Math.floor(rng() * sites.length)];
  if (!first || !second) return ["polar", "lateral"];
  return [first, second];
}

/** Slider ranges from the motility tab. Flagella are limited to the given sites. */
function randomDrive(rng: () => number, flagellarSites: ReadonlyArray<(typeof MENU_FLAGELLAR_SITES)[number]>): CellDrive {
  const tuft = (site: (typeof MENU_FLAGELLAR_SITES)[number]): number =>
    flagellarSites.includes(site) ? spanPick(rng, 0.4, 1) : 0;
  const antipolar = tuft("antipolar");
  const polar = tuft("polar");
  const lateral = tuft("lateral");
  const antilateral = tuft("antilateral");
  let ciliation = rng() < 0.42 ? 0 : 4 + Math.floor(rng() * (CILIATION_MAX - 3));
  if (flagellarSites.length === 0 && ciliation < 4) ciliation = 8 + Math.floor(rng() * 28);
  const site = pickOne(rng, MENU_PILUS_SITES);
  const piliCeiling = Math.max(1, maxPiliOnSite(PILI_MAX, site));
  const rolledPili = rng() < 0.4 ? 0 : 1 + Math.floor(rng() * piliCeiling);
  return {
    buoyin: 0,
    ballastin: spanPick(rng, 0.9, 0.95),
    lubricin: 1,
    adhesin: rng(),
    antipolar,
    polar,
    lateral,
    antilateral,
    ciliation: Math.min(CILIATION_MAX, ciliation),
    ciliaLength: spanPick(rng, 0.2, 1),
    ciliaSpeed: spanPick(rng, 0.15, 2),
    ciliaSway: spanPick(rng, 0.2, 1),
    ciliaOrder: rng(),
    ciliaSwitch: pickOne(rng, MENU_CILIA_SWITCHES),
    ciliaReverse: rng() < 0.5,
    ciliaMotor: null,
    piliCount: Math.min(piliCeiling, rolledPili),
    piliLength: spanPick(rng, 0.15, 1),
    piliVariance: rng(),
    pilusSite: site,
    piliCoats: null,
    undulation: spanPick(rng, 0.35, 2),
    undulationBySite: null,
    pulse: rng() < 0.22 ? 1 : spanPick(rng, 0.2, 0.92),
    ccw: rng() < 0.5,
  };
}

function randomMenuForm(rng: () => number): CellForm {
  const bits = [TAPER_POLAR, TAPER_ANTIPOLAR, TAPER_LATERAL, TAPER_ANTILATERAL];
  let mask = 0;
  for (const bit of bits) if (rng() < 0.45) mask |= bit;
  return {
    scale: spanPick(rng, SIZE_MIN, 1),
    elongation: rng(),
    girth: rng(),
    crescent: rng(),
    taper: {
      mask,
      polar: rng(),
      antipolar: rng(),
      lateral: rng(),
      antilateral: rng(),
    },
  };
}

function randomMenuMembrane(rng: () => number): MembraneLook {
  const style = Math.floor(rng() * 4);
  const px = style === 0 ? MEMBRANE_PX_DEFAULT : 1 + Math.floor(rng() * MEMBRANE_PX_MAX);
  return { px, style, color: [rng(), rng(), rng()] };
}

function randomMenuPigment(rng: () => number, index: number): PigmentLevels {
  const keys = ["carotin", "rhodin", "siderin", "cryptochrome"] as const;
  const levels = emptyPigment();
  const primary = keys[index % keys.length] ?? "carotin";
  levels[primary] = spanPick(rng, 0.5, 1);
  for (const key of keys) {
    if (key === primary) continue;
    if (rng() < 0.28) levels[key] = rng() * 0.55;
  }
  return levels;
}

function randomMenuFluor(rng: () => number): FluorLevels {
  const levels = emptyFluor();
  if (rng() >= 0.4) return levels;
  const keys = ["gfp", "yfp", "bfp", "rfp"] as const;
  const primary = pickOne(rng, keys);
  levels[primary] = spanPick(rng, 0.45, 1);
  return levels;
}

/** A random pose in the pan whose body and pili are clear of solid terrain. */
function placeMenuSwimmer(
  rng: () => number,
  form: CellForm,
  drive: CellDrive,
  crystal: boolean,
  band: MenuBand,
): BodyPose | null {
  const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  const probes = pilusProbes(form, crystal, drive.piliCount, drive.piliLength, drive.piliVariance, drive.pilusSite, drive.piliCoats);
  const accept = (x: number, y: number, angle: number): BodyPose | null => {
    if (x < band.x0 || x > band.x1 || y < band.y0 || y > band.y1) return null;
    if (renderer.poseOverlaps(x, y, angle, body.length, body.width, body.bend, probes)) return null;
    const candidate: Capsule = { x, y, angle, length: body.length, width: body.width };
    for (const other of menuSwimmers) {
      if (capsulesOverlap(candidate, menuCapsule(other))) return null;
    }
    return { x, y, angle, length: body.length };
  };
  const xSpan = band.x1 - band.x0;
  const ySpan = band.y1 - band.y0;
  for (let attempt = 0; attempt < 36; attempt += 1) {
    const placed = accept(band.x0 + rng() * xSpan, band.y0 + rng() * ySpan, rng() * Math.PI * 2);
    if (placed) return placed;
  }
  const columns = 28;
  const rows = 18;
  for (let column = 0; column < columns; column += 1) {
    const x = band.x0 + ((column + 0.5) / columns) * xSpan;
    const angle = rng() * Math.PI * 2;
    for (let row = rows; row >= 0; row -= 1) {
      const placed = accept(x, band.y0 + (row / rows) * ySpan, angle);
      if (placed) return placed;
    }
  }
  return null;
}

function spawnMenuSwimmers(pixelsPerUnit: number): void {
  if (menuSwimmers.length > 0) return;
  const rng = mulberry32((Math.floor(performance.now() * 997) ^ Math.floor(Math.random() * 0x100000000)) >>> 0);
  const band = menuBand(pixelsPerUnit);
  const flagellarTypes = new Set<number>();
  while (flagellarTypes.size < 2) flagellarTypes.add(Math.floor(rng() * MENU_TYPE_COUNT));
  let nextId = 10001;
  for (let index = 0; index < MENU_TYPE_COUNT; index += 1) {
    const drive = randomDrive(rng, flagellarTypes.has(index) ? twoFlagellarSites(rng) : []);
    const form = randomMenuForm(rng);
    const membrane = randomMenuMembrane(rng);
    const pigment = randomMenuPigment(rng, index);
    const fluor = randomMenuFluor(rng);
    const copies = MENU_COPIES_MIN + Math.floor(rng() * (MENU_COPIES_MAX - MENU_COPIES_MIN + 1));
    for (let copy = 0; copy < copies; copy += 1) {
      const crystal = membrane.style === 3;
      const pose = placeMenuSwimmer(rng, form, drive, crystal, band);
      if (!pose) continue;
      const pulseScale = randomPulseScale(rng);
      const pulse = independentPulseState(drive.pulse, pulseScale, rng);
      const id = nextId;
      nextId += 1;
      menuSwimmers.push({
        id,
        seed: id,
        form: { ...form, taper: { ...form.taper } },
        membrane: { px: membrane.px, style: membrane.style, color: [membrane.color[0], membrane.color[1], membrane.color[2]] },
        pigment: copyPigment(pigment),
        fluor: copyFluor(fluor),
        drive: { ...drive },
        pose,
        swim: { vx: 0, vy: 0, omega: 0, thrusting: false, driveX: 0, driveY: 0 },
        pulse,
        pulseScale,
        flagellar: drive.ccw
          ? independentSwitchState(drive.pulse, pulse.swimming, rng)
          : { clockwise: true, nextClockwise: true, tumbleSign: 1, tumbleOmega: 0 },
      });
    }
  }
}

function holdMenuSwimmer(cell: MenuSwimmer, band: MenuBand): void {
  const pose = cell.pose;
  const motion = cell.swim;
  if (pose.x < band.x0) {
    pose.x = band.x0;
    if (motion.vx < 0) motion.vx = 0;
    if (motion.omega < 0.6) motion.omega = 1.3;
  } else if (pose.x > band.x1) {
    pose.x = band.x1;
    if (motion.vx > 0) motion.vx = 0;
    if (motion.omega > -0.6) motion.omega = -1.3;
  }
  if (pose.y < band.y0) {
    pose.y = band.y0;
    if (motion.vy < 0) motion.vy = 0;
  } else if (pose.y > band.y1) {
    pose.y = band.y1;
    if (motion.vy > 0) motion.vy = 0;
    if (Math.abs(motion.omega) < 0.5) motion.omega = 0.9;
  }
}

function stepMenuSwimmer(cell: MenuSwimmer, dt: number, band: MenuBand): void {
  const wasSwimming = cell.pulse.swimming;
  cell.pulse = stepFlagellarPulse(cell.pulse, cell.drive.pulse, dt, cell.pulseScale);
  cell.flagellar = stepFlagellarSwitch(cell.flagellar, cell.drive.ccw, wasSwimming, cell.pulse.swimming);
  cruise(
    cell.pose,
    cell.swim,
    cell.pulse,
    cell.flagellar,
    cell.form,
    dt,
    wasSwimming,
    0,
    true,
    1,
    cell.membrane.style === 3,
    cell.drive,
    false,
  );
  holdMenuSwimmer(cell, band);
}

function menuSnapshot(cell: MenuSwimmer): CellSnapshot {
  const drive = cell.drive;
  const body = cellDimensions(cell.form.scale, cell.form.elongation, cell.form.girth, cell.form.crescent);
  const crystal = cell.membrane.style === 3;
  return {
    id: cell.id,
    x: cell.pose.x,
    y: cell.pose.y,
    angle: cell.pose.angle,
    vx: cell.swim.vx,
    vy: cell.swim.vy + buoyancyVelocity(cell.pose.y, drive.buoyin, drive.ballastin),
    omega: cell.swim.omega,
    length: body.length,
    width: body.width,
    bend: body.bend,
    furrow: 0,
    furrowAxis: 0,
    morph: 0,
    divisionShift: 0,
    divisionPlace: 0,
    palette: 0,
    seed: cell.seed,
    capsule: 0,
    motor: motorOf(cell.pulse, cell.flagellar, drive.undulation, drive.ccw),
    activity: cell.pulse.swimming ? drive.undulation : 0,
    ciliaSpeed: drive.ciliaSpeed,
    ciliaSway: drive.ciliaSway,
    ciliaCover: 1,
    ciliaOrder: drive.ciliaOrder,
    ciliaSwitch: drive.ciliaSwitch,
    ciliaReverse: drive.ciliaReverse,
    flagella: flagellaFor(cell.id, cell.form, drive.antipolar, drive.polar, drive.lateral, drive.antilateral),
    cilia: ciliaFor(cell.form, crystal, drive.ciliation, drive.ciliaLength),
    pili: piliFor(cell.form, crystal, drive.piliCount, drive.piliLength, drive.piliVariance, drive.pilusSite, drive.piliCoats),
    piliCover: 1,
    membranePx: cell.membrane.px,
    membraneStyle: cell.membrane.style,
    membraneColor: cell.membrane.color,
    pigment: pigmentTint(cell.pigment),
    glow: fluorEmission(cell.fluor),
    taper: cell.form.taper,
  };
}

function menuCapsule(swimmer: MenuSwimmer): Capsule {
  const body = cellDimensions(swimmer.form.scale, swimmer.form.elongation, swimmer.form.girth, swimmer.form.crescent);
  return { x: swimmer.pose.x, y: swimmer.pose.y, angle: swimmer.pose.angle, length: body.length, width: body.width };
}

function collideMenuSwimmers(): void {
  const count = menuSwimmers.length;
  if (count < 2) return;
  const capsules: Capsule[] = [];
  const reach: number[] = [];
  for (const swimmer of menuSwimmers) {
    const capsule = menuCapsule(swimmer);
    capsules.push(capsule);
    reach.push(Math.max(capsule.length, capsule.width) / 2);
  }
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      const a = capsules[i];
      const b = capsules[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const limit = reach[i] + reach[j];
      if (dx * dx + dy * dy > limit * limit) continue;
      const contact = capsuleGap(a, b);
      if (contact.gap >= 0) continue;
      const push = (-contact.gap + 1e-4) / 2;
      const nx = contact.nx;
      const ny = contact.ny;
      a.x -= push * nx;
      a.y -= push * ny;
      b.x += push * nx;
      b.y += push * ny;
      menuSwimmers[i].pose.x = a.x;
      menuSwimmers[i].pose.y = a.y;
      menuSwimmers[j].pose.x = b.x;
      menuSwimmers[j].pose.y = b.y;
      const approach =
        (menuSwimmers[i].swim.vx - menuSwimmers[j].swim.vx) * nx +
        (menuSwimmers[i].swim.vy - menuSwimmers[j].swim.vy) * ny;
      if (approach > 0) {
        const share = approach / 2;
        menuSwimmers[i].swim.vx -= share * nx;
        menuSwimmers[i].swim.vy -= share * ny;
        menuSwimmers[j].swim.vx += share * nx;
        menuSwimmers[j].swim.vy += share * ny;
      }
    }
  }
}

function stepMenuShowcase(dt: number, pixelsPerUnit: number): void {
  if (menuSwimmers.length === 0) spawnMenuSwimmers(pixelsPerUnit);
  if (titleStill) return;
  const band = menuBand(pixelsPerUnit);
  for (const swimmer of menuSwimmers) stepMenuSwimmer(swimmer, dt, band);
  collideMenuSwimmers();
}

function releaseMenuShowcase(): void {
  for (const swimmer of menuSwimmers) flagellaCache.delete(swimmer.id);
  menuSwimmers.length = 0;
}

function sceneView(sample: { view: ViewSnapshot } | null): ViewSnapshot {
  return (
    sample?.view ?? {
      half_width: 0,
      half_height: 0,
      logical_width: 0,
      logical_height: 0,
      pixels_per_unit: PIXELS_PER_UNIT,
    }
  );
}

function frame(now: number): void {
  fillDecorTypes();
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // Genome expression drives the flagella every frame: oscillatory promoters
  // swing the protein level, and the motor beat pulses even at constant levels.
  if (genomeDrivesFlagellinState) applyGenomeExpression(now / 1000, dt);
  // Genome buoyancy follows the same clock so oscillatory promoters swing the
  // vertical drift through their sine cycle.
  if (genomeDrivesBuoyancyState) applyGenomeBuoyancy(now / 1000);
  if (genomeDrivesCiliaState) applyGenomeCilia(now / 1000);
  // Genome lubricin follows the same clock, so an oscillatory promoter swings
  // how much along-wall motion the cell keeps.
  if (genomeDrivesLubricinState) applyGenomeLubricin(now / 1000);
  if (genomeDrivesPilinState) applyGenomePilin(now / 1000);
  // Genome morphology follows the same clock, so oscillatory promoters swing
  // the shape and the membrane layer through their sine cycle.
  if (genomeDrivesMorphologyState) applyGenomeMorphology(now / 1000);
  const sample = session.sample();
  const view = sceneView(sample);
  if (!booted && renderer.worldReady()) {
    if (worldReadyAt === null) worldReadyAt = now;
    if (sample || now - worldReadyAt > 1500) {
      booted = true;
      bootFinish();
    } else bootMark("session", 0.4);
  }
  const playing = !titleScreenOpen();
  if (playing) {
    stepSurfaceFades(now);
    stepControlled(dt);
    for (const sibling of siblings) stepSibling(sibling, dt);
  }
  const posed = advanceDivision(now);
  if (playing) {
    advanceSiblingDivisions(now);
    separateCells(now, posed);
  }
  const cell = controlledCell(posed);
  if (playing) applyGenomeRespiration(now / 1000, cell.x, cell.y, dt);
  if (playing) applyGenomeReproduction(now / 1000, dt);
  const title = titleScreenOpen();
  if (title) {
    if (pilusEjection.fragments.length > 0) pilusEjection = initialPilusEjection();
    if (renderer.worldReady()) stepMenuShowcase(dt, view.pixels_per_unit);
  } else if (menuSwimmers.length > 0) releaseMenuShowcase();
  if (showingTitle && !title) renderer.placeCamera(cell.x, cell.y);
  showingTitle = title;
  const camera: [number, number] = title ? titleGlance(now, view.pixels_per_unit) : [cell.x, cell.y];
  renderer.setSmoothCamera(title);
  updatePosition(cell.x, cell.y);
  const elapsed = sunElapsed(now);
  debug.follow(sunCycle(elapsed));
  const clock = formatTimeOfDay(elapsed);
  if (clock !== shownTime) {
    shownTime = clock;
    timeLabel.textContent = clock;
  }
  renderer.setSunBrightness(debug.brightness());
  const intensity = debug.brightness() * columnAttenuation(title ? camera[1] : cell.y);
  debug.showBrightness(intensity);
  const drawn = title
    ? menuSwimmers.map((swimmer) => menuSnapshot(swimmer))
    : [cell, ...siblings.map((sibling) => siblingSnapshot(sibling, now))];
  renderer.render(view, drawn, dt, debug.direction(), intensity, camera, title ? [] : pilusFragmentViews());
  refreshSpecies();
  publishInspect(cell);
  syncExpressionCell(cell);
  environmentProbe.refresh();
  if (!editMode && canvas) setCanvasCursor(hoverCursor());
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

function setKey(event: KeyboardEvent, down: boolean): void {
  if (isTypingTarget(event.target)) return;
  if (titleScreenOpen()) {
    if (!down) held.delete(event.code);
    return;
  }
  if (event.code === "KeyZ" && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
    if (down) renderer.undoPaint();
    event.preventDefault();
    return;
  }
  if (event.code === "KeyP") {
    if (down && !event.repeat) positionReadout.hidden = !positionReadout.hidden;
    event.preventDefault();
    return;
  }
  if (event.code === "KeyO") {
    if (down && !event.repeat) debug.toggle();
    event.preventDefault();
    return;
  }
  if (!isControlKey(event.code)) return;
  if (down) held.add(event.code);
  else held.delete(event.code);
  event.preventDefault();
}

function isControlKey(code: string): boolean {
  return (
    code === "KeyW" ||
    code === "KeyA" ||
    code === "KeyS" ||
    code === "KeyD" ||
    code === "KeyQ" ||
    code === "KeyE" ||
    code === "ShiftLeft" ||
    code === "ShiftRight"
  );
}

/** How far a pre-tumble nudge pushes the cell off a wall it pressed into. */
const TUMBLE_CLEARANCE_UNITS = 0.12;

/**
 * Before a beat tumble starts rotating the cell, push the body slightly off
 * any terrain it pressed into during the run, so the tumble turns in free
 * water instead of grinding against the collider. fitPose slides or halts the
 * nudge when the away direction runs into other terrain.
 */
function nudgeOffTerrain(): void {
  const length = cellLength();
  const width = cellWidth();
  const bend = cellBend();
  const toward = renderer.stickDirection(pose.x, pose.y, pose.angle, length, width, bend);
  if (!toward) return;
  const previous = { x: pose.x, y: pose.y, angle: pose.angle, length };
  const target = {
    x: pose.x - toward.x * TUMBLE_CLEARANCE_UNITS,
    y: pose.y - toward.y * TUMBLE_CLEARANCE_UNITS,
    angle: pose.angle,
    length,
  };
  const fitted = renderer.fitPose(previous, target, width, bend);
  pose.x = fitted.x;
  pose.y = fitted.y;
}

/** Fragments in flight, ready for the renderer, with their faded opacity. */
function pilusFragmentViews(): PilusFragmentSnapshot[] {
  return pilusEjection.fragments.map((fragment) => ({
    x: fragment.x,
    y: fragment.y,
    dirX: fragment.dirX,
    dirY: fragment.dirY,
    length: fragment.length,
    alpha: pilusFragmentAlpha(fragment),
  }));
}

/**
 * One emission line per membrane region, in world coordinates. Fragments leave
 * random points along a line half the cell's width long, all traveling the
 * region's outward direction. Region geometry comes from the same placements
 * that draw the membrane coat, so bend, taper, and crystal shapes all aim
 * correctly. Each pilus on the region raises the firing rate.
 */
function secretedEmitters(): PilusEmitter[] {
  const form = fillPlayerForm();
  const crystal = membraneStyle === 3;
  const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  const emitters: PilusEmitter[] = [];
  const regions: { site: PilusSite; count: number; average: number; variance: number }[] = [];
  if (genomeDrivesPilinState) {
    for (const coat of genomeSecretedPilinCoats) {
      regions.push({ site: coat.site, count: coat.count, average: coat.length, variance: PILIN_LENGTH_VARIANCE });
    }
  } else if (piliCount >= 1 && piliLength > 0.02) {
    if (pilusSite === "all") {
      // The coat splits an all-site count across the four regions; the mean
      // anchors only need the same shares.
      const base = Math.floor(piliCount / 4);
      const extra = piliCount % 4;
      for (const [index, site] of (["polar", "antipolar", "lateral", "antilateral"] as const).entries()) {
        regions.push({ site, count: base + (index < extra ? 1 : 0), average: piliLength, variance: piliVariance });
      }
    } else {
      regions.push({ site: pilusSite, count: piliCount, average: piliLength, variance: piliVariance });
    }
  }
  const cos = Math.cos(pose.angle);
  const sin = Math.sin(pose.angle);
  for (const region of regions) {
    if (region.count < 1) continue;
    const placed = piliPlacements(
      region.count,
      region.average,
      region.variance,
      region.site,
      body.length,
      body.width,
      body.bend,
      crystal,
      form.taper,
    );
    if (placed.length === 0) continue;
    let centerX = 0;
    let centerY = 0;
    let normalX = 0;
    let normalY = 0;
    let totalLength = 0;
    for (const pilus of placed) {
      centerX += pilus.x;
      centerY += pilus.y;
      normalX += pilus.dirX;
      normalY += pilus.dirY;
      totalLength += pilus.length;
    }
    const scale = 1 / placed.length;
    const norm = Math.hypot(normalX, normalY) || 1;
    const dirX = (normalX / norm) * cos - (normalY / norm) * sin;
    const dirY = (normalX / norm) * sin + (normalY / norm) * cos;
    emitters.push({
      x: pose.x + (centerX * scale) * cos - (centerY * scale) * sin,
      y: pose.y + (centerX * scale) * sin + (centerY * scale) * cos,
      dirX,
      dirY,
      // The emission line spans half the cell's width across the region.
      span: body.width * 0.25,
      length: totalLength * scale,
      variance: region.variance,
      shots: placed.length,
    });
  }
  return emitters;
}

/**
 * Whether the cell is firing secreted pilin. The genome's secreted coats
 * decide once pilin is expressed; the sandbox mode button decides until then.
 * An oscillating promoter at its trough expresses nothing, so the fire stops
 * for that moment.
 */
function secretedPiliActive(): boolean {
  return genomeDrivesPilinState ? genomeSecretedPilinCoats.length > 0 : pilusMode === "secreted";
}

/**
 * Secreted pili: each covered membrane region fires bursts of fragments from
 * a line across it, and every fragment kicks the cell back along the region's
 * outward direction — so symmetric coats, like a bipolar spray, cancel their
 * pushes and an unbalanced coat drives the cell away from the regions firing
 * hardest.
 * The newborn rest period holds the fire but lets fragments already in flight
 * finish out, and so does a trough in an oscillating promoter. Recoil lands on
 * swim momentum, so cruise drags it out like any other push.
 */
function stepSecretedPili(dt: number): void {
  const active = secretedPiliActive();
  // Fragments already in flight keep moving even while the fire is held.
  if (!active && pilusEjection.fragments.length === 0) return;
  const emitters = active && controlledMotilityRest <= 0 ? secretedEmitters() : [];
  const stepped = stepPilusEjection(pilusEjection, emitters, dt);
  pilusEjection = stepped.state;
  swim.vx += stepped.recoilX;
  swim.vy += stepped.recoilY;
}

function stepControlled(dt: number): void {
  stepSecretedPili(dt);
  if (controlledMotilityRest > 0) {
    controlledMotilityRest = Math.max(0, controlledMotilityRest - dt);
    if (wasdEnabled) steerManual(dt);
    else {
      const yaw = ((held.has("KeyQ") ? TURN_SPEED : 0) - (held.has("KeyE") ? TURN_SPEED : 0)) * dt;
      cruise(pose, swim, flagellarPulse, flagellarSwitch, fillPlayerForm(), dt, false, yaw, false);
    }
  } else {
    const wasSwimming = flagellarPulse.swimming;
    flagellarPulse = stepFlagellarPulse(flagellarPulse, pulse, dt, controlledPulseScale);
    // A genome-driven flagellum bursts per beat. Sandbox mode keeps drawing
    // the switch sense from the pulse slider's swim edges; genome mode draws
    // it from the whip edges, so every whip is a clockwise run and every rest
    // between whips is a counterclockwise tumble.
    const wasWhipping = flagellarWhipping;
    flagellarWhipping = flagellarPulse.swimming && (!genomeDrivesFlagellinState || genomeBeatWhipping);
    flagellarSwitch = genomeDrivesFlagellinState
      ? stepBeatSwitch(flagellarSwitch, ccwSwitching, wasWhipping, flagellarWhipping)
      : stepFlagellarSwitch(flagellarSwitch, ccwSwitching, wasWhipping, flagellarPulse.swimming);
    // A tumble drawn at the whip's end starts from a nudge off the wall the
    // run may have pressed the cell into, then rotates in the cleared space.
    if (genomeDrivesFlagellinState && ccwSwitching && wasWhipping && !flagellarWhipping) nudgeOffTerrain();
    steer(dt, wasSwimming);
  }
}

/** World-up drift target from the buoyin and ballastin sliders. The actual
 * drift accelerates toward this target under hydrodynamic drag. */
function buoyancyDrift(y: number, up = buoyin, down = ballastin): number {
  return buoyancyVelocity(y, up, down);
}

/** Pull into nearby terrain. Not swim momentum. Stronger as adhesin approaches 1. */
function adhesinDrift(
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  bend: number,
  level = adhesin,
): { x: number; y: number } {
  const speed = adhesinPull(level);
  if (speed <= 0) return { x: 0, y: 0 };
  const dir = renderer.stickDirection(x, y, angle, length, width, bend);
  if (!dir) return { x: 0, y: 0 };
  return { x: dir.x * speed, y: dir.y * speed };
}

function steer(dt: number, wasSwimming: boolean): void {
  if (wasdEnabled) {
    steerManual(dt);
    return;
  }
  const yaw = ((held.has("KeyQ") ? TURN_SPEED : 0) - (held.has("KeyE") ? TURN_SPEED : 0)) * dt;
    cruise(pose, swim, flagellarPulse, flagellarSwitch, fillPlayerForm(), dt, wasSwimming, yaw, true, controlledCiliaPresence);
}

function steerManual(dt: number): void {
  const previous = { x: pose.x, y: pose.y, angle: pose.angle, length: pose.length };
  const tumbling = ccwSwitching && flagellarPulse.swimming && !flagellarSwitch.clockwise;
  swim.vx = 0;
  swim.vy = 0;
  swim.omega = 0;
  const speed = MOVE_SPEED * (held.has("ShiftLeft") || held.has("ShiftRight") ? SHIFT_BOOST : 1);
  const stick = adhesinDrift(pose.x, pose.y, pose.angle, cellLength(), cellWidth(), cellBend());
  let vx = stick.x;
  let vy = buoyancyDrift(pose.y) + stick.y;
  if (held.has("KeyW")) vy += speed;
  if (held.has("KeyS")) vy -= speed;
  if (held.has("KeyA")) vx -= speed;
  if (held.has("KeyD")) vx += speed;
  pose.x += vx * dt;
  pose.y += vy * dt;
  if (held.has("KeyQ")) pose.angle += TURN_SPEED * dt;
  if (held.has("KeyE")) pose.angle -= TURN_SPEED * dt;
  if (tumbling) {
    const tumble = stepTumble(flagellarSwitch.tumbleOmega, dt);
    flagellarSwitch.tumbleOmega = tumble.omega;
    pose.angle += tumble.delta;
  }
  const width = cellWidth();
  const bend = cellBend();
  pose.length = cellLength();
  const fitted = renderer.fitPose(previous, pose, width, bend, membranePili() ? pilusProbes() : []);
  pose.x = fitted.x;
  pose.y = fitted.y;
  pose.angle = fitted.angle;
  pose.length = cellLength();
}

const driveScratch: CellDrive = {
  buoyin: 0,
  ballastin: 0,
  lubricin: 0,
  adhesin: 0,
  antipolar: 0,
  polar: 0,
  lateral: 0,
  antilateral: 0,
  ciliation: 0,
  ciliaLength: 0,
  ciliaSpeed: 0,
  ciliaSway: 0,
  ciliaOrder: 0,
  ciliaSwitch: "lateral",
  ciliaReverse: false,
  ciliaMotor: null,
  piliCount: 0,
  piliLength: 0,
  piliVariance: 0,
  pilusSite: "all",
  piliCoats: null,
  undulation: 0,
  undulationBySite: null,
  pulse: 0,
  ccw: false,
};

function playerDrive(): CellDrive {
  driveScratch.buoyin = buoyin;
  driveScratch.ballastin = ballastin;
  driveScratch.lubricin = lubricin;
  driveScratch.adhesin = adhesin;
  driveScratch.antipolar = antipolarFlagellin;
  driveScratch.polar = polarFlagellin;
  driveScratch.lateral = lateralFlagellin;
  driveScratch.antilateral = antilateralFlagellin;
  driveScratch.ciliation = ciliation;
  driveScratch.ciliaLength = ciliaLength;
  driveScratch.ciliaSpeed = ciliaSpeed;
  driveScratch.ciliaSway = ciliaSway;
  driveScratch.ciliaOrder = ciliaOrder;
  driveScratch.ciliaSwitch = ciliaSwitch;
  driveScratch.ciliaReverse = ciliaReverse;
  driveScratch.ciliaMotor = genomeDrivesCiliaState ? genomeCiliaMotor : null;
  driveScratch.piliCount = membranePili() ? piliCount : 0;
  driveScratch.piliLength = piliLength;
  driveScratch.piliVariance = genomeDrivesPilinState ? PILIN_LENGTH_VARIANCE : piliVariance;
  driveScratch.pilusSite = pilusSite;
  driveScratch.piliCoats = membranePili() && genomeDrivesPilinState ? genomePilinCoats : null;
  driveScratch.undulation = undulation;
  driveScratch.undulationBySite = undulationBySite;
  driveScratch.pulse = pulse;
  driveScratch.ccw = ccwSwitching;
  return driveScratch;
}

/** Same swim, tumble, recoil, and terrain collision the controlled cell uses. */
function cruise(
  bodyPose: BodyPose,
  motion: SwimState,
  pulseState: FlagellarPulseState,
  flagellar: FlagellarSwitchState,
  form: CellForm,
  dt: number,
  wasSwimming: boolean,
  extraYaw: number,
  thrust = true,
  ciliaAmount = 1,
  crystal = membraneStyle === 3,
  drive: CellDrive = playerDrive(),
  collide = true,
): void {
  const previous = { x: bodyPose.x, y: bodyPose.y, angle: bodyPose.angle, length: bodyPose.length };
  const swimming = thrust && pulseState.swimming;
  const tumbling = swimming && drive.ccw && !flagellar.clockwise;
  const body = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  const flagellarSum = drive.antipolar + drive.polar + drive.lateral + drive.antilateral;
  const next = stepSwim(
    motion,
    {
      length: body.length,
      width: body.width,
      bend: body.bend,
      angle: bodyPose.angle,
      antipolar: drive.antipolar,
      polar: drive.polar,
      lateral: drive.lateral,
      antilateral: drive.antilateral,
      undulation: swimming && flagellar.clockwise ? drive.undulation : 0,
      undulationBySite: drive.undulationBySite && swimming && flagellar.clockwise ? drive.undulationBySite : undefined,
      motors: swimming && drive.undulation > 0.02 && flagellarSum > 0.02,
      ciliation: thrust ? drive.ciliation : 0,
      ciliaLength: drive.ciliaLength * ciliaAmount,
      ciliaSpeed: drive.ciliaSpeed,
      ciliaSway: drive.ciliaSway,
      ciliaOrder: drive.ciliaOrder,
      ciliaSwitch: drive.ciliaSwitch,
      ciliaReverse: drive.ciliaReverse,
      ciliaMotor: drive.ciliaMotor ?? undefined,
    },
    dt,
  );
  motion.vx = next.vx;
  motion.vy = next.vy;
  motion.driveX = next.driveX;
  motion.driveY = next.driveY;
  // The scripted tumble owns the spin. A coasting kick here can oppose it.
  motion.omega = tumbling ? 0 : next.omega;
  motion.thrusting = next.thrusting;
  if (thrust && wasSwimming && !pulseState.swimming && next.driveX * next.driveX + next.driveY * next.driveY > 0.25) {
    if (next.thrusting) {
      // Cilia are still pushing. The flagellar release kicks back along the flagellar push and leaves the ciliary run in place.
      motion.vx -= next.driveX * RELEASE_RECOIL;
      motion.vy -= next.driveY * RELEASE_RECOIL;
    } else {
      const along = motion.vx * next.driveX + motion.vy * next.driveY;
      motion.vx -= next.driveX * (along + RELEASE_RECOIL);
      motion.vy -= next.driveY * (along + RELEASE_RECOIL);
    }
  }
  const buoyancyTarget = buoyancyDrift(bodyPose.y, drive.buoyin, drive.ballastin);
  buoyancyDriftVelocity = stepBuoyancyVelocity(buoyancyDriftVelocity, buoyancyTarget, dt);
  const driftY = buoyancyDriftVelocity;
  const stick = collide
    ? adhesinDrift(bodyPose.x, bodyPose.y, bodyPose.angle, body.length, body.width, body.bend, drive.adhesin)
    : { x: 0, y: 0 };
  const travelX = motion.vx + stick.x;
  const travelY = motion.vy + driftY + stick.y;
  bodyPose.x += travelX * dt;
  bodyPose.y += travelY * dt;
  bodyPose.angle += motion.omega * dt + extraYaw;
  if (tumbling) {
    const tumble = stepTumble(flagellar.tumbleOmega, dt);
    flagellar.tumbleOmega = tumble.omega;
    bodyPose.angle += tumble.delta;
  }
  bodyPose.length = body.length;
  if (!collide) return;
  const probes = pilusProbes(form, crystal, drive.piliCount, drive.piliLength, drive.piliVariance, drive.pilusSite, drive.piliCoats);
  const restoreSlide = terrainSlideKeep(lubricin);
  renderer.setTerrainSlide(terrainSlideKeep(drive.lubricin));
  try {
    let fitted = renderer.fitPose(previous, bodyPose, body.width, body.bend, probes);
    if (dt > 1e-5) {
      const movedX = fitted.x - previous.x;
      const movedY = fitted.y - previous.y;
      const accepted = acceptedVelocity(travelX, travelY, movedX, movedY, dt);
      const kept = retainSwimVelocity(motion.vx, motion.vy, stick.x, driftY + stick.y, accepted.x, accepted.y);
      motion.vx = kept.vx;
      motion.vy = kept.vy;
      const hit = renderer.bodyContact(fitted.x, fitted.y, fitted.angle, bodyPose.length, body.width, body.bend, probes);
      if (hit) {
        const yaw = collisionSpin(
          travelX,
          travelY,
          accepted.x,
          accepted.y,
          hit.x - fitted.x,
          hit.y - fitted.y,
          bodyPose.length,
          body.width,
        );
        motion.omega += yaw;
        fitted = renderer.fitPose(
          fitted,
          { x: fitted.x, y: fitted.y, angle: fitted.angle + yaw * dt, length: bodyPose.length },
          body.width,
          body.bend,
          probes,
        );
      }
    }
    bodyPose.x = fitted.x;
    bodyPose.y = fitted.y;
    bodyPose.angle = fitted.angle;
    bodyPose.length = body.length;
  } finally {
    renderer.setTerrainSlide(restoreSlide);
  }
}

function stepSibling(cell: SimulatedCell, dt: number): void {
  if (cell.motilityRest > 0) {
    cell.motilityRest = Math.max(0, cell.motilityRest - dt);
    cruise(cell.pose, cell.swim, cell.pulse, cell.flagellar, cell.form, dt, false, 0, false, 1, cell.membrane.style === 3);
  } else {
    const wasSwimming = cell.pulse.swimming;
    cell.pulse = stepFlagellarPulse(cell.pulse, pulse, dt, cell.pulseScale);
    cell.flagellar = stepFlagellarSwitch(cell.flagellar, ccwSwitching, wasSwimming, cell.pulse.swimming);
    cruise(cell.pose, cell.swim, cell.pulse, cell.flagellar, cell.form, dt, wasSwimming, 0, true, cell.ciliaPresence, cell.membrane.style === 3);
  }
}

function siblingSnapshot(cell: SimulatedCell, now: number): CellSnapshot {
  const body = cellDimensions(cell.form.scale, cell.form.elongation, cell.form.girth, cell.form.crescent);
  const splitting = cell.division ? divisionVisual(cell.division, cell.form, now) : emptyDivision();
  return {
    id: cell.id,
    x: cell.pose.x,
    y: cell.pose.y,
    angle: cell.pose.angle,
    vx: cell.swim.vx,
    vy: cell.swim.vy + buoyancyDrift(cell.pose.y),
    omega: cell.swim.omega,
    length: body.length,
    width: body.width,
    bend: body.bend,
    furrow: splitting.furrow,
    furrowAxis: splitting.furrowAxis,
    morph: splitting.morph,
    divisionShift: splitting.divisionShift,
    divisionPlace: splitting.divisionPlace,
    palette: 0,
    seed: cell.seed,
    capsule: 0,
    motor: cell.motilityRest > 0 ? "idle" : motorOf(cell.pulse, cell.flagellar),
    activity: cell.motilityRest > 0 || !cell.pulse.swimming ? 0 : undulation,
    activityBySite: cell.motilityRest > 0 || !cell.pulse.swimming || !undulationBySite ? undefined : undulationBySite,
    ciliaSpeed: cell.motilityRest > 0 ? 0 : ciliaSpeed,
    ciliaSway: ciliaSway * cell.ciliaPresence,
    ciliaCover: cell.ciliaPresence,
    ciliaStill: ciliaCoatStill(),
    ciliaOrder: ciliaCoatOrder() ? 0 : ciliaOrder,
    ciliaSwitch,
    ciliaReverse,
    flagella: flagellaFor(cell.id, cell.form),
    cilia: ciliaFor(cell.form, cell.membrane.style === 3),
    pili: membranePili() ? piliFor(cell.form, cell.membrane.style === 3) : [],
    piliCover: cell.piliPresence,
    membranePx: cell.membrane.px,
    membraneStyle: cell.membrane.style,
    membraneColor: cell.membrane.color,
    pigment: pigmentTint(cell.pigment),
    glow: fluorEmission(cell.fluor),
    taper: cell.form.taper,
  };
}

let positionText = "";
let canvasCursor = "";
const inspectTargets: ReturnType<typeof playerCellTarget>[] = [];

function setCanvasCursor(next: string): void {
  if (!canvas || next === canvasCursor) return;
  canvasCursor = next;
  canvas.style.cursor = next;
}

function hoverCursor(): string {
  if (editMode) return "crosshair";
  if (inspect.hovering()) return "pointer";
  if (environmentOn) return "crosshair";
  return "";
}

function publishInspect(cell: CellSnapshot): void {
  const features = renderer.inspectFeatures();
  const count = features.length + 1;
  if (inspectTargets.length !== count) inspectTargets.length = count;
  inspectTargets[0] = playerCellTarget(cell);
  for (let index = 0; index < features.length; index += 1) inspectTargets[index + 1] = features[index];
  inspect.update(inspectTargets);
}

function updatePosition(x: number, y: number): void {
  if (positionReadout.hidden) return;
  const text = `X ${formatCoord(x)}  Y ${formatCoord(y)}; ${texelIdAt(x, y) ?? "—"}; ${renderer.zoomLevel().toFixed(2)}×`;
  if (text === positionText) return;
  positionText = text;
  positionReadout.textContent = text;
}

function formatCoord(value: number): string {
  const text = Math.abs(value).toFixed(2);
  return `${value < 0 ? "-" : "+"}${text}`;
}

type DivisionVisual = {
  furrow: number;
  furrowAxis: number;
  morph: number;
  divisionShift: number;
  divisionPlace: number;
};

function currentMembrane(): MembraneLook {
  const color = membraneColor();
  return { px: appliedMembranePx(), style: membraneStyle, color: [color[0], color[1], color[2]] };
}

function emptyDivision(): DivisionVisual {
  return { furrow: 0, furrowAxis: 0, morph: 0, divisionShift: 0, divisionPlace: 0 };
}

function divisionVisual(snap: DivisionState, form: CellForm, now: number): DivisionVisual {
  const parent = cellDimensions(snap.scale, form.elongation, form.girth, form.crescent);
  return {
    furrow: smoothstep(0, 0.7, clamp((now - snap.startedAt) / (DIVISION_SECONDS * 1000), 0, 1)),
    furrowAxis: snap.furrowAxis,
    morph: easeOutBack(clamp(((now - snap.startedAt) / (DIVISION_SECONDS * 1000) - 0.66) / (0.84 - 0.66), 0, 1)),
    divisionShift: daughterOffset(parent.length, parent.width, parent.bend, snap.placeOffset),
    divisionPlace: snap.placeOffset,
  };
}

function spawnDaughter(
  origin: BodyPose,
  form: CellForm,
  membrane: MembraneLook,
  snap: DivisionState,
  parentPigment: PigmentLevels,
  parentFluor: FluorLevels,
): { kept: BodyPose; form: CellForm } {
  const scale = clamp(snap.scale * 0.5, SIZE_MIN, SIZE_MAX);
  const born = { ...form, scale };
  const daughter = cellDimensions(born.scale, born.elongation, born.girth, born.crescent);
  const parent = cellDimensions(snap.scale, form.elongation, form.girth, form.crescent);
  const shift = daughterOffset(parent.length, parent.width, parent.bend, snap.placeOffset);
  const world = origin.angle + snap.placeOffset;
  const dx = Math.cos(world);
  const dy = Math.sin(world);
  const poseAt = (x: number, y: number): BodyPose => ({ x, y, angle: origin.angle, length: daughter.length });
  const probes = pilusProbes(born, membrane.style === 3);
  const kept = renderer.fitPose(
    poseAt(origin.x, origin.y),
    poseAt(origin.x + dx * shift, origin.y + dy * shift),
    daughter.width,
    daughter.bend,
    probes,
  );
  const other = renderer.fitPose(
    poseAt(origin.x, origin.y),
    poseAt(origin.x - dx * shift, origin.y - dy * shift),
    daughter.width,
    daughter.bend,
    probes,
  );
  const id = nextCellId;
  nextCellId += 1;
  lineage.push(id);
  const pulseScale = randomPulseScale();
  const bornPulse = independentPulseState(pulse, pulseScale);
  const now = performance.now();
  const grown = regrowCilia(now);
  const grownPili = regrowPili(now);
  siblings.push({
    id,
    seed: id,
    form: { ...born },
    membrane: { px: membrane.px, style: membrane.style, color: [membrane.color[0], membrane.color[1], membrane.color[2]] },
    pigment: copyPigment(parentPigment),
    fluor: copyFluor(parentFluor),
    pose: { x: other.x, y: other.y, angle: other.angle, length: daughter.length },
    swim: { vx: 0, vy: 0, omega: 0, thrusting: false, driveX: 0, driveY: 0 },
    pulse: bornPulse,
    pulseScale,
    flagellar: independentSwitchState(pulse, bornPulse.swimming),
    motilityRest: MOTILITY_REST_SECONDS,
    ciliaPresence: grown.presence,
    ciliaFade: grown.fade,
    piliPresence: grownPili.presence,
    piliFade: grownPili.fade,
    division: null,
  });
  return { kept, form: { ...born } };
}

const finishDivision = (): void => {
  const snap = division;
  if (!snap) return;
  division = null;
  const placed = spawnDaughter(pose, playerForm(), currentMembrane(), snap, pigment, fluor);
  pose.x = placed.kept.x;
  pose.y = placed.kept.y;
  pose.angle = placed.kept.angle;
  pose.length = placed.kept.length;
  cellScale = placed.form.scale;
  renderer.setCellScale(cellScale);
  sizeSlider.value = String(cellScale);
  sizeReadout.textContent = `${cellScale.toFixed(2)}×`;
  const now = performance.now();
  const grown = regrowCilia(now);
  const grownPili = regrowPili(now);
  controlledCiliaPresence = grown.presence;
  controlledCiliaFade = grown.fade;
  controlledPiliPresence = grownPili.presence;
  controlledPiliFade = grownPili.fade;
  setShapeEnabled(true);
  refreshDivideControls();
  playCue("level");
};

function finishSiblingDivision(cell: SimulatedCell): void {
  const snap = cell.division;
  if (!snap) return;
  cell.division = null;
  const placed = spawnDaughter(cell.pose, cell.form, cell.membrane, snap, cell.pigment, cell.fluor);
  cell.pose.x = placed.kept.x;
  cell.pose.y = placed.kept.y;
  cell.pose.angle = placed.kept.angle;
  cell.pose.length = placed.kept.length;
  cell.form = placed.form;
  const now = performance.now();
  const grown = regrowCilia(now);
  const grownPili = regrowPili(now);
  cell.ciliaPresence = grown.presence;
  cell.ciliaFade = grown.fade;
  cell.piliPresence = grownPili.presence;
  cell.piliFade = grownPili.fade;
  playCue("level");
}

function advanceSiblingDivisions(now: number): void {
  const dividing = siblings.filter((cell) => cell.division !== null);
  let finished = false;
  for (const cell of dividing) {
    const snap = cell.division;
    if (!snap || (now - snap.startedAt) / (DIVISION_SECONDS * 1000) < 1) continue;
    finishSiblingDivision(cell);
    finished = true;
  }
  if (finished && !division) refreshDivideControls();
}

const advanceDivision = (now: number): DivisionVisual => {
  if (!division) return emptyDivision();
  if (now < division.startedAt) return emptyDivision();
  const t = clamp((now - division.startedAt) / (DIVISION_SECONDS * 1000), 0, 1);
  if (t >= 1) {
    finishDivision();
    return emptyDivision();
  }
  divideNote.textContent = `Dividing ${Math.round(t * 100)}%`;
  return divisionVisual(division, playerForm(), now);
};

type SolidCell = {
  pose: BodyPose;
  swim: SwimState;
  keyboard: boolean;
  width: number;
  bend: number;
  body: BodyShape;
};

function solidCell(
  bodyPose: BodyPose,
  motion: SwimState,
  keyboard: boolean,
  form: CellForm,
  visual: DivisionVisual,
  crystal: boolean,
  pili?: PilusSnapshot[],
): SolidCell {
  const dims = cellDimensions(form.scale, form.elongation, form.girth, form.crescent);
  return {
    pose: bodyPose,
    swim: motion,
    keyboard,
    width: dims.width,
    bend: dims.bend,
    body: {
      length: dims.length,
      width: dims.width,
      bend: dims.bend,
      furrow: visual.furrow,
      furrowAxis: visual.furrowAxis,
      morph: visual.morph,
      divisionShift: visual.divisionShift,
      divisionPlace: visual.divisionPlace,
      capsule: 0,
      crystal,
      pili: pili ?? piliFor(form, crystal),
      taper: form.taper,
    },
  };
}

function posedCell(solid: SolidCell): PosedBody {
  return { x: solid.pose.x, y: solid.pose.y, angle: solid.pose.angle, body: solid.body };
}

function pushApart(a: SolidCell, b: SolidCell): boolean {
  const hit = cellSeparation(posedCell(a), posedCell(b));
  if (!hit || hit.depth < 1e-4) return false;
  const massA = Math.max(capsuleArea(a.body.length, a.body.width), 1e-4);
  const massB = Math.max(capsuleArea(b.body.length, b.body.width), 1e-4);
  const shareA = massB / (massA + massB);
  const shareB = massA / (massA + massB);
  a.pose.x += hit.nx * hit.depth * shareA;
  a.pose.y += hit.ny * hit.depth * shareA;
  b.pose.x -= hit.nx * hit.depth * shareB;
  b.pose.y -= hit.ny * hit.depth * shareB;
  const rel = (a.swim.vx - b.swim.vx) * hit.nx + (a.swim.vy - b.swim.vy) * hit.ny;
  if (rel < 0) {
    const corr = -rel;
    const velA = a.keyboard ? 0 : b.keyboard ? 1 : shareA;
    const velB = b.keyboard ? 0 : a.keyboard ? 1 : shareB;
    if (velA > 0) {
      const vx = a.swim.vx;
      const vy = a.swim.vy;
      a.swim.vx += hit.nx * corr * velA;
      a.swim.vy += hit.ny * corr * velA;
      a.swim.omega += collisionSpin(vx, vy, a.swim.vx, a.swim.vy, hit.px - a.pose.x, hit.py - a.pose.y, a.body.length, a.body.width);
    }
    if (velB > 0) {
      const vx = b.swim.vx;
      const vy = b.swim.vy;
      b.swim.vx -= hit.nx * corr * velB;
      b.swim.vy -= hit.ny * corr * velB;
      b.swim.omega += collisionSpin(vx, vy, b.swim.vx, b.swim.vy, hit.px - b.pose.x, hit.py - b.pose.y, b.body.length, b.body.width);
    }
  }
  return true;
}

function separatePass(solids: SolidCell[]): boolean {
  const count = solids.length;
  if (count < 2) return false;
  if (count <= 16) {
    let moved = false;
    for (let i = 0; i < count; i += 1) {
      for (let j = i + 1; j < count; j += 1) {
        if (pushApart(solids[i], solids[j])) moved = true;
      }
    }
    return moved;
  }
  let maxReach = 0.25;
  for (const solid of solids) {
    let pilusReach = 0;
    for (const pilus of solid.body.pili ?? []) pilusReach = Math.max(pilusReach, pilus.length);
    const reach = Math.hypot(solid.pose.length * 0.5, solid.width * 0.5) + Math.abs(solid.body.divisionShift) + solid.body.capsule + pilusReach;
    if (reach > maxReach) maxReach = reach;
  }
  const binSize = Math.max(0.5, maxReach * 2);
  const bins = new Map<number, number[]>();
  const column = new Int16Array(count);
  const row = new Int16Array(count);
  for (let i = 0; i < count; i += 1) {
    const ix = Math.floor(solids[i].pose.x / binSize);
    const iy = Math.floor(solids[i].pose.y / binSize);
    column[i] = ix;
    row[i] = iy;
    const key = (ix + 4096) * 8192 + (iy + 4096);
    const bin = bins.get(key);
    if (bin) bin.push(i);
    else bins.set(key, [i]);
  }
  let moved = false;
  for (let i = 0; i < count; i += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const key = (column[i] + dx + 4096) * 8192 + (row[i] + dy + 4096);
        const bin = bins.get(key);
        if (!bin) continue;
        for (const j of bin) {
          if (j <= i) continue;
          if (pushApart(solids[i], solids[j])) moved = true;
        }
      }
    }
  }
  return moved;
}

function separateCells(now: number, playerVisual: DivisionVisual): void {
  const solids = [
    solidCell(pose, swim, wasdEnabled, playerForm(), playerVisual, membraneStyle === 3),
    ...siblings.map((cell) =>
      solidCell(
        cell.pose,
        cell.swim,
        false,
        cell.form,
        cell.division ? divisionVisual(cell.division, cell.form, now) : emptyDivision(),
        cell.membrane.style === 3,
      ),
    ),
  ];
  const before = solids.map((solid) => ({ x: solid.pose.x, y: solid.pose.y, angle: solid.pose.angle, length: solid.pose.length }));
  for (let pass = 0; pass < 4; pass += 1) {
    if (!separatePass(solids)) break;
  }
  for (let i = 0; i < solids.length; i += 1) {
    const fitted = renderer.fitPose(before[i], solids[i].pose, solids[i].width, solids[i].bend, pilusVolumeSamples(solids[i].body.pili ?? []));
    solids[i].pose.x = fitted.x;
    solids[i].pose.y = fitted.y;
    solids[i].pose.angle = fitted.angle;
    solids[i].pose.length = fitted.length;
  }
}

function motorOf(
  pulseState: FlagellarPulseState,
  flagellar: FlagellarSwitchState,
  activity = undulation,
  switching = ccwSwitching,
): "idle" | "run" | "tumble" {
  if (!pulseState.swimming || activity <= 0.01) return "idle";
  if (switching && !flagellar.clockwise) return "tumble";
  return "run";
}

function flagellarMotor(): "idle" | "run" | "tumble" {
  return motorOf(flagellarPulse, flagellarSwitch);
}

/** Flail animation strength for the genome's between-whip tumble, where undulation rests at zero. */
const TUMBLE_FLAIL_ACTIVITY = 0.35;

function controlledCell(
  divisionPose: {
    furrow: number;
    furrowAxis: number;
    morph: number;
    divisionShift: number;
    divisionPlace: number;
  } = { furrow: 0, furrowAxis: 0, morph: 0, divisionShift: 0, divisionPlace: 0 },
): CellSnapshot {
  // The genome's tumble lives in the rest between whips, where undulation is
  // zero; report it anyway so the flagella flail while the cell rotates.
  const genomeTumbling =
    genomeDrivesFlagellinState && ccwSwitching && flagellarPulse.swimming && !flagellarSwitch.clockwise;
  return {
    id: controlledId,
    x: pose.x,
    y: pose.y,
    angle: pose.angle,
    vx: wasdEnabled ? 0 : swim.vx,
    vy: wasdEnabled ? 0 : swim.vy + buoyancyDrift(pose.y),
    omega: wasdEnabled ? 0 : swim.omega,
    length: pose.length,
    width: cellWidth(),
    bend: cellBend(),
    furrow: divisionPose.furrow,
    furrowAxis: divisionPose.furrowAxis,
    morph: divisionPose.morph,
    divisionShift: divisionPose.divisionShift,
    divisionPlace: divisionPose.divisionPlace,
    palette: 0,
    seed: controlledSeed,
    capsule: 0,
    // A clockwise burst whips. A counterclockwise burst flails instead.
    // Off the pulse, or at undulation 0, the tail trails as a loose chain.
    motor: controlledMotilityRest > 0 ? "idle" : genomeTumbling ? "tumble" : flagellarMotor(),
    activity: controlledMotilityRest > 0 || !flagellarPulse.swimming ? 0 : genomeTumbling ? TUMBLE_FLAIL_ACTIVITY : undulation,
    activityBySite:
      controlledMotilityRest > 0 || !flagellarPulse.swimming || !undulationBySite || genomeTumbling
        ? undefined
        : undulationBySite,
    ciliaSpeed: controlledMotilityRest > 0 ? 0 : ciliaSpeed,
    ciliaSway: ciliaSway * controlledCiliaPresence,
    ciliaCover: controlledCiliaPresence,
    ciliaStill: ciliaCoatStill(),
    ciliaOrder: ciliaCoatOrder() ? 0 : ciliaOrder,
    ciliaSwitch,
    ciliaReverse,
    flagella: flagellaFor(controlledId),
    cilia: ciliaFor(),
    pili: membranePili() ? piliFor() : [],
    piliCover: controlledPiliPresence,
    taper: currentTaper(),
    pigment: pigmentTint(pigment),
    glow: fluorEmission(fluor),
  };
}

function colorHex(color: [number, number, number]): string {
  const byte = (channel: number) => Math.round(clamp(channel, 0, 1) * 255).toString(16).padStart(2, "0");
  return `#${byte(color[0])}${byte(color[1])}${byte(color[2])}`;
}

function cellLabel(id: number): string {
  return `Cell ${String(id).padStart(3, "0")}`;
}

let speciesKey = "";
function refreshSpecies(): void {
  const count = lineage.length;
  const place = Math.max(0, lineage.indexOf(controlledId)) + 1;
  const label = cellLabel(controlledId);
  const key = `${controlledId}:${count}:${place}`;
  if (key === speciesKey) return;
  speciesKey = key;
  speciesCount!.textContent = label;
  speciesCount!.title = count === 1 ? label : `${label}, individual ${place} of ${count}`;
  speciesPlate!.setAttribute(
    "aria-label",
    count === 1 ? `${ownedSpecies}, ${label}` : `${ownedSpecies}, ${label}, ${count} cells in your species`,
  );
  speciesPrev!.disabled = count < 2;
  speciesNext!.disabled = count < 2;
  setPopulation(count);
}

function presentControlledCell(): void {
  elongationSlider!.value = String(elongation);
  elongationReadout!.textContent = elongation.toFixed(2);
  girthSlider!.value = String(girth);
  girthReadout!.textContent = girth.toFixed(2);
  crescentSlider!.value = String(crescent);
  crescentReadout!.textContent = crescent.toFixed(2);
  syncTaperButtons();
  syncTaperDegrees();
  sizeSlider!.value = String(cellScale);
  sizeReadout!.textContent = `${cellScale.toFixed(2)}×`;
  pose.length = cellLength();
  renderer.setCellScale(cellScale);
  for (const [id, button] of membraneButtons) {
    const on = id === membraneStyle;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  applyMembrane(false);
  syncPigmentControls();
  setShapeEnabled(division === null);
  refreshDivideControls();
  refreshSpecies();
}

function captureControlled(): SimulatedCell {
  return {
    id: controlledId,
    seed: controlledSeed,
    form: { ...playerForm() },
    membrane: currentMembrane(),
    pigment: copyPigment(pigment),
    fluor: copyFluor(fluor),
    pose: { x: pose.x, y: pose.y, angle: pose.angle, length: pose.length },
    swim: { ...swim },
    pulse: { ...flagellarPulse },
    pulseScale: controlledPulseScale,
    flagellar: { ...flagellarSwitch },
    motilityRest: controlledMotilityRest,
    ciliaPresence: controlledCiliaPresence,
    ciliaFade: controlledCiliaFade ? { ...controlledCiliaFade } : null,
    piliPresence: controlledPiliPresence,
    piliFade: controlledPiliFade ? { ...controlledPiliFade } : null,
    division: division ? { ...division } : null,
  };
}

function installControlled(cell: SimulatedCell): void {
  controlledId = cell.id;
  controlledSeed = cell.seed;
  controlledPulseScale = cell.pulseScale;
  controlledMotilityRest = cell.motilityRest;
  controlledCiliaPresence = cell.ciliaPresence;
  controlledCiliaFade = cell.ciliaFade ? { ...cell.ciliaFade } : null;
  controlledPiliPresence = cell.piliPresence;
  controlledPiliFade = cell.piliFade ? { ...cell.piliFade } : null;
  pose.x = cell.pose.x;
  pose.y = cell.pose.y;
  pose.angle = cell.pose.angle;
  pose.length = cell.pose.length;
  swim.vx = cell.swim.vx;
  swim.vy = cell.swim.vy;
  swim.omega = cell.swim.omega;
  swim.thrusting = cell.swim.thrusting;
  swim.driveX = cell.swim.driveX;
  swim.driveY = cell.swim.driveY;
  flagellarPulse = { ...cell.pulse };
  flagellarSwitch = { ...cell.flagellar };
  division = cell.division ? { ...cell.division } : null;
  cellScale = cell.form.scale;
  elongation = cell.form.elongation;
  girth = cell.form.girth;
  crescent = cell.form.crescent;
  taperMask = cell.form.taper.mask;
  taperPolarDegree = cell.form.taper.polar;
  taperAntipolarDegree = cell.form.taper.antipolar;
  taperLateralDegree = cell.form.taper.lateral;
  taperAntilateralDegree = cell.form.taper.antilateral;
  membranePx = cell.membrane.style === 0 ? MEMBRANE_PX_DEFAULT : cell.membrane.px;
  membraneStyle = cell.membrane.style;
  membraneColorInput!.value = colorHex(cell.membrane.color);
  pigment = copyPigment(cell.pigment);
  fluor = copyFluor(cell.fluor);
  presentControlledCell();
}

function focusSpecies(step: number): void {
  if (lineage.length < 2) return;
  const index = lineage.indexOf(controlledId);
  const safe = index < 0 ? 0 : index;
  const nextId = lineage[(safe + step + lineage.length) % lineage.length];
  if (nextId === undefined || nextId === controlledId) return;
  const slot = siblings.findIndex((cell) => cell.id === nextId);
  if (slot < 0) return;
  const incoming = siblings[slot];
  if (!incoming) return;
  siblings[slot] = captureControlled();
  installControlled(incoming);
}

function ciliaOrderLabel(value: number): string {
  if (value <= 0.005) return "Random";
  if (value >= 0.995) return "Ordered";
  return value.toFixed(2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
