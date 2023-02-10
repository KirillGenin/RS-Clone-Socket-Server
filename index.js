"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use((0, cors_1.default)({
    origin: '*'
})); // CORS
app.get('/', (req, res) => {
    res.send('Приложение запущено');
});
const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
    console.log(`listening on PORT: ${PORT}`);
});
/// /////////////////////////
const rooms = {};
console.log(rooms);
const players = new Map();
// ЧАТ
io.on('connection', (socket) => {
    console.log(`a new user connected, ID: ${socket.id}`);
    let userName;
    // let room;
    socket.on('join', (roomID) => {
        /* Выход из текущей комнаты, если до этого уже присоединялся */
        const currentRoom = players.get(socket.id);
        if (currentRoom)
            socket.leave(currentRoom);
        /* Подключение к комнате другого игрока */
        socket.join(roomID);
        /* Игрок - Комната */
        players.set(socket.id, roomID);
        console.log('Игроки:');
        /*     for (const player in players) {
          console.log(`Игрок ${player} состоит в комнате ${players.get(socket.id)}`);
        } */
    });
    socket.on('disconnect', () => {
        console.log(`user ID: ${socket.id} is disconnect`);
    });
    socket.on('user-name', ({ message }) => {
        if (!userName) {
            userName = message;
            console.log(`${userName} присоединился к чату`);
            const currentRoom = players.get(socket.id);
            if (currentRoom)
                io.to(currentRoom).emit('add-new-user', userName);
        }
    });
    socket.on('chat', ({ message }) => {
        const currentRoom = players.get(socket.id);
        if (currentRoom)
            io.to(currentRoom).emit('add-new-message', userName, message);
    });
    /* Игрок создал свою комнату */
    socket.on('room:create', (roomID) => {
        /* Подключился к своей комнате */
        socket.join(roomID);
        /* Игрок - Комната */
        players.set(socket.id, roomID);
        console.log('Игроки:');
        /*     for (const player in players.keys()) {
          console.log(`Игрок ${player} состоит в комнате ${players.get(player)}`);
        } */
        socket.broadcast.emit('room:create', roomID);
    });
});
