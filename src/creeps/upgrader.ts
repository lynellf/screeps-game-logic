import { TCreep } from '@utils/typedefs'
import { createMachine, EventObject as TEvent, interpret } from 'xstate'

// states
const STATE_IDLE = 'idle'
const STATE_UPGRADING = 'upgrading'

// actions
const ACTION_PERFORM_UPGRADE = 'performUpgrade'

// types
export type TCtx = {
  self: TCreep
  controller: StructureController | undefined
}

function getInitialContext(creep: TCreep) {
  return {
    self: creep,
    controller: creep.room.controller
  }
}

// actions
function performUpgrade({ controller, self }: TCtx, _: TEvent) {
  const { x, y } = controller!.pos
  self.say('upgrading')
  self.moveTo(x, y, { visualizePathStyle: { stroke: '#ffaa00' } })
  self.upgradeController(controller!)
}

function upgraderFactory(creep: TCreep) {
  return createMachine(
    {
      id: 'upgrader',
      initial: STATE_IDLE,
      context: getInitialContext(creep),
      states: {
        [STATE_IDLE]: {
          always: [
            {
              target: STATE_UPGRADING,
              actions: [ACTION_PERFORM_UPGRADE]
            }
          ]
        },
        [STATE_UPGRADING]: {}
      }
    },
    {
      actions: {
        performUpgrade
      }
    }
  )
}

const roleUpgrader = {
  run: function (creep: TCreep) {
    interpret(upgraderFactory(creep)).start()
  }
}

export default roleUpgrader
