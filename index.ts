const express = require('express');
const http = require('http');
import { Server, Socket } from 'socket.io';
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'https://chat-socket-test.netlify.app/',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: '*' })); // CORS

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
const players: Map<string, string> = new Map();

// ЧАТ
io.on('connection', (socket: Socket) => {
  console.log(`a new user connected, ID: ${socket.id}`);

  let userName: string;
  // let room;

  socket.on('join', (roomID) => {
    /* Выход из текущей комнаты, если до этого уже присоединялся */
    const currentRoom = players.get(socket.id);
    if (currentRoom) socket.leave(currentRoom);
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
      if (currentRoom) io.to(currentRoom).emit('add-new-user', userName);
    }
  });

  socket.on('chat', ({ message }) => {
    const currentRoom = players.get(socket.id);
    if (currentRoom) io.to(currentRoom).emit('add-new-message', userName, message);
  });

  /* Игрок создал свою комнату */
  socket.on('room:create', (roomID: string) => {
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
