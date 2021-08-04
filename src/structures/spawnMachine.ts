import { createMachine, EventObject } from "xstate";
import { SPAWN_NAME, REQUIREMENTS, COSTS } from "@utils/constants";
import { getCreepCreator } from "@utils/spawning";
import { TCreeps } from "@utils/typedefs";

/**
 * Constants
 * */
// states
const SPAWNING = "spawning";
const IDLE = "idle";

// actions
export const SPAWN_HARVESTER = "spawnHarvester";
export const SPAWN_BUILDER = "spawnBuilder";
export const SPAWN_UPGRADER = "spawnUpgrader";

// conditions
const CHECK_FOR_HARVESTERS = "harvesterGuard";
const CHECK_FOR_BUILDERS = "builderGuard";
const CHECK_FOR_UPGRADERS = "upgraderGuard";

/**
 * Side Effects
 * */
function getStatus(spawnStructure: StructureSpawn) {
  return spawnStructure.spawning ? SPAWNING : IDLE;
}

function getEnergy(spawnStructure: StructureSpawn) {
  return spawnStructure.store.getCapacity("energy");
}

/**
 * Type definitions
 * */
type TCtx = { game: Game; energy: number };
type TEvent = EventObject & { role: TRoles };
type TRoles = keyof typeof REQUIREMENTS;
type TCallback = (role: string) => void;

/**
 * Factories
 * */
function guardFactory(role: TRoles) {
  return (context: TCtx, _event: TEvent) => {
    const { game, energy } = context;
    const creeps = Object.values(game.creeps as TCreeps);
    const query = creeps.filter((c) => c.memory.role === role);
    const needsMore = query.length < REQUIREMENTS[role];
    const canMakeMore = energy >= COSTS[role];
    return needsMore && canMakeMore;
  };
}

function actionWrapper(action: TCallback) {
  return (role: TRoles) => (_context: TCtx, _event: TEvent) => {
    action(role);
  };
}

export function getSpawnMachine(game: Game) {
  const spawnStructure = game.spawns[SPAWN_NAME];
  const createCreep = getCreepCreator(game);
  const createAction = actionWrapper(createCreep);

  // guards
  const harvesterGuard = guardFactory("harvester");
  const builderGuard = guardFactory("builder");
  const upgraderGuard = guardFactory("upgrader");

  // actions
  const spawnHarvester = createAction("harvester");
  const spawnBuilder = createAction("builder");
  const spawnUpgrader = createAction("upgrader");

  return createMachine(
    {
      id: "spawnMachine",
      initial: getStatus(spawnStructure), // idle / spawning
      context: {
        energy: getEnergy(spawnStructure),
        game,
      },
      states: {
        [IDLE]: {
          always: [
            {
              target: SPAWNING,
              cond: CHECK_FOR_HARVESTERS,
              actions: [SPAWN_HARVESTER],
            },
            {
              target: SPAWNING,
              cond: CHECK_FOR_UPGRADERS,
              actions: [SPAWN_UPGRADER],
            },
            {
              target: SPAWNING,
              cond: CHECK_FOR_BUILDERS,
              actions: [SPAWN_BUILDER],
            },
          ],
        },
        [SPAWNING]: {},
      },
    },
    {
      actions: {
        spawnHarvester,
        spawnBuilder,
        spawnUpgrader,
      },
      guards: {
        harvesterGuard,
        builderGuard,
        upgraderGuard,
      },
    }
  );
}
