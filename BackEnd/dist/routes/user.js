"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const router = express_1.default.Router();
router.post("/register", async (req, res) => {
    try {
        const { username, password, ...otherFields } = req.body;
        // 1. User 생성
        const newUser = new User_1.default({ username, password, ...otherFields });
        await newUser.save();
        // 2. 카드 목록 조회 (전체 카드)
        const allCards = await Card_1.default.find({});
        // 3. UserCard 데이터 배열 생성
        const userCardsToCreate = allCards.map((card) => {
            return {
                user: newUser._id,
                card: card._id,
                count: card.cardName === "파이리" ? 1 : 0, // 파이리만 1개 기본 지급
                owned: card.cardName === "파이리" ? true : false,
            };
        });
        // 4. UserCard 컬렉션에 한꺼번에 저장
        await UserCard_1.default.insertMany(userCardsToCreate);
        res.status(201).json({ message: "회원가입 성공", userId: newUser._id });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "회원가입 실패", error });
    }
});
exports.default = router;
