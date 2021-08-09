import type { TAssignment, TCreep } from '@utils/typedefs'
export type TRoomCtx = {
  id: string;
  energyAvailable: number;
  extensions: number;
  controllerLevel: number;
  canUpgradeController: boolean;
  spawnRatio: [number, number];
  units: {
    workers: number;
    total: number;
    combat: {
      physical: number;
      ranged: number;
    };
  };
  transferTargets: {
    spawn: number;
    controller: number;
  };
  unitMemory: Array<Record<string, unknown>>;
};

export type TGameCtx = {
  rooms: TRoomCtx[];
};

const INITIAL_CTX: TGameCtx = {
  rooms: [{
    id: '0',
    energyAvailable: 6000,
    extensions: 0,
    controllerLevel: 0,
    spawnRatio: [1, 0],
    canUpgradeController: false,
    units: {
      workers: 0,
      combat: {
        physical: 0,
        ranged: 0
      },
      total: 0
    },
    transferTargets: {
      spawn: 0,
      controller: 0
    },
    unitMemory: []
  }]
}

// ratio of workers to combat units
const SPAWN_RATIOS: Record<number, [number, number]> = {
  0: [1, 0],
  1: [1, 0],
  2: [1, 0],
  3: [1, 0],
  4: [1, 0],
  5: [1, 0],
  6: [1, 0],
  7: [1, 0],
  8: [1, 0],
}
function getByTransferTarget(query: TAssignment) {
  return (unit: Creep) => (unit as TCreep).memory.transferTarget === query;
}
function getByStructureType (structureType: string) {
  return (structure: AnyOwnedStructure) =>
    structure.structureType === structureType;
}

function getByBodyPart(bodyPart: string) {
  return (unit: Creep) => unit.body.some(part => part.type === bodyPart);
}

function getCtx(storage: RawMemory): TGameCtx {
  const ctx: TGameCtx = JSON.parse(storage.get()) || INITIAL_CTX;
  return ctx;
}

function setCtx(storage: RawMemory, ctx: TGameCtx) {
  storage.set(JSON.stringify(ctx));
}

function getRawRooms(game: Game) {
  return Object.entries(game.rooms).map(([_name, room]) => room)
}

function getRoomCtx(room: Room) {
  // structure queries
  const structByExtension = getByStructureType('extension');
  const structByController = getByStructureType('controller');

  // unit queries
  const unitByWorker = getByBodyPart('work');
  const unitByPhysical = getByBodyPart('attack');
  const unitByRanged = getByBodyPart('ranged_attack');

  // transfer target queries
  const unitBySpawn = getByTransferTarget('spawn');
  const unitByController = getByTransferTarget('controller');

  const id = room.name;
  const resources = room.find(105);
  const energyAvailable = resources.reduce((sum, resource) => (resource.energy + sum), 0)

  const structures = room.find(108);
  const extensions = structures.filter(structByExtension).length
  const controller = structures.find(structByController) as StructureController
  const controllerLevel = controller.level

  const units = room.find(102)
  const workers = units.filter(unitByWorker).length
  const ranged = units.filter(unitByRanged).length
  const physical = units.filter(unitByPhysical).length
  const total = ranged + physical + workers
  const combat = {
    physical,
    ranged,
  }
  const spawnRatio = SPAWN_RATIOS[controllerLevel] || [1, 0]
  const unitsAssignedToSpawn = units.filter(unitBySpawn).length
  const unitsAssignedToController = units.filter(unitByController).length
  const { progress, progressTotal } = controller
  const canUpgradeController = progress / progressTotal >= 1

  return {
    id,
    energyAvailable,
    extensions,
    controllerLevel,
    spawnRatio,
    canUpgradeController,
    units: {
      workers,
      combat,
      total
    },
    transferTargets: {
      spawn: unitsAssignedToSpawn,
      controller: unitsAssignedToController
    },
    unitMemory: [],
  }
}


export default function GameManager(game: Game, storage: RawMemory) {
  let ctx = getCtx(storage);
  const rawRooms = getRawRooms(game);
  const rooms = rawRooms.map(getRoomCtx);
  ctx = {
    rooms
  }
  setCtx(storage, ctx);

  const fetchCtx = () => ctx;
  function unitMemFactory(roomCtx: TRoomCtx) {
    return (unitName: string) => (record: Record<string, unknown>) => {
      let memItem = roomCtx.unitMemory.find((item) => item.name === unitName);
      if (memItem) {
        memItem = record
      } else {
        roomCtx.unitMemory.push({
          name: unitName,
          [key]: value,
        });
      }

      setCtx(storage, ctx);
    };
  }
  
  return [fetchCtx, unitMemFactory] as const;
}