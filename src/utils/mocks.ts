import { SPAWN_NAME } from "./constants";
import { TCreeps, TCreep } from "./typedefs";

// mock of Game object
export class _Game {
  creeps: TCreeps = {};
  time: number = new Date().getUTCSeconds();
  spawns: Record<string, StructureSpawn> = {
    [SPAWN_NAME]: {
      spawnCreep: (_body, name, options) => {
        this.creeps[name] = { name, ...options } as TCreep;
        return 0;
      },
      store: {
        getCapacity: (name) => {
          return 300;
        },
      },
    } as StructureSpawn,
  };

  constructor(options: Partial<Game> = {}) {
    const creeps = options.creeps as TCreeps;
    const spawnStructure = options?.spawns?.[SPAWN_NAME];
    this.creeps = creeps ? creeps : this.creeps;
    this.spawns[SPAWN_NAME] = spawnStructure ? spawnStructure : this.spawns[SPAWN_NAME];
  }
}

export function gameFactory(options: Partial<Game> = {}) {
  return new _Game(options) as unknown as Game;
}