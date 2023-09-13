import { Server } from 'socket.io';
import { WatchRoom } from '../services/Room/Room';
import { Express } from 'express';

export const routeInitializer = (app: Express, io?: Server) => {
  const api_prefix = '/api/v1';
  app.get('/', (req, res) => {
    res.send({ name: 'Watch Party...' });
  });
  app.get(`${api_prefix}/health-check`, async (req, res) => {
    try {
      res.status(200).send();
    } catch (e) {
      console.error(e);
      res.status(500).send();
    }
  });
};
