"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/seed/seedCards.ts
const mongoose_1 = __importDefault(require("mongoose"));
const Card_1 = __importDefault(require("../models/Card"));
const MONGO_URI = process.env.MONGO_URI; // DB 연결 URI
const cards = [
    // fire
    { cardName: "파이리", cardType: "fire", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/fireTier1.png" },
    { cardName: "포니타", cardType: "fire", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/fireTier2.png" },
    { cardName: "부스터", cardType: "fire", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/fireTier3.png" },
    { cardName: "윈디", cardType: "fire", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/fireTier4.png" },
    { cardName: "초염몽", cardType: "fire", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/fireTier5.png" },
    { cardName: "리자몽", cardType: "fire", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/fireTier6.png" },
    { cardName: "레시라무", cardType: "fire", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/fireTier7.png" },
    // water
    { cardName: "꼬부기", cardType: "water", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/waterTier1.png" },
    { cardName: "고라파덕", cardType: "water", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/waterTier2.png" },
    { cardName: "샤미드", cardType: "water", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/waterTier3.png" },
    { cardName: "라프라스", cardType: "water", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/waterTier4.png" },
    { cardName: "갸라도스", cardType: "water", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/waterTier5.png" },
    { cardName: "거북왕", cardType: "water", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/waterTier6.png" },
    { cardName: "가이오가", cardType: "water", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/waterTier7.png" },
    // forest
    { cardName: "이상해씨", cardType: "forest", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/forestTier1.png" },
    { cardName: "모다피", cardType: "forest", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/forestTier2.png" },
    { cardName: "리피아", cardType: "forest", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/forestTier3.png" },
    { cardName: "나시", cardType: "forest", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/forestTier4.png" },
    { cardName: "토대부기", cardType: "forest", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/forestTier5.png" },
    { cardName: "이상해꽃", cardType: "forest", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/forestTier6.png" },
    { cardName: "세레비", cardType: "forest", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/forestTier7.png" },
    // electric
    { cardName: "플러쉬", cardType: "electric", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/electricTier1.png" },
    { cardName: "라이츄", cardType: "electric", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/electricTier2.png" },
    { cardName: "전룡", cardType: "electric", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/electricTier3.png" },
    { cardName: "자포코일", cardType: "electric", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/electricTier4.png" },
    { cardName: "볼트로스", cardType: "electric", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/electricTier5.png" },
    { cardName: "피카츄", cardType: "electric", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/electricTier6.png" },
    { cardName: "썬더", cardType: "electric", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/electricTier7.png" },
    // fly
    { cardName: "찌르꼬", cardType: "fly", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/flyTier1.png" },
    { cardName: "깨비참", cardType: "fly", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/flyTier2.png" },
    { cardName: "구구", cardType: "fly", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/flyTier3.png" },
    { cardName: "깨비드릴조", cardType: "fly", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/flyTier4.png" },
    { cardName: "무장조", cardType: "fly", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/flyTier5.png" },
    { cardName: "토네로스", cardType: "fly", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/flyTier6.png" },
    { cardName: "루기아", cardType: "fly", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/flyTier7.png" },
    // ice
    { cardName: "꾸꾸리", cardType: "ice", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/iceTier1.png" },
    { cardName: "메꾸리", cardType: "ice", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/iceTier2.png" },
    { cardName: "빙큐보", cardType: "ice", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/iceTier3.png" },
    { cardName: "얼음귀신", cardType: "ice", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/iceTier4.png" },
    { cardName: "크레베이이스", cardType: "ice", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/iceTier5.png" },
    { cardName: "레지아이스", cardType: "ice", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/iceTier6.png" },
    { cardName: "프리져", cardType: "ice", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/iceTier7.png" },
    // land
    { cardName: "톱치", cardType: "land", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/landTier1.png" },
    { cardName: "코코리", cardType: "land", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/landTier2.png" },
    { cardName: "히포포타스", cardType: "land", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/landTier3.png" },
    { cardName: "대코파스", cardType: "land", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/landTier4.png" },
    { cardName: "맘모꾸리", cardType: "land", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/landTier5.png" },
    { cardName: "한카리아스", cardType: "land", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/landTier6.png" },
    { cardName: "그란돈", cardType: "land", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/landTier7.png" },
    // normal
    { cardName: "부우부", cardType: "normal", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/normalTier1.png" },
    { cardName: "하데리어", cardType: "normal", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/normalTier2.png" },
    { cardName: "다부니", cardType: "normal", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/normalTier3.png" },
    { cardName: "해피너스", cardType: "normal", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/normalTier4.png" },
    { cardName: "링곰", cardType: "normal", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/normalTier5.png" },
    { cardName: "켄타로스", cardType: "normal", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/normalTier6.png" },
    { cardName: "레지기가스", cardType: "normal", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/normalTier7.png" },
    // poison
    { cardName: "아보", cardType: "poison", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/poisonTier1.png" },
    { cardName: "니드리나", cardType: "poison", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/poisonTier2.png" },
    { cardName: "독개굴", cardType: "poison", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/poisonTier3.png" },
    { cardName: "펜드라", cardType: "poison", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/poisonTier4.png" },
    { cardName: "니드킹", cardType: "poison", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/poisonTier5.png" },
    { cardName: "독침붕", cardType: "poison", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/poisonTier6.png" },
    { cardName: "무한다이노", cardType: "poison", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/poisonTier7.png" },
    // worm
    { cardName: "과사삭벌레", cardType: "worm", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/wormTier1.png" },
    { cardName: "두루지벌레", cardType: "worm", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/wormTier2.png" },
    { cardName: "케터피", cardType: "worm", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/wormTier3.png" },
    { cardName: "실쿤", cardType: "worm", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/wormTier4.png" },
    { cardName: "파라섹트", cardType: "worm", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/wormTier5.png" },
    { cardName: "핫삼", cardType: "worm", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/wormTier6.png" },
    { cardName: "게노세크트", cardType: "worm", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/wormTier7.png" },
    // esper
    { cardName: "요가랑", cardType: "esper", tier: 1, attack: 10, hp: 25, cost: 1, image2D: "/images/esperTier1.png" },
    { cardName: "랄토스", cardType: "esper", tier: 2, attack: 40, hp: 100, cost: 2, image2D: "/images/esperTier2.png" },
    { cardName: "에브이", cardType: "esper", tier: 3, attack: 70, hp: 175, cost: 3, image2D: "/images/esperTier3.png" },
    { cardName: "고디모아젤", cardType: "esper", tier: 4, attack: 110, hp: 275, cost: 4, image2D: "/images/esperTier4.png" },
    { cardName: "가디안", cardType: "esper", tier: 5, attack: 150, hp: 375, cost: 5, image2D: "/images/esperTier5.png" },
    { cardName: "뮤", cardType: "esper", tier: 6, attack: 200, hp: 500, cost: 6, image2D: "/images/esperTier6.png" },
    { cardName: "뮤츠", cardType: "esper", tier: 7, attack: 300, hp: 750, cost: 7, image2D: "/images/esperTier7.png" },
    // legend
    { cardName: "디아루가", cardType: "legend", tier: 8, attack: 400, hp: 1000, cost: 8, image2D: "/images/legendTier1.png" },
    { cardName: "펄기아", cardType: "legend", tier: 8, attack: 400, hp: 1000, cost: 8, image2D: "/images/legendTier2.png" },
    { cardName: "기라티나", cardType: "legend", tier: 8, attack: 400, hp: 1000, cost: 8, image2D: "/images/legendTier3.png" },
    { cardName: "레쿠쟈", cardType: "legend", tier: 8, attack: 400, hp: 1000, cost: 8, image2D: "/images/legendTier4.png" },
    { cardName: "아르세우스", cardType: "legend", tier: 8, attack: 400, hp: 1000, cost: 8, image2D: "/images/legendTier5.png" },
];
async function seedCards() {
    try {
        await mongoose_1.default.connect(MONGO_URI);
        console.log("MongoDB 연결됨.");
        // 기존 카드 삭제
        await Card_1.default.deleteMany({});
        console.log("기존 카드 데이터 삭제 완료.");
        // 새 카드 추가
        await Card_1.default.insertMany(cards);
        console.log("새 카드 데이터 삽입 완료.");
        process.exit(0);
    }
    catch (error) {
        console.error("카드 시드 실패:", error);
        process.exit(1);
    }
}
seedCards();
