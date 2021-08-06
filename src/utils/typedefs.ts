import {
  ROLE_AUX,
  ROLE_BUILDER,
  ROLE_HARVESTER,
  ROLE_UPGRADER
} from '@utils/constants'

export type TRoles =
  | typeof ROLE_AUX
  | typeof ROLE_BUILDER
  | typeof ROLE_HARVESTER
  | typeof ROLE_UPGRADER

export type TCreep = Creep & {
  memory: Creep['memory'] & Record<string, unknown> & { role: TRoles }
}

export type TCreeps = Record<string, TCreep>
