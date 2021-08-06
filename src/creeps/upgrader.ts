import { TCreep } from '@utils/typedefs'
import {
  STATE_IDLE,
  STATE_UPGRADING,
  STATE_MOVING,
  MAX_CONTROLLER_LEVEL
} from '@utils/constants'

type TMovingEvent = 'events/moveToController'
type TIdleEvent = 'events/becomeIdle'
type TUpgradeEvent = 'events/startUpgrading'
type TEvents = TIdleEvent | TUpgradeEvent | TMovingEvent
type TStates = typeof STATE_IDLE | typeof STATE_UPGRADING | typeof STATE_MOVING

function getStateUpdater(creep: TCreep) {
  const updateState = (value: string) => () => {
    creep.memory.state = value
  }
  return updateState
}

// actions
type TDispatch = (event: TEvents) => void
function getEventDispatch(creep: TCreep) {
  const updateState = getStateUpdater(creep)
  const dispatchEvent = (event: TEvents) => {
    const possibleStates: Record<TEvents, Record<TStates, () => void>> = {
      'events/becomeIdle': {
        [STATE_IDLE]: updateState('idle'),
        [STATE_UPGRADING]: updateState('upgrading'),
        [STATE_MOVING]: updateState('moving')
      },
      'events/startUpgrading': {
        [STATE_IDLE]: updateState('idle'),
        [STATE_UPGRADING]: updateState('upgrading'),
        [STATE_MOVING]: updateState('moving')
      },
      'events/moveToController': {
        [STATE_IDLE]: updateState('idle'),
        [STATE_UPGRADING]: updateState('upgrading'),
        [STATE_MOVING]: updateState('moving')
      }
    }
    const callbackFn = possibleStates[event][creep.memory.state as TStates]
    callbackFn()
  }

  return dispatchEvent
}

type TActionArr = ((creep: TCreep, dispatch: TDispatch) => void)[]

function getActionCaller(creep: TCreep, dispatch: TDispatch) {
  const callActions = (actions: TActionArr) => {
    actions.forEach((action) => action(creep, dispatch))
  }
  return callActions
}

function startUpgrade(creep: TCreep, dispatch: TDispatch) {
  const controller = creep.room.controller as StructureController
  const controllerLevel = controller.level
  const isMaxLevel = controllerLevel === MAX_CONTROLLER_LEVEL
  if (!isMaxLevel) {
    creep.memory.currentControllerLevel = controllerLevel
    dispatch('events/startUpgrading')
  }
}

function upgradeController(creep: TCreep, dispatch: TDispatch) {
  const controller = creep.room.controller as StructureController
  const isInRange = creep.pos.inRangeTo(controller, 3)
  if (isInRange) {
    creep.upgradeController(controller)
    return console.log(`${creep.name} upgrading controller 🛠`)
  }
  return dispatch('events/moveToController')
}

function moveToController(creep: TCreep, dispatch: TDispatch) {
  const controller = creep.room.controller as StructureController
  const isInRange = creep.pos.inRangeTo(controller, 3)
  const hasEnergy = creep.store[RESOURCE_ENERGY] > 0
  if (!hasEnergy) {
    console.log(`${creep.name} needs energy ⛔ ⚡`)
    return dispatch('events/becomeIdle')
  }

  if (isInRange) {
    return dispatch('events/startUpgrading')
  }
  console.log(`${creep.name} moving to controller 💨`)
  creep.moveTo(controller, { visualizePathStyle: { stroke: '#ff0000' } })
}

function becomeIdle(creep: TCreep, dispatch: TDispatch) {
  const controller = creep.room.controller as StructureController
  const controllerLevel = controller.level
  const prevControllerLevel = (creep.memory.currentControllerLevel ??
    -1) as number
  const isDone = controllerLevel > prevControllerLevel

  if (isDone) {
    console.log(`${creep.name} is idling 💤`)
    return dispatch('events/becomeIdle')
  }
}

const roleUpgrader = {
  run: function (creep: TCreep) {
    const dispatch = getEventDispatch(creep)
    const callActions = getActionCaller(creep, dispatch)
    const actionList: Record<TStates, TActionArr> = {
      [STATE_IDLE]: [startUpgrade],
      [STATE_UPGRADING]: [upgradeController, becomeIdle],
      [STATE_MOVING]: [moveToController]
    }
    const actions: TActionArr = actionList[creep.memory.state as TStates]
    callActions(actions)
  }
}

export default roleUpgrader
