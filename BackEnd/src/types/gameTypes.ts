// ✅ src/types/gameTypes.ts

export interface CardData {
  id: string;
  name: string;
  attack?: number;
  damage?: number;
  cost: number;
  image?: string;
}

export interface GameState {
  currentTurn: string;
  hp: Record<string, number>;
  cardsPlayed: Record<string, CardData>;
  cardsInZone: Record<string, CardData[]>; // 각 플레이어 필드
  cost: Record<string, number>; // 플레이어별 코스트
}

export interface RoomInfo {
  players: string[];
  ready: Record<string, boolean>;
  hp: Record<string, number>;
  turnIndex: number;
  gameState?: GameState;
}
