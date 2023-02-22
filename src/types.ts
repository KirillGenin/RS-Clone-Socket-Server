export type MessageToChat = {
  name: string;
  message: string;
};

export interface Room {
  deck: string[], // Общая колода
  players: string[], // Список игроков в комнате
  playerDecks: { // Колоды карт для каждого игрока - ID игрока: колода
    [key: string]: string[]
  },
  currentPlayer: string, // Текущий игрок
  roomCreator: string, // ID владельца комнаты
  chat: MessageToChat[], // Чат комнаты
  isPlay: boolean // Статус игры
}

export interface Rooms {
  [key: string]: Room;
}

export interface Player {
  name: string,
  room: string
}

export interface Players {
  [key: string]: Player
}

export type RoomOnList = {
  id: string;
  creatorName: string;
  countPlayers: number;
};

export type RoomList = RoomOnList[];
