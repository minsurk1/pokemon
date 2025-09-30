import { Router, Response } from "express";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import UserDeck from "../models/UserDeck";
import mongoose from "mongoose";

const router = Router();

// ✅ 단일 덱 조회
router.get("/", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 단일 덱만 조회
    const userDeck = await UserDeck.findOne({ user: req.user?._id }).populate("cards");
    if (!userDeck) return res.json({ deck: { cards: [] } }); // 덱이 없으면 빈 덱 반환
    res.json({ deck: userDeck });
  } catch (err) {
    console.error("단일 덱 조회 실패:", err);
    res.status(500).json({ message: "덱 조회 실패" });
  }
});

// ✅ 단일 덱 저장/업데이트
router.post("/save", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cards } = req.body; // 단일 덱이므로 name은 필요 없음
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ message: "카드 배열이 필요합니다." });
    }

    const cardIds = cards.map((c: string) => new mongoose.Types.ObjectId(c));

    // 기존 덱 가져오기
    let userDeck = await UserDeck.findOne({ user: req.user?._id });

    if (!userDeck) {
      // 덱이 없으면 새로 생성
      userDeck = new UserDeck({ user: req.user?._id, cards: cardIds });
    } else {
      // 기존 덱이 있으면 cards만 업데이트
      userDeck.cards = cardIds;
    }

    await userDeck.save();
    res.json({ message: "단일 덱 저장 완료", deck: userDeck });
  } catch (err) {
    console.error("단일 덱 저장 실패:", err);
    res.status(500).json({ message: "단일 덱 저장 중 오류 발생" });
  }
});

export default router;
