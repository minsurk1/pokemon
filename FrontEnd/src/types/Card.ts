// src/types/Card.ts
// ✅ 프론트엔드에서 사용하는 배틀용 카드 타입 정의
// 백엔드 models/Card.ts의 구조를 기반으로 함

export interface Card {
  id: string; // 프론트엔드에서 사용하는 고유 ID
  cardId?: string; // (선택적) 백엔드 DB용 카드 ID
  name: string; // 카드 이름 (cardName)
  attack: number; // 공격력
  hp: number; // 현재 체력 (hp)
  maxhp: number; // 최대 체력 (maxhp)
  cost: number; // 코스트
  tier: number; // 카드 등급 (B=1, A=2, S=3)
  image: string; // 2D 카드 이미지 (image2D)
  cardType?: string; // ✅ 추가 — 카드 속성(불, 물, 전기 등)
}
