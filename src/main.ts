import '@utils/shim'
import GameManager from "@managers/gameManager";
import Spawner from "@structures/spawn";
import RunWorkerTasks from "@creeps/worker";

type TMain = {
  game: Game;
  rawMemory: RawMemory;
  log: boolean;
};

function printRecord(record: Record<string, unknown>) {
  Object.entries(record).forEach(printValue);
}

function printValue([key, value]: [string, unknown]) {
  const type = typeof value;
  if (type === "object") {
    return printRecord(value as Record<string, unknown>);
  }

  if (!Array.isArray(value)) {
    console.log(`${key}: ${value}`);
  }
}

function printCtx(rawMemory: RawMemory) {
  const ctx = JSON.parse(rawMemory.get());
  printRecord(ctx);
}

export function main({ game, rawMemory, log }: TMain) {
  const [getCtx, unitMemFactory] = GameManager(game, rawMemory);
  if (log) {
    printCtx(rawMemory);
  }

  Spawner(game, getCtx, unitMemFactory);
  RunWorkerTasks(game, getCtx, unitMemFactory);
}

export function loop() {
  const game = Game;
  const rawMemory = RawMemory;
  main({ game, rawMemory, log: false });
}
