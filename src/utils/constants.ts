function getCost(bodyParts: BodyPartConstant[]) {
  const costs: Record<BodyPartConstant, number> = {
    attack: 80,
    move: 50,
    carry: 50,
    heal: 250,
    ranged_attack: 150,
    work: 100,
    tough: 10,
    claim: 600
  }
  return bodyParts.reduce((total, part) => total + costs[part], 0)
}

RANGED_ATTACK
// States
export const STATE_IDLE = 'idle'
export const STATE_UPGRADING = 'upgrading'
export const STATE_HARVESTING = 'harvesting'
export const STATE_MOVING = 'moving'

// Role Types
export const ROLE_HARVESTER = 'harvester'
export const ROLE_BUILDER = 'builder'
export const ROLE_UPGRADER = 'upgrader'
export const ROLE_AUX = 'auxiliary'

export const ROLES: Record<string, BodyPartConstant[]> = {
  [ROLE_HARVESTER]: ['work', 'carry', 'move'],
  [ROLE_BUILDER]: ['work', 'carry', 'move'],
  [ROLE_UPGRADER]: ['work', 'carry', 'move'],
  [ROLE_AUX]: ['work', 'carry', 'move']
}

export const COSTS: Record<string, number> = {
  [ROLE_HARVESTER]: getCost(ROLES[ROLE_HARVESTER]),
  [ROLE_BUILDER]: getCost(ROLES[ROLE_BUILDER]),
  [ROLE_UPGRADER]: getCost(ROLES[ROLE_UPGRADER]),
  [ROLE_AUX]: getCost(ROLES[ROLE_AUX])
}

// Game Rules
export const MAX_CONTROLLER_LEVEL = 8
export const SPAWN_NAME = 'Homebase'

// Requirements
const REQUIREMENT_MIN_HARVESTERS = 1
const REQUIREMENT_MIN_BUILDERS = 1
const REQUIREMENT_MIN_UPGRADERS = 1
const REQUIREMENT_MIN_AUXILIARY = 1

export const REQUIREMENTS: Record<string, number> = {
  [ROLE_HARVESTER]: REQUIREMENT_MIN_HARVESTERS,
  [ROLE_BUILDER]: REQUIREMENT_MIN_BUILDERS,
  [ROLE_UPGRADER]: REQUIREMENT_MIN_UPGRADERS,
  [ROLE_AUX]: REQUIREMENT_MIN_AUXILIARY
}
