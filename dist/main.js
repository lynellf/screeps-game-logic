'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const roleBuilder = {
    run: function (creep) {
        if (creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
            creep.say('🚧 build');
        }
        if (creep.memory.building) {
            const targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (targets.length) {
                if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
            }
        }
        else {
            const sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};

const roleHarvester = {
    run: function (creep) {
        if (creep.store.getFreeCapacity() > 0) {
            const sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
        else {
            const targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
            }
        }
    }
};

// States
const STATE_IDLE = 'idle';
const STATE_UPGRADING = 'upgrading';
const STATE_MOVING = 'moving';
// Role Types
const ROLE_HARVESTER = 'harvester';
const ROLE_BUILDER = 'builder';
const ROLE_UPGRADER = 'upgrader';
const ROLES = {
    [ROLE_HARVESTER]: [WORK, CARRY, MOVE],
    [ROLE_BUILDER]: [WORK, CARRY, MOVE],
    [ROLE_UPGRADER]: [WORK, CARRY, MOVE]
};
// Game Rules
const MAX_CONTROLLER_LEVEL = 8;

function getStateUpdater(creep) {
    const updateState = (value) => () => {
        creep.memory.state = value;
    };
    return updateState;
}
function getEventDispatch(creep) {
    const updateState = getStateUpdater(creep);
    const dispatchEvent = (event) => {
        const possibleStates = {
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
        };
        const callbackFn = possibleStates[event][creep.memory.state];
        callbackFn();
    };
    return dispatchEvent;
}
function getActionCaller(creep, dispatch) {
    const callActions = (actions) => {
        actions.forEach((action) => action(creep, dispatch));
    };
    return callActions;
}
function startUpgrade(creep, dispatch) {
    const controller = creep.room.controller;
    const controllerLevel = controller.level;
    const isMaxLevel = controllerLevel === MAX_CONTROLLER_LEVEL;
    if (!isMaxLevel) {
        creep.memory.currentControllerLevel = controllerLevel;
        dispatch('events/startUpgrading');
    }
}
function upgradeController(creep, dispatch) {
    const controller = creep.room.controller;
    const isInRange = creep.pos.inRangeTo(controller, 3);
    if (isInRange) {
        creep.upgradeController(controller);
        return console.log(`${creep.name} upgrading controller 🛠`);
    }
    return dispatch('events/moveToController');
}
function moveToController(creep, dispatch) {
    const controller = creep.room.controller;
    const isInRange = creep.pos.inRangeTo(controller, 3);
    const hasEnergy = creep.store[RESOURCE_ENERGY] > 0;
    if (!hasEnergy) {
        console.log(`${creep.name} needs energy ⛔ ⚡`);
        return dispatch('events/becomeIdle');
    }
    if (isInRange) {
        return dispatch('events/startUpgrading');
    }
    console.log(`${creep.name} moving to controller 💨`);
    creep.moveTo(controller, { visualizePathStyle: { stroke: '#ff0000' } });
}
function becomeIdle(creep, dispatch) {
    var _a;
    const controller = creep.room.controller;
    const controllerLevel = controller.level;
    const prevControllerLevel = ((_a = creep.memory.currentControllerLevel) !== null && _a !== void 0 ? _a : -1);
    const isDone = controllerLevel > prevControllerLevel;
    if (isDone) {
        console.log(`${creep.name} is idling 💤`);
        return dispatch('events/becomeIdle');
    }
}
const roleUpgrader = {
    run: function (creep) {
        const dispatch = getEventDispatch(creep);
        const callActions = getActionCaller(creep, dispatch);
        const actionList = {
            [STATE_IDLE]: [startUpgrade],
            [STATE_UPGRADING]: [upgradeController, becomeIdle],
            [STATE_MOVING]: [moveToController]
        };
        const actions = actionList[creep.memory.state];
        callActions(actions);
    }
};

const settings = {
    spawnName: 'HomeBase'
};
const defaultTask = (creep) => { var _a; return console.warn(`No task for role ${(_a = creep.memory) === null || _a === void 0 ? void 0 : _a.role}`); };
function performDuties(creeps) {
    const creepList = Object.entries(creeps);
    creepList.forEach(([_name, creep]) => {
        var _a;
        const tasks = {
            [ROLE_HARVESTER]: roleHarvester.run,
            [ROLE_BUILDER]: roleBuilder.run,
            [ROLE_UPGRADER]: roleUpgrader.run
        };
        const task = (_a = tasks === null || tasks === void 0 ? void 0 : tasks[creep.memory.role]) !== null && _a !== void 0 ? _a : defaultTask;
        task(creep);
    });
}
function removeDeadCreeps(creeps) {
    const creepNames = Object.keys(creeps);
    creepNames.forEach((name) => {
        const isAlive = creeps[name] !== undefined && creeps[name] !== null;
        if (!isAlive) {
            delete Memory.creeps[name];
        }
    });
}
function getCreepCreator(spawnName) {
    const createCreep = (role) => {
        var _a, _b;
        const newName = `${role}_${Game.time}`;
        const bodyParts = (_a = ROLES[role]) !== null && _a !== void 0 ? _a : [];
        console.log(`Spawning new ${role}: ${newName}`);
        (_b = Game.spawns[spawnName]) === null || _b === void 0 ? void 0 : _b.spawnCreep(bodyParts, newName, {
            memory: { role, state: STATE_IDLE }
        });
    };
    return createCreep;
}
function getAutoSpawner(creeps, spawnName) {
    const createCreep = getCreepCreator(spawnName);
    const autoSpawnCreeps = (role, min = 2) => {
        const totalCreeps = Object.entries(creeps).filter(([_name, creep]) => creep.memory.role === role).length;
        if (totalCreeps < min) {
            createCreep(role);
        }
    };
    return autoSpawnCreeps;
}
function printSpawnerStatus(spawnName, creeps) {
    var _a, _b, _c;
    if ((_b = (_a = Game.spawns) === null || _a === void 0 ? void 0 : _a[spawnName]) === null || _b === void 0 ? void 0 : _b.spawning) {
        const creepName = (_c = Game.spawns[spawnName].spawning) === null || _c === void 0 ? void 0 : _c.name;
        if (creepName) {
            const spawningCreep = creeps[creepName];
            Game.spawns[spawnName].room.visual.text('🛠️' + spawningCreep.memory.role, Game.spawns[spawnName].pos.x + 1, Game.spawns[spawnName].pos.y, { align: 'left', opacity: 0.8 });
        }
    }
}
function loop() {
    const { spawnName } = settings;
    const creeps = Game.creeps;
    const autoSpawnCreeps = getAutoSpawner(creeps, spawnName);
    // perform tasks based on role
    performDuties(creeps);
    // removing dead creeps from memory
    removeDeadCreeps(creeps);
    // spawn new harvesters if needed
    autoSpawnCreeps(ROLE_HARVESTER, 2);
    autoSpawnCreeps(ROLE_BUILDER, 1);
    autoSpawnCreeps(ROLE_UPGRADER, 1);
    // print status when creeps are spawning?
    printSpawnerStatus(spawnName, creeps);
}

exports.loop = loop;
//# sourceMappingURL=main.js.map
