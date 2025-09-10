// routes/inventoryRoutes.ts
import express, { Response } from "express";
import UserPack from "../models/UserPack";
import UserCard from "../models/UserCard";
import Card from "../models/Card";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";

const router = express.Router();

// packType에 따른 등급별 확률
function getProbabilities(packType: string): { [key: number]: number } {
  switch (packType) {
    case "B":
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
    case "A":
      return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
    case "S":
      return {
        1: 0.18,
        2: 0.16,
        3: 0.15,
        4: 0.14,
        5: 0.12,
        6: 0.1,
        7: 0.08,
        8: 0.07,
      };
    default:
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
  }
}

// 확률 기반 랜덤 등급 선택
function getRandomTier(probabilities: { [key: number]: number }) {
  const rand = Math.random();
  let cumulative = 0;
  for (const tier in probabilities) {
    cumulative += probabilities[+tier];
    if (rand <= cumulative) return +tier;
  }
  return Math.max(...Object.keys(probabilities).map(Number));
}

// ✅ 카드팩 개봉 API (트랜잭션 제거, JWT 기반)
router.post(
  "/open-pack",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { packType } = req.body; // "B" | "A" | "S"
      if (!userId) return res.status(401).json({ message: "인증 실패" });

      // 1) 유저 팩 수량 차감
      const pack = await UserPack.findOneAndUpdate(
        { user: userId, packType, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } },
        { new: true }
      );

      if (!pack) {
        return res.status(400).json({ message: "보유한 카드팩이 없습니다." });
      }

      // 2) 카드 전체 불러오기 + 확률 적용
      const allCards = await Card.find({});
      const probabilities = getProbabilities(packType);

      // 3) 5장 뽑기
      const drawnCards: any[] = [];
      for (let i = 0; i < 5; i++) {
        const tier = getRandomTier(probabilities);
        const tierCards = allCards.filter((card) => card.tier === tier);
        if (tierCards.length === 0) continue;
        const randomCard =
          tierCards[Math.floor(Math.random() * tierCards.length)];
        drawnCards.push(randomCard);

        // 4) UserCard 컬렉션에 저장
        await UserCard.findOneAndUpdate(
          { user: userId, card: randomCard._id },
          { $inc: { count: 1 }, $set: { owned: true } },
          { upsert: true }
        );
      }

      // 5) 최신 UserPack 목록 반환
      const updatedInventory = await UserPack.find({ user: userId });

      res.status(200).json({
        message: "카드팩 개봉 성공",
        drawnCards: drawnCards.map((c) => ({
          id: c._id,
          name: c.cardName,
          damage: c.attack,
          hp: c.hp,
        })),
        userPacks: updatedInventory.map((p) => ({
          id: p._id,
          name: p.packType,
          type: p.packType[0] as "B" | "A" | "S",
          quantity: p.quantity,
          isOpened: p.opened ?? false,
        })),
      });
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ message: error.message || "카드팩 개봉 실패" });
    }
  }
);

export default router;
