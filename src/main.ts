import { TCreeps, TCreep } from '@utils/typedefs'
import { Harvester, Builder, Upgrader } from '@roles/index'

const HARVESTER = 'harvester'
const BUILDER = 'builder'
const UPGRADER = 'upgrader'

const ROLES: Record<string, BodyPartConstant[]> = {
  [HARVESTER]: [WORK, CARRY, MOVE],
  [BUILDER]: [WORK, CARRY, MOVE],
  [UPGRADER]: [WORK, CARRY, MOVE]
}

const settings = {
  spawnName: 'HomeBase'
}

type TTasks = Record<string, (creep: TCreep) => void>
const defaultTask = (creep: TCreep) =>
  console.warn(`No task for role ${creep.memory?.role}`)

function performDuties(creeps: TCreeps) {
  const creepList = Object.entries(creeps)
  creepList.forEach(([_name, creep]) => {
    const tasks: TTasks = {
      [HARVESTER]: Harvester.run,
      [BUILDER]: Builder.run,
      [UPGRADER]: Upgrader.run
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

function getCreepCreator(spawnName: string) {
  const createCreep = (role: string) => {
    const newName = `${role} + Game.time`
    const bodyParts = ROLES[role] ?? []
    console.log('Spawning new harvester: ' + newName)
    Game.spawns[spawnName]?.spawnCreep(bodyParts, newName, { memory: { role } })
  }
  return createCreep
}

function getAutoSpawner(creeps: TCreeps, spawnName: string) {
  const createCreep = getCreepCreator(spawnName)
  const autoSpawnCreeps = (role: string, min = 2) => {
    const totalCreeps = Object.entries(creeps).filter(
      ([_name, creep]) => creep.memory.role == role
    ).length
    if (totalCreeps < min) {
      createCreep(role)
    }
  }
  return autoSpawnCreeps
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

export function loop() {
  const { spawnName } = settings
  const creeps = Game.creeps as TCreeps
  const autoSpawnCreeps = getAutoSpawner(creeps, spawnName)

  // perform tasks based on role
  performDuties(creeps)

  // removing dead creeps from memory
  removeDeadCreeps(creeps)

  // spawn new harvesters if needed
  autoSpawnCreeps(HARVESTER, 2)
  autoSpawnCreeps(BUILDER, 1)
  autoSpawnCreeps(UPGRADER, 1)

  // print status when creeps are spawning?
  printSpawnerStatus(spawnName, creeps)
}
