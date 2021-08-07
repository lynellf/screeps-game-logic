import GameManager from '@managers/gameManager'

type TMain = {
  game: Game
  rawMemory: RawMemory,
  log: boolean
}

function printRecord(record: Record<string, unknown>) {
  Object.entries(record).forEach(printValue)
}

function printValue([key, value]: [string, unknown]) {
    const type = typeof value
    if (type === 'object') {
     return printRecord(value as Record<string, unknown>);
    }

    console.log(`${key}: ${value}`)
  }

function printCtx(rawMemory: RawMemory) {
  const ctx = JSON.parse(rawMemory.get())
  printRecord(ctx)
}

export function main({ game, rawMemory, log }: TMain) {
  GameManager(game, rawMemory)
  if (log) {
    printCtx(rawMemory)
  }
}

export function loop() {
  const game = Game
  const rawMemory = RawMemory
  main({ game, rawMemory, log: true })
}
