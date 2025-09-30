import { Router, Response } from "express";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import UserDeck from "../models/UserDeck";
import mongoose from "mongoose";

const router = Router();

// ✅ 유저 덱 조회
router.get("/", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "인증되지 않았습니다." });

    const userDeck = await UserDeck.findOne({ user: userId }).populate("decks.cards");

    if (!userDeck) {
      return res.json({ decks: [] });
    }

    // 🔥 ObjectId → string 변환해서 내려주기
    const decks = userDeck.decks.map((deck) => ({
      _id: deck._id?.toString(),
      name: deck.name,
      cards: deck.cards.map((card: any) => card.toString()), // ✅ 핵심
      createdAt: deck.createdAt,
    }));

    res.json({ decks });
  } catch (err) {
    console.error("덱 조회 실패:", err);
    res.status(500).json({ message: "덱 조회 실패" });
  }
});

// ✅ 새 덱 저장 (덱 이름과 카드 배열)
router.post("/save", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { name, cards } = req.body;

    if (!userId) return res.status(401).json({ message: "인증되지 않았습니다." });
    if (!name || !Array.isArray(cards) || cards.length === 0)
      return res.status(400).json({ message: "덱 이름과 카드 배열이 필요합니다." });

    // 카드 ObjectId 배열로 변환
    const cardIds = cards.map((c: string) => new mongoose.Types.ObjectId(c));

    // 기존 유저덱 가져오기
    let userDeck = await UserDeck.findOne({ user: userId });

    if (!userDeck) {
      // 새 유저덱 생성
      userDeck = new UserDeck({ user: userId, decks: [{ name, cards: cardIds }] });
    } else {
      // 기존 덱 배열에 추가
      userDeck.decks.push({ name, cards: cardIds });
    }

    await userDeck.save();

    // 🔥 응답할 때도 ObjectId → string 변환
    const savedDeck = userDeck.decks[userDeck.decks.length - 1];
    res.json({
      message: "덱 저장 완료",
      deck: {
        _id: savedDeck._id?.toString(),
        name: savedDeck.name,
        cards: savedDeck.cards.map((c: any) => c.toString()),
      },
    });
  } catch (err) {
    console.error("덱 저장 실패:", err);
    res.status(500).json({ message: "덱 저장 중 오류 발생" });
  }
});

// ✅ 덱 삭제
router.delete("/:deckId", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { deckId } = req.params;

    if (!userId) return res.status(401).json({ message: "인증되지 않았습니다." });

    const userDeck = await UserDeck.findOne({ user: userId });
    if (!userDeck) return res.status(404).json({ message: "덱을 찾을 수 없습니다." });

    // _id 기준으로 서브도큐먼트 제거
    userDeck.decks = userDeck.decks.filter((deck) => deck._id?.toString() !== deckId);
    await userDeck.save();

    res.json({ message: "덱 삭제 완료" });
  } catch (err) {
    console.error("덱 삭제 실패:", err);
    res.status(500).json({ message: "덱 삭제 중 오류 발생" });
  }
});

export default router;
