export type MessageToChat = {
  userName: string;
  message: string;
};

export type Room = {
  deck?: string[], // Общая колода
  players: string[], // Список игроков в комнате
  playerDecks?: { // Колоды карт для каждого игрока
    [key: string]: string[]
  },
  currentPlayer?: string, // Текущий игрок
  roomOwner: string, // ID владельца комнаты
  chat: MessageToChat[] // Чат комнаты
};

export interface Rooms {
  [key: string]: Room;
}

export interface Players {
  [key: string]: {
    name: string,
    room: string
  }
}

export type RoomOnList = {
  id: string;
  creatorName: string;
  countPlayers: number;
};

export type RoomList = RoomOnList[];
