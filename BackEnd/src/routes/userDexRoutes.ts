// src/routes/userDexRoutes.ts
import { Router } from "express";
import mongoose from "mongoose";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import UserCard from "../models/UserCard";
import { ICard } from "../models/Card";

const router = Router();

/**
 * ✅ 유저 도감용: 보유 카드(type + tier) 목록 조회
 * GET /api/dex/owned-cards
 */
router.get("/owned-cards", isAuthenticated, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    // ✅ count > 0 인 카드만 가져오기
    const userCards = await UserCard.find({
      user: userId,
      count: { $gt: 0 },
    })
      .populate("card") // ✅ Card 모델 포함
      .lean();

    // ✅ 도감에서 필요한 정보만 추출: cardType + tier
    const ownedCards = userCards.map((uc) => {
      const card = uc.card as unknown as ICard;

      return {
        cardType: card.cardType.toLowerCase(), // ✅ fire, water, forest...
        tier: card.tier, // ✅ 1~7
      };
    });

    return res.status(200).json({ ownedCards });
  } catch (err: any) {
    console.error("❌ 도감용 owned-cards 오류:", err);
    return res.status(500).json({
      message: "서버 오류",
      error: err.message,
    });
  }
});

export default router;
