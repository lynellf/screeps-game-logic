import { TCreep } from "@utils/typedefs";
import type { TGameCtx, TRoomCtx } from "@managers/gameManager";
import { createMachine, EventObject as TEvent, interpret } from "xstate";

// utils
function getFreeEnergyCount(unit: TCreep) {
  return unit.store.getFreeCapacity();
}

function moveToLocation(unit: TCreep, { x, y }: Record<string, number>) {
  unit.moveTo(x, y, {
    visualizePathStyle: { stroke: "#ffaa00" },
  });
}

//typedefs
type TGetCtx = () => TGameCtx;
type TCtx = {
  roomCtx: TRoomCtx;
  unit: TCreep;
};
type TSetUnitMem = (key: string, value: unknown) => void;
type TSetUnitMemFactory = (unitName: string) => TSetUnitMem;
type TUnitMemFactory = (room: TRoomCtx) => TSetUnitMemFactory;

// states
const STATE_IDLE = "idle";
const STATE_HARVESTING = "harvesting";
const STATE_TRANSFERRING = "transferring";
const STATE_UPGRADING = "upgrading";

// action names
// const ACTION_HARVEST = "actionHarvest";
// const ACTION_UPGRADE_CONTROLLER = "actionUpgradeController";
// const ACTION_TRANSFER_TO_SPAWN = "actionTransferToSpawn";

// guard names
const GUARD_SHOULD_TRANSFER_TO_SPAWN = "guardShouldTransferToSpawn";
const GUARD_SHOULD_UPGRADE_CONTROLLER = "guardShouldUpgradeController";
const GUARD_SHOULD_CONTINUE_HARVESTING = "guardShouldContinueHarvesting";
const GUARD_IS_EMPTY = "guardIsEmpty";

// guards
function guardShouldTransferToSpawn({ unit }: TCtx, _: TEvent) {
  return getFreeEnergyCount(unit) === 0 && unit.name.includes("spawn");
}

function guardShouldUpgradeController({ unit }: TCtx, _: TEvent) {
  const freeEnergy = getFreeEnergyCount(unit);
  const shouldUpgrade = freeEnergy === 0 && unit.name.includes("controller");
  return shouldUpgrade;
}

function guardShouldContinueHarvesting({ unit }: TCtx, _: TEvent) {
  const freeEnergy = getFreeEnergyCount(unit);
  return freeEnergy < unit.store.getCapacity();
}

function guardIsEmpty({ unit }: TCtx, _: TEvent) {
  const freeEnergy = getFreeEnergyCount(unit);
  const carryingCapacity = unit.store.getCapacity();
  return freeEnergy === carryingCapacity;
}

// actions
function actionHarvest({ unit }: TCtx, _: TEvent) {
  const closestSource = unit.pos.findClosestByRange(unit.room.find(105));
  if (closestSource) {
    const { x, y } = closestSource.pos;
    unit.say("harvesting ⛏");
    moveToLocation(unit, { x, y });
    unit.harvest(closestSource);
  }
}

function actionUpgradeController({ unit }: TCtx, _: TEvent) {
  const controller = unit.room
    .find(108)
    .find(
      (struct) => struct.structureType === "controller"
    ) as StructureController;
  const { x, y } = controller.pos;
  unit.say("upgrading 🚀");
  moveToLocation(unit, { x, y });
  unit.upgradeController(controller);
}

function actionTransferToSpawn({ unit }: TCtx, _: TEvent) {
  const nearestSpawn = unit.pos.findClosestByRange(107) as StructureSpawn;
  if (nearestSpawn) {
    const { x, y } = nearestSpawn.pos;
    unit.say("transferring 🚀");
    moveToLocation(unit, { x, y });
    unit.transfer(nearestSpawn, "energy");
  }
}

function getInitialState(roomCtx: TRoomCtx, unit: TCreep) {
  return (
    (roomCtx.unitMemory.find((memItem) => memItem.name === unit.name)
      ?.state as string) ?? STATE_IDLE
  );
}

function doTasks(
  unit: TCreep,
  roomCtx: TRoomCtx,
  setUnitMemFactory: TSetUnitMemFactory
) {
  const setUnitMem = setUnitMemFactory(unit.name);
  const workerMachine = createMachine(
    {
      id: `${unit.name}_machine`,
      initial: getInitialState(roomCtx, unit),
      context: {
        unit,
        roomCtx,
      } as TCtx,
      states: {
        [STATE_IDLE]: {
          always: [
            {
              target: STATE_HARVESTING,
              cond: GUARD_SHOULD_CONTINUE_HARVESTING,
            },
            {
              target: STATE_TRANSFERRING,
              cond: GUARD_SHOULD_TRANSFER_TO_SPAWN,
            },
            {
              target: STATE_UPGRADING,
              cond: GUARD_SHOULD_UPGRADE_CONTROLLER,
            },
          ],
        },
        [STATE_HARVESTING]: {
          invoke: {
            src: (ctx, event) => () => {
              actionHarvest(ctx, event);
            },
          },
          always: [
            {
              target: STATE_TRANSFERRING,
              cond: GUARD_SHOULD_TRANSFER_TO_SPAWN,
            },
            {
              target: STATE_UPGRADING,
              cond: GUARD_SHOULD_UPGRADE_CONTROLLER,
            },
          ],
        },
        [STATE_TRANSFERRING]: {
          invoke: {
            src: (ctx, event) => () => {
              actionTransferToSpawn(ctx, event);
            },
          },
          always: [
            {
              target: STATE_HARVESTING,
              cond: GUARD_IS_EMPTY,
            },
          ],
        },
        [STATE_UPGRADING]: {
          invoke: {
            src: (ctx, event) => () => {
              actionUpgradeController(ctx, event);
            },
          },
          always: [
            {
              target: STATE_HARVESTING,
              cond: GUARD_IS_EMPTY,
            },
          ],
        },
      },
    },
    {
      // actions: {
      //   actionHarvest,
      //   actionUpgradeController,
      //   actionTransferToSpawn,
      // },
      guards: {
        guardShouldTransferToSpawn,
        guardShouldUpgradeController,
        guardShouldContinueHarvesting,
        guardIsEmpty,
      },
    }
  );

  interpret(workerMachine)
    .start()
    .onTransition((state) => {
      setUnitMem("state", state.value);
    });
}

export default function runWorkers(
  game: Game,
  getCtx: TGetCtx,
  unitMemFactory: TUnitMemFactory
) {
  const { rooms: roomCtxList } = getCtx();
  const roomList = Object.values(game.rooms);
  roomList.forEach((room) => {
    const workers = room
      .find(102)
      .filter((unit) => unit.name.includes("worker"));
    const roomCtx = roomCtxList.find(({ id }) => id === room.name)!;
    const setUnitMemFactory = unitMemFactory(roomCtx);
    workers.forEach((unit) =>
      doTasks(unit as TCreep, roomCtx, setUnitMemFactory)
    );
  });
}
