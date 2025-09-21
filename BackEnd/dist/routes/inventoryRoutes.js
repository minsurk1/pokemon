"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// routes/inventoryRoutes.ts
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = express_1.default.Router();
// packType별 확률
function getProbabilities(packType) {
    switch (packType) {
        case "B": return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
        case "A": return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
        case "S": return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 };
        default: return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
    }
}
// 랜덤 등급 선택
function getRandomTier(probabilities) {
    const rand = Math.random();
    let cumulative = 0;
    for (const tier in probabilities) {
        cumulative += probabilities[+tier];
        if (rand <= cumulative)
            return +tier;
    }
    return Math.max(...Object.keys(probabilities).map(Number));
}
// ✅ 카드팩 개봉 API
router.post("/open-pack", isAuthenticated_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { type } = req.body; // packType
        if (!userId)
            return res.status(401).json({ message: "인증 실패" });
        const user = await User_1.default.findById(userId).populate("inventory.pack");
        if (!user)
            return res.status(404).json({ message: "유저를 찾을 수 없음" });
        const inventoryIndex = user.inventory.findIndex((p) => p.type === type);
        if (inventoryIndex === -1 || user.inventory[inventoryIndex].quantity <= 0) {
            return res.status(400).json({ message: "보유한 카드팩이 없습니다." });
        }
        // 수량 차감
        user.inventory[inventoryIndex].quantity -= 1;
        if (user.inventory[inventoryIndex].quantity <= 0)
            user.inventory.splice(inventoryIndex, 1);
        await user.save();
        const allCards = await Card_1.default.find({});
        const probabilities = getProbabilities(type);
        const drawnCards = [];
        for (let i = 0; i < 5; i++) {
            const tier = getRandomTier(probabilities);
            const tierCards = allCards.filter((card) => card.tier === tier);
            if (tierCards.length === 0)
                continue;
            const randomCard = tierCards[Math.floor(Math.random() * tierCards.length)];
            // _id 타입 단언 후 string으로 변환
            const cardId = randomCard._id.toString();
            drawnCards.push({
                id: cardId,
                name: randomCard.cardName,
                damage: randomCard.attack,
                hp: randomCard.hp,
                image: randomCard.image2D,
            });
            await UserCard_1.default.findOneAndUpdate({ user: userId, card: randomCard._id }, { $inc: { count: 1 }, $set: { owned: true } }, { upsert: true });
        }
        res.status(200).json({
            message: "카드팩 개봉 성공",
            drawnCards,
            userPacks: user.inventory.map((p) => ({
                packId: p.pack._id.toString(),
                type: p.type,
                quantity: p.quantity,
                image: p.pack.image,
                name: p.pack.name,
            })),
        });
    }
    catch (error) {
        console.error("카드팩 개봉 오류:", error);
        res.status(400).json({ message: error.message || "카드팩 개봉 실패" });
    }
});
exports.default = router;
