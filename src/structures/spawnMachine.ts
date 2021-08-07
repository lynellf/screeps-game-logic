import { createMachine, EventObject } from 'xstate'
import {
  SPAWN_NAME,
  REQUIREMENTS,
  COSTS,
  ROLE_HARVESTER,
  ROLE_BUILDER,
  ROLE_UPGRADER,
  ROLE_AUX
} from '@utils/constants'
import { getCreepCreator } from '@utils/spawning'
import { getCreepsByRole } from '@utils/creeps'
import type { TCreeps, TRoles } from '@utils/typedefs'

/**
 * Constants
 * */
// states
const SPAWNING = 'spawning'
const IDLE = 'idle'

// actions
export const SPAWN_HARVESTER = 'spawnHarvester'
export const SPAWN_BUILDER = 'spawnBuilder'
export const SPAWN_UPGRADER = 'spawnUpgrader'
export const SPAWN_AUX = 'spawnAux'

// conditions
const CHECK_FOR_HARVESTERS = 'harvesterGuard'
const CHECK_FOR_BUILDERS = 'builderGuard'
const CHECK_FOR_UPGRADERS = 'upgraderGuard'

/**
 * Side Effects
 * */
function getStatus(spawnStructure: StructureSpawn) {
  return spawnStructure.spawning ? SPAWNING : IDLE
}

function getEnergy(spawnStructure: StructureSpawn) {
  const energy = spawnStructure.store.getUsedCapacity('energy')
  return energy
}

/**
 * Type definitions
 * */
type TCtx = { game: Game; energy: number }
type TEvent = EventObject & { role: TRoles }
type TCallback = (role: string) => void

/**
 * Factories
 * */
function guardFactory(role: TRoles) {
  return (context: TCtx, _event: TEvent) => {
    const { game, energy } = context
    const creeps = Object.values(game.creeps as TCreeps)
    const query = getCreepsByRole(creeps, role)
    const needsMore = query.length < REQUIREMENTS[role]
    const canMakeMore = energy >= COSTS[role]
    return needsMore && canMakeMore
  }
}

function actionWrapper(action: TCallback) {
  return (role: TRoles) => (_context: TCtx, _event: TEvent) => {
    action(role)
  }
}

function auxGuardFactory() {
  return (context: TCtx, _event: TEvent) => {
    const { game, energy } = context
    const creeps = Object.values(game.creeps as TCreeps)
    const totalHarvesters = getCreepsByRole(creeps, ROLE_HARVESTER).length
    const totalAux = getCreepsByRole(creeps, ROLE_AUX).length
    // one aux for every two harvesters
    const auxThreshhold = totalHarvesters / 2
    const needsMore = totalAux < auxThreshhold
    const canMakeMore = energy >= COSTS[ROLE_AUX]
    return needsMore && canMakeMore
  }
}

export function getSpawnMachine(game: Game) {
  const spawnStructure = game.spawns[SPAWN_NAME]
  const createCreep = getCreepCreator(game)
  const createAction = actionWrapper(createCreep)

  // guards
  const harvesterGuard = guardFactory(ROLE_HARVESTER)
  const builderGuard = guardFactory(ROLE_BUILDER)
  const upgraderGuard = guardFactory(ROLE_UPGRADER)
  const auxGuard = auxGuardFactory()

  // actions
  const spawnHarvester = createAction(ROLE_HARVESTER)
  const spawnBuilder = createAction(ROLE_BUILDER)
  const spawnUpgrader = createAction(ROLE_UPGRADER)
  const spawnAux = createAction(ROLE_AUX)

  return createMachine(
    {
      id: 'spawnMachine',
      initial: getStatus(spawnStructure), // idle / spawning
      context: {
        energy: getEnergy(spawnStructure),
        game
      },
      states: {
        [IDLE]: {
          always: [
            {
              target: SPAWNING,
              cond: CHECK_FOR_HARVESTERS,
              actions: [SPAWN_HARVESTER]
            },
            {
              target: SPAWNING,
              cond: auxGuard,
              actions: [SPAWN_AUX]
            },
            {
              target: SPAWNING,
              cond: CHECK_FOR_UPGRADERS,
              actions: [SPAWN_UPGRADER]
            }
            // {
            //   target: SPAWNING,
            //   cond: CHECK_FOR_BUILDERS,
            //   actions: [SPAWN_BUILDER]
            // }
          ]
        },
        [SPAWNING]: {}
      }
    },
    {
      actions: {
        spawnHarvester,
        spawnBuilder,
        spawnUpgrader,
        spawnAux
      },
      guards: {
        harvesterGuard,
        builderGuard,
        upgraderGuard,
        auxGuard
      }
    }
  )
}
