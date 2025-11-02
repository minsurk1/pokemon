// src/routes/userDeckRoutes.ts
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

    const deck = await UserDeck.findOne({ user: userObjectId })
      .populate({
        path: "cards.card",
        model: "Card",
        select: "_id cardName cardType attack hp cost tier image2D",
      })
      .lean();

    if (!deck) {
      return res.status(200).json({ deck: { _id: null, cards: [] } });
    }

    const BASE_URL = process.env.BASE_URL || "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

    // ✅ populate + 직접 저장된 필드 둘 다 읽기
    const formattedDeck = {
      _id: deck._id,
      cards: (deck.cards || []).map((entry: any) => {
        // ✅ populate 여부에 따라 분기
        const c =
          typeof entry.card === "object" && entry.card !== null
            ? entry.card // populate 된 경우
            : entry; // populate 안 됨 → entry 자체 사용

        const imageFile = c.image2D ?? entry.image2D ?? "default.png";

        return {
          id: String(c._id ?? entry._id ?? entry.card ?? entry.id),
          name: c.cardName ?? c.name ?? "Unknown",
          cardType: c.cardType ?? entry.cardType ?? "normal",
          attack: Number(c.attack ?? entry.attack ?? 0),
          hp: Number(c.hp ?? entry.hp ?? 0),
          maxhp: Number(c.hp ?? entry.hp ?? 0),
          cost: Number(c.cost ?? entry.cost ?? c.tier ?? entry.tier ?? 1),
          tier: Number(c.tier ?? entry.tier ?? 1),
          image: `${BASE_URL}/images/${imageFile.split("/").pop()}`,
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
      card: new mongoose.Types.ObjectId(String(c.id || c.cardId)),
      name: c.name,
      cardType: c.cardType ?? "normal",
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
