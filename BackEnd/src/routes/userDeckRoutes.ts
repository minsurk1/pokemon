// src/routes/userDeckRoutes.ts
import express from "express";
import UserDeck from "../models/UserDeck";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = express.Router();

// ✅ 유저의 덱 불러오기
router.get("/single", isAuthenticated, async (req, res) => {
  try {
    const { _id } = (req as AuthenticatedRequest).user; // ✅ 안전하게 캐스팅
    const deck = await UserDeck.findOne({ user: _id }).populate("cards");

    if (!deck) {
      return res.status(404).json({ message: "덱이 존재하지 않습니다." });
    }

    res.json({ deck });
  } catch (err) {
    console.error("❌ 덱 불러오기 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 덱 저장
router.post("/single/save", isAuthenticated, async (req, res) => {
  try {
    const { _id } = (req as AuthenticatedRequest).user; // ✅ 안전하게 캐스팅
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({ message: "잘못된 카드 데이터 형식입니다." });
    }

    let deck = await UserDeck.findOne({ user: _id });

    if (!deck) {
      deck = new UserDeck({ user: _id, cards });
    } else {
      deck.cards = cards;
    }

    await deck.save();
    res.json({ message: "덱 저장 완료", deck });
  } catch (err) {
    console.error("❌ 덱 저장 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
