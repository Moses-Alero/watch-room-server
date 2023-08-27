import { Adapter } from 'socket.io-adapter';

export interface Room {
  id: string;
  name?: string;
  owner: string;
  users: User[];
  messages?: RoomMessage[];
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  deleted?: boolean;
  active?: boolean;
  private?: boolean;
  password?: string;
  admins?: string[];
  moderators?: string[];
  banned?: string[];
  muted?: string[];
  tags?: string[];
  description?: string;
  image?: string;
}

export interface User {
  id: string;
  username?: string;
  createdAt?: Date;
  updatedAt?: Date;
  active?: boolean;
  private?: boolean;
  banned?: boolean;
  muted?: boolean;
  image?: string;
}

export interface RoomMessage {
  senderId: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Connection {
  id: string;
  socketId: string;
  description: RTCSessionDescription;
}
