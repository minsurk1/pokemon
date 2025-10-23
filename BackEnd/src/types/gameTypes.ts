// ✅ src/types/gameTypes.ts

export interface CardData {
  id: string;
  name: string;
  attack: number; // 카드의 공격력
  hp: number; // 현재 체력
  maxhp: number; // 최대 체력
  cost: number; // 소모 코스트
  tier?: number; // 카드 등급 (선택)
  image?: string; // 이미지 경로
  cardType?: string; // 카드 속성 (fire, water 등)
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
