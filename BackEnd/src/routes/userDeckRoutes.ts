// src/routes/userDeckRoutes.ts
import express from "express";
import mongoose from "mongoose";
import UserDeck from "../models/UserDeck";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = express.Router();

/**
 * ✅ 유저의 단일 덱 불러오기
 */
router.get("/single", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?._id;

    if (!userId) {
      return res.status(401).json({ message: "인증 실패: 토큰이 유효하지 않습니다." });
    }

    const deck = await UserDeck.findOne({ user: userId }).populate("cards");

    if (!deck) {
      return res.status(404).json({ message: "덱이 존재하지 않습니다." });
    }

    res.status(200).json({ deck });
  } catch (err) {
    console.error("❌ 덱 불러오기 실패:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

/**
 * ✅ 덱 저장 (기존 덱이 없으면 새로 생성)
 */
router.post("/single/save", isAuthenticated, async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?._id;
    const { cards } = (req as AuthenticatedRequest).body as { cards: string[] };

    if (!userId) {
      return res.status(401).json({ message: "인증 실패: 토큰이 유효하지 않습니다." });
    }

    if (!Array.isArray(cards)) {
      return res.status(400).json({ message: "잘못된 카드 데이터 형식입니다." });
    }

    // ✅ string[] → ObjectId[] 변환
    const objectIds = cards.map((id) => new mongoose.Types.ObjectId(id));

    let deck = await UserDeck.findOne({ user: userId });

    if (!deck) {
      // 새로 생성
      deck = new UserDeck({
        user: new mongoose.Types.ObjectId(userId),
        cards: objectIds,
      });
    } else {
      // 기존 덱 갱신
      deck.cards = objectIds;
    }

    await deck.save();

    res.status(200).json({
      message: "✅ 덱 저장 완료",
      deck,
    });
  } catch (err) {
    console.error("❌ 덱 저장 실패:", err);
    res.status(500).json({ message: "서버 오류 발생" });
  }
});

export default router;
