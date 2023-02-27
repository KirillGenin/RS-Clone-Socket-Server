export type MessageToChat = {
  name: string;
  message: string;
};

export enum RoomStatus {
  Empty = 'empty',
  Ready = 'ready',
  Full = 'full',
  Play = 'play',
}

export interface Room {
  players: string[], // Список игроков в комнате
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
  isPlay: boolean;
};

export type RoomList = RoomOnList[];

export interface Decks {
  [key: string]: string[],
}

export enum MaxCountOfPLlayers {
  value = 5,
}

export enum Tips {
  'Твой ход!',
  'Ходит игрок',
}

export enum TipsColor {
  White = 'fff',
}
