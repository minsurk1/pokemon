"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const router = express_1.default.Router();
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User_1.default.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = new User_1.default({
            username,
            password: hashedPassword,
        });
        await newUser.save();
        // === 회원가입 시 파이리 지급 ===
        const defaultCard = await Card_1.default.findOne({ name: "파이리" });
        if (defaultCard) {
            const userCard = new UserCard_1.default({
                user: newUser._id,
                card: defaultCard._id,
                count: 1,
            });
            await userCard.save();
        }
        else {
            console.warn("파이리 카드가 데이터베이스에 없습니다.");
        }
        const token = jsonwebtoken_1.default.sign({ id: newUser._id }, process.env.JWT_SECRET || "default_secret", {
            expiresIn: "7d",
        });
        res.status(201).json({ message: "회원가입 성공", token });
    }
    catch (error) {
        console.error("회원가입 실패:", error);
        res.status(500).json({ message: "회원가입 실패" });
    }
});
exports.default = router;
