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
  [ROLE_HARVESTER]: ['work', 'carry', 'move'],
  [ROLE_BUILDER]: ['work', 'carry', 'move'],
  [ROLE_UPGRADER]: ['work', 'carry', 'move']
}

export const COSTS: Record<string, number> = {
  [ROLE_HARVESTER]: 70,
  [ROLE_BUILDER]: 70,
  [ROLE_UPGRADER]: 70
}

// Game Rules
export const MAX_CONTROLLER_LEVEL = 8
export const SPAWN_NAME = 'Homebase'

// Requirements
const REQUIREMENT_MIN_HARVESTERS = 2
const REQUIREMENT_MIN_BUILDERS = 1
const REQUIREMENT_MIN_UPGRADERS = 1

export const REQUIREMENTS: Record<string, number> = {
  [ROLE_HARVESTER]: REQUIREMENT_MIN_HARVESTERS,
  [ROLE_BUILDER]: REQUIREMENT_MIN_BUILDERS,
  [ROLE_UPGRADER]: REQUIREMENT_MIN_UPGRADERS
}