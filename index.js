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
io.on('connection', (socket) => {
    console.log(`a new user connected, ID: ${socket.id}`);
    const listAllRooms = Object.keys(rooms)
        .map((room) => ({
        roomID: room,
        name: playersInfo[rooms[room].roomOwner].name,
        count: rooms[room].players.length
    }));
    listAllRooms.forEach((room) => console.log(`Создатель комнаты ${room.name}, число игроков ${room.count}`));
    socket.emit('connect:getListAllRooms', listAllRooms);
    let userName = 'Аноним';
    socket.on('join', (roomID) => {
        if (rooms[roomID].players.length === 4) {
            console.log('Эта последний игрок');
        }
        if (rooms[roomID].players.length > 4) {
            console.log('Эта комната набрана');
            return;
        }
        if (playersInfo[socket.id])
            socket.leave(playersInfo[socket.id].room);
        socket.join(roomID);
        playersInfo[socket.id] = {
            name: userName,
            room: roomID
        };
        rooms[roomID].players.push(socket.id);
        console.log('Игроки в комнате: ', rooms[roomID].players);
        const playerListNameByRoom = rooms[roomID].players
            .map((playerID) => playersInfo[playerID].name).slice(1);
        socket.emit('join:true', playersInfo[roomID].name, playerListNameByRoom, rooms[roomID].chat);
        socket.broadcast.to(roomID).emit('join:newPlayer', playersInfo[socket.id].name);
        io.emit('changeCountPlayersByRoom', roomID, rooms[roomID].players.length);
    });
    socket.on('disconnect', () => {
        console.log(`user ID: ${socket.id} is disconnect`);
    });
    socket.on('change-user-name', (newUserName) => {
        userName = newUserName;
        console.log(userName);
    });
    socket.on('chat', (message) => {
        const currentRoom = playersInfo[socket.id].room;
        if (currentRoom) {
            rooms[currentRoom].chat.push({ playerName: userName, message });
            io.to(currentRoom).emit('add-new-message', userName, message);
        }
        ;
    });
    socket.on('room:create', (roomID) => {
        socket.join(roomID);
        playersInfo[socket.id] = {
            name: userName,
            room: roomID
        };
        rooms[roomID] = {
            players: [roomID],
            roomOwner: roomID,
            chat: [],
        };
        socket.broadcast.emit('room:create', roomID, userName);
    });
});
