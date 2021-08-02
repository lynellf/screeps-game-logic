export type TCreep = Creep & {
	memory: Creep['memory'] & Record<string, unknown>
}