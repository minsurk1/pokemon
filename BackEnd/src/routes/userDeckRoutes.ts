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
        path: "cards",
        model: "Card",
        select: "_id cardName attack hp tier image2D image3D image3DGray",
      })
      .lean();

    if (!deck) {
      return res.status(404).json({ message: "덱이 존재하지 않습니다." });
    }

    // ✅ 프론트용으로 가공 (이미지 경로 보정)
    const BASE_URL = process.env.BASE_URL || "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

    const formattedDeck = {
      _id: deck._id,
      cards: (deck.cards || []).map((card: any) => ({
        id: card._id.toString(),
        name: card.cardName,
        attack: card.attack,
        hp: card.hp,
        tier: card.tier,
        // 🔹 이미지 경로 보정
        image: card.image2D
          ? `${BASE_URL}/images/${card.image2D.split("/").pop()}`
          : card.image3D
          ? `${BASE_URL}/images/${card.image3D.split("/").pop()}`
          : card.image3DGray
          ? `${BASE_URL}/images/${card.image3DGray.split("/").pop()}`
          : `${BASE_URL}/images/default.png`,
      })),
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

    let deck = await UserDeck.findOne({ user: userObjectId });

    if (!deck) {
      deck = new UserDeck({
        user: userObjectId,
        cards: cards.map((c: string) => new mongoose.Types.ObjectId(c)),
      });
    } else {
      deck.cards = cards.map((c: string) => new mongoose.Types.ObjectId(c));
    }

    await deck.save();
    res.status(200).json({ message: "덱 저장 완료", deck });
  } catch (err: any) {
    console.error("❌ 덱 저장 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
