import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";
import UserCard from "../models/UserCard";
import Card from "../models/Card";

const router = Router();

// 카드팩 가격 설정
const cardPrices: { [key: string]: number } = {
  "B급 카드팩": 100,
  "A급 카드팩": 300,
  "S급 카드팩": 500,
};

router.post(
  "/buy",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { cardType } = req.body;

    console.log("userId:", req.user?.id);

    if (!userId || !cardType) {
      return res.status(400).json({ message: "userId 또는 cardType 누락" });
    }

    try {
      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

      const price = cardPrices[cardType];
      if (!price)
        return res.status(400).json({ message: "잘못된 카드팩 타입" });

      if (user.money < price) {
        return res.status(400).json({ message: "잔액 부족" });
      }

      // 💰 돈 차감
      user.money -= price;
      await user.save();

      // 카드팩 랜덤 생성
      const allCards = await Card.find();
      if (!allCards.length)
        return res.status(500).json({ message: "카드 데이터 없음" });

      const drawnCards = [];
      for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * allCards.length);
        drawnCards.push(allCards[randomIndex]);
      }

      // UserCard에 추가
      for (const card of drawnCards) {
        const existing = await UserCard.findOne({
          user: userId,
          card: card._id,
        });
        if (existing) {
          existing.count += 1;
          existing.owned = true;
          await existing.save();
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
        message: `${cardType} 구매 완료`,
        money: user.money,
        drawnCards: drawnCards.map((c) => ({
          id: c._id,
          name: c.cardName,
          image3D: c.image3DColor,
          image3DGray: c.image3DGray,
          attack: c.attack,
          hp: c.hp,
        })),
      });
    } catch (err) {
      console.error("카드팩 구매 오류:", err);
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

export default router;
