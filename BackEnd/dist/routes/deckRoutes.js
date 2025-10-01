"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const Deck_1 = __importDefault(require("../models/Deck"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = express_1.default.Router();
// 1) 덱 생성
router.post("/create", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?._id;
    const { name } = req.body;
    if (!userId)
        return res.status(401).json({ message: "인증 실패" });
    const existing = await Deck_1.default.findOne({ user: userId, name });
    if (existing)
        return res.status(400).json({ message: "같은 이름의 덱이 이미 존재합니다." });
    const deck = new Deck_1.default({ user: userId, name, cards: [] });
    await deck.save();
    res.status(201).json({ message: "덱 생성 완료", deck });
});
// 2) 카드 추가
router.post("/add-card", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?._id;
    const { deckId, cardId } = req.body;
    if (!userId)
        return res.status(401).json({ message: "인증 실패" });
    const deck = await Deck_1.default.findOne({ _id: deckId, user: userId });
    if (!deck)
        return res.status(404).json({ message: "덱을 찾을 수 없음" });
    // 덱 최대 30장 확인
    if (deck.cards.length >= 30)
        return res.status(400).json({ message: "덱은 최대 30장입니다." });
    // UserCard에서 소유 수량 확인
    const userCard = await UserCard_1.default.findOne({ user: userId, card: cardId });
    const countInDeck = deck.cards.filter((c) => c.toString() === cardId).length;
    if (!userCard || countInDeck >= userCard.count) {
        return res.status(400).json({ message: "창고에 있는 카드 수량을 초과할 수 없습니다." });
    }
    deck.cards.push(new mongoose_1.default.Types.ObjectId(cardId));
    await deck.save();
    res.status(200).json({ message: "카드 추가 완료", deck });
});
// 3) 카드 제거
router.post("/remove-card", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?._id;
    const { deckId, cardId } = req.body;
    if (!userId)
        return res.status(401).json({ message: "인증 실패" });
    const deck = await Deck_1.default.findOne({ _id: deckId, user: userId });
    if (!deck)
        return res.status(404).json({ message: "덱을 찾을 수 없음" });
    const index = deck.cards.findIndex((c) => c.toString() === cardId);
    if (index === -1)
        return res.status(400).json({ message: "덱에 해당 카드가 없습니다." });
    deck.cards.splice(index, 1);
    await deck.save();
    res.status(200).json({ message: "카드 제거 완료", deck });
});
// 4) 덱 조회
router.get("/my-decks", isAuthenticated_1.isAuthenticated, async (req, res) => {
    const userId = req.user?._id;
    const decks = await Deck_1.default.find({ user: userId }).populate("cards");
    res.status(200).json({ decks });
});
exports.default = router;
