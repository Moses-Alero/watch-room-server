import { Namespace, Server, Socket } from 'socket.io';
import { events } from '../Socket/socket-events';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Connection, Room } from '../../utils';
import { RoomUser } from './roomUser';
import { SignallingChannel } from '../Signalling/signalling';

export const roomInfo = new Map<string, Room>();
const users = new Map<string, RoomUser>();
const candidates = new Map<string, RTCIceCandidate[]>();

export class WatchRoom {
  io: Server;

  constructor(io: Server, roomName: string) {
    this.io = io;
    io.of(`/${roomName}`).on('connection', (socket) => {
      console.log(`user with id ${socket.id} connected to room ${roomName}`);
      this.socket = socket;
      const sigChannel = new SignallingChannel(socket);
      socket.on(events.DISCONNECT, (reason) => {
        console.log(
          `a user with id ${socket.id} disconnected from room ${roomName} due to ${reason}`
        );
      });
    });

    this.init(this.socket);
  }
  private socket!: Socket<DefaultEventsMap>;
  private init(socket: Socket<DefaultEventsMap>) {}

  public getRoomInfo() {
    return roomInfo.get('Room 1');
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
  // leave room
  // view room participants

  //#region public methods

  //#endregion
}
