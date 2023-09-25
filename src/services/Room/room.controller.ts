import type { Request, Response } from 'express';
import { WatchRoom } from './Room';
import type { ISocketRequest } from '../../utils';

const watchRooms = new Map<string, WatchRoom>();

export const createRoom = (req: ISocketRequest, res: Response) => {
  try {
    const { roomName } = req.body;
    if (req.io) {
      const room = new WatchRoom(req.io, roomName);
      watchRooms.set(roomName, room);
      // add to rooms map
      res.send({ result: 'room created', roomName });
      return;
    }
    res.send({ result: 'Cannot connect to room' });
  } catch (err) {
    console.log(err);

    res.send({ err: 'An Error occurred' });
  }
};

export const getRooms = (req: Request, res: Response) => {
  const rooms = [];
  for (const room of watchRooms.values()) {
    rooms.push(room.getRoomInfo());
  }
  res.send({ data: rooms });
};
