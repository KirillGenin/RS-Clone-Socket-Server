import { Rooms, MessageToChat } from '../../types';

class ModelRoom {
  private rooms: Rooms;

  constructor() {
    this.rooms = {};
  }

  /* Создание новой комнаты */
  public createRoom(id: string) {
    /* Чтобы была возможность эмитить отдельно создателям комнаты, */
    /* id комнаты не должен быть равен id сокета создателя */
    /* Просто отрезаем кусочек от id юзера и получаем id комнаты */
    const room = id.slice(0, 7);
    /* Создаем запись о новой комнате */
    this.rooms[room] = {
      players: [id],
      currentPlayer: id,
      roomCreator: id,
      chat: [],
      isPlay: false,
    };
    /* Возвращаем id новой комнаты */
    return room;
  }

  /* Получение имени создателя комнаты */
  public getRoomCreatorID(room: string) {
    return this.rooms[room].roomCreator;
  }

  /* Получение размера комнаты */
  public getSizeRoom(room: string) {
    return this.rooms[room].players.length;
  }

  /* Получение массива всех комнат */
  public getListAllRooms() {
    return Object.keys(this.rooms);
  }

  /* Получение кол-ва всех комнат */
  public getCountAllRooms() {
    return Object.keys(this.rooms).length;
  }

  /* Добавление нового игрока в комнату */
  public addPlayerToRoom(room: string, id: string) {
    this.rooms[room].players.push(id);
  }

  /* Удаление игрока из комнаты */
  public removePlayer(room: string, id: string) {
    this.rooms[room].players = this.rooms[room].players
      .filter((player) => player !== id);
  }

  /* Получение массива id игроков в комнате */
  public getListPlayersIDByRoom(room: string) {
    return this.rooms[room].players;
  }

  /* Получение чата комнаты */
  public getChat(room: string) {
    return this.rooms[room].chat;
  }

  /* Удаление комнаты */
  public removeRoom(room: string) {
    delete this.rooms[room];
  }

  /* Записать сообщение в чат */
  public pushMessageToChat(room: string, message: MessageToChat) {
    this.rooms[room].chat.push(message);
  }

  /* Проверить статус игры - начата или нет */
  public isPlay(room: string) {
    return this.rooms[room].isPlay;
  }
}

export default ModelRoom;
