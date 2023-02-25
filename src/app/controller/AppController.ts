import { Server, Socket } from 'socket.io';
// @ts-ignore
import AppModel from '../model/AppModel';
import { RoomOnList } from '../../types';

class AppController {
  private io: Server;

  private model: AppModel;

  constructor(server: Server) {
    this.io = server;
    this.model = new AppModel();
  }

  public listener() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`a new user connected, ID: ${socket.id}`);

      /* -------------------------------------------- Создание записи о новом игроке */
      this.model.players.addPlayer('Аноним', socket.id);

      /* -----------------------------------------------Установка имени игрока */
      socket.on('setUserName', (name: string) => {
        this.model.players.setPlayerName(name, socket.id);
        console.log('Получено новое имя: ', name);
      });

      /* ----------------------------------------- Получение списка всех комнат */
      socket.on('getRoomList', () => {
        socket.emit('getRoomList', this.model.getRoomList());
      });

      /* ------------------------------------------- Игрок создал свою комнату */
      socket.on('room:create', () => {
        /* Создание новой комнаты и получение ее id */
        /* socket.id !== room */
        const room = this.model.rooms.createRoom(socket.id);
        /* Подключился к своей созданной комнате */
        socket.join(room);
        /* Устанавливаем новый id комнаты для игрока */
        this.model.players.setPlayerRoomId(socket.id, room);
        /* Отправляем игроку id его комнаты и его имя */
        socket.emit('room:create', [this.model.players.getPlayerName(socket.id)]);
        /* Сообщение другим игрокам о создании новой комнаты: комната и новое кол-во комнат */
        const newRoom: RoomOnList = {
          id: room,
          creatorName: this.model.players.getPlayerName(socket.id),
          countPlayers: 1,
        };
        const countRooms = this.model.rooms.getCountAllRooms();
        socket.broadcast.emit('room:new-create', newRoom, countRooms);
      });

      /*  */
      /* -------------------------------- Игрок просоединился к комнате другого игрока */
      /*  */
      socket.on('room:join', (room: string) => {
        /* Проверка, можно ли присоединиться к комнате, или она уже полная */
        if (this.model.rooms.getSizeRoom(room) > 4) {
          console.log('Эта комната набрана');
          return;
        }
        /* Подключение к комнате другого игрока */
        socket.join(room);
        /* Обновление комнаты в модели игрока */
        this.model.players.setPlayerRoomId(socket.id, room);
        /* Добавление в модель комнаты нового игрока */
        this.model.rooms.addPlayerToRoom(room, socket.id);
        /* Выносим в переменную ID создателя комнаты */
        const creator = this.model.rooms.getRoomCreatorID(room);
        /* Проверяем сколько теперь игроков в комнате, и меняем статус комнаты */
        switch (this.model.rooms.getSizeRoom(room)) {
          case 2:
            this.io.to(creator).emit('room:ready');
            break;
          case 5:
            this.io.to(creator).emit('room:full');
            this.io.emit('join:stopAdding', room, true); /* toggle кнопки JOIN в списке комнат */
            break;
          default:
            break;
        }
        /* В случае удачного присоеднинения, отправляем игроку */
        /* список имен других участников, а также весь чат */
        const players = this.model.getListNameOfPlayersByRoom(room);
        const chat = this.model.rooms.getChat(room);
        socket.emit('join:true', players, chat);
        /* Отправляем другим участникам комнаты обновленный список игроков */
        socket.broadcast.to(room).emit('join:newPlayer', players);
        /* Оповещаем об изменении кол-ва игроков в комнате всех. В списке комнат число "Ожидают" */
        /* Нужно отправить всем номер комнаты и новое число игроков в ней */
        this.io.emit('changeCountPlayersByRoom', room, this.model.rooms.getSizeRoom(room));
      });

      /* ------------------------------------------- Игрок отправил сообщение в чат */
      /*  */
      socket.on('chat:send', (message: string) => {
        /* Записали сообщение в модель. Вернули id комнаты игрока и его имя */
        const { room, name } = this.model.sendMessageToChat(message, socket.id);
        /* Отпраляем сообщение всем игрока в комнате */
        this.io.to(room).emit('chat:new-message', { name, message });
      });

      /* -------------------------------------------- Игрок выходит из комнаты */
      /*  */
      socket.on('room:leave', () => {
        /* Определяем ID комнаты, в которой находится игрок */
        const room = this.model.players.getPlayerRoomId(socket.id);
        /* Игрок покидает комнату и меняет запись на свою комнату */
        socket.leave(room);
        this.model.players.setPlayerRoomId(socket.id, socket.id);
        /* Выносим в переменную ID создателя комнаты */
        const creator = this.model.rooms.getRoomCreatorID(room);
        /* Определяем роль игрока - создатель комнаты или участник */
        if (socket.id === creator) { /* Игрок является создателем комнаты */
          console.log('Создатель распустил комнату');
          this.model.rooms.removeRoom(room); /* Удалили комнату из модели */
          /* Эмитим событие для удаления комнаты из списка комнат */
          /* и сообщаем новое кол-во комнат */
          this.io.emit('room:delete', room, this.model.rooms.getCountAllRooms());
          /* Оповестить всех оставшихся в комнате игроков о том, что комната распущена */
          /* Получат только другие участники, т.к. создатель уже покинул комнату */
          this.io.to(room).emit('room:destroy', this.model.players.getPlayerName(socket.id));
        } else {
          console.log('Комнату покинул участник');
          /* Удаление данных об игроке из комнаты в объекте rooms */
          this.model.rooms.removePlayer(room, socket.id);
          /* Отправляем оставшимся игрокам в комнате новый список участников */
          const players = this.model.getListNameOfPlayersByRoom(room);
          this.io.to(room).emit('room:updateListPlayers', players);
          /* Отправляем всем новое кол-во игроков в этой комнате */
          this.io.emit('changeCountPlayersByRoom', room, this.model.rooms.getSizeRoom(room));
          /* Проверяем сколько осталось игроков, и меняем статус комнаты */
          switch (this.model.rooms.getSizeRoom(room)) {
            case 4:
              this.io.to(creator).emit('room:ready');
              this.io.emit('join:stopAdding', room, false); /* toggle кнопки JOIN в списке комнат */
              break;
            case 1:
              this.io.to(creator).emit('room:empty');
              break;
            default:
              break;
          }
        }
      });

      /* -------------------------- Игрок покидает комнату, распущенную создателем */
      /*  */
      socket.on('room:leaveRoom', () => {
        /* Отключается от комнаты */
        socket.leave(this.model.players.getPlayerRoomId(socket.id));
        /* Замена комнаты в модели игрока */
        this.model.players.setPlayerRoomId(socket.id, socket.id);
      });

      /* ----------------------------- Соединение потеряно */
      /*  */
      socket.on('disconnect', () => {
        console.log(`user ID: ${socket.id} is disconnect`);
        /* Определяем ID комнаты, в которой находился игрок */
        const room = this.model.players.getPlayerRoomId(socket.id);
        /* Если игрок не присоединялся и не создавал свою комнату */
        /* то просто удаляем запись о нем и завершаем функцию */
        if (!this.model.rooms.getListAllRooms().includes(room)) {
          /* Удаляем запись об игроке из модели */
          this.model.players.removePlayer(socket.id);
          return;
        }
        /* Игрок покидает комнату */
        socket.leave(room);
        /* Проверяем, началась ли игра */
        if (!this.model.rooms.isPlay(room)) { /* Если игра еще не началась */
          /* Определяем создателя комнаты */
          const creator = this.model.rooms.getRoomCreatorID(room);
          /* Определяем роль игрока - создатель комнаты или участник */
          if (socket.id === creator) { /* Игрок является создателем комнаты */
            console.log('Создатель disconnect');
            this.model.rooms.removeRoom(room); /* Удалили комнату из модели */
            /* Эмитим событие для удаления комнаты из списка комнат */
            /* и сообщаем новое кол-во комнат */
            this.io.emit('room:delete', room, this.model.rooms.getCountAllRooms());
            /* Оповестить всех оставшихся в комнате игроков о том, что комната распущена */
            /* Получат только другие участники, т.к. создатель уже покинул комнату */
            this.io.to(room).emit('room:destroy', this.model.players.getPlayerName(socket.id));
          } else {
            console.log('Участник disconnect');
            /* Удаление данных об игроке из комнаты в объекте rooms */
            this.model.rooms.removePlayer(room, socket.id);
            /* Отправляем оставшимся игрокам в комнате новый список участников */
            const players = this.model.getListNameOfPlayersByRoom(room);
            this.io.to(room).emit('room:updateListPlayers', players);
            /* Отправляем всем новое кол-во игроков в этой комнате */
            this.io.emit('changeCountPlayersByRoom', room, this.model.rooms.getSizeRoom(room));
            /* Проверяем сколько осталось игроков, и меняем статус комнаты */
            switch (this.model.rooms.getSizeRoom(room)) {
              case 4:
                this.io.to(creator).emit('room:ready');
                this.io.emit('join:stopAdding', room, false); /* toggle кнопки JOIN в списке комнат */
                break;
              case 1:
                this.io.to(creator).emit('room:empty');
                break;
              default:
                break;
            }
          }
          /* Удаляем запись об игроке из модели */
          this.model.players.removePlayer(socket.id);
        }
      });

      /*  */
      socket.on('makeDisconnect', () => {
        socket.disconnect();
      });

      /*  */
      /* ---------------------- ИГРА -------------------- */
      /*  */

      /* -------------------- Создание колод для комнаты: общая и для каждого игрока */
      socket.on('deck:create', () => {
        /* Определяем id комнаты */
        const room = this.model.players.getPlayerRoomId(socket.id);
        /* Получаем список всех игроков в комнате */
        const players = this.model.rooms.getListPlayersIDByRoom(room);
        /* Формируем колоды */
        this.model.decks.createDecks(room, players);
      });
    });
  }
}

export default AppController;
