"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const router = express_1.default.Router();
// 카드 뽑기 API
router.post("/draw-cards", async (req, res) => {
    try {
        const { userId, packType } = req.body; // 프론트에서 유저ID, 카드팩 타입 전달
        // 1. DB에서 카드 전체 불러오기 (또는 필요한 조건 필터링)
        const allCards = await Card_1.default.find({}).exec();
        // 2. 확률, 카드팩 타입 기반으로 카드 뽑기 로직 구현 (프론트와 동일하게)
        const getProbabilities = (packType) => {
            switch (packType) {
                case "B":
                    return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
                case "A":
                    return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
                case "S":
                    return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 };
                default:
                    return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
            }
        };
        const probabilities = getProbabilities(packType);
        // 누적확률 계산 헬퍼
        function getRandomTier(probabilities) {
            const rand = Math.random();
            let cumulative = 0;
            for (const tier in probabilities) {
                cumulative += probabilities[+tier] || 0;
                if (rand <= cumulative)
                    return +tier;
            }
            return Math.max(...Object.keys(probabilities).map(Number));
        }
        // 5장 카드 뽑기
        const drawnCards = [];
        for (let i = 0; i < 5; i++) {
            const tier = getRandomTier(probabilities);
            const card = getRandomCardFromTier(tier);
            if (card)
                drawnCards.push(card);
        }
        // 3. UserCard DB 업데이트
        // 뽑은 카드마다 UserCard 문서 조회 후 없으면 생성, 있으면 count 증가 및 owned true 변경
        for (const card of drawnCards) {
            const existingUserCard = await UserCard_1.default.findOne({ user: userId, card: card._id });
            if (existingUserCard) {
                existingUserCard.count += 1;
                existingUserCard.owned = true;
                await existingUserCard.save();
            }
            else {
                const newUserCard = new UserCard_1.default({
                    user: userId,
                    card: card._id,
                    count: 1,
                    owned: true,
                });
                await newUserCard.save();
            }
        }
        function getRandomCardFromTier(tier) {
            const tierCards = allCards.filter(card => card.attack === tier || card.hp === tier);
            if (tierCards.length === 0)
                return null;
            return tierCards[Math.floor(Math.random() * tierCards.length)];
        }
        // 반환 부분
        res.status(200).json({
            message: "카드 뽑기 성공",
            drawnCards: drawnCards.map(c => ({
                id: c._id,
                name: c.cardName,
                image3D: c.image3DColor,
                image3DGray: c.image3DGray,
                damage: c.attack,
                hp: c.hp,
            })),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "카드 뽑기 실패", error });
    }
});
exports.default = router;
