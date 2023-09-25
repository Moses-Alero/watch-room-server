import { Namespace, Server, Socket } from 'socket.io';
import { events } from '../Socket/socket-events';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Room } from '../../utils';
import { RoomUser } from './roomUser';
import { SignallingChannel } from '../Signalling/signalling';

export const roomInfo = new Map<string, Room>();
const users = new Map<string, RoomUser>();
const candidates = new Map<string, RTCIceCandidate[]>();

// Joining is basically connecting to the socket namespace

export class WatchRoom {
  io: Server;

  constructor(io: Server, roomName: string) {
    this.io = io;
    this.roomInfo = {
      roomName,
      createdAt: Date.now(),
      users: [],
    };

    io.of(`/${roomName}`).on('connection', (socket) => {
      console.log(`user with id ${socket.id} connected to room ${roomName}`);
      this.socket = socket;
      this.roomInfo.users.push(socket.id);
      new SignallingChannel(socket, roomName);

      socket.on(events.DISCONNECT, (reason) => {
        console.log(
          `a user with id ${socket.id} disconnected from room ${roomName} due to ${reason}`
        );
        // remove user from room
        this.roomInfo.users.splice(this.roomInfo.users.indexOf(socket.id), 1);
      });
    });

    this.init(this.socket);
  }

  private roomInfo: any;

  private socket!: Socket<DefaultEventsMap>;
  private init(socket: Socket<DefaultEventsMap>) {}

  public getRoomInfo() {
    return this.roomInfo;
  }

  public createRoom(roomName: string) {}

  // create new Room
  // join room
  public joinRoom() {}

  public connect(roomId: string) {
    // get room using room Id
    // the user must use te signalling channel for that room
    // join the room
  }
}
