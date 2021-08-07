import '@utils/shim'
import type { TCreeps, TCreep } from '@utils/typedefs'
import { Harvester, Builder, Upgrader, Aux } from '@creeps/index'
import {
  ROLE_BUILDER,
  ROLE_HARVESTER,
  ROLE_UPGRADER,
  ROLE_AUX,
  SPAWN_NAME
} from '@utils/constants'
import { getSpawnMachine } from '@structures/spawnMachine'
import { interpret } from 'xstate'

type TTasks = Record<string, (creep: TCreep) => void>
const defaultTask = (creep: TCreep) =>
  console.warn(`No task for role ${creep.memory?.role}`)

function performDuties(creeps: TCreeps) {
  const creepList = Object.entries(creeps)
  creepList.forEach(([_name, creep]) => {
    const tasks: TTasks = {
      [ROLE_HARVESTER]: Harvester.run,
      [ROLE_BUILDER]: Builder.run,
      [ROLE_UPGRADER]: Upgrader.run,
      [ROLE_AUX]: Aux.run
    }
    const task = tasks?.[creep.memory.role as string] ?? defaultTask
    task(creep)
  })
}

function removeDeadCreeps(creeps: TCreeps) {
  const creepNames = Object.keys(creeps)
  creepNames.forEach((name) => {
    const isAlive = creeps[name] !== undefined && creeps[name] !== null
    if (!isAlive) {
      delete Memory.creeps[name]
    }
  })
}

function printSpawnerStatus(spawnName: string, creeps: TCreeps) {
  if (Game.spawns?.[spawnName]?.spawning) {
    const creepName = Game.spawns[spawnName].spawning?.name
    if (creepName) {
      const spawningCreep = creeps[creepName]
      Game.spawns[spawnName].room.visual.text(
        '🛠️' + spawningCreep.memory.role,
        Game.spawns[spawnName].pos.x + 1,
        Game.spawns[spawnName].pos.y,
        { align: 'left', opacity: 0.8 }
      )
    }
  }
}

type TMain = {
  game: Game
  rawMemory: RawMemory
}

export function main({ game }: TMain) {
  const creeps = game.creeps as TCreeps
  const spawnMachine = getSpawnMachine(game)

  // start autospawner
  interpret(spawnMachine).start()

  // perform tasks based on role
  performDuties(creeps)

  // removing dead creeps from memory
  removeDeadCreeps(creeps)

  // print status when creeps are spawning?
  printSpawnerStatus(SPAWN_NAME, creeps)
}

export function loop() {
  const game = Game
  const rawMemory = RawMemory
  main({ game, rawMemory })
}
