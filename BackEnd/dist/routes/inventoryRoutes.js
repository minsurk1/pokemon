"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/inventoryRoutes.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = express_1.default.Router();
/**
 * 🎲 packType별 확률
 */
function getProbabilities(packType) {
    switch (packType) {
        case "B":
            return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
        case "A":
            return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
        case "S":
            return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 };
        default:
            // 기본값 (B팩 확률)
            return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
    }
}
/**
 * 🎯 랜덤 등급 선택
 */
function getRandomTier(probabilities) {
    const rand = Math.random();
    let cumulative = 0;
    for (const tier in probabilities) {
        cumulative += probabilities[+tier];
        if (rand <= cumulative)
            return +tier;
    }
    const tiers = Object.keys(probabilities).map(Number);
    return tiers[tiers.length - 1]; // 만약의 경우 마지막 등급 반환
}
/**
 * ✅ 카드팩 개봉 API
 */
router.post("/open-pack", isAuthenticated_1.isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        if (!user?._id) {
            return res.status(401).json({ message: "인증 실패: 유효하지 않은 사용자입니다." });
        }
        const { type } = req.body;
        if (!type) {
            return res.status(400).json({ message: "packType(type) 누락" });
        }
        const userId = user._id;
        if (!mongoose_1.default.isValidObjectId(userId)) {
            return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
        }
        // ✅ 유저 + 인벤토리 조회
        const userData = await User_1.default.findById(userId).populate("inventory.pack");
        if (!userData)
            return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
        // ✅ 해당 타입의 카드팩 인벤토리 확인
        const packIndex = userData.inventory.findIndex((p) => p.type === type);
        if (packIndex === -1 || userData.inventory[packIndex].quantity <= 0) {
            return res.status(400).json({ message: "보유한 카드팩이 없습니다." });
        }
        // ✅ 카드팩 수량 차감
        userData.inventory[packIndex].quantity -= 1;
        // [수정] 수량이 0이 되면 배열에서 제거
        if (userData.inventory[packIndex].quantity <= 0) {
            userData.inventory.splice(packIndex, 1);
        }
        await userData.save();
        // ✅ 전체 카드 목록 로드 (필요한 필드만 선택적으로 로드하여 최적화)
        const allCards = await Card_1.default.find().select("cardName attack hp maxhp tier cost cardType image2D").lean();
        const probabilities = getProbabilities(type);
        const drawnCards = [];
        // --- ▼ [수정됨] 5장 보장을 위해 for 루프를 while 루프로 변경 ---
        while (drawnCards.length < 5) {
            const tier = getRandomTier(probabilities);
            const tierCards = allCards.filter((card) => card.tier === tier);
            // ⚠️ 해당 등급의 카드가 없으면, 루프의 다음 턴으로 넘어가서 다시 시도
            if (tierCards.length === 0) {
                console.warn(`[open-pack] 경고: ${tier}등급의 카드가 DB에 없습니다. 재시도합니다.`);
                continue; // 카드를 뽑지 않고 다시 while 루프 조건 검사
            }
            const randomCard = tierCards[Math.floor(Math.random() * tierCards.length)];
            // ✅ UserCard upsert (존재하면 +1, 없으면 새로 생성)
            // _id가 mongoose.Types.ObjectId 객체일 수 있으므로 ._id 사용
            await UserCard_1.default.findOneAndUpdate({ user: userId, card: randomCard._id }, {
                $inc: { count: 1 },
                $set: { owned: true }, // [수정] owned 플래그도 true로 설정
                $setOnInsert: { createdAt: new Date() },
            }, { upsert: true, new: true } // new: true는 upsert 시 생성된 문서를 반환 (여기선 불필요)
            );
            // ✅ 프론트엔드 전달용 데이터
            drawnCards.push({
                id: randomCard._id.toString(),
                name: randomCard.cardName,
                attack: randomCard.attack,
                hp: randomCard.hp,
                maxhp: randomCard.maxhp,
                tier: randomCard.tier,
                cost: randomCard.cost,
                cardType: randomCard.cardType,
                image: randomCard.image2D || "default.png",
            });
        }
        // --- ▲ [수정됨] 루프가 끝나면 drawnCards는 무조건 5장 ---
        // ✅ 최신 인벤토리 정보 재구성
        const userPacks = userData.inventory.map((p) => {
            const pack = p.pack;
            return {
                packId: pack?._id?.toString() || "",
                type: p.type,
                quantity: p.quantity,
                image: pack?.image || "",
                name: pack?.name || "",
            };
        });
        res.status(200).json({
            message: "카드팩 개봉 성공",
            drawnCards,
            userPacks,
        });
    }
    catch (error) {
        console.error("❌ 카드팩 개봉 오류:", error);
        res.status(500).json({ message: error.message || "카드팩 개봉 실패" });
    }
});
exports.default = router;
