// src/routes/userCardRoutes.ts
import express, { Response } from "express";
import mongoose from "mongoose";
import UserCard from "../models/UserCard";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import { ICard } from "../models/Card";

const router = express.Router();

/**
 * ✅ 1) 특정 유저 ID로 카드 조회 (관리자용 또는 디버그용)
 * ex) GET /api/usercard/68e123.../cards
 */
router.get("/:userId/cards", isAuthenticated, async (req, res: Response) => {
  try {
    const { userId } = req.params;

    // ✅ MongoDB ObjectId 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "유효하지 않은 userId 형식입니다." });
    }

    const userCards = await UserCard.find({ user: userId }).populate("card");

    // ✅ 카드 데이터 정리
    const formattedCards = userCards.map((uc) => {
      const card = uc.card as unknown as ICard;
      return {
        cardId: card?._id?.toString() ?? "",
        name: card?.cardName ?? "이름 없음",
        damage: card?.attack ?? 0,
        hp: card?.hp ?? 0,
        tier: card?.tier ?? 0,
        image: card?.image2D ?? "default.png",
        count: uc.count ?? 0,
        owned: uc.owned ?? false,
      };
    });

    res.status(200).json({ userCards: formattedCards });
  } catch (err: any) {
    console.error("❌ 유저 카드 조회 오류:", err);
    res.status(500).json({ message: err.message || "카드 조회 실패" });
  }
});

/**
 * ✅ 2) 로그인한 본인의 카드 조회 (보안 강화 버전)
 * ex) GET /api/usercard/my-cards
 */
router.get("/my-cards", isAuthenticated, async (req, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증 실패: 유효하지 않은 토큰입니다." });
    }

    const userId = user._id;

    // ✅ MongoDB ObjectId 유효성 검증
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    const userCards = await UserCard.find({ user: userId }).populate("card");

    const formattedCards = userCards.map((uc) => {
      const card = uc.card as unknown as ICard;
      return {
        cardId: card?._id?.toString() ?? "",
        name: card?.cardName ?? "이름 없음",
        damage: card?.attack ?? 0,
        hp: card?.hp ?? 0,
        tier: card?.tier ?? 0,
        image: card?.image2D ?? "default.png",
        count: uc.count ?? 0,
        owned: uc.owned ?? false,
      };
    });

    res.status(200).json({ userCards: formattedCards });
  } catch (err: any) {
    console.error("❌ 내 카드 조회 오류:", err);
    res.status(500).json({ message: err.message || "내 카드 조회 실패" });
  }
});

export default router;
