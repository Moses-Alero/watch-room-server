import { Server, Socket } from 'socket.io';
import { events } from '../socket/socket-events';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  names,
  Config,
} from 'unique-names-generator';
import { Room, User } from '../utils';

export const rooms = new Map<string, Room>();
const users = new Map<string, User>();

export class WatchRoom {
  io: Server;
  roomId: string;
  user: User;
  constructor(io: Server, roomId?: string, user?: User) {
    this.io = io;
    this.roomId = roomId || '';
    this.user = user || {
      id: '',
      username: '',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      banned: false,
      muted: false,
    };
    this.io.of('/watch-room').on('connection', (socket) => {
      if (socket) {
        console.log(`watch-room connected to by user with id: ${socket.id}`);

        users.set(socket.id, this.user);
        this.socket = socket;
        this.init();

        socket.on(events.DISCONNECT, () => {
          this.deleteAllRoomsCreatedByUser(socket.id);
        });
      }
    });
  }

  private config: Config = {
    dictionaries: [adjectives, colors, names],
    separator: ' ',
    style: 'lowerCase',
  };
  private username = uniqueNamesGenerator(this.config);

  private socket!: Socket<DefaultEventsMap>;

  private init() {
    ///receive username from client
    this.socket.on(events.CREATE_ROOM, (room: Room, cb: Function) => {
      this.socket.join(room.id);
      cb(this.createRoom(room));
    });

    // also receive username from client
    this.socket.on(events.JOIN_ROOM, ({ roomId, userId }, cb: Function) => {
      cb(this.joinRoom(roomId, userId));
    });

    this.socket.on(events.GET_ROOMS, (cb: Function) => {
      cb(this.getRooms());
    });

    this.socket.on(events.LEAVE_ROOM, ({ roomId, userId }, cb: Function) => {
      cb(this.leaveRoom(roomId, userId));
    });

    this.socket.on(events.DELETE_ROOM, (roomId: string, cb: Function) => {
      cb(this.deleteRoom(roomId));
    });
  }

  //#region public methods
  public createRoom(room: Room) {
    room.id = this.generateRoomId();
    room.users = [];
    const user = users.get(this.socket.id);
    room.users.push({ ...user!, id: this.socket.id, username: this.username });
    rooms.set(room.id, room);
    return 'Room created';
  }

  public joinRoom(roomId: string, userId: string) {
    const room = rooms.get(roomId);
    if (!room) {
      return "Room doesn't exist";
    }
    room.users.push({ id: userId, username: '' });
    this.socket.join(roomId);
    return 'User joined room';
  }

  public leaveRoom(roomId: string, userId: string) {
    const room = rooms.get(roomId);
    if (!room) {
      return "Room doesn't exist";
    }
    if (room.owner === userId) {
      this.transferRoomOwnership(roomId);
    }
    room.users = room.users.filter((user) => user.id !== userId);
    this.socket.leave(roomId);
    return 'User left room';
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

  private deleteRoom(roomId: string) {
    rooms.delete(roomId);
    return 'Room deleted';
  }

  private transferRoomOwnership(roomId: string) {
    const room = rooms.get(roomId);
    if (room) {
      if (room.users.length > 1) {
        room.owner = room.users[1].id;
      } else {
        this.deleteRoom(roomId);
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