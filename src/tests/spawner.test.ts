import { getCreepCreator } from '@utils/spawning'
import { TCreeps } from '@utils/typedefs'
import { _Game } from '@utils/mocks'

describe('creep creator', () => {
  it('should create a creep with the harvester role', () => {
    const game = new _Game() as unknown as Game
    const createCreep = getCreepCreator(game)
    const statusCode = createCreep('harvester')
    const creeps = game.creeps as TCreeps
    const harvester = Object.values(creeps).find(c => c.memory.role === 'harvester')
    expect(statusCode).toEqual(0)
    expect(harvester?.memory.role).toBe('harvester')
  })

  it('should create a creep with the upgrader role', () => {
    const game = new _Game() as unknown as Game
    const createCreep = getCreepCreator(game)
    const statusCode = createCreep('upgrader')
    const creeps = game.creeps as TCreeps
    const upgrader = Object.values(creeps).find(c => c.memory.role === 'upgrader')
    expect(statusCode).toEqual(0)
    expect(upgrader?.memory.role).toBe('upgrader')
  })

  it('should create a creep with the builder role', () => {
    const game = new _Game() as unknown as Game
    const createCreep = getCreepCreator(game)
    const statusCode = createCreep('builder')
    const creeps = game.creeps as TCreeps
    const builder = Object.values(creeps).find(c => c.memory.role === 'builder')
    expect(statusCode).toEqual(0)
    expect(builder?.memory.role).toBe('builder')
  })
})