import { RoomList } from '../../types';
import ModelPlayer from './ModelPlayer';
import ModelRoom from './ModelRoom';
import ModelDeck from './ModelDeck';

class AppModel {
  players: ModelPlayer;

  rooms: ModelRoom;

  decks: ModelDeck;

  constructor() {
    this.players = new ModelPlayer();
    this.rooms = new ModelRoom();
    this.decks = new ModelDeck();
  }

  /* Получение списка всех комнат */
  public getRoomList(): RoomList {
    return this.rooms.getListAllRooms()
      .map((room) => ({
        id: room,
        creatorName: this.players.getPlayerName(this.rooms.getRoomCreatorID(room)),
        countPlayers: this.rooms.getSizeRoom(room),
        isPlay: this.rooms.isPlay(room),
      }));
  }

  /* Получение списка имен игроков в комнате */
  public getListNameOfPlayersByRoom(room: string) {
    return this.rooms.getListPlayersIDByRoom(room)
      .map((id) => this.players.getPlayerName(id));
  }

  /* Игрок отправил сообщение в чат */
  public sendMessageToChat(message: string, id: string) {
    const room = this.players.getPlayerRoomId(id);
    const name = this.players.getPlayerName(id);
    this.rooms.pushMessageToChat(room, { name, message });
    return {
      room,
      name,
    };
  }
}

export default AppModel;
