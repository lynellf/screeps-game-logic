import { getSpawnMachine, SPAWN_HARVESTER } from "@structures/spawnMachine";
import { _Game, gameFactory } from "@utils/mocks";
import { TCreeps } from "@utils/typedefs";
import { interpret } from "xstate";

function waitForCreeps(game: Game): Promise<TCreeps> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const _machine = getSpawnMachine(game);
      interpret(_machine).start();
      const creeps = game.creeps as TCreeps;
      return resolve(creeps);
    }, 1000);
  });
}

describe("getSpawnMachine", () => {
  it("should create a harvester", async () => {
    const game = gameFactory();
    const resp = await waitForCreeps(game);
    const creeps = Object.values(resp);
    const harvester = creeps.find((c) => c.memory.role === "harvester");
    expect(harvester?.memory.role).toBe("harvester");
  });

  it("should create an upgrader", async () => {
    const game = gameFactory({
      creeps: {
        'harvester_1': { name: 'harvester_1', memory: { role: 'harvester' } },
        'harvester_2': { name: 'harvester_2', memory: { role: 'harvester' } },
      } as unknown as TCreeps
    });
    const resp = await waitForCreeps(game);
    const creeps = Object.values(resp);
    const upgrader = creeps.find((c) => c.memory.role === "upgrader");
    expect(upgrader?.memory.role).toBe("upgrader");
  })

  it("should create a builder", async () => {
    const game = gameFactory({
      creeps: {
        harvester_1: { name: "harvester_1", memory: { role: "harvester" } },
        harvester_2: { name: "harvester_2", memory: { role: "harvester" } },
        upgrader_1: {  name: "upgrader_1", memory: { role: "upgrader" } },
      } as unknown as TCreeps,
    });
    const resp = await waitForCreeps(game);
    const creeps = Object.values(resp);
    const builder = creeps.find((c) => c.memory.role === "builder");
    expect(builder?.memory.role).toBe("builder");
  });
});
