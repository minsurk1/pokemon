import express from "express";
import mongoose from "mongoose";
import UserDeck from "../models/UserDeck";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = express.Router();

// ✅ 덱 불러오기 (로그인한 유저 기준)
router.get("/single", isAuthenticated, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증 실패: 토큰 오류" });
    }

    const userObjectId = new mongoose.Types.ObjectId(user._id);

    // ✅ 카드 정보 전체 populate (프론트 표시용)
    const deck = await UserDeck.findOne({ user: userObjectId })
      .populate({
        path: "cards.card",
        model: "Card",
        select: "_id cardName cardType attack hp tier image2D",
      })
      .lean();

    if (!deck) {
      return res.status(404).json({ message: "덱이 존재하지 않습니다." });
    }

    const BASE_URL = process.env.BASE_URL || "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

    // ✅ populate 된 카드 또는 저장된 카드 모두 대응
    const formattedDeck = {
      _id: deck._id,
      cards: (deck.cards || []).map((entry: any) => {
        const card = entry.card || entry;

        // ✅ image2D 우선순위: ① card.image2D → ② entry.image2D → ③ 기본값
        const image2DPath =
          card.image2D || entry.image2D
            ? `${BASE_URL}/images/${(card.image2D || entry.image2D).split("/").pop()}`
            : `${BASE_URL}/images/default.png`;

        return {
          id: card._id?.toString(),
          name: card.cardName ?? entry.name ?? "Unknown",
          cardType: card.cardType ?? entry.cardType ?? "fire",
          attack: card.attack ?? entry.attack ?? 0,
          hp: card.hp ?? entry.hp ?? 0,
          maxhp: card.maxhp ?? entry.maxhp ?? card.hp ?? entry.hp ?? 0,
          cost: entry.cost ?? card.tier ?? 1,
          tier: card.tier ?? entry.tier ?? 1,
          image2D: image2DPath, // ✅ 항상 포함됨
        };
      }),
    };

    res.status(200).json({ deck: formattedDeck });
  } catch (err: any) {
    console.error("❌ 덱 불러오기 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 덱 저장
router.post("/single/save", isAuthenticated, async (req, res) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증 실패" });
    }

    const userObjectId = new mongoose.Types.ObjectId(user._id);
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({ message: "잘못된 카드 데이터 형식입니다." });
    }

    const formattedCards = cards.map((c: any) => ({
      card: new mongoose.Types.ObjectId(c.id),
      name: c.name,
      cardType: c.cardType ?? "fire",
      attack: c.attack ?? 0,
      hp: c.hp ?? 0,
      maxhp: c.maxhp ?? c.hp ?? 0,
      cost: c.cost ?? c.tier ?? 1,
      tier: c.tier ?? 1,
      image2D: c.image2D || c.image || "default.png",
    }));

    let deck = await UserDeck.findOne({ user: userObjectId });

    if (!deck) {
      deck = new UserDeck({
        user: userObjectId,
        cards: formattedCards,
      });
    } else {
      deck.cards = formattedCards;
    }

    await deck.save();
    res.status(200).json({ message: "덱 저장 완료", deck });
  } catch (err: any) {
    console.error("❌ 덱 저장 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
