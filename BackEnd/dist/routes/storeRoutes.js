"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/storeRoutes.ts
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const CardPack_1 = __importDefault(require("../models/CardPack"));
const User_1 = __importDefault(require("../models/User"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = (0, express_1.Router)();
/**
 * ✅ 1) 카드팩 전체 조회
 * GET /api/store/card-packs
 */
router.get("/card-packs", async (req, res) => {
    try {
        const packs = await CardPack_1.default.find({});
        const result = packs.map((p) => ({
            id: p._id,
            name: p.name,
            type: p.type,
            image: p.image,
            price: p.price,
        }));
        res.status(200).json(result);
    }
    catch (err) {
        console.error("❌ 카드팩 조회 실패:", err);
        res.status(500).json({ message: "카드팩 조회 실패" });
    }
});
/**
 * ✅ 2) 카드팩 구매
 * POST /api/store/buy
 */
router.post("/buy", isAuthenticated_1.isAuthenticated, async (req, res) => {
    try {
        // ✅ 안전한 접근 (undefined 방지)
        const user = req.user;
        if (!user?._id) {
            return res.status(401).json({ message: "인증 실패: 유효하지 않은 사용자 정보입니다." });
        }
        const userId = user._id;
        const { packType } = req.body;
        if (!packType) {
            return res.status(400).json({ message: "packType 누락" });
        }
        // ✅ ObjectId 유효성 검증
        if (!mongoose_1.default.isValidObjectId(userId)) {
            return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
        }
        // ✅ 사용자 조회
        const userData = await User_1.default.findById(userId).populate("inventory.pack");
        if (!userData) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        // ✅ 카드팩 조회
        const cardPack = await CardPack_1.default.findOne({ type: packType });
        if (!cardPack) {
            return res.status(404).json({ message: "해당 카드팩을 찾을 수 없습니다." });
        }
        // ✅ 잔액 확인
        if (userData.money < cardPack.price) {
            return res.status(400).json({ message: "잔액이 부족합니다." });
        }
        // ✅ 금액 차감
        userData.money -= cardPack.price;
        // ✅ 기존 팩 존재 여부 확인 (populate 이후 비교)
        const existingPack = userData.inventory?.find((i) => i.pack && i.pack._id && i.pack._id.equals(cardPack._id));
        if (existingPack) {
            existingPack.quantity += 1;
            console.log(`🟢 기존 팩(${existingPack.type}) 수량 +1`);
        }
        else {
            userData.inventory.push({
                pack: cardPack._id,
                type: cardPack.type,
                quantity: 1,
                opened: false,
            });
            console.log(`🟢 새 팩(${cardPack.type}) 추가`);
        }
        await userData.save();
        // ✅ 갱신된 유저 데이터 재조회
        const updatedUser = await User_1.default.findById(userId).populate("inventory.pack");
        res.status(200).json({
            message: `${cardPack.name} 구매 완료`,
            updatedMoney: updatedUser?.money ?? 0,
            user: updatedUser,
        });
    }
    catch (err) {
        console.error("❌ 카드팩 구매 실패:", err);
        res.status(500).json({ message: err.message || "서버 오류" });
    }
});
exports.default = router;
