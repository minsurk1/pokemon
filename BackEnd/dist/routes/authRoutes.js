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
dotenv_1.default.config();
const router = (0, express_1.Router)();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("❌ JWT_SECRET 환경 변수가 설정되지 않았습니다.");
}
// ✅ 회원가입
router.post("/signup", async (req, res) => {
    console.log("📩 회원가입 요청 도착");
    const { username, password, email, nickname } = req.body;
    try {
        // 필드 검증
        if (!username || !password || !email || !nickname) {
            return res.status(400).json({ success: false, message: "모든 필드를 입력해주세요." });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "비밀번호는 최소 8자 이상이어야 합니다." });
        }
        // 중복 검사
        if (await User_1.default.findOne({ username })) {
            return res.status(400).json({ success: false, message: "이미 사용 중인 아이디입니다." });
        }
        if (await User_1.default.findOne({ email })) {
            return res.status(400).json({ success: false, message: "이미 사용 중인 이메일입니다." });
        }
        if (await User_1.default.findOne({ nickname })) {
            return res.status(400).json({ success: false, message: "이미 사용 중인 닉네임입니다." });
        }
        // 비밀번호 해싱
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // 유저 생성
        const newUser = new User_1.default({
            username,
            password: hashedPassword,
            email,
            nickname,
            money: 1200,
        });
        const savedUser = await newUser.save();
        // JWT 발급 (_id 기준)
        const token = jsonwebtoken_1.default.sign({ _id: savedUser._id.toString(), username: savedUser.username }, jwtSecret, { expiresIn: "1h" });
        return res.status(201).json({
            success: true,
            message: "회원가입 성공!",
            token,
            user: {
                _id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email,
                nickname: savedUser.nickname,
                money: savedUser.money,
            },
        });
    }
    catch (err) {
        console.error("❌ 회원가입 오류:", err.message);
        return res.status(500).json({ success: false, message: "회원가입 실패", error: err.message });
    }
});
// ✅ 로그인
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력해주세요." });
        }
        const user = await User_1.default.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: "아이디 또는 비밀번호가 잘못되었습니다." });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "아이디 또는 비밀번호가 잘못되었습니다." });
        }
        // JWT 발급 (_id 기준)
        const token = jsonwebtoken_1.default.sign({ _id: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: "1h" });
        return res.json({
            success: true,
            message: "로그인 성공!",
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                nickname: user.nickname,
                money: user.money,
            },
        });
    }
    catch (error) {
        console.error("❌ 로그인 오류:", error.message);
        return res.status(500).json({ success: false, message: "로그인 실패", error: error.message });
    }
});
exports.default = router;
