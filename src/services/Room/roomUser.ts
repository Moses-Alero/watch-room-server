import { User } from '../../utils';
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  names,
  Config,
} from 'unique-names-generator';

export class RoomUser implements User {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  static config: Config = {
    dictionaries: [adjectives, colors, names],
    separator: ' ',
    style: 'lowerCase',
  };
  public username = uniqueNamesGenerator(RoomUser.config);
  public active: boolean = true;
  public createdAt: Date = new Date();
  public updatedAt: Date = new Date();
  public banned: boolean = false;
  public muted: boolean = false;
  public private: boolean = false;
}
