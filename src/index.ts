import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { Rooms, Players, RoomList } from './types';

/* ------ Создание сервера - START ----- */
const app: Express = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: '*',
})); // CORS

app.get('/', (req: Request, res: Response) => {
  res.send('Приложение запущено');
});

const PORT = process.env.PORT ?? 3000;

server.listen(PORT, () => {
  console.log(`listening on PORT: ${PORT}`);
});
/* ------ Создание сервера - END ----- */

/* Создание комнат */
const rooms: Rooms = {};

/* Игроки: Socket ID игрока - Имя и Номер комнаты */
const playersInfo: Players = {};


/* ----------------- Socket ---------------- */
io.on('connection', (socket: Socket) => {
  console.log(`a new user connected, ID: ${socket.id}`);
  
  /* Имя текущего игрока */
  let userName = 'Аноним';
  /* Получение списка всех комнат */
  /* список всех комнат в виде массива [{id комнаты, имя создателя, кол-во участников}] */
  socket.on('getRoomList', () => {
    const listAllRooms: RoomList = Object.keys(rooms)
      .map((room) => ({
        id: room,
        creatorName: playersInfo[rooms[room].roomOwner].name,
        countPlayers: rooms[room].players.length,
      }));
    socket.emit('getRoomList', listAllRooms);
  });

  /* Игрок просоединился к комнате другого игрока */
  socket.on('room:join', (roomID: string) => {
    /* Проверка, можно ли присоединиться к комнате, или она уже полная */
    if (rooms[roomID].players.length > 4) {
      console.log('Эта комната набрана');
      return;
    }
    /* Выход из текущей комнаты, если до этого уже присоединялся */
    if (playersInfo[socket.id]) socket.leave(playersInfo[socket.id].room);
    /* Подключение к комнате другого игрока */
    socket.join(roomID);
    /* Проверка, является ли новый игрок последним 5ым за столом. */
    /* Т.е. четверо игроков уже за столом. */
    /* Цель - приостановить набор и оповестить владельца комнаты что команда собрана */
    /* А также задизейблить кнопку JOIN у всех в списке комнат */
    if (rooms[roomID].players.length === 4) {
      console.log('Эта последний игрок');
      /* Оповещение владельца комнаты */
      io.to(rooms[roomID].roomOwner).emit('join:last');
      /* Оповещение всех */
      io.emit('join:stopAdding', roomID, true);
    }
    /* Данные об игроке - имя и номер комнаты */
    playersInfo[socket.id] = {
      name: userName,
      room: roomID,
    };
    /* Добавление в комнату нового игрока */
    rooms[roomID].players.push(socket.id);
    /* В случае удачного присоеднинения, отправляем игроку имя создателя комнаты */
    /* список имен других участников, а также весь чат */
    const listNameOfPlayersByRoom = rooms[roomID].players
      .map((playerID) => playersInfo[playerID].name); // первый - создатель комнаты
    socket.emit('join:true', listNameOfPlayersByRoom, rooms[roomID].chat);
    /* Отправляем другим участникам комнаты обновленный список игроков */
    socket.broadcast.to(roomID).emit('join:newPlayer', listNameOfPlayersByRoom);
    /* Оповещаем об изменении кол-ва игроков в комнате всех. В списке комнат число "Ожидают" */
    /* Нужно отправить всем номер комнаты и новое число игроков в ней */
    io.emit('changeCountPlayersByRoom', roomID, rooms[roomID].players.length);
  });

  socket.on('disconnect', () => {
    console.log(`user ID: ${socket.id} is disconnect`);
  });

  /* Установка имени игрока */
  socket.on('setUserName', (name: string) => {
    userName = name;
    console.log('Получено новое имя: ', userName);
  });

  socket.on('chat', (message: string) => {
    const currentRoom = playersInfo[socket.id].room;
    console.log(`Игрок ${userName} написал в чат: ${message}`);
    if (currentRoom) {
      rooms[currentRoom].chat.push({ userName, message });
      io.to(currentRoom).emit('chat:new-message', { userName, message });
    }
  });

  /* Игрок создал свою комнату */
  socket.on('room:create', () => {
    /* Чтобы была возможность эмитить отдельно создателям комнаты, */
    /* id комнаты не должен быть равен id сокета создателя */
    /* Просто отрезаем кусочек от id юзера и получаем id комнаты */
    const roomID = socket.id.slice(0, 7);
    /* Подключился к своей комнате */
    socket.join(roomID);
    /* Данные об игроке - имя и номер комнаты */
    playersInfo[socket.id] = {
      name: userName,
      room: roomID,
    };
    /* Создание новой комнаты и добавление в нее игрока */
    rooms[roomID] = {
      players: [socket.id],
      roomOwner: socket.id,
      chat: [],
    };
    /* Отправляем игроку id его комнаты и его имя */
    socket.emit('room:create', [userName]);
    /* Сообщение другим игрокам о создании новой комнаты */
    const newRoom = {
      id: roomID,
      creatorName: userName,
      countPlayers: 1,
    };
    const countRooms = Object.keys(rooms).length;
    socket.broadcast.emit('room:new-create', newRoom, countRooms);
  });
});
