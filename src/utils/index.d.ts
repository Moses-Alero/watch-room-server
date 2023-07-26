import { Adapter } from 'socket.io-adapter';

export interface Room {
  id: string;
  name?: string;
  owner: string;
  users: string[];
  messages?: string[];
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
