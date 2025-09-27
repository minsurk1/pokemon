import express, { Response } from "express";
import UserCard from "../models/UserCard";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import { ICard } from "../models/Card";

const router = express.Router();

// 유저가 보유한 카드 조회
router.get("/:userId/cards", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.params.userId;

    // UserCard에서 userId로 조회하고 Card 정보를 populate
    const userCards = await UserCard.find({ user: userId }).populate("card");

    // populate 후 card가 ObjectId 타입으로 추론되기 때문에 unknown 거쳐서 ICard로 단언
    const formattedCards = userCards.map((uc) => {
      const card = uc.card as unknown as ICard; 
      return {
        cardId: card._id.toString(),
        name: card.cardName,
        damage: card.attack,
        hp: card.hp,
        tier: card.tier,
        image: card.image2D,
        count: uc.count,
        owned: uc.owned,
      };
    });

    res.status(200).json({ userCards: formattedCards });
  } catch (err: any) {
    console.error("유저 카드 조회 오류:", err);
    res.status(400).json({ message: err.message || "카드 조회 실패" });
  }
});

export default router;
