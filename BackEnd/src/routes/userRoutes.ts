import { Router, Response, Request } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";
import UserCard from "../models/UserCard";
import Card from "../models/Card";
import { Types } from "mongoose";

const router = Router();

console.log("userRoutes 라우터 로드됨");

router.get(
  "/me",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("/api/user/me 요청 처리");
    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    try {
      const user = await User.findById(req.user.id).select(
        "username nickname money"
      );
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

// 카드팩 개봉 API
router.post(
  "/draw-cards/:userId",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { packType } = req.body;

      if (!userId || !packType) {
        return res.status(400).json({ message: "userId 또는 packType 누락" });
      }

      // 카드 전부 불러오기
      const allCards = await Card.find();

      if (allCards.length === 0) {
        return res.status(500).json({ message: "카드 데이터가 존재하지 않습니다." });
      }

      // 패키지별 확률 정의 (예시)
      const getProbabilities = (pack: string): { [tier: number]: number } => {
        switch (pack) {
          case "B":
            return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
          case "A":
            return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
          case "S":
            return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 };
          default:
            return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
        }
      };

      const probabilities = getProbabilities(packType);

      function getRandomTier(probabilities: { [tier: number]: number }) {
        const rand = Math.random();
        let cumulative = 0;
        for (const tier in probabilities) {
          cumulative += probabilities[+tier] || 0;
          if (rand <= cumulative) return +tier;
        }
        return Math.max(...Object.keys(probabilities).map(Number));
      }

      // 티어에 맞는 카드 랜덤 선택 함수 (예: tier에 attack 또는 hp로 필터링)
      function getRandomCardFromTier(tier: number) {
        const tierCards = allCards.filter(
          (card) => card.attack === tier || card.hp === tier
        );
        if (tierCards.length === 0) return null;
        return tierCards[Math.floor(Math.random() * tierCards.length)];
      }

      const drawnCards = [];

      for (let i = 0; i < 5; i++) {
        const tier = getRandomTier(probabilities);
        const card = getRandomCardFromTier(tier);
        if (card) drawnCards.push(card);
      }

      // UserCard DB 업데이트
      for (const card of drawnCards) {
        const existingUserCard = await UserCard.findOne({ user: userId, card: card._id });
        if (existingUserCard) {
          existingUserCard.count += 1;
          existingUserCard.owned = true;
          await existingUserCard.save();
        } else {
          const newUserCard = new UserCard({
            user: userId,
            card: card._id,
            count: 1,
            owned: true,
          });
          await newUserCard.save();
        }
      }

      res.status(200).json({
        message: "카드 뽑기 성공",
        drawnCards: drawnCards.map((c) => ({
          id: c._id,
          name: c.cardName,
          image3D: c.image3DColor,
          image3DGray: c.image3DGray,
          damage: c.attack,
          hp: c.hp,
        })),
      });
    } catch (error) {
      console.error("카드팩 개봉 오류:", error);
      res.status(500).json({ message: "카드팩 개봉 실패", error });
    }
  }
);

export default router;
