"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
console.log("userRoutes 라우터 로드됨");
// ✅ 유저 돈 추가 (치트용) - 개발 끝나면 삭제
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
// ✅ 로그인한 유저 정보 가져오기
router.get("/me", isAuthenticated_1.isAuthenticated, async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "인증이 필요합니다." });
    }
    try {
        const userId = req.user.id;
        const user = await User_1.default.findById(userId).lean();
        if (!user)
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        res.json({
            nickname: user.nickname,
            money: user.money,
            inventory: user.inventory || [],
        });
    }
    catch (err) {
        res.status(500).json({ message: "서버 오류", error: err });
    }
});
exports.default = router;
