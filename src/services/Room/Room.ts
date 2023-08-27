import { Server, Socket } from 'socket.io';
import { events } from '../Socket/socket-events';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Connection, Room } from '../../utils';
import { RoomUser } from './roomUser';

export const rooms = new Map<string, Room>();
const users = new Map<string, RoomUser>();
const connections: Connection[] = [];
const candidates = new Map<string, RTCIceCandidate[]>();

export class WatchRoom {
  io: Server;

  constructor(io: Server) {
    this.io = io;

    this.io.of('/watch-room').on('connection', (socket) => {
      if (socket) {
        console.log(`watch-room connected to by user with id: ${socket.id}`);

        users.set(socket.id, new RoomUser(socket.id));

        this.socket = socket;
        this.init();

        socket.on(events.DISCONNECT, () => {
          users.delete(socket.id);
          this.deleteAllRoomsCreatedByUser(socket.id);
        });
      }
    });
  }

  private socket!: Socket<DefaultEventsMap>;

  private init() {
    this.socket.on(events.CREATE_ROOM, (room: Room, cb: Function) => {
      cb(this.createRoom(room));
    });

    this.socket.on(events.JOIN_ROOM, (userId, cb: Function) => {
      cb(this.joinRoom(userId));
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

    this.socket.on('offer', ({ clientId, description }, cb: Function) => {
      connections.push({
        id: clientId,
        socketId: this.socket.id,
        description,
      });

      console.log('connections', connections);
    });

    this.socket.on('send-answer', ({ clientId, description }, cb) => {
      // here we are sending the answer to the client who sent the offer
      this.io
        .of('/watch-room')
        .timeout(1000)
        .to(connections[0].socketId)
        .emit('answer', description);
      cb(JSON.stringify(clientId, description));
    });

    this.socket.on('ice-candidate', ({ clientId, candidate }, cb) => {
      const candidateExists = candidates.get(clientId);
      if (candidateExists) {
        candidateExists.push(candidate);
      } else {
        candidates.set(clientId, []);
        candidates.get(clientId)?.push(candidate);
      }
      const { roomsArray } = this.getRooms();
      if (roomsArray[0]) {
        this.socket.to(roomsArray[0].id).emit('new-ice-candidate', candidate);
      }
    });
  }

  //#region public methods
  public createRoom(room: Room) {
    room.id = this.generateRoomId();
    this.socket.join(room.id);
    room.users = [];
    const user = users.get(this.socket.id);
    room.users.push(user!);
    rooms.set(room.id, room);
    return 'Room created';
  }

  public joinRoom(userId: string) {
    // const room = rooms.get(roomId);
    // if (!room) {
    //   return "Room doesn't exist";
    // }
    console.log('user socket id', userId);

    const { roomsArray } = this.getRooms();
    const user = users.get(userId);
    roomsArray[0].users.push(user!);
    this.socket.join(roomsArray[0].id);

    this.io
      .of('/watch-room')
      .to(userId)
      .timeout(1000)
      .emit('answer', connections[0].description);
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
  public getRooms() {
    const roomsArray = [];
    for (const room of rooms.values()) {
      roomsArray.push(room);
    }
    return { roomsArray };
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

  private playVideo() {}

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
