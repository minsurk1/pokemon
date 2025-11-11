"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userCardRoutes.ts
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = express_1.default.Router();
/**
 * ✅ 1) 특정 유저 ID로 카드 조회 (관리자용 또는 디버그용)
 * ex) GET /api/usercard/68e123.../cards
 */
router.get("/:userId/cards", isAuthenticated_1.isAuthenticated, async (req, res) => {
    try {
        const { userId } = req.params;
        // ✅ MongoDB ObjectId 유효성 검증
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "유효하지 않은 userId 형식입니다." });
        }
        const userCards = await UserCard_1.default.find({ user: userId }).populate("card");
        // ✅ 카드 데이터 정리
        const formattedCards = userCards.map((uc) => {
            const card = uc.card;
            return {
                cardId: card?._id?.toString() ?? "",
                name: card?.cardName ?? "이름 없음",
                cardType: card?.cardType ?? "normal", // ✅ 타입 추가
                attack: card?.attack ?? 0,
                hp: card?.hp ?? 0,
                tier: card?.tier ?? 0,
                cost: card?.cost ?? card?.tier ?? 1, // ✅ cost 추가 (없을 때 tier)
                image: card?.image2D ?? "default.png",
                image2D: card?.image2D ?? "default.png", // ✅ 2D 이미지 통일
                count: uc.count ?? 0,
                owned: uc.owned ?? false,
            };
        });
        res.status(200).json({ userCards: formattedCards });
    }
    catch (err) {
        console.error("❌ 유저 카드 조회 오류:", err);
        res.status(500).json({ message: err.message || "카드 조회 실패" });
    }
});
/**
 * ✅ 2) 로그인한 본인의 카드 조회 (보안 강화 버전)
 * ex) GET /api/usercard/my-cards
 */
router.get("/my-cards", isAuthenticated_1.isAuthenticated, async (req, res) => {
    try {
        const user = req.user;
        if (!user?._id) {
            return res.status(401).json({ message: "인증 실패: 유효하지 않은 토큰입니다." });
        }
        const userId = user._id;
        // ✅ MongoDB ObjectId 유효성 검증
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
        }
        const userCards = await UserCard_1.default.find({ user: userId }).populate("card");
        const formattedCards = userCards.map((uc) => {
            const card = uc.card;
            return {
                cardId: card?._id?.toString() ?? "",
                name: card?.cardName ?? "이름 없음",
                cardType: card?.cardType ?? "normal", // ✅ 타입 추가
                attack: card?.attack ?? 0,
                hp: card?.hp ?? 0,
                tier: card?.tier ?? 0,
                cost: card?.cost ?? card?.tier ?? 1, // ✅ cost 추가 (없을 때 tier)
                image: card?.image2D ?? "default.png",
                image2D: card?.image2D ?? "default.png", // ✅ 2D 이미지 통일
                count: uc.count ?? 0,
                owned: uc.owned ?? false,
            };
        });
        res.status(200).json({ userCards: formattedCards });
    }
    catch (err) {
        console.error("❌ 내 카드 조회 오류:", err);
        res.status(500).json({ message: err.message || "내 카드 조회 실패" });
    }
});
exports.default = router;
