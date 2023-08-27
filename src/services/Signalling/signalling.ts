// setting up the communicating channel between the two webRTC peers

import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { events } from '../Socket/socket-events';
import { KurentoClient } from '../Kurento/kurento';

/*
    The signalling channel is the channel through which the two peers communicate with each other.
    It is used to exchange information about the session, such as the SDP offer and answer, ICE candidates,
    and so on. The signalling channel is not part of the WebRTC API and must be implemented by the application.
    The signalling channel can be implemented using a variety of methods, such as WebSockets, HTTP, or SIP.
    In this case, we will use socket.io to implement the signalling channel.
    
    @params {Server} io - the socket.io server instance

*/
class SignallingChannel {
  io: Server;

  constructor(io: Server) {
    this.io = io;

    this.kurentoClient = new KurentoClient();

    this.io.on(events.CONNECTION, (socket) => {
      if (socket) {
        console.log(`connection received with session ID ${socket.id}`);

        this.socket = socket;

        socket.on('connect_error', (err) => {
          console.log(`error in signalling channel ${socket.id}: ${err}`);
          // stop connection
        });

        socket.on(events.DISCONNECT, () => {
          console.log(`disconnected from signalling channel ${socket.id}`);
          // stop connection
        });
      }
    });

    this.init();
  }

  private socket!: Socket<DefaultEventsMap>;
  private kurentoClient: KurentoClient;

  private init() {
    this.socket.on('presenter', (message) => {
      this.kurentoClient.startPresenter(
        this.socket.id,
        this.io,
        message.sdpOffer,
        (err: any, sdpAnswer: any) => {
          this.eventResponse(err, sdpAnswer, 'presenterResponse');
        }
      );
    });

    this.socket.on('viewer', (message) => {
      this.kurentoClient.startViewer(
        this.socket.id,
        this.io,
        message.sdpOffer,
        (err: any, sdpAnswer: any) => {
          this.eventResponse(err, sdpAnswer, 'viewerResponse');
        }
      );
    });

    this.socket.on('onIceCandidate', (message) => {
      this.kurentoClient.onIceCandidate(this.socket.id, message.candidate);
    });

    this.socket.on('stop', (message) => {
      this.kurentoClient.stopSession(this.socket.id);
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
