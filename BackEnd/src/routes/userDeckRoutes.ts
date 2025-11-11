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

    /* =====================================================
     ✅ 1) 덱 검증 RULES (cost 기반)
     ===================================================== */

    const deckSize = cards.length;

    if (deckSize < 12) {
      return res.status(400).json({
        message: `덱은 최소 12장이 필요합니다. 현재: ${deckSize}`,
      });
    }

    if (deckSize > 30) {
      return res.status(400).json({
        message: `덱은 최대 30장까지 가능합니다. 현재: ${deckSize}`,
      });
    }

    // ✅ cost 합계 계산
    const totalCost = cards.reduce((sum, c) => sum + Number(c.cost ?? c.tier ?? 1), 0);

    const COST_LIMIT = 105;
    if (totalCost > COST_LIMIT) {
      return res.status(400).json({
        message: `총 코스트 초과: ${totalCost}/${COST_LIMIT}`,
      });
    }

    // ✅ 티어 카운트
    const tierCount: Record<number, number> = {};
    cards.forEach((card: any) => {
      const t = Number(card.tier ?? 1);
      tierCount[t] = (tierCount[t] || 0) + 1;
    });

    const tier1_2 = (tierCount[1] ?? 0) + (tierCount[2] ?? 0);
    const tier6_7 = (tierCount[6] ?? 0) + (tierCount[7] ?? 0);
    const tier8 = tierCount[8] ?? 0;

    // ✅ 티어 규칙
    if (tier8 > 2) {
      return res.status(400).json({
        message: `8티어(전설)는 최대 2장까지 가능합니다. 현재: ${tier8}`,
      });
    }

    if (tier1_2 < 7) {
      return res.status(400).json({
        message: `1~2티어 카드는 최소 7장이 필요합니다. 현재: ${tier1_2}`,
      });
    }

    if (tier6_7 > 3) {
      return res.status(400).json({
        message: `6~7티어 카드는 합쳐서 최대 3장까지 가능합니다. 현재: ${tier6_7}`,
      });
    }

    /* =====================================================
     ✅ 2) 저장용 포맷팅
     ===================================================== */

    const formattedCards = cards.map((c: any) => ({
      card: new mongoose.Types.ObjectId(String(c.id || c.cardId)),
      name: c.name,
      cardType: c.cardType ?? "normal",
      attack: c.attack ?? 0,
      hp: c.hp ?? 0,
      maxhp: c.maxhp ?? c.hp,
      tier: c.tier ?? 1,
      cost: c.cost ?? c.tier ?? 1, // ✅ cost로 저장 (tier fallback)
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

    return res.status(200).json({ message: "덱 저장 완료", deck });
  } catch (err: any) {
    console.error("❌ 덱 저장 실패:", err);
    return res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
