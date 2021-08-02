import { TCreep } from '@utils/typedefs'
import { Harvester, Builder, Upgrader } from '@roles/index'

const ctx = {
  spawnName: 'HomeBase'
}
export default function main() {
  const { spawnName } = ctx
  const creeps = Game.creeps as Record<string, TCreep>

  // perform tasks
  for (const name in creeps) {
    const creep = creeps[name]
    if (creep.memory.role == 'harvester') {
      Harvester.run(creep)
    }
    if (creep.memory.role == 'upgrader') {
      Upgrader.run(creep)
    }
    if (creep.memory.role == 'builder') {
      Builder.run(creep)
    }
  }

  // removing dead creeps from memory
  for (const name in creeps) {
    if (!creeps[name]) {
      delete Memory.creeps[name]
      console.log('Clearing non-existing creep memory:', name)
    }
  }

  // spawn new harvesters if needed
  const harvesters = Object.entries(creeps).filter(
    ([_name, creep]) => creep.memory.role == 'harvester'
  )
  console.log('Harvesters: ' + harvesters.length)

  if (harvesters.length < 2) {
    const newName = 'Harvester' + Game.time
    console.log('Spawning new harvester: ' + newName)
    Game.spawns[spawnName].spawnCreep([WORK, CARRY, MOVE], newName, {
      memory: { role: 'harvester' }
    })
  }

  if (Game.spawns[spawnName].spawning) {
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
