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
// ✅ CORS 처리 미들웨어
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});
// ✅ 회원가입
router.post("/signup", async (req, res) => {
    console.log("📩 회원가입 요청 도착");
    console.log("받은 데이터:", req.body);
    const { username, password, email, nickname } = req.body;
    try {
        // 입력값 유효성 검사
        if (!username || !password || !email || !nickname) {
            console.log("❌ 필수 필드 누락");
            return res.status(400).json({ message: "모든 필드를 입력해주세요" });
        }
        // 이미 존재하는 유저인지 확인
        const existingUser = await User_1.default.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log("❌ 이미 존재하는 사용자:", existingUser);
            return res
                .status(400)
                .json({ message: "이미 사용 중인 아이디 또는 이메일입니다." });
        }
        // 비밀번호 해싱
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        console.log("🔐 비밀번호 해싱 완료");
        // 새 유저 생성
        const newUser = new User_1.default({
            username,
            password: hashedPassword,
            email,
            nickname,
            money: 1200,
        });
        const savedUser = await newUser.save();
        console.log("✅ 회원가입 성공, ID:", savedUser._id);
        // ✅ 모든 카드 불러오기
        const allCards = await Card_1.default.find();
        if (allCards.length === 0) {
            return res.status(500).json({ message: "카드 데이터가 존재하지 않습니다." });
        }
        // ✅ 유저 카드 도감 생성 (user, card 필드 _id 로 정확히 넣기)
        const userCards = allCards.map((card) => ({
            user: savedUser._id, // user 필드명 정확히
            card: card._id, // card 필드명 정확히
            count: card.name === "파이리" ? 1 : 0, // 파이리만 count 1
            owned: true, // 도감에는 항상 true (필요 시 조절 가능)
        }));
        await UserCard_1.default.insertMany(userCards);
        console.log("📘 도감 카드 생성 완료");
        res.status(201).json({ message: "회원가입 성공!" });
    }
    catch (err) {
        console.error("❌ 회원가입 오류:", err.message);
        res.status(500).json({ message: "회원가입 실패", error: err.message });
    }
});
// ✅ 로그인
router.post("/login", async (req, res) => {
    console.log("🔐 로그인 요청 도착");
    const { username, password } = req.body;
    console.log("입력받은 ID:", username);
    try {
        if (!username || !password) {
            console.log("❌ 로그인: 아이디 또는 비밀번호 누락");
            return res
                .status(400)
                .json({ message: "아이디와 비밀번호를 입력해주세요." });
        }
        const user = await User_1.default.findOne({ username });
        if (!user) {
            console.log("❌ 로그인 실패: 존재하지 않는 사용자");
            return res
                .status(400)
                .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ 로그인 실패: 비밀번호 불일치");
            return res
                .status(400)
                .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
        }
        console.log("✅ 로그인 성공, 사용자 ID:", user._id);
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: "1h" });
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
// 유저 정보 조회
router.get("/user-cards/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const userCards = await UserCard_1.default.find({ user: userId }).populate("card");
        res.json(userCards);
    }
    catch (err) {
        res.status(500).json({ message: "유저 카드 정보 불러오기 실패" });
    }
});
exports.default = router;
