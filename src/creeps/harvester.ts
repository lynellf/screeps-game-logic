import { TCreep } from '@utils/typedefs'
import { createMachine, EventObject as TEvent, interpret } from 'xstate'
import { getInitialState, getCreepsByRole } from '@utils/creeps'
import { ROLE_AUX } from '@utils/constants'

// state
const STATE_IDLE = 'idle'
const STATE_HARVESTING = 'harvesting'
const STATE_TRANSFERRING = 'transferring'

// action types
const ACTION_HARVEST = 'harvestEnergy'
const ACTION_TRANSFER_TO_SPAWN = 'transferToSpawn'
const ACTION_TRANSFER_TO_TARGET = 'transferToTarget'

// guard types
const GUARD_SPAWN_EXISTS = 'spawnExists'
const GUARD_TARGET_EXISTS = 'targetExists'

// types
export type TCtx = {
  self: TCreep
  energySource: Source
  targetCreep: TCreep | undefined
  spawnStructure: StructureSpawn | undefined
}

function getInitialCtx(self: TCreep) {
  const creeps = self.room.find(102) as TCreep[]
  const structures = self.room.find(107) as Structure[]
  const spawnStructure = structures.find(
    (structure) => structure.structureType === 'spawn'
  ) as StructureSpawn | undefined
  const energySource = self.room.find(FIND_SOURCES)[0]
  const auxCreeps = getCreepsByRole(creeps, ROLE_AUX)
  const targetCreep = auxCreeps.find(
    (c) => c.store.getFreeCapacity('energy') === 50
  )
  return { self, energySource, targetCreep, spawnStructure }
}

// action fns
function harvestEnergy({ self, energySource }: TCtx, _: TEvent) {
  const { x, y } = energySource.pos
  self.say('harvesting ⛏')
  self.moveTo(x, y, {
    visualizePathStyle: { stroke: '#ffaa00' }
  })
  self.harvest(energySource)
}

function transferToTarget({ self, targetCreep }: TCtx, _: TEvent) {
  const { x, y } = targetCreep!.pos
  self.say(`${targetCreep?.memory?.role})`)
  self.moveTo(x, y, { visualizePathStyle: { stroke: '#ffaa00' } })
  self.transfer(targetCreep!, 'energy')
}

function transferToSpawn({ self, spawnStructure }: TCtx, _: TEvent) {
  const { x, y } = spawnStructure!.pos
  self.say(`spawn`)
  self.moveTo(x, y, { visualizePathStyle: { stroke: '#ffaa00' } })
  self.transfer(spawnStructure!, 'energy')
}

// guard fns
function canHarvestEnergy({ self }: TCtx, _: TEvent) {
  return self.store.getFreeCapacity('energy') > 0
  // return false
}

function canTransferEnergy({ self }: TCtx, _: TEvent) {
  return self.store.getFreeCapacity('energy') === 0
}

function spawnExists({ self, spawnStructure }: TCtx, _: TEvent) {
  return spawnStructure
    ? self.store.getFreeCapacity('energy') === 0 &&
        spawnStructure.store.getUsedCapacity('energy') < 300
    : false
}

function targetExists({ self, targetCreep }: TCtx, _: TEvent) {
  return targetCreep
    ? self.store.getFreeCapacity('energy') === 0 &&
        targetCreep.store.getFreeCapacity('energy') > 0
    : false
}

// this is amazing

function harvesterFactory(creep: TCreep) {
  return createMachine(
    {
      id: 'harvester',
      initial: getInitialState(creep, [STATE_IDLE, STATE_HARVESTING]),
      context: getInitialCtx(creep),
      states: {
        [STATE_IDLE]: {
          always: [
            {
              target: STATE_HARVESTING,
              actions: [ACTION_HARVEST]
            }
          ]
        },
        [STATE_HARVESTING]: {
          always: [
            {
              target: STATE_TRANSFERRING,
              cond: GUARD_TARGET_EXISTS,
              actions: [ACTION_TRANSFER_TO_TARGET]
            },
            {
              target: STATE_TRANSFERRING,
              cond: GUARD_SPAWN_EXISTS,
              actions: [ACTION_TRANSFER_TO_SPAWN]
            }
          ]
        },
        [STATE_TRANSFERRING]: {}
      }
    },
    {
      actions: {
        harvestEnergy,
        transferToTarget,
        transferToSpawn
      },
      guards: {
        canHarvestEnergy,
        canTransferEnergy,
        spawnExists,
        targetExists
      }
    }
  )
}

const roleHarvester = {
  run: (creep: TCreep) => {
    const machine = harvesterFactory(creep)
    interpret(machine, creep)
      .onTransition((state) => {
        state.context.self.memory.state = state.value
      })
      .start()
    interpret(harvesterFactory(creep)).start()
  }
}

export default roleHarvester
