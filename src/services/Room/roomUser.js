"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomUser = void 0;
const unique_names_generator_1 = require("unique-names-generator");
class RoomUser {
    constructor(id) {
        this.username = (0, unique_names_generator_1.uniqueNamesGenerator)(RoomUser.config);
        this.active = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.banned = false;
        this.muted = false;
        this.private = false;
        this.id = id;
    }
}
exports.RoomUser = RoomUser;
RoomUser.config = {
    dictionaries: [unique_names_generator_1.adjectives, unique_names_generator_1.colors, unique_names_generator_1.names],
    separator: ' ',
    style: 'lowerCase',
};
