import { ROLES, STATE_IDLE, SPAWN_NAME } from "@utils/constants";
import { TCreeps } from "@utils/typedefs";
export function getCreepCreator(game: Game) {
  const createCreep = (role: string) => {
    const newName = `${role}_${game.time}`;
    const bodyParts = ROLES[role] ?? [];
    const structureSpawn = game.spawns[SPAWN_NAME];
    console.log(`Spawning new ${role}: ${newName}`);
    const returnCode = structureSpawn.spawnCreep(bodyParts, newName, {
      memory: { role, state: STATE_IDLE },
    });
    return returnCode
  };
  return createCreep;
}

export function getAutoSpawner(game: Game) {
  const creeps = game.creeps as TCreeps;
  const createCreep = getCreepCreator(game);
  const autoSpawnCreeps = (role: string, min = 2) => {
    const totalCreeps = Object.entries(creeps).filter(
      ([_name, creep]) => creep.memory.role === role
    ).length;
    if (totalCreeps < min) {
      createCreep(role);
    }
  };
  return autoSpawnCreeps;
}
