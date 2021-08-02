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

const roleUpgrader = {
    run: function (creep) {
        if (creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
            creep.say('🔄 harvest');
        }
        if (!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
            creep.say('⚡ upgrade');
        }
        if (creep.memory.upgrading) {
            if (creep.room.controller) {
                const res = creep.upgradeController(creep.room.controller);
                const isInRange = res !== ERR_NOT_IN_RANGE;
                if (isInRange) {
                    creep.moveTo(creep.room.controller, {
                        visualizePathStyle: { stroke: '#ffffff' }
                    });
                }
            }
        }
        else {
            var sources = creep.room.find(FIND_SOURCES);
            if (creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], { visualizePathStyle: { stroke: '#ffaa00' } });
            }
        }
    }
};

const HARVESTER = 'harvester';
const BUILDER = 'builder';
const UPGRADER = 'upgrader';
const ROLES = {
    [HARVESTER]: [WORK, CARRY, MOVE],
    [BUILDER]: [WORK, CARRY, MOVE],
    [UPGRADER]: [WORK, CARRY, MOVE]
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
            [HARVESTER]: roleHarvester.run,
            [BUILDER]: roleBuilder.run,
            [UPGRADER]: roleUpgrader.run
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
        const newName = `${role} + Game.time`;
        const bodyParts = (_a = ROLES[role]) !== null && _a !== void 0 ? _a : [];
        console.log('Spawning new harvester: ' + newName);
        (_b = Game.spawns[spawnName]) === null || _b === void 0 ? void 0 : _b.spawnCreep(bodyParts, newName, { memory: { role } });
    };
    return createCreep;
}
function getAutoSpawner(creeps, spawnName) {
    const createCreep = getCreepCreator(spawnName);
    const autoSpawnCreeps = (role, min = 2) => {
        const totalCreeps = Object.entries(creeps).filter(([_name, creep]) => creep.memory.role == role).length;
        if (totalCreeps < min) {
            createCreep(role);
        }
    };
    return autoSpawnCreeps;
}
function printSpawnerStatus(spawnName, creeps) {
    var _a;
    if (Game.spawns[spawnName].spawning) {
        const creepName = (_a = Game.spawns[spawnName].spawning) === null || _a === void 0 ? void 0 : _a.name;
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
    autoSpawnCreeps(HARVESTER, 2);
    autoSpawnCreeps(BUILDER, 1);
    autoSpawnCreeps(UPGRADER, 1);
    // print status when creeps are spawning?
    printSpawnerStatus(spawnName, creeps);
}

exports.loop = loop;
//# sourceMappingURL=main.js.map
