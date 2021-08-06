import { TCreep } from '@utils/typedefs'
import { ROLE_BUILDER, ROLE_UPGRADER } from '@utils/constants'
import { createMachine, EventObject, interpret } from 'xstate'

// state
const STATE_DELIVERING = 'delivering'
const STATE_IDLE = 'idle'
const STATE_SOURCING = 'sourcing'

// actions
const ACTION_PICKUP_ENERGY = 'pickupEnergy'
const ACTION_DROP_OFF_ENERGY = 'dropOffEnergy'

// guards
const GUARD_CAN_DELIVER_ENERGY = 'canDeliverEnergy'
const GUARD_CAN_PICKUP_ENERGY = 'canPickupEnergy'

// types
export type TCtx = {
  self: TCreep
  energyPos: { x: number; y: number }
  destPos: { x: number; y: number }
  droppedEnergy: Resource<ResourceConstant> | undefined
}

function getInitialState(creep: TCreep) {
  const totalEnergy = creep.store.getCapacity('energy')
  const shouldDeliver = totalEnergy > 0
  return shouldDeliver ? STATE_DELIVERING : STATE_IDLE
}

function getInitialContext(self: TCreep) {
  const { x: selfX, y: selfY } = self.pos

  const droppedEnergy = self.room
    .find(106)
    .find((resource) => resource.resourceType === 'energy')

  const allCreeps = self.room.find(FIND_MY_CREEPS) as TCreep[]

  const destCreep = allCreeps
    .filter((creep) =>
      [ROLE_BUILDER, ROLE_UPGRADER].includes(creep.memory.role)
    )
    .find((creep) => creep.store.getCapacity('energy') === 0)

  const energyPos = {
    x: droppedEnergy?.pos.x ?? selfX,
    y: droppedEnergy?.pos.y ?? selfY
  }
  const destPos = {
    x: destCreep?.pos.x ?? selfX,
    y: destCreep?.pos.y ?? selfY
  }

  return {
    self,
    droppedEnergy,
    energyPos,
    destPos
  }
}

// actions
function pickupEnergy(ctx: TCtx, _event: EventObject) {
  const {
    self,
    energyPos: { x, y },
    droppedEnergy
  } = ctx
  if (droppedEnergy) {
    self.moveTo(x, y)
    self.pickup(droppedEnergy)
  }
}

function dropOffEnergy(ctx: TCtx, _event: EventObject) {
  const {
    self,
    destPos: { x, y }
  } = ctx
  self.moveTo(x, y)
  self.drop('energy')
}

// guards
function canDeliverEnergy({ self }: TCtx, _: EventObject) {
  return self.store.getCapacity('energy') > 0
}

function canPickupEnergy({ self }: TCtx, _: EventObject) {
  return self.store.getCapacity('energy') < 50
}

function auxFactory(creep: TCreep) {
  const auxMachine = createMachine(
    {
      id: 'aux',
      initial: getInitialState(creep),
      context: getInitialContext(creep),
      states: {
        [STATE_IDLE]: {
          always: [{ target: STATE_SOURCING, cond: GUARD_CAN_PICKUP_ENERGY }]
        },
        [STATE_SOURCING]: {
          always: [
            {
              target: STATE_DELIVERING,
              cond: GUARD_CAN_DELIVER_ENERGY,
              actions: [ACTION_PICKUP_ENERGY]
            }
          ]
        },
        [STATE_DELIVERING]: {
          always: [
            {
              target: STATE_IDLE,
              actions: [ACTION_DROP_OFF_ENERGY]
            }
          ]
        }
      }
    },
    {
      actions: {
        pickupEnergy,
        dropOffEnergy
      },
      guards: {
        canDeliverEnergy,
        canPickupEnergy
      }
    }
  )

  return auxMachine
}

export const aux = {
  run: (creep: TCreep) => interpret(auxFactory(creep)).start()
}
