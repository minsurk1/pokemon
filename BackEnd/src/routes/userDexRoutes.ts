// src/routes/userDexRoutes.ts
import { Router } from "express";
import mongoose from "mongoose";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import UserDeck from "../models/UserDeck";

const router = Router();

/**
 * ✅ 유저 도감용 보유 카드 목록 조회
 * GET /api/dex/owned-cards
 */
router.get("/owned-cards", isAuthenticated, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!mongoose.isValidObjectId(user._id)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    const deck = await UserDeck.findOne({ user: user._id }).lean();

    if (!deck) {
      return res.json({ ownedCards: [] });
    }

    // ✅ type + tier만 추출
    const ownedCards = deck.cards.map((c) => ({
      cardType: c.cardType,
      tier: c.tier,
    }));

    return res.status(200).json({ ownedCards });
  } catch (err: any) {
    console.error("❌ owned-cards 오류:", err);
    return res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

export default router;
