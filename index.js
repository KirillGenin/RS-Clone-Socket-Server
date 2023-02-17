import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});
app.use(cors({
    origin: '*',
}));
app.get('/', (req, res) => {
    res.send('Приложение запущено');
});
const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
    console.log(`listening on PORT: ${PORT}`);
});
;
const rooms = {};
const playersInfo = {};
let userName = 'Аноним';
io.on('connection', (socket) => {
    console.log(`a new user connected, ID: ${socket.id}`);
    socket.on('getRoomList', () => {
        const listAllRooms = Object.keys(rooms)
            .map((room) => ({
            id: room,
            creatorName: playersInfo[rooms[room].roomOwner].name,
            countPlayers: rooms[room].players.length
        }));
        socket.emit('getRoomList', listAllRooms);
    });
    socket.on('room:join', (roomID) => {
        if (rooms[roomID].players.length > 4) {
            console.log('Эта комната набрана');
            return;
        }
        if (playersInfo[socket.id])
            socket.leave(playersInfo[socket.id].room);
        socket.join(roomID);
        if (rooms[roomID].players.length === 4) {
            console.log('Эта последний игрок');
            io.to(rooms[roomID].roomOwner).emit('join:last');
            io.emit('join:stopAdding', roomID, true);
        }
        playersInfo[socket.id] = {
            name: userName,
            room: roomID
        };
        rooms[roomID].players.push(socket.id);
        const listNameOfPlayersByRoom = rooms[roomID].players
            .map((playerID) => playersInfo[playerID].name);
        socket.emit('join:true', listNameOfPlayersByRoom, rooms[roomID].chat);
        socket.broadcast.to(roomID).emit('join:newPlayer', listNameOfPlayersByRoom);
        io.emit('changeCountPlayersByRoom', roomID, rooms[roomID].players.length);
    });
    socket.on('disconnect', () => {
        console.log(`user ID: ${socket.id} is disconnect`);
    });
    socket.on('setUserName', (name) => {
        userName = name;
        console.log(userName);
    });
    socket.on('chat', (message) => {
        const currentRoom = playersInfo[socket.id].room;
        console.log(message);
        if (currentRoom) {
            rooms[currentRoom].chat.push({ playerName: userName, message });
            io.to(currentRoom).emit('chat:new-message', { userName, message });
        }
        ;
    });
    socket.on('room:create', () => {
        const roomID = socket.id.slice(0, 7);
        socket.join(roomID);
        playersInfo[socket.id] = {
            name: userName,
            room: roomID
        };
        rooms[roomID] = {
            players: [socket.id],
            roomOwner: socket.id,
            chat: [],
        };
        socket.emit('room:create', [userName]);
        const newRoom = {
            id: roomID,
            creatorName: userName,
            countPlayers: 1
        };
        const countRooms = Object.keys(rooms).length;
        socket.broadcast.emit('room:new-create', newRoom, countRooms);
    });
});
