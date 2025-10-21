// src/types/cardsTypes.ts
export interface CardData {
  id: number;
  name: string;
  tier: "B" | "A" | "S";
}

export interface CardPack {
  id: number;
  name: string;
  type: "B" | "A" | "S";
  packImage: string;
  isOpened: boolean;
}

export interface UserCard {
  id: number;
  userPackId: number;
  name: string;
  tier: "B" | "A" | "S";
}
