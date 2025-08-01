import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";

import User from "../models/User";
import UserCard from "../models/UserCard";
import Card from "../models/Card";

const router = Router();

console.log("userRoutes 라우터 로드됨");

// GET /api/user/me
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

// GET /api/user/user-cards/:userId
router.get(
  "/user-cards/:userId",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.params.userId;

    try {
      const userCards = await UserCard.find({ user: userId }).populate("card");
      if (!userCards) {
        return res
          .status(404)
          .json({ message: "해당 유저의 카드 정보를 찾을 수 없습니다." });
      }
      res.json(userCards);
    } catch (error) {
      console.error("유저 카드 조회 오류:", error);
      res.status(500).json({ message: "서버 오류", error });
    }
  }
);

// POST /api/user/draw-cards
router.post(
  "/draw-cards",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const { packType } = req.body;

      if (!userId || !packType) {
        return res.status(400).json({ message: "userId 또는 packType 누락" });
      }

      const allCards = await Card.find();
      if (allCards.length === 0) {
        return res
          .status(500)
          .json({ message: "카드 데이터가 존재하지 않습니다." });
      }

      const getProbabilities = (pack: string): { [tier: number]: number } => {
        switch (pack) {
          case "B":
            return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
          case "A":
            return {
              1: 0.23,
              2: 0.2,
              3: 0.18,
              4: 0.15,
              5: 0.12,
              6: 0.08,
              7: 0.04,
            };
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
      };

      const probabilities = getProbabilities(packType);

      const getRandomTier = (probabilities: { [tier: number]: number }) => {
        const rand = Math.random();
        let cumulative = 0;
        for (const tier in probabilities) {
          cumulative += probabilities[+tier] || 0;
          if (rand <= cumulative) return +tier;
        }
        return Math.max(...Object.keys(probabilities).map(Number));
      };

      const getRandomCardFromTier = (tier: number) => {
        const tierCards = allCards.filter((card) => card.tier === tier);
        if (tierCards.length === 0) return null;
        return tierCards[Math.floor(Math.random() * tierCards.length)];
      };

      const drawnCards = [];
      let attempts = 0;
      while (drawnCards.length < 5 && attempts < 20) {
        const tier = getRandomTier(probabilities);
        const card = getRandomCardFromTier(tier);
        if (card) drawnCards.push(card);
        attempts++;
      }

      for (const card of drawnCards) {
        const existingUserCard = await UserCard.findOne({
          user: userId,
          card: card._id,
        });
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
