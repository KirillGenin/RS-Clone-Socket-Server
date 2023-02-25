import { Decks } from '../../types';

class ModelDeck {
  private attackCards: string[];

  private bombCards: string[];

  private deactivateCards: string[];

  private futureCards: string[];

  private giveCards: string[];

  private leaveCards: string[];

  private noCards: string[];

  private shuffleCards: string[];

  private tacocatCards: string[];

  private borodacatCards: string[];

  private rainbowcatCards: string[];

  private watermelonCards: string[];

  private potatoCards: string[];

  private roomDecks: Decks; /* Колоды для комнат - из них берутся карты во время игры */

  private playerDecks: Decks; /* Индивидуальные карты игроков */

  constructor() {
    this.attackCards = ['attack1', 'attack2', 'attack3', 'attack4'];
    this.bombCards = ['bomb1', 'bomb2', 'bomb3', 'bomb4'];
    this.deactivateCards = ['deactivate1', 'deactivate2', 'deactivate3', 'deactivate4', 'deactivate5', 'deactivate6'];
    this.futureCards = ['future1', 'future2', 'future3', 'future4', 'future5'];
    this.giveCards = ['give1', 'give2', 'give3', 'give4'];
    this.leaveCards = ['leave1', 'leave2', 'leave3', 'leave4'];
    this.noCards = ['no1', 'no2', 'no3', 'no4', 'no5'];
    this.shuffleCards = ['shuffle1', 'shuffle2', 'shuffle3', 'shuffle4'];
    this.tacocatCards = ['tacocat1', 'tacocat2', 'tacocat3', 'tacocat4'];
    this.borodacatCards = ['borodacat1', 'borodacat2', 'borodacat3', 'borodacat4'];
    this.rainbowcatCards = ['rainbowcat1', 'rainbowcat2', 'rainbowcat3', 'rainbowcat4'];
    this.watermelonCards = ['watermelon1', 'watermelon2', 'watermelon3', 'watermelon4'];
    this.potatoCards = ['potato1', 'potato2', 'potato3', 'potato4'];
    this.roomDecks = {};
    this.playerDecks = {};
  }

  /* Создание замешанных колод: общей для комнаты и для каждого игрока */
  public createDecks(room: string, players: string[]) {
    /* Создаем пустые колоды для комнаты и игроков */
    this.roomDecks[room] = [];
    players.forEach((player) => {
      this.playerDecks[player] = [];
    });
    /* Создаем замешанную колоду из всех карт, кроме "Взрывных котиков" и "Обезвредь", */
    /* чтобы сформировать из нее колоду для комнаты и для каждого игрока */
    let baseDeck: string[] = this.shuffleDeck([
      ...this.attackCards,
      ...this.futureCards,
      ...this.giveCards,
      ...this.leaveCards,
      ...this.noCards,
      ...this.shuffleCards,
      ...this.tacocatCards,
      ...this.borodacatCards,
      ...this.rainbowcatCards,
      ...this.watermelonCards,
      ...this.potatoCards,
    ]);
    /* Создаем копии карт "Обезвредь" и "Взрывных котиков" и сразу размешиваем */
    const deactivateCards = this.shuffleDeck([...this.deactivateCards]);
    const bombCards = this.shuffleDeck([...this.bombCards]);
    /* Раздаем каждому игроку по карте "Обезвредь" */
    players.forEach((player) => {
      /* Удаляем из массива первую карту и сразу возвращаем ее */
      const card = deactivateCards.splice(0, 1);
      /* Добавляем карту в колоду игрока */
      this.playerDecks[player] = this.playerDecks[player].concat(card);
    });
    /* Подмешваем в базовую колоду оставшиеся карты "Обезвредь" */
    /* Если игроков <=3, то добавляем только 2 карты. Заново мешаем колоду */
    if (players.length <= 3) {
      baseDeck = this.shuffleDeck(baseDeck.concat(deactivateCards.splice(0, 2)));
    } else {
      baseDeck = this.shuffleDeck(baseDeck.concat(deactivateCards));
    }
    /* Добавляем в колоды игроков карты из базовой колоды до полного комплекта из 8 штук */
    players.forEach((player) => {
      /* Удаляем из массива 7 карт и сразу возвращаем их */
      const cards = baseDeck.splice(0, 7);
      /* Добавляем карты в колоду игрока */
      this.playerDecks[player] = this.shuffleDeck(this.playerDecks[player].concat(cards));
      console.log(`Колода игрока ${player}: `, this.playerDecks[player]);
    });
    /* Добавляем "Взрывных котиков" в базовую колоду и размешиваем */
    /* Взрывных котят должно быть меньше на 1 чем число игроков */
    baseDeck = this.shuffleDeck(baseDeck.concat(bombCards.splice(0, (players.length - 1))));
    console.log('Оставшая колода: ', baseDeck);
  }

  /* Перетасовка колоды */
  private shuffleDeck(deck: string[]) {
    return [...deck].sort(() => Math.random() - 0.5);
  }

  /* Удалить колоду игрока */
  public removePlayerDeck(id: string) {
    delete this.playerDecks[id];
  }

  /* Удалить колоду комнаты */
  public removeRoomDeck(id: string) {
    delete this.roomDecks[id];
  }

  /* Получить колоду игрока */
  public getDeckOfPlayer(id: string) {
    return this.playerDecks[id];
  }

  /* Получить размер колоды игрока */
  public getSizeDeckOfPlayer(id: string) {
    return this.playerDecks[id].length;
  }

  /* Получить колоду комнаты */
  public getDeckOfRoom(room: string) {
    return this.roomDecks[room];
  }

  /* Получить размер колоды комнаты */
  public getSizeDeckOfRoom(room: string) {
    return this.roomDecks[room].length;
  }
}

export default ModelDeck;
