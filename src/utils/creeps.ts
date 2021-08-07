import { TRoles, TCreep } from '@utils/typedefs'
export function getCreepsByRole(creeps: TCreep[], ...roles: TRoles[]) {
  return creeps.filter((creep) => roles.includes(creep.memory.role))
}

type TStates = [TRoles, TRoles]
export function getInitialState(
  creep: TCreep,
  [hasEnergy, hasNoEnergy]: [string, string]
) {
  const totalEnergy = creep.store.getCapacity('energy')
  const hasEnergyState = totalEnergy > 0
  return hasEnergyState ? hasEnergy : hasNoEnergy
}
