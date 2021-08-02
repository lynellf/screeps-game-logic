// States
export const STATE_IDLE = 'idle'
export const STATE_UPGRADING = 'upgrading'
export const STATE_HARVESTING = 'harvesting'
export const STATE_MOVING = 'moving'

// Role Types
export const ROLE_HARVESTER = 'harvester'
export const ROLE_BUILDER = 'builder'
export const ROLE_UPGRADER = 'upgrader'

export const ROLES: Record<string, BodyPartConstant[]> = {
  [ROLE_HARVESTER]: [WORK, CARRY, MOVE],
  [ROLE_BUILDER]: [WORK, CARRY, MOVE],
  [ROLE_UPGRADER]: [WORK, CARRY, MOVE]
}

// Game Rules
export const MAX_CONTROLLER_LEVEL = 8
export const SPAWN_NAME = 'Homebase'
