"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const User_1 = __importDefault(require("../models/User"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const router = (0, express_1.Router)();
console.log("userRoutes 라우터 로드됨");
// ✅ 유저 돈 추가 (치트용) 개발 끝나면 삭제할 것
router.post("/add-money", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    const { amount } = req.body;
    if (!userId)
        return res.status(401).json({ message: "로그인이 필요합니다." });
    if (!amount || typeof amount !== "number")
        return res.status(400).json({ message: "amount 필요" });
    try {
        const user = await User_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        user.money += amount;
        await user.save();
        res
            .status(200)
            .json({ message: `돈 ${amount}G 추가 완료`, money: user.money });
    }
    catch (err) {
        console.error("돈 추가 오류:", err);
        res.status(500).json({ message: "서버 오류", error: err });
    }
});
// GET /api/user/me
router.get("/me", isAuthenticated_1.isAuthenticated, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "인증이 필요합니다." });
    }
    try {
        const userId = req.user.id; // JWT 미들웨어에서 가져온 userId
        const user = await User_1.default.findById(userId).lean();
        if (!user)
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        res.json({
            nickname: user.nickname,
            money: user.money,
        });
    }
    catch (err) {
        res.status(500).json({ message: "서버 오류", error: err });
    }
});
// GET /api/user/user-cards/:userId
router.get("/user-cards/:userId", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.params.userId;
    try {
        const userCards = await UserCard_1.default.find({ user: userId }).populate("card");
        if (!userCards || userCards.length === 0)
            return res
                .status(404)
                .json({ message: "해당 유저의 카드 정보를 찾을 수 없습니다." });
        res.json(userCards);
    }
    catch (error) {
        console.error("유저 카드 조회 오류:", error);
        res.status(500).json({ message: "서버 오류", error });
    }
});
// POST /api/user/draw-cards
router.post("/draw-cards", isAuthenticated_1.isAuthenticated, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { packType } = req.body;
        if (!userId || !packType)
            return res.status(400).json({ message: "userId 또는 packType 누락" });
        const allCards = await Card_1.default.find();
        if (allCards.length === 0)
            return res
                .status(500)
                .json({ message: "카드 데이터가 존재하지 않습니다." });
        const getProbabilities = (pack) => {
            switch (pack) {
                case "B":
                    return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
                case "A":
                    return {
                        1: 0.23,
                        2: 0.2,
                        3: 0.18,
                        4: 0.15,
                        5: 0.12,
                        6: 0.08,
                        7: 0.04,
                    };
                case "S":
                    return {
                        1: 0.18,
                        2: 0.16,
                        3: 0.15,
                        4: 0.14,
                        5: 0.12,
                        6: 0.1,
                        7: 0.08,
                        8: 0.07,
                    };
                default:
                    return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
            }
        };
        const probabilities = getProbabilities(packType);
        const getRandomTier = (probabilities) => {
            const rand = Math.random();
            let cumulative = 0;
            for (const tier in probabilities) {
                cumulative += probabilities[+tier] || 0;
                if (rand <= cumulative)
                    return +tier;
            }
            return Math.max(...Object.keys(probabilities).map(Number));
        };
        const getRandomCardFromTier = (tier) => {
            const tierCards = allCards.filter((card) => card.tier === tier);
            if (tierCards.length === 0)
                return null;
            return tierCards[Math.floor(Math.random() * tierCards.length)];
        };
        const drawnCards = [];
        let attempts = 0;
        while (drawnCards.length < 5 && attempts < 20) {
            const tier = getRandomTier(probabilities);
            const card = getRandomCardFromTier(tier);
            if (card)
                drawnCards.push(card);
            attempts++;
        }
        for (const card of drawnCards) {
            const existingUserCard = await UserCard_1.default.findOne({
                user: userId,
                card: card._id,
            });
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
        res.status(200).json({
            message: "카드 뽑기 성공",
            drawnCards: drawnCards.map((c) => ({
                id: c._id,
                name: c.cardName,
                image3D: c.image3DColor, // 🔧 imageColor → image3DColor
                image3DGray: c.image3DGray,
                damage: c.attack,
                hp: c.hp,
            })),
        });
    }
    catch (error) {
        console.error("카드팩 개봉 오류:", error);
        res.status(500).json({ message: "카드팩 개봉 실패", error });
    }
});
exports.default = router;
