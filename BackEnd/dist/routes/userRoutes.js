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
router.get("/me", isAuthenticated_1.isAuthenticated, async (req, res) => {
    console.log("/api/user/me 요청 처리");
    if (!req.user) {
        return res.status(401).json({ message: "인증이 필요합니다." });
    }
    try {
        const user = await User_1.default.findById(req.user.userId).select("username nickname money");
        if (!user) {
            return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ message: "서버 오류", error: err });
    }
});
exports.default = router;
