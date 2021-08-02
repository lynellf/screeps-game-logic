export type TCreep = Creep & {
  memory: Creep['memory'] & Record<string, unknown>
}

export type TCreeps = Record<string, TCreep>
