import { Router, Response } from "express";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import UserDeck from "../models/UserDeck";

const router = Router();

// POST /api/userdeck/save
router.post("/save", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id; // ✅ 타입 보장됨
    const { deck } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "인증되지 않았습니다." });
    }

    if (!Array.isArray(deck) || deck.length === 0) {
      return res.status(400).json({ message: "덱이 비어있습니다." });
    }

    const userDeck = await UserDeck.findOneAndUpdate({ user: userId }, { cards: deck }, { new: true, upsert: true });

    res.json({ message: "덱 저장 완료", deck: userDeck });
  } catch (err) {
    console.error("덱 저장 실패:", err);
    res.status(500).json({ message: "덱 저장 중 오류 발생" });
  }
});

export default router;
