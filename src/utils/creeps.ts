import { TRoles, TCreep } from '@utils/typedefs'

type TOpt = { roles: TRoles[] }
export function getCreepsByRole(creeps: TCreep[], opt: TOpt) {
  return creeps.filter((creep) => opt.roles.includes(creep.memory.role))
}
