// src/types/Card.ts
// ✅ 프론트엔드에서 사용하는 배틀용 카드 타입 정의
// 백엔드 models/Card.ts의 구조를 기반으로 함

export interface Card {
  cardId: string; // 서버에서 전달되는 카드 ID (_id 대신 문자열)
  name: string; // 카드 이름 (cardName)
  attack: number; // 공격력
  hp: number; // 체력
  cost: number; // 코스트
  tier: number; // 카드 등급 (B=1, A=2, S=3)
  image: string; // 2D 카드 이미지 (image2D)
}
