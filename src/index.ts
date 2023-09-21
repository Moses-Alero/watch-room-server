import express from 'express';
import { Server } from 'socket.io';
import * as http from 'http';
import { startServer } from './config/server';
import pino from 'pino-http';
import { routeInitializer } from './config/routes';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  pino({
    level: process.env.LOG_LEVEL || 'silent',
  })
);

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Origin',
      'X-Requested-With',
      'Accept',
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Credentials',
      'my-custom-header',
    ],
    credentials: true,
  },
  transports: ['websocket'],
});
routeInitializer(app, io);
startServer(server);
