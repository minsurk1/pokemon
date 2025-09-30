import { Router, Response } from "express";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import UserDeck from "../models/UserDeck";
import mongoose from "mongoose";

const router = Router();

// ✅ 유저 덱 조회
router.get("/", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userDeck = await UserDeck.findOne({ user: req.user?._id }).populate("cards");
    res.json({ deck: userDeck });
  } catch (err) {
    console.error("덱 조회 실패:", err);
    res.status(500).json({ message: "덱 조회 실패" });
  }
});

// ✅ 덱 저장/업데이트
router.post("/save", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, cards } = req.body;
    const cardIds = cards.map((c: string) => new mongoose.Types.ObjectId(c));

    let userDeck = await UserDeck.findOne({ user: req.user?._id });

    if (!userDeck) {
      userDeck = new UserDeck({ user: req.user?._id, name, cards: cardIds });
    } else {
      userDeck.name = name;
      userDeck.cards = cardIds;
    }

    await userDeck.save();
    res.json({ message: "덱 저장 완료", deck: userDeck });
  } catch (err) {
    console.error("덱 저장 실패:", err);
    res.status(500).json({ message: "덱 저장 중 오류 발생" });
  }
});

export default router;
