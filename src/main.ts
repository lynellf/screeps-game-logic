type TMain = {
  game: Game
  rawMemory: RawMemory
}

export function main({ game }: TMain) {}

export function loop() {
  const game = Game
  const rawMemory = RawMemory
  main({ game, rawMemory })
}
