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
  canAttack?: boolean; // 한 턴에 한 번만 공격 가능 여부
}

export interface GameState {
  currentTurn: string; // 현재 턴의 플레이어 ID
  hp: Record<string, number>; // 플레이어별 체력
  cardsPlayed: Record<string, CardData>; // 최근 사용 카드 (옵션)
  cardsInZone: Record<string, CardData[]>; // 각 플레이어 필드
  cost: Record<string, number>; // 플레이어별 코스트

  // ✅ 추가된 필드들
  decks: Record<string, CardData[]>; // 각 플레이어 덱
  hands: Record<string, CardData[]>; // 각 플레이어 손패
  graveyards: Record<string, CardData[]>; // 각 플레이어 묘지
  turnCount: number; // 현재 턴 수
}

export interface RoomInfo {
  hostId: string;
  players: string[];
  ready: Record<string, boolean>;
  hp: Record<string, number>;
  turnIndex: number;
  gameState: GameState | null;
  // ✅ 타이머 공유용 필드 추가
  timeLeft?: number; // 남은 시간(초)
  timer?: NodeJS.Timeout | null; // setInterval 핸들 (NodeJS 전용)
}
