import { Server } from 'socket.io';
import kurento, { WebRtcEndpoint, MediaPipeline } from 'kurento-client';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2), {
  default: {
    as_uri: 'http://localhost:8080/',
    ws_uri: 'ws://localhost:8888/kurento',
  },
});

interface Viewers {
  webRtcEndpoint: WebRtcEndpoint;
  io: Server;
}

interface IPresenter {
  id: string;
  pipeline: MediaPipeline | null;
  webRtcEndpoint: WebRtcEndpoint | null;
}
type Presenter = IPresenter | null;

/*
    instantiates a new KurentoClient object used to connect to the Kurento Media Server
    and start a WebRTC session
*/

export class KurentoSession {
  private kurentoClient: any = null;
  private presenter: Presenter = null;
  private viewers = new Map<string, Viewers>();
  private readonly noPresenterMessage =
    'No active presenter. Try again later...';
  private candidatesQueue = {} as any;

  public startPresenter = (
    sessionId: string,
    io: Server,
    sdpOffer: any,
    cb: Function
  ) => {
    this.clearCandidatesQueue(sessionId);

    if (this.presenter !== null) {
      this.stopSession(sessionId);
      return cb(
        'Another user is currently acting as presenter. Try again later ...'
      );
    }

    this.presenter = {
      id: sessionId,
      pipeline: null,
      webRtcEndpoint: null,
    };

    this.getKurentoClient((error: any, kurentoClient: any) => {
      if (error) {
        this.stopSession(sessionId);
        return cb(error);
      }

      if (this.presenter === null) {
        this.stopSession(sessionId);
        return cb(this.noPresenterMessage);
      }
      kurentoClient.create(
        'MediaPipeline',
        async (error: any, pipeline: MediaPipeline) => {
          if (error) {
            this.stopSession(sessionId);
            return cb(error);
          }

          if (this.presenter === null) {
            this.stopSession(sessionId);
            return cb(this.noPresenterMessage);
          }

          this.presenter.pipeline = pipeline;
          const _webRtcEndpoint: WebRtcEndpoint = await pipeline
            .create('WebRtcEndpoint', {})
            .catch((err) => {
              this.stopSession(sessionId);
              return cb(err);
            });

          if (this.presenter === null) {
            this.stopSession(sessionId);
            return cb(this.noPresenterMessage);
          }

          this.presenter.webRtcEndpoint = _webRtcEndpoint;

          if (this.candidatesQueue[sessionId]) {
            while (this.candidatesQueue[sessionId].length) {
              const candidate = this.candidatesQueue[sessionId].shift();
              _webRtcEndpoint.addIceCandidate(candidate);
            }
          }

          _webRtcEndpoint.on(
            'IceCandidateFound',
            function (event: { candidate: any }) {
              const candidate = kurento.getComplexType('IceCandidate')(
                event.candidate
              );
              io.emit('iceCandidate', candidate);
            }
          );

          _webRtcEndpoint.processOffer(
            sdpOffer,
            (error: any, sdpAnswer: any) => {
              if (error) {
                this.stopSession(sessionId);
                return cb(error);
              }

              if (this.presenter === null) {
                this.stopSession(sessionId);
                return cb(this.noPresenterMessage);
              }

              cb(null, sdpAnswer);
            }
          );

          _webRtcEndpoint.gatherCandidates((error: any) => {
            if (error) {
              this.stopSession(sessionId);
              return cb(error);
            }
          });
        }
      );
    });
  };

