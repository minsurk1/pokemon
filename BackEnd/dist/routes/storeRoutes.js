"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const User_1 = __importDefault(require("../models/User"));
const CardPack_1 = __importDefault(require("../models/CardPack"));
const router = (0, express_1.Router)();
// ✅ 카드팩 구매 라우트
router.post("/buy", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    const { packType } = req.body; // "B" | "A" | "S"
    if (!userId || !packType) {
        return res.status(400).json({ message: "userId 또는 packType 누락" });
    }
    try {
        // 1. 사용자 조회
        const user = await User_1.default.findById(userId).populate("inventory.pack");
        if (!user)
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        // 2. 카드팩 타입으로 조회
        console.log("요청 packType:", packType);
        const cardPack = await CardPack_1.default.findOne({ type: packType });
        console.log("찾은 카드팩:", cardPack);
        if (!cardPack)
            return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });
        // 3. 잔액 확인
        if (user.money < cardPack.price) {
            return res.status(400).json({ message: "잔액 부족" });
        }
        // 4. 돈 차감
        user.money -= cardPack.price;
        // 5. 인벤토리에 추가
        user.inventory.push({
            pack: cardPack._id,
            type: cardPack.type,
            quantity: 1,
            opened: false,
        });
        // 6. 저장
        await user.save();
        // 7. 최신 유저 정보 조회 및 반환
        const updatedUser = await User_1.default.findById(userId).populate("inventory.pack");
        res.status(200).json({
            message: `${cardPack.name} 구매 완료`,
            user: updatedUser, // ✅ 프론트에서 setUserInfo(updatedUser) 가능
        });
    }
    catch (err) {
        console.error("카드팩 구매 오류:", err);
        res.status(500).json({ message: "서버 오류", error: err });
    }
});
exports.default = router;
