"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CardPack_1 = __importDefault(require("../models/CardPack"));
const User_1 = __importDefault(require("../models/User"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = (0, express_1.Router)();
// ✅ 카드팩 전체 조회
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
        res.json(result);
    }
    catch (err) {
        console.error("카드팩 조회 실패:", err);
        res.status(500).json({ message: "카드팩 조회 실패" });
    }
});
// ✅ 카드팩 구매
router.post("/buy", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?.id;
    const { packType } = req.body;
    if (!userId || !packType)
        return res.status(400).json({ message: "userId 또는 packType 누락" });
    try {
        const user = await User_1.default.findById(userId).populate("inventory.pack");
        if (!user)
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        const cardPack = await CardPack_1.default.findOne({ type: packType });
        if (!cardPack)
            return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });
        if (user.money < cardPack.price)
            return res.status(400).json({ message: "잔액 부족" });
        user.money -= cardPack.price;
        const existingPack = user.inventory.find((i) => i.pack.equals(cardPack._id));
        if (existingPack) {
            existingPack.quantity += 1;
        }
        else {
            user.inventory.push({
                pack: cardPack._id,
                type: cardPack.type,
                quantity: 1,
                opened: false,
            });
        }
        await user.save();
        const updatedUser = await User_1.default.findById(userId).populate("inventory.pack");
        res.json({ message: `${cardPack.name} 구매 완료`, user: updatedUser });
    }
    catch (err) {
        console.error("카드팩 구매 실패:", err);
        res.status(500).json({ message: "서버 오류" });
    }
});
exports.default = router;