  public startViewer = (
    sessionId: string,
    io: Server,
    sdpOffer: any,
    cb: Function
  ) => {
    // clear candidates queue for viewer session
    this.clearCandidatesQueue(sessionId);
    // check if presenter is null
    if (this.presenter === null) {
      this.stopSession(sessionId);
      return cb(this.noPresenterMessage);
    }
    this.presenter.pipeline
      ?.create('WebRtcEndpoint')
      .catch((err) => {
        this.stopSession(sessionId);
        return cb(err);
      })
      .then((webRtcEndpoint: WebRtcEndpoint) => {
        // add viewer to map
        this.viewers.set(sessionId, { webRtcEndpoint, io });

        if (this.presenter === null) {
          this.stopSession(sessionId);
          return cb(this.noPresenterMessage);
        }

        if (this.candidatesQueue[sessionId]) {
          while (this.candidatesQueue[sessionId].length) {
            const candidate = this.candidatesQueue[sessionId].shift();
            webRtcEndpoint.addIceCandidate(candidate);
          }
        }

        // listen for IceCandidateFound event
        webRtcEndpoint.on('IceCandidateFound', (event: { candidate: any }) => {
          const candidate = kurento.getComplexType('IceCandidate')(
            event.candidate
          );
          io.emit('iceCandidate', candidate);
        });

        // process offer
        webRtcEndpoint.processOffer(sdpOffer, (error: any, sdpAnswer: any) => {
          if (error) {
            this.stopSession(sessionId);
            return cb(error);
          }

          if (this.presenter === null) {
            this.stopSession(sessionId);
            return cb(this.noPresenterMessage);
          }

          // connect webRtcEndpoint to presenter's webRtcEndpoint
          this.presenter.webRtcEndpoint?.connect(
            webRtcEndpoint,
            (error: any) => {
              if (error) {
                this.stopSession(sessionId);
                return cb(error);
              }
              cb(null, sdpAnswer);
              webRtcEndpoint.gatherCandidates((error: any) => {
                if (error) {
                  this.stopSession(sessionId);
                  return cb(error);
                }
              });
            }
          );
        });
      });
  };

  public stopSession = (sessionId: string) => {
    if (this.presenter !== null && this.presenter.id == sessionId) {
      const viewers = this.getViewers(this.viewers.values());
      for (var i in viewers) {
        var viewer = viewers[i];
        if (viewer.io) {
          viewer.io.emit('stopCommunication'); //should send to only viewers in a particular room
        }
      }
      if (this.presenter.pipeline) this.presenter.pipeline.release();
      this.presenter = null;
      this.viewers = new Map<string, Viewers>();
    } else if (this.viewers.get(sessionId)) {
      this.viewers.get(sessionId)?.webRtcEndpoint.release();
      this.viewers.delete(sessionId);
    }

    this.clearCandidatesQueue(sessionId);

    if (this.getViewers(this.viewers.values()).length < 1 && !this.presenter) {
      console.log('Closing kurento client');
      this.kurentoClient.close();
      this.kurentoClient = null;
    }
  };

  public onIceCandidate = (sessionId: string, _candidate: RTCIceCandidate) => {
    const candidate = kurento.getComplexType('IceCandidate')(_candidate);

    if (
      this.presenter &&
      this.presenter.id === sessionId &&
      this.presenter.webRtcEndpoint
    ) {
      console.info('Sending presenter candidate');
      this.presenter.webRtcEndpoint.addIceCandidate(candidate);
    } else if (
      this.viewers.get(sessionId) &&
      this.viewers.get(sessionId)?.webRtcEndpoint
    ) {
      console.info('Sending viewer candidate');
      this.viewers.get(sessionId)?.webRtcEndpoint.addIceCandidate(candidate);
    } else {
      console.info('Queueing candidate');
      if (!this.candidatesQueue[sessionId]) {
        this.candidatesQueue[sessionId] = [];
      }
      this.candidatesQueue[sessionId].push(candidate);
    }
  };

  public async getKurentoClient(cb: Function) {
    if (this.kurentoClient !== null) {
      return cb(null, this.kurentoClient);
    }
    const _kurentoClient = await kurento(argv.ws_uri, {
      duplicates_timeout: 9000,
      failAfter: 9000,
      request_timeout: 9000,
      response_timeout: 9000,
    }).catch((err) => {
      console.log('Could not find media server at address ' + argv.ws_uri);
      return cb(err);
    });
    console.log(_kurentoClient);

    this.kurentoClient = _kurentoClient;
    cb(null, this.kurentoClient);
  }

  private clearCandidatesQueue = (sessionId: string) => {
    if (this.candidatesQueue[sessionId]) {
      delete this.candidatesQueue[sessionId];
    }
  };

  protected getViewers = (viewers: IterableIterator<Viewers>) => {
    const viewersArray = [];
    for (const viewer of viewers) {
      viewersArray.push(viewer);
    }
    return viewersArray;
  };
}
