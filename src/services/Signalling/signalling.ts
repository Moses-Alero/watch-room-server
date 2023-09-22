// setting up the communicating channel between the two webRTC peers

import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { events } from '../Socket/socket-events';
import { KurentoSession } from '../Kurento/kurento';

const mediaSessions = new Map<string, KurentoSession>();

/*
    The signalling channel is the channel through which the two peers communicate with each other.
    It is used to exchange information about the session, such as the SDP offer and answer, ICE candidates,
    and so on. The signalling channel is not part of the WebRTC API and must be implemented by the application.
    The signalling channel can be implemented using a variety of methods, such as WebSockets, HTTP, or SIP.
    In this case, we will use socket.io to implement the signalling channel.
    
    @params {Server} io - the socket.io server instance

*/
export class SignallingChannel {
  socket: Socket<DefaultEventsMap>;

  constructor(socket: Socket<DefaultEventsMap>, roomName: string) {
    this.socket = socket;
    const existingSession = mediaSessions.get(roomName);
    if (existingSession) {
      this.kurentoSession = existingSession;
    } else {
      const newKurentoSession = new KurentoSession();
      mediaSessions.set(roomName, newKurentoSession);
      this.kurentoSession = newKurentoSession;
    }

    socket.on(events.CONNECTION, <T>(data: T) => {
      console.log(`connection received with session ID ${socket.id}`);
    });

    socket.on('connect_error', (err) => {
      console.log(`error in signalling channel ${socket.id}: ${err}`);
      // stop connection

      this.kurentoSession.stopSession(socket.id);
    });

    socket.on(events.DISCONNECT, () => {
      console.log(
        `disconnected from signalling channel sessionID: ${socket.id}`
      );
      // stop connection
      this.kurentoSession.stopSession(socket.id);
    });

    this.init();
  }

  private kurentoSession: KurentoSession;

  private async init() {
    this.socket.on('presenter', (message) => {
      this.kurentoSession.startPresenter(
        this.socket.id,
        this.socket,
        message.sdpOffer,
        (err: any, sdpAnswer: any) => {
          console.log('ans', sdpAnswer);

          this.eventResponse(err, sdpAnswer, 'presenterResponse');
        }
      );
    });

    this.socket.on('viewer', (message) => {
      this.kurentoSession.startViewer(
        this.socket.id,
        this.socket,
        message.sdpOffer,
        (err: any, sdpAnswer: any) => {
          this.eventResponse(err, sdpAnswer, 'viewerResponse');
        }
      );
    });

    this.socket.on('onIceCandidate', (message) => {
      this.kurentoSession.onIceCandidate(this.socket.id, message.candidate);
    });

    this.socket.on('stop', (message) => {
      this.kurentoSession.stopSession(this.socket.id);
    });
  }

  private eventResponse(
    err: any,
    sdpAnswer: any,
    responseEvent: 'presenterResponse' | 'viewerResponse'
  ) {
    if (err) {
      console.log(err);
      return this.socket.emit('error', {
        response: 'rejected',
        message: err,
      });
    }

    this.socket.emit(responseEvent, {
      response: 'accepted',
      message: 'success',
      sdpAnswer,
    });
  }
}
