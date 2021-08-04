import { createMachine, EventObject, send } from "xstate";
import { SPAWN_NAME, REQUIREMENTS, COSTS } from "@utils/constants";
import { getCreepCreator } from "@utils/spawning";
import { TCreeps } from "@utils/typedefs";

// states
const SPAWNING = "spawning";
const IDLE = "idle";

// actions
export const SPAWN_HARVESTER = "SPAWN_HARVESTER";
export const SPAWN_BUILDER = "SPAWN_BUILDER";
export const SPAWN_UPGRADER = "SPAWN_UPGRADER";

function getStatus(spawnStructure: StructureSpawn) {
  return spawnStructure.spawning ? SPAWNING : IDLE;
}

function getEnergy(spawnStructure: StructureSpawn) {
  return spawnStructure.store.getCapacity("energy");
}

type TCtx = { game: Game; energy: number };
type TEvent = EventObject & { role: TRoles };
type TRoles = keyof typeof REQUIREMENTS;
function getRequirementCheck(role: TRoles) {
  return (context: TCtx, _event: TEvent) => {
    const { game, energy } = context;
    const creeps = Object.values(game.creeps as TCreeps);
    const query = creeps.filter((c) => c.memory.role === role);
    const needsMore = query.length < REQUIREMENTS[role];
    const canMakeMore = energy >= COSTS[role];
    return needsMore && canMakeMore;
  };
}

function getCreatorAction(role: TRoles, createCreep: (role: string) => void) {
  return (_context: TCtx, _event: TEvent) => {
    console.log(`creating creep with the role: ${role}...`)
    createCreep(role);
  };
}

export function getSpawnMachine(game: Game) {
  const spawnStructure = game.spawns[SPAWN_NAME];
  const createCreep = getCreepCreator(game);

  // guards
  const checkForHarvesters = getRequirementCheck("harvester");
  const checkForBuilders = getRequirementCheck("builder");
  const checkForUpgraders = getRequirementCheck("upgrader");

  // actions
  const createHarvesterAction = getCreatorAction('harvester', createCreep);
  const createBuilderAction = getCreatorAction('builder', createCreep);
  const createUpgraderAction = getCreatorAction('upgrader', createCreep);

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
          on: {
            [SPAWN_HARVESTER]: [
              {
                target: SPAWNING,
                cond: "checkForHarvesters",
                actions: ["createHarvesterAction"],
              },
              { target: IDLE },
            ],
            [SPAWN_BUILDER]: [
              {
                target: SPAWNING,
                cond: "checkForBuilders",
                actions: ["createBuilderAction"],
              },
              { target: IDLE },
            ],
            [SPAWN_UPGRADER]: [
              {
                target: SPAWNING,
                cond: "checkForUpgraders",
                actions: ["createUpgraderAction"],
              },
              { target: IDLE },
            ],
          },
          always: [
            {
              target: SPAWNING,
              cond: "checkForHarvesters",
              actions: ["createHarvesterAction"],
            },
            {
              target: SPAWNING,
              cond: "checkForUpgraders",
              actions: ["createUpgraderAction"],
            },
            {
              target: SPAWNING,
              cond: "checkForBuilders",
              actions: ["createBuilderAction"],
            },
          ],
        },
        [SPAWNING]: {
          on: {
            [SPAWN_HARVESTER]: [
              { target: SPAWNING, cond: "checkForHarvesters" },
              { target: IDLE },
            ],
            [SPAWN_BUILDER]: [
              { target: SPAWNING, cond: "checkForBuilders" },
              { target: IDLE },
            ],
            [SPAWN_UPGRADER]: [
              { target: SPAWNING, cond: "checkForUpgraders" },
              { target: IDLE },
            ],
          },
        },
      },
    },
    {
      actions: {
        createHarvesterAction,
        createBuilderAction,
        createUpgraderAction,
      },
      guards: {
        checkForHarvesters,
        checkForBuilders,
        checkForUpgraders,
      },
    }
  );
}
