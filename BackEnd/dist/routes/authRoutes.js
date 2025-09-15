"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
const Card_1 = __importDefault(require("../models/Card"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const jwtSecret = process.env.JWT_SECRET;
// ✅ 회원가입
router.post("/signup", async (req, res) => {
    console.log("📩 회원가입 요청 도착");
    const { username, password, email, nickname } = req.body;
    try {
        if (!username || !password || !email || !nickname) {
            return res.status(400).json({ message: "모든 필드를 입력해주세요" });
        }
        const existingUser = await User_1.default.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "이미 사용 중인 아이디 또는 이메일입니다." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = new User_1.default({
            username,
            password: hashedPassword,
            email,
            nickname,
            money: 1200,
        });
        const savedUser = await newUser.save();
        // 모든 카드 가져와서 UserCard 생성
        const allCards = await Card_1.default.find();
        if (!allCards.length) {
            return res
                .status(500)
                .json({ message: "카드 데이터가 존재하지 않습니다." });
        }
        const userCards = allCards.map((card) => ({
            user: savedUser._id,
            card: card._id,
            count: card.cardName === "파이리" ? 1 : 0, // 파이리만 count 1
            owned: true,
        }));
        await UserCard_1.default.insertMany(userCards);
        res.status(201).json({ message: "회원가입 성공!" });
    }
    catch (err) {
        console.error("❌ 회원가입 오류:", err.message);
        res.status(500).json({ message: "회원가입 실패", error: err.message });
    }
});
// ✅ 로그인
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: "아이디와 비밀번호를 입력해주세요." });
        }
        const user = await User_1.default.findOne({ username });
        if (!user) {
            return res
                .status(400)
                .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res
                .status(400)
                .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: "1h" });
        res.json({
            message: "로그인 성공!",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                nickname: user.nickname,
                money: user.money,
            },
        });
    }
    catch (error) {
        console.error("❌ 로그인 중 오류:", error.message);
        res.status(500).json({ message: "로그인 실패", error: error.message });
    }
});
exports.default = router;
