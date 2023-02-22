import { Players } from '../../types';

class ModelPlayer {
  players: Players;

  constructor() {
    this.players = {};
  }

  /* Создание записи о новом игроке */
  public addPlayer(name: string, room: string) {
    this.players[room] = {
      name,
      room,
    };
  }

  /* Получение имени игрока по его socket.id */
  public getPlayerName(id: string) {
    return this.players[id].name;
  }

  /* Установка нового имени игрока */
  public setPlayerName(name: string, id: string) {
    this.players[id].name = name;
  }

  /* Получение id комнаты игрока */
  public getPlayerRoomId(id: string) {
    return this.players[id].room;
  }

  /* Присваивание новой комнаты игроку */
  public setPlayerRoomId(id: string, room: string) {
    this.players[id].room = room;
  }
}

export default ModelPlayer;
