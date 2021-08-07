type TRoomCtx = {
  id: string;
  energyAvailable: number;
  extensions: number;
  controllerLevel: number;
  spawnRatio: [number, number];
  units: {
    workers: number;
    combat: {
      physical: number;
      ranged: number;
      total: number
    };
  };
};

type TGameCtx = {
  rooms: TRoomCtx[];
};

const INITIAL_CTX: TGameCtx = {
  rooms: [{
    id: '0',
    energyAvailable: 6000,
    extensions: 0,
    controllerLevel: 0,
    spawnRatio: [1, 0],
    units: {
      workers: 0,
      combat: {
        physical: 0,
        ranged: 0,
        total: 0
      }
    }
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
  const byExtension = getByStructureType('extension');
  const byController = getByStructureType('controller');

  // unit queries
  const byWorker = getByBodyPart('WORKER');
  const byPhysical = getByBodyPart('ATTACK');
  const byRanged = getByBodyPart('RANGED_ATTACK');

  const id = room.name;
  const energyAvailable = room.find(105).reduce((sum, resource) => (resource.energy + sum), 0)
  const extensions = room.find(108).filter(byExtension).length
  const controller = room.find(108).find(byController) as StructureController
  const controllerLevel = controller.level
  const units = room.find(FIND_MY_CREEPS)
  const workers = units.filter(byWorker).length
  const ranged = units.filter(byRanged).length
  const physical = units.filter(byPhysical).length
  const total = ranged + physical
  const combat = {
    physical,
    ranged,
    total
  }
  const spawnRatio = SPAWN_RATIOS[controllerLevel] || [1, 0]
  return {
    id,
    energyAvailable,
    extensions,
    controllerLevel,
    spawnRatio,
    units: {
      workers,
      combat
    }
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
}