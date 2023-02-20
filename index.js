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
const rooms = {};
const playersInfo = {};
io.on('connection', (socket) => {
    console.log(`a new user connected, ID: ${socket.id}`);
    let userName = 'Аноним';
    socket.on('getRoomList', () => {
        const listAllRooms = Object.keys(rooms)
            .map((room) => ({
            id: room,
            creatorName: playersInfo[rooms[room].roomCreator].name,
            countPlayers: rooms[room].players.length,
        }));
        socket.emit('getRoomList', listAllRooms);
    });
    socket.on('room:create', () => {
        const roomID = socket.id.slice(0, 7);
        socket.join(roomID);
        playersInfo[socket.id] = {
            name: userName,
            room: roomID,
        };
        rooms[roomID] = {
            deck: [],
            playerDecks: {},
            players: [socket.id],
            currentPlayer: socket.id,
            roomCreator: socket.id,
            chat: [],
        };
        socket.emit('room:create', [userName]);
        const newRoom = {
            id: roomID,
            creatorName: userName,
            countPlayers: 1,
        };
        const countRooms = Object.keys(rooms).length;
        socket.broadcast.emit('room:new-create', newRoom, countRooms);
    });
    socket.on('room:join', (roomID) => {
        if (rooms[roomID].players.length > 4) {
            console.log('Эта комната набрана');
            return;
        }
        if (playersInfo[socket.id])
            socket.leave(playersInfo[socket.id].room);
        socket.join(roomID);
        playersInfo[socket.id] = {
            name: userName,
            room: roomID,
        };
        rooms[roomID].players.push(socket.id);
        const creator = rooms[roomID].roomCreator;
        const count = rooms[roomID].players.length;
        switch (count) {
            case 2:
                io.to(creator).emit('room:ready');
                break;
            case 5:
                io.to(creator).emit('room:full');
                io.emit('join:stopAdding', roomID, true);
                break;
            default:
                break;
        }
        const listNameOfPlayersByRoom = rooms[roomID].players
            .map((playerID) => playersInfo[playerID].name);
        socket.emit('join:true', listNameOfPlayersByRoom, rooms[roomID].chat);
        socket.broadcast.to(roomID).emit('join:newPlayer', listNameOfPlayersByRoom);
        io.emit('changeCountPlayersByRoom', roomID, rooms[roomID].players.length);
    });
    socket.on('setUserName', (name) => {
        userName = name;
        console.log('Получено новое имя: ', userName);
    });
    socket.on('chat:send', (message) => {
        const currentRoom = playersInfo[socket.id].room;
        console.log(`Игрок ${userName} написал в чат: ${message}`);
        if (currentRoom) {
            rooms[currentRoom].chat.push({ userName, message });
            io.to(currentRoom).emit('chat:new-message', { userName, message });
        }
    });
    socket.on('room:leave', () => {
        const roomID = playersInfo[socket.id].room;
        socket.leave(roomID);
        playersInfo[socket.id].room = socket.id;
        const creator = rooms[roomID].roomCreator;
        if (socket.id === creator) {
            console.log('Создатель распустил комнату: ', userName);
            delete rooms[roomID];
            io.emit('room:delete', roomID, Object.keys(rooms).length);
            io.to(roomID).emit('room:destroy', userName);
        }
        else {
            console.log('Комнату покинул участник');
            rooms[roomID].players = rooms[roomID].players.filter((id) => id !== socket.id);
            const listNameOfPlayersByRoom = rooms[roomID].players
                .map((playerID) => playersInfo[playerID].name);
            io.to(roomID).emit('room:updateListPlayers', listNameOfPlayersByRoom);
            const count = rooms[roomID].players.length;
            io.emit('changeCountPlayersByRoom', roomID, count);
            switch (count) {
                case 4:
                    io.to(creator).emit('room:ready');
                    io.emit('join:stopAdding', roomID, false);
                    break;
                case 1:
                    io.to(creator).emit('room:empty');
                    break;
                default:
                    break;
            }
        }
    });
    socket.on('room:leaveRoom', () => {
        socket.leave(playersInfo[socket.id].room);
        playersInfo[socket.id].room = socket.id;
    });
    socket.on('disconnect', () => {
        console.log(`user ID: ${socket.id} is disconnect`);
    });
});
