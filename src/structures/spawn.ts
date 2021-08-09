import type { TGameCtx, TRoomCtx } from "@managers/gameManager";
import { uniqueId } from "lodash";
type TGetCtx = () => TGameCtx;

// typedefs
type TSetUnitMem = (key: string, value: unknown) => void;

type TSetUnitMemFactory = (unitName: string) => TSetUnitMem;

type TUnitMemFactory = (room: TRoomCtx) => TSetUnitMemFactory;

// unit types
const UNIT_WORKER = "worker";
const UNIT_RANGED = "ranged";
const UNIT_PHYSICAL = "physical";

// body parts
const BODY_PARTS: Record<string, BodyPartConstant[]> = {
  [UNIT_WORKER]: ["work", "move", "carry"],
  [UNIT_RANGED]: ["ranged_attack", "move", "tough"],
  [UNIT_PHYSICAL]: ["attack", "move", "tough"],
};

// thresholds
const RANGED_UNIT_THRESHOLD = 0.66;

// energy transfer priority ratios
// spawn to controller ratio
const ENERGY_TRANSFER_RATIOS = [
  [1, 2],
  [1, 2],
  [1, 2],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
  [1, 1],
] as [number, number][];

function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function isANumber(n: number): boolean {
  return !isNaN(n);
}
type TGetNextUnitParams = {
  spawnRatio: number[];
  ranged: number;
  physical: number;
  workers: number;
  total: number;
};

// should we spawn a work unit or a combat unit
function getNextUnitType({
  spawnRatio,
  ranged,
  physical,
  workers,
  total,
}: TGetNextUnitParams) {
  const workerCut = spawnRatio[0] / sum(...spawnRatio);
  const totalCombat = sum(ranged, physical);
  const actualWorkerPct = workers / total;
  const actualRangedPct = ranged / totalCombat;

  if ([actualWorkerPct, actualRangedPct].every(isANumber)) {
    const unitToSpawn =
      actualWorkerPct < workerCut
        ? UNIT_WORKER
        : actualRangedPct < RANGED_UNIT_THRESHOLD
        ? UNIT_RANGED
        : UNIT_PHYSICAL;
    return unitToSpawn;
  }
  return UNIT_WORKER;
}

type TGetAssignmentParams = {
  controllerLevel: number;
  controller: number;
  spawn: number;
  unitToSpawn: string;
};
function getTransferTarget({
  controller,
  spawn,
  unitToSpawn,
  controllerLevel,
}: TGetAssignmentParams) {
  const totalUnits = controller + spawn;
  const spawnPct = spawn / totalUnits;
  const isWorker = unitToSpawn === UNIT_WORKER;
  if (isANumber(spawnPct) && isWorker) {
    const currentRatio = ENERGY_TRANSFER_RATIOS[controllerLevel];
    const spawnThreshold =
      currentRatio[0] / sum(...ENERGY_TRANSFER_RATIOS[controllerLevel]);
    return spawnPct < spawnThreshold ? "spawn" : "controller";
  }

  if (isWorker) {
    return "controller";
  }
}

function getInitialCtx(roomCtx: TRoomCtx) {
  const {
    controllerLevel,
    units: {
      total,
      workers,
      combat: { ranged, physical },
    },
    spawnRatio,
    transferTargets: { controller, spawn },
  } = roomCtx;

  const unitToSpawn = getNextUnitType({
    spawnRatio,
    ranged,
    physical,
    workers,
    total,
  });
  const transferTarget = getTransferTarget({
    controller,
    spawn,
    unitToSpawn,
    controllerLevel,
  });
  return { unitToSpawn, transferTarget };
}

function runSpawnMachine(
  roomCtx: TRoomCtx,
  spawnStructures: StructureSpawn[],
  setUnitMemFactory: TSetUnitMemFactory
) {
  const { unitToSpawn, transferTarget } = getInitialCtx(roomCtx);
  const unitBody = BODY_PARTS[unitToSpawn];
  const unitName = `${unitToSpawn}_${transferTarget}_${uniqueId()}`;
  const setUnitMem = setUnitMemFactory(unitName);

  spawnStructures.forEach((spawn) => {
    spawn.spawnCreep(unitBody, unitName);
    setUnitMem('transferTarget', transferTarget);
    setUnitMem('state', 'idle');
  });
}

export default function runSpawnStructures(
  game: Game,
  getCtx: TGetCtx,
  unitMemFactory: TUnitMemFactory
) {
  const gameCtx = getCtx();
  Object.entries(game.rooms).forEach(([id, roomObj]) => {
    const spawns = roomObj.find(112);
    const roomCtx = gameCtx.rooms.find(({ id: roomId }) => roomId === id);

    if (roomCtx) {
      const setUnitMemFactory = unitMemFactory(roomCtx);
      runSpawnMachine(roomCtx, spawns, setUnitMemFactory);
    }
  });
}
