// src/routes/inventoryRoutes.ts
import express, { Response } from "express";
import mongoose from "mongoose";
import User from "../models/User";
import UserCard from "../models/UserCard";
import Card, { ICard } from "../models/Card";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = express.Router();

/**
 * 🎲 packType별 확률
 */
function getProbabilities(packType: string): { [key: number]: number } {
  switch (packType) {
    case "B":
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
    case "A":
      return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
    case "S":
      return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 };
    default:
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
  }
}

/**
 * 🎯 랜덤 등급 선택
 */
function getRandomTier(probabilities: { [key: number]: number }) {
  const rand = Math.random();
  let cumulative = 0;
  for (const tier in probabilities) {
    cumulative += probabilities[+tier];
    if (rand <= cumulative) return +tier;
  }
  const tiers = Object.keys(probabilities).map(Number);
  return tiers[tiers.length - 1];
}

/**
 * ✅ 카드팩 개봉 API
 */
router.post("/open-pack", isAuthenticated, async (req, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증 실패: 유효하지 않은 사용자입니다." });
    }

    const { type } = req.body as { type: string };
    if (!type) {
      return res.status(400).json({ message: "packType(type) 누락" });
    }

    const userId = user._id;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    // ✅ 유저 + 인벤토리 조회
    const userData = await User.findById(userId).populate("inventory.pack");
    if (!userData) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

    // ✅ 해당 타입의 카드팩 인벤토리 확인
    const packIndex = userData.inventory.findIndex((p) => p.type === type);
    if (packIndex === -1 || userData.inventory[packIndex].quantity <= 0) {
      return res.status(400).json({ message: "보유한 카드팩이 없습니다." });
    }

    // ✅ 카드팩 수량 차감
    userData.inventory[packIndex].quantity -= 1;
    if (userData.inventory[packIndex].quantity <= 0) {
      userData.inventory.splice(packIndex, 1);
    }
    await userData.save();

    // ✅ 전체 카드 목록 로드
    const allCards: ICard[] = await Card.find();
    const probabilities = getProbabilities(type);
    const drawnCards: Record<string, any>[] = [];

    // ✅ 카드 5장 랜덤 추첨
    for (let i = 0; i < 5; i++) {
      const tier = getRandomTier(probabilities);
      const tierCards = allCards.filter((card) => card.tier === tier);
      if (tierCards.length === 0) continue;

      const randomCard = tierCards[Math.floor(Math.random() * tierCards.length)];

      // ✅ UserCard upsert (존재하면 +1, 없으면 새로 생성)
      await UserCard.findOneAndUpdate(
        { user: userId, card: randomCard._id },
        {
          $inc: { count: 1 },
          $setOnInsert: { createdAt: new Date(), updatedAt: new Date() },
        },
        { upsert: true }
      );

      // ✅ 프론트엔드 전달용 데이터
      drawnCards.push({
        id: randomCard._id.toString(),
        name: randomCard.cardName,
        damage: randomCard.attack,
        hp: randomCard.hp,
        tier: randomCard.tier,
        image: randomCard.image2D || "default.png",
      });
    }

    // ✅ 최신 인벤토리 정보 재구성
    const userPacks = userData.inventory.map((p) => {
      const pack = p.pack as any;
      return {
        packId: pack?._id?.toString() || "",
        type: p.type,
        quantity: p.quantity,
        image: pack?.image || "",
        name: pack?.name || "",
      };
    });

    res.status(200).json({
      message: "카드팩 개봉 성공",
      drawnCards,
      userPacks,
    });
  } catch (error: any) {
    console.error("❌ 카드팩 개봉 오류:", error);
    res.status(500).json({ message: error.message || "카드팩 개봉 실패" });
  }
});

export default router;
