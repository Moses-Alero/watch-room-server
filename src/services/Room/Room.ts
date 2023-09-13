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
    
  }

  // create new Room
  // join room
  // leave room
  // view room participants
  

  //#region public methods
  
  //#endregion
}
