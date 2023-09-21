import { Server } from 'socket.io';
import { Express, Response } from 'express';
import { router as roomRouter } from '../services/Room/room.routes';
import { ISocketRequest } from '../utils';
export const routeInitializer = (app: Express, io?: Server) => {
  const api_prefix = '/api/v1';
  app.get('/', (req, res) => {
    res.send({ name: 'Watch Party...' });
  });
  app.get(`${api_prefix}/health-check`, async (req, res) => {
    try {
      res.status(200).send({ status: 'ok' });
    } catch (e) {
      console.error(e);
      res.status(500).send();
    }
  });

  const watchRoomNameSpace = io?.of('/watch-room');

  const WatchRoomMiddleware = (
    req: ISocketRequest,
    _res: Response,
    next: Function
  ) => {
    req.io = io;
    req.namespace = watchRoomNameSpace;

    next();
  };

  app.use('/room', WatchRoomMiddleware, roomRouter);
};
