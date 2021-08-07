import { TCreep } from '@utils/typedefs'
import { ROLE_UPGRADER } from '@utils/constants'
import { getInitialState, getCreepsByRole } from '@utils/creeps'
import { createMachine, EventObject as TEvent, interpret } from 'xstate'

// state
const STATE_TRANSFERRING = 'transferring'
const STATE_IDLE = 'idle'
const STATE_READY = 'ready'

// actions
const ACTION_TRANSFER_ENERGY = 'transferEnergy'

// guards
const GUARD_CAN_TRANSFER_ENERGY = 'canTransferEnergy'
const GUARD_IS_READY = 'canReceiveEnergy'

// types
export type TCtx = {
  self: TCreep
  targetCreep: TCreep | undefined
}

function getInitialContext(self: TCreep) {
  const allCreeps = self.room.find(FIND_MY_CREEPS) as TCreep[]
  const upgraders = getCreepsByRole(
    allCreeps,
    // ROLE_BUILDER,
    ROLE_UPGRADER
  )
  // const targetCreep = upgraders.find(
  //   (creep) => creep.store.getFreeCapacity('energy') === 50
  // )
  const targetCreep = upgraders[0]
  return {
    self,
    targetCreep
  }
}

// actions
function transferEnergy({ self, targetCreep }: TCtx, _event: TEvent) {
  const { x, y } = targetCreep!.pos
  self.say('transferring')
  self.moveTo(x, y)
  self.transfer(targetCreep!, 'energy')
}

// guards
function canTransferEnergy({ self, targetCreep }: TCtx, _: TEvent) {
  const canTransfer = targetCreep
    ? self.store.getFreeCapacity('energy') !== 50
    : false
  return canTransfer
}

function canReceiveEnergy({ self }: TCtx, _: TEvent) {
  return self.store.getFreeCapacity('energy') > 0
}

function auxFactory(creep: TCreep) {
  const auxMachine = createMachine(
    {
      id: 'aux',
      initial: getInitialState(creep, [STATE_IDLE, STATE_IDLE]),
      context: getInitialContext(creep),
      states: {
        [STATE_IDLE]: {
          always: [{ target: STATE_READY }]
        },
        [STATE_READY]: {
          always: [
            {
              target: STATE_TRANSFERRING,
              cond: GUARD_CAN_TRANSFER_ENERGY,
              actions: [ACTION_TRANSFER_ENERGY]
            }
          ]
        },
        [STATE_TRANSFERRING]: {
          always: [
            {
              target: STATE_READY,
              cond: GUARD_IS_READY
            }
          ]
        }
      }
    },
    {
      actions: {
        transferEnergy
      },
      guards: {
        canTransferEnergy,
        canReceiveEnergy
      }
    }
  )

  return auxMachine
}

export const aux = {
  run: (creep: TCreep) =>
    interpret(auxFactory(creep))
      .onTransition((state) => {
        state.context.self.memory.state = state.value
      })
      .start()
}
