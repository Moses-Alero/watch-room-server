import express from 'express';
import * as RoomController from './room.controller';

export const router = express.Router();

router.post('/create', RoomController.createRoom);

router.get('/all', RoomController.getRooms);

router.post('/join/:roomId');
