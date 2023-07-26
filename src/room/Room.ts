import { Server, Socket } from 'socket.io';
import { events } from '../socket/socket-events';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Room } from '../utils';

export const rooms = new Map<string, Room>();

export class WatchRoom {
  io: Server;
  roomId: string;

  constructor(io: Server, roomId?: string) {
    this.io = io;
    this.roomId = roomId || '';

    this.io.of('/watch-room').on('connection', (socket) => {
      if (socket) {
        console.log(`watch-room connected to by user with ${socket.id}`);
        this.socket = socket;
        this.init();

        socket.on(events.DISCONNECT, () => {
          this.deleteAllRoomsCreatedByUser(socket.id);
        });
      }
    });
  }

  private socket!: Socket<DefaultEventsMap>;

  private init() {
    this.socket.on(events.CREATE_ROOM, (room: Room, cb: Function) => {
      this.socket.join(room.id);
      cb(this.createRoom(room));
    });

    this.socket.on(events.JOIN_ROOM, ({ roomId, userId }, cb: Function) => {
      cb(this.joinRoom(roomId, userId));
    });

    this.socket.on(events.GET_ROOMS, (cb: Function) => {
      cb(this.getRooms());
    });
  }

  //#region public methods
  public createRoom(room: Room) {
    room.id = '1234'; //this.generateRoomId();
    room.users = [];
    room.users.push(room.owner);
    rooms.set(room.id, room);
    return 'Room created';
  }

  public joinRoom(roomId: string, userId: string) {
    const room = rooms.get(roomId);
    if (!room) {
      return "Room doesn't exist";
    }
    room.users.push(userId);
    this.socket.join(roomId);
    return 'User joined room';
  }
  //#endregion

  //#region private methods

  private getRooms() {
    const roomsArray = [];
    for (const room of rooms.values()) {
      roomsArray.push(room);
    }

    return roomsArray;
  }

  private removeRoom(roomId: string) {
    rooms.delete(roomId);
  }

  private transferRoomOwnership(roomId: string) {
    const room = rooms.get(roomId);
    if (room) {
      if (room.users.length > 1) {
        room.owner = room.users[1];
      } else {
        this.removeRoom(roomId);
      }
    }
  }

  private deleteAllRoomsCreatedByUser(userId: string) {
    console.log(`All rooms created by ${userId} are being deleted`);

    for (const room of rooms.values()) {
      if (room.owner === userId) {
        this.transferRoomOwnership(room.id);
      }
    }
  }

  private getRoomsCreatedByUser(userId: string) {
    const listOfRooms: Room[] = [];
    for (const list of rooms.values()) {
      if (list.owner === userId) {
        listOfRooms.push(list);
      }
    }
    console.log(rooms);

    return listOfRooms;
  }

  private generateRoomId() {
    let roomId = '';
    let possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 6; i++) {
      roomId += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return roomId;
  }
  //#endregion
}
