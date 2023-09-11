"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatchRoom = exports.rooms = void 0;
const socket_events_1 = require("../Socket/socket-events");
const roomUser_1 = require("./roomUser");
exports.rooms = new Map();
const users = new Map();
const connections = [];
const candidates = new Map();
class WatchRoom {
    constructor(io) {
        this.io = io;
        this.io.of('/watch-room').on('connection', (socket) => {
            if (socket) {
                console.log(`watch-room connected to by user with id: ${socket.id}`);
                users.set(socket.id, new roomUser_1.RoomUser(socket.id));
                this.socket = socket;
                this.init();
                socket.on(socket_events_1.events.DISCONNECT, () => {
                    users.delete(socket.id);
                    this.deleteAllRoomsCreatedByUser(socket.id);
                });
            }
        });
    }
    init() {
        this.socket.on(socket_events_1.events.CREATE_ROOM, (room, cb) => {
            cb(this.createRoom(room));
        });
        this.socket.on(socket_events_1.events.JOIN_ROOM, (userId, cb) => {
            cb(this.joinRoom(userId));
        });
        this.socket.on(socket_events_1.events.GET_ROOMS, (cb) => {
            cb(this.getRooms());
        });
        this.socket.on(socket_events_1.events.LEAVE_ROOM, ({ roomId, userId }, cb) => {
            cb(this.leaveRoom(roomId, userId));
        });
        this.socket.on(socket_events_1.events.DELETE_ROOM, (roomId, cb) => {
            cb(this.deleteRoom(roomId));
        });
        this.socket.on('offer', ({ clientId, description }, cb) => {
            connections.push({
                id: clientId,
                socketId: this.socket.id,
                description,
            });
            console.log('connections', connections);
        });
        this.socket.on('send-answer', ({ clientId, description }, cb) => {
            // here we are sending the answer to the client who sent the offer
            this.io
                .of('/watch-room')
                .timeout(1000)
                .to(connections[0].socketId)
                .emit('answer', description);
            cb(JSON.stringify(clientId, description));
        });
        this.socket.on('ice-candidate', ({ clientId, candidate }, cb) => {
            const candidateExists = candidates.get(clientId);
            if (candidateExists) {
                candidateExists.push(candidate);
            }
            else {
                candidates.set(clientId, []);
                candidates.get(clientId)?.push(candidate);
            }
            const { roomsArray } = this.getRooms();
            if (roomsArray[0]) {
                this.socket.to(roomsArray[0].id).emit('new-ice-candidate', candidate);
            }
        });
    }
    //#region public methods
    createRoom(room) {
        room.id = this.generateRoomId();
        this.socket.join(room.id);
        room.users = [];
        const user = users.get(this.socket.id);
        room.users.push(user);
        exports.rooms.set(room.id, room);
        return 'Room created';
    }
    joinRoom(userId) {
        // const room = rooms.get(roomId);
        // if (!room) {
        //   return "Room doesn't exist";
        // }
        console.log('user socket id', userId);
        const { roomsArray } = this.getRooms();
        const user = users.get(userId);
        roomsArray[0].users.push(user);
        this.socket.join(roomsArray[0].id);
        this.io
            .of('/watch-room')
            .to(userId)
            .timeout(1000)
            .emit('answer', connections[0].description);
        return 'User joined room';
    }
    leaveRoom(roomId, userId) {
        const room = exports.rooms.get(roomId);
        if (!room) {
            return "Room doesn't exist";
        }
        if (room.owner === userId) {
            this.transferRoomOwnership(roomId);
        }
        room.users = room.users.filter((user) => user.id !== userId);
        this.socket.leave(roomId);
        return 'User left room';
    }
    //#endregion
    //#region private methods
    getRooms() {
        const roomsArray = [];
        for (const room of exports.rooms.values()) {
            roomsArray.push(room);
        }
        return { roomsArray };
    }
    deleteRoom(roomId) {
        exports.rooms.delete(roomId);
        return 'Room deleted';
    }
    transferRoomOwnership(roomId) {
        const room = exports.rooms.get(roomId);
        if (room) {
            if (room.users.length > 1) {
                room.owner = room.users[1].id;
            }
            else {
                this.deleteRoom(roomId);
            }
        }
    }
    deleteAllRoomsCreatedByUser(userId) {
        console.log(`All rooms created by ${userId} are being deleted`);
        for (const room of exports.rooms.values()) {
            if (room.owner === userId) {
                this.transferRoomOwnership(room.id);
            }
        }
    }
    getRoomsCreatedByUser(userId) {
        const listOfRooms = [];
        for (const list of exports.rooms.values()) {
            if (list.owner === userId) {
                listOfRooms.push(list);
            }
        }
        console.log(exports.rooms);
        return listOfRooms;
    }
    playVideo() { }
    generateRoomId() {
        let roomId = '';
        let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 6; i++) {
            roomId += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return roomId;
    }
}
exports.WatchRoom = WatchRoom;
